import { View, Text, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'

type IoniconsName = React.ComponentProps<typeof Ionicons>['name']

interface ModuleDoc {
  icon: IoniconsName
  color: string
  bg: string
  title: string
  description: string
  features: string[]
}

const MODULES: ModuleDoc[] = [
  {
    icon: 'map-outline', color: '#1D4ED8', bg: '#EFF6FF',
    title: 'SAGE Map',
    description: 'Grade semanal interativa de todas as salas do departamento.',
    features: ['Visualização por sala (13 ambientes)', 'Alocações multi-hora com altura proporcional', 'Criação e edição de alocações (admin)', 'Atualização em tempo real via Supabase Realtime'],
  },
  {
    icon: 'calendar-outline', color: '#6D28D9', bg: '#F5F3FF',
    title: 'SAGE Agenda',
    description: 'Grade de horários completa por professor.',
    features: ['Busca por nome com autocomplete', 'Grade visual semanal read-only', 'Filtro por período letivo'],
  },
  {
    icon: 'bar-chart-outline', color: '#059669', bg: '#ECFDF5',
    title: 'SAGE Report',
    description: 'Relatório de ocupação e disponibilidade das salas.',
    features: ['Gráfico de barras por sala', 'Taxa de ocupação (base: 72h/semana)', 'Detalhamento por dia da semana', 'Agrupamento por tipo (sala, inovação, lab)'],
  },
  {
    icon: 'business-outline', color: '#D97706', bg: '#FFFBEB',
    title: 'SAGE Auditório',
    description: 'Calendário mensal de reservas do auditório.',
    features: ['Calendário mensal interativo', 'Criação e edição de reservas (admin)', 'Detecção de conflito de horário', 'Relatório de utilização mensal'],
  },
  {
    icon: 'construct-outline', color: '#EA580C', bg: '#FFF7ED',
    title: 'SAGE Manutenção',
    description: 'Gerenciamento de chamados de manutenção (RTs).',
    features: ['Lista filtrada por status e texto', 'CRUD completo de chamados (admin)', 'Status: Aberto, Em andamento, Concluído, Cancelado', 'Registro de datas de abertura e conclusão'],
  },
]

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 24 }}>
      <Text style={{ fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 12 }}>{title}</Text>
      {children}
    </View>
  )
}

function ModuleCard({ mod }: { mod: ModuleDoc }) {
  return (
    <View style={{ backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: mod.bg, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={mod.icon} size={18} color={mod.color} />
        </View>
        <View>
          <Text style={{ fontSize: 14, fontWeight: '800', color: '#111827' }}>{mod.title}</Text>
          <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>{mod.description}</Text>
        </View>
      </View>
      {mod.features.map((f, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 4 }}>
          <Text style={{ color: mod.color, fontSize: 12, marginTop: 1 }}>•</Text>
          <Text style={{ fontSize: 12, color: '#374151', flex: 1 }}>{f}</Text>
        </View>
      ))}
    </View>
  )
}

export default function SobreScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }} edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Hero */}
        <View style={{ alignItems: 'center', paddingVertical: 24, marginBottom: 24, backgroundColor: '#1D4ED8', borderRadius: 20, paddingHorizontal: 20 }}>
          <Text style={{ fontSize: 40, fontWeight: '900', color: '#FFFFFF', letterSpacing: -1 }}>SAGE</Text>
          <Text style={{ fontSize: 14, color: '#BFDBFE', marginTop: 4, textAlign: 'center' }}>
            Sistema de Alocação e Gestão de Espaços
          </Text>
          <Text style={{ fontSize: 12, color: '#93C5FD', marginTop: 2 }}>
            Departamento de Computação · UFRPE
          </Text>
        </View>

        {/* Sobre */}
        <Section title="Sobre o Sistema">
          <Text style={{ fontSize: 13, color: '#374151', lineHeight: 20 }}>
            O SAGE é uma plataforma de gestão de espaços físicos do Departamento de Computação da UFRPE.
            Permite o controle de alocações de salas, agenda de professores, relatórios de ocupação,
            reservas do auditório e chamados de manutenção — tudo em tempo real.
          </Text>
        </Section>

        {/* Módulos */}
        <Section title="Módulos">
          {MODULES.map((mod) => <ModuleCard key={mod.title} mod={mod} />)}
        </Section>

      </ScrollView>
    </SafeAreaView>
  )
}
