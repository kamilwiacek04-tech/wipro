import { Button } from '@admin/components/Button'
import { Card } from '@admin/components/Cards'
import SkeletonLoader from '@admin/components/SkeletonLoader'
import MainHeader from '@admin/components/layout/MainHeader'
import MainLayout from '@admin/components/layout/MainLayout'
import api from '@admin/store/axiosInstance'
import { adminViewStore } from '@admin/store/zustand/adminViewStore'
import { Check, Mail, Plus, RefreshCw, Shield, ToggleLeft, ToggleRight, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface Admin {
  id: number
  name: string
  email: string
  role: string
  is_active: boolean
  created_at: string
}

interface SharedQuoteRequest {
  id: number
  request_number: string
  status: string
  investor_name: string | null
  is_shared_with_me: boolean
}

const AdminsPage = () => {
  const { t } = useTranslation()
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [formError, setFormError] = useState('')

  const [shareTargetAdmin, setShareTargetAdmin] = useState<Admin | null>(null)
  const [shareSourceAdmins, setShareSourceAdmins] = useState<Admin[]>([])
  const [expandedAdminId, setExpandedAdminId] = useState<number | null>(null)
  const [adminOffersMap, setAdminOffersMap] = useState<Record<number, SharedQuoteRequest[]>>({})
  const [selectedOfferIds, setSelectedOfferIds] = useState<number[]>([])
  const [savingShare, setSavingShare] = useState(false)

  const load = () => {
    setLoading(true)
    api.get('/admin/admins')
      .then(res => {
        setAdmins(res.data)
        adminViewStore.getState().setAdmins(res.data)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setSaving(true)
    try {
      await api.post('/admin/admins', form)
      setForm({ name: '', email: '', password: '' })
      setShowForm(false)
      load()
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? t('admins.createError')
      setFormError(msg)
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (admin: Admin) => {
    setSaving(true)
    try {
      await api.patch(`/admin/admins/${admin.id}`, { is_active: !admin.is_active })
      load()
    } finally {
      setSaving(false)
    }
  }

  const deleteAdmin = async (admin: Admin) => {
    if (!confirm(t('admins.confirmDelete', { name: admin.name }))) return
    setSaving(true)
    try {
      await api.delete(`/admin/admins/${admin.id}`)
      load()
    } finally {
      setSaving(false)
    }
  }

  const openShareModal = async (admin: Admin) => {
    setShareTargetAdmin(admin)
    setSelectedOfferIds([])
    setExpandedAdminId(null)
    setAdminOffersMap({})
    const res = await api.get('/admin/admins')
    setShareSourceAdmins(res.data.filter((a: Admin) => a.id !== admin.id && a.role === 'admin'))
  }

  const expandAdmin = async (sourceAdminId: number) => {
    if (expandedAdminId === sourceAdminId) {
      setExpandedAdminId(null)
      return
    }
    setExpandedAdminId(sourceAdminId)
    if (!adminOffersMap[sourceAdminId]) {
      const res = await api.get(`/admin/admins/${sourceAdminId}/quote-requests?target_admin_id=${shareTargetAdmin!.id}`)
      const offers = res.data as SharedQuoteRequest[]
      setAdminOffersMap(prev => ({ ...prev, [sourceAdminId]: offers }))
      const alreadyShared = offers.filter(o => o.is_shared_with_me).map(o => o.id)
      setSelectedOfferIds(prev => [...new Set([...prev, ...alreadyShared])])
    }
  }

  const toggleOffer = (offerId: number) => {
    setSelectedOfferIds(prev =>
      prev.includes(offerId) ? prev.filter(id => id !== offerId) : [...prev, offerId]
    )
  }

  const toggleAdminOffers = (sourceAdminId: number, checked: boolean) => {
    const offers = adminOffersMap[sourceAdminId] ?? []
    const ids = offers.map(o => o.id)
    setSelectedOfferIds(prev =>
      checked ? [...new Set([...prev, ...ids])] : prev.filter(id => !ids.includes(id))
    )
  }

  const saveShares = async () => {
    if (!shareTargetAdmin) return
    setSavingShare(true)
    try {
      await api.post(`/admin/admins/${shareTargetAdmin.id}/share-quote-requests`, { quote_request_ids: selectedOfferIds })
      setShareTargetAdmin(null)
    } finally {
      setSavingShare(false)
    }
  }

  return (
    <MainLayout headerComponent={
      <MainHeader title={t('admins.title')} subTitle={t('admins.subtitle')}>
        <Button size="sm" variant="outline" onClick={() => load()}>
          <RefreshCw className="h-4 w-4" />
          {t('common.refresh')}
        </Button>
        <Button size="sm" onClick={() => { setShowForm(true); setFormError('') }}>
          <Plus className="h-4 w-4" />
          {t('admins.newAdmin')}
        </Button>
      </MainHeader>
    }>
      <div className="flex flex-col gap-6">

        {/* Create form */}
        {showForm && (
          <Card className="p-6 gap-0">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-gray-900">{t('admins.newAccount')}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('quoteRequests.detail.fields.name')}</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Jan Kowalski"
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:bg-white"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('quoteRequests.detail.fields.email')}</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="jan@wipro.pl"
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:bg-white"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('auth.password')}</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder={t('admins.passwordPlaceholder')}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:bg-white"
                />
              </div>
              {formError && (
                <div className="sm:col-span-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {formError}
                </div>
              )}
              <div className="sm:col-span-3 flex gap-2">
                <Button type="submit" size="sm" disabled={saving}>
                  <Check className="h-4 w-4" />
                  {saving ? t('admins.creating') : t('admins.create')}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>
                  {t('common.cancel')}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Admins list */}
        <Card className="gap-0 overflow-hidden">
          {loading ? (
            <div className="p-6">
              <SkeletonLoader count={4} />
            </div>
          ) : admins.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-sm">{t('admins.noAdmins')}</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {admins.map(admin => (
                <div key={admin.id} className={`flex items-center gap-4 px-5 py-4 ${!admin.is_active ? 'opacity-50' : ''}`}>
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                    style={{ background: admin.role === 'superadmin' ? '#ffb400' : '#f3f4f6', color: admin.role === 'superadmin' ? '#111827' : '#6b7280' }}
                  >
                    {admin.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 truncate">{admin.name}</p>
                      {admin.role === 'superadmin' && (
                        <span className="flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                          <Shield className="h-3 w-3" /> Superadmin
                        </span>
                      )}
                      {!admin.is_active && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{t('admins.inactive')}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <Mail className="h-3 w-3" /> {admin.email}
                    </p>
                  </div>

                  {admin.role !== 'superadmin' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openShareModal(admin)}
                      >
                        Udostępnij oferty
                      </Button>
                      <button
                        onClick={() => toggleActive(admin)}
                        disabled={saving}
                        title={admin.is_active ? t('admins.deactivate') : t('admins.activate')}
                        className="text-gray-400 hover:text-amber-500 disabled:opacity-50 cursor-pointer transition-colors"
                      >
                        {admin.is_active
                          ? <ToggleRight className="h-6 w-6 text-amber-500" />
                          : <ToggleLeft className="h-6 w-6" />}
                      </button>
                      <button
                        onClick={() => deleteAdmin(admin)}
                        disabled={saving}
                        title={t('admins.deleteTitle')}
                        className="text-gray-300 hover:text-red-500 disabled:opacity-30 cursor-pointer transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {shareTargetAdmin && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg flex flex-col" style={{ maxHeight: '80vh' }}>
            <h3 className="font-semibold text-gray-900 mb-1">
              Udostępnij zapytania dla: {shareTargetAdmin.name}
            </h3>
            <p className="text-sm text-gray-500 mb-4">Wybierz zapytania ofertowe innych adminów do udostępnienia</p>

            <div className="flex-1 overflow-y-auto divide-y divide-gray-100 min-h-0">
              {shareSourceAdmins.length === 0 && (
                <p className="text-sm text-gray-400 italic py-4 text-center">Brak innych adminów</p>
              )}
              {shareSourceAdmins.map(sourceAdmin => {
                const offers = adminOffersMap[sourceAdmin.id]
                const isExpanded = expandedAdminId === sourceAdmin.id
                const allChecked = !!offers && offers.length > 0 && offers.every(o => selectedOfferIds.includes(o.id))
                const someChecked = !!offers && offers.some(o => selectedOfferIds.includes(o.id))
                return (
                  <div key={sourceAdmin.id}>
                    <div className="flex items-center gap-3 py-3 px-1">
                      <input
                        type="checkbox"
                        checked={allChecked}
                        ref={(el) => { if (el) el.indeterminate = someChecked && !allChecked }}
                        onChange={e => toggleAdminOffers(sourceAdmin.id, e.target.checked)}
                        disabled={!offers}
                        className="cursor-pointer"
                      />
                      <button
                        className="flex flex-1 text-sm font-medium text-gray-800 hover:text-blue-600 justify-between cursor-pointer"
                        onClick={() => expandAdmin(sourceAdmin.id)}
                      >
                        <span>
                          {sourceAdmin.name}
                          {offers && (
                            <span className="ml-2 text-xs text-gray-400">({offers.length} zapytań)</span>
                          )}
                        </span>
                      <span className="text-xs text-gray-400">{isExpanded ? '▲' : '▼'}</span>
                      </button>
                    </div>

                    {isExpanded && !offers && (
                      <div className="pl-8 pb-2 text-xs text-gray-400">Ładowanie...</div>
                    )}
                    {isExpanded && offers && (
                      <div className="pl-8 pb-2 flex flex-col gap-1">
                        {offers.length === 0 && (
                          <p className="text-xs text-gray-400 italic">Brak zapytań</p>
                        )}
                        {offers.map(offer => (
                          <label key={offer.id} className="flex items-center gap-2 cursor-pointer py-0.5">
                            <input
                              type="checkbox"
                              checked={selectedOfferIds.includes(offer.id)}
                              onChange={() => toggleOffer(offer.id)}
                            />
                            <span className="text-sm text-gray-700">{offer.request_number}</span>
                            {offer.investor_name && (
                              <span className="text-xs text-gray-400">— {offer.investor_name}</span>
                            )}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="flex gap-2 justify-end mt-4 pt-4 border-t border-gray-100 shrink-0">
              <Button variant="outline" size="sm" onClick={() => setShareTargetAdmin(null)}>
                Anuluj
              </Button>
              <Button size="sm" onClick={saveShares} disabled={savingShare}>
                {savingShare ? 'Zapisuję...' : 'Zapisz dostęp'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  )
}

export default AdminsPage
