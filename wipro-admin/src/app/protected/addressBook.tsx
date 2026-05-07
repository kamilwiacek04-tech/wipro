import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Search, User, ChevronDown, ChevronRight } from 'lucide-react'
import { Card } from '@/components/Cards'
import { Button } from '@/components/Button'
import { Badge, statusBadge, statusLabel } from '@/components/Badge'
import SkeletonLoader from '@/components/SkeletonLoader'
import MainLayout from '@/components/layout/MainLayout'
import MainHeader from '@/components/layout/MainHeader'
import api from '@/store/axiosInstance'
import formatDate from '@/functions/formatDate'
import { useTranslation } from 'react-i18next'

interface QuoteRequestBrief {
  id: number
  request_number: string
  status: string
  created_at: string
}

interface Client {
  id: number
  name: string
  email: string
  phone: string | null
  company: string | null
  nip: string | null
  address: string | null
  city: string | null
  is_active: boolean
  created_at: string
  quote_requests_count: number
  quote_requests?: QuoteRequestBrief[]
}

interface Paginated {
  data: Client[]
  current_page: number
  last_page: number
  total: number
}

const ClientRow = ({ client }: { client: Client }) => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const [requests, setRequests] = useState<QuoteRequestBrief[]>(client.quote_requests ?? [])
  const [loading, setLoading] = useState(false)

  const toggle = () => {
    if (!expanded && requests.length === 0) {
      setLoading(true)
      api.get(`/admin/users/${client.id}`)
        .then(res => setRequests(res.data.quote_requests ?? []))
        .finally(() => setLoading(false))
    }
    setExpanded(!expanded)
  }

  return (
    <>
      <tr className="hover:bg-gray-50/50">
        <td className="px-4 py-3">
          {client.quote_requests_count > 0 && (
            <button onClick={toggle} className="text-gray-400 hover:text-gray-700 cursor-pointer">
              {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          )}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
              <User className="h-4 w-4 text-gray-400" />
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">{client.name}</p>
              <p className="text-xs text-gray-400">{client.email}</p>
            </div>
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-gray-600">
          {client.company ?? <span className="text-gray-300">—</span>}
          {client.nip && <p className="text-xs text-gray-400">NIP: {client.nip}</p>}
        </td>
        <td className="px-4 py-3 text-sm text-gray-600">
          {client.phone ?? <span className="text-gray-300">—</span>}
        </td>
        <td className="px-4 py-3 text-sm text-gray-600">
          {client.city ?? <span className="text-gray-300">—</span>}
        </td>
        <td className="px-4 py-3 text-center">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
            {client.quote_requests_count}
          </span>
        </td>
        <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
          {formatDate(client.created_at)}
        </td>
      </tr>

      {expanded && (
        <tr>
          <td colSpan={7} className="bg-gray-50/70 px-12 py-3 border-t border-b border-gray-100">
            <p className="text-xs font-medium text-gray-500 mb-2">{t('addressBook.quoteRequests')}</p>
            {loading ? (
              <p className="text-xs text-gray-400">{t('common.loading')}</p>
            ) : requests.length === 0 ? (
              <p className="text-xs text-gray-400">{t('addressBook.noRequests')}</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {requests.map(req => (
                  <div
                    key={req.id}
                    className="flex items-center gap-4 cursor-pointer hover:text-blue-600"
                    onClick={() => navigate(`/quote-requests/${req.id}`)}
                  >
                    <span className="font-mono text-xs text-gray-500 w-32 shrink-0">{req.request_number}</span>
                    <span className="text-xs text-gray-400">{formatDate(req.created_at)}</span>
                    <Badge variant={statusBadge(req.status)}>{statusLabel(req.status)}</Badge>
                    <span className="text-xs text-blue-500 ml-auto">{t('common.open')}</span>
                  </div>
                ))}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  )
}

const AddressBook = () => {
  const { t } = useTranslation()
  const [data, setData] = useState<Paginated | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const load = (p = 1, s = search) => {
    setLoading(true)
    const params: Record<string, string | number> = { page: p }
    if (s) params.search = s
    api.get('/admin/users', { params })
      .then(res => setData(res.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(1) }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    load(1)
  }

  return (
    <MainLayout headerComponent={
      <MainHeader title={t('addressBook.title')} subTitle={data ? t('addressBook.totalCount', { count: data.total }) : undefined} />
    }>

      {/* Search */}
      <Card className="p-4 gap-0">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('addressBook.search')}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:bg-white"
            />
          </div>
          <Button type="submit" size="sm">{t('common.search')}</Button>
          {search && (
            <Button type="button" variant="ghost" size="sm" onClick={() => { setSearch(''); load(1, '') }}>
              {t('common.clear')}
            </Button>
          )}
        </form>
      </Card>

      {/* Table */}
      <Card className="gap-0 overflow-hidden">
        {loading ? (
          <div className="p-6"><SkeletonLoader count={5} /></div>
        ) : !data || data.data.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            {search ? t('addressBook.noResults') : t('addressBook.noUsers')}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="w-8 px-4 py-3" />
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('addressBook.name')}</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('addressBook.company')}</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('addressBook.phone')}</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('addressBook.city')}</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('addressBook.requests')}</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('addressBook.joined')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.data.map(client => (
                    <ClientRow key={client.id} client={client} />
                  ))}
                </tbody>
              </table>
            </div>

            {data.last_page > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                <span className="text-sm text-gray-500">
                  {t('common.page', { current: data.current_page, last: data.last_page })}
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={data.current_page <= 1} onClick={() => { setPage(p => p - 1); load(page - 1) }}>
                    {t('common.previous')}
                  </Button>
                  <Button variant="outline" size="sm" disabled={data.current_page >= data.last_page} onClick={() => { setPage(p => p + 1); load(page + 1) }}>
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

export default AddressBook
