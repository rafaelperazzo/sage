import { useEffect, useMemo, useState } from 'react'
import { DoorOpen, Clock } from 'lucide-react'
import type { Alocacao } from '../../types'
import { useSalasExternasLivresAgora } from '../../hooks/useSalasExternasLivresAgora'
import { getPredioDaSala, getPredios, getNomeSalaSemPredio } from './salasExternasLivresAgora'

interface SalasLivresAgoraProps {
  salas: string[]
  alocacoes: Alocacao[]
  loading: boolean
}

export function SalasLivresAgora({ salas, alocacoes, loading }: SalasLivresAgoraProps) {
  const predios = useMemo(() => getPredios(salas), [salas])
  const [selectedPredio, setSelectedPredio] = useState('')

  useEffect(() => {
    if (predios.length === 0) return
    if (!selectedPredio || !predios.includes(selectedPredio)) {
      setSelectedPredio(predios[0]!)
    }
  }, [predios, selectedPredio])

  const salasDoPredio = useMemo(
    () => salas.filter((s) => getPredioDaSala(s) === selectedPredio),
    [salas, selectedPredio]
  )

  const { visivel, livres } = useSalasExternasLivresAgora(salasDoPredio, alocacoes)

  if (loading) {
    return <p className="text-sm text-gray-400">Carregando dados...</p>
  }

  if (!visivel) {
    return (
      <p className="text-sm text-gray-400">
        Disponível apenas de segunda a sexta, das 08:00 às 22:00.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {predios.length > 0 && (
        <div className="max-w-xs">
          <label htmlFor="predio-select" className="block text-xs font-medium text-gray-700 mb-1">
            Prédio
          </label>
          <select
            id="predio-select"
            value={selectedPredio}
            onChange={(e) => setSelectedPredio(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {predios.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      )}

      {livres.length === 0 ? (
        <p className="text-sm text-gray-400">Nenhuma sala externa disponível no momento.</p>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-gray-500">{livres.length} sala(s) livre(s) agora</p>
          <ul className="space-y-2">
            {livres.map((item) => (
              <li
                key={item.sala}
                className="flex items-center justify-between gap-3 bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm"
              >
                <span className="flex items-center gap-2 text-sm font-medium text-gray-800">
                  <DoorOpen size={15} className="text-blue-600" />
                  {getNomeSalaSemPredio(item.sala)}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Clock size={13} />
                  Livre até as {item.livreAte}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
