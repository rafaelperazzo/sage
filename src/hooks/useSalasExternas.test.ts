import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockChannel = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn().mockReturnThis(),
}

vi.mock('../lib/supabase', () => ({
  supabase: {
    channel: vi.fn().mockReturnValue(mockChannel),
    removeChannel: vi.fn().mockResolvedValue(undefined),
  },
  EXTERNAS_TABLE_NAME: 'externas',
  SALAS_EXTERNAS_TABLE: 'salas_externas',
  fetchSalasExternas: vi.fn(),
  insertSalaExterna: vi.fn(),
  updateSalaExterna: vi.fn(),
  deleteSalaExterna: vi.fn(),
  usosSalaExterna: vi.fn(),
}))

const { useSalasExternas } = await import('./useSalasExternas')
const supabaseMocks = await import('../lib/supabase')
const fetchMock = vi.mocked(supabaseMocks.fetchSalasExternas)
const updateMock = vi.mocked(supabaseMocks.updateSalaExterna)
const deleteMock = vi.mocked(supabaseMocks.deleteSalaExterna)
const usosMock = vi.mocked(supabaseMocks.usosSalaExterna)

const cadastrada = { id: 7, sala: 'DEFIS - SALA 02' }

async function renderCarregado() {
  const hook = renderHook(() => useSalasExternas())
  await waitFor(() => expect(hook.result.current.loading).toBe(false))
  return hook
}

// ── Testes ────────────────────────────────────────────────────────────────────

describe('useSalasExternas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fetchMock.mockResolvedValue({ salas: ['DEFIS - SALA 01', 'DEFIS - SALA 02'], cadastradas: [cadastrada] })
    usosMock.mockResolvedValue([])
  })

  it('expõe a lista unida e as salas cadastradas', async () => {
    const { result } = await renderCarregado()
    expect(result.current.salas).toEqual(['DEFIS - SALA 01', 'DEFIS - SALA 02'])
    expect(result.current.cadastradas).toEqual([cadastrada])
  })

  it('renomeia sala cadastrada sem uso e recarrega a lista', async () => {
    const { result } = await renderCarregado()
    await act(() => result.current.editar(cadastrada, 'DEFIS - SALA 03'))
    expect(usosMock).toHaveBeenCalledWith('DEFIS - SALA 02')
    expect(updateMock).toHaveBeenCalledWith(7, 'DEFIS - SALA 03')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('remove sala cadastrada sem uso', async () => {
    const { result } = await renderCarregado()
    await act(() => result.current.remover(cadastrada))
    expect(deleteMock).toHaveBeenCalledWith(7)
  })

  it('bloqueia renomear sala em uso, listando os usos', async () => {
    usosMock.mockResolvedValue(['alocações', 'reservas pontuais'])
    const { result } = await renderCarregado()
    await expect(result.current.editar(cadastrada, 'DEFIS - SALA 03')).rejects.toThrow(
      'A sala DEFIS - SALA 02 está em uso (alocações e reservas pontuais) e não pode ser renomeada.'
    )
    expect(updateMock).not.toHaveBeenCalled()
  })

  it('bloqueia remover sala em uso', async () => {
    usosMock.mockResolvedValue(['alocações', 'dados de infraestrutura', 'chamados de manutenção'])
    const { result } = await renderCarregado()
    await expect(result.current.remover(cadastrada)).rejects.toThrow(
      '(alocações, dados de infraestrutura e chamados de manutenção) e não pode ser removida.'
    )
    expect(deleteMock).not.toHaveBeenCalled()
  })
})
