import { View, Text, ScrollView, Pressable, useWindowDimensions } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAuthContext } from '../../src/contexts/AuthContext'

type IoniconsName = React.ComponentProps<typeof Ionicons>['name']

interface Module {
  route: string
  icon: IoniconsName
  iconBg: string
  iconColor: string
  borderColor: string
  title: string
}

const MODULES: Module[] = [
  { route: '/(tabs)/map',       icon: 'map-outline',       iconBg: '#EFF6FF', iconColor: '#1D4ED8', borderColor: '#BFDBFE', title: 'SAGE Map' },
  { route: '/(tabs)/agenda',    icon: 'calendar-outline',  iconBg: '#F5F3FF', iconColor: '#6D28D9', borderColor: '#DDD6FE', title: 'SAGE Agenda' },
  { route: '/(tabs)/report',    icon: 'bar-chart-outline', iconBg: '#ECFDF5', iconColor: '#065F46', borderColor: '#A7F3D0', title: 'SAGE Report' },
  { route: '/(tabs)/auditorio', icon: 'business-outline',  iconBg: '#FFFBEB', iconColor: '#92400E', borderColor: '#FDE68A', title: 'SAGE Auditório' },
  { route: '/(tabs)/manutencao',icon: 'construct-outline', iconBg: '#FFF7ED', iconColor: '#9A3412', borderColor: '#FED7AA', title: 'SAGE Manutenção' },
]

function ModuleCard({ item, cellWidth }: { item: Module; cellWidth: number }) {
  return (
    <Pressable
      onPress={() => router.push(item.route as never)}
      style={({ pressed }) => ({
        width: cellWidth,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: item.borderColor,
        borderRadius: 16,
        paddingVertical: 20,
        paddingHorizontal: 8,
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
          width: 52,
          height: 52,
          borderRadius: 16,
          backgroundColor: item.iconBg,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 10,
        }}
      >
        <Ionicons name={item.icon} size={26} color={item.iconColor} />
      </View>
      <Text style={{ fontSize: 13, fontWeight: '700', color: '#111827', textAlign: 'center' }}>
        {item.title}
      </Text>
    </Pressable>
  )
}

export default function HomeScreen() {
  const { width } = useWindowDimensions()
  const { isAdmin, signOut } = useAuthContext()
  const cardWidth = Math.min(width - 40, 480)

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }} edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 20 }}>
        <View style={{ alignItems: 'center', paddingVertical: 24, paddingHorizontal: 16, marginBottom: 8, width: cardWidth }}>
          <Text style={{ fontSize: 36, fontWeight: '900', color: '#111827', letterSpacing: -1 }}>
            SAGE
          </Text>
          <Text style={{ fontSize: 15, color: '#6B7280', marginTop: 4, textAlign: 'center' }}>
            Sistema de Alocação e Gestão de Espaços
          </Text>
          <Text style={{ fontSize: 13, color: '#9CA3AF', marginTop: 2 }}>
            Departamento de Computação · UFRPE
          </Text>

          {isAdmin ? (
            <Pressable
              onPress={() => void signOut()}
              style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#FEE2E2', borderRadius: 20 }}
            >
              <Ionicons name="log-out-outline" size={16} color="#DC2626" />
              <Text style={{ marginLeft: 6, fontSize: 13, fontWeight: '600', color: '#DC2626' }}>Sair do modo admin</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => router.push('/login')}
              style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#EFF6FF', borderRadius: 20 }}
            >
              <Ionicons name="lock-closed-outline" size={16} color="#1D4ED8" />
              <Text style={{ marginLeft: 6, fontSize: 13, fontWeight: '600', color: '#1D4ED8' }}>Entrar como administrador</Text>
            </Pressable>
          )}

          <Pressable
            onPress={() => router.push('/sobre')}
            style={{ marginTop: 10, paddingVertical: 6 }}
          >
            <Text style={{ fontSize: 13, color: '#9CA3AF' }}>Sobre o SAGE</Text>
          </Pressable>
        </View>
        <View style={{ width: cardWidth }}>
          {[0, 3].map((startIdx) => {
            const row = MODULES.slice(startIdx, startIdx + 3)
            const cellW = (cardWidth - 48) / 3
            return (
              <View
                key={startIdx}
                style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 24 }}
              >
                {row.map((item, i) => (
                  <View key={item.route} style={{ marginLeft: i > 0 ? 24 : 0 }}>
                    <ModuleCard item={item} cellWidth={cellW} />
                  </View>
                ))}
              </View>
            )
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
