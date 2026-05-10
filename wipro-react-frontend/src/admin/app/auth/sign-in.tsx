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

      if (user.role !== 'admin') {
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
    <div style={{ background: 'white', borderRadius: '12px', padding: '40px', maxWidth: '480px', width: '100%', boxShadow: '0 2px 16px rgba(0,0,0,0.08)' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
        <LanguageSwitcher />
      </div>
      <img src="/logo.png" alt="Wipro" style={{ height: '48px', display: 'block', margin: '0 auto 16px' }} />
      <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a1a1a', margin: '0 0 8px', textAlign: 'center' }}>{t('auth.title')}</h1>
      <p style={{ fontSize: '14px', color: '#888', margin: '0 0 24px', textAlign: 'center' }}>{t('auth.subtitle')}</p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '13px', fontWeight: 500, color: '#555' }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="admin@wipro.pl"
            style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', background: '#f9f9f9', outline: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '13px', fontWeight: 500, color: '#555' }}>{t('auth.password')}</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', background: '#f9f9f9', outline: 'none' }}
          />
        </div>

        {error && (
          <div style={{ background: '#fff0f0', border: '1px solid #ffd0d0', borderRadius: '6px', padding: '10px 14px', fontSize: '13px', color: '#c0392b' }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{ background: '#ffb400', color: '#1a1a1a', border: 'none', borderRadius: '8px', padding: '12px 20px', fontSize: '14px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, marginTop: '8px' }}
        >
          {loading ? t('auth.loading') : t('auth.submit')}
        </button>
      </form>
    </div>
  )
}

export default SignIn
