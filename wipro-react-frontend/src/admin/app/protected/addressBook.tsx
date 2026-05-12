import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Search, Mail, Phone, ChevronDown, ChevronRight, Building2 } from 'lucide-react'
import { Card } from '@admin/components/Cards'
import { Button } from '@admin/components/Button'
import { Badge, statusBadge, statusLabel } from '@admin/components/Badge'
import SkeletonLoader from '@admin/components/SkeletonLoader'
import MainLayout from '@admin/components/layout/MainLayout'
import MainHeader from '@admin/components/layout/MainHeader'
import api from '@admin/store/axiosInstance'
import formatDate from '@admin/functions/formatDate'
import { useTranslation } from 'react-i18next'

interface ContactRow {
  email: string
  name: string
  phone: string | null
  requests_count: number
  latest_request_at: string
  first_contact_at: string
}

interface ContactRequest {
  id: number
  request_number: string
  investor_name: string
  investor_company: string | null
  investment_name: string | null
  status: string
  created_at: string
}

interface Paginated {
  data: ContactRow[]
  current_page: number
  last_page: number
  total: number
}

const ContactRowItem = ({ contact }: { contact: ContactRow }) => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const [requests, setRequests] = useState<ContactRequest[] | null>(null)
  const [loading, setLoading] = useState(false)

  const toggle = () => {
    if (!expanded && requests === null) {
      setLoading(true)
      api.get('/admin/contacts/requests', { params: { email: contact.email } })
        .then(res => setRequests(res.data))
        .finally(() => setLoading(false))
    }
    setExpanded(v => !v)
  }

  return (
    <>
      <tr className="hover:bg-gray-50/50 transition-colors">
        <td className="w-8 px-4 py-3.5">
          {contact.requests_count > 0 && (
            <button onClick={toggle} className="text-gray-400 hover:text-gray-700 cursor-pointer">
              {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          )}
        </td>

        {/* Name + email */}
        <td className="px-4 py-3.5">
          <p className="font-medium text-gray-900 text-sm">{contact.name}</p>
          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
            <Mail className="h-3 w-3 shrink-0" />
            {contact.email}
          </p>
        </td>

        {/* Phone */}
        <td className="px-4 py-3.5 text-sm text-gray-600">
          {contact.phone ? (
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3 text-gray-400 shrink-0" />
              {contact.phone}
            </span>
          ) : (
            <span className="text-gray-300">—</span>
          )}
        </td>

        {/* Request count */}
        <td className="px-4 py-3.5 text-center">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold">
            {contact.requests_count}
          </span>
        </td>

        {/* Latest request */}
        <td className="px-4 py-3.5 text-xs text-gray-400 whitespace-nowrap">
          {formatDate(contact.latest_request_at)}
        </td>

        {/* First contact */}
        <td className="px-4 py-3.5 text-xs text-gray-400 whitespace-nowrap">
          {formatDate(contact.first_contact_at)}
        </td>
      </tr>

      {expanded && (
        <tr>
          <td colSpan={6} className="bg-gray-50/60 px-12 py-3 border-t border-b border-gray-100">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
              {t('addressBook.quoteRequests')}
            </p>
            {loading ? (
              <p className="text-xs text-gray-400">{t('common.loading')}</p>
            ) : !requests || requests.length === 0 ? (
              <p className="text-xs text-gray-400">{t('addressBook.noRequests')}</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {requests.map(req => (
                  <div
                    key={req.id}
                    className="flex items-center gap-3 cursor-pointer hover:text-amber-600 group"
                    onClick={() => navigate(`/quote-requests/${req.id}`)}
                  >
                    <span className="font-mono text-xs text-gray-500 w-28 shrink-0">{req.request_number}</span>
                    {(req.investor_company || req.investment_name) && (
                      <span className="flex items-center gap-1 text-xs text-gray-500 shrink-0">
                        <Building2 className="h-3 w-3 text-gray-300 shrink-0" />
                        {req.investor_company ?? req.investment_name}
                      </span>
                    )}
                    <span className="text-xs text-gray-400">{formatDate(req.created_at)}</span>
                    <Badge variant={statusBadge(req.status)}>{statusLabel(req.status)}</Badge>
                    <span className="text-xs text-amber-600 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                      {t('common.open')}
                    </span>
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
    api.get('/admin/contacts', { params })
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
      <MainHeader
        title={t('addressBook.title')}
        subTitle={data ? t('addressBook.totalCount', { count: data.total }) : undefined}
      />
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
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:bg-white"
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
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="w-8 px-4 py-3" />
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {t('addressBook.name')} / {t('addressBook.email')}
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {t('addressBook.phone')}
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {t('addressBook.requests')}
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {t('addressBook.latestRequest')}
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {t('addressBook.joined')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.data.map(contact => (
                    <ContactRowItem key={contact.email} contact={contact} />
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
                  <Button
                    variant="outline" size="sm"
                    disabled={data.current_page <= 1}
                    onClick={() => { const p = page - 1; setPage(p); load(p) }}
                  >
                    {t('common.previous')}
                  </Button>
                  <Button
                    variant="outline" size="sm"
                    disabled={data.current_page >= data.last_page}
                    onClick={() => { const p = page + 1; setPage(p); load(p) }}
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

export default AddressBook
