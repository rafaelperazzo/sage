import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, useWindowDimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAlocacoes } from '../../src/hooks/useAlocacoes'
import { calcularOcupacao } from '../../src/modules/report/occupancyUtils'
import { CartesianChart, Bar } from 'victory-native'

const TIPO_COLOR: Record<string, string> = {
  sala_aula: '#3B82F6',
  sala_inovacao: '#8B5CF6',
  laboratorio: '#10B981',
}

const TIPO_LABEL: Record<string, string> = {
  sala_aula: 'Sala de Aula',
  sala_inovacao: 'Sala de Inovação',
  laboratorio: 'Laboratório',
}

function OccupancyBar({ percentual, tipo }: { percentual: number; tipo: string }) {
  const color = TIPO_COLOR[tipo] ?? '#6B7280'
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View style={{ flex: 1, height: 8, backgroundColor: '#F3F4F6', borderRadius: 4, overflow: 'hidden' }}>
        <View style={{ width: `${Math.min(percentual, 100)}%` as `${number}%`, height: 8, backgroundColor: color, borderRadius: 4 }} />
      </View>
      <Text style={{ fontSize: 11, fontWeight: '700', color, width: 36, textAlign: 'right' }}>{percentual}%</Text>
    </View>
  )
}

export default function ReportScreen() {
  const { alocacoes, loading } = useAlocacoes()
  const { width } = useWindowDimensions()
  const [selectedSala, setSelectedSala] = useState<string | null>(null)

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }} edges={['left', 'right', 'bottom']}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={{ color: '#9CA3AF', marginTop: 8 }}>Calculando ocupação...</Text>
      </SafeAreaView>
    )
  }

  const { salas, totalGeralHoras, mediaOcupacao } = calcularOcupacao(alocacoes)

  // Dados para o gráfico (labels abreviadas)
  const chartData = salas.map((s) => ({
    label: s.sala.replace('LAB CEAGRI I - ', 'CEA-').replace('SALA ', 'S').replace('LAB ', 'L'),
    percentual: s.percentual,
    tipo: s.tipo,
    sala: s.sala,
  }))

  const selected = selectedSala ? salas.find((s) => s.sala === selectedSala) : null

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Resumo */}
        <View style={{ flexDirection: 'row', gap: 10, padding: 16 }}>
          {[
            { label: 'Alocações', value: alocacoes.length },
            { label: 'Horas Totais', value: `${totalGeralHoras.toFixed(0)}h` },
            { label: 'Média Ocupação', value: `${mediaOcupacao}%` },
          ].map((stat) => (
            <View key={stat.label} style={{ flex: 1, backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0', borderRadius: 12, padding: 12, alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: '#059669' }}>{stat.value}</Text>
              <Text style={{ fontSize: 10, color: '#065F46', marginTop: 2, textAlign: 'center' }}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Legenda */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16, marginBottom: 8 }}>
          {Object.entries(TIPO_COLOR).map(([tipo, color]) => (
            <View key={tipo} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: color }} />
              <Text style={{ fontSize: 10, color: '#6B7280' }}>{TIPO_LABEL[tipo]}</Text>
            </View>
          ))}
        </View>

        {/* Gráfico de barras com CartesianChart */}
        <View style={{ height: 240, marginHorizontal: 8 }}>
          <CartesianChart
            data={chartData}
            xKey="label"
            yKeys={['percentual']}
            domain={{ y: [0, 100] }}
            domainPadding={{ left: 10, right: 10 }}
            axisOptions={{
              tickCount: 5,
              formatYLabel: (v) => `${v}%`,
              formatXLabel: (v) => String(v),
              labelColor: '#9CA3AF',
              lineColor: '#F3F4F6',
            }}
          >
            {({ points, chartBounds }) =>
              points.percentual.map((point, i) => (
                <Bar
                  key={i}
                  points={[point]}
                  chartBounds={chartBounds}
                  color={TIPO_COLOR[chartData[i]?.tipo ?? 'sala_aula'] ?? '#6B7280'}
                  roundedCorners={{ topLeft: 3, topRight: 3 }}
                />
              ))
            }
          </CartesianChart>
        </View>

        {/* Detalhe da sala selecionada */}
        {selected && (
          <View style={{ marginHorizontal: 16, marginBottom: 16, backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#111827' }}>{selected.sala}</Text>
              <Text style={{ fontSize: 13, color: '#6B7280' }}>{selected.totalHoras.toFixed(1)}h / semana</Text>
            </View>
            {Object.entries(selected.porDia).map(([dia, horas]) => (
              <View key={dia} style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                  <Text style={{ fontSize: 11, color: '#374151', fontWeight: '600' }}>{dia}</Text>
                  <Text style={{ fontSize: 11, color: '#6B7280' }}>{horas.toFixed(1)}h</Text>
                </View>
                <View style={{ height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden' }}>
                  <View style={{ width: `${Math.min((horas / 12) * 100, 100)}%` as `${number}%`, height: 6, backgroundColor: TIPO_COLOR[selected.tipo] ?? '#6B7280', borderRadius: 3 }} />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Lista de salas */}
        <View style={{ paddingHorizontal: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 10 }}>Todas as salas</Text>
          {salas.map((sala) => (
            <TouchableOpacity
              key={sala.sala}
              onPress={() => setSelectedSala((prev) => prev === sala.sala ? null : sala.sala)}
              style={{ backgroundColor: selectedSala === sala.sala ? '#F0FDF4' : '#FFFFFF', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: selectedSala === sala.sala ? '#86EFAC' : '#E5E7EB' }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: TIPO_COLOR[sala.tipo] ?? '#6B7280' }} />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#111827' }}>{sala.sala}</Text>
                </View>
                <Text style={{ fontSize: 11, color: '#6B7280' }}>{sala.totalHoras.toFixed(1)}h</Text>
              </View>
              <OccupancyBar percentual={sala.percentual} tipo={sala.tipo} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
