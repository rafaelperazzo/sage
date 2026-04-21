import { useEffect } from 'react'
import { Alert } from 'react-native'
import * as Updates from 'expo-updates'

export function useAppUpdates() {
  useEffect(() => {
    if (!Updates.isEnabled) return

    async function checkUpdates() {
      try {
        const result = await Updates.checkForUpdateAsync()
        if (!result.isAvailable) return

        await Updates.fetchUpdateAsync()

        Alert.alert(
          'Atualização disponível',
          'Uma nova versão do SAGE foi baixada. Deseja recarregar agora?',
          [
            { text: 'Agora não', style: 'cancel' },
            {
              text: 'Recarregar',
              onPress: async () => {
                try {
                  await Updates.reloadAsync()
                } catch (e) {
                  Alert.alert('Erro ao atualizar', String(e))
                }
              },
            },
          ]
        )
      } catch {
        // falha silenciosa — não interrompe o uso do app
      }
    }

    void checkUpdates()
  }, [])
}
