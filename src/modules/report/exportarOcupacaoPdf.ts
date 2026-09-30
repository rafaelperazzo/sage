import type { ReportSummary, RoomOccupancy } from './occupancyUtils'
import { TURNOS, DIAS_CALCULO, MAX_HORAS_DIA, MAX_HORAS_SEMANA, MAX_HORAS_TURNO_SEMANA } from './occupancyUtils'
import type { GrupoTabela } from './OcupacaoView'
import { slugArquivo, numerarPaginas } from '../map/exportarGradePdf'

type RGB = [number, number, number]

const MARGEM = 12        // mm
const TOPO = 16          // mm — início do conteúdo nas páginas seguintes
const LARGURA_NOME = 42  // mm — nome da sala no gráfico
const ALTURA_BARRA = 3.2 // mm
const ALTURA_LINHA = 5   // mm — uma sala no gráfico

const COR_TRILHO: RGB = [229, 231, 235]   // gray-200
const COR_TEXTO_SUAVE = 90

const hora = (h: number) => `${h.toFixed(1)}h`

/** "#3B82F6" → [59, 130, 246]; cor inválida vira cinza. */
export function hexParaRgb(hex: string): RGB {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex)
  if (!m) return [107, 114, 128]
  return [parseInt(m[1]!, 16), parseInt(m[2]!, 16), parseInt(m[3]!, 16)]
}

// As fontes padrão do PDF (Helvetica, WinAnsi) não têm o travessão "–" em
// todos os leitores — usamos hífen simples.
function intervaloTurno(t: (typeof TURNOS)[number]): string {
  return `${t.inicio}-${t.fim}`
}

export function montarLinhasResumo(summary: ReportSummary): string[][] {
  return [
    ['Total de salas', String(summary.salas.length)],
    ['Horas alocadas', `${summary.totalGeralHoras.toFixed(0)}h`],
    ['Média de ocupação', `${summary.mediaOcupacao}%`],
    ...TURNOS.map((t) => [`${t.label} (${intervaloTurno(t)})`, `${summary.mediaPorTurno[t.chave]}%`]),
  ]
}

export const CABECALHO_SALAS = ['Sala', 'Horas/semana', ...TURNOS.map((t) => t.label), 'Total']

export function montarLinhasSalas(salas: RoomOccupancy[], nomeTabela: (sala: string) => string = (s) => s): string[][] {
  return salas.map((s) => [
    nomeTabela(s.sala),
    hora(s.totalHoras),
    ...TURNOS.map((t) => `${s.porTurno[t.chave].percentual}%`),
    `${s.percentual}%`,
  ])
}

const DIA_CURTO: Record<string, string> = { SEGUNDA: 'Seg', 'TERÇA': 'Ter', QUARTA: 'Qua', QUINTA: 'Qui', SEXTA: 'Sex' }
export const CABECALHO_POR_DIA = ['Sala', ...DIAS_CALCULO.map((d) => DIA_CURTO[d] ?? d)]

export function montarLinhasPorDia(salas: RoomOccupancy[], nomeTabela: (sala: string) => string = (s) => s): string[][] {
  return salas.map((s) => [
    nomeTabela(s.sala),
    ...DIAS_CALCULO.map((dia) => {
      const horas = s.porDia[dia] ?? 0
      return `${hora(horas)} (${Math.round((horas / MAX_HORAS_DIA) * 100)}%)`
    }),
  ])
}

/** "ocupacao-sage-rural-2026.2.pdf" */
export function nomeArquivoOcupacaoPdf(modulo: string, periodo: string): string {
  return `ocupacao-${slugArquivo(modulo)}-${periodo}.pdf`
}

interface ExportarOcupacaoPdfParams {
  modulo: string          // "SAGE Map" | "SAGE Rural"
  periodo: string
  summary: ReportSummary
  grupos: GrupoTabela[]
  nomeTabela?: (sala: string) => string
  nomeCurto?: (sala: string) => string
  now?: Date
}

/**
 * Gera e baixa o relatório de ocupação (A4 retrato): resumo, gráfico de
 * barras por sala, tabela por sala com os turnos e detalhe por dia. jsPDF e
 * o autotable são carregados sob demanda para não pesar no bundle inicial.
 */
export async function exportarOcupacaoPdf({
  modulo,
  periodo,
  summary,
  grupos,
  nomeTabela = (s) => s,
  nomeCurto = nomeTabela,
  now = new Date(),
}: ExportarOcupacaoPdfParams): Promise<void> {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ])

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const largura = doc.internal.pageSize.getWidth()
  const limite = doc.internal.pageSize.getHeight() - MARGEM
  let y = 0

  function novaPagina() {
    doc.addPage()
    y = TOPO
  }

  /** Garante `altura` mm livres antes de desenhar; senão, vai para a próxima página. */
  function reservar(altura: number) {
    if (y + altura > limite) novaPagina()
  }

  function tituloSecao(texto: string) {
    reservar(14)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(0)
    doc.text(texto, MARGEM, y)
    y += 4
  }

  /** Posição logo abaixo da última tabela do autotable. */
  function fimDaTabela(): number {
    const ultima = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable
    return ultima?.finalY ?? y
  }

  function tabela(head: unknown[][], body: string[][], opcoes: Record<string, unknown> = {}) {
    autoTable(doc, {
      startY: y,
      margin: { left: MARGEM, right: MARGEM, top: TOPO, bottom: MARGEM },
      head: head as never,
      body,
      theme: 'grid',
      styles: { font: 'helvetica', fontSize: 8, cellPadding: 1.5, lineColor: [209, 213, 219], lineWidth: 0.2 },
      headStyles: { fillColor: [243, 244, 246], textColor: [55, 65, 81], fontStyle: 'bold' },
      ...opcoes,
    })
    y = fimDaTabela() + 7
  }

  /** Cabeçalho da tabela de um grupo: título do grupo na cor dele + colunas. */
  function cabecalhoGrupo(grupo: GrupoTabela, colunas: string[]) {
    return [
      [{ content: grupo.titulo, colSpan: colunas.length, styles: { fillColor: hexParaRgb(grupo.corBarra), textColor: [255, 255, 255], halign: 'left' } }],
      colunas.map((c, i) => ({ content: c, styles: { halign: i === 0 ? 'left' : 'center' } })),
    ]
  }

  /** Nome da sala com largura fixa e as demais colunas iguais e centralizadas,
   *  para todas as tabelas de uma seção ficarem alinhadas entre si. */
  function colunasFixas(larguraSala: number, colunas: number) {
    const resto = (largura - 2 * MARGEM - larguraSala) / (colunas - 1)
    return {
      columnStyles: Object.fromEntries([
        [0, { cellWidth: larguraSala }],
        ...Array.from({ length: colunas - 1 }, (_, i) => [i + 1, { cellWidth: resto, halign: 'center' }]),
      ]),
    }
  }

  // ── Cabeçalho ──────────────────────────────────────────────────────────────
  const gerado = `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.text(`SAGE Report - ${modulo}`, MARGEM, 16)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(COR_TEXTO_SUAVE)
  doc.text(`Período ${periodo}  |  Gerado em ${gerado}`, MARGEM, 22)
  const faixas = TURNOS.map(intervaloTurno).join(', ')
  doc.text(
    `Base de cálculo: 100% = ${MAX_HORAS_SEMANA}h/semana (seg-sex, ${MAX_HORAS_DIA}h/dia: ${faixas}); ` +
      `cada turno = ${MAX_HORAS_TURNO_SEMANA}h/semana; cada aula noturna de 50 min conta 1h.`,
    MARGEM,
    27,
    { maxWidth: largura - 2 * MARGEM }
  )
  doc.setTextColor(0)
  y = 38

  // ── Resumo geral ───────────────────────────────────────────────────────────
  tituloSecao('Resumo geral')
  tabela([['Indicador', 'Valor']], montarLinhasResumo(summary), {
    tableWidth: 100,
    columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
  })

  // ── Gráfico de barras (% total por sala) ───────────────────────────────────
  tituloSecao('Ocupação por sala (total)')
  const xBarra = MARGEM + LARGURA_NOME
  const larguraTrilho = largura - 2 * MARGEM - LARGURA_NOME - 12
  y += 2
  for (const grupo of grupos) {
    if (grupo.salas.length === 0) continue
    reservar(6 + ALTURA_LINHA)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(0)
    doc.text(grupo.titulo, MARGEM, y + 3)
    y += 6

    const cor = hexParaRgb(grupo.corBarra)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    for (const sala of grupo.salas) {
      // Grupo que continua na página seguinte repete o título.
      if (y + ALTURA_LINHA > limite) {
        novaPagina()
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9)
        doc.setTextColor(0)
        doc.text(`${grupo.titulo} (continuação)`, MARGEM, y + 3)
        y += 6
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
      }
      const meio = y + ALTURA_BARRA / 2
      doc.setTextColor(55)
      doc.text(nomeCurto(sala.sala), MARGEM, meio + 1, { maxWidth: LARGURA_NOME - 2 })
      doc.setFillColor(...COR_TRILHO)
      doc.rect(xBarra, y, larguraTrilho, ALTURA_BARRA, 'F')
      const pct = Math.min(Math.max(sala.percentual, 0), 100)
      if (pct > 0) {
        doc.setFillColor(...cor)
        doc.rect(xBarra, y, (larguraTrilho * pct) / 100, ALTURA_BARRA, 'F')
      }
      doc.setTextColor(0)
      doc.text(`${sala.percentual}%`, xBarra + larguraTrilho + 2, meio + 1)
      y += ALTURA_LINHA
    }
    y += 3
  }
  y += 4

  // ── Tabela por sala (horas e turnos) ───────────────────────────────────────
  tituloSecao('Ocupação por sala e turno')
  for (const grupo of grupos) {
    if (grupo.salas.length === 0) continue
    reservar(20)
    tabela(cabecalhoGrupo(grupo, CABECALHO_SALAS), montarLinhasSalas(grupo.salas, nomeTabela), colunasFixas(46, CABECALHO_SALAS.length))
  }

  // ── Detalhe por dia ────────────────────────────────────────────────────────
  novaPagina()
  tituloSecao(`Ocupação por dia (100% = ${MAX_HORAS_DIA}h/dia)`)
  for (const grupo of grupos) {
    if (grupo.salas.length === 0) continue
    reservar(20)
    tabela(cabecalhoGrupo(grupo, CABECALHO_POR_DIA), montarLinhasPorDia(grupo.salas, nomeTabela), colunasFixas(41, CABECALHO_POR_DIA.length))
  }

  numerarPaginas(doc, MARGEM)
  doc.save(nomeArquivoOcupacaoPdf(modulo, periodo))
}
