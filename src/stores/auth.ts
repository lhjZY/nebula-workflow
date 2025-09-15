import { create } from 'zustand'

type AuthState = {
  isAuthenticated: boolean
  userEmail?: string
}

type AuthActions = {
  login: (email: string) => void
  logout: () => void
}

const STORAGE_KEY = 'workflow_auth_v1'

function loadInitialState(): AuthState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { isAuthenticated: false }
}

export const useAuthStore = create<AuthState & AuthActions>()((set) => ({
  ...loadInitialState(),
  login: (email: string) => {
    const next: AuthState = { isAuthenticated: true, userEmail: email }
    set(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {}
  },
  logout: () => {
    const next: AuthState = { isAuthenticated: false }
    set(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {}
  },
}))


