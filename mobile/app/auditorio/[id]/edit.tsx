import { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { Picker } from '@react-native-picker/picker'
import { useReservas } from '../../../src/hooks/useReservas'
import { useAuthContext } from '../../../src/contexts/AuthContext'
import { Ionicons } from '@expo/vector-icons'
import { DatePickerField } from '../../../src/components/DatePickerField'

const HORAS = Array.from({ length: 15 }, (_, i) => `${String(7 + i).padStart(2, '0')}:00:00`)
const HORAS_FIM = Array.from({ length: 15 }, (_, i) => `${String(8 + i).padStart(2, '0')}:00:00`)

export default function AuditorioEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { isAdmin } = useAuthContext()
  const today = new Date()
  const { reservas, update, remove, hasConflict } = useReservas(today.getFullYear(), today.getMonth() + 1)
  const item = reservas.find((r) => String(r.id) === id)

  const [data, setData] = useState(item?.data ?? '')
  const [inicio, setInicio] = useState(item?.inicio ?? '08:00:00')
  const [fim, setFim] = useState(item?.fim ?? '10:00:00')
  const [responsavel, setResponsavel] = useState(item?.responsavel ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { if (!isAdmin) router.back() }, [isAdmin])
  useEffect(() => {
    if (item) {
      setData(item.data); setInicio(item.inicio); setFim(item.fim); setResponsavel(item.responsavel ?? '')
    }
  }, [item?.id])

  if (!item) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#6B7280' }}>Reserva não encontrada.</Text>
    </View>
  )

  const input = { data, inicio, fim, responsavel: responsavel.trim() || null }
  const safeItem = item
  const conflict = hasConflict(input, safeItem.id)

  async function handleSave() {
    if (inicio >= fim) { setError('Início deve ser anterior ao fim.'); return }
    if (conflict) { setError('Conflito: período já reservado.'); return }
    setSaving(true); setError(null)
    try { await update(safeItem.id, input); router.back() }
    catch (err) { setError(err instanceof Error ? err.message : 'Erro ao salvar.') }
    finally { setSaving(false) }
  }

  function handleDelete() {
    Alert.alert('Remover Reserva', `Deseja remover a reserva de ${new Date(safeItem.data + 'T00:00:00').toLocaleDateString('pt-BR')}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: async () => {
        try { await remove(safeItem.id); router.back() }
        catch { setError('Erro ao remover.') }
      }},
    ])
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['bottom']}>
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
      {error && (
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', borderRadius: 10, padding: 12, marginBottom: 16, gap: 8 }}>
          <Ionicons name="alert-circle" size={16} color="#DC2626" />
          <Text style={{ color: '#DC2626', fontSize: 13, flex: 1 }}>{error}</Text>
        </View>
      )}

      <DatePickerField label="Data" value={data} onChange={setData} required />

      <Text style={{ fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 6 }}>Responsável</Text>
      <TextInput value={responsavel} onChangeText={setResponsavel} placeholder="Nome do responsável" placeholderTextColor="#9CA3AF"
        style={{ borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, padding: 12, fontSize: 14, color: '#111827', marginBottom: 14, backgroundColor: '#F9FAFB' }} />

      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 4 }}>Início *</Text>
          <View style={{ borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, backgroundColor: '#F9FAFB', overflow: 'hidden' }}>
            <Picker selectedValue={inicio} onValueChange={setInicio} style={{ color: '#111827' }}>
              {HORAS.map((h) => <Picker.Item key={h} label={h.slice(0, 5)} value={h} />)}
            </Picker>
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 4 }}>Fim *</Text>
          <View style={{ borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, backgroundColor: '#F9FAFB', overflow: 'hidden' }}>
            <Picker selectedValue={fim} onValueChange={setFim} style={{ color: '#111827' }}>
              {HORAS_FIM.map((h) => <Picker.Item key={h} label={h.slice(0, 5)} value={h} />)}
            </Picker>
          </View>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
        <TouchableOpacity onPress={() => router.back()}
          style={{ flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#D1D5DB', alignItems: 'center' }}>
          <Text style={{ color: '#374151', fontWeight: '600' }}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSave} disabled={saving || conflict}
          style={{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: saving || conflict ? '#FDE68A' : '#D97706', alignItems: 'center' }}>
          {saving ? <ActivityIndicator color="white" size="small" /> : <Text style={{ color: 'white', fontWeight: '700' }}>Salvar</Text>}
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={handleDelete}
        style={{ padding: 14, borderRadius: 12, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
        <Ionicons name="trash-outline" size={16} color="#DC2626" />
        <Text style={{ color: '#DC2626', fontWeight: '700' }}>Remover Reserva</Text>
      </TouchableOpacity>
    </ScrollView>
    </SafeAreaView>
  )
}
