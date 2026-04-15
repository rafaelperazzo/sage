import { View, Text, FlatList, Pressable, useWindowDimensions } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'

type IoniconsName = React.ComponentProps<typeof Ionicons>['name']

interface Module {
  route: string
  icon: IoniconsName
  iconBg: string
  iconColor: string
  borderColor: string
  title: string
  description: string
  accentColor: string
}

const MODULES: Module[] = [
  {
    route: '/(tabs)/map',
    icon: 'map-outline',
    iconBg: '#EFF6FF',
    iconColor: '#1D4ED8',
    borderColor: '#BFDBFE',
    title: 'SAGE Map',
    description: 'Grade semanal de todas as salas do departamento, com alocações em tempo real.',
    accentColor: '#2563EB',
  },
  {
    route: '/(tabs)/agenda',
    icon: 'calendar-outline',
    iconBg: '#F5F3FF',
    iconColor: '#6D28D9',
    borderColor: '#DDD6FE',
    title: 'SAGE Agenda',
    description: 'Consulte a grade de horários completa de qualquer professor do departamento.',
    accentColor: '#7C3AED',
  },
  {
    route: '/(tabs)/report',
    icon: 'bar-chart-outline',
    iconBg: '#ECFDF5',
    iconColor: '#065F46',
    borderColor: '#A7F3D0',
    title: 'SAGE Report',
    description: 'Relatório de ocupação e disponibilidade de todas as salas por período letivo.',
    accentColor: '#059669',
  },
  {
    route: '/(tabs)/auditorio',
    icon: 'business-outline',
    iconBg: '#FFFBEB',
    iconColor: '#92400E',
    borderColor: '#FDE68A',
    title: 'SAGE Auditório',
    description: 'Calendário mensal de reservas do auditório com relatório de utilização.',
    accentColor: '#D97706',
  },
  {
    route: '/(tabs)/manutencao',
    icon: 'construct-outline',
    iconBg: '#FFF7ED',
    iconColor: '#9A3412',
    borderColor: '#FED7AA',
    title: 'SAGE Manutenção',
    description: 'Lista de solicitações de manutenção (RTs) com filtros e status atualizado.',
    accentColor: '#EA580C',
  },
]

function ModuleCard({ item, width }: { item: Module; width: number }) {
  return (
    <Pressable
      onPress={() => router.push(item.route as never)}
      style={({ pressed }) => ({
        width: width,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: item.borderColor,
        borderRadius: 16,
        padding: 16,
        margin: 6,
        opacity: pressed ? 0.85 : 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
      })}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: item.iconBg,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 12,
        }}
      >
        <Ionicons name={item.icon} size={20} color={item.iconColor} />
      </View>
      <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 4 }}>
        {item.title}
      </Text>
      <Text style={{ fontSize: 12, color: '#6B7280', lineHeight: 18, marginBottom: 12 }}>
        {item.description}
      </Text>
      <Text style={{ fontSize: 12, fontWeight: '600', color: item.accentColor }}>
        Acessar →
      </Text>
    </Pressable>
  )
}

export default function HomeScreen() {
  const { width } = useWindowDimensions()
  const numColumns = width >= 600 ? 3 : 2
  const cardWidth = (width - 48) / numColumns - 12

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }} edges={['left', 'right', 'bottom']}>
      <FlatList
        data={MODULES}
        numColumns={numColumns}
        key={numColumns}
        keyExtractor={(item) => item.route}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={
          <View style={{ alignItems: 'center', paddingVertical: 24, paddingHorizontal: 16 }}>
            <Text style={{ fontSize: 36, fontWeight: '900', color: '#111827', letterSpacing: -1 }}>
              SAGE
            </Text>
            <Text style={{ fontSize: 15, color: '#6B7280', marginTop: 4, textAlign: 'center' }}>
              Sistema de Alocação e Gestão de Espaços
            </Text>
            <Text style={{ fontSize: 13, color: '#9CA3AF', marginTop: 2 }}>
              Departamento de Computação · UFRPE
            </Text>
          </View>
        }
        renderItem={({ item }) => <ModuleCard item={item} width={cardWidth} />}
      />
    </SafeAreaView>
  )
}
