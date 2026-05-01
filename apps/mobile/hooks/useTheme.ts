import { useEffect } from 'react'
import { useColorScheme } from 'nativewind'
import AsyncStorage from '@react-native-async-storage/async-storage'

const THEME_STORAGE_KEY = 'app-theme'

export function useTheme() {
  const { colorScheme, setColorScheme } = useColorScheme()

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark') {
        setColorScheme(stored)
      }
    }).catch(() => {})
  }, [setColorScheme])

  function toggleTheme() {
    const next = colorScheme === 'dark' ? 'light' : 'dark'
    setColorScheme(next)
    AsyncStorage.setItem(THEME_STORAGE_KEY, next).catch(() => {})
  }

  return {
    theme: colorScheme ?? 'light',
    isDark: colorScheme === 'dark',
    toggleTheme,
  }
}
