import { useState } from 'react'
import { PageShell } from '../../components/Layout/PageShell'
import { MonthCalendar } from './MonthCalendar'
import { AuditorioReport } from './AuditorioReport'
import { ReservaViewModal } from './ReservaViewModal'
import { ReservaForm } from './ReservaForm'
import { ReservaEditModal } from './ReservaEditModal'
import { useReservas } from '../../hooks/useReservas'
import { useAuth } from '../../hooks/useAuth'
import type { Reserva, ReservaInput } from '../../types'
import { Shield, Mail, Calendar, BarChart2 } from 'lucide-react'

type ModalState =
  | { mode: 'view'; reserva: Reserva }
  | { mode: 'edit'; reserva: Reserva }
  | { mode: 'create'; data: string }
  | null

type Tab = 'calendario' | 'relatorio'

export function AuditorioPage() {
  const now = new Date()
  const [ano, setAno] = useState(now.getFullYear())
  const [mes, setMes] = useState(now.getMonth() + 1)
  const [tab, setTab] = useState<Tab>('calendario')
  const [modal, setModal] = useState<ModalState>(null)

  const { isAdmin } = useAuth()
  const { reservas, loading, error, create, update, remove, hasConflict } = useReservas(ano, mes)

  function prevMonth() {
    if (mes === 1) { setMes(12); setAno(ano - 1) }
    else setMes(mes - 1)
  }

  function nextMonth() {
    if (mes === 12) { setMes(1); setAno(ano + 1) }
    else setMes(mes + 1)
  }

  function handleDayClick(dateStr: string) {
    if (isAdmin) setModal({ mode: 'create', data: dateStr })
  }

  function handleReservaClick(reserva: Reserva) {
    setModal(isAdmin ? { mode: 'edit', reserva } : { mode: 'view', reserva })
  }

  async function handleCreate(data: ReservaInput) {
    await create(data)
  }

  async function handleUpdate(id: number, data: ReservaInput) {
    await update(id, data)
  }

  async function handleDelete(id: number) {
    await remove(id)
  }

  return (
    <PageShell
      title="SAGE Auditório"
      subtitle="Reservas do auditório do Departamento de Computação"
      actions={
        isAdmin ? (
          <span className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full font-medium">
            <Shield size={12} />
            Modo Admin
          </span>
        ) : undefined
      }
    >
      {/* Aviso público */}
      {!isAdmin && (
        <div className="mb-5 flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800">
          <Mail size={16} className="mt-0.5 flex-shrink-0" />
          <span>
            Para solicitar uma reserva no auditório, envie um e-mail para{' '}
            <a href="mailto:diretoria.dc@ufrpe.br" className="font-medium underline hover:no-underline">
              diretoria.dc@ufrpe.br
            </a>
            . As reservas são gerenciadas pela direção do Departamento.
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-gray-200">
        <button
          onClick={() => setTab('calendario')}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
            tab === 'calendario'
              ? 'border-amber-500 text-amber-700'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Calendar size={14} />
          Calendário
        </button>
        <button
          onClick={() => setTab('relatorio')}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
            tab === 'relatorio'
              ? 'border-amber-500 text-amber-700'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <BarChart2 size={14} />
          Relatório
        </button>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          Erro ao carregar dados: {error}
        </div>
      )}

      {loading && (
        <p className="text-sm text-gray-400 mb-4">Carregando...</p>
      )}

      {!loading && !error && tab === 'calendario' && (
        <>
          <MonthCalendar
            ano={ano}
            mes={mes}
            reservas={reservas}
            isAdmin={isAdmin}
            onPrevMonth={prevMonth}
            onNextMonth={nextMonth}
            onDayClick={handleDayClick}
            onReservaClick={handleReservaClick}
          />
          {isAdmin && (
            <p className="mt-2 text-xs text-gray-400">
              Clique em um dia para adicionar uma reserva, ou em uma reserva existente para editar/remover.
            </p>
          )}
        </>
      )}

      {!loading && !error && tab === 'relatorio' && (
        <AuditorioReport reservas={reservas} ano={ano} mes={mes} />
      )}

      {/* Modais */}
      {modal?.mode === 'view' && (
        <ReservaViewModal
          reserva={modal.reserva}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.mode === 'edit' && (
        <ReservaEditModal
          reserva={modal.reserva}
          hasConflict={hasConflict}
          onSave={handleUpdate}
          onDelete={handleDelete}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.mode === 'create' && (
        <ReservaForm
          initialData={modal.data}
          hasConflict={hasConflict}
          onSave={handleCreate}
          onClose={() => setModal(null)}
        />
      )}
    </PageShell>
  )
}
