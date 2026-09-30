import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import type { RoomOccupancy } from './occupancyUtils'
import type { TipoSala } from '../../types'

interface OccupancyBarChartProps {
  salas: RoomOccupancy[]
  onSalaClick?: (sala: string) => void
  // Nome exibido no eixo (padrão: encurta "LAB CEAGRI I - " para "CEA-").
  nomeCurto?: (sala: string) => string
}

const TIPO_BAR_COLOR: Record<TipoSala, string> = {
  sala_aula: '#3B82F6',
  sala_inovacao: '#8B5CF6',
  laboratorio: '#10B981',
}

// Salas do SAGE Rural não têm tipo.
const COR_SEM_TIPO = '#F59E0B'

function nomeCurtoPadrao(sala: string): string {
  return sala.replace('LAB CEAGRI I - ', 'CEA-')
}

interface ChartEntry {
  name: string
  fullName: string
  percentual: number
  tipo?: TipoSala
  horas: number
}

export function OccupancyBarChart({ salas, onSalaClick, nomeCurto = nomeCurtoPadrao }: OccupancyBarChartProps) {
  const data: ChartEntry[] = salas.map((s) => ({
    name: nomeCurto(s.sala),
    fullName: s.sala,
    percentual: s.percentual,
    tipo: s.tipo,
    horas: s.totalHoras,
  }))

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart
        data={data}
        margin={{ top: 5, right: 20, left: 0, bottom: 60 }}
        onClick={(state) => {
          if (state?.activePayload?.[0]) {
            const fullName = (state.activePayload[0].payload as ChartEntry).fullName
            onSalaClick?.(fullName)
          }
        }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: '#6B7280' }}
          angle={-35}
          textAnchor="end"
          interval={0}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 11, fill: '#6B7280' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `${v}%`}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null
            const entry = payload[0]?.payload as ChartEntry
            return (
              <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
                <p style={{ fontWeight: 600, marginBottom: 2 }}>{entry.fullName ?? label}</p>
                <p style={{ color: '#6B7280' }}>{entry.percentual}% — {entry.horas.toFixed(1)}h</p>
              </div>
            )
          }}
        />
        <Bar
          dataKey="percentual"
          radius={[4, 4, 0, 0]}
          cursor={onSalaClick ? 'pointer' : 'default'}
        >
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.tipo ? TIPO_BAR_COLOR[entry.tipo] : COR_SEM_TIPO} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
