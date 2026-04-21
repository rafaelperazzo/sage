import { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { Picker } from '@react-native-picker/picker'
import { useManutencao } from '../../../src/hooks/useManutencao'
import { useAuthContext } from '../../../src/contexts/AuthContext'
import { Ionicons } from '@expo/vector-icons'
import { DatePickerField } from '../../../src/components/DatePickerField'

const STATUS_OPTIONS = ['Aberto', 'Em andamento', 'Concluído', 'Cancelado']

export default function ManutencaoEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { isAdmin } = useAuthContext()
  const { manutencoes, update, remove } = useManutencao()
  const item = manutencoes.find((m) => String(m.id) === id)

  const [numeroRt, setNumeroRt] = useState(item?.numero_rt ?? '')
  const [salaLocal, setSalaLocal] = useState(item?.sala_local ?? '')
  const [descricao, setDescricao] = useState(item?.descricao_problema ?? '')
  const [status, setStatus] = useState(item?.status ?? 'Aberto')
  const [dataAbertura, setDataAbertura] = useState(item?.data_abertura ?? '')
  const [dataConclusao, setDataConclusao] = useState(item?.data_conclusao ?? '')
  const [observacoes, setObservacoes] = useState(item?.observacoes ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAdmin) router.back()
  }, [isAdmin])

  useEffect(() => {
    if (item) {
      setNumeroRt(item.numero_rt)
      setSalaLocal(item.sala_local)
      setDescricao(item.descricao_problema)
      setStatus(item.status)
      setDataAbertura(item.data_abertura ?? '')
      setDataConclusao(item.data_conclusao ?? '')
      setObservacoes(item.observacoes ?? '')
    }
  }, [item?.id])

  if (!item) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#6B7280' }}>Chamado não encontrado.</Text>
      </View>
    )
  }

  const safeItem = item

  async function handleSave() {
    if (!numeroRt.trim() || !salaLocal.trim() || !descricao.trim()) {
      setError('RT, sala e descrição são obrigatórios.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await update(safeItem.id, {
        numero_rt: numeroRt.trim(),
        sala_local: salaLocal.trim(),
        descricao_problema: descricao.trim(),
        status,
        data_abertura: dataAbertura || null,
        data_conclusao: dataConclusao || null,
        observacoes: observacoes.trim() || null,
      })
      router.back()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  function handleDelete() {
    Alert.alert('Remover Chamado', `Deseja remover o RT #${safeItem.numero_rt}?`, [
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

      <Text style={{ fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 6 }}>Número do RT *</Text>
      <TextInput value={numeroRt} onChangeText={setNumeroRt} placeholderTextColor="#9CA3AF"
        style={{ borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, padding: 12, fontSize: 14, color: '#111827', marginBottom: 14, backgroundColor: '#F9FAFB' }} />

      <Text style={{ fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 6 }}>Sala / Local *</Text>
      <TextInput value={salaLocal} onChangeText={setSalaLocal} placeholderTextColor="#9CA3AF"
        style={{ borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, padding: 12, fontSize: 14, color: '#111827', marginBottom: 14, backgroundColor: '#F9FAFB' }} />

      <Text style={{ fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 6 }}>Descrição do Problema *</Text>
      <TextInput value={descricao} onChangeText={setDescricao} multiline numberOfLines={3} placeholderTextColor="#9CA3AF"
        style={{ borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, padding: 12, fontSize: 14, color: '#111827', marginBottom: 14, backgroundColor: '#F9FAFB', minHeight: 80, textAlignVertical: 'top' }} />

      <Text style={{ fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 4 }}>Status *</Text>
      <View style={{ borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, marginBottom: 14, backgroundColor: '#F9FAFB', overflow: 'hidden' }}>
        <Picker selectedValue={status} onValueChange={setStatus} style={{ color: '#111827' }}>
          {STATUS_OPTIONS.map((s) => <Picker.Item key={s} label={s} value={s} />)}
        </Picker>
      </View>

      <DatePickerField label="Data Abertura" value={dataAbertura} onChange={setDataAbertura} />
      <DatePickerField label="Data Conclusão" value={dataConclusao} onChange={setDataConclusao} />

      <Text style={{ fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 6 }}>Observações</Text>
      <TextInput value={observacoes} onChangeText={setObservacoes} multiline numberOfLines={2} placeholderTextColor="#9CA3AF"
        style={{ borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, padding: 12, fontSize: 14, color: '#111827', marginBottom: 24, backgroundColor: '#F9FAFB', minHeight: 60, textAlignVertical: 'top' }} />

      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
        <TouchableOpacity onPress={() => router.back()}
          style={{ flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#D1D5DB', alignItems: 'center' }}>
          <Text style={{ color: '#374151', fontWeight: '600' }}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSave} disabled={saving}
          style={{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: saving ? '#93C5FD' : '#2563EB', alignItems: 'center' }}>
          {saving ? <ActivityIndicator color="white" size="small" /> : <Text style={{ color: 'white', fontWeight: '700' }}>Salvar</Text>}
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={handleDelete}
        style={{ padding: 14, borderRadius: 12, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
        <Ionicons name="trash-outline" size={16} color="#DC2626" />
        <Text style={{ color: '#DC2626', fontWeight: '700' }}>Remover Chamado</Text>
      </TouchableOpacity>
    </ScrollView>
    </SafeAreaView>
  )
}
