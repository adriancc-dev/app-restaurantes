import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { TouchableOpacity } from 'react-native'
import { useTheme } from '@/hooks/useTheme'

function ThemeToggleButton() {
  const { isDark, toggleTheme } = useTheme()
  return (
    <TouchableOpacity
      onPress={toggleTheme}
      accessibilityLabel={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      style={{ marginRight: 16, padding: 4 }}
    >
      <Ionicons
        name={isDark ? 'sunny-outline' : 'moon-outline'}
        size={22}
        color={isDark ? '#f97316' : '#374151'}
      />
    </TouchableOpacity>
  )
}

export default function RestaurantLayout() {
  const { isDark } = useTheme()

  const bg = isDark ? '#0f172a' : '#ffffff'
  const border = isDark ? '#1e293b' : '#f3f4f6'
  const headerTitle = isDark ? '#f1f5f9' : '#111827'

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#f97316',
        tabBarInactiveTintColor: isDark ? '#64748b' : '#9ca3af',
        tabBarStyle: { backgroundColor: bg, borderTopColor: border },
        headerStyle: { backgroundColor: bg },
        headerTitleStyle: { color: headerTitle, fontWeight: '700' },
        headerShadowVisible: false,
        headerRight: () => <ThemeToggleButton />,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Panel',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="edit"
        options={{
          title: 'Mi restaurante',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pencil-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="hours"
        options={{
          title: 'Horarios',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="reservations"
        options={{
          title: 'Reservas',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  )
}
