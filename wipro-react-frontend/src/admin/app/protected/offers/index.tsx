import { useEffect, useState } from 'react'
import { Card } from '@admin/components/Cards'
import { Button } from '@admin/components/Button'
import { Badge, statusBadge, statusLabel } from '@admin/components/Badge'
import SkeletonLoader from '@admin/components/SkeletonLoader'
import MainLayout from '@admin/components/layout/MainLayout'
import MainHeader from '@admin/components/layout/MainHeader'
import api from '@admin/store/axiosInstance'
import { adminViewStore } from '@admin/store/zustand/adminViewStore'
import { authStore } from '@admin/store/zustand/authStore'
import formatDate from '@admin/functions/formatDate'
import { Plus, RefreshCw, X, Check, Trash2, Link, Share2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

interface OfferItem {
  description: string
  quantity: number
  unit: string
  unit_price_net: number
}

interface Offer {
  id: number
  offer_number: string
  status: string
  total_price_gross: number
  total_price_net: number
  vat_rate: number
  valid_until: string | null
  created_at: string
  client_name: string | null
  client_email: string | null
  quote_request_id: number | null
  quote_request?: { request_number: string; investor_name: string } | null
  created_by?: { id: number; name: string } | null
  shared_admin_ids?: number[]
}

interface Paginated {
  data: Offer[]
  current_page: number
  last_page: number
  total: number
}

const emptyItem = (): OfferItem => ({ description: '', quantity: 1, unit: 'szt.', unit_price_net: 0 })

const formatPrice = (val: number) =>
  new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(val)

const STATUS_VALUES = ['', 'draft', 'sent', 'accepted', 'rejected', 'cancelled']

const OffersPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { selectedAdminId } = adminViewStore()
  const { user } = authStore()

  const [data, setData] = useState<Paginated | null>(null)
  const [loading, setLoading] = useState(true)
  const [_page, setPage] = useState(1)
  const [status, setStatus] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState({
    client_name: '',
    client_email: '',
    valid_until: '',
    vat_rate: '23',
    notes: '',
  })
  const [items, setItems] = useState<OfferItem[]>([emptyItem()])

  const [shareModalOfferId, setShareModalOfferId] = useState<number | null>(null)
  const [shareAdminIds, setShareAdminIds] = useState<number[]>([])
  const [allAdmins, setAllAdmins] = useState<{ id: number; name: string; role: string }[]>([])
  const [sharing, setSharing] = useState(false)

  const load = (p = 1, st = status) => {
    setLoading(true)
    const params: Record<string, string | number> = { page: p }
    if (st) params.status = st
    if (selectedAdminId) params.admin_id = selectedAdminId
    api.get('/admin/offers', { params })
      .then(res => setData(res.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(1) }, [selectedAdminId])

  const handleStatusChange = (st: string) => {
    setStatus(st)
    setPage(1)
    load(1, st)
  }

  const handlePage = (p: number) => {
    setPage(p)
    load(p)
  }

  const addItem = () => setItems(prev => [...prev, emptyItem()])

  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx))

  const updateItem = (idx: number, field: keyof OfferItem, value: string | number) => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }

  const totalNet = items.reduce((sum, item) => sum + item.quantity * item.unit_price_net, 0)
  const vatRate = parseFloat(form.vat_rate || '23') || 23
  const totalGross = totalNet * (1 + vatRate / 100)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setSaving(true)
    try {
      await api.post('/admin/offers', {
        client_name: form.client_name,
        client_email: form.client_email || undefined,
        notes: form.notes || undefined,
        valid_until: form.valid_until || undefined,
        vat_rate: vatRate,
        items: items.map((item, idx) => ({ ...item, sort_order: idx + 1 })),
      })
      setShowForm(false)
      setForm({ client_name: '', client_email: '', valid_until: '', vat_rate: '23', notes: '' })
      setItems([emptyItem()])
      load(1)
    } catch (err: any) {
      setFormError(err?.response?.data?.message ?? t('offers.errorCreate'))
    } finally {
      setSaving(false)
    }
  }

  const openShareModal = async (offer: Offer) => {
    setShareModalOfferId(offer.id)
    setShareAdminIds(offer.shared_admin_ids ?? [])
    if (allAdmins.length === 0) {
      const res = await api.get('/admin/admins')
      setAllAdmins(res.data.filter((a: { id: number; role: string }) => a.role === 'admin'))
    }
  }

  const saveShare = async () => {
    if (shareModalOfferId === null) return
    setSharing(true)
    try {
      await api.post(`/admin/offers/${shareModalOfferId}/share`, { admin_ids: shareAdminIds })
      setShareModalOfferId(null)
      load()
    } finally {
      setSharing(false)
    }
  }

  const clientLabel = (offer: Offer) =>
    offer.client_name ?? offer.quote_request?.investor_name ?? '—'

  return (
    <MainLayout headerComponent={
      <MainHeader title={t('offers.title')} subTitle={data ? t('offers.subtitle', { count: data.total }) : undefined}>
        <Button size="sm" variant="outline" onClick={() => load(1)}>
          <RefreshCw className="h-4 w-4" />
          {t('common.refresh')}
        </Button>
        <Button size="sm" onClick={() => { setShowForm(true); setFormError('') }}>
          <Plus className="h-4 w-4" />
          {t('offers.newOffer')}
        </Button>
      </MainHeader>
    }>
      <div className="flex flex-col gap-6">

        {/* Create form */}
        {showForm && (
          <Card className="p-6 gap-0">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-gray-900">{t('offers.createTitle')}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="flex flex-col gap-5">
              {/* Client & meta fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('offers.clientName')} *</label>
                  <input
                    type="text"
                    required
                    value={form.client_name}
                    onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))}
                    placeholder="Firma ABC sp. z o.o."
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:bg-white"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('offers.clientEmail')}</label>
                  <input
                    type="email"
                    value={form.client_email}
                    onChange={e => setForm(f => ({ ...f, client_email: e.target.value }))}
                    placeholder="klient@firma.pl"
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:bg-white"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('offers.validUntil')}</label>
                  <input
                    type="date"
                    value={form.valid_until}
                    onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:bg-white"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('offers.vatRate')}</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.vat_rate}
                    onChange={e => setForm(f => ({ ...f, vat_rate: e.target.value }))}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:bg-white"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('offers.notes')}</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:bg-white resize-none"
                />
              </div>

              {/* Items */}
              <div className="flex flex-col gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('offers.items')}</p>
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 w-1/2">{t('offers.itemDescription')}</th>
                        <th className="text-right px-3 py-2.5 text-xs font-semibold text-gray-500 w-16">{t('offers.itemQty')}</th>
                        <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 w-16">{t('offers.itemUnit')}</th>
                        <th className="text-right px-3 py-2.5 text-xs font-semibold text-gray-500 w-32">{t('offers.itemUnitPrice')}</th>
                        <th className="text-right px-3 py-2.5 text-xs font-semibold text-gray-500 w-32">{t('offers.itemTotal')}</th>
                        <th className="w-10" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-2">
                            <input
                              required
                              value={item.description}
                              onChange={e => updateItem(idx, 'description', e.target.value)}
                              placeholder="Dźwig osobowy..."
                              className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              required
                              min="0"
                              value={item.quantity}
                              onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                              className="w-16 border border-gray-200 rounded px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-amber-300"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              value={item.unit}
                              onChange={e => updateItem(idx, 'unit', e.target.value)}
                              className="w-16 border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              required
                              min="0"
                              step="0.01"
                              value={item.unit_price_net}
                              onChange={e => updateItem(idx, 'unit_price_net', parseFloat(e.target.value) || 0)}
                              className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-amber-300"
                            />
                          </td>
                          <td className="px-3 py-2 text-right text-gray-600 whitespace-nowrap">
                            {formatPrice(item.quantity * item.unit_price_net)}
                          </td>
                          <td className="px-2 py-2 text-center">
                            {items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeItem(idx)}
                                className="text-gray-300 hover:text-red-400 transition-colors cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t border-gray-200">
                      <tr>
                        <td colSpan={4} className="px-3 py-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('offers.totalNet')}</td>
                        <td className="px-3 py-2 text-right text-sm font-semibold text-gray-900">{formatPrice(totalNet)}</td>
                        <td />
                      </tr>
                      <tr>
                        <td colSpan={4} className="px-3 py-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('offers.totalGross')} ({vatRate}%)</td>
                        <td className="px-3 py-2 text-right text-sm font-bold" style={{ color: '#ffb400' }}>{formatPrice(totalGross)}</td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <button
                  type="button"
                  onClick={addItem}
                  className="self-start flex items-center gap-1.5 text-sm text-amber-600 hover:text-amber-700 font-medium cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  {t('offers.addItem')}
                </button>
              </div>

              {formError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {formError}
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={saving}>
                  <Check className="h-4 w-4" />
                  {saving ? t('offers.creating') : t('offers.create')}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>
                  {t('common.cancel')}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Status filter */}
        <div className="flex gap-1 flex-wrap">
          {STATUS_VALUES.map(value => (
            <button
              key={value}
              onClick={() => handleStatusChange(value)}
              className={`px-3 py-1.5 text-xs rounded-full border transition-colors cursor-pointer ${
                status === value
                  ? 'bg-[#ffb400] text-gray-900 border-[#ffb400] font-semibold'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-700'
              }`}
            >
              {value === '' ? t('offers.allStatuses') : t(`status.${value}`)}
            </button>
          ))}
        </div>

        {/* Table */}
        <Card className="gap-0 overflow-hidden">
          {loading ? (
            <div className="p-6"><SkeletonLoader count={5} /></div>
          ) : !data || data.data.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-sm">{t('offers.noOffers')}</div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('offers.number')}</th>
                      <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('offers.client')}</th>
                      <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('offers.status')}</th>
                      <th className="text-right px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('offers.total')}</th>
                      <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('offers.createdBy')}</th>
                      <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('offers.date')}</th>
                      {user?.role === 'superadmin' && <th className="px-4 py-3.5 w-10" />}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.data.map(offer => (
                      <tr
                        key={offer.id}
                        className={`transition-colors ${offer.quote_request_id ? 'hover:bg-gray-50 cursor-pointer' : ''}`}
                        onClick={() => offer.quote_request_id && navigate(`/quote-requests/${offer.quote_request_id}`)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm text-gray-600">{offer.offer_number}</span>
                            {offer.quote_request_id && (
                              <span title={t('offers.fromRequest')} className="text-gray-300">
                                <Link className="h-3 w-3" />
                              </span>
                            )}
                          </div>
                          {offer.quote_request && (
                            <p className="text-xs text-gray-400 font-mono mt-0.5">{offer.quote_request.request_number}</p>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-medium text-gray-900 text-sm">{clientLabel(offer)}</p>
                          {(offer.client_email || offer.quote_request?.investor_name) && (
                            <p className="text-xs text-gray-400 mt-0.5">{offer.client_email ?? ''}</p>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <Badge variant={statusBadge(offer.status)}>{statusLabel(offer.status)}</Badge>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className="font-semibold text-gray-900 text-sm">{formatPrice(offer.total_price_gross)}</span>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-500">
                          {offer.created_by?.name ?? <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">
                          {formatDate(offer.created_at)}
                        </td>
                        {user?.role === 'superadmin' && (
                          <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => openShareModal(offer)}
                              className="text-gray-400 hover:text-blue-500 transition-colors"
                              title="Przypisz do adminów"
                            >
                              <Share2 className="h-4 w-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="md:hidden divide-y">
                {data.data.map(offer => (
                  <div
                    key={offer.id}
                    className={`p-4 ${offer.quote_request_id ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                    onClick={() => offer.quote_request_id && navigate(`/quote-requests/${offer.quote_request_id}`)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-mono text-xs text-gray-500">{offer.offer_number}</p>
                        <p className="font-medium text-gray-900 text-sm mt-0.5">{clientLabel(offer)}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{formatDate(offer.created_at)}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant={statusBadge(offer.status)}>{statusLabel(offer.status)}</Badge>
                        <span className="font-semibold text-sm text-gray-900">{formatPrice(offer.total_price_gross)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {data.last_page > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                  <span className="text-sm text-gray-500">
                    {t('common.page', { current: data.current_page, last: data.last_page })}
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={data.current_page <= 1} onClick={() => handlePage(data.current_page - 1)}>
                      {t('common.previous')}
                    </Button>
                    <Button variant="outline" size="sm" disabled={data.current_page >= data.last_page} onClick={() => handlePage(data.current_page + 1)}>
                      {t('common.next')}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      {shareModalOfferId !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Przypisz ofertę do adminów</h3>
            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto mb-4">
              {allAdmins.map(admin => (
                <label key={admin.id} className="flex items-center gap-3 cursor-pointer py-1">
                  <input
                    type="checkbox"
                    checked={shareAdminIds.includes(admin.id)}
                    onChange={e => setShareAdminIds(prev =>
                      e.target.checked ? [...prev, admin.id] : prev.filter(id => id !== admin.id)
                    )}
                  />
                  <span className="text-sm text-gray-700">{admin.name}</span>
                </label>
              ))}
              {allAdmins.length === 0 && (
                <p className="text-sm text-gray-400 italic">Brak adminów</p>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShareModalOfferId(null)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Anuluj
              </button>
              <button
                onClick={saveShare}
                disabled={sharing}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {sharing ? 'Zapisuję...' : 'Przypisz'}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  )
}

export default OffersPage
