import { DIAS, HORAS, LIMITES } from '../../constants/salas'

export interface OutroHorario {
  ativo: boolean
  dia: string
  inicio: string
  fim: string
}

interface OutroHorarioFieldsProps {
  value: OutroHorario
  onChange: (value: OutroHorario) => void
}

/** Dia seguinte ao `dia` em DIAS (segunda a sexta, voltando à segunda). */
function proximoDiaUtil(dia: string): string {
  const uteis = DIAS.filter((d) => d !== 'SÁBADO')
  const idx = uteis.indexOf(dia as (typeof uteis)[number])
  return uteis[(idx + 1) % uteis.length]!
}

export function outroHorarioInicial(dia: string, inicio: string, fim: string): OutroHorario {
  return { ativo: false, dia: proximoDiaUtil(dia), inicio, fim }
}

// Checkbox "Alocar em outro dia/horário" + dia/início/fim da segunda alocação
// (mesma disciplina, professor, curso e sala da primeira).
export function OutroHorarioFields({ value, onChange }: OutroHorarioFieldsProps) {
  return (
    <div className="rounded-lg border border-gray-200 px-3 py-2.5">
      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
        <input
          type="checkbox"
          checked={value.ativo}
          onChange={(e) => onChange({ ...value, ativo: e.target.checked })}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        Alocar em outro dia/horário
      </label>

      {value.ativo && (
        <div className="grid grid-cols-3 gap-3 mt-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Dia *</label>
            <select
              aria-label="Dia do segundo horário"
              value={value.dia}
              onChange={(e) => onChange({ ...value, dia: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {DIAS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Início *</label>
            <select
              aria-label="Início do segundo horário"
              value={value.inicio}
              onChange={(e) => onChange({ ...value, inicio: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {HORAS.map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Fim *</label>
            <select
              aria-label="Fim do segundo horário"
              value={value.fim}
              onChange={(e) => onChange({ ...value, fim: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {LIMITES.slice(1).map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  )
}
