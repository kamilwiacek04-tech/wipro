import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import clientApi from '@/store/mainApi/clientApi'
import { clientStore } from '@/store/zustand/clientStore'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import logo from '@/assets/images/logo.png'

const SetPassword = () => {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { logIn } = clientStore()

  const email = searchParams.get('email') ?? ''
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!email || !token) {
    return (
      <div className='accountContainer'>
        <div className='accountCard'>
          <p className='accountError'>{t('account.setPassword.invalidLink')}</p>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== passwordConfirmation) {
      setError(t('account.setPassword.mismatch'))
      return
    }
    if (password.length < 8) {
      setError(t('account.setPassword.tooShort'))
      return
    }
    setLoading(true)
    try {
      const res = await clientApi.post('auth/set-password', {
        token,
        email,
        password,
        password_confirmation: passwordConfirmation,
      })
      logIn(res.data.token, res.data.user)
      navigate('/konto/moje-zapytania', { replace: true })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? t('account.setPassword.error'))
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
        <h1 className='accountTitle'>{t('account.setPassword.title')}</h1>
        <p className='accountSubtitle'>{t('account.setPassword.subtitle')}</p>
        <p className='accountSubtitle' style={{ fontSize: '13px', marginTop: '-12px' }}>{email}</p>
        <form onSubmit={handleSubmit} className='accountForm'>
          <div className='accountField'>
            <label>{t('account.setPassword.password')}</label>
            <input
              type='password'
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder='min. 8 znaków'
            />
          </div>
          <div className='accountField'>
            <label>{t('account.setPassword.confirm')}</label>
            <input
              type='password'
              value={passwordConfirmation}
              onChange={e => setPasswordConfirmation(e.target.value)}
              required
              placeholder='••••••••'
            />
          </div>
          {error && <div className='accountError'>{error}</div>}
          <button type='submit' className='accountButton' disabled={loading}>
            {loading ? t('general.loading') + '...' : t('account.setPassword.submit')}
          </button>
        </form>
      </div>
    </div>
  )
}

export default SetPassword
