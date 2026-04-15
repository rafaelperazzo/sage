import { useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useManutencao } from '../../src/hooks/useManutencao'
import { useAuthContext } from '../../src/contexts/AuthContext'
import { Ionicons } from '@expo/vector-icons'
import type { Manutencao } from '../../src/types'

const STATUS_OPTIONS = ['', 'Aberto', 'Em andamento', 'Concluído', 'Cancelado']

const STATUS_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  'Aberto': { bg: '#FEF9C3', text: '#854D0E', border: '#FDE047' },
  'Em andamento': { bg: '#DBEAFE', text: '#1E3A8A', border: '#93C5FD' },
  'Concluído': { bg: '#DCFCE7', text: '#14532D', border: '#86EFAC' },
  'Cancelado': { bg: '#F3F4F6', text: '#6B7280', border: '#D1D5DB' },
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_COLOR[status] ?? { bg: '#F3F4F6', text: '#374151', border: '#D1D5DB' }
  return (
    <View style={{ backgroundColor: s.bg, borderWidth: 1, borderColor: s.border, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 }}>
      <Text style={{ fontSize: 10, fontWeight: '700', color: s.text }}>{status}</Text>
    </View>
  )
}

function ManutencaoCard({ item, isAdmin, onPress }: { item: Manutencao; isAdmin: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{ backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 }}
      activeOpacity={0.7}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#6B7280' }}>RT #{item.numero_rt}</Text>
          <View style={{ width: 1, height: 12, backgroundColor: '#E5E7EB' }} />
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#374151' }}>{item.sala_local}</Text>
        </View>
        <StatusBadge status={item.status} />
      </View>
      <Text style={{ fontSize: 13, color: '#111827', lineHeight: 18 }} numberOfLines={2}>
        {item.descricao_problema}
      </Text>
      {item.data_abertura && (
        <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 6 }}>
          Aberto em: {new Date(item.data_abertura + 'T00:00:00').toLocaleDateString('pt-BR')}
        </Text>
      )}
      {isAdmin && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4 }}>
          <Ionicons name="pencil" size={12} color="#2563EB" />
          <Text style={{ fontSize: 11, color: '#2563EB', fontWeight: '600' }}>Toque para editar</Text>
        </View>
      )}
    </TouchableOpacity>
  )
}

export default function ManutencaoScreen() {
  const { manutencoes, loading, error } = useManutencao()
  const { isAdmin } = useAuthContext()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  function handlePress(item: Manutencao) {
    const path = isAdmin ? '/manutencao/[id]/edit' : '/manutencao/[id]/view'
    router.push({ pathname: path, params: { id: item.id } } as never)
  }

  const filtered = manutencoes.filter((m) => {
    const q = search.toLowerCase()
    const matchSearch =
      !q ||
      m.numero_rt.toLowerCase().includes(q) ||
      m.sala_local.toLowerCase().includes(q) ||
      m.descricao_problema.toLowerCase().includes(q)
    const matchStatus = !statusFilter || m.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }} edges={['left', 'right', 'bottom']}>
      {/* Filtros */}
      <View style={{ backgroundColor: '#FFFFFF', padding: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 10, paddingHorizontal: 10, gap: 8 }}>
          <Ionicons name="search-outline" size={16} color="#9CA3AF" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar por RT, sala ou problema..."
            placeholderTextColor="#9CA3AF"
            style={{ flex: 1, padding: 8, fontSize: 13, color: '#111827' }}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {STATUS_OPTIONS.map((s) => (
            <TouchableOpacity
              key={s || 'todos'}
              onPress={() => setStatusFilter(s)}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 16,
                backgroundColor: statusFilter === s ? '#2563EB' : '#F3F4F6',
                borderWidth: 1,
                borderColor: statusFilter === s ? '#1D4ED8' : '#E5E7EB',
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '600', color: statusFilter === s ? '#FFFFFF' : '#6B7280' }}>
                {s || 'Todos'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <Text style={{ color: '#DC2626', textAlign: 'center' }}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <ManutencaoCard item={item} isAdmin={isAdmin} onPress={() => handlePress(item)} />
          )}
          contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
          ListHeaderComponent={
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={{ fontSize: 12, color: '#6B7280' }}>{filtered.length} chamado{filtered.length !== 1 ? 's' : ''}</Text>
              {isAdmin && (
                <TouchableOpacity
                  onPress={() => router.push('/manutencao/create' as never)}
                  style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#2563EB', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, gap: 4 }}
                >
                  <Ionicons name="add" size={14} color="white" />
                  <Text style={{ color: 'white', fontSize: 12, fontWeight: '700' }}>Novo Chamado</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 40 }}>
              <Ionicons name="construct-outline" size={40} color="#D1D5DB" />
              <Text style={{ color: '#9CA3AF', marginTop: 8, fontSize: 14 }}>Nenhum chamado encontrado</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  )
}
