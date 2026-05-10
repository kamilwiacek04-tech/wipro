import { useNavigate, useLocation } from 'react-router'
import { navItems } from '@admin/constants/navigation'
import { Button } from '@admin/components/Button'
import { authStore } from '@admin/store/zustand/authStore'
import { LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '@admin/components/LanguageSwitcher'

const NavigationBar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logOut } = authStore()
  const { t } = useTranslation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const currentPath = '/' + location.pathname.split('/')[1]

  const handleLogout = () => {
    logOut()
    navigate('/auth')
  }

  return (
    <div className="bg-white border-b border-yellow-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20">
        <div className="flex items-center h-16 xl:h-[70px] gap-6 justify-between">
          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer select-none"
            onClick={() => navigate('/dashboard')}
          >
            <img src="/logo.png" alt="Wipro" className="h-8 w-auto object-contain" />
            <span className="font-bold text-sm text-gray-500 tracking-wide uppercase">Admin</span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = currentPath === item.path
              return (
                <Button
                  key={item.id}
                  variant={isActive ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => navigate(item.path)}
                  className="gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {t(item.labelKey)}
                </Button>
              )
            })}
          </nav>

          {/* User + logout */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher />
            <span className="text-sm text-gray-600">{user?.name}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 text-gray-500">
              <LogOut className="h-4 w-4" />
              {t('nav.logout')}
            </Button>
          </div>

          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-yellow-100 bg-white px-4 py-3 flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPath === item.path
            return (
              <Button
                key={item.id}
                variant={isActive ? 'default' : 'ghost'}
                size="sm"
                onClick={() => { navigate(item.path); setMobileOpen(false) }}
                className="gap-2 justify-start"
              >
                <Icon className="h-4 w-4" />
                {t(item.labelKey)}
              </Button>
            )
          })}
          <hr className="my-2 border-gray-100" />
          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 justify-start text-gray-500">
            <LogOut className="h-4 w-4" />
            {t('nav.logout')}
          </Button>
        </div>
      )}
    </div>
  )
}

export default NavigationBar
