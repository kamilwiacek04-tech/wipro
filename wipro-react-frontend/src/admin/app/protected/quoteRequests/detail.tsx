import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { ArrowLeft, FileText, Wand2, Save, Plus, Trash2, FileDown } from 'lucide-react'
import { Card } from '@admin/components/Cards'
import { Button } from '@admin/components/Button'
import { Badge, statusBadge, statusLabel } from '@admin/components/Badge'
import SkeletonLoader from '@admin/components/SkeletonLoader'
import MainLayout from '@admin/components/layout/MainLayout'
import MainHeader from '@admin/components/layout/MainHeader'
import api from '@admin/store/axiosInstance'
import formatDate, { formatPrice } from '@admin/functions/formatDate'
import { useTranslation } from 'react-i18next'

interface OfferItem {
  id: number
  description: string
  quantity: number
  unit: string
  unit_price_net: number
  total_price_net: number
  sort_order: number
}

interface Offer {
  id: number
  offer_number: string
  version: number
  status: string
  total_price_net: number
  total_price_gross: number
  vat_rate: number
  valid_until: string | null
  notes: string | null
  sent_at: string | null
  client_response: 'accepted' | 'rejected' | null
  client_responded_at: string | null
  cancelled_at: string | null
  pdf_path: string | null
  docx_path: string | null
  items: OfferItem[]
}

interface QuoteRequestDetail {
  id: number
  request_number: string
  status: string
  created_at: string
  investor_name: string
  investor_email: string
  investor_phone: string | null
  investor_company: string | null
  investor_nip: string | null
  investor_address: string | null
  investor_city: string | null
  investment_name: string | null
  investment_address: string | null
  floors: number | null
  stops: number | null
  lift_capacity: number | null
  shaft_width: number | null
  shaft_depth: number | null
  cabin_width: number | null
  cabin_depth: number | null
  cabin_height: number | null
  pit_depth: number | null
  overhead: number | null
  drive_type: string | null
  door_type: string | null
  door_width: number | null
  door_height: number | null
  handrail: string | null
  ceiling: string | null
  lighting: string | null
  floor_material: string | null
  control_panel: string | null
  additional_notes: string | null
  elevator: { id: number; model: string; manufacturer: string; base_price: number } | null
  offers: Offer[]
}

const STATUS_VALUES = ['new', 'in_progress', 'offer_sent', 'accepted', 'rejected'] as const

const Field = ({ label, value }: { label: string; value?: string | number | null }) => (
  <div>
    <p className="text-xs lg:text-sm text-gray-400 mb-1 font-medium uppercase tracking-wide">{label}</p>
    <p className="text-sm lg:text-base text-gray-900">{value ?? <span className="text-gray-300">—</span>}</p>
  </div>
)

const EditableField = ({
  label, value, field, onSave,
}: {
  label: string
  value: string | number | null | undefined
  field: string
  onSave: (field: string, value: string) => void
}) => {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(value ?? ''))

  const commit = () => {
    setEditing(false)
    onSave(field, draft)
  }

  return (
    <div>
      <p className="text-xs lg:text-sm text-gray-400 mb-1 font-medium uppercase tracking-wide">{label}</p>
      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
          className="w-full text-sm lg:text-base border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      ) : (
        <p
          onClick={() => { setDraft(String(value ?? '')); setEditing(true) }}
          className="text-sm lg:text-base text-gray-900 cursor-pointer hover:bg-blue-50 rounded px-1 -ml-1 py-1 border border-transparent hover:border-blue-200 transition-colors"
          title="Kliknij aby edytować"
        >
          {value ?? <span className="text-gray-300">—</span>}
        </p>
      )}
    </div>
  )
}

const QuoteRequestDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [data, setData] = useState<QuoteRequestDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [downloading, setDownloading] = useState<Record<string, boolean>>({})
  const [offerItems, setOfferItems] = useState<OfferItem[]>([])
  const [editingOffer, setEditingOffer] = useState(false)

  const load = () => {
    api.get(`/admin/quote-requests/${id}`)
      .then(res => {
        setData(res.data)
        const draft = res.data.offers?.find((o: Offer) => o.status === 'draft')
        if (draft) setOfferItems([...draft.items].sort((a, b) => a.sort_order - b.sort_order))
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  const updateField = async (field: string, value: string) => {
    if (!data) return
    setSaving(true)
    try {
      const res = await api.patch(`/admin/quote-requests/${id}`, { [field]: value || null })
      setData(res.data)
    } finally {
      setSaving(false)
    }
  }

  const updateStatus = async (status: string) => {
    setSaving(true)
    try {
      const res = await api.patch(`/admin/quote-requests/${id}`, { status })
      setData(res.data)
    } finally {
      setSaving(false)
    }
  }

  const generateOffer = async () => {
    if (!data) return
    setGenerating(true)
    try {
      const res = await api.post(`/admin/quote-requests/${id}/generate-offer`)
      const items = [...(res.data.items ?? [])].sort((a: OfferItem, b: OfferItem) => a.sort_order - b.sort_order)
      setOfferItems(items)
      setEditingOffer(true)
      await load()
    } finally {
      setGenerating(false)
    }
  }

  const saveOffer = async () => {
    if (!data) return
    const draft = data.offers.find(o => o.status === 'draft')
    if (!draft) return
    setSaving(true)
    try {
      await api.patch(`/admin/offers/${draft.id}`, { items: offerItems })
      await load()
      setEditingOffer(false)
    } finally {
      setSaving(false)
    }
  }

  const sendOffer = async () => {
    if (!data) return
    const draft = data.offers.find(o => o.status === 'draft')
    if (!draft) return
    if (!confirm(t('quoteRequests.detail.fields.confirmSend'))) return
    setSaving(true)
    try {
      await api.patch(`/admin/offers/${draft.id}`, { status: 'sent' })
      await load()
    } finally {
      setSaving(false)
    }
  }

  const downloadDoc = async (offerId: number, type: 'pdf' | 'docx', offerNumber: string) => {
    const key = `${offerId}-${type}`
    setDownloading(prev => ({ ...prev, [key]: true }))
    try {
      const res = await api.get(`/admin/offers/${offerId}/${type}`, { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `oferta-${offerNumber.replace(/\//g, '_')}.${type}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } finally {
      setDownloading(prev => ({ ...prev, [key]: false }))
    }
  }

  const cancelOffer = async (offerId: number) => {
    if (!confirm(t('quoteRequests.detail.confirmCancel'))) return
    setSaving(true)
    try {
      await api.post(`/admin/offers/${offerId}/cancel`)
      await load()
    } finally {
      setSaving(false)
    }
  }

  const addOfferItem = () => {
    setOfferItems(prev => [
      ...prev,
      {
        id: -Date.now(),
        description: '',
        quantity: 1,
        unit: 'szt.',
        unit_price_net: 0,
        total_price_net: 0,
        sort_order: prev.length + 1,
      },
    ])
  }

  const updateOfferItem = (idx: number, field: keyof OfferItem, value: string | number) => {
    setOfferItems(prev => prev.map((item, i) => {
      if (i !== idx) return item
      const updated = { ...item, [field]: value }
      updated.total_price_net = Number(updated.unit_price_net) * Number(updated.quantity)
      return updated
    }))
  }

  const removeOfferItem = (idx: number) => {
    setOfferItems(prev => prev.filter((_, i) => i !== idx))
  }

  if (loading) return (
    <MainLayout>
      <SkeletonLoader count={8} />
    </MainLayout>
  )

  if (!data) return (
    <MainLayout>
      <Card className="p-12 flex items-center justify-center">
        <p className="text-gray-500">{t('quoteRequests.detail.notFound')}</p>
      </Card>
    </MainLayout>
  )

  const draftOffer = data.offers.find(o => o.status === 'draft')
  const sentOffers = data.offers.filter(o => o.status !== 'draft')
  const hasAcceptedOffer = data.offers.some(o => o.status === 'accepted')

  const offerTotal = offerItems.reduce((sum, i) => sum + Number(i.unit_price_net) * Number(i.quantity), 0)

  return (
    <MainLayout headerComponent={
      <MainHeader
        title={data.request_number}
        subTitle={`Złożone ${formatDate(data.created_at)}`}
      >
        <div className="flex items-center gap-2 flex-wrap">
          {saving && <span className="text-xs text-gray-400">{t('quoteRequests.detail.saving')}</span>}
          <Button variant="outline" size="sm" onClick={() => navigate('/quote-requests')}>
            <ArrowLeft className="h-4 w-4" />
            {t('quoteRequests.detail.back')}
          </Button>
        </div>
      </MainHeader>
    }>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 xl:gap-8">

        {/* LEFT: Main data */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Status */}
          <Card className="p-6 lg:p-8 gap-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 text-base lg:text-lg">{t('quoteRequests.detail.requestStatus')}</h3>
              <Badge variant={statusBadge(data.status)}>{statusLabel(data.status)}</Badge>
            </div>
            <div className="flex gap-2 flex-wrap">
              {STATUS_VALUES.map(value => (
                <button
                  key={value}
                  onClick={() => updateStatus(value)}
                  disabled={data.status === value || saving}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-colors cursor-pointer disabled:opacity-50 ${
                    data.status === value
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {t(`status.${value}`)}
                </button>
              ))}
            </div>
          </Card>

          {/* Investor data */}
          <Card className="p-6 lg:p-8 gap-0">
            <h3 className="font-semibold text-gray-900 text-base lg:text-lg mb-5">{t('quoteRequests.detail.investorData')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 lg:gap-6">
              <EditableField label={t('quoteRequests.detail.fields.name')} value={data.investor_name} field="investor_name" onSave={updateField} />
              <EditableField label={t('quoteRequests.detail.fields.email')} value={data.investor_email} field="investor_email" onSave={updateField} />
              <EditableField label={t('quoteRequests.detail.fields.phone')} value={data.investor_phone} field="investor_phone" onSave={updateField} />
              <EditableField label={t('quoteRequests.detail.fields.company')} value={data.investor_company} field="investor_company" onSave={updateField} />
              <EditableField label={t('quoteRequests.detail.fields.nip')} value={data.investor_nip} field="investor_nip" onSave={updateField} />
              <EditableField label={t('quoteRequests.detail.fields.address')} value={data.investor_address} field="investor_address" onSave={updateField} />
              <EditableField label={t('quoteRequests.detail.fields.city')} value={data.investor_city} field="investor_city" onSave={updateField} />
            </div>
          </Card>

          {/* Investment data */}
          <Card className="p-6 lg:p-8 gap-0">
            <h3 className="font-semibold text-gray-900 text-base lg:text-lg mb-5">{t('quoteRequests.detail.investmentData')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 lg:gap-6">
              <EditableField label={t('quoteRequests.detail.fields.investmentName')} value={data.investment_name} field="investment_name" onSave={updateField} />
              <EditableField label={t('quoteRequests.detail.fields.investmentAddress')} value={data.investment_address} field="investment_address" onSave={updateField} />
              <Field label={t('quoteRequests.detail.fields.floors')} value={data.floors} />
              <Field label={t('quoteRequests.detail.fields.stops')} value={data.stops} />
            </div>
          </Card>

          {/* Technical parameters */}
          <Card className="p-6 lg:p-8 gap-0">
            <h3 className="font-semibold text-gray-900 text-base lg:text-lg mb-5">{t('quoteRequests.detail.technicalParams')}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5 lg:gap-6">
              <Field label={t('quoteRequests.detail.fields.capacity')} value={data.lift_capacity} />
              <Field label={t('quoteRequests.detail.fields.driveType')} value={data.drive_type} />
              <Field label={t('quoteRequests.detail.fields.shaftWidth')} value={data.shaft_width} />
              <Field label={t('quoteRequests.detail.fields.shaftDepth')} value={data.shaft_depth} />
              <Field label={t('quoteRequests.detail.fields.cabinWidth')} value={data.cabin_width} />
              <Field label={t('quoteRequests.detail.fields.cabinDepth')} value={data.cabin_depth} />
              <Field label={t('quoteRequests.detail.fields.cabinHeight')} value={data.cabin_height} />
              <Field label={t('quoteRequests.detail.fields.pitDepth')} value={data.pit_depth} />
              <Field label={t('quoteRequests.detail.fields.overhead')} value={data.overhead} />
              <Field label={t('quoteRequests.detail.fields.doorType')} value={data.door_type} />
              <Field label={t('quoteRequests.detail.fields.doorWidth')} value={data.door_width} />
              <Field label={t('quoteRequests.detail.fields.doorHeight')} value={data.door_height} />
            </div>
          </Card>

          {/* Finishes */}
          <Card className="p-6 lg:p-8 gap-0">
            <h3 className="font-semibold text-gray-900 text-base lg:text-lg mb-5">{t('quoteRequests.detail.finishes')}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5 lg:gap-6">
              <Field label="Poręcze" value={data.handrail} />
              <Field label="Podsufitka" value={data.ceiling} />
              <Field label="Oświetlenie" value={data.lighting} />
              <Field label="Podłoga" value={data.floor_material} />
              <Field label="Panel sterowania" value={data.control_panel} />
            </div>
            {data.additional_notes && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 mb-2">{t('quoteRequests.detail.calculatorData')}</p>
                {(() => {
                  try {
                    const notes = JSON.parse(data.additional_notes)
                    const labelMap: Record<string, string> = {
                      liftingHeight: 'Wys. podnoszenia [m]',
                      accessCount: 'Liczba dojść',
                      ei30DoorsCount: 'Drzwi EI30',
                      ei60DoorsCount: 'Drzwi EI60',
                      leftSideMechanic: 'Maszynownia lewa',
                      status: 'Status zgłaszającego',
                      cabinModel: 'Model kabiny',
                      manufactureOfDoors: 'Drzwi przystankowe',
                      identicalDoors: 'Drzwi identyczne',
                      manufactureOfCabinDoors: 'Drzwi kabinowe',
                      energyRecovery: 'Odzysk energii',
                      antiVibrationSystems: 'System antywibracyjny',
                      cabinMonitoringSystem: 'Monitoring kabiny',
                      shaftLighting: 'Oświetlenie szybu',
                      increaseSpeed: 'Zwiększenie prędkości',
                    }
                    return (
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        {Object.entries(notes).map(([key, val]) => (
                          <div key={key} className="flex gap-2 text-xs">
                            <span className="text-gray-400 shrink-0">{labelMap[key] ?? key}:</span>
                            <span className="text-gray-700">{String(val === true ? 'TAK' : val === false ? 'NIE' : val ?? '—')}</span>
                          </div>
                        ))}
                      </div>
                    )
                  } catch {
                    return <p className="text-sm text-gray-700 whitespace-pre-wrap">{data.additional_notes}</p>
                  }
                })()}
              </div>
            )}
          </Card>
        </div>

        {/* RIGHT: Elevator + Offer */}
        <div className="flex flex-col gap-6">

          {/* Matched elevator */}
          <Card className="p-6 gap-0">
            <h3 className="font-medium text-gray-900 mb-3">{t('quoteRequests.detail.matchedElevator')}</h3>
            {data.elevator ? (
              <div className="flex flex-col gap-1.5">
                <p className="text-sm font-medium">{data.elevator.manufacturer} {data.elevator.model}</p>
                <p className="text-xs text-gray-500">{t('quoteRequests.detail.basePrice')}: {formatPrice(data.elevator.base_price)}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-400">{t('quoteRequests.detail.noElevator')}</p>
            )}
            {hasAcceptedOffer ? (
              <p className="mt-4 text-xs text-center text-green-700 bg-green-50 border border-green-200 rounded-lg py-2 px-3">
                ✓ {t('quoteRequests.detail.offerAcceptedNoNew')}
              </p>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="mt-4 w-full"
                onClick={generateOffer}
                disabled={generating}
              >
                <Wand2 className="h-4 w-4" />
                {generating ? t('quoteRequests.detail.generating') : t('quoteRequests.detail.generateOffer')}
              </Button>
            )}
          </Card>

          {/* Offer editor */}
          {(draftOffer || editingOffer) && (
            <Card className="p-6 gap-0">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">
                  <FileText className="inline h-4 w-4 mr-1 text-gray-400" />
                  {draftOffer ? `${draftOffer.offer_number}` : t('quoteRequests.detail.newOffer')}
                </h3>
                <Badge variant="secondary">{t('quoteRequests.detail.draft')}</Badge>
              </div>

              <div className="flex flex-col gap-2 mb-3">
                {offerItems.map((item, idx) => (
                  <div key={item.id} className="flex gap-2 items-start text-sm">
                    <div className="flex-1">
                      <input
                        value={item.description}
                        onChange={e => updateOfferItem(idx, 'description', e.target.value)}
                        placeholder="Opis pozycji"
                        className="w-full border border-gray-200 rounded px-2 py-1 text-xs bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-300"
                      />
                      <div className="flex gap-1 mt-1">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={e => updateOfferItem(idx, 'quantity', Number(e.target.value))}
                          className="w-16 border border-gray-200 rounded px-2 py-1 text-xs bg-gray-50 focus:outline-none"
                          min={0}
                        />
                        <input
                          value={item.unit}
                          onChange={e => updateOfferItem(idx, 'unit', e.target.value)}
                          className="w-14 border border-gray-200 rounded px-2 py-1 text-xs bg-gray-50 focus:outline-none"
                          placeholder="szt."
                        />
                        <input
                          type="number"
                          value={item.unit_price_net}
                          onChange={e => updateOfferItem(idx, 'unit_price_net', Number(e.target.value))}
                          className="flex-1 border border-gray-200 rounded px-2 py-1 text-xs bg-gray-50 focus:outline-none"
                          min={0}
                          placeholder="Cena netto"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => removeOfferItem(idx)}
                      className="text-red-400 hover:text-red-600 mt-1 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={addOfferItem}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 cursor-pointer mb-3"
              >
                <Plus className="h-3 w-3" /> {t('quoteRequests.detail.addItem')}
              </button>

              <div className="border-t border-gray-100 pt-3 mb-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t('quoteRequests.detail.netTotal')}</span>
                  <span className="font-semibold">{formatPrice(offerTotal)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>{t('quoteRequests.detail.vat')} 23%</span>
                  <span>{formatPrice(offerTotal * 0.23)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold mt-1">
                  <span>{t('quoteRequests.detail.gross')}</span>
                  <span>{formatPrice(offerTotal * 1.23)}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button size="sm" onClick={saveOffer} disabled={saving} className="w-full">
                  <Save className="h-4 w-4" />
                  {t('quoteRequests.detail.saveOffer')}
                </Button>
                <Button variant="outline" size="sm" onClick={sendOffer} disabled={saving || hasAcceptedOffer} className="w-full">
                  {t('quoteRequests.detail.markAsSent')}
                </Button>
              </div>
            </Card>
          )}

          {/* Sent offers history */}
          {sentOffers.length > 0 && (
            <Card className="p-6 gap-0">
              <h3 className="font-medium text-gray-900 mb-3">{t('quoteRequests.detail.offerHistory')}</h3>
              <div className="flex flex-col gap-3">
                {sentOffers.map(offer => (
                  <div key={offer.id} className={`border rounded-lg p-3 text-sm ${offer.status === 'cancelled' ? 'border-gray-200 bg-gray-50 opacity-70' : 'border-gray-100'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <p className={`font-mono text-xs ${offer.status === 'cancelled' ? 'text-gray-400 line-through' : 'text-gray-500'}`}>{offer.offer_number}</p>
                      <Badge variant={statusBadge(offer.status)}>{statusLabel(offer.status)}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-400">{offer.sent_at ? formatDate(offer.sent_at) : '—'}</p>
                      <p className={`font-semibold ${offer.status === 'cancelled' ? 'text-gray-400' : ''}`}>{formatPrice(offer.total_price_gross)}</p>
                    </div>
                    {offer.status !== 'cancelled' && (
                      <div className="flex gap-2 mt-2 pt-2 border-t border-gray-100">
                        <button
                          onClick={() => downloadDoc(offer.id, 'pdf', offer.offer_number)}
                          disabled={!!downloading[`${offer.id}-pdf`]}
                          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 cursor-pointer transition-colors"
                        >
                          <FileDown className="h-3 w-3" />
                          {downloading[`${offer.id}-pdf`] ? '...' : 'PDF'}
                        </button>
                        <button
                          onClick={() => downloadDoc(offer.id, 'docx', offer.offer_number)}
                          disabled={!!downloading[`${offer.id}-docx`]}
                          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded border border-blue-200 text-blue-600 hover:bg-blue-50 disabled:opacity-50 cursor-pointer transition-colors"
                        >
                          <FileDown className="h-3 w-3" />
                          {downloading[`${offer.id}-docx`] ? '...' : 'DOCX'}
                        </button>
                      </div>
                    )}
                    {offer.status === 'cancelled' && offer.cancelled_at && (
                      <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-500">
                        <span>✕</span>
                        <span>{t('quoteRequests.detail.cancelledAt')} · {formatDate(offer.cancelled_at)}</span>
                      </div>
                    )}
                    {offer.client_response && (
                      <div className={`mt-2 pt-2 border-t border-gray-100 flex items-center gap-2 text-xs ${offer.client_response === 'accepted' ? 'text-green-700' : 'text-red-700'}`}>
                        <span>{offer.client_response === 'accepted' ? '✓' : '✗'}</span>
                        <span>
                          {offer.client_response === 'accepted' ? t('quoteRequests.detail.clientAccepted') : t('quoteRequests.detail.clientRejected')}
                          {offer.client_responded_at && ` · ${formatDate(offer.client_responded_at)}`}
                        </span>
                      </div>
                    )}
                    {offer.status === 'sent' && !offer.client_response && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={saving}
                          onClick={() => cancelOffer(offer.id)}
                          className="w-full text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          {t('quoteRequests.detail.cancelOffer')}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  )
}

export default QuoteRequestDetail
