import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router'
import NavigationBar from '@admin/components/navigation/NavigationBar'
import Toasts from '@admin/components/Toasts'
import useIsSignedIn from '@admin/hooks/useIsSignedIn'

const ProtectedLayout = () => {
  const isSignedIn = useIsSignedIn()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isSignedIn) {
      navigate('/auth', { replace: true })
    }
  }, [isSignedIn, navigate])

  if (!isSignedIn) return null

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <NavigationBar />
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 py-6 xl:py-8 min-w-0">
        <Outlet />
      </div>
      <Toasts />
    </div>
  )
}

export default ProtectedLayout
