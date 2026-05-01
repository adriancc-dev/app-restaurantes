import AsyncStorage from '@react-native-async-storage/async-storage'

const MAX_AUTH_ATTEMPTS = 5
const AUTH_WINDOW_MS = 15 * 60 * 1000
const AUTH_LOCK_MS = 15 * 60 * 1000
const AUTH_ATTEMPTS_STORAGE_KEY = 'auth-attempts-v1'

interface AttemptBranch {
  count: number
  firstAttemptAt: number
  lockedUntil: number | null
}

interface AuthAttemptState {
  login: AttemptBranch
  register: AttemptBranch
}

function defaultBranch(): AttemptBranch {
  return { count: 0, firstAttemptAt: 0, lockedUntil: null }
}

let memState: AuthAttemptState = { login: defaultBranch(), register: defaultBranch() }
let loaded = false

export async function initAuthAttempts(): Promise<void> {
  if (loaded) return
  loaded = true
  try {
    const raw = await AsyncStorage.getItem(AUTH_ATTEMPTS_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AuthAttemptState>
      memState = {
        login: parsed.login ?? defaultBranch(),
        register: parsed.register ?? defaultBranch(),
      }
    }
  } catch {}
}

function persist(): void {
  void AsyncStorage.setItem(AUTH_ATTEMPTS_STORAGE_KEY, JSON.stringify(memState))
}

export function getLockRemainingMs(action: 'login' | 'register'): number {
  const now = Date.now()
  const branch = memState[action]
  if (!branch.lockedUntil || branch.lockedUntil <= now) return 0
  return branch.lockedUntil - now
}

export function registerAuthFailure(action: 'login' | 'register'): void {
  const now = Date.now()
  const branch = memState[action]
  const isWindowExpired = !branch.firstAttemptAt || now - branch.firstAttemptAt > AUTH_WINDOW_MS
  const nextCount = isWindowExpired ? 1 : branch.count + 1
  const shouldLock = nextCount >= MAX_AUTH_ATTEMPTS
  memState[action] = {
    count: shouldLock ? 0 : nextCount,
    firstAttemptAt: shouldLock ? 0 : (isWindowExpired ? now : branch.firstAttemptAt),
    lockedUntil: shouldLock ? now + AUTH_LOCK_MS : null,
  }
  persist()
}

export function clearAuthFailures(action: 'login' | 'register'): void {
  memState[action] = defaultBranch()
  persist()
}

export function formatRemainingMinutes(ms: number): number {
  return Math.max(1, Math.ceil(ms / 60000))
}
