import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { useAuth } from '@/hooks/useAuth'
import { registerForPushNotifications, savePushToken } from '@/lib/notifications'
import '../global.css'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const { session, profile, loading } = useAuth()

  useEffect(() => {
    if (!loading) SplashScreen.hideAsync()
  }, [loading])

  useEffect(() => {
    if (session?.user) {
      registerForPushNotifications().then((token) => {
        if (token) savePushToken(session.user.id, token)
      })
    }
  }, [session])

  if (loading) return null

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(restaurant)" />
        <Stack.Screen name="restaurant/[id]" options={{ headerShown: true, title: '' }} />
      </Stack>
      <StatusBar style="auto" />
    </>
  )
}
