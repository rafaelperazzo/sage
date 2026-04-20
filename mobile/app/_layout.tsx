import '../global.css'
import { Stack } from 'expo-router'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider } from '../src/contexts/AuthContext'
import { PeriodoProvider } from '../src/contexts/PeriodoContext'
import { useAppUpdates } from '../src/hooks/useAppUpdates'

export default function RootLayout() {
  useAppUpdates()
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <PeriodoProvider>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="login"
                options={{ title: 'Login', presentation: 'modal', headerShown: true }}
              />
              <Stack.Screen
                name="sobre"
                options={{ title: 'Sobre o SAGE', headerShown: true }}
              />
              <Stack.Screen
                name="map/create"
                options={{ title: 'Nova Alocação', presentation: 'modal' }}
              />
              <Stack.Screen
                name="map/[id]/edit"
                options={{ title: 'Editar Alocação', presentation: 'modal' }}
              />
              <Stack.Screen
                name="map/[id]/view"
                options={{ title: 'Alocação', presentation: 'modal' }}
              />
              <Stack.Screen
                name="auditorio/create"
                options={{ title: 'Nova Reserva', presentation: 'modal' }}
              />
              <Stack.Screen
                name="auditorio/[id]/edit"
                options={{ title: 'Editar Reserva', presentation: 'modal' }}
              />
              <Stack.Screen
                name="auditorio/[id]/view"
                options={{ title: 'Reserva', presentation: 'modal' }}
              />
              <Stack.Screen
                name="manutencao/create"
                options={{ title: 'Novo Chamado', presentation: 'modal' }}
              />
              <Stack.Screen
                name="manutencao/[id]/edit"
                options={{ title: 'Editar Chamado', presentation: 'modal' }}
              />
              <Stack.Screen
                name="manutencao/[id]/view"
                options={{ title: 'Chamado', presentation: 'modal' }}
              />
            </Stack>
          </PeriodoProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
