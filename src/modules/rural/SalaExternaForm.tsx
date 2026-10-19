import { useState, useMemo } from 'react'
import { BaseModal } from '../../components/Modal/BaseModal'
import { AlertCircle, Trash2 } from 'lucide-react'
import { getPredios, getPredioDaSala, getNomeSalaSemPredio } from './salasExternasLivresAgora'

function normalizar(valor: string): string {
  return valor.trim().replace(/\s+/g, ' ').toUpperCase()
}

/** Nome completo da sala externa no padrão "PREDIO - SALA XX". */
export function nomeSalaExterna(predio: string, sala: string): string {
  return `${normalizar(predio)} - ${normalizar(sala)}`
}

// Nome da sala: "SALA" ou "LAB" + espaço + dois dígitos (ex: "SALA 02", "LAB 15").
const PADRAO_NOME_SALA = /^(SALA|LAB) \d{2}$/

export const MENSAGEM_PADRAO_NOME_SALA =
  'O nome da sala deve seguir o padrão "SALA XX" ou "LAB XX", com dois dígitos (ex: SALA 02, LAB 15).'

/** Mensagem de erro do cadastro, ou null se a sala puder ser cadastrada. */
export function erroCadastroSala(predio: string, sala: string, existentes: string[]): string | null {
  if (!normalizar(predio)) return 'Prédio é obrigatório.'
  if (!normalizar(sala)) return 'Sala é obrigatória.'
  // O prédio é separado da sala pelo primeiro " - " do nome completo.
  if (normalizar(predio).includes(' - ')) return 'O nome do prédio não pode conter " - ".'
  if (!PADRAO_NOME_SALA.test(normalizar(sala))) return MENSAGEM_PADRAO_NOME_SALA
  const nome = nomeSalaExterna(predio, sala)
  if (existentes.some((s) => s.toUpperCase() === nome)) return `A sala ${nome} já existe.`
  return null
}

interface SalaExternaFormProps {
  salas: string[]
  // Edição: nome atual da sala cadastrada (habilita o botão Remover).
  sala?: string
  initialPredio?: string
  onSave: (sala: string) => Promise<void>
  onDelete?: () => Promise<void>
  onClose: () => void
}

export function SalaExternaForm({ salas, sala: atual, initialPredio = '', onSave, onDelete, onClose }: SalaExternaFormProps) {
  const [predio, setPredio] = useState(atual ? getPredioDaSala(atual) : initialPredio)
  const [sala, setSala] = useState(atual ? getNomeSalaSemPredio(atual) : '')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const predios = useMemo(() => getPredios(salas), [salas])

  const preenchido = normalizar(predio) !== '' && normalizar(sala) !== ''

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const nome = nomeSalaExterna(predio, sala)
    if (atual && nome === atual) { onClose(); return }
    // Na edição, a própria sala não conta como repetida (ex: só mudar a caixa).
    const erro = erroCadastroSala(predio, sala, salas.filter((s) => s !== atual))
    if (erro) { setError(erro); return }
    setSaving(true)
    setError(null)
    try {
      await onSave(nome)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar a sala.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!onDelete) return
    setDeleting(true)
    setError(null)
    try {
      await onDelete()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover.')
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  if (confirmDelete && atual) {
    return (
      <BaseModal title="Confirmar Remoção" onClose={onClose} size="sm">
        <p className="text-sm text-gray-700 mb-1">
          Tem certeza que deseja remover a sala:
        </p>
        <p className="text-sm font-semibold text-gray-900 mb-4">{atual}</p>
        <div className="flex gap-2">
          <button
            onClick={() => setConfirmDelete(false)}
            className="flex-1 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {deleting ? 'Removendo...' : 'Confirmar Remoção'}
          </button>
        </div>
      </BaseModal>
    )
  }

  return (
    <BaseModal title={atual ? 'Editar Sala' : 'Cadastrar Sala'} onClose={onClose} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-600">
          {atual
            ? 'Só é possível renomear ou remover uma sala que ainda não esteja em uso (alocações, reservas pontuais, infraestrutura ou manutenção).'
            : 'Cadastre uma sala que ainda não tem alocação para que ela apareça na grade, na busca e no SAGE Report.'}
        </p>

        <div>
          <label htmlFor="sala-externa-predio" className="block text-xs font-medium text-gray-700 mb-1">Prédio *</label>
          <input
            id="sala-externa-predio"
            list="sala-externa-predios"
            value={predio}
            onChange={(e) => setPredio(e.target.value.toUpperCase())}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Escolha um prédio ou digite um novo"
            required
          />
          <datalist id="sala-externa-predios">
            {predios.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </div>

        <div>
          <label htmlFor="sala-externa-sala" className="block text-xs font-medium text-gray-700 mb-1">Sala *</label>
          <input
            id="sala-externa-sala"
            value={sala}
            onChange={(e) => setSala(e.target.value.toUpperCase())}
            aria-describedby="sala-externa-sala-ajuda"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="SALA 02"
            required
          />
          <p id="sala-externa-sala-ajuda" className="mt-1 text-xs text-gray-400">
            Use "SALA XX" ou "LAB XX", com dois dígitos (ex: SALA 02, LAB 15).
          </p>
        </div>

        {preenchido && (
          <p className="text-xs text-gray-500">
            {atual ? 'Ficará como' : 'Será cadastrada como'}{' '}
            <span className="font-medium text-gray-800">{nomeSalaExterna(predio, sala)}</span>
          </p>
        )}

        {error && (
          <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          {atual && onDelete && (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 size={14} />
              Remover
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Salvando...' : atual ? 'Salvar' : 'Cadastrar'}
          </button>
        </div>
      </form>
    </BaseModal>
  )
}
