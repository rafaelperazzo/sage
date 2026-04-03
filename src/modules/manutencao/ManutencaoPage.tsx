import { useMemo, useState } from 'react'
import { PageShell } from '../../components/Layout/PageShell'
import { useManutencao } from '../../hooks/useManutencao'
import { useAuth } from '../../hooks/useAuth'
import { ManutencaoViewModal } from './ManutencaoViewModal'
import { ManutencaoEditModal } from './ManutencaoEditModal'
import { ManutencaoForm } from './ManutencaoForm'
import type { Manutencao, ManutencaoInput } from '../../types'
import { Shield, Plus, RefreshCw, Search } from 'lucide-react'

type ModalState =
  | { mode: 'view'; manutencao: Manutencao }
  | { mode: 'edit'; manutencao: Manutencao }
  | { mode: 'create' }
  | null

const STATUS_BADGE: Record<string, string> = {
  'Aberto':        'bg-red-100 text-red-700 border-red-200',
  'Em andamento':  'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Concluído':     'bg-green-100 text-green-700 border-green-200',
}

function normalize(s: string | null | undefined) {
  if (!s) return ''
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  const [ano, mes, dia] = dateStr.split('-')
  return `${dia}/${mes}/${ano}`
}

export function ManutencaoPage() {
  const { manutencoes, loading, error, create, update, remove } = useManutencao()
  const { isAdmin } = useAuth()
  const [modal, setModal] = useState<ModalState>(null)
  const [filtroRt, setFiltroRt] = useState('')
  const [filtroLocal, setFiltroLocal] = useState('')
  const [filtroDescricao, setFiltroDescricao] = useState('')

  const filtradas = useMemo(() =>
    manutencoes.filter((m) =>
      normalize(m.numero_rt).includes(normalize(filtroRt)) &&
      normalize(m.sala_local).includes(normalize(filtroLocal)) &&
      normalize(m.descricao_problema).includes(normalize(filtroDescricao))
    ),
    [manutencoes, filtroRt, filtroLocal, filtroDescricao]
  )

  function handleRowClick(m: Manutencao) {
    setModal(isAdmin ? { mode: 'edit', manutencao: m } : { mode: 'view', manutencao: m })
  }

  async function handleCreate(data: ManutencaoInput) {
    await create(data)
  }

  async function handleUpdate(id: number, data: ManutencaoInput) {
    await update(id, data)
  }

  async function handleDelete(id: number) {
    await remove(id)
  }

  const filterInput = 'border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 w-full'

  return (
    <PageShell
      title="SAGE Manutenção"
      subtitle="Solicitações de manutenção do Departamento de Computação"
      actions={
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <span className="flex items-center gap-1.5 text-xs text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full font-medium">
                <Shield size={12} />
                Modo Admin
              </span>
              <button
                onClick={() => setModal({ mode: 'create' })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors"
              >
                <Plus size={15} />
                Nova RT
              </button>
            </>
          )}
        </div>
      }
    >
      {/* Filtros */}
      <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={filtroRt}
            onChange={(e) => setFiltroRt(e.target.value)}
            placeholder="Filtrar por RT..."
            className={`${filterInput} pl-8`}
          />
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={filtroLocal}
            onChange={(e) => setFiltroLocal(e.target.value)}
            placeholder="Filtrar por local..."
            className={`${filterInput} pl-8`}
          />
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={filtroDescricao}
            onChange={(e) => setFiltroDescricao(e.target.value)}
            placeholder="Filtrar por descrição..."
            className={`${filterInput} pl-8`}
          />
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-400 py-8 justify-center">
          <RefreshCw size={15} className="animate-spin" />
          Carregando...
        </div>
      )}

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
          Erro ao carregar dados: {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-32">Nº RT</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-36">Local</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Descrição</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-36">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-28">Abertura</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filtradas.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-400">
                      Nenhuma solicitação encontrada.
                    </td>
                  </tr>
                ) : (
                  filtradas.map((m) => {
                    const badgeClass = STATUS_BADGE[m.status] ?? 'bg-gray-100 text-gray-700 border-gray-200'
                    return (
                      <tr
                        key={m.id}
                        onClick={() => handleRowClick(m)}
                        className="hover:bg-orange-50 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{m.numero_rt}</td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{m.sala_local}</td>
                        <td className="px-4 py-3 text-gray-600 max-w-xs">
                          <span className="line-clamp-2">{m.descricao_problema}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded border font-medium ${badgeClass}`}>
                            {m.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(m.data_abertura)}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {filtradas.length > 0 && (
            <p className="mt-2 text-xs text-gray-400">
              {filtradas.length} solicitação{filtradas.length !== 1 ? 'ões' : ''} encontrada{filtradas.length !== 1 ? 's' : ''}.
              {isAdmin && ' Clique em uma linha para editar.'}
            </p>
          )}
        </>
      )}

      {/* Modais */}
      {modal?.mode === 'view' && (
        <ManutencaoViewModal manutencao={modal.manutencao} onClose={() => setModal(null)} />
      )}

      {modal?.mode === 'edit' && (
        <ManutencaoEditModal
          manutencao={modal.manutencao}
          onSave={handleUpdate}
          onDelete={handleDelete}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.mode === 'create' && (
        <ManutencaoForm onSave={handleCreate} onClose={() => setModal(null)} />
      )}
    </PageShell>
  )
}
