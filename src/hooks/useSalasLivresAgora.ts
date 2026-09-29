import { useEffect, useState } from 'react'
import { SALAS } from '../constants/salas'
import { getSalasLivresAgora, isDentroJanelaLivresAgora, type SalaLivreAgora } from '../modules/map/gridUtils'
import { useAlocacoes } from './useAlocacoes'
import { useReservasPontuais } from './useReservasPontuais'

interface UseSalasLivresAgoraReturn {
  visivel: boolean
  loading: boolean
  labs: SalaLivreAgora[]
  salas: SalaLivreAgora[]
}

// Recalcula "agora" a cada minuto para manter o "livre até" e a janela de
// exibição (08h-22h, seg-sex) sempre corretos sem exigir reload da página.
export function useSalasLivresAgora(): UseSalasLivresAgoraReturn {
  const { alocacoes, loading: loadingAlocacoes } = useAlocacoes()
  const { reservas, loading: loadingReservas } = useReservasPontuais('map')
  const loading = loadingAlocacoes || loadingReservas
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  const visivel = isDentroJanelaLivresAgora(now)
  const livres = visivel ? getSalasLivresAgora(SALAS, alocacoes, now, reservas) : []

  return {
    visivel,
    loading,
    labs: livres.filter((s) => s.tipo === 'laboratorio'),
    salas: livres.filter((s) => s.tipo !== 'laboratorio'),
  }
}
