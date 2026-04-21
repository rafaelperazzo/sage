import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Picker } from '@react-native-picker/picker'
import { useManutencao } from '../../src/hooks/useManutencao'
import { Ionicons } from '@expo/vector-icons'
import { DatePickerField } from '../../src/components/DatePickerField'

const STATUS_OPTIONS = ['Aberto', 'Em andamento', 'Concluído', 'Cancelado']

export default function ManutencaoCreateScreen() {
  const { create } = useManutencao()
  const [numeroRt, setNumeroRt] = useState('')
  const [salaLocal, setSalaLocal] = useState('')
  const [descricao, setDescricao] = useState('')
  const [status, setStatus] = useState('Aberto')
  const [dataAbertura, setDataAbertura] = useState(new Date().toISOString().split('T')[0]!)
  const [observacoes, setObservacoes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    if (!numeroRt.trim()) { setError('Número do RT é obrigatório.'); return }
    if (!salaLocal.trim()) { setError('Sala/Local é obrigatório.'); return }
    if (!descricao.trim()) { setError('Descrição do problema é obrigatória.'); return }
    setSaving(true)
    setError(null)
    try {
      await create({
        numero_rt: numeroRt.trim(),
        sala_local: salaLocal.trim(),
        descricao_problema: descricao.trim(),
        status,
        data_abertura: dataAbertura || null,
        data_conclusao: null,
        observacoes: observacoes.trim() || null,
      })
      router.back()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
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
      <TextInput value={numeroRt} onChangeText={setNumeroRt} placeholder="Ex: 12345" placeholderTextColor="#9CA3AF"
        style={{ borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, padding: 12, fontSize: 14, color: '#111827', marginBottom: 14, backgroundColor: '#F9FAFB' }} />

      <Text style={{ fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 6 }}>Sala / Local *</Text>
      <TextInput value={salaLocal} onChangeText={setSalaLocal} placeholder="Ex: LAB 35, Corredor B" placeholderTextColor="#9CA3AF"
        style={{ borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, padding: 12, fontSize: 14, color: '#111827', marginBottom: 14, backgroundColor: '#F9FAFB' }} />

      <Text style={{ fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 6 }}>Descrição do Problema *</Text>
      <TextInput value={descricao} onChangeText={setDescricao} placeholder="Descreva o problema..." placeholderTextColor="#9CA3AF" multiline numberOfLines={3}
        style={{ borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, padding: 12, fontSize: 14, color: '#111827', marginBottom: 14, backgroundColor: '#F9FAFB', minHeight: 80, textAlignVertical: 'top' }} />

      <Text style={{ fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 4 }}>Status *</Text>
      <View style={{ borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, marginBottom: 14, backgroundColor: '#F9FAFB', overflow: 'hidden' }}>
        <Picker selectedValue={status} onValueChange={setStatus} style={{ color: '#111827' }}>
          {STATUS_OPTIONS.map((s) => <Picker.Item key={s} label={s} value={s} />)}
        </Picker>
      </View>

      <DatePickerField label="Data de Abertura" value={dataAbertura} onChange={setDataAbertura} />

      <Text style={{ fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 6 }}>Observações</Text>
      <TextInput value={observacoes} onChangeText={setObservacoes} placeholder="Observações adicionais (opcional)" placeholderTextColor="#9CA3AF" multiline numberOfLines={2}
        style={{ borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, padding: 12, fontSize: 14, color: '#111827', marginBottom: 24, backgroundColor: '#F9FAFB', minHeight: 60, textAlignVertical: 'top' }} />

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()}
          style={{ flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#D1D5DB', alignItems: 'center' }}>
          <Text style={{ color: '#374151', fontWeight: '600' }}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSave} disabled={saving}
          style={{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: saving ? '#93C5FD' : '#2563EB', alignItems: 'center' }}>
          {saving ? <ActivityIndicator color="white" size="small" /> : <Text style={{ color: 'white', fontWeight: '700' }}>Salvar</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
    </SafeAreaView>
  )
}
