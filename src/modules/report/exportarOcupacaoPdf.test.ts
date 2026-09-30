import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Alocacao } from '../../types'
import type { GrupoTabela } from './OcupacaoView'
import { calcularOcupacao } from './occupancyUtils'

interface DocFake {
  paginas: number
  setFont: ReturnType<typeof vi.fn>
  setFontSize: ReturnType<typeof vi.fn>
  setTextColor: ReturnType<typeof vi.fn>
  setFillColor: ReturnType<typeof vi.fn>
  rect: ReturnType<typeof vi.fn>
  text: ReturnType<typeof vi.fn>
  save: ReturnType<typeof vi.fn>
  addPage: ReturnType<typeof vi.fn>
  setPage: ReturnType<typeof vi.fn>
  getNumberOfPages: () => number
  internal: { pageSize: { getWidth: () => number; getHeight: () => number } }
}

let docs: DocFake[] = []
const autoTableMock = vi.fn()

vi.mock('jspdf', () => ({
  jsPDF: vi.fn().mockImplementation(function () {
    const doc: DocFake = {
      paginas: 1,
      setFont: vi.fn(),
      setFontSize: vi.fn(),
      setTextColor: vi.fn(),
      setFillColor: vi.fn(),
      rect: vi.fn(),
      text: vi.fn(),
      save: vi.fn(),
      addPage: vi.fn(() => { doc.paginas++ }),
      setPage: vi.fn(),
      getNumberOfPages: () => doc.paginas,
      internal: { pageSize: { getWidth: () => 210, getHeight: () => 297 } },
    }
    docs.push(doc)
    return doc
  }),
}))
vi.mock('jspdf-autotable', () => ({ default: autoTableMock }))

const {
  montarLinhasResumo,
  montarLinhasSalas,
  montarLinhasPorDia,
  nomeArquivoOcupacaoPdf,
  hexParaRgb,
  exportarOcupacaoPdf,
  CABECALHO_SALAS,
  CABECALHO_POR_DIA,
} = await import('./exportarOcupacaoPdf')

function makeAlocacao(overrides: Partial<Alocacao> = {}): Alocacao {
  return {
    id: 1,
    disciplina: 'CÁLCULO I',
    inicio: '08:00',
    fim: '12:00',
    sala: 'CEAGRI - SALA 01',
    dia_semana: 'SEGUNDA',
    professor: null,
    periodo: '2026.2',
    curso: 'DC',
    semestre: 0,
    ...overrides,
  }
}

const semPredio = (s: string) => s.replace(/^.* - /, '')

// Sala 01: seg 08–12 (manhã 4h) + ter 18:30–21:50 (noite 4h) = 8h de 60h
const SALAS = [
  { nome: 'CEAGRI - SALA 01', predio: 'CEAGRI' },
  { nome: 'CEAGRI - SALA 02', predio: 'CEAGRI' },
  { nome: 'PREDIO B - SALA 10', predio: 'PREDIO B' },
]
const summary = calcularOcupacao(
  [makeAlocacao(), makeAlocacao({ id: 2, dia_semana: 'TERÇA', inicio: '18:30', fim: '21:50' })],
  SALAS
)

function grupos(s = summary): GrupoTabela[] {
  return ['CEAGRI', 'PREDIO B'].map((predio) => ({
    chave: predio,
    titulo: predio,
    corCabecalho: '',
    corBarra: '#F59E0B',
    salas: s.salas.filter((x) => x.predio === predio),
  }))
}

beforeEach(() => {
  docs = []
  autoTableMock.mockClear()
})

describe('linhas do relatório', () => {
  it('resumo: totais, média geral e média de cada turno', () => {
    expect(montarLinhasResumo(summary)).toEqual([
      ['Total de salas', '3'],
      ['Horas alocadas', '8h'],
      ['Média de ocupação', '4%'],     // (13% + 0 + 0) / 3
      ['Manhã (08:00-12:00)', '7%'],   // (20% + 0 + 0) / 3
      ['Tarde (14:00-18:00)', '0%'],
      ['Noite (18:30-21:50)', '7%'],
    ])
  })

  it('salas: horas, % de cada turno e total, com o nome curto', () => {
    expect(CABECALHO_SALAS).toEqual(['Sala', 'Horas/semana', 'Manhã', 'Tarde', 'Noite', 'Total'])
    expect(montarLinhasSalas(summary.salas.slice(0, 1), semPredio)).toEqual([
      ['SALA 01', '8.0h', '20%', '0%', '20%', '13%'],
    ])
  })

  it('por dia: horas e % do dia (12h = 100%)', () => {
    expect(CABECALHO_POR_DIA).toEqual(['Sala', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex'])
    expect(montarLinhasPorDia(summary.salas.slice(0, 1))).toEqual([
      ['CEAGRI - SALA 01', '4.0h (33%)', '4.0h (33%)', '0.0h (0%)', '0.0h (0%)', '0.0h (0%)'],
    ])
  })

  it('nome do arquivo por módulo e período', () => {
    expect(nomeArquivoOcupacaoPdf('SAGE Map', '2026.2')).toBe('ocupacao-sage-map-2026.2.pdf')
    expect(nomeArquivoOcupacaoPdf('SAGE Rural', '2026.2')).toBe('ocupacao-sage-rural-2026.2.pdf')
  })

  it('converte a cor hex dos grupos para RGB', () => {
    expect(hexParaRgb('#3B82F6')).toEqual([59, 130, 246])
    expect(hexParaRgb('inválida')).toEqual([107, 114, 128])
  })
})

describe('exportarOcupacaoPdf', () => {
  async function exportar(g = grupos()) {
    await exportarOcupacaoPdf({
      modulo: 'SAGE Rural',
      periodo: '2026.2',
      summary,
      grupos: g,
      nomeTabela: semPredio,
      now: new Date(2026, 8, 30, 10, 0),
    })
    return docs[0]!
  }

  it('gera um A4 retrato e salva com o nome do módulo e período', async () => {
    const doc = await exportar()
    const { jsPDF } = await import('jspdf')
    expect(jsPDF).toHaveBeenCalledWith({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    expect(doc.save).toHaveBeenCalledWith('ocupacao-sage-rural-2026.2.pdf')
    expect(doc.text).toHaveBeenCalledWith('SAGE Report - SAGE Rural', expect.any(Number), expect.any(Number))
  })

  it('resumo + uma tabela por grupo para salas/turnos e outra por dia', async () => {
    await exportar()
    // 1 resumo + 2 grupos (turnos) + 2 grupos (por dia)
    expect(autoTableMock).toHaveBeenCalledTimes(5)
    const [, resumo] = autoTableMock.mock.calls[0]!
    expect(resumo.body).toEqual(montarLinhasResumo(summary))

    const [, turnosCeagri] = autoTableMock.mock.calls[1]!
    expect(turnosCeagri.head[0][0]).toMatchObject({ content: 'CEAGRI', colSpan: 6 })
    expect(turnosCeagri.head[1].map((c: { content: string }) => c.content)).toEqual(CABECALHO_SALAS)
    expect(turnosCeagri.body.map((l: string[]) => l[0])).toEqual(['SALA 01', 'SALA 02'])

    const [, diaPredioB] = autoTableMock.mock.calls[4]!
    expect(diaPredioB.head[1].map((c: { content: string }) => c.content)).toEqual(CABECALHO_POR_DIA)
    expect(diaPredioB.body.map((l: string[]) => l[0])).toEqual(['SALA 10'])
  })

  it('gráfico: trilho para cada sala e barra só para as que têm ocupação', async () => {
    const doc = await exportar()
    // 3 trilhos + 1 barra (só a SALA 01 tem ocupação)
    expect(doc.rect).toHaveBeenCalledTimes(4)
    expect(doc.text).toHaveBeenCalledWith('13%', expect.any(Number), expect.any(Number))
  })

  it('gráfico com muitas salas continua em nova página', async () => {
    const muitas = Array.from({ length: 70 }, (_, i) => ({ nome: `P - SALA ${i}`, predio: 'P' }))
    const s = calcularOcupacao([], muitas)
    const g: GrupoTabela[] = [{ chave: 'P', titulo: 'P', corCabecalho: '', corBarra: '#F59E0B', salas: s.salas }]
    await exportarOcupacaoPdf({ modulo: 'SAGE Rural', periodo: '2026.2', summary: s, grupos: g })
    // Gráfico quebra ao menos uma vez + página própria do detalhe por dia
    expect(docs[0]!.addPage.mock.calls.length).toBeGreaterThanOrEqual(2)
    expect(docs[0]!.text).toHaveBeenCalledWith('P (continuação)', expect.any(Number), expect.any(Number))
  })
})
