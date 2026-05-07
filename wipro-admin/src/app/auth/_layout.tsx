import { Outlet } from 'react-router'

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-[#f4f6f8] flex items-start justify-center p-10">
      <Outlet />
    </div>
  )
}

export default AuthLayout
