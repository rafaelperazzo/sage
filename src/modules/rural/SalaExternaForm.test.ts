import { describe, it, expect } from 'vitest'
import { erroCadastroSala, nomeSalaExterna, MENSAGEM_PADRAO_NOME_SALA } from './SalaExternaForm'

describe('nomeSalaExterna', () => {
  it('monta "PREDIO - SALA" em maiúsculas e sem espaços extras', () => {
    expect(nomeSalaExterna(' defis ', 'sala   02')).toBe('DEFIS - SALA 02')
  })
})

describe('erroCadastroSala', () => {
  const existentes = ['DEFIS - SALA 01', 'CEGOE - SALA 10']

  it('exige prédio e sala', () => {
    expect(erroCadastroSala('  ', 'SALA 02', existentes)).toBe('Prédio é obrigatório.')
    expect(erroCadastroSala('DEFIS', ' ', existentes)).toBe('Sala é obrigatória.')
  })

  it('rejeita prédio com " - ", que quebraria a separação prédio/sala', () => {
    expect(erroCadastroSala('BLOCO - A', 'SALA 01', existentes)).toMatch(/não pode conter/)
  })

  it('rejeita sala já existente, sem diferenciar caixa', () => {
    expect(erroCadastroSala('defis', 'sala 01', existentes)).toBe('A sala DEFIS - SALA 01 já existe.')
  })

  it('aceita sala nova, inclusive em prédio novo', () => {
    expect(erroCadastroSala('DEFIS', 'SALA 03', existentes)).toBeNull()
    expect(erroCadastroSala('NOVO PREDIO', 'SALA 01', existentes)).toBeNull()
  })
})

describe('erroCadastroSala — padrão "SALA XX" / "LAB XX"', () => {
  it.each(['SALA 02', 'LAB 15', 'sala 07', ' lab   99 '])('aceita %j', (sala) => {
    expect(erroCadastroSala('DEFIS', sala, [])).toBeNull()
  })

  it.each(['SALA 2', 'SALA 002', 'LAB', 'SALA02', 'AUDITÓRIO', 'GEOLAB 03', 'SALA A1', 'LABORATÓRIO 01', 'SALA 01 B'])(
    'recusa %j e explica o padrão',
    (sala) => {
      expect(erroCadastroSala('DEFIS', sala, [])).toBe(MENSAGEM_PADRAO_NOME_SALA)
    }
  )
})
