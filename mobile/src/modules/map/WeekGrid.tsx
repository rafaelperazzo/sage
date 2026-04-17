import { useRef } from 'react'
import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import type { Alocacao } from '../../types'
import { DIAS, HORAS } from '../../constants/salas'
import { timeToMinutes } from './gridUtils'
import { AllocationCard } from './AllocationCard'

const ROW_HEIGHT = 52
const COL_WIDTH = 96
const HOUR_COL_WIDTH = 44
const HEADER_H = 32
const FIRST_HOUR = 7 // 07:00

interface WeekGridProps {
  alocacoes: Alocacao[]
  isAdmin: boolean
  onCellPress: (alocacao: Alocacao) => void
  onEmptyCellPress: (dia: string, hora: string) => void
}

const DIA_SHORT: Record<string, string> = {
  SEGUNDA: 'SEG',
  TERÇA: 'TER',
  QUARTA: 'QUA',
  QUINTA: 'QUI',
  SEXTA: 'SEX',
  SÁBADO: 'SÁB',
}

export function WeekGrid({ alocacoes, isAdmin, onCellPress, onEmptyCellPress }: WeekGridProps) {
  const scrollRef = useRef<ScrollView>(null)
  const totalGridH = HORAS.length * ROW_HEIGHT

  // Agrupar alocações por dia
  const byDia: Record<string, Alocacao[]> = {}
  for (const dia of DIAS) byDia[dia] = []
  for (const a of alocacoes) {
    if (byDia[a.dia_semana]) byDia[a.dia_semana]!.push(a)
  }

  const totalH = totalGridH + HEADER_H

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator
      style={{ height: totalH }}
      contentContainerStyle={{ flexDirection: 'row' }}
    >
      {/* Coluna de horas */}
      <View style={{ width: HOUR_COL_WIDTH }}>
        <View style={{ height: HEADER_H }} />
        {HORAS.map((hora) => (
          <View
            key={hora}
            style={{
              height: ROW_HEIGHT,
              justifyContent: 'flex-start',
              alignItems: 'center',
              paddingTop: 3,
            }}
          >
            <Text style={{ fontSize: 9, color: '#9CA3AF', fontFamily: 'monospace' }}>
              {hora}
            </Text>
          </View>
        ))}
      </View>

      {/* Colunas dos dias */}
      {DIAS.map((dia) => (
        <View key={dia} style={{ width: COL_WIDTH }}>
          {/* Cabeçalho do dia */}
          <View
            style={{
              height: HEADER_H,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: '#F9FAFB',
              borderBottomWidth: 1,
              borderBottomColor: '#E5E7EB',
              borderLeftWidth: 1,
              borderLeftColor: '#E5E7EB',
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#374151' }}>
              {DIA_SHORT[dia]}
            </Text>
          </View>

          {/* Área da grade — relative container */}
          <View
            style={{
              position: 'relative',
              height: totalGridH,
              borderLeftWidth: 1,
              borderLeftColor: '#E5E7EB',
            }}
          >
            {/* Células vazias */}
            {HORAS.map((hora, idx) => (
              <TouchableOpacity
                key={hora}
                activeOpacity={isAdmin ? 0.5 : 1}
                style={{
                  position: 'absolute',
                  top: idx * ROW_HEIGHT,
                  height: ROW_HEIGHT,
                  width: COL_WIDTH,
                  borderBottomWidth: 0.5,
                  borderBottomColor: '#F3F4F6',
                }}
                onPress={() => {
                  if (isAdmin) onEmptyCellPress(dia, hora)
                }}
              />
            ))}

            {/* Blocos de alocação — absolute, altura proporcional */}
            {byDia[dia]?.map((alocacao) => {
              const inicioMin = timeToMinutes(alocacao.inicio)
              const fimMin = timeToMinutes(alocacao.fim)
              const topOffset = (inicioMin / 60 - FIRST_HOUR) * ROW_HEIGHT
              const height = ((fimMin - inicioMin) / 60) * ROW_HEIGHT - 2

              return (
                <TouchableOpacity
                  key={alocacao.id}
                  style={{
                    position: 'absolute',
                    top: topOffset,
                    height: Math.max(height, ROW_HEIGHT - 4),
                    width: COL_WIDTH - 6,
                    left: 3,
                  }}
                  onPress={() => onCellPress(alocacao)}
                  activeOpacity={0.7}
                >
                  <AllocationCard alocacao={alocacao} compact />
                </TouchableOpacity>
              )
            })}
          </View>
        </View>
      ))}
    </ScrollView>
  )
}
