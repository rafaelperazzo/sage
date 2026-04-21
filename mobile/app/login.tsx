import { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useAuthContext } from '../src/contexts/AuthContext'
import { Ionicons } from '@expo/vector-icons'

export default function LoginScreen() {
  const { signIn, isAdmin } = useAuthContext()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (isAdmin) router.replace('/(tabs)')
  }, [isAdmin])

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      setError('Preencha e-mail e senha.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await signIn(email.trim(), password)
      router.replace('/(tabs)')
    } catch {
      setError('Credenciais inválidas. Verifique e-mail e senha.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 bg-white px-6 pt-12 pb-8">
          {/* Header */}
          <View className="items-center mb-10">
            <View className="w-16 h-16 bg-blue-600 rounded-2xl items-center justify-center mb-4">
              <Ionicons name="shield-checkmark" size={32} color="white" />
            </View>
            <Text className="text-2xl font-bold text-gray-900">Acesso Administrativo</Text>
            <Text className="text-sm text-gray-500 mt-1 text-center">
              Entre com suas credenciais para gerenciar o SAGE
            </Text>
          </View>

          {/* Error Banner */}
          {error && (
            <View className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex-row items-center">
              <Ionicons name="alert-circle" size={18} color="#DC2626" />
              <Text className="text-red-700 text-sm ml-2 flex-1">{error}</Text>
            </View>
          )}

          {/* Form */}
          <View className="gap-y-4">
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">E-mail</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="admin@exemplo.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                className="border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900 bg-gray-50"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Senha</Text>
              <View className="flex-row items-center border border-gray-300 rounded-xl bg-gray-50">
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="password"
                  className="flex-1 px-4 py-3 text-base text-gray-900"
                  placeholderTextColor="#9CA3AF"
                  onSubmitEditing={handleLogin}
                  returnKeyType="go"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  className="pr-4"
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#6B7280"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              className="bg-blue-600 rounded-xl py-4 items-center mt-2"
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-base">Entrar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
