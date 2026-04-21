import { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { Picker } from '@react-native-picker/picker'
import { DIAS, HORAS } from '../../../src/constants/salas'
import { useAlocacoesPorSala } from '../../../src/hooks/useAlocacoes'
import { useAuthContext } from '../../../src/contexts/AuthContext'
import { Ionicons } from '@expo/vector-icons'
import type { AlocacaoInput } from '../../../src/types'

export default function MapEditScreen() {
  const { id, sala: salaParam } = useLocalSearchParams<{ id: string; sala: string }>()
  const { isAdmin } = useAuthContext()
  const { alocacoes, update, remove, hasConflict } = useAlocacoesPorSala(salaParam ?? '')
  const alocacao = alocacoes.find((a) => String(a.id) === id)

  const [disciplina, setDisciplina] = useState(alocacao?.disciplina ?? '')
  const [professor, setProfessor] = useState(alocacao?.professor ?? '')
  const [dia, setDia] = useState(alocacao?.dia_semana ?? DIAS[0]!)
  const [inicio, setInicio] = useState(alocacao?.inicio ?? '07:00')
  const [fim, setFim] = useState(alocacao?.fim ?? '09:00')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAdmin) router.back()
  }, [isAdmin])

  useEffect(() => {
    if (alocacao) {
      setDisciplina(alocacao.disciplina)
      setProfessor(alocacao.professor ?? '')
      setDia(alocacao.dia_semana)
      setInicio(alocacao.inicio)
      setFim(alocacao.fim)
    }
  }, [alocacao?.id])

  if (!alocacao) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#6B7280' }}>Alocação não encontrada.</Text>
      </View>
    )
  }

  // alocacao is guaranteed non-null after the early return above
  const safeAlocacao = alocacao

  const input: AlocacaoInput = {
    disciplina,
    professor: professor.trim() || null,
    dia_semana: dia,
    sala: safeAlocacao.sala,
    inicio,
    fim,
  }
  const conflict = disciplina.trim() !== '' && hasConflict(input, alocacao.id)

  async function handleSave() {
    if (!disciplina.trim()) { setError('Disciplina é obrigatória.'); return }
    if (inicio >= fim) { setError('O horário de início deve ser anterior ao fim.'); return }
    if (conflict) { setError('Conflito de horário: este slot já está ocupado.'); return }
    setSaving(true)
    setError(null)
    try {
      await update(safeAlocacao.id, input)
      router.back()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  function handleDelete() {
    Alert.alert(
      'Remover Alocação',
      `Deseja remover "${safeAlocacao.disciplina}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await remove(safeAlocacao.id)
              router.back()
            } catch {
              setError('Erro ao remover alocação.')
            }
          },
        },
      ]
    )
  }

  const HORAS_FIM = [...HORAS.slice(1), '22:00']

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['bottom']}>
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
      {error && (
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', borderRadius: 10, padding: 12, marginBottom: 16, gap: 8 }}>
          <Ionicons name="alert-circle" size={16} color="#DC2626" />
          <Text style={{ color: '#DC2626', fontSize: 13, flex: 1 }}>{error}</Text>
        </View>
      )}

      <Text style={{ fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 6 }}>Disciplina *</Text>
      <TextInput
        value={disciplina}
        onChangeText={setDisciplina}
        placeholder="Nome da disciplina"
        placeholderTextColor="#9CA3AF"
        style={{ borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, padding: 12, fontSize: 14, color: '#111827', marginBottom: 14, backgroundColor: '#F9FAFB' }}
      />

      <Text style={{ fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 6 }}>Professor</Text>
      <TextInput
        value={professor}
        onChangeText={setProfessor}
        placeholder="Nome completo (opcional)"
        placeholderTextColor="#9CA3AF"
        style={{ borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, padding: 12, fontSize: 14, color: '#111827', marginBottom: 14, backgroundColor: '#F9FAFB' }}
      />

      <View style={{ backgroundColor: '#F3F4F6', borderRadius: 10, padding: 10, marginBottom: 14 }}>
        <Text style={{ fontSize: 11, color: '#6B7280' }}>Sala: <Text style={{ fontWeight: '700', color: '#374151' }}>{alocacao.sala}</Text></Text>
      </View>

      <Text style={{ fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 4 }}>Dia *</Text>
      <View style={{ borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, marginBottom: 14, backgroundColor: '#F9FAFB', overflow: 'hidden' }}>
        <Picker selectedValue={dia} onValueChange={setDia} style={{ color: '#111827' }}>
          {DIAS.map((d) => <Picker.Item key={d} label={d} value={d} />)}
        </Picker>
      </View>

      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 4 }}>Início *</Text>
          <View style={{ borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, backgroundColor: '#F9FAFB', overflow: 'hidden' }}>
            <Picker selectedValue={inicio} onValueChange={setInicio} style={{ color: '#111827' }}>
              {HORAS.map((h) => <Picker.Item key={h} label={h} value={h} />)}
            </Picker>
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 4 }}>Fim *</Text>
          <View style={{ borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, backgroundColor: '#F9FAFB', overflow: 'hidden' }}>
            <Picker selectedValue={fim} onValueChange={setFim} style={{ color: '#111827' }}>
              {HORAS_FIM.map((h) => <Picker.Item key={h} label={h} value={h} />)}
            </Picker>
          </View>
        </View>
      </View>

      {conflict && (
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', borderRadius: 10, padding: 10, marginBottom: 16, gap: 8 }}>
          <Ionicons name="alert-circle" size={15} color="#DC2626" />
          <Text style={{ color: '#DC2626', fontSize: 12 }}>Conflito de horário.</Text>
        </View>
      )}

      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#D1D5DB', alignItems: 'center' }}
        >
          <Text style={{ color: '#374151', fontWeight: '600' }}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving || conflict}
          style={{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: saving || conflict ? '#93C5FD' : '#2563EB', alignItems: 'center' }}
        >
          {saving ? <ActivityIndicator color="white" size="small" /> : <Text style={{ color: 'white', fontWeight: '700' }}>Salvar</Text>}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={handleDelete}
        style={{ padding: 14, borderRadius: 12, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
      >
        <Ionicons name="trash-outline" size={16} color="#DC2626" />
        <Text style={{ color: '#DC2626', fontWeight: '700' }}>Remover Alocação</Text>
      </TouchableOpacity>
    </ScrollView>
    </SafeAreaView>
  )
}
