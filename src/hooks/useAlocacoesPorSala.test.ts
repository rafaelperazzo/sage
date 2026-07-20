import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import type { Alocacao, AlocacaoInput } from '../types'

// ── Mocks ─────────────────────────────────────────────────────────────────────

// Mock do canal Supabase Realtime (evita conexão real com WebSocket)
const mockChannel = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn().mockReturnThis(),
}

vi.mock('../lib/supabase', () => ({
  supabase: {
    channel: vi.fn().mockReturnValue(mockChannel),
    removeChannel: vi.fn().mockResolvedValue(undefined),
  },
  TABLE_NAME: 'alocacao_2026.1',
  fetchAlocacoesPorSala: vi.fn(),
  insertAlocacao: vi.fn(),
  updateAlocacao: vi.fn(),
  deleteAlocacao: vi.fn(),
}))

vi.mock('../contexts/PeriodoContext', () => ({
  usePeriodo: () => ({ periodo: '2026.1' }),
}))

// Importações tardias (após os mocks estarem registrados)
const { useAlocacoesPorSala } = await import('./useAlocacoes')
const supabaseMocks = await import('../lib/supabase')
const fetchMock = vi.mocked(supabaseMocks.fetchAlocacoesPorSala)
const insertMock = vi.mocked(supabaseMocks.insertAlocacao)
const updateMock = vi.mocked(supabaseMocks.updateAlocacao)
const deleteMock = vi.mocked(supabaseMocks.deleteAlocacao)

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeAlocacao(overrides: Partial<Alocacao> = {}): Alocacao {
  return {
    id: 1,
    disciplina: 'MATEMÁTICA DISCRETA',
    inicio: '14:00',
    fim: '15:00',
    sala: 'SALA 02',
    dia_semana: 'SEGUNDA',
    professor: null,
    periodo: '2026.1',
    curso: 'DC',
    semestre: 0,
    ...overrides,
  }
}

function makeInput(overrides: Partial<AlocacaoInput> = {}): AlocacaoInput {
  return {
    disciplina: 'NOVA DISCIPLINA',
    inicio: '16:00',
    fim: '17:00',
    sala: 'SALA 02',
    dia_semana: 'TERÇA',
    professor: null,
    ...overrides,
  }
}

// ── Testes ────────────────────────────────────────────────────────────────────

describe('useAlocacoesPorSala — hasConflict', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockChannel.on.mockReturnThis()
    mockChannel.subscribe.mockReturnThis()
  })

  it('sem alocações existentes → hasConflict sempre false', async () => {
    fetchMock.mockResolvedValue([])
    const { result } = renderHook(() => useAlocacoesPorSala('SALA 02'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    const input = makeInput({ sala: 'SALA 02', dia_semana: 'SEGUNDA', inicio: '14:00', fim: '15:00' })
    expect(result.current.hasConflict(input)).toBe(false)
  })

  it('mesmo sala/dia/horário exato → conflito', async () => {
    const existente = makeAlocacao({ inicio: '14:00', fim: '15:00', dia_semana: 'SEGUNDA' })
    fetchMock.mockResolvedValue([existente])
    const { result } = renderHook(() => useAlocacoesPorSala('SALA 02'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    const input = makeInput({ sala: 'SALA 02', dia_semana: 'SEGUNDA', inicio: '14:00', fim: '15:00' })
    expect(result.current.hasConflict(input)).toBe(true)
  })

  it('sobreposição parcial no início → conflito', async () => {
    // Existente: 14:00–15:00 | Nova: 14:30–15:30
    const existente = makeAlocacao({ inicio: '14:00', fim: '15:00', dia_semana: 'SEGUNDA' })
    fetchMock.mockResolvedValue([existente])
    const { result } = renderHook(() => useAlocacoesPorSala('SALA 02'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    const input = makeInput({ sala: 'SALA 02', dia_semana: 'SEGUNDA', inicio: '14:30', fim: '15:30' })
    expect(result.current.hasConflict(input)).toBe(true)
  })

  it('sobreposição parcial no fim → conflito', async () => {
    // Existente: 14:00–15:00 | Nova: 13:30–14:30
    const existente = makeAlocacao({ inicio: '14:00', fim: '15:00', dia_semana: 'SEGUNDA' })
    fetchMock.mockResolvedValue([existente])
    const { result } = renderHook(() => useAlocacoesPorSala('SALA 02'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    const input = makeInput({ sala: 'SALA 02', dia_semana: 'SEGUNDA', inicio: '13:30', fim: '14:30' })
    expect(result.current.hasConflict(input)).toBe(true)
  })

  it('horários adjacentes (fim == início) → sem conflito', async () => {
    // Existente: 14:00–15:00 | Nova: 15:00–16:00
    const existente = makeAlocacao({ inicio: '14:00', fim: '15:00', dia_semana: 'SEGUNDA' })
    fetchMock.mockResolvedValue([existente])
    const { result } = renderHook(() => useAlocacoesPorSala('SALA 02'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    const input = makeInput({ sala: 'SALA 02', dia_semana: 'SEGUNDA', inicio: '15:00', fim: '16:00' })
    expect(result.current.hasConflict(input)).toBe(false)
  })

  it('mesma sala/horário mas dia diferente → sem conflito', async () => {
    const existente = makeAlocacao({ inicio: '14:00', fim: '15:00', dia_semana: 'SEGUNDA' })
    fetchMock.mockResolvedValue([existente])
    const { result } = renderHook(() => useAlocacoesPorSala('SALA 02'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    const input = makeInput({ sala: 'SALA 02', dia_semana: 'TERÇA', inicio: '14:00', fim: '15:00' })
    expect(result.current.hasConflict(input)).toBe(false)
  })

  it('mesmo dia/horário mas sala diferente → sem conflito', async () => {
    const existente = makeAlocacao({ sala: 'SALA 02', inicio: '14:00', fim: '15:00', dia_semana: 'SEGUNDA' })
    fetchMock.mockResolvedValue([existente])
    const { result } = renderHook(() => useAlocacoesPorSala('SALA 02'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    const input = makeInput({ sala: 'LAB 35', dia_semana: 'SEGUNDA', inicio: '14:00', fim: '15:00' })
    expect(result.current.hasConflict(input)).toBe(false)
  })

  it('excludeId ignora a própria alocação (update sem auto-conflito)', async () => {
    const existente = makeAlocacao({ id: 42, inicio: '14:00', fim: '15:00', dia_semana: 'SEGUNDA' })
    fetchMock.mockResolvedValue([existente])
    const { result } = renderHook(() => useAlocacoesPorSala('SALA 02'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    // Mesmos dados, mas excluindo o próprio id → não deve conflitar
    const input = makeInput({ sala: 'SALA 02', dia_semana: 'SEGUNDA', inicio: '14:00', fim: '15:00' })
    expect(result.current.hasConflict(input, 42)).toBe(false)
  })

  it('sem excludeId, alocação com mesmo id conflita normalmente', async () => {
    const existente = makeAlocacao({ id: 42, inicio: '14:00', fim: '15:00', dia_semana: 'SEGUNDA' })
    fetchMock.mockResolvedValue([existente])
    const { result } = renderHook(() => useAlocacoesPorSala('SALA 02'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    const input = makeInput({ sala: 'SALA 02', dia_semana: 'SEGUNDA', inicio: '14:00', fim: '15:00' })
    expect(result.current.hasConflict(input)).toBe(true)
  })
})

describe('useAlocacoesPorSala — create', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockChannel.on.mockReturnThis()
    mockChannel.subscribe.mockReturnThis()
  })

  it('sem conflito → chama insertAlocacao e recarrega', async () => {
    fetchMock.mockResolvedValue([])
    insertMock.mockResolvedValue(makeAlocacao({ id: 99 }))

    const { result } = renderHook(() => useAlocacoesPorSala('SALA 02'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    const input = makeInput({ sala: 'SALA 02', dia_semana: 'SEGUNDA', inicio: '08:00', fim: '09:00' })
    await act(async () => { await result.current.create(input) })

    expect(insertMock).toHaveBeenCalledOnce()
    expect(insertMock).toHaveBeenCalledWith(input, '2026.1')
    // fetchMock chamado 2x: mount + após insert
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('com conflito → lança erro e não chama insertAlocacao', async () => {
    const existente = makeAlocacao({ inicio: '14:00', fim: '15:00', dia_semana: 'SEGUNDA' })
    fetchMock.mockResolvedValue([existente])

    const { result } = renderHook(() => useAlocacoesPorSala('SALA 02'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    const input = makeInput({ sala: 'SALA 02', dia_semana: 'SEGUNDA', inicio: '14:00', fim: '15:00' })
    await expect(result.current.create(input)).rejects.toThrow('Conflito de horário')
    expect(insertMock).not.toHaveBeenCalled()
  })
})

describe('useAlocacoesPorSala — update', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockChannel.on.mockReturnThis()
    mockChannel.subscribe.mockReturnThis()
  })

  it('sem conflito → chama updateAlocacao e recarrega', async () => {
    const existente = makeAlocacao({ id: 1, inicio: '14:00', fim: '15:00', dia_semana: 'SEGUNDA' })
    fetchMock.mockResolvedValue([existente])
    updateMock.mockResolvedValue(makeAlocacao({ id: 1, inicio: '16:00', fim: '17:00' }))

    const { result } = renderHook(() => useAlocacoesPorSala('SALA 02'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    // Atualizar com horário diferente (não conflita com excludeId=1)
    const input = makeInput({ sala: 'SALA 02', dia_semana: 'SEGUNDA', inicio: '16:00', fim: '17:00' })
    await act(async () => { await result.current.update(1, input) })

    expect(updateMock).toHaveBeenCalledOnce()
    expect(updateMock).toHaveBeenCalledWith(1, input)
  })

  it('com conflito em outro slot → lança erro', async () => {
    const aloc1 = makeAlocacao({ id: 1, inicio: '14:00', fim: '15:00', dia_semana: 'SEGUNDA' })
    const aloc2 = makeAlocacao({ id: 2, inicio: '16:00', fim: '17:00', dia_semana: 'SEGUNDA' })
    fetchMock.mockResolvedValue([aloc1, aloc2])

    const { result } = renderHook(() => useAlocacoesPorSala('SALA 02'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    // Tentar mover aloc1 para o horário de aloc2
    const input = makeInput({ sala: 'SALA 02', dia_semana: 'SEGUNDA', inicio: '16:00', fim: '17:00' })
    await expect(result.current.update(1, input)).rejects.toThrow('Conflito de horário')
    expect(updateMock).not.toHaveBeenCalled()
  })
})

describe('useAlocacoesPorSala — remove', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockChannel.on.mockReturnThis()
    mockChannel.subscribe.mockReturnThis()
  })

  it('chama deleteAlocacao com o id correto e recarrega', async () => {
    fetchMock.mockResolvedValue([makeAlocacao({ id: 5 })])
    deleteMock.mockResolvedValue(undefined)

    const { result } = renderHook(() => useAlocacoesPorSala('SALA 02'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => { await result.current.remove(5) })

    expect(deleteMock).toHaveBeenCalledOnce()
    expect(deleteMock).toHaveBeenCalledWith(5)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})

describe('useAlocacoesPorSala — carregamento', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockChannel.on.mockReturnThis()
    mockChannel.subscribe.mockReturnThis()
  })

  it('expõe alocações carregadas do Supabase', async () => {
    const dados = [
      makeAlocacao({ id: 1, disciplina: 'FÍSICA I' }),
      makeAlocacao({ id: 2, disciplina: 'QUÍMICA I', dia_semana: 'TERÇA' }),
    ]
    fetchMock.mockResolvedValue(dados)

    const { result } = renderHook(() => useAlocacoesPorSala('SALA 02'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.alocacoes).toHaveLength(2)
    expect(result.current.error).toBeNull()
  })

  it('erro no fetch → expõe mensagem de erro', async () => {
    fetchMock.mockRejectedValue(new Error('Erro de conexão'))

    const { result } = renderHook(() => useAlocacoesPorSala('SALA 02'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBe('Erro de conexão')
    expect(result.current.alocacoes).toHaveLength(0)
  })
})
