import { View, Text, ScrollView } from 'react-native'
import type { ReactNode } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'

interface PageShellProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
  scrollable?: boolean
}

export function PageShell({ title, subtitle, actions, children, scrollable = true }: PageShellProps) {
  const header = (
    <View className="flex-row items-start justify-between mb-4 mt-2 px-4">
      <View className="flex-1 mr-2">
        <Text className="text-2xl font-bold text-gray-900">{title}</Text>
        {subtitle && (
          <Text className="text-sm text-gray-500 mt-1">{subtitle}</Text>
        )}
      </View>
      {actions && <View className="flex-row items-center">{actions}</View>}
    </View>
  )

  if (!scrollable) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['left', 'right', 'bottom']}>
        {header}
        <View className="flex-1">{children}</View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['left', 'right', 'bottom']}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
        {header}
        <View className="px-4">{children}</View>
      </ScrollView>
    </SafeAreaView>
  )
}
