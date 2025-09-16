import { create } from 'zustand'

type AuthState = {
  isAuthenticated: boolean
  userEmail?: string
  token?: string
}

type AuthActions = {
  login: (email: string, token: string) => void
  logout: () => void
}

const STORAGE_KEY = 'workflow_auth_v1'

function loadInitialState(): AuthState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore storage read error */
  }
  return { isAuthenticated: false }
}

export const useAuthStore = create<AuthState & AuthActions>()((set) => ({
  ...loadInitialState(),
  login: (email: string, token: string) => {
    const next: AuthState = { isAuthenticated: true, userEmail: email, token }
    set(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      /* ignore storage write error */
    }
  },
  logout: () => {
    const next: AuthState = { isAuthenticated: false }
    set(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      /* ignore storage write error */
    }
  },
}))


