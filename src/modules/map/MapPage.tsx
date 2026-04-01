import { useState } from 'react'
import { PageShell } from '../../components/Layout/PageShell'
import { WeekGrid } from './WeekGrid'
import { ViewModal } from './ViewModal'
import { EditModal } from './EditModal'
import { AllocationForm } from './AllocationForm'
import { useAlocacoesPorSala } from '../../hooks/useAlocacoes'
import { useAuth } from '../../hooks/useAuth'
import { SALAS, TIPO_LABEL, TIPO_COLOR, getSalaInfo } from '../../constants/salas'
import type { Alocacao, AlocacaoInput } from '../../types'
import { Shield, RefreshCw } from 'lucide-react'

type ModalState =
  | { mode: 'view'; alocacao: Alocacao }
  | { mode: 'edit'; alocacao: Alocacao }
  | { mode: 'create'; dia: string; hora: string }
  | null

export function MapPage() {
  const [selectedSala, setSelectedSala] = useState(SALAS[0]!.nome)
  const [modal, setModal] = useState<ModalState>(null)
  const { isAdmin } = useAuth()
  const { alocacoes, loading, error, create, update, remove, hasConflict } = useAlocacoesPorSala(selectedSala)

  const salaInfo = getSalaInfo(selectedSala)

  function handleCellClick(alocacao: Alocacao) {
    if (isAdmin) {
      setModal({ mode: 'edit', alocacao })
    } else {
      setModal({ mode: 'view', alocacao })
    }
  }

  function handleEmptyCellClick(dia: string, hora: string) {
    setModal({ mode: 'create', dia, hora })
  }

  async function handleCreate(data: AlocacaoInput) {
    await create(data)
  }

  async function handleUpdate(id: number, data: AlocacaoInput) {
    await update(id, data)
  }

  async function handleDelete(id: number) {
    await remove(id)
  }

  return (
    <PageShell
      title="SAGE Map"
      subtitle="Agenda semanal de salas em tempo real"
      actions={
        isAdmin && (
          <span className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full font-medium">
            <Shield size={12} />
            Modo Admin
          </span>
        )
      }
    >
      {/* Seletor de sala */}
      <div className="mb-5 flex flex-wrap gap-2">
        {SALAS.map((sala) => (
          <button
            key={sala.nome}
            onClick={() => setSelectedSala(sala.nome)}
            className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
              selectedSala === sala.nome
                ? `${TIPO_COLOR[sala.tipo]} ring-2 ring-offset-1 ring-blue-400`
                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            {sala.nome}
          </button>
        ))}
      </div>

      {/* Cabeçalho da sala selecionada */}
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-base font-semibold text-gray-800">{selectedSala}</h2>
        {salaInfo && (
          <span className={`text-xs px-2 py-0.5 rounded border font-medium ${TIPO_COLOR[salaInfo.tipo]}`}>
            {TIPO_LABEL[salaInfo.tipo]}
          </span>
        )}
        {loading && (
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <RefreshCw size={12} className="animate-spin" />
            Carregando...
          </span>
        )}
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          Erro ao carregar dados: {error}
        </div>
      )}

      {!loading && !error && (
        <WeekGrid
          alocacoes={alocacoes}
          isAdmin={isAdmin}
          onCellClick={handleCellClick}
          onEmptyCellClick={handleEmptyCellClick}
        />
      )}

      {isAdmin && !loading && (
        <p className="mt-2 text-xs text-gray-400">
          Clique em uma célula vazia para adicionar, ou em uma alocação para editar/remover.
        </p>
      )}

      {/* Modais */}
      {modal?.mode === 'view' && (
        <ViewModal
          alocacao={modal.alocacao}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.mode === 'edit' && (
        <EditModal
          alocacao={modal.alocacao}
          hasConflict={hasConflict}
          onSave={handleUpdate}
          onDelete={handleDelete}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.mode === 'create' && (
        <AllocationForm
          initialDia={modal.dia}
          initialHora={modal.hora}
          initialSala={selectedSala}
          hasConflict={hasConflict}
          onSave={handleCreate}
          onClose={() => setModal(null)}
        />
      )}
    </PageShell>
  )
}
