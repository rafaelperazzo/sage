import { useEffect, useState } from 'react'
import type { Alocacao } from '../types'
import { isDentroJanelaLivresAgora } from '../modules/map/gridUtils'
import { getSalasExternasLivresAgora, type SalaExternaLivreAgora } from '../modules/rural/salasExternasLivresAgora'

interface UseSalasExternasLivresAgoraReturn {
  visivel: boolean
  livres: SalaExternaLivreAgora[]
}

// Recebe `salas` e `alocacoes` já carregadas pelo RuralPage (em vez de
// buscar de novo aqui) para não abrir uma segunda assinatura realtime no
// mesmo canal (`externas-all-<periodo>`) — o Supabase rejeita registrar
// callbacks `postgres_changes` duas vezes no mesmo nome de canal.
// Recalcula "agora" a cada minuto para manter o "livre até" e a janela de
// exibição (08h-22h, seg-sex) sempre corretos sem exigir reload da página.
export function useSalasExternasLivresAgora(
  salas: string[],
  alocacoes: Alocacao[]
): UseSalasExternasLivresAgoraReturn {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  const visivel = isDentroJanelaLivresAgora(now)
  const livres = visivel ? getSalasExternasLivresAgora(salas, alocacoes, now) : []

  return { visivel, livres }
}
