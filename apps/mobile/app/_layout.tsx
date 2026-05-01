import { useEffect } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import * as Sentry from '@sentry/react-native'
import { useAuth } from '@/hooks/useAuth'
import { registerForPushNotifications, savePushToken } from '@/lib/notifications'
import '../global.css'

SplashScreen.preventAutoHideAsync()

const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: __DEV__ ? 'development' : 'production',
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
    beforeSend(event) {
      if (event.extra) {
        for (const key of ['password', 'token', 'access_token', 'refresh_token']) {
          if (key in event.extra) event.extra[key] = '[Filtered]'
        }
      }
      return event
    },
  })
}

function RootLayout() {
  const { session, loading } = useAuth()

  useEffect(() => {
    if (!loading) void SplashScreen.hideAsync()
  }, [loading])

  useEffect(() => {
    if (session?.user) {
      void registerForPushNotifications().then((token) => {
        if (token) void savePushToken(session.user.id, token)
      })
      if (sentryDsn) Sentry.setUser({ id: session.user.id })
    } else if (sentryDsn) {
      Sentry.setUser(null)
    }
  }, [session])

  if (loading) {
    return (
      <View className="flex-1 bg-primary-500 items-center justify-center">
        <ActivityIndicator size="large" color="white" />
      </View>
    )
  }

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

export default sentryDsn ? Sentry.wrap(RootLayout) : RootLayout
