import { View, Text, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'

export default function NotFoundScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: '#FFFFFF' }}>
      <Text style={{ fontSize: 48, fontWeight: '900', color: '#E5E7EB' }}>404</Text>
      <Text style={{ fontSize: 18, fontWeight: '700', color: '#374151', marginTop: 8 }}>Página não encontrada</Text>
      <TouchableOpacity
        onPress={() => router.replace('/(tabs)')}
        style={{ marginTop: 20, backgroundColor: '#2563EB', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
      >
        <Text style={{ color: 'white', fontWeight: '700' }}>Voltar ao início</Text>
      </TouchableOpacity>
    </View>
  )
}
