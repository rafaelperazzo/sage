import { useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, useWindowDimensions, Linking, Modal } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useReservas } from '../../src/hooks/useReservas'
import { useAuthContext } from '../../src/contexts/AuthContext'
import { Ionicons } from '@expo/vector-icons'
import type { Reserva } from '../../src/types'

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function buildCalendarWeeks(ano: number, mes: number): (Date | null)[][] {
  const firstDay = new Date(ano, mes - 1, 1)
  const lastDay = new Date(ano, mes, 0)
  const weeks: (Date | null)[][] = []
  let week: (Date | null)[] = Array(firstDay.getDay()).fill(null)

  for (let d = 1; d <= lastDay.getDate(); d++) {
    week.push(new Date(ano, mes - 1, d))
    if (week.length === 7) { weeks.push(week); week = [] }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null)
    weeks.push(week)
  }
  return weeks
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function AuditorioScreen() {
  const today = new Date()
  const [ano, setAno] = useState(today.getFullYear())
  const [mes, setMes] = useState(today.getMonth() + 1)
  const [tab, setTab] = useState<'calendario' | 'relatorio'>('calendario')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const { reservas, loading } = useReservas(ano, mes)
  const { isAdmin } = useAuthContext()
  const { width } = useWindowDimensions()

  const weeks = buildCalendarWeeks(ano, mes)
  const cellW = Math.floor((width - 32) / 7)

  const reservasByDate: Record<string, Reserva[]> = {}
  for (const r of reservas) {
    if (!reservasByDate[r.data]) reservasByDate[r.data] = []
    reservasByDate[r.data]!.push(r)
  }

  function prevMes() {
    if (mes === 1) { setMes(12); setAno(ano - 1) }
    else setMes(mes - 1)
  }
  function nextMes() {
    if (mes === 12) { setMes(1); setAno(ano + 1) }
    else setMes(mes + 1)
  }

  function handleDayPress(date: Date) {
    setSelectedDate(formatDate(date))
  }

  const selectedReservas = selectedDate ? (reservasByDate[selectedDate] ?? []) : []

  function formatDateLabel(dateStr: string): string {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
  }

  const totalReservas = reservas.length
  const diasOcupados = Object.keys(reservasByDate).length
  const horasTotais = reservas.reduce((acc, r) => {
    const [h1, m1] = r.inicio.split(':').map(Number)
    const [h2, m2] = r.fim.split(':').map(Number)
    return acc + ((h2! * 60 + m2!) - (h1! * 60 + m1!)) / 60
  }, 0)

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['left', 'right', 'bottom']}>
      {/* Banner de orientação */}
      <TouchableOpacity
        onPress={() => Linking.openURL('mailto:diretoria.dc@ufrpe.br')}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 8, margin: 12, marginBottom: 0, backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A', borderRadius: 10, padding: 12 }}
      >
        <Ionicons name="mail-outline" size={18} color="#D97706" />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#92400E' }}>Como solicitar uma reserva?</Text>
          <Text style={{ fontSize: 11, color: '#78350F', marginTop: 1 }}>
            Envie um e-mail para{' '}
            <Text style={{ fontWeight: '700', textDecorationLine: 'underline' }}>diretoria.dc@ufrpe.br</Text>
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={14} color="#D97706" />
      </TouchableOpacity>

      {/* Tabs */}
      <View style={{ flexDirection: 'row', backgroundColor: '#F3F4F6', margin: 12, borderRadius: 10, padding: 3 }}>
        {(['calendario', 'relatorio'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t)}
            style={{ flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: tab === t ? '#FFFFFF' : 'transparent', alignItems: 'center' }}
          >
            <Text style={{ fontSize: 13, fontWeight: '700', color: tab === t ? '#111827' : '#6B7280' }}>
              {t === 'calendario' ? 'Calendário' : 'Relatório'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Navegação de mês */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 12 }}>
          <TouchableOpacity onPress={prevMes} style={{ padding: 8 }}>
            <Ionicons name="chevron-back" size={22} color="#374151" />
          </TouchableOpacity>
          <Text style={{ fontSize: 17, fontWeight: '800', color: '#111827' }}>
            {MESES[mes - 1]} {ano}
          </Text>
          <TouchableOpacity onPress={nextMes} style={{ padding: 8 }}>
            <Ionicons name="chevron-forward" size={22} color="#374151" />
          </TouchableOpacity>
        </View>

        {tab === 'calendario' && (
          <>
            {/* Cabeçalho dias da semana */}
            <View style={{ flexDirection: 'row', paddingHorizontal: 16, marginBottom: 4 }}>
              {DIAS_SEMANA.map((d) => (
                <View key={d} style={{ width: cellW, alignItems: 'center' }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#9CA3AF' }}>{d}</Text>
                </View>
              ))}
            </View>

            {/* Semanas */}
            {loading ? (
              <ActivityIndicator size="large" color="#D97706" style={{ marginTop: 40 }} />
            ) : (
              weeks.map((week, wi) => (
                <View key={wi} style={{ flexDirection: 'row', paddingHorizontal: 16, marginBottom: 2 }}>
                  {week.map((day, di) => {
                    if (!day) return <View key={di} style={{ width: cellW, height: 52 }} />
                    const dateStr = formatDate(day)
                    const dayReservas = reservasByDate[dateStr] ?? []
                    const hasReserva = dayReservas.length > 0
                    const isToday = dateStr === formatDate(today)
                    return (
                      <TouchableOpacity
                        key={di}
                        onPress={() => handleDayPress(day)}
                        style={{
                          width: cellW,
                          height: 52,
                          borderRadius: 8,
                          padding: 2,
                          backgroundColor: hasReserva ? '#FFFBEB' : isToday ? '#EFF6FF' : 'transparent',
                          borderWidth: isToday ? 1.5 : hasReserva ? 1 : 0,
                          borderColor: isToday ? '#2563EB' : '#FDE68A',
                          alignItems: 'center',
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={{ fontSize: 13, fontWeight: isToday ? '800' : '500', color: isToday ? '#1D4ED8' : '#374151', marginTop: 3 }}>
                          {day.getDate()}
                        </Text>
                        {hasReserva && (
                          <View style={{ backgroundColor: '#D97706', borderRadius: 3, paddingHorizontal: 4, marginTop: 1 }}>
                            <Text style={{ fontSize: 8, color: 'white', fontWeight: '700' }}>
                              {dayReservas.length}
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    )
                  })}
                </View>
              ))
            )}

            {/* Lista de reservas do mês */}
            {reservas.length > 0 && (
              <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 10 }}>
                  Reservas do mês
                </Text>
                {reservas.map((r) => (
                  <TouchableOpacity
                    key={r.id}
                    onPress={() => {
                      const path = isAdmin ? '/auditorio/[id]/edit' : '/auditorio/[id]/view'
                      router.push({ pathname: path, params: { id: r.id } } as never)
                    }}
                    style={{ backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A', borderRadius: 10, padding: 12, marginBottom: 8 }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#92400E' }}>
                        {new Date(r.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </Text>
                      <Text style={{ fontSize: 12, color: '#6B7280' }}>{r.inicio.slice(0, 5)} – {r.fim.slice(0, 5)}</Text>
                    </View>
                    {r.responsavel && (
                      <Text style={{ fontSize: 12, color: '#78350F', marginTop: 2 }}>{r.responsavel}</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}

        {tab === 'relatorio' && (
          <View style={{ paddingHorizontal: 16 }}>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
              {[
                { label: 'Reservas', value: totalReservas },
                { label: 'Dias Ocupados', value: diasOcupados },
                { label: 'Horas Totais', value: `${horasTotais.toFixed(1)}h` },
              ].map((stat) => (
                <View key={stat.label} style={{ flex: 1, backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A', borderRadius: 12, padding: 14, alignItems: 'center' }}>
                  <Text style={{ fontSize: 22, fontWeight: '900', color: '#D97706' }}>{stat.value}</Text>
                  <Text style={{ fontSize: 11, color: '#92400E', marginTop: 2 }}>{stat.label}</Text>
                </View>
              ))}
            </View>

            {reservas.length === 0 ? (
              <View style={{ alignItems: 'center', paddingTop: 40 }}>
                <Ionicons name="business-outline" size={40} color="#D1D5DB" />
                <Text style={{ color: '#9CA3AF', marginTop: 8 }}>Nenhuma reserva em {MESES[mes - 1]}</Text>
              </View>
            ) : (
              reservas.map((r) => (
                <View key={r.id} style={{ backgroundColor: '#F9FAFB', borderRadius: 10, padding: 12, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151' }}>
                      {new Date(r.data + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    </Text>
                    {r.responsavel && <Text style={{ fontSize: 11, color: '#6B7280' }}>{r.responsavel}</Text>}
                  </View>
                  <Text style={{ fontSize: 12, color: '#6B7280' }}>{r.inicio.slice(0, 5)} – {r.fim.slice(0, 5)}</Text>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      <Modal visible={selectedDate !== null} transparent animationType="slide" onRequestClose={() => setSelectedDate(null)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} activeOpacity={1} onPress={() => setSelectedDate(null)} />
        <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '60%' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: '#111827', flex: 1, textTransform: 'capitalize' }}>
              {selectedDate ? formatDateLabel(selectedDate) : ''}
            </Text>
            <TouchableOpacity onPress={() => setSelectedDate(null)}>
              <Ionicons name="close" size={22} color="#6B7280" />
            </TouchableOpacity>
          </View>
          {selectedReservas.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 32 }}>
              <Ionicons name="calendar-outline" size={36} color="#D1D5DB" />
              <Text style={{ color: '#9CA3AF', marginTop: 8, fontSize: 13 }}>Nenhuma reserva neste dia</Text>
            </View>
          ) : (
            <ScrollView style={{ marginBottom: isAdmin ? 8 : 0 }}>
              {selectedReservas.map((r) => (
                <TouchableOpacity
                  key={r.id}
                  onPress={() => {
                    setSelectedDate(null)
                    const path = isAdmin ? '/auditorio/[id]/edit' : '/auditorio/[id]/view'
                    router.push({ pathname: path, params: { id: r.id } } as never)
                  }}
                  style={{ backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A', borderRadius: 10, padding: 12, marginBottom: 8 }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#92400E' }}>
                      {r.inicio.slice(0, 5)} – {r.fim.slice(0, 5)}
                    </Text>
                    {isAdmin && <Ionicons name="pencil-outline" size={14} color="#D97706" />}
                  </View>
                  {r.responsavel && <Text style={{ fontSize: 12, color: '#78350F', marginTop: 2 }}>{r.responsavel}</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
          {isAdmin && (
            <TouchableOpacity
              onPress={() => {
                setSelectedDate(null)
                router.push({ pathname: '/auditorio/create', params: { data: selectedDate! } } as never)
              }}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#D97706', borderRadius: 12, paddingVertical: 12, marginTop: 4 }}
            >
              <Ionicons name="add" size={18} color="white" />
              <Text style={{ fontSize: 14, fontWeight: '700', color: 'white' }}>Nova reserva neste dia</Text>
            </TouchableOpacity>
          )}
        </View>
      </Modal>

      {isAdmin && (
        <TouchableOpacity
          onPress={() => router.push('/auditorio/create' as never)}
          style={{ position: 'absolute', bottom: 24, right: 20, width: 52, height: 52, borderRadius: 26, backgroundColor: '#D97706', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 4 }}
        >
          <Ionicons name="add" size={28} color="white" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  )
}
