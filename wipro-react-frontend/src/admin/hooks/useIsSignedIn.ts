import { authStore } from '@admin/store/zustand/authStore'

export default function useIsSignedIn(): boolean {
  const token = authStore((s) => s.token)
  const user = authStore((s) => s.user)
  return Boolean(token && user?.role === 'admin')
}
