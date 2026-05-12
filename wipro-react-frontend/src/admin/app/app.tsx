import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { authStore } from '@admin/store/zustand/authStore'

const App = () => {
  const navigate = useNavigate()
  const token = authStore((s) => s.token)
  const user = authStore((s) => s.user)

  useEffect(() => {
    if (token && ['admin', 'superadmin'].includes(user?.role ?? '')) {
      navigate('/dashboard', { replace: true })
    } else {
      navigate('/auth', { replace: true })
    }
  }, [token, user, navigate])

  return null
}

export default App
