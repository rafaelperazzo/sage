import { useState, useMemo, useRef } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Modal, Pressable } from 'react-native'
import { Picker } from '@react-native-picker/picker'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAlocacoes } from '../../src/hooks/useAlocacoes'
import { usePeriodo } from '../../src/contexts/PeriodoContext'
import { DIAS, HORAS, getSalaInfo, TIPO_LABEL } from '../../src/constants/salas'
import type { Alocacao } from '../../src/types'
import { AllocationCard } from '../../src/modules/map/AllocationCard'
import { timeToMinutes } from '../../src/modules/map/gridUtils'
import { Ionicons } from '@expo/vector-icons'

const ROW_HEIGHT = 52
const COL_WIDTH = 96
const HOUR_COL_WIDTH = 44
const HEADER_H = 32
const FIRST_HOUR = 7

const DIA_SHORT: Record<string, string> = {
  SEGUNDA: 'SEG', TERÇA: 'TER', QUARTA: 'QUA',
  QUINTA: 'QUI', SEXTA: 'SEX', SÁBADO: 'SÁB',
}

const DIA_LABEL: Record<string, string> = {
  SEGUNDA: 'Segunda-feira', TERÇA: 'Terça-feira', QUARTA: 'Quarta-feira',
  QUINTA: 'Quinta-feira', SEXTA: 'Sexta-feira', SÁBADO: 'Sábado',
}

const TIPO_BG: Record<string, string> = {
  sala_aula: '#EFF6FF', sala_inovacao: '#F5F3FF', laboratorio: '#ECFDF5',
}
const TIPO_TEXT: Record<string, string> = {
  sala_aula: '#1D4ED8', sala_inovacao: '#6D28D9', laboratorio: '#065F46',
}

function AlocacaoModal({ alocacao, onClose }: { alocacao: Alocacao; onClose: () => void }) {
  const salaInfo = getSalaInfo(alocacao.sala)
  const tipoBg = salaInfo ? (TIPO_BG[salaInfo.tipo] ?? '#F3F4F6') : '#F3F4F6'
  const tipoText = salaInfo ? (TIPO_TEXT[salaInfo.tipo] ?? '#374151') : '#374151'
  const tipoLabel = salaInfo ? TIPO_LABEL[salaInfo.tipo] : null

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 24 }} onPress={onClose}>
        <Pressable style={{ backgroundColor: '#FFFFFF', borderRadius: 16, width: '100%', maxWidth: 380, overflow: 'hidden' }} onPress={() => {}}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>Detalhes da Alocação</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Campos */}
          <View style={{ padding: 16, gap: 12 }}>
            {alocacao.disciplina ? (
              <View>
                <Text style={{ fontSize: 10, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>Disciplina</Text>
                <Text style={{ fontSize: 14, color: '#111827', marginTop: 2 }}>{alocacao.disciplina}</Text>
              </View>
            ) : null}
            {alocacao.professor ? (
              <View>
                <Text style={{ fontSize: 10, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>Professor</Text>
                <Text style={{ fontSize: 14, color: '#111827', marginTop: 2 }}>{alocacao.professor}</Text>
              </View>
            ) : null}
            <View>
              <Text style={{ fontSize: 10, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>Sala</Text>
              <Text style={{ fontSize: 14, color: '#111827', marginTop: 2 }}>{alocacao.sala}</Text>
            </View>
            {tipoLabel ? (
              <View>
                <Text style={{ fontSize: 10, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>Tipo</Text>
                <View style={{ marginTop: 4, alignSelf: 'flex-start', backgroundColor: tipoBg, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: tipoText }}>{tipoLabel}</Text>
                </View>
              </View>
            ) : null}
            <View>
              <Text style={{ fontSize: 10, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>Dia</Text>
              <Text style={{ fontSize: 14, color: '#111827', marginTop: 2 }}>{DIA_LABEL[alocacao.dia_semana] ?? alocacao.dia_semana}</Text>
            </View>
            <View>
              <Text style={{ fontSize: 10, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>Horário</Text>
              <Text style={{ fontSize: 14, color: '#111827', marginTop: 2 }}>{alocacao.inicio.slice(0, 5)} – {alocacao.fim.slice(0, 5)}</Text>
            </View>
            {alocacao.periodo ? (
              <View>
                <Text style={{ fontSize: 10, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>Período</Text>
                <Text style={{ fontSize: 14, color: '#111827', marginTop: 2 }}>{alocacao.periodo}</Text>
              </View>
            ) : null}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

function TeacherGrid({ alocacoes }: { alocacoes: Alocacao[] }) {
  const totalGridH = HORAS.length * ROW_HEIGHT
  const [selected, setSelected] = useState<Alocacao | null>(null)

  const byDia: Record<string, Alocacao[]> = {}
  for (const dia of DIAS) byDia[dia] = []
  for (const a of alocacoes) {
    if (byDia[a.dia_semana]) byDia[a.dia_semana]!.push(a)
  }

  return (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator style={{ height: totalGridH + HEADER_H }} contentContainerStyle={{ flexDirection: 'row' }}>
        {/* Coluna de horas */}
        <View style={{ width: HOUR_COL_WIDTH }}>
          <View style={{ height: HEADER_H }} />
          {HORAS.map((hora) => (
            <View key={hora} style={{ height: ROW_HEIGHT, justifyContent: 'flex-start', alignItems: 'center', paddingTop: 3 }}>
              <Text style={{ fontSize: 9, color: '#9CA3AF', fontFamily: 'monospace' }}>{hora}</Text>
            </View>
          ))}
        </View>

        {/* Colunas dos dias */}
        {DIAS.map((dia) => (
          <View key={dia} style={{ width: COL_WIDTH }}>
            <View style={{ height: HEADER_H, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', borderLeftWidth: 1, borderLeftColor: '#E5E7EB' }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#374151' }}>{DIA_SHORT[dia]}</Text>
            </View>
            <View style={{ position: 'relative', height: totalGridH, borderLeftWidth: 1, borderLeftColor: '#E5E7EB' }}>
              {HORAS.map((hora, idx) => (
                <View key={hora} style={{ position: 'absolute', top: idx * ROW_HEIGHT, height: ROW_HEIGHT, width: COL_WIDTH, borderBottomWidth: 0.5, borderBottomColor: '#F3F4F6' }} />
              ))}
              {byDia[dia]?.map((alocacao) => {
                const inicioMin = timeToMinutes(alocacao.inicio)
                const fimMin = timeToMinutes(alocacao.fim)
                const topOffset = (inicioMin / 60 - FIRST_HOUR) * ROW_HEIGHT
                const height = ((fimMin - inicioMin) / 60) * ROW_HEIGHT - 2
                return (
                  <TouchableOpacity
                    key={alocacao.id}
                    activeOpacity={0.7}
                    onPress={() => setSelected(alocacao)}
                    style={{ position: 'absolute', top: topOffset, height: Math.max(height, ROW_HEIGHT - 4), width: COL_WIDTH - 6, left: 3 }}
                  >
                    <AllocationCard alocacao={alocacao} compact />
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        ))}
      </ScrollView>

      {selected && <AlocacaoModal alocacao={selected} onClose={() => setSelected(null)} />}
    </>
  )
}

function normalize(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export default function AgendaScreen() {
  const { alocacoes, loading, error } = useAlocacoes()
  const { periodo, setPeriodo, periodos } = usePeriodo()
  const [query, setQuery] = useState('')
  const [selectedProfessor, setSelectedProfessor] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<TextInput>(null)

  const professores = useMemo(() => {
    const set = new Set<string>()
    for (const a of alocacoes) { if (a.professor) set.add(a.professor) }
    return Array.from(set).sort()
  }, [alocacoes])

  const suggestions = useMemo(() => {
    if (!query.trim()) return []
    const q = normalize(query)
    return professores.filter((p) => normalize(p).includes(q)).slice(0, 8)
  }, [query, professores])

  const alocacoesProfessor = useMemo(() => {
    if (!selectedProfessor) return []
    return alocacoes.filter((a) => a.professor === selectedProfessor)
  }, [alocacoes, selectedProfessor])

  function handleSelect(professor: string) {
    setQuery(professor)
    setSelectedProfessor(professor)
    setShowSuggestions(false)
    inputRef.current?.blur()
  }

  function handleQueryChange(value: string) {
    setQuery(value)
    setShowSuggestions(true)
    if (value !== selectedProfessor) setSelectedProfessor('')
  }

  function handleClear() {
    setQuery('')
    setSelectedProfessor('')
    setShowSuggestions(false)
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['left', 'right', 'bottom']}>
      {/* Filtro de período */}
      {periodos.length > 1 && (
        <View style={{ borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingHorizontal: 12 }}>
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

      {/* Busca */}
      <View style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', zIndex: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 10, paddingHorizontal: 10, gap: 8 }}>
          <Ionicons name="search-outline" size={16} color="#9CA3AF" />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={handleQueryChange}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Digite o nome do professor..."
            placeholderTextColor="#9CA3AF"
            style={{ flex: 1, padding: 10, fontSize: 13, color: '#111827' }}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={handleClear}>
              <Ionicons name="close-circle" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Sugestões */}
        {showSuggestions && suggestions.length > 0 && (
          <View style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, marginTop: 4, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 }}>
            {suggestions.map((p, idx) => (
              <TouchableOpacity
                key={p}
                onPress={() => handleSelect(p)}
                style={{ paddingHorizontal: 14, paddingVertical: 12, borderTopWidth: idx > 0 ? 0.5 : 0, borderTopColor: '#F3F4F6', backgroundColor: '#FFFFFF' }}
              >
                <Text style={{ fontSize: 13, color: '#111827' }}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Conteúdo */}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#7C3AED" />
        </View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <Text style={{ color: '#DC2626', textAlign: 'center' }}>{error}</Text>
        </View>
      ) : !selectedProfessor ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <Ionicons name="search" size={48} color="#E5E7EB" />
          <Text style={{ color: '#9CA3AF', marginTop: 12, fontSize: 14, textAlign: 'center' }}>
            Pesquise e selecione um professor para ver a grade.
          </Text>
          <Text style={{ color: '#C4B5FD', marginTop: 6, fontSize: 12 }}>
            {professores.length} professores disponíveis
          </Text>
        </View>
      ) : alocacoesProfessor.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <Ionicons name="calendar-outline" size={40} color="#E5E7EB" />
          <Text style={{ color: '#9CA3AF', marginTop: 8, textAlign: 'center' }}>
            Nenhuma alocação encontrada para {selectedProfessor}.
          </Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <View style={{ paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#F5F3FF', borderBottomWidth: 1, borderBottomColor: '#DDD6FE' }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#6D28D9' }}>{selectedProfessor}</Text>
            <Text style={{ fontSize: 11, color: '#7C3AED' }}>{alocacoesProfessor.length} alocação(ões)</Text>
          </View>
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator>
            <TeacherGrid alocacoes={alocacoesProfessor} />
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  )
}
