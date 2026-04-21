import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { useManutencao } from '../../../src/hooks/useManutencao'
import { useAuthContext } from '../../../src/contexts/AuthContext'
import { Ionicons } from '@expo/vector-icons'

const STATUS_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  'Aberto': { bg: '#FEF9C3', text: '#854D0E', border: '#FDE047' },
  'Em andamento': { bg: '#DBEAFE', text: '#1E3A8A', border: '#93C5FD' },
  'Concluído': { bg: '#DCFCE7', text: '#14532D', border: '#86EFAC' },
  'Cancelado': { bg: '#F3F4F6', text: '#6B7280', border: '#D1D5DB' },
}

export default function ManutencaoViewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { isAdmin } = useAuthContext()
  const { manutencoes } = useManutencao()
  const item = manutencoes.find((m) => String(m.id) === id)

  if (!item) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#6B7280' }}>Chamado não encontrado.</Text>
      </View>
    )
  }

  const s = STATUS_COLOR[item.status] ?? { bg: '#F3F4F6', text: '#374151', border: '#D1D5DB' }

  function Row({ label, value }: { label: string; value: string | null }) {
    if (!value) return null
    return (
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 11, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>{label}</Text>
        <Text style={{ fontSize: 14, color: '#111827' }}>{value}</Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['bottom']}>
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: '600' }}>RT #{item.numero_rt}</Text>
          <Text style={{ fontSize: 17, fontWeight: '800', color: '#111827', marginTop: 2 }}>{item.sala_local}</Text>
        </View>
        <View style={{ backgroundColor: s.bg, borderWidth: 1, borderColor: s.border, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: s.text }}>{item.status}</Text>
        </View>
      </View>

      <Row label="Descrição do Problema" value={item.descricao_problema} />
      <Row label="Data de Abertura" value={item.data_abertura ? new Date(item.data_abertura + 'T00:00:00').toLocaleDateString('pt-BR') : null} />
      <Row label="Data de Conclusão" value={item.data_conclusao ? new Date(item.data_conclusao + 'T00:00:00').toLocaleDateString('pt-BR') : null} />
      <Row label="Observações" value={item.observacoes} />

      {isAdmin && (
        <TouchableOpacity
          onPress={() => router.replace({ pathname: '/manutencao/[id]/edit', params: { id: item.id } } as never)}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE', borderRadius: 12, padding: 14, marginTop: 8, gap: 8 }}
        >
          <Ionicons name="pencil" size={16} color="#1D4ED8" />
          <Text style={{ color: '#1D4ED8', fontWeight: '700' }}>Editar Chamado</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={() => router.back()}
        style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, marginTop: 12, alignItems: 'center' }}>
        <Text style={{ color: '#6B7280', fontWeight: '600' }}>Fechar</Text>
      </TouchableOpacity>
    </ScrollView>
    </SafeAreaView>
  )
}
