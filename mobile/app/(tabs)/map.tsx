import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { Picker } from '@react-native-picker/picker'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { SALAS } from '../../src/constants/salas'
import { useAlocacoesPorSala } from '../../src/hooks/useAlocacoes'
import { useAuthContext } from '../../src/contexts/AuthContext'
import { usePeriodo } from '../../src/contexts/PeriodoContext'
import { WeekGrid } from '../../src/modules/map/WeekGrid'
import type { Alocacao } from '../../src/types'

const TIPO_BORDER: Record<string, string> = {
  sala_aula: '#2563EB',
  sala_inovacao: '#7C3AED',
  laboratorio: '#059669',
}

const TIPO_BG_ACTIVE: Record<string, string> = {
  sala_aula: '#EFF6FF',
  sala_inovacao: '#F5F3FF',
  laboratorio: '#ECFDF5',
}

export default function MapScreen() {
  const [selectedSala, setSelectedSala] = useState(SALAS[0]!.nome)
  const { isAdmin } = useAuthContext()
  const { periodo, setPeriodo, periodos } = usePeriodo()
  const { alocacoes, loading, error } = useAlocacoesPorSala(selectedSala)

  function handleCellPress(alocacao: Alocacao) {
    const path = isAdmin ? '/map/[id]/edit' : '/map/[id]/view'
    router.push({ pathname: path, params: { id: alocacao.id, sala: alocacao.sala } } as never)
  }

  function handleEmptyCellPress(dia: string, hora: string) {
    router.push({ pathname: '/map/create', params: { sala: selectedSala, dia, hora } } as never)
  }

  const currentSalaInfo = SALAS.find((s) => s.nome === selectedSala)
  const color = TIPO_BORDER[currentSalaInfo?.tipo ?? 'sala_aula'] ?? '#2563EB'

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['left', 'right', 'bottom']}>
      {/* Seletor de sala */}
      <View style={{ borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ padding: 8, gap: 6 }}
          style={{ flexGrow: 0 }}
        >
          {SALAS.map((sala) => {
            const isSelected = sala.nome === selectedSala
            const salaColor = TIPO_BORDER[sala.tipo] ?? '#2563EB'
            const salaBg = TIPO_BG_ACTIVE[sala.tipo] ?? '#EFF6FF'
            return (
              <TouchableOpacity
                key={sala.nome}
                onPress={() => setSelectedSala(sala.nome)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 20,
                  backgroundColor: isSelected ? salaBg : '#F9FAFB',
                  borderWidth: 1.5,
                  borderColor: isSelected ? salaColor : '#E5E7EB',
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: isSelected ? '700' : '500',
                    color: isSelected ? salaColor : '#6B7280',
                  }}
                >
                  {sala.nome}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>

        {/* Filtro de período */}
        {periodos.length > 1 && (
          <View style={{ paddingHorizontal: 12, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
            <Picker
              selectedValue={periodo}
              onValueChange={setPeriodo}
              style={{ height: 36, color: '#374151' }}
              dropdownIconColor="#9CA3AF"
            >
              {periodos.map((p) => (
                <Picker.Item key={p} label={p} value={p} />
              ))}
            </Picker>
          </View>
        )}

        {/* Info da sala selecionada */}
        <View style={{ paddingHorizontal: 12, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#111827' }}>{selectedSala}</Text>
          <Text style={{ fontSize: 11, color: '#9CA3AF' }}>
            {alocacoes.length} alocaç{alocacoes.length === 1 ? 'ão' : 'ões'}
          </Text>
          {isAdmin && (
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/map/create', params: { sala: selectedSala } } as never)}
              style={{ marginLeft: 'auto', backgroundColor: color, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 4 }}
            >
              <Text style={{ color: 'white', fontSize: 12, fontWeight: '700' }}>+ Nova</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Grid */}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={color} />
          <Text style={{ color: '#9CA3AF', marginTop: 8, fontSize: 13 }}>Carregando grade...</Text>
        </View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <Text style={{ color: '#DC2626', textAlign: 'center' }}>{error}</Text>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator>
          <WeekGrid
            alocacoes={alocacoes}
            isAdmin={isAdmin}
            onCellPress={handleCellPress}
            onEmptyCellPress={handleEmptyCellPress}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  )
}
