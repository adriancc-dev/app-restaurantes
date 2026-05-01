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

function readAttemptState(): AuthAttemptState {
  if (typeof window === 'undefined') {
    return { login: defaultBranch(), register: defaultBranch() }
  }
  try {
    const raw = window.localStorage.getItem(AUTH_ATTEMPTS_STORAGE_KEY)
    if (!raw) return { login: defaultBranch(), register: defaultBranch() }
    return JSON.parse(raw) as AuthAttemptState
  } catch {
    return { login: defaultBranch(), register: defaultBranch() }
  }
}

function writeAttemptState(state: AuthAttemptState): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(AUTH_ATTEMPTS_STORAGE_KEY, JSON.stringify(state))
}

export function getLockRemainingMs(action: 'login' | 'register'): number {
  const now = Date.now()
  const state = readAttemptState()[action]
  if (!state.lockedUntil || state.lockedUntil <= now) return 0
  return state.lockedUntil - now
}

export function registerAuthFailure(action: 'login' | 'register'): void {
  const now = Date.now()
  const state = readAttemptState()
  const branch = state[action]
  const isWindowExpired = !branch.firstAttemptAt || now - branch.firstAttemptAt > AUTH_WINDOW_MS
  const nextCount = isWindowExpired ? 1 : branch.count + 1
  const shouldLock = nextCount >= MAX_AUTH_ATTEMPTS
  state[action] = {
    count: shouldLock ? 0 : nextCount,
    firstAttemptAt: shouldLock ? 0 : (isWindowExpired ? now : branch.firstAttemptAt),
    lockedUntil: shouldLock ? now + AUTH_LOCK_MS : null,
  }
  writeAttemptState(state)
}

export function clearAuthFailures(action: 'login' | 'register'): void {
  const state = readAttemptState()
  state[action] = defaultBranch()
  writeAttemptState(state)
}

export function formatRemainingMinutes(ms: number): number {
  return Math.max(1, Math.ceil(ms / 60000))
}
