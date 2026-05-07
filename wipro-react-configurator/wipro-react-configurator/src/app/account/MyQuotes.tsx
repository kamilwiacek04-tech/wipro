import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router'
import clientApi from '@/store/mainApi/clientApi'
import { clientStore } from '@/store/zustand/clientStore'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import logo from '@/assets/images/logo.png'

interface QuoteRequest {
  id: number
  request_number: string
  status: string
  investor_name: string
  created_at: string
}

const statusLabel = (s: string) => ({
  new: 'Nowe', in_progress: 'W trakcie', offer_sent: 'Oferta wysłana',
  accepted: 'Zaakceptowane', rejected: 'Odrzucone'
}[s] ?? s)

const statusColor = (s: string) => ({
  new: '#f59e0b', in_progress: '#3b82f6', offer_sent: '#8b5cf6',
  accepted: '#22c55e', rejected: '#ef4444'
}[s] ?? '#9ca3af')

const ClientMyQuotes = () => {
  const { t } = useTranslation()
  const { user, logOut } = clientStore()
  const navigate = useNavigate()
  const [quotes, setQuotes] = useState<QuoteRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!clientStore.getState().token) {
      navigate('/konto/logowanie', { replace: true })
      return
    }
    clientApi.get('quote-requests')
      .then(res => setQuotes(res.data))
      .catch(() => {
        logOut()
        navigate('/konto/logowanie', { replace: true })
      })
      .finally(() => setLoading(false))
  }, [])

  const handleLogout = () => {
    clientApi.post('auth/logout').catch(() => {})
    logOut()
    navigate('/konto/logowanie', { replace: true })
  }

  return (
    <div className='accountContainer'>
      <div className='accountCard accountCardWide'>
        <div className='accountCardHeader'>
          <div>
            <img src={logo} alt='Wipro' className='accountLogo accountLogoSmall' />
          </div>
          <div className='accountUserInfo'>
            <LanguageSwitcher />
            <span className='accountUserName'>{user?.name}</span>
            <button onClick={handleLogout} className='accountLogoutBtn'>{t('account.logout')}</button>
          </div>
        </div>
        <h2 className='accountTitle'>{t('account.myQuotes.title')}</h2>
        {loading ? (
          <p className='accountLoading'>{t('general.loading')}...</p>
        ) : quotes.length === 0 ? (
          <div className='accountEmpty'>
            <p>{t('account.myQuotes.empty')}</p>
            <Link to='/' className='accountButton accountButtonInline'>{t('account.myQuotes.newQuote')}</Link>
          </div>
        ) : (
          <div className='accountQuoteList'>
            {quotes.map(q => (
              <div key={q.id} className='accountQuoteItem' onClick={() => navigate(`/konto/zapytanie/${q.id}`)}>
                <div className='accountQuoteMain'>
                  <span className='accountQuoteNumber'>{q.request_number}</span>
                  <span className='accountQuoteDate'>{new Date(q.created_at).toLocaleDateString('pl-PL')}</span>
                </div>
                <span className='accountQuoteBadge' style={{ background: statusColor(q.status) + '22', color: statusColor(q.status), borderColor: statusColor(q.status) + '44' }}>
                  {statusLabel(q.status)}
                </span>
              </div>
            ))}
          </div>
        )}
        <Link to='/' className='accountBackLink'>{t('general.return')} {t('navigation.steps.data')}</Link>
      </div>
    </div>
  )
}

export default ClientMyQuotes
