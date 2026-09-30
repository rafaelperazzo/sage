import type { Alocacao } from '../../types'
import { formatarAlocacaoCurta } from './alocacoesDisciplinaUtils'

export interface OutrasAlocacoesSelecao {
  ativo: boolean
  ids: number[]
}

export const SELECAO_VAZIA: OutrasAlocacoesSelecao = { ativo: false, ids: [] }

interface OutrasAlocacoesFieldsProps {
  outras: Alocacao[]
  value: OutrasAlocacoesSelecao
  onChange: (value: OutrasAlocacoesSelecao) => void
  ajuda?: string
}

/** Outras alocações selecionadas (vazio se a opção estiver desmarcada). */
export function outrasSelecionadas(outras: Alocacao[], value: OutrasAlocacoesSelecao): Alocacao[] {
  return value.ativo ? outras.filter((o) => value.ids.includes(o.id)) : []
}

// Checkbox "Refletir em outros dias e horários da disciplina" + uma caixa por
// alocação da mesma disciplina (todas marcadas ao ativar a opção).
export function OutrasAlocacoesFields({ outras, value, onChange, ajuda }: OutrasAlocacoesFieldsProps) {
  if (outras.length === 0) return null

  function toggleId(id: number, marcado: boolean) {
    onChange({ ...value, ids: marcado ? [...value.ids, id] : value.ids.filter((i) => i !== id) })
  }

  return (
    <div className="rounded-lg border border-gray-200 px-3 py-2.5 text-left">
      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
        <input
          type="checkbox"
          checked={value.ativo}
          onChange={(e) => onChange({ ativo: e.target.checked, ids: outras.map((o) => o.id) })}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        Refletir em outros dias e horários da disciplina
      </label>

      {value.ativo && (
        <div className="mt-2 space-y-1.5 pl-6">
          {ajuda && <p className="text-xs text-gray-500">{ajuda}</p>}
          {outras.map((o) => (
            <label key={o.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={value.ids.includes(o.id)}
                onChange={(e) => toggleId(o.id, e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              {formatarAlocacaoCurta(o)}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
