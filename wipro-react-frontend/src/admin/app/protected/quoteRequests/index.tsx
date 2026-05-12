import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { Search, RefreshCw, Plus, X, Check, ChevronDown, ListFilter } from 'lucide-react'
import { Card } from '@admin/components/Cards'
import { Button } from '@admin/components/Button'
import { Badge, statusBadge, statusLabel } from '@admin/components/Badge'
import SkeletonLoader from '@admin/components/SkeletonLoader'
import MainLayout from '@admin/components/layout/MainLayout'
import MainHeader from '@admin/components/layout/MainHeader'
import api from '@admin/store/axiosInstance'
import formatDate from '@admin/functions/formatDate'
import { useTranslation } from 'react-i18next'
import { adminViewStore } from '@admin/store/zustand/adminViewStore'

interface QuoteRequest {
  id: number
  request_number: string
  investor_name: string
  investor_email: string
  investor_company: string | null
  status: string
  created_at: string
  elevator?: { model: string; manufacturer: string } | null
}

interface Paginated {
  data: QuoteRequest[]
  current_page: number
  last_page: number
  total: number
}

const STATUS_FILTER_VALUES = ['new', 'in_progress', 'offer_sent', 'accepted', 'rejected'] as const

const STATUS_DOTS: Record<string, string> = {
  new: 'bg-amber-400',
  in_progress: 'bg-blue-400',
  offer_sent: 'bg-gray-400',
  accepted: 'bg-emerald-400',
  rejected: 'bg-red-400',
}

const StatusDropdown = ({
  selected,
  onChange,
}: {
  selected: string[]
  onChange: (statuses: string[]) => void
}) => {
  const [open, setOpen] = useState(false)
  const { t } = useTranslation()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onMouse = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onMouse)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onMouse); document.removeEventListener('keydown', onKey) }
  }, [])

  const toggle = (value: string) =>
    onChange(selected.includes(value) ? selected.filter(s => s !== value) : [...selected, value])

  const label = selected.length === 0
    ? t('quoteRequests.allStatuses')
    : selected.length === 1
    ? t(`status.${selected[0]}`)
    : t('quoteRequests.statusesSelected', { count: selected.length })

  const active = selected.length > 0

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border transition-colors cursor-pointer ${
          active
            ? 'bg-[#ffb400] text-gray-900 border-[#ffb400] font-semibold'
            : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-700'
        }`}
      >
        <ListFilter className="h-3 w-3" />
        <span>{label}</span>
        {active && (
          <span className="flex items-center justify-center w-4 h-4 rounded-full bg-black/15 text-[10px] font-bold leading-none">
            {selected.length}
          </span>
        )}
        <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown panel */}
      <div
        className={`absolute right-0 top-full mt-2 z-30 bg-white rounded-xl border border-gray-200 shadow-xl shadow-gray-200/50 overflow-hidden min-w-[196px] transition-all duration-150 origin-top-right ${
          open ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</span>
          {active && (
            <button
              onClick={() => onChange([])}
              className="text-[10px] text-amber-600 hover:text-amber-800 font-semibold cursor-pointer transition-colors"
            >
              {t('common.clear')}
            </button>
          )}
        </div>

        {/* Options */}
        {STATUS_FILTER_VALUES.map(value => {
          const checked = selected.includes(value)
          return (
            <div
              key={value}
              onClick={() => toggle(value)}
              className={`flex items-center gap-2.5 px-3 py-2.5 cursor-pointer transition-colors select-none ${
                checked ? 'bg-amber-50' : 'hover:bg-gray-50'
              }`}
            >
              {/* Custom checkbox */}
              <div className={`w-4 h-4 rounded border-[1.5px] flex items-center justify-center shrink-0 transition-all duration-150 ${
                checked ? 'bg-[#ffb400] border-[#ffb400]' : 'border-gray-300 bg-white'
              }`}>
                {checked && <Check className="h-2.5 w-2.5 text-gray-900" strokeWidth={3} />}
              </div>
              {/* Status dot */}
              <div className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOTS[value]}`} />
              {/* Label */}
              <span className={`text-xs ${checked ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                {t(`status.${value}`)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const QuoteRequests = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { selectedAdminId } = adminViewStore()
  const [data, setData] = useState<Paginated | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statuses, setStatuses] = useState<string[]>([])
  const [page, setPage] = useState(1)
  void page

  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', email: '' })

  const load = (p = 1, s = search, st = statuses) => {
    setLoading(true)
    const params: Record<string, string | number> = { page: p }
    if (s) params.search = s
    if (st.length > 0) params.status = st.join(',')
    if (selectedAdminId) params.admin_id = selectedAdminId
    api.get('/admin/quote-requests', { params })
      .then(res => setData(res.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(1) }, [selectedAdminId])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    load(1)
  }

  const handleStatusesChange = (st: string[]) => {
    setStatuses(st)
    setPage(1)
    load(1, search, st)
  }

  const handlePage = (p: number) => {
    setPage(p)
    load(p)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await api.post('/admin/quote-requests', {
        investor_name: form.name,
        investor_email: form.email || undefined,
      })
      navigate(`/quote-requests/${res.data.id}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <MainLayout headerComponent={
      <MainHeader title={t('quoteRequests.title')} subTitle={data ? t('quoteRequests.totalCount', { count: data.total }) : undefined}>
        <Button size="sm" variant="outline" onClick={() => load(1)}>
          <RefreshCw className="h-4 w-4" />
          {t('common.refresh')}
        </Button>
        <Button size="sm" onClick={() => { setShowForm(true); setForm({ name: '', email: '' }) }}>
          <Plus className="h-4 w-4" />
          {t('quoteRequests.newRequest')}
        </Button>
      </MainHeader>
    }>

      {/* New request form */}
      {showForm && (
        <Card className="p-6 gap-0">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-gray-900">{t('quoteRequests.newRequestTitle')}</h3>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('quoteRequests.clientNameLabel')} *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Jan Kowalski / ABC sp. z o.o."
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:bg-white"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('quoteRequests.clientEmailLabel')}</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder={t('quoteRequests.clientEmailPlaceholder')}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:bg-white"
              />
            </div>
            <div className="sm:col-span-2 flex gap-2">
              <Button type="submit" size="sm" disabled={saving}>
                <Check className="h-4 w-4" />
                {saving ? t('quoteRequests.creating') : t('quoteRequests.createRequest')}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>
                {t('common.cancel')}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Filters */}
      <Card className="p-4 gap-0">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('quoteRequests.search')}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:bg-white"
              />
            </div>
            <Button type="submit" size="sm">{t('common.search')}</Button>
          </form>

          <StatusDropdown selected={statuses} onChange={handleStatusesChange} />
        </div>
      </Card>

      {/* Table */}
      <Card className="gap-0 overflow-hidden">
        {loading ? (
          <div className="p-6"><SkeletonLoader count={5} /></div>
        ) : !data || data.data.length === 0 ? (
          <div className="p-12 text-center text-gray-400">{t('quoteRequests.noResults')}</div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('quoteRequests.number')}</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('quoteRequests.investor')}</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('quoteRequests.elevator')}</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('quoteRequests.date')}</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('quoteRequests.status')}</th>
                    <th className="px-4 py-3.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.data.map(req => (
                    <tr
                      key={req.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/quote-requests/${req.id}`)}
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm text-gray-500">{req.request_number}</span>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-gray-900 text-[15px]">{req.investor_name}</p>
                        <p className="text-sm text-gray-400 mt-0.5">{req.investor_email}</p>
                        {req.investor_company && <p className="text-sm text-gray-400">{req.investor_company}</p>}
                      </td>
                      <td className="px-4 py-4 text-gray-600 text-sm">
                        {req.elevator ? `${req.elevator.manufacturer} ${req.elevator.model}` : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-4 text-gray-500 text-sm whitespace-nowrap">
                        {formatDate(req.created_at)}
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant={statusBadge(req.status)}>{statusLabel(req.status)}</Badge>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Button variant="ghost" size="sm">{t('common.open')}</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y">
              {data.data.map(req => (
                <div
                  key={req.id}
                  className="p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => navigate(`/quote-requests/${req.id}`)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-gray-900">{req.investor_name}</p>
                      <p className="text-xs text-gray-400 font-mono">{req.request_number}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(req.created_at)}</p>
                    </div>
                    <Badge variant={statusBadge(req.status)}>{statusLabel(req.status)}</Badge>
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
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={data.current_page <= 1}
                    onClick={() => handlePage(data.current_page - 1)}
                  >
                    {t('common.previous')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={data.current_page >= data.last_page}
                    onClick={() => handlePage(data.current_page + 1)}
                  >
                    {t('common.next')}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </MainLayout>
  )
}

export default QuoteRequests
