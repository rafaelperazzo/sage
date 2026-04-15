import { Tabs, router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { TouchableOpacity, Text } from 'react-native'
import { useAuthContext } from '../../src/contexts/AuthContext'
import { usePeriodo } from '../../src/contexts/PeriodoContext'
import { Picker } from '@react-native-picker/picker'

type IoniconsName = React.ComponentProps<typeof Ionicons>['name']

function PeriodoPicker() {
  const { periodo, periodos, setPeriodo } = usePeriodo()

  if (periodos.length === 0) return null

  return (
    <Picker
      selectedValue={periodo}
      onValueChange={(val) => setPeriodo(val)}
      style={{ width: 110, color: '#1D4ED8', marginRight: 4 }}
      dropdownIconColor="#1D4ED8"
      mode="dropdown"
    >
      {periodos.map((p) => (
        <Picker.Item key={p} label={p} value={p} />
      ))}
    </Picker>
  )
}

function LoginButton() {
  const { isAdmin, signOut } = useAuthContext()

  if (isAdmin) {
    return (
      <TouchableOpacity onPress={() => void signOut()} style={{ marginRight: 12 }}>
        <Text style={{ color: '#1D4ED8', fontWeight: '600', fontSize: 13 }}>Sair</Text>
      </TouchableOpacity>
    )
  }

  return (
    <TouchableOpacity onPress={() => router.push('/login')} style={{ marginRight: 12 }}>
      <Text style={{ color: '#1D4ED8', fontWeight: '600', fontSize: 13 }}>Admin</Text>
    </TouchableOpacity>
  )
}

function tabIcon(name: IoniconsName) {
  return ({ color }: { color: string }) => (
    <Ionicons name={name} size={22} color={color} />
  )
}

export default function TabsLayout() {
  const { isAdmin } = useAuthContext()

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: { borderTopColor: '#E5E7EB' },
        headerStyle: { backgroundColor: '#1D4ED8' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarLabel: 'Início',
          tabBarIcon: tabIcon('home-outline'),
          headerRight: () => <LoginButton />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'SAGE Map',
          tabBarLabel: 'Map',
          tabBarIcon: tabIcon('map-outline'),
          headerRight: () => (
            <>
              <PeriodoPicker />
              {isAdmin && (
                <Text style={{ color: '#FDE68A', fontWeight: '700', fontSize: 11, marginRight: 8 }}>
                  ADMIN
                </Text>
              )}
            </>
          ),
        }}
      />
      <Tabs.Screen
        name="agenda"
        options={{
          title: 'SAGE Agenda',
          tabBarLabel: 'Agenda',
          tabBarIcon: tabIcon('calendar-outline'),
          headerRight: () => <PeriodoPicker />,
        }}
      />
      <Tabs.Screen
        name="report"
        options={{
          title: 'SAGE Report',
          tabBarLabel: 'Report',
          tabBarIcon: tabIcon('bar-chart-outline'),
          headerRight: () => <PeriodoPicker />,
        }}
      />
      <Tabs.Screen
        name="auditorio"
        options={{
          title: 'SAGE Auditório',
          tabBarLabel: 'Auditório',
          tabBarIcon: tabIcon('business-outline'),
          headerRight: () => isAdmin ? (
            <Text style={{ color: '#FDE68A', fontWeight: '700', fontSize: 11, marginRight: 8 }}>
              ADMIN
            </Text>
          ) : null,
        }}
      />
      <Tabs.Screen
        name="manutencao"
        options={{
          title: 'SAGE Manutenção',
          tabBarLabel: 'Manutenção',
          tabBarIcon: tabIcon('construct-outline'),
          headerRight: () => isAdmin ? (
            <Text style={{ color: '#FDE68A', fontWeight: '700', fontSize: 11, marginRight: 8 }}>
              ADMIN
            </Text>
          ) : null,
        }}
      />
    </Tabs>
  )
}
