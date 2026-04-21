import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { useAlocacoesPorSala } from '../../../src/hooks/useAlocacoes'
import { getSalaInfo } from '../../../src/constants/salas'
import { Ionicons } from '@expo/vector-icons'
import { useAuthContext } from '../../../src/contexts/AuthContext'

const TIPO_COLOR: Record<string, string> = {
  sala_aula: '#1D4ED8',
  sala_inovacao: '#6D28D9',
  laboratorio: '#065F46',
}

export default function MapViewScreen() {
  const { id, sala: salaParam } = useLocalSearchParams<{ id: string; sala: string }>()
  const { isAdmin } = useAuthContext()
  const { alocacoes } = useAlocacoesPorSala(salaParam ?? '')
  const alocacao = alocacoes.find((a) => String(a.id) === id)
  const salaInfo = alocacao ? getSalaInfo(alocacao.sala) : undefined
  const color = TIPO_COLOR[salaInfo?.tipo ?? 'sala_aula'] ?? '#1D4ED8'

  if (!alocacao) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#6B7280' }}>Alocação não encontrada.</Text>
      </View>
    )
  }

  function Row({ label, value }: { label: string; value: string }) {
    return (
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 11, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>{label}</Text>
        <Text style={{ fontSize: 15, color: '#111827', fontWeight: '500' }}>{value}</Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['bottom']}>
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
        <View style={{ width: 4, height: 40, backgroundColor: color, borderRadius: 2, marginRight: 12 }} />
        <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827', flex: 1 }}>
          {alocacao.disciplina}
        </Text>
      </View>

      <Row label="Sala" value={alocacao.sala} />
      <Row label="Dia da Semana" value={alocacao.dia_semana} />
      <Row label="Horário" value={`${alocacao.inicio} – ${alocacao.fim}`} />
      {alocacao.professor && <Row label="Professor" value={alocacao.professor} />}
      <Row label="Período" value={alocacao.periodo} />

      {isAdmin && (
        <TouchableOpacity
          onPress={() => {
            router.replace({ pathname: '/map/[id]/edit', params: { id: alocacao.id, sala: alocacao.sala } } as never)
          }}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE', borderRadius: 12, padding: 14, marginTop: 16, gap: 8 }}
        >
          <Ionicons name="pencil" size={16} color="#1D4ED8" />
          <Text style={{ color: '#1D4ED8', fontWeight: '700' }}>Editar Alocação</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        onPress={() => router.back()}
        style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, marginTop: 12, alignItems: 'center' }}
      >
        <Text style={{ color: '#6B7280', fontWeight: '600' }}>Fechar</Text>
      </TouchableOpacity>
    </ScrollView>
    </SafeAreaView>
  )
}
