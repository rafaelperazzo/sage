import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageShell } from '../../components/Layout/PageShell'
import { WeekGrid } from '../map/WeekGrid'
import { ViewModal } from '../map/ViewModal'
import { BuscaSala } from '../map/BuscaSala'
import { ListaDisciplinas } from '../map/ListaDisciplinas'
import { InfraSalaInfo } from '../map/InfraSalaInfo'
import { EditInfraSalaModal } from '../map/EditInfraSalaModal'
import { ManutencaoSalaInfo } from '../map/ManutencaoSalaInfo'
import { RuralAllocationForm } from './RuralAllocationForm'
import { RuralEditModal } from './RuralEditModal'
import { useAlocacoesExternasPorSala, useAlocacoesExternas } from '../../hooks/useAlocacoesExternas'
import { useSalasExternas } from '../../hooks/useSalasExternas'
import { useInfraSalas } from '../../hooks/useInfraSalas'
import { useManutencao } from '../../hooks/useManutencao'
import { useAuth } from '../../hooks/useAuth'
import type { Alocacao, AlocacaoInput, InfraSalaInput } from '../../types'
import { Shield, RefreshCw, Info } from 'lucide-react'

type ModalState =
  | { mode: 'view'; alocacao: Alocacao }
  | { mode: 'edit'; alocacao: Alocacao }
  | { mode: 'create'; dia: string; hora: string }
  | null

const TABS = ['grade', 'busca', 'lista'] as const
type Tab = (typeof TABS)[number]

function isTab(v: string | null): v is Tab {
  return TABS.includes(v as Tab)
}

export function RuralPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const tab: Tab = isTab(tabParam) ? tabParam : 'grade'
  const { salas, loading: loadingSalas } = useSalasExternas()
  const [selectedSala, setSelectedSala] = useState('')
  const [modal, setModal] = useState<ModalState>(null)
  const [editingInfra, setEditingInfra] = useState(false)
  const { isAdmin } = useAuth('rural')
  const { alocacoes, loading, error, create, update, remove, hasConflict } = useAlocacoesExternasPorSala(selectedSala)
  const { alocacoes: todasAlocacoes, loading: loadingBusca } = useAlocacoesExternas()
  const { infraSalas, loading: loadingInfra, save: saveInfra } = useInfraSalas()
  const infraSala = infraSalas.find((i) => i.sala === selectedSala)
  const { manutencoes, loading: loadingManutencao } = useManutencao()
  const manutencoesSala = manutencoes.filter((m) => m.sala_local === selectedSala && m.status !== 'Concluído')

  useEffect(() => {
    if (!selectedSala && salas.length > 0) {
      setSelectedSala(salas[0]!)
    }
  }, [salas, selectedSala])

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

  async function handleSaveInfra(data: InfraSalaInput) {
    await saveInfra(data)
  }

  function handleTabChange(next: Tab) {
    setSearchParams(next === 'grade' ? {} : { tab: next }, { replace: true })
  }

  return (
    <PageShell
      title="SAGE Rural"
      subtitle="Agenda semanal de salas externas em tempo real"
      actions={
        isAdmin && (
          <span className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full font-medium">
            <Shield size={12} />
            Modo Admin
          </span>
        )
      }
    >
      {/* Tabs */}
      <div className="mb-5 flex gap-1 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => handleTabChange(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'grade' ? 'Grade Semanal' : t === 'busca' ? 'Buscar Sala' : 'Lista de Disciplinas'}
          </button>
        ))}
      </div>

      {tab === 'busca' && (
        <BuscaSala alocacoes={todasAlocacoes} loading={loadingBusca} />
      )}

      {tab === 'lista' && (
        <ListaDisciplinas alocacoes={todasAlocacoes} loading={loadingBusca} />
      )}

      {tab === 'grade' && (
      <>
      <div className="mb-4 flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800">
        <Info size={16} className="mt-0.5 flex-shrink-0" />
        <span>A gestão destes espaços é de competência da CPGA - PREG. O Departamento de Computação não interfere nestes espaços.</span>
      </div>

      {/* Seletor de sala */}
      <div className="mb-5 max-w-xs">
        <label className="block text-xs font-medium text-gray-700 mb-1">Sala</label>
        <select
          value={selectedSala}
          onChange={(e) => setSelectedSala(e.target.value)}
          disabled={loadingSalas || salas.length === 0}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loadingSalas && <option>Carregando...</option>}
          {!loadingSalas && salas.length === 0 && <option>Nenhuma sala encontrada</option>}
          {salas.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Cabeçalho da sala selecionada */}
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-base font-semibold text-gray-800">{selectedSala}</h2>
        {loading && (
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <RefreshCw size={12} className="animate-spin" />
            Carregando...
          </span>
        )}
      </div>

      {infraSala && (
        <InfraSalaInfo
          infraSala={infraSala}
          loading={loadingInfra}
          isAdmin={isAdmin}
          onEdit={() => setEditingInfra(true)}
        />
      )}

      <ManutencaoSalaInfo manutencoes={manutencoesSala} loading={loadingManutencao} />

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          Erro ao carregar dados: {error}
        </div>
      )}

      {!loading && !error && selectedSala && (
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
        <RuralEditModal
          salas={salas}
          alocacao={modal.alocacao}
          hasConflict={hasConflict}
          onSave={handleUpdate}
          onDelete={handleDelete}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.mode === 'create' && (
        <RuralAllocationForm
          salas={salas}
          initialDia={modal.dia}
          initialHora={modal.hora}
          initialSala={selectedSala}
          hasConflict={hasConflict}
          onSave={handleCreate}
          onClose={() => setModal(null)}
        />
      )}

      {editingInfra && (
        <EditInfraSalaModal
          sala={selectedSala}
          infraSala={infraSala}
          onSave={handleSaveInfra}
          onClose={() => setEditingInfra(false)}
        />
      )}
      </>
      )}
    </PageShell>
  )
}
