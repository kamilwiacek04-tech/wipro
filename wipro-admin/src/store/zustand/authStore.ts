import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthUser {
  id: number
  name: string
  email: string
  role: string
}

interface AuthState {
  token: string | null
  user: AuthUser | null
  logIn: (token: string, user: AuthUser) => void
  logOut: () => void
}

export const authStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      logIn: (token, user) => set({ token, user }),
      logOut: () => set({ token: null, user: null }),
    }),
    { name: 'wipro-admin-auth' },
  ),
)
