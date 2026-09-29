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

/** Nome de arquivo seguro: "grade-cegoe-sala-01-2026.2.pdf". */
export function nomeArquivoGradePdf(sala: string, periodo: string): string {
  const slug = sala
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `grade-${slug}-${periodo}.pdf`
}

interface ExportarGradePdfParams {
  modulo: string          // "SAGE Map" | "SAGE Rural"
  sala: string
  tipoSala?: string       // ex: "Laboratório" (apenas no SAGE Map)
  periodo: string
  alocacoes: Alocacao[]
  reservas?: ReservaPontual[]
  now?: Date
}

/**
 * Gera e baixa o PDF (A4 paisagem) da grade semanal da sala. jsPDF e o
 * autotable são carregados sob demanda para não pesar no bundle inicial.
 */
export async function exportarGradePdf({
  modulo,
  sala,
  tipoSala,
  periodo,
  alocacoes,
  reservas = [],
  now = new Date(),
}: ExportarGradePdfParams): Promise<void> {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ])

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const margem = 10

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text(`${modulo} - ${sala}`, margem, 14)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(90)
  const gerado = `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
  const subtitulo = [tipoSala, `Período ${periodo}`, `Gerado em ${gerado}`].filter(Boolean).join('  |  ')
  doc.text(subtitulo, margem, 19)
  doc.setTextColor(0)

  autoTable(doc, {
    startY: 23,
    margin: { left: margem, right: margem, bottom: margem },
    head: [CABECALHO_PDF],
    body: montarLinhasGradePdf(alocacoes, reservas),
    theme: 'grid',
    rowPageBreak: 'avoid',
    styles: { font: 'helvetica', fontSize: 7.5, cellPadding: 1.5, minCellHeight: 8, valign: 'top', lineColor: [209, 213, 219], lineWidth: 0.2, overflow: 'linebreak' },
    headStyles: { fillColor: [243, 244, 246], textColor: [55, 65, 81], fontStyle: 'bold', halign: 'center', minCellHeight: 0 },
    // Coluna da hora estreita; os 5 dias dividem igualmente o restante.
    columnStyles: {
      0: { cellWidth: LARGURA_HORA, halign: 'center' },
      ...Object.fromEntries(
        [1, 2, 3, 4, 5].map((i) => [i, { cellWidth: (doc.internal.pageSize.getWidth() - 2 * margem - LARGURA_HORA) / 5 }])
      ),
    },
  })

  doc.save(nomeArquivoGradePdf(sala, periodo))
}
