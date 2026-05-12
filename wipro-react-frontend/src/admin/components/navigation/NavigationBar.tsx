import { Button } from '@admin/components/Button'
import LanguageSwitcher from '@admin/components/LanguageSwitcher'
import { navItems } from '@admin/constants/navigation'
import { authStore } from '@admin/store/zustand/authStore'
import { adminViewStore } from '@admin/store/zustand/adminViewStore'
import api from '@admin/store/axiosInstance'
import { LogOut, Menu, X, ChevronDown, Users } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router'

const AdminSwitcher = () => {
  const { selectedAdminId, admins, setSelectedAdminId, setAdmins } = adminViewStore()
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    api.get('/admin/admins').then(r => setAdmins(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selected = admins.find(a => a.id === selectedAdminId)
  const label = selected ? selected.name : t('nav.allAdmins')

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 10px',
          borderRadius: '8px',
          border: '1.5px solid #ffb400',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: 500,
          fontFamily: 'inherit',
          color: '#111827',
          background: selectedAdminId ? '#ffb400' : 'white',
          transition: 'background 0.15s',
        }}
      >
        <Users style={{ width: 13, height: 13 }} />
        {label}
        <ChevronDown style={{ width: 12, height: 12, opacity: 0.6, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          minWidth: 200,
          background: 'white',
          borderRadius: 10,
          border: '1px solid #e5e7eb',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          zIndex: 100,
          overflow: 'hidden',
        }}>
          <button
            onClick={() => { setSelectedAdminId(null); setOpen(false) }}
            style={{
              display: 'block',
              width: '100%',
              padding: '9px 14px',
              textAlign: 'left',
              fontSize: 13,
              fontFamily: 'inherit',
              fontWeight: selectedAdminId === null ? 600 : 400,
              color: selectedAdminId === null ? '#111827' : '#6b7280',
              background: selectedAdminId === null ? '#fffbeb' : 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={e => { if (selectedAdminId !== null) (e.currentTarget as HTMLButtonElement).style.background = '#f9fafb' }}
            onMouseLeave={e => { if (selectedAdminId !== null) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
          >
            {t('nav.allAdmins')}
          </button>
          {admins.filter(a => a.role !== 'superadmin').map(admin => (
            <button
              key={admin.id}
              onClick={() => { setSelectedAdminId(admin.id); setOpen(false) }}
              style={{
                display: 'block',
                width: '100%',
                padding: '9px 14px',
                textAlign: 'left',
                fontSize: 13,
                fontFamily: 'inherit',
                fontWeight: selectedAdminId === admin.id ? 600 : 400,
                color: selectedAdminId === admin.id ? '#111827' : '#374151',
                background: selectedAdminId === admin.id ? '#fffbeb' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                opacity: admin.is_active ? 1 : 0.5,
              }}
              onMouseEnter={e => { if (selectedAdminId !== admin.id) (e.currentTarget as HTMLButtonElement).style.background = '#f9fafb' }}
              onMouseLeave={e => { if (selectedAdminId !== admin.id) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
            >
              <span style={{ display: 'block', fontWeight: 'inherit' }}>{admin.name}</span>
              <span style={{ display: 'block', fontSize: 11, color: '#9ca3af', fontWeight: 400 }}>{admin.email}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const NavigationBar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logOut } = authStore()
  const { t } = useTranslation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const currentPath = '/' + location.pathname.split('/')[1]
  const isSuperAdmin = user?.role === 'superadmin'

  const handleLogout = () => {
    logOut()
    navigate('/auth')
  }

  const navBtn = (isActive: boolean) => ({
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: isActive ? 600 : 500,
    fontFamily: 'inherit',
    color: isActive ? '#111827' : '#374151',
    background: isActive ? '#ffb400' : 'transparent',
    transition: 'background 0.15s',
  })

  return (
    <div className="bg-white sticky top-0 z-50" style={{ boxShadow: '0 1px 0 0 rgba(0,0,0,0.06)', borderBottom: '2px solid #ffb400' }}>
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20">
        <div className="flex items-center h-[60px] xl:h-[66px] gap-8 justify-between">
          {/* Logo */}
          <div
            className="flex items-center gap-2.5 cursor-pointer select-none shrink-0"
            onClick={() => navigate('/dashboard')}
          >
            <img src="/logo.png" alt="Wipro" className="h-7 w-auto object-contain" />
            <span className="text-[11px] font-semibold uppercase" style={{ color: '#ffb400', letterSpacing: '0.18em' }}>
              Admin
            </span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = currentPath === item.path
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  style={navBtn(isActive)}
                  onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,180,0,0.12)' }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                >
                  <Icon style={{ width: 14, height: 14 }} />
                  {t(item.labelKey)}
                </button>
              )
            })}

            {isSuperAdmin && (
              <button
                onClick={() => navigate('/admins')}
                style={navBtn(currentPath === '/admins')}
                onMouseEnter={e => { if (currentPath !== '/admins') (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,180,0,0.12)' }}
                onMouseLeave={e => { if (currentPath !== '/admins') (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
              >
                <Users style={{ width: 14, height: 14 }} />
                {t('nav.admins')}
              </button>
            )}
          </nav>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {isSuperAdmin && <AdminSwitcher />}
            <LanguageSwitcher />
            <div className="flex items-center gap-2 pl-3 border-l border-gray-100">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-gray-900" style={{ background: '#ffb400' }}>
                {user?.name?.charAt(0)?.toUpperCase() ?? 'A'}
              </div>
              <span className="text-sm font-medium text-gray-700">{user?.name}</span>
            </div>
            <button
              onClick={handleLogout}
              style={{ ...navBtn(false) }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,180,0,0.12)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
            >
              <LogOut style={{ width: 14, height: 14 }} />
              {t('nav.logout')}
            </button>
          </div>

          {/* Mobile hamburger */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPath === item.path
            return (
              <button
                key={item.id}
                onClick={() => { navigate(item.path); setMobileOpen(false) }}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer text-left w-full ${isActive ? 'bg-[#ffb400] text-gray-900 font-semibold' : 'text-gray-600 hover:text-gray-900'}`}
              >
                <Icon className="h-4 w-4" />
                {t(item.labelKey)}
              </button>
            )
          })}
          <hr className="my-2 border-gray-100" />
          <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer text-left w-full">
            <LogOut className="h-4 w-4" />
            {t('nav.logout')}
          </button>
        </div>
      )}
    </div>
  )
}

export default NavigationBar
