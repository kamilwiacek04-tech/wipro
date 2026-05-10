import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Search, RefreshCw } from 'lucide-react'
import { Card } from '@admin/components/Cards'
import { Button } from '@admin/components/Button'
import { Badge, statusBadge, statusLabel } from '@admin/components/Badge'
import SkeletonLoader from '@admin/components/SkeletonLoader'
import MainLayout from '@admin/components/layout/MainLayout'
import MainHeader from '@admin/components/layout/MainHeader'
import api from '@admin/store/axiosInstance'
import formatDate from '@admin/functions/formatDate'
import { useTranslation } from 'react-i18next'

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

const STATUS_VALUES = ['', 'new', 'in_progress', 'offer_sent', 'accepted', 'rejected']

const QuoteRequests = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [data, setData] = useState<Paginated | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  void page

  const load = (p = 1, s = search, st = status) => {
    setLoading(true)
    const params: Record<string, string | number> = { page: p }
    if (s) params.search = s
    if (st) params.status = st
    api.get('/admin/quote-requests', { params })
      .then(res => setData(res.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(1) }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    load(1)
  }

  const handleStatusChange = (st: string) => {
    setStatus(st)
    setPage(1)
    load(1, search, st)
  }

  const handlePage = (p: number) => {
    setPage(p)
    load(p)
  }

  const statusLabel_ = (value: string) => value === '' ? t('quoteRequests.allStatuses') : t(`status.${value}`)

  return (
    <MainLayout headerComponent={
      <MainHeader title={t('quoteRequests.title')} subTitle={data ? t('quoteRequests.totalCount', { count: data.total }) : undefined}>
        <Button size="sm" onClick={() => load(1)}>
          <RefreshCw className="h-4 w-4" />
          {t('common.refresh')}
        </Button>
      </MainHeader>
    }>

      {/* Filters */}
      <Card className="p-4 gap-0">
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('quoteRequests.search')}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:bg-white"
              />
            </div>
            <Button type="submit" size="sm">{t('common.search')}</Button>
          </form>

          <div className="flex gap-1 flex-wrap">
            {STATUS_VALUES.map(value => (
              <button
                key={value}
                onClick={() => handleStatusChange(value)}
                className={`px-3 py-1.5 text-xs rounded-full border transition-colors cursor-pointer ${
                  status === value
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                }`}
              >
                {statusLabel_(value)}
              </button>
            ))}
          </div>
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
