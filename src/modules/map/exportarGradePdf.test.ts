import { describe, it, expect, vi } from 'vitest'
import type { Alocacao, ReservaPontual } from '../../types'

const saveMock = vi.fn()
const textMock = vi.fn()
const autoTableMock = vi.fn()

vi.mock('jspdf', () => ({
  jsPDF: vi.fn().mockImplementation(function () {
    return {
      setFont: vi.fn(),
      setFontSize: vi.fn(),
      setTextColor: vi.fn(),
      text: textMock,
      save: saveMock,
      internal: { pageSize: { getWidth: () => 297 } },
    }
  }),
}))
vi.mock('jspdf-autotable', () => ({ default: autoTableMock }))

const { montarLinhasGradePdf, nomeArquivoGradePdf, exportarGradePdf, CABECALHO_PDF } = await import('./exportarGradePdf')

function makeAlocacao(overrides: Partial<Alocacao> = {}): Alocacao {
  return {
    id: 1,
    disciplina: 'CÁLCULO I',
    inicio: '08:00',
    fim: '10:00',
    sala: 'SALA 02',
    dia_semana: 'SEGUNDA',
    professor: 'Prof. Silva',
    periodo: '2026.2',
    curso: 'DC',
    semestre: 0,
    ...overrides,
  }
}

const reserva: ReservaPontual = {
  id: 1, disciplina: 'PALESTRA', professor: null, data: '2099-01-06', // terça
  inicio: '14:00', fim: '16:00', sala: 'SALA 02', modulo: 'map',
}

describe('montarLinhasGradePdf', () => {
  it('uma linha por horário da grade, começando pela hora', () => {
    const linhas = montarLinhasGradePdf([])
    expect(linhas).toHaveLength(16)
    expect(linhas[0]![0]!.content).toBe('07:00')
    expect(linhas[15]![0]!.content).toBe('21:00')
  })

  it('alocação vira célula com rowSpan e as linhas cobertas omitem a coluna', () => {
    const linhas = montarLinhasGradePdf([makeAlocacao()])
    const linha08 = linhas[1]!
    expect(linha08[1]).toMatchObject({ content: 'CÁLCULO I\nProf. Silva\n08:00-10:00', rowSpan: 2 })
    // 09:00: segunda coberta pela alocação 08–10 e os demais dias pelos
    // blocos livres 08–10 → só a coluna da hora
    expect(linhas[2]).toHaveLength(1)
    // 10:00: todos os dias começam um novo bloco
    expect(linhas[3]).toHaveLength(1 + 5)
  })

  it('bloco livre mostra LIVRE com o intervalo', () => {
    const linhas = montarLinhasGradePdf([])
    expect(linhas[1]![1]).toMatchObject({ content: 'LIVRE 08:00-10:00', rowSpan: 2 })
  })

  it('reserva pontual aparece no bloco livre do dia da semana dela', () => {
    const linhas = montarLinhasGradePdf([], [reserva])
    const linha14 = linhas.find((l) => l[0]!.content === '14:00')!
    expect(linha14[2]!.content).toBe('LIVRE 14:00-16:00\nReserva 06/01: PALESTRA (14:00-16:00)')
    expect(linha14[1]!.content).toBe('LIVRE 14:00-16:00') // segunda sem reserva
  })

  it('cabeçalho só tem dias úteis', () => {
    expect(CABECALHO_PDF).toEqual(['Hora', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex'])
  })
})

describe('nomeArquivoGradePdf', () => {
  it('gera nome sem acentos nem espaços', () => {
    expect(nomeArquivoGradePdf('CEGOE - SALA 01', '2026.2')).toBe('grade-cegoe-sala-01-2026.2.pdf')
    expect(nomeArquivoGradePdf('LAB CEAGRI I - 10', '2026.2')).toBe('grade-lab-ceagri-i-10-2026.2.pdf')
    expect(nomeArquivoGradePdf('AUDITÓRIO', '2026.1')).toBe('grade-auditorio-2026.1.pdf')
  })
})

describe('exportarGradePdf', () => {
  it('monta o documento com título, tabela e salva com o nome da sala', async () => {
    await exportarGradePdf({
      modulo: 'SAGE Map',
      sala: 'SALA 02',
      tipoSala: 'Sala de Aula',
      periodo: '2026.2',
      alocacoes: [makeAlocacao()],
      now: new Date(2026, 8, 29, 10, 30),
    })

    expect(textMock).toHaveBeenCalledWith('SAGE Map - SALA 02', expect.any(Number), expect.any(Number))
    expect(textMock).toHaveBeenCalledWith(
      expect.stringMatching(/Sala de Aula {2}\| {2}Período 2026\.2 {2}\| {2}Gerado em 29\/09\/2026 10:30/),
      expect.any(Number),
      expect.any(Number)
    )
    expect(autoTableMock).toHaveBeenCalledOnce()
    const opts = autoTableMock.mock.calls[0]![1]
    expect(opts.head).toEqual([CABECALHO_PDF])
    expect(opts.body).toHaveLength(16)
    expect(saveMock).toHaveBeenCalledWith('grade-sala-02-2026.2.pdf')
  })
})
