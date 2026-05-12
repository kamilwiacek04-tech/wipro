import { useState } from 'react'
import { useNavigate } from 'react-router'
import { authStore } from '@admin/store/zustand/authStore'
import api from '@admin/store/axiosInstance'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '@admin/components/LanguageSwitcher'

const SignIn = () => {
  const navigate = useNavigate()
  const { logIn } = authStore()
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await api.post('/auth/login', { email, password })
      const { token, user } = res.data

      if (!['admin', 'superadmin'].includes(user.role)) {
        setError(t('auth.notAdmin'))
        return
      }

      logIn(token, user)
      navigate('/dashboard', { replace: true })
    } catch {
      setError(t('auth.invalidCredentials'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      overflow: 'hidden',
      boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
      width: '100%',
    }}>
      {/* Golden top stripe */}
      <div style={{ height: '4px', background: 'linear-gradient(90deg, #ffb400, #ffd060, #ffb400)' }} />

      <div style={{ padding: '36px 40px 40px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
          <div>
            <img src="/logo.png" alt="Wipro" style={{ height: '36px', display: 'block', marginBottom: '12px' }} />
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>
              {t('auth.title')}
            </h1>
            <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>{t('auth.subtitle')}</p>
          </div>
          <LanguageSwitcher />
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="admin@wipro.pl"
              style={{
                border: '1.5px solid #e5e7eb',
                borderRadius: '10px',
                padding: '11px 14px',
                fontSize: '14px',
                background: '#f9fafb',
                outline: 'none',
                transition: 'border-color 0.15s',
                fontFamily: 'inherit',
              }}
              onFocus={e => { e.target.style.borderColor = '#ffb400'; e.target.style.background = '#fff' }}
              onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f9fafb' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {t('auth.password')}
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{
                border: '1.5px solid #e5e7eb',
                borderRadius: '10px',
                padding: '11px 14px',
                fontSize: '14px',
                background: '#f9fafb',
                outline: 'none',
                transition: 'border-color 0.15s',
                fontFamily: 'inherit',
              }}
              onFocus={e => { e.target.style.borderColor = '#ffb400'; e.target.style.background = '#fff' }}
              onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f9fafb' }}
            />
          </div>

          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '13px',
              color: '#dc2626',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? '#ffd060' : '#ffb400',
              color: '#111827',
              border: 'none',
              borderRadius: '10px',
              padding: '13px 20px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.75 : 1,
              marginTop: '4px',
              letterSpacing: '0.02em',
              fontFamily: 'inherit',
              transition: 'opacity 0.15s, transform 0.1s',
            }}
          >
            {loading ? t('auth.loading') : t('auth.submit')}
          </button>
        </form>
      </div>
    </div>
  )
}

export default SignIn
