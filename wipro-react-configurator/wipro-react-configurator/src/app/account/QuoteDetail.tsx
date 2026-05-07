import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router'
import clientApi from '@/store/mainApi/clientApi'
import { clientStore } from '@/store/zustand/clientStore'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '@/components/LanguageSwitcher'

interface Offer {
  id: number
  offer_number: string
  status: string
  total_price_net: number
  total_price_gross: number
  vat_rate: number
  sent_at: string | null
  client_response: 'accepted' | 'rejected' | null
  client_responded_at: string | null
  cancelled_at: string | null
}

interface QuoteDetail {
  id: number
  request_number: string
  status: string
  investor_name: string
  investor_email: string
  investor_phone: string | null
  investor_company: string | null
  investor_address: string | null
  investor_city: string | null
  investment_name: string | null
  stops: number | null
  pit_depth: number | null
  overhead: number | null
  drive_type: string | null
  additional_notes: string | null
  created_at: string
  offers: Offer[]
}

const statusLabel = (s: string) => ({
  new: 'Nowe', in_progress: 'W trakcie', offer_sent: 'Oferta wysłana',
  accepted: 'Zaakceptowane', rejected: 'Odrzucone', draft: 'Szkic', sent: 'Wysłana'
}[s] ?? s)

const offerStatusLabel = (s: string) => ({ draft: 'Szkic', sent: 'Wysłana', accepted: 'Zaakceptowana', rejected: 'Odrzucona', cancelled: 'Anulowana' }[s] ?? s)

const ClientQuoteDetail = () => {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [data, setData] = useState<QuoteDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [responding, setResponding] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState<Record<number, boolean>>({})
  const [editFields, setEditFields] = useState<Record<string, string>>({})
  const isEditable = data?.status === 'new'

  useEffect(() => {
    if (!clientStore.getState().token) {
      navigate('/konto/logowanie', { replace: true })
      return
    }
    clientApi.get(`quote-requests/${id}`)
      .then(res => {
        setData(res.data)
        setEditFields({
          investor_name: res.data.investor_name ?? '',
          investor_phone: res.data.investor_phone ?? '',
          investor_company: res.data.investor_company ?? '',
          investor_address: res.data.investor_address ?? '',
          investor_city: res.data.investor_city ?? '',
          investment_name: res.data.investment_name ?? '',
        })
      })
      .catch(() => navigate('/konto/moje-zapytania', { replace: true }))
      .finally(() => setLoading(false))
  }, [id])

  const handleDownloadPdf = async (offerId: number, offerNumber: string) => {
    setDownloadingPdf(prev => ({ ...prev, [offerId]: true }))
    try {
      const res = await clientApi.get(`offers/${offerId}/pdf`, { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `oferta-${offerNumber.replace(/\//g, '_')}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      alert('Błąd pobierania PDF.')
    } finally {
      setDownloadingPdf(prev => ({ ...prev, [offerId]: false }))
    }
  }

  const handleOfferResponse = async (offerId: number, action: 'accept' | 'reject') => {
    if (!window.confirm(action === 'accept' ? 'Czy na pewno chcesz zaakceptować ofertę?' : 'Czy na pewno chcesz odrzucić ofertę?')) return
    setResponding(true)
    try {
      await clientApi.post(`offers/${offerId}/respond`, { action })
      const res = await clientApi.get(`quote-requests/${id}`)
      setData(res.data)
    } catch {
      alert('Błąd. Spróbuj ponownie.')
    } finally {
      setResponding(false)
    }
  }

  const handleSave = async () => {
    if (!isEditable) return
    setSaving(true)
    try {
      const res = await clientApi.patch(`quote-requests/${id}`, editFields)
      setData(res.data)
      alert('Dane zostały zapisane.')
    } catch {
      alert('Błąd zapisu danych.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className='accountContainer'><div className='accountCard'><p className='accountLoading'>{t('general.loading')}...</p></div></div>
  if (!data) return null

  return (
    <div className='accountContainer'>
      <div className='accountCard accountCardWide'>
        <div className='accountCardHeader'>
          <Link to='/konto/moje-zapytania' className='accountBackLink'>← {t('account.myQuotes.title')}</Link>
          <LanguageSwitcher />
        </div>
        <div className='accountQuoteDetailHeader'>
          <h2 className='accountTitle'>{data.request_number}</h2>
          <span className='accountStatusBadge'>{statusLabel(data.status)}</span>
        </div>
        <p className='accountSubtitle'>{t('account.quoteDetail.submitted')}: {new Date(data.created_at).toLocaleDateString('pl-PL')}</p>

        {isEditable && (
          <div className='accountEditNotice'>
            <p>{t('account.quoteDetail.editableNote')}</p>
          </div>
        )}

        <div className='accountSection'>
          <h3 className='accountSectionTitle'>{t('account.quoteDetail.investorData')}</h3>
          <div className='accountFieldGrid'>
            {[
              { key: 'investor_name', label: t('form.data.fields.name') },
              { key: 'investor_phone', label: t('form.data.fields.phoneNumber') },
              { key: 'investor_company', label: t('account.quoteDetail.fields.company') },
              { key: 'investor_address', label: t('account.quoteDetail.fields.address') },
              { key: 'investor_city', label: t('form.data.fields.city') },
              { key: 'investment_name', label: t('account.quoteDetail.fields.investmentName') },
            ].map(({ key, label }) => (
              <div key={key} className='accountField'>
                <label>{label}</label>
                {isEditable ? (
                  <input
                    value={editFields[key] ?? ''}
                    onChange={e => setEditFields(prev => ({ ...prev, [key]: e.target.value }))}
                  />
                ) : (
                  <p className='accountFieldValue'>{(data as unknown as Record<string, string>)[key] || '—'}</p>
                )}
              </div>
            ))}
          </div>
          {isEditable && (
            <button className='accountButton' onClick={handleSave} disabled={saving}>
              {saving ? t('general.loading') + '...' : t('account.quoteDetail.save')}
            </button>
          )}
        </div>

        {data.offers.filter(o => o.status !== 'draft').length > 0 && (
          <div className='accountSection'>
            <h3 className='accountSectionTitle'>{t('account.quoteDetail.offers')}</h3>
            {data.offers.filter(o => o.status !== 'draft').map(offer => (
              <div key={offer.id} className='accountOfferItem' style={offer.status === 'cancelled' ? { opacity: 0.6, background: '#f9f9f9' } : {}}>
                <div className='accountOfferHeader'>
                  <span className='accountQuoteNumber' style={offer.status === 'cancelled' ? { textDecoration: 'line-through', color: '#999' } : {}}>{offer.offer_number}</span>
                  <span style={{ color: offer.status === 'cancelled' ? '#999' : undefined }}>{offerStatusLabel(offer.status)}</span>
                </div>
                {offer.status !== 'cancelled' && (
                  <>
                    <div className='accountOfferPrices'>
                      <span>Netto: <strong>{Number(offer.total_price_net).toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}</strong></span>
                      <span>Brutto: <strong>{Number(offer.total_price_gross).toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}</strong></span>
                    </div>
                    <button
                      className='accountButtonOutlined'
                      style={{ marginTop: 8 }}
                      disabled={!!downloadingPdf[offer.id]}
                      onClick={() => handleDownloadPdf(offer.id, offer.offer_number)}
                    >
                      {downloadingPdf[offer.id] ? t('general.loading') + '...' : '↓ PDF'}
                    </button>
                  </>
                )}
                {offer.status === 'cancelled' && offer.cancelled_at && (
                  <p style={{ fontSize: 13, marginTop: 6, color: '#999' }}>
                    ✕ Oferta anulowana · {new Date(offer.cancelled_at).toLocaleDateString('pl-PL')}
                  </p>
                )}
                {offer.sent_at && offer.status !== 'cancelled' && <p className='accountSubtitle' style={{ marginTop: 6, marginBottom: 0 }}>{t('account.quoteDetail.sentAt')}: {new Date(offer.sent_at).toLocaleDateString('pl-PL')}</p>}
                {offer.client_response && (
                  <p style={{ fontSize: 13, marginTop: 8, color: offer.client_response === 'accepted' ? '#16a34a' : '#dc2626', fontWeight: 500 }}>
                    {offer.client_response === 'accepted' ? `✓ ${t('account.quoteDetail.offerAccepted')}` : `✗ ${t('account.quoteDetail.offerRejected')}`}
                    {offer.client_responded_at && ` · ${new Date(offer.client_responded_at).toLocaleDateString('pl-PL')}`}
                  </p>
                )}
                {offer.status === 'sent' && !offer.client_response && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button
                      className='accountButton'
                      style={{ background: '#22c55e', flex: 1 }}
                      disabled={responding}
                      onClick={() => handleOfferResponse(offer.id, 'accept')}
                    >
                      {t('account.quoteDetail.acceptOffer')}
                    </button>
                    <button
                      className='accountButton'
                      style={{ background: '#ef4444', flex: 1 }}
                      disabled={responding}
                      onClick={() => handleOfferResponse(offer.id, 'reject')}
                    >
                      {t('account.quoteDetail.rejectOffer')}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {data.offers.filter(o => o.status !== 'draft').length === 0 && data.status !== 'new' && (
          <div className='accountSection'>
            <p className='accountSubtitle'>{t('account.quoteDetail.noOfferYet')}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ClientQuoteDetail
