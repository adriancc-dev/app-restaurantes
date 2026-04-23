/// <reference types="expo/types" />

// Declara process.env con las variables públicas de Expo
declare const process: {
  env: {
    readonly EXPO_PUBLIC_SUPABASE_URL: string
    readonly EXPO_PUBLIC_SUPABASE_ANON_KEY: string
    readonly NODE_ENV: 'development' | 'production' | 'test'
    readonly [key: string]: string | undefined
  }
}
