import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  AreaChart, Area, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import {
  FileText, Users, Activity, CheckCircle, Clock, Server, ArrowRight, CalendarDays,
} from 'lucide-react'
import { Card } from '@admin/components/Cards'
import { Button } from '@admin/components/Button'
import { Badge, statusBadge, statusLabel } from '@admin/components/Badge'
import SkeletonLoader from '@admin/components/SkeletonLoader'
import MainLayout from '@admin/components/layout/MainLayout'
import MainHeader from '@admin/components/layout/MainHeader'
import api from '@admin/store/axiosInstance'
import formatDate from '@admin/functions/formatDate'
import { useTranslation } from 'react-i18next'

interface DashboardData {
  tiles: {
    total_requests: number
    pending_requests: number
    processed_requests: number
    total_clients: number
    total_elevators: number
  }
  requests_timeline: { date: string; count: number }[]
  by_status: { status: string; count: number }[]
  recent_requests: {
    id: number
    request_number: string
    investor_name: string
    status: string
    created_at: string
  }[]
}

const STATUS_COLORS = ['#f59e0b', '#3b82f6', '#030213', '#10b981', '#ef4444', '#8b5cf6']

const fmtAxisDate = (s: string) => {
  const [, m, d] = s.split('-')
  return `${d}.${m}`
}

const fillTimeline = (items: { date: string; count: number }[], days = 30) => {
  const map = Object.fromEntries(items.map(i => [i.date, i.count]))
  const result: { date: string; count: number }[] = []
  for (let d = days - 1; d >= 0; d--) {
    const dt = new Date()
    dt.setDate(dt.getDate() - d)
    const key = dt.toISOString().slice(0, 10)
    result.push({ date: key, count: map[key] ?? 0 })
  }
  return result
}

const Dashboard = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(res => setData(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  const timeline = useMemo(() => fillTimeline(data?.requests_timeline ?? []), [data])

  const tiles = data ? [
    { label: t('dashboard.totalRequests'), value: data.tiles.total_requests, icon: FileText, bg: 'bg-blue-50', iconColor: 'text-blue-500', border: 'border-blue-100' },
    { label: t('dashboard.newRequests'), value: data.tiles.pending_requests, icon: Clock, bg: 'bg-amber-50', iconColor: 'text-amber-500', border: 'border-amber-100' },
    { label: t('dashboard.offersSent'), value: data.tiles.processed_requests, icon: CheckCircle, bg: 'bg-green-50', iconColor: 'text-green-500', border: 'border-green-100' },
    { label: t('dashboard.clients'), value: data.tiles.total_clients, icon: Users, bg: 'bg-purple-50', iconColor: 'text-purple-500', border: 'border-purple-100' },
    { label: t('dashboard.elevatorsInDb'), value: data.tiles.total_elevators, icon: Server, bg: 'bg-gray-50', iconColor: 'text-gray-500', border: 'border-gray-100' },
  ] : []

  return (
    <MainLayout headerComponent={
      <MainHeader title={t('dashboard.title')} subTitle={t('dashboard.subtitle')}>
        <Button size="sm" onClick={() => navigate('/quote-requests')}>
          <Activity className="h-4 w-4" />
          {t('dashboard.totalRequests')}
        </Button>
      </MainHeader>
    }>
      {loading ? (
        <SkeletonLoader count={6} />
      ) : error || !data ? (
        <Card className="p-12 flex items-center justify-center">
          <p className="text-gray-500">{t('dashboard.error')}</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">

          {/* Tiles */}
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            {tiles.map((tile) => {
              const Icon = tile.icon
              return (
                <Card key={tile.label} className={`p-5 lg:p-6 gap-0 border ${tile.border}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm lg:text-base text-gray-500 mb-1.5 truncate">{tile.label}</p>
                      <p className="text-3xl lg:text-4xl font-bold text-gray-900 leading-none">{tile.value}</p>
                    </div>
                    <div className={`inline-flex items-center justify-center w-12 h-12 lg:w-14 lg:h-14 rounded-xl ${tile.bg} shrink-0`}>
                      <Icon className={`h-6 w-6 lg:h-7 lg:w-7 ${tile.iconColor}`} />
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 xl:gap-8">

            {/* Timeline */}
            <Card className="p-6 lg:p-8 gap-0">
              <h3 className="text-gray-900 font-semibold text-base lg:text-lg mb-5">{t('dashboard.chartTimeline')}</h3>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={timeline} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={fmtAxisDate}
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    tickLine={false}
                    axisLine={false}
                    interval={6}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
                    labelFormatter={v => fmtAxisDate(v as string)}
                    formatter={v => [v, t('dashboard.requests')]}
                  />
                  <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} fill="url(#grad)" dot={false} activeDot={{ r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            {/* By status pie */}
            <Card className="p-6 lg:p-8 gap-0">
              <h3 className="text-gray-900 font-semibold text-base lg:text-lg mb-5">{t('dashboard.chartByStatus')}</h3>
              {data.by_status.length === 0 ? (
                <p className="text-sm text-gray-400 py-10 text-center">{t('dashboard.noData')}</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={data.by_status.map((d, i) => ({
                        name: statusLabel(d.status),
                        value: d.count,
                        fill: STATUS_COLORS[i % STATUS_COLORS.length],
                      }))}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(value) => <span style={{ fontSize: 12, color: '#6b7280' }}>{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>

          {/* Recent requests */}
          <Card className="p-6 lg:p-8 gap-0">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-400" />
                <h3 className="text-gray-900 font-semibold text-base lg:text-lg">{t('dashboard.recentRequests')}</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/quote-requests')}>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            {data.recent_requests.length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center">{t('dashboard.noRequests')}</p>
            ) : (
              <div className="flex flex-col divide-y">
                {data.recent_requests.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0 cursor-pointer hover:bg-gray-50 -mx-2 px-2 rounded-md transition-colors"
                    onClick={() => navigate(`/quote-requests/${req.id}`)}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] lg:text-base font-semibold text-gray-900 truncate">{req.investor_name}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm text-gray-400 font-mono">{req.request_number}</span>
                        <span className="text-sm text-gray-400 flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {formatDate(req.created_at)}
                        </span>
                      </div>
                    </div>
                    <Badge variant={statusBadge(req.status)}>{statusLabel(req.status)}</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>

        </div>
      )}
    </MainLayout>
  )
}

export default Dashboard
