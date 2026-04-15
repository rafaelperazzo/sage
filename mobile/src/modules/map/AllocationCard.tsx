import { View, Text } from 'react-native'
import type { Alocacao } from '../../types'
import { getSalaInfo } from '../../constants/salas'

const TIPO_BG: Record<string, string> = {
  sala_aula: '#EFF6FF',
  sala_inovacao: '#F5F3FF',
  laboratorio: '#ECFDF5',
}

const TIPO_BORDER: Record<string, string> = {
  sala_aula: '#BFDBFE',
  sala_inovacao: '#DDD6FE',
  laboratorio: '#A7F3D0',
}

const TIPO_TEXT: Record<string, string> = {
  sala_aula: '#1D4ED8',
  sala_inovacao: '#6D28D9',
  laboratorio: '#065F46',
}

interface AllocationCardProps {
  alocacao: Alocacao
  compact?: boolean
}

export function AllocationCard({ alocacao, compact = false }: AllocationCardProps) {
  const info = getSalaInfo(alocacao.sala)
  const tipo = info?.tipo ?? 'sala_aula'

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: TIPO_BG[tipo],
        borderLeftWidth: 3,
        borderLeftColor: TIPO_TEXT[tipo],
        borderRadius: 4,
        padding: compact ? 3 : 6,
        overflow: 'hidden',
      }}
    >
      <Text
        style={{
          fontSize: compact ? 9 : 11,
          fontWeight: '700',
          color: TIPO_TEXT[tipo],
          lineHeight: compact ? 12 : 14,
        }}
        numberOfLines={compact ? 2 : 3}
      >
        {alocacao.disciplina}
      </Text>
      {!compact && alocacao.professor && (
        <Text style={{ fontSize: 9, color: '#6B7280', marginTop: 1 }} numberOfLines={1}>
          {alocacao.professor}
        </Text>
      )}
      {!compact && (
        <Text style={{ fontSize: 9, color: '#9CA3AF', marginTop: 1 }}>
          {alocacao.inicio}–{alocacao.fim}
        </Text>
      )}
    </View>
  )
}
