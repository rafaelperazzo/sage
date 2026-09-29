import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Alocacao, ReservaPontual } from '../../types'

interface DocFake {
  paginas: number
  setFont: ReturnType<typeof vi.fn>
  setFontSize: ReturnType<typeof vi.fn>
  setTextColor: ReturnType<typeof vi.fn>
  text: ReturnType<typeof vi.fn>
  save: ReturnType<typeof vi.fn>
  addPage: () => void
  setPage: ReturnType<typeof vi.fn>
  getNumberOfPages: () => number
  internal: { pageSize: { getWidth: () => number; getHeight: () => number } }
}

// Cada documento (o final e os rascunhos usados para escolher a escala) tem
// seu próprio contador de páginas.
let docs: DocFake[] = []
const autoTableMock = vi.fn()

vi.mock('jspdf', () => ({
  jsPDF: vi.fn().mockImplementation(function () {
    const doc: DocFake = {
      paginas: 1,
      setFont: vi.fn(),
      setFontSize: vi.fn(),
      setTextColor: vi.fn(),
      text: vi.fn(),
      save: vi.fn(),
      addPage: () => { doc.paginas++ },
      setPage: vi.fn(),
      getNumberOfPages: () => doc.paginas,
      internal: { pageSize: { getWidth: () => 297, getHeight: () => 210 } },
    }
    docs.push(doc)
    return doc
  }),
}))
vi.mock('jspdf-autotable', () => ({ default: autoTableMock }))

const { montarLinhasGradePdf, nomeArquivoGradePdf, nomeArquivoGradesPredioPdf, exportarGradePdf, exportarGradesPdf, CABECALHO_PDF } = await import('./exportarGradePdf')

/** Documento salvo (o PDF final) e as chamadas do autotable feitas nele. */
function docFinal(): DocFake {
  return docs.find((d) => d.save.mock.calls.length > 0)!
}
function tabelasDoFinal() {
  return autoTableMock.mock.calls.filter(([doc]) => doc === docFinal()).map(([, opts]) => opts)
}

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
  beforeEach(() => { vi.clearAllMocks(); docs = [] })

  it('monta o documento com título, tabela e salva com o nome da sala', async () => {
    await exportarGradePdf({
      modulo: 'SAGE Map',
      sala: 'SALA 02',
      tipoSala: 'Sala de Aula',
      periodo: '2026.2',
      alocacoes: [makeAlocacao()],
      now: new Date(2026, 8, 29, 10, 30),
    })

    const doc = docFinal()
    expect(doc.text).toHaveBeenCalledWith('SAGE Map - SALA 02', expect.any(Number), expect.any(Number))
    expect(doc.text).toHaveBeenCalledWith(
      expect.stringMatching(/Sala de Aula {2}\| {2}Período 2026\.2 {2}\| {2}Gerado em 29\/09\/2026 10:30/),
      expect.any(Number),
      expect.any(Number)
    )
    const tabelas = tabelasDoFinal()
    expect(tabelas).toHaveLength(1)
    expect(tabelas[0].head).toEqual([CABECALHO_PDF])
    expect(tabelas[0].body).toHaveLength(16)
    expect(tabelas[0].styles.fontSize).toBe(7.5)
    expect(doc.save).toHaveBeenCalledWith('grade-sala-02-2026.2.pdf')
    // Uma página só: sem numeração no rodapé
    expect(doc.paginas).toBe(1)
    expect(doc.text).not.toHaveBeenCalledWith(expect.stringMatching(/^Página/), expect.anything(), expect.anything(), expect.anything())
  })

  it('grade que não cabe em uma página é redesenhada com fonte menor', async () => {
    // Simula o autotable: na fonte 7.5 a tabela transborda para a 2ª página.
    autoTableMock.mockImplementation((doc: DocFake, opts: { styles: { fontSize: number } }) => {
      if (opts.styles.fontSize === 7.5) doc.paginas++
    })

    await exportarGradePdf({ modulo: 'SAGE Rural', sala: 'CEGOE - SALA 20', periodo: '2026.2', alocacoes: [] })

    const tabelas = tabelasDoFinal()
    expect(tabelas).toHaveLength(1)
    expect(tabelas[0].styles.fontSize).toBe(6.5)
    expect(docFinal().paginas).toBe(1)
    autoTableMock.mockReset()
  })
})

describe('exportarGradesPdf (várias salas)', () => {
  beforeEach(() => { vi.clearAllMocks(); docs = [] })

  it('uma página por sala, cada uma com sua grade, numeradas no rodapé', async () => {
    await exportarGradesPdf({
      modulo: 'SAGE Rural',
      periodo: '2026.2',
      nomeArquivo: 'grades-cegoe-2026.2.pdf',
      paginas: [
        { sala: 'CEGOE - SALA 01', alocacoes: [makeAlocacao({ sala: 'CEGOE - SALA 01', disciplina: 'FILOSOFIA' })] },
        { sala: 'CEGOE - SALA 02', alocacoes: [] },
        { sala: 'CEGOE - SALA 03', alocacoes: [], reservas: [{ ...reserva, sala: 'CEGOE - SALA 03' }] },
      ],
    })

    const doc = docFinal()
    const tabelas = tabelasDoFinal()
    expect(doc.paginas).toBe(3)
    expect(tabelas).toHaveLength(3)
    for (const sala of ['CEGOE - SALA 01', 'CEGOE - SALA 02', 'CEGOE - SALA 03']) {
      expect(doc.text).toHaveBeenCalledWith(`SAGE Rural - ${sala}`, expect.any(Number), expect.any(Number))
    }
    // Primeira página traz a alocação da sala 01; a terceira, a reserva
    expect(JSON.stringify(tabelas[0].body)).toContain('FILOSOFIA')
    expect(JSON.stringify(tabelas[1].body)).not.toContain('FILOSOFIA')
    expect(JSON.stringify(tabelas[2].body)).toContain('Reserva 06/01: PALESTRA')
    expect(doc.text).toHaveBeenCalledWith('Página 3 de 3', expect.any(Number), expect.any(Number), { align: 'right' })
    expect(doc.save).toHaveBeenCalledWith('grades-cegoe-2026.2.pdf')
  })

  it('nome do arquivo do prédio', () => {
    expect(nomeArquivoGradesPredioPdf('CEAGRI 1', '2026.2')).toBe('grades-ceagri-1-2026.2.pdf')
  })
})
