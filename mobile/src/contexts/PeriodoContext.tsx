import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { fetchPeriodos } from '../lib/supabase'

interface PeriodoContextValue {
  periodo: string
  setPeriodo: (p: string) => void
  periodos: string[]
  loadingPeriodos: boolean
}

const PeriodoContext = createContext<PeriodoContextValue | null>(null)

export function PeriodoProvider({ children }: { children: ReactNode }) {
  const [periodos, setPeriodos] = useState<string[]>([])
  const [periodo, setPeriodo] = useState<string>('')
  const [loadingPeriodos, setLoadingPeriodos] = useState(true)

  useEffect(() => {
    fetchPeriodos()
      .then((lista) => {
        setPeriodos(lista)
        if (lista.length === 0) return
        const now = new Date()
        const semestre = now.getMonth() + 1 <= 7 ? 1 : 2
        const periodoAtual = `${now.getFullYear()}.${semestre}`
        const match = lista.includes(periodoAtual) ? periodoAtual : lista[lista.length - 1]!
        setPeriodo(match)
      })
      .catch(console.error)
      .finally(() => setLoadingPeriodos(false))
  }, [])

  return (
    <PeriodoContext.Provider value={{ periodo, setPeriodo, periodos, loadingPeriodos }}>
      {children}
    </PeriodoContext.Provider>
  )
}

export function usePeriodo(): PeriodoContextValue {
  const ctx = useContext(PeriodoContext)
  if (!ctx) throw new Error('usePeriodo deve ser usado dentro de <PeriodoProvider>')
  return ctx
}
