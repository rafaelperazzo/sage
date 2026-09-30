import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageShell } from '../../components/Layout/PageShell'
import { WeekGrid } from './WeekGrid'
import { ViewModal } from './ViewModal'
import { EditModal } from './EditModal'
import { AllocationForm } from './AllocationForm'
import { BuscaSala } from './BuscaSala'
import { ListaDisciplinas } from './ListaDisciplinas'
import { InfraSalaInfo } from './InfraSalaInfo'
import { EditInfraSalaModal } from './EditInfraSalaModal'
import { ManutencaoSalaInfo } from './ManutencaoSalaInfo'
import { useAlocacoesPorSala, useAlocacoes } from '../../hooks/useAlocacoes'
import { useInfraSalas } from '../../hooks/useInfraSalas'
import { useManutencao } from '../../hooks/useManutencao'
import { useAuth } from '../../hooks/useAuth'
import { useReservasPontuais } from '../../hooks/useReservasPontuais'
import { usePeriodo } from '../../contexts/PeriodoContext'
import { ExportarPdfButton } from './ExportarPdfButton'
import { exportarGradePdf, exportarGradesPdf, nomeArquivoGradesPredioPdf } from './exportarGradePdf'
import { SALAS, LIMITES, TIPO_LABEL, TIPO_COLOR, getSalaInfo } from '../../constants/salas'
import { SlotChoiceModal } from './SlotChoiceModal'
import { ReservaPontualForm } from './ReservaPontualForm'
import { ReservaPontualViewModal } from './ReservaPontualViewModal'
import { conflitoAlocacoes, outrasAlocacoesDaDisciplina, paraInput } from './alocacoesDisciplinaUtils'
import { alocacaoConflitaComReserva, mensagemConflitoReserva, proximaDataDoDia } from './reservasPontuaisUtils'
import type { Alocacao, AlocacaoInput, InfraSalaInput, ReservaPontual, ReservaPontualInput } from '../../types'
import { Shield, RefreshCw } from 'lucide-react'

type ModalState =
  | { mode: 'view'; alocacao: Alocacao }
  | { mode: 'edit'; alocacao: Alocacao }
  | { mode: 'create'; dia: string; hora: string }
  | { mode: 'choose'; dia: string; hora: string }
  | { mode: 'createReserva'; dia: string; hora: string }
  | { mode: 'editReserva'; reserva: ReservaPontual }
  | { mode: 'viewReserva'; reserva: ReservaPontual }
  | null

const TABS = ['grade', 'busca', 'lista'] as const
type Tab = (typeof TABS)[number]

function isTab(v: string | null): v is Tab {
  return TABS.includes(v as Tab)
}

export function MapPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const tab: Tab = isTab(tabParam) ? tabParam : 'grade'
  const [selectedSala, setSelectedSala] = useState(SALAS[0]!.nome)
  const [modal, setModal] = useState<ModalState>(null)
  const [editingInfra, setEditingInfra] = useState(false)
  const { isAdmin } = useAuth('map')
  const { alocacoes, loading, error, create, createMany, update, remove, updateMany, removeMany, hasConflict } = useAlocacoesPorSala(selectedSala)
  const {
    reservas,
    create: createReserva,
    update: updateReserva,
    remove: removeReserva,
    getConflito: getConflitoReservaPontual,
  } = useReservasPontuais('map', alocacoes)
  const reservasSala = reservas.filter((r) => r.sala === selectedSala)
  const { periodo } = usePeriodo()

  async function handleExportarPdf() {
    await exportarGradePdf({
      modulo: 'SAGE Map',
      sala: selectedSala,
      tipoSala: salaInfo ? TIPO_LABEL[salaInfo.tipo] : undefined,
      periodo,
      alocacoes,
      reservas: reservasSala,
    })
  }
  const { alocacoes: todasAlocacoes, loading: loadingBusca, reload: reloadTodas } = useAlocacoes()

  // Um único PDF com a grade de todas as salas do departamento (uma por página,
  // na mesma ordem dos botões de sala).
  async function handleExportarTodasPdf() {
    await exportarGradesPdf({
      modulo: 'SAGE Map',
      periodo,
      paginas: SALAS.map((sala) => ({
        sala: sala.nome,
        tipoSala: TIPO_LABEL[sala.tipo],
        alocacoes: todasAlocacoes.filter((a) => a.sala === sala.nome),
        reservas: reservas.filter((r) => r.sala === sala.nome),
      })),
      nomeArquivo: nomeArquivoGradesPredioPdf('SAGE Map', periodo),
    })
  }
  const { infraSalas, loading: loadingInfra, save: saveInfra } = useInfraSalas()
  const infraSala = infraSalas.find((i) => i.sala === selectedSala)
  const { manutencoes, loading: loadingManutencao } = useManutencao()
  const manutencoesSala = manutencoes.filter((m) => m.sala_local === selectedSala && m.status !== 'Concluído')

  const salaInfo = getSalaInfo(selectedSala)

  function handleCellClick(alocacao: Alocacao) {
    if (isAdmin) {
      setModal({ mode: 'edit', alocacao })
    } else {
      setModal({ mode: 'view', alocacao })
    }
  }

  function handleEmptyCellClick(dia: string, hora: string) {
    setModal({ mode: 'choose', dia, hora })
  }

  function handleReservaClick(reserva: ReservaPontual) {
    setModal(isAdmin ? { mode: 'editReserva', reserva } : { mode: 'viewReserva', reserva })
  }

  function getConflitoReserva(data: AlocacaoInput): string | null {
    const reserva = alocacaoConflitaComReserva(data, reservas)
    return reserva ? mensagemConflitoReserva(reserva) : null
  }

  async function handleCreate(data: AlocacaoInput) {
    const conflito = getConflitoReserva(data)
    if (conflito) throw new Error(conflito)
    await create(data)
  }

  async function handleCreateMany(data: AlocacaoInput[]) {
    for (const d of data) {
      const conflito = getConflitoReserva(d)
      if (conflito) throw new Error(conflito)
    }
    await createMany(data)
  }

  // Conflito ao gravar a alocação editada (e as outras da disciplina, se
  // refletida): checa todas as alocações do período — a sala pode ter mudado —
  // e as reservas pontuais futuras.
  function getConflitoEdicao(linhas: Alocacao[]): string | null {
    return conflitoAlocacoes(linhas, todasAlocacoes) ?? linhas.map(getConflitoReserva).find(Boolean) ?? null
  }

  async function handleUpdate(linhas: Alocacao[]) {
    const conflito = getConflitoEdicao(linhas)
    if (conflito) throw new Error(conflito)
    if (linhas.length === 1) await update(linhas[0]!.id, paraInput(linhas[0]!))
    else await updateMany(linhas)
    await reloadTodas()
  }

  async function handleCreateReserva(data: ReservaPontualInput) {
    await createReserva(data)
  }

  async function handleUpdateReserva(id: number, data: ReservaPontualInput) {
    await updateReserva(id, data)
  }

  // Fim sugerido para uma nova reserva: fim do bloco livre de 2 horas
  // começando em `hora` (ou o próximo marco da grade).
  function fimSugerido(hora: string): string {
    const idx = LIMITES.indexOf(hora)
    return LIMITES[idx + 2] ?? LIMITES[idx + 1] ?? hora
  }

  async function handleDelete(ids: number[]) {
    if (ids.length === 1) await remove(ids[0]!)
    else await removeMany(ids)
    await reloadTodas()
  }

  async function handleSaveInfra(data: InfraSalaInput) {
    await saveInfra(data)
  }

  function handleTabChange(next: Tab) {
    setSearchParams(next === 'grade' ? {} : { tab: next }, { replace: true })
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
      <>{/* Seletor de sala */}
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
        <ExportarPdfButton
          label="Exportar grade de todas as salas"
          onExport={handleExportarTodasPdf}
          disabled={loadingBusca}
        />
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
        <ExportarPdfButton onExport={handleExportarPdf} disabled={loading || !!error || !selectedSala} />
      </div>

      <InfraSalaInfo
        infraSala={infraSala}
        loading={loadingInfra}
        isAdmin={isAdmin}
        onEdit={() => setEditingInfra(true)}
      />

      <ManutencaoSalaInfo manutencoes={manutencoesSala} loading={loadingManutencao} />

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
          reservas={reservasSala}
          onReservaClick={handleReservaClick}
        />
      )}

      {isAdmin && !loading && (
        <p className="mt-2 text-xs text-gray-400">
          Clique em uma célula livre para adicionar uma alocação ou reserva pontual, ou em uma alocação/reserva para editar/remover.
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
          outras={outrasAlocacoesDaDisciplina(modal.alocacao, todasAlocacoes)}
          getConflito={getConflitoEdicao}
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
          getConflitoReserva={getConflitoReserva}
          onSave={handleCreate}
          onSaveMany={handleCreateMany}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.mode === 'choose' && (
        <SlotChoiceModal
          dia={modal.dia}
          hora={modal.hora}
          onAlocacao={() => setModal({ mode: 'create', dia: modal.dia, hora: modal.hora })}
          onReserva={() => setModal({ mode: 'createReserva', dia: modal.dia, hora: modal.hora })}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.mode === 'createReserva' && (
        <ReservaPontualForm
          modulo="map"
          sala={selectedSala}
          initialData={proximaDataDoDia(modal.dia)}
          initialInicio={modal.hora}
          initialFim={fimSugerido(modal.hora)}
          getConflito={getConflitoReservaPontual}
          onSave={handleCreateReserva}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.mode === 'editReserva' && (
        <ReservaPontualForm
          modulo="map"
          sala={modal.reserva.sala}
          reserva={modal.reserva}
          getConflito={getConflitoReservaPontual}
          onSave={(data) => handleUpdateReserva(modal.reserva.id, data)}
          onDelete={removeReserva}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.mode === 'viewReserva' && (
        <ReservaPontualViewModal
          reserva={modal.reserva}
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
