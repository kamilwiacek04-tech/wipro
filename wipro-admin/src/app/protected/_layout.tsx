import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router'
import NavigationBar from '@/components/navigation/NavigationBar'
import useIsSignedIn from '@/hooks/useIsSignedIn'

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
    </div>
  )
}

export default ProtectedLayout
