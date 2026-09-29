import type { Alocacao, ReservaPontual } from '../../types'
import { DIAS, HORAS, LIMITES } from '../../constants/salas'
import { buildGridMatrix, markFreeSlots, formatFreeRange } from './gridUtils'
import { reservasNoBloco, formatarDataCurta } from './reservasPontuaisUtils'

type RGB = [number, number, number]

export interface CelulaPdf {
  content: string
  rowSpan?: number
  styles?: { fillColor?: RGB; textColor?: RGB; fontStyle?: 'normal' | 'bold' }
}

// Mesma paleta da grade na tela (Tailwind): alocação azul, livre ciano,
// reserva pontual âmbar.
const COR_ALOCACAO: RGB = [239, 246, 255]   // blue-50
const COR_LIVRE: RGB = [236, 254, 255]      // cyan-50
const COR_RESERVA: RGB = [254, 243, 199]    // amber-100
const COR_HORA: RGB = [249, 250, 251]       // gray-50

const DIAS_GRADE = DIAS.filter((dia) => dia !== 'SÁBADO')

export const CABECALHO_PDF = ['Hora', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex']

const LARGURA_HORA = 14 // mm
const MARGEM = 10       // mm

// Escalas tentadas em ordem até a grade caber em uma página A4: salas muito
// cheias (aulas de 1h com nomes longos) usam fonte e espaçamento menores.
const ESCALAS = [
  { fontSize: 7.5, cellPadding: 1.5, minCellHeight: 8 },
  { fontSize: 6.5, cellPadding: 1.2, minCellHeight: 6 },
  { fontSize: 5.5, cellPadding: 1, minCellHeight: 4.5 },
  { fontSize: 5, cellPadding: 0.8, minCellHeight: 3.5 },
] as const

type Escala = (typeof ESCALAS)[number]

// As fontes padrão do PDF (Helvetica, WinAnsi) não têm o travessão "–" em
// todos os leitores — usamos hífen simples.
function textoReservas(reservas: ReservaPontual[]): string {
  return reservas
    .map((r) => `Reserva ${formatarDataCurta(r.data)}: ${r.disciplina} (${r.inicio}-${r.fim})`)
    .join('\n')
}

/**
 * Converte a grade semanal (mesma matriz usada na tela) em linhas para o
 * jspdf-autotable. Células cobertas por um rowSpan anterior são omitidas,
 * como o autotable espera.
 */
export function montarLinhasGradePdf(
  alocacoes: Alocacao[],
  reservas: ReservaPontual[] = []
): CelulaPdf[][] {
  const matrix = markFreeSlots(buildGridMatrix(alocacoes))

  return HORAS.map((hora) => {
    const linha: CelulaPdf[] = [{ content: hora, styles: { fillColor: COR_HORA, textColor: [107, 114, 128] } }]

    for (const dia of DIAS_GRADE) {
      const cell = matrix[hora]?.[dia]
      if (!cell || cell.type === 'skip') continue

      if (cell.type === 'allocation') {
        const a = cell.alocacao
        const partes = [a.disciplina, a.professor, `${a.inicio}-${a.fim}`].filter(Boolean)
        linha.push({ content: partes.join('\n'), rowSpan: cell.rowSpan, styles: { fillColor: COR_ALOCACAO } })
        continue
      }

      const rowSpan = cell.type === 'free' ? cell.rowSpan : 1
      const fim = LIMITES[LIMITES.indexOf(hora) + rowSpan] ?? hora
      const doBloco = reservasNoBloco(reservas, dia, hora, fim)

      if (cell.type === 'free') {
        const texto = [`LIVRE ${formatFreeRange(cell.hora, cell.rowSpan)}`, textoReservas(doBloco)].filter(Boolean).join('\n')
        linha.push({
          content: texto,
          rowSpan,
          styles: { fillColor: doBloco.length > 0 ? COR_RESERVA : COR_LIVRE },
        })
        continue
      }

      // Célula vazia (horários desconsiderados, ex: almoço)
      linha.push(
        doBloco.length > 0
          ? { content: textoReservas(doBloco), styles: { fillColor: COR_RESERVA } }
          : { content: '' }
      )
    }

    return linha
  })
}

function slugArquivo(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Nome de arquivo seguro: "grade-cegoe-sala-01-2026.2.pdf". */
export function nomeArquivoGradePdf(sala: string, periodo: string): string {
  return `grade-${slugArquivo(sala)}-${periodo}.pdf`
}

/** Nome do PDF com todas as salas de um prédio: "grades-cegoe-2026.2.pdf". */
export function nomeArquivoGradesPredioPdf(predio: string, periodo: string): string {
  return `grades-${slugArquivo(predio)}-${periodo}.pdf`
}

/** Uma sala = uma página do PDF. */
export interface PaginaGrade {
  sala: string
  tipoSala?: string       // ex: "Laboratório" (apenas no SAGE Map)
  alocacoes: Alocacao[]
  reservas?: ReservaPontual[]
}

interface ExportarGradesPdfParams {
  modulo: string          // "SAGE Map" | "SAGE Rural"
  periodo: string
  paginas: PaginaGrade[]
  nomeArquivo: string
  now?: Date
}

/**
 * Gera e baixa um PDF (A4 paisagem) com a grade semanal de cada sala em uma
 * página. jsPDF e o autotable são carregados sob demanda para não pesar no
 * bundle inicial.
 */
export async function exportarGradesPdf({
  modulo,
  periodo,
  paginas,
  nomeArquivo,
  now = new Date(),
}: ExportarGradesPdfParams): Promise<void> {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ])

  type Doc = InstanceType<typeof jsPDF>
  const novoDoc = (): Doc => new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  function desenharTabela(doc: Doc, body: CelulaPdf[][], escala: Escala) {
    const larguraDia = (doc.internal.pageSize.getWidth() - 2 * MARGEM - LARGURA_HORA) / 5
    autoTable(doc, {
      startY: 23,
      margin: { left: MARGEM, right: MARGEM, bottom: MARGEM },
      head: [CABECALHO_PDF],
      body,
      theme: 'grid',
      rowPageBreak: 'avoid',
      styles: { font: 'helvetica', ...escala, valign: 'top', lineColor: [209, 213, 219], lineWidth: 0.2, overflow: 'linebreak' },
      headStyles: { fillColor: [243, 244, 246], textColor: [55, 65, 81], fontStyle: 'bold', halign: 'center', minCellHeight: 0 },
      // Coluna da hora estreita; os 5 dias dividem igualmente o restante.
      columnStyles: {
        0: { cellWidth: LARGURA_HORA, halign: 'center' },
        ...Object.fromEntries([1, 2, 3, 4, 5].map((i) => [i, { cellWidth: larguraDia }])),
      },
    })
  }

  // Maior escala cuja tabela cabe em uma página, testada num documento de
  // rascunho (o autotable não tem "ajustar à página"). Se nenhuma couber,
  // usa a menor.
  function escolherEscala(body: CelulaPdf[][]): Escala {
    for (const escala of ESCALAS) {
      const rascunho = novoDoc()
      desenharTabela(rascunho, body, escala)
      if (rascunho.getNumberOfPages() === 1) return escala
    }
    return ESCALAS[ESCALAS.length - 1]!
  }

  const doc = novoDoc()
  const gerado = `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`

  paginas.forEach((pagina, idx) => {
    if (idx > 0) doc.addPage()

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text(`${modulo} - ${pagina.sala}`, MARGEM, 14)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(90)
    const subtitulo = [pagina.tipoSala, `Período ${periodo}`, `Gerado em ${gerado}`].filter(Boolean).join('  |  ')
    doc.text(subtitulo, MARGEM, 19)
    doc.setTextColor(0)

    const body = montarLinhasGradePdf(pagina.alocacoes, pagina.reservas ?? [])
    desenharTabela(doc, body, escolherEscala(body))
  })

  // Numeração no rodapé quando o arquivo tem mais de uma página.
  const total = doc.getNumberOfPages()
  if (total > 1) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(120)
    for (let i = 1; i <= total; i++) {
      doc.setPage(i)
      doc.text(`Página ${i} de ${total}`, doc.internal.pageSize.getWidth() - MARGEM, doc.internal.pageSize.getHeight() - 5, { align: 'right' })
    }
  }

  doc.save(nomeArquivo)
}

interface ExportarGradePdfParams extends PaginaGrade {
  modulo: string
  periodo: string
  now?: Date
}

/** PDF de uma única sala (botão "Exportar PDF" do cabeçalho da sala). */
export async function exportarGradePdf({ modulo, periodo, now, ...pagina }: ExportarGradePdfParams): Promise<void> {
  await exportarGradesPdf({
    modulo,
    periodo,
    now,
    paginas: [pagina],
    nomeArquivo: nomeArquivoGradePdf(pagina.sala, periodo),
  })
}
