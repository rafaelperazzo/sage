import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { useReservas } from '../../../src/hooks/useReservas'
import { useAuthContext } from '../../../src/contexts/AuthContext'
import { Ionicons } from '@expo/vector-icons'

export default function AuditorioViewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { isAdmin } = useAuthContext()
  const today = new Date()
  const { reservas } = useReservas(today.getFullYear(), today.getMonth() + 1)
  const item = reservas.find((r) => String(r.id) === id)

  if (!item) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#6B7280' }}>Reserva não encontrada.</Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['bottom']}>
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
      <View style={{ backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A', borderRadius: 16, padding: 20, marginBottom: 20, alignItems: 'center' }}>
        <Ionicons name="business" size={32} color="#D97706" />
        <Text style={{ fontSize: 22, fontWeight: '900', color: '#92400E', marginTop: 8 }}>
          {new Date(item.data + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
        </Text>
        <Text style={{ fontSize: 16, color: '#78350F', marginTop: 4 }}>
          {item.inicio.slice(0, 5)} – {item.fim.slice(0, 5)}
        </Text>
        {item.responsavel && (
          <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>{item.responsavel}</Text>
        )}
      </View>

      {isAdmin && (
        <TouchableOpacity
          onPress={() => router.replace({ pathname: '/auditorio/[id]/edit', params: { id: item.id } } as never)}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A', borderRadius: 12, padding: 14, gap: 8, marginBottom: 12 }}
        >
          <Ionicons name="pencil" size={16} color="#D97706" />
          <Text style={{ color: '#D97706', fontWeight: '700' }}>Editar Reserva</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={() => router.back()}
        style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, alignItems: 'center' }}>
        <Text style={{ color: '#6B7280', fontWeight: '600' }}>Fechar</Text>
      </TouchableOpacity>
    </ScrollView>
    </SafeAreaView>
  )
}
