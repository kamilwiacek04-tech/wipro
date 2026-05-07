import { useState } from 'react'
import { useNavigate, Link } from 'react-router'
import clientApi from '@/store/mainApi/clientApi'
import { clientStore } from '@/store/zustand/clientStore'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import logo from '@/assets/images/logo.png'

const ClientLogin = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { logIn } = clientStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await clientApi.post('auth/login', { email, password })
      const { token, user } = res.data
      if (user.role === 'admin') {
        setError('To konto jest kontem administratora.')
        return
      }
      logIn(token, user)
      navigate('/konto/moje-zapytania', { replace: true })
    } catch {
      setError('Nieprawidłowy email lub hasło.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='accountContainer'>
      <div className='accountCard'>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
          <LanguageSwitcher />
        </div>
        <img src={logo} alt='Wipro' className='accountLogo' />
        <h1 className='accountTitle'>{t('account.login.title')}</h1>
        <p className='accountSubtitle'>{t('account.login.subtitle')}</p>
        <form onSubmit={handleSubmit} className='accountForm'>
          <div className='accountField'>
            <label>{t('form.data.fields.email')}</label>
            <input type='email' value={email} onChange={e => setEmail(e.target.value)} required placeholder='twoj@email.pl' />
          </div>
          <div className='accountField'>
            <label>{t('account.login.password')}</label>
            <input type='password' value={password} onChange={e => setPassword(e.target.value)} required placeholder='••••••••' />
          </div>
          {error && <div className='accountError'>{error}</div>}
          <button type='submit' className='accountButton' disabled={loading}>
            {loading ? t('general.loading') : t('account.login.submit')}
          </button>
        </form>
        <Link to='/' className='accountBackLink'>{t('general.return')} {t('navigation.steps.data')}</Link>
      </div>
    </div>
  )
}

export default ClientLogin
