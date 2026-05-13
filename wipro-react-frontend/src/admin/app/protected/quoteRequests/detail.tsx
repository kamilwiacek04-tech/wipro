import { Badge, statusBadge, statusLabel } from '@admin/components/Badge'
import { Button } from '@admin/components/Button'
import { Card } from '@admin/components/Cards'
import SkeletonLoader from '@admin/components/SkeletonLoader'
import MainHeader from '@admin/components/layout/MainHeader'
import MainLayout from '@admin/components/layout/MainLayout'
import formatDate, { formatPrice } from '@admin/functions/formatDate'
import api from '@admin/store/axiosInstance'
import { adminViewStore } from '@admin/store/zustand/adminViewStore'
import { authStore } from '@admin/store/zustand/authStore'
import {
  ArrowLeft,
  ArrowUpDown,
  Building2,
  ChevronRight,
  DoorOpen,
  FileDown,
  FileText,
  Gauge,
  Hash,
  Layers3,
  Mail,
  MapPin,
  MessageSquare,
  Pencil,
  Plus,
  Save,
  Search,
  Settings2,
  Trash2,
  User,
  UserCheck,
  Wand2,
  Wrench,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'

// ─── Interfaces ───────────────────────────────────────────────────────────────

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

interface AdminBrief { id: number; name: string; email: string }

interface ElevatorBrief {
  id: number
  manufacturer: string
  model: string
  base_price: number | null
  capacity: number | null
}

interface QuoteRequestDetail {
  id: number
  request_number: string
  status: string
  created_at: string
  assigned_admin_id: number | null
  assigned_admin: AdminBrief | null
  investor_name: string
  investor_email: string
  investor_phone: string | null
  investor_company: string | null
  investor_nip: string | null
  investor_address: string | null
  investor_city: string | null
  investment_name: string | null
  investment_address: string | null
  investment_city: string | null
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
  elevator_id: number | null
  elevator: ElevatorBrief | null
  offers: Offer[]
}

// ─── Enum option maps ─────────────────────────────────────────────────────────

const LIFT_PURPOSE_OPTIONS = [
  { value: 'PASSENGER',          label: 'Osobowa' },
  { value: 'FREIGHT_PASSENGER',  label: 'Towarowo-osobowa' },
  { value: 'HOSPITAL',           label: 'Szpitalna' },
  { value: 'FIRE',               label: 'Pożarowa' },
  { value: 'FREIGHT',            label: 'Towarowa' },
  { value: 'SERVICE',            label: 'Serwisowa' },
  { value: 'RESIDENTIAL',        label: 'Mieszkalna' },
]

const ACCESS_DIAGRAM_OPTIONS = [
  { value: 'FRONT',      label: 'Czołowy (przód)' },
  { value: 'BACK',       label: 'Tylny (tył)' },
  { value: 'THROUGH',    label: 'Przelotowy' },
  { value: 'THROUGHT',   label: 'Przelotowy (alt.)' },
  { value: 'CORNER',     label: 'Narożny' },
  { value: 'TRIPARTITE', label: 'Trójstronny' },
  { value: 'LEFT',       label: 'Lewy' },
  { value: 'RIGHT',      label: 'Prawy' },
]

const INVESTOR_STATUS_OPTIONS = [
  { value: 'ARCHITECT',      label: 'Architekt' },
  { value: 'OWNER',          label: 'Właściciel' },
  { value: 'CONTRACTOR',     label: 'Generalny wykonawca' },
  { value: 'COST_ESTIMATOR', label: 'Kosztorysant' },
  { value: 'INVESTOR',       label: 'Inwestor' },
  { value: 'DISTRIBUTOR',    label: 'Dealer / Dystrybutor' },
  { value: 'OTHER',          label: 'Inny' },
]

const labelOf = (opts: { value: string; label: string }[], val: string | null | undefined) =>
  opts.find(o => o.value === val)?.label ?? val ?? '—'

// ─── Config (JSON inside additional_notes) ────────────────────────────────────

interface ConfiguratorData {
  liftingHeight?: number
  accessCount?: number
  ei30DoorsCount?: number
  ei60DoorsCount?: number
  leftSideMechanic?: boolean
  status?: string
  cabinModelId?: number
  panelId?: number
  signalId?: number
  ceilingId?: number
  mirrorId?: number
  handrailId?: number
  flooringId?: number
  extraIds?: number[]
  [key: string]: unknown
}

function parseNotes(raw: string | null): { userNote: string; config: ConfiguratorData | null } {
  if (!raw) return { userNote: '', config: null }
  const parts = raw.split('\n\n')
  let userNote = ''
  let config: ConfiguratorData | null = null
  for (const part of parts) {
    const trimmed = part.trim()
    if (trimmed.startsWith('{')) {
      try { config = JSON.parse(trimmed) } catch { /* ignore */ }
    } else if (trimmed) {
      userNote = trimmed
    }
  }
  return { userNote, config }
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

const SectionHeader = ({ icon: Icon, title }: { icon: React.ElementType; title: string }) => (
  <div className="flex items-center gap-2 mb-5">
    <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-50 shrink-0">
      <Icon className="h-3.5 w-3.5 text-amber-500" />
    </span>
    <h3 className="font-semibold text-gray-900 text-base">{title}</h3>
  </div>
)

const Chip = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-100 font-medium">
    {children}
  </span>
)

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{children}</p>
)

// Inline editable text / number / email / tel field
const EditableField = ({
  label, value, field, onSave, type = 'text', unit,
}: {
  label: string
  value: string | number | null | undefined
  field: string
  onSave: (field: string, value: string) => void
  type?: 'text' | 'number' | 'email' | 'tel'
  unit?: string
}) => {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(value ?? ''))
  const { t } = useTranslation()

  const commit = () => {
    setEditing(false)
    onSave(field, draft)
  }

  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      {editing ? (
        <input
          autoFocus
          type={type}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(String(value ?? '')); setEditing(false) } }}
          className="w-full text-sm border border-amber-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-200"
        />
      ) : (
        <p
          onClick={() => { setDraft(String(value ?? '')); setEditing(true) }}
          className={`text-sm cursor-pointer hover:bg-amber-50 rounded px-1 -ml-1 py-0.5 border border-transparent hover:border-amber-200 transition-colors inline-flex items-center gap-1 min-w-10 ${!value && value !== 0 ? 'text-gray-300' : 'text-gray-900'}`}
          title={t('quoteRequests.detail.clickToEdit')}
        >
          {value !== null && value !== undefined && value !== '' ? (
            <>{value}{unit ? <span className="text-gray-400 ml-1 text-xs">{unit}</span> : null}</>
          ) : '—'}
          <Pencil className="h-2.5 w-2.5 text-gray-300 ml-1 shrink-0" />
        </p>
      )}
    </div>
  )
}

// Inline editable dropdown
const EditableSelect = ({
  label, value, options, onSave,
}: {
  label: string
  value: string | null | undefined
  options: { value: string; label: string }[]
  onSave: (value: string | null) => void
}) => {
  const [editing, setEditing] = useState(false)
  const selectRef = useRef<HTMLSelectElement>(null)
  const { t } = useTranslation()

  useEffect(() => {
    if (editing) selectRef.current?.focus()
  }, [editing])

  const currentLabel = labelOf(options, value)

  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      {editing ? (
        <select
          ref={selectRef}
          value={value ?? ''}
          onBlur={() => setEditing(false)}
          onChange={e => { onSave(e.target.value || null); setEditing(false) }}
          className="w-full text-sm border border-amber-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-200 bg-white"
        >
          <option value="">— {t('common.empty')}</option>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <p
          onClick={() => setEditing(true)}
          className={`text-sm cursor-pointer hover:bg-amber-50 rounded px-1 -ml-1 py-0.5 border border-transparent hover:border-amber-200 transition-colors inline-flex items-center gap-1 min-w-10 ${!value ? 'text-gray-300' : 'text-gray-900'}`}
          title={t('quoteRequests.detail.clickToEdit')}
        >
          {value ? currentLabel : '—'}
          <Pencil className="h-2.5 w-2.5 text-gray-300 ml-1 shrink-0" />
        </p>
      )}
    </div>
  )
}

// Inline DB picker (searchable dropdown from pre-loaded DB options)
const DbPickerField = ({
  label, selectedId, options, onSave,
}: {
  label: string
  selectedId: number | null | undefined
  options: { id: number; name: string }[]
  onSave: (id: number | null) => void
}) => {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const { t } = useTranslation()

  const selected = options.find(o => o.id === selectedId)
  const filtered = search
    ? options.filter(o => o.name.toLowerCase().includes(search.toLowerCase()))
    : options

  return (
    <div className="relative">
      <FieldLabel>{label}</FieldLabel>
      <p
        onClick={() => { setSearch(''); setOpen(true) }}
        className={`text-sm cursor-pointer hover:bg-amber-50 rounded px-1 -ml-1 py-0.5 border border-transparent hover:border-amber-200 transition-colors inline-flex items-center gap-1 min-w-10 ${!selectedId ? 'text-gray-300' : 'text-gray-900'}`}
        title={t('quoteRequests.detail.clickToEdit')}
      >
        {selected ? selected.name : '—'}
        <Pencil className="h-2.5 w-2.5 text-gray-300 ml-1 shrink-0" />
      </p>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 left-0 top-full mt-1 w-56 bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden">
            <div className="p-2 border-b border-gray-100">
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('common.search')}
                className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-amber-300"
              />
            </div>
            <div className="max-h-48 overflow-y-auto">
              <button
                onClick={() => { onSave(null); setOpen(false) }}
                className="w-full text-left text-xs px-3 py-2 text-gray-400 hover:bg-gray-50 cursor-pointer"
              >
                {t('common.empty')}
              </button>
              {filtered.map(o => (
                <button
                  key={o.id}
                  onClick={() => { onSave(o.id); setOpen(false) }}
                  className={`w-full text-left text-xs px-3 py-2 cursor-pointer hover:bg-amber-50 ${o.id === selectedId ? 'bg-amber-50 font-medium text-amber-700' : 'text-gray-700'}`}
                >
                  {o.name}
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="text-xs text-center text-gray-400 py-3">—</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Multi-select extras picker
const ExtrasPickerField = ({
  label, selectedIds, options, onSave,
}: {
  label: string
  selectedIds: number[]
  options: { id: number; name: string }[]
  onSave: (ids: number[]) => void
}) => {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<number[]>(selectedIds)
  const { t } = useTranslation()

  const toggle = (id: number) =>
    setDraft(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])

  const commit = () => { onSave(draft); setOpen(false) }

  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      {open ? (
        <div className="border border-amber-300 rounded-lg p-2 bg-white">
          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
            {options.map(o => (
              <button
                key={o.id}
                onClick={() => toggle(o.id)}
                className={`text-xs px-2 py-1 rounded border transition-colors cursor-pointer ${
                  draft.includes(o.id)
                    ? 'bg-amber-100 border-amber-300 text-amber-800 font-medium'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-amber-200'
                }`}
              >
                {o.name}
              </button>
            ))}
          </div>
          <div className="flex gap-2 mt-2 pt-2 border-t border-gray-100">
            <Button size="sm" onClick={commit}><Save className="h-3 w-3" />{t('common.save')}</Button>
            <Button size="sm" variant="outline" onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => { setDraft(selectedIds); setOpen(true) }}
          className="flex flex-wrap gap-1 cursor-pointer hover:bg-amber-50 rounded p-1 -ml-1 border border-transparent hover:border-amber-200 transition-colors min-h-7"
          title={t('quoteRequests.detail.clickToEdit')}
        >
          {selectedIds.length > 0
            ? selectedIds.map(sid => {
                const opt = options.find(o => o.id === sid)
                return opt ? <Chip key={sid}>{opt.name}</Chip> : null
              })
            : <span className="text-sm text-gray-300 flex items-center gap-1">— <Pencil className="h-2.5 w-2.5" /></span>
          }
        </div>
      )}
    </div>
  )
}

// Inline editable textarea
const EditableTextarea = ({
  label, value, onSave,
}: {
  label: string
  value: string
  onSave: (value: string) => void
}) => {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const { t } = useTranslation()

  const commit = () => { setEditing(false); onSave(draft) }

  if (editing) {
    return (
      <div>
        <FieldLabel>{label}</FieldLabel>
        <textarea
          autoFocus
          value={draft}
          onChange={e => setDraft(e.target.value)}
          rows={4}
          className="w-full text-sm border border-amber-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-200 resize-none"
        />
        <div className="flex gap-2 mt-2">
          <Button size="sm" onClick={commit}><Save className="h-3 w-3" /> {t('common.save')}</Button>
          <Button size="sm" variant="outline" onClick={() => { setDraft(value); setEditing(false) }}>{t('common.cancel')}</Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div
        onClick={() => { setDraft(value); setEditing(true) }}
        className="text-sm cursor-pointer hover:bg-amber-50 rounded px-2 py-2 border border-transparent hover:border-amber-200 transition-colors min-h-10 whitespace-pre-wrap leading-relaxed text-gray-700"
        title={t('quoteRequests.detail.clickToEdit')}
      >
        {value || <span className="text-gray-300">—</span>}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

const STATUS_VALUES = ['new', 'in_progress', 'offer_sent', 'accepted', 'rejected'] as const

const QuoteRequestDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user } = authStore()
  const { admins, setAdmins } = adminViewStore()
  const isSuperAdmin = user?.role === 'superadmin'

  const [data, setData] = useState<QuoteRequestDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [downloading, setDownloading] = useState<Record<string, boolean>>({})
  const [offerItems, setOfferItems] = useState<OfferItem[]>([])
  const [editingOffer, setEditingOffer] = useState(false)
  const [assigning, setAssigning] = useState(false)

  // Lookup data
  const [cabinModels, setCabinModels] = useState<{ id: number; name_pl: string }[]>([])
  const [cabinAccessories, setCabinAccessories] = useState<{ id: number; name_pl: string; category: string }[]>([])
  const [elevators, setElevators] = useState<ElevatorBrief[]>([])

  // Elevator picker
  const [showElevatorPicker, setShowElevatorPicker] = useState(false)
  const [elevatorSearch, setElevatorSearch] = useState('')

  const load = () => {
    api.get(`/admin/quote-requests/${id}`)
      .then(res => {
        setData(res.data)
        const draft = res.data.offers?.find((o: Offer) => o.status === 'draft')
        if (draft) setOfferItems([...draft.items].sort((a: OfferItem, b: OfferItem) => a.sort_order - b.sort_order))
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    api.get('/admin/cabin-models').then(r => setCabinModels(r.data)).catch(() => {})
    api.get('/admin/cabin-accessories').then(r => setCabinAccessories(r.data)).catch(() => {})
    api.get('/admin/elevators').then(r => setElevators(Array.isArray(r.data) ? r.data : r.data?.data ?? [])).catch(() => {})
  }, [])

  useEffect(() => { load() }, [id])

  useEffect(() => {
    if (isSuperAdmin && admins.length === 0) {
      api.get('/admin/admins').then(r => setAdmins(r.data)).catch(() => {})
    }
  }, [isSuperAdmin])

  // ── Patch helpers ──────────────────────────────────────────────────────────

  const patchField = async (field: string, value: string | number | null) => {
    if (!data) return
    setSaving(true)
    try {
      const res = await api.patch(`/admin/quote-requests/${id}`, { [field]: value })
      setData(res.data)
    } finally {
      setSaving(false)
    }
  }

  // For text fields: empty string → null
  const saveTextField = (field: string, value: string) => patchField(field, value || null)

  // For number fields: empty string → null, otherwise parse number
  const saveNumberField = (field: string, value: string) => {
    patchField(field, value !== '' ? Number(value) : null)
  }

  const updateStatus = (status: string) => patchField('status', status)

  // Config JSON helpers
  const saveConfigKey = async (key: string, value: unknown) => {
    if (!data) return
    const { userNote, config: currentConfig } = parseNotes(data.additional_notes)
    const newConfig = { ...(currentConfig ?? {}), [key]: value }
    const parts = [userNote, JSON.stringify(newConfig)].filter(Boolean)
    await patchField('additional_notes', parts.join('\n\n') || null)
  }

  const saveUserNote = async (note: string) => {
    if (!data) return
    const { config: currentConfig } = parseNotes(data.additional_notes)
    const parts = [note, currentConfig ? JSON.stringify(currentConfig) : ''].filter(Boolean)
    await patchField('additional_notes', parts.join('\n\n') || null)
  }

  const patchRaw = async (body: Record<string, unknown>) => {
    if (!data) return
    setSaving(true)
    try {
      const res = await api.patch(`/admin/quote-requests/${id}`, body)
      setData(res.data)
    } finally {
      setSaving(false)
    }
  }

  const saveAccessory = (configKey: string, accessoryId: number | null | undefined, dbField?: string) => {
    if (!data) return
    const { userNote, config: currentConfig } = parseNotes(data.additional_notes)
    const newConfig: Record<string, unknown> = { ...(currentConfig ?? {}) }
    if (accessoryId) {
      newConfig[configKey] = accessoryId
    } else {
      delete newConfig[configKey]
    }
    const parts = [userNote, JSON.stringify(newConfig)].filter(Boolean)
    const body: Record<string, unknown> = { additional_notes: parts.join('\n\n') || null }
    if (dbField !== undefined) {
      body[dbField] = accessoryId
        ? (cabinAccessories.find(a => a.id === accessoryId)?.name_pl ?? null)
        : null
    }
    patchRaw(body)
  }

  // ── Offer helpers ──────────────────────────────────────────────────────────

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

  const assignAdmin = async (adminId: number | null) => {
    setAssigning(true)
    try {
      const res = await api.patch(`/admin/quote-requests/${id}/assign`, { assigned_admin_id: adminId })
      setData(res.data)
    } finally {
      setAssigning(false)
    }
  }

  const addOfferItem = () => setOfferItems(prev => [
    ...prev,
    { id: -Date.now(), description: '', quantity: 1, unit: 'szt.', unit_price_net: 0, total_price_net: 0, sort_order: prev.length + 1 },
  ])

  const updateOfferItem = (idx: number, field: keyof OfferItem, value: string | number) => {
    setOfferItems(prev => prev.map((item, i) => {
      if (i !== idx) return item
      const updated = { ...item, [field]: value }
      updated.total_price_net = Number(updated.unit_price_net) * Number(updated.quantity)
      return updated
    }))
  }

  const removeOfferItem = (idx: number) => setOfferItems(prev => prev.filter((_, i) => i !== idx))

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) return <MainLayout><SkeletonLoader count={8} /></MainLayout>
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
  const { userNote, config } = parseNotes(data.additional_notes)

  const filteredElevators = elevators.filter(e => {
    const q = elevatorSearch.toLowerCase()
    return !q || e.manufacturer.toLowerCase().includes(q) || e.model.toLowerCase().includes(q)
  })

  return (
    <MainLayout headerComponent={
      <MainHeader title={data.request_number} subTitle={t('quoteRequests.detail.submittedAt', { date: formatDate(data.created_at) })}>
        <div className="flex items-center gap-2 flex-wrap">
          {saving && <span className="text-xs text-gray-400 animate-pulse">{t('quoteRequests.detail.saving')}</span>}
          <Button variant="outline" size="sm" onClick={() => navigate('/quote-requests')}>
            <ArrowLeft className="h-4 w-4" />
            {t('quoteRequests.detail.back')}
          </Button>
        </div>
      </MainHeader>
    }>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 xl:gap-8">

        {/* ── LEFT COLUMN ─────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Status */}
          <Card className="p-6 gap-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">{t('quoteRequests.detail.requestStatus')}</h3>
              <Badge variant={statusBadge(data.status)}>{statusLabel(data.status)}</Badge>
            </div>
            <div className="flex gap-2 flex-wrap">
              {STATUS_VALUES.map(value => (
                <button
                  key={value}
                  onClick={() => updateStatus(value)}
                  disabled={data.status === value || saving}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border transition-colors cursor-pointer disabled:opacity-50 ${
                    data.status === value
                      ? 'bg-[#ffb400] text-gray-900 border-[#ffb400] font-semibold'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-700'
                  }`}
                >
                  {data.status === value && <ChevronRight className="h-3 w-3" />}
                  {t(`status.${value}`)}
                </button>
              ))}
            </div>
          </Card>

          {/* Dane klienta */}
          <Card className="p-6 gap-0">
            <SectionHeader icon={User} title={t('quoteRequests.detail.clientData')} />
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              <EditableField label={t('quoteRequests.detail.fields.name')} value={data.investor_name} field="investor_name" onSave={saveTextField} />
              <EditableField label={t('quoteRequests.detail.fields.email')} value={data.investor_email} field="investor_email" onSave={saveTextField} type="email" />
              <EditableField label={t('quoteRequests.detail.fields.phone')} value={data.investor_phone} field="investor_phone" onSave={saveTextField} type="tel" />
              <div className="flex items-start gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-gray-300 mt-4 shrink-0" />
                <EditableField label={t('quoteRequests.detail.fields.company')} value={data.investor_company} field="investor_company" onSave={saveTextField} />
              </div>
              <div className="flex items-start gap-1.5">
                <Hash className="h-3.5 w-3.5 text-gray-300 mt-4 shrink-0" />
                <EditableField label={t('quoteRequests.detail.fields.nip')} value={data.investor_nip} field="investor_nip" onSave={saveTextField} />
              </div>
              <EditableField label={t('quoteRequests.detail.fields.address')} value={data.investor_address} field="investor_address" onSave={saveTextField} />
              <EditableField label={t('quoteRequests.detail.fields.city')} value={data.investor_city} field="investor_city" onSave={saveTextField} />
              <EditableSelect
                label={t('quoteRequests.detail.applicantStatus')}
                value={config?.status ?? null}
                options={INVESTOR_STATUS_OPTIONS}
                onSave={val => saveConfigKey('status', val)}
              />
            </div>
          </Card>

          {/* Dane inwestycji */}
          <Card className="p-6 gap-0">
            <SectionHeader icon={MapPin} title={t('quoteRequests.detail.investmentData')} />
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              <EditableField label={t('quoteRequests.detail.investmentNameLabel')} value={data.investment_name} field="investment_name" onSave={saveTextField} />
              <EditableField label={t('quoteRequests.detail.installationAddress')} value={data.investment_address} field="investment_address" onSave={saveTextField} />
              <EditableField label={t('quoteRequests.detail.fields.city')} value={data.investment_city} field="investment_city" onSave={saveTextField} />
              <EditableField label={t('quoteRequests.detail.fields.floors')} value={data.floors} field="floors" onSave={saveNumberField} type="number" />
              <EditableField label={t('quoteRequests.detail.fields.stops')} value={data.stops} field="stops" onSave={saveNumberField} type="number" />
            </div>
          </Card>

          {/* Specyfikacja techniczna — always visible, all editable */}
          <Card className="p-6 gap-0">
            <SectionHeader icon={Settings2} title={t('quoteRequests.detail.technicalSpec')} />
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5">
              <EditableField label={t('quoteRequests.detail.capacityLabel')} value={data.lift_capacity} field="lift_capacity" onSave={saveNumberField} type="number" unit="kg" />
              <EditableSelect
                label={t('quoteRequests.detail.elevatorTypeLabel')}
                value={data.drive_type}
                options={LIFT_PURPOSE_OPTIONS}
                onSave={val => saveTextField('drive_type', val ?? '')}
              />
              <EditableSelect
                label={t('quoteRequests.detail.accessLayoutLabel')}
                value={data.door_type}
                options={ACCESS_DIAGRAM_OPTIONS}
                onSave={val => saveTextField('door_type', val ?? '')}
              />
            </div>

            {/* Szyb */}
            <div className="mt-5 pt-4 border-t border-gray-50">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Wrench className="h-3 w-3" /> {t('quoteRequests.detail.shaft')}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
                <EditableField label={t('quoteRequests.detail.width')} value={data.shaft_width} field="shaft_width" onSave={saveNumberField} type="number" unit="mm" />
                <EditableField label={t('quoteRequests.detail.depth')} value={data.shaft_depth} field="shaft_depth" onSave={saveNumberField} type="number" unit="mm" />
                <EditableField label={t('quoteRequests.detail.pitDepthLabel')} value={data.pit_depth} field="pit_depth" onSave={saveNumberField} type="number" unit="mm" />
                <EditableField label={t('quoteRequests.detail.headroomLabel')} value={data.overhead} field="overhead" onSave={saveNumberField} type="number" unit="mm" />
              </div>
            </div>

            {/* Kabina */}
            <div className="mt-5 pt-4 border-t border-gray-50">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Gauge className="h-3 w-3" /> {t('quoteRequests.detail.cabinSection')}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                <EditableField label={t('quoteRequests.detail.width')} value={data.cabin_width} field="cabin_width" onSave={saveNumberField} type="number" unit="mm" />
                <EditableField label={t('quoteRequests.detail.depth')} value={data.cabin_depth} field="cabin_depth" onSave={saveNumberField} type="number" unit="mm" />
                <EditableField label={t('quoteRequests.detail.height')} value={data.cabin_height} field="cabin_height" onSave={saveNumberField} type="number" unit="mm" />
              </div>
            </div>

            {/* Drzwi */}
            <div className="mt-5 pt-4 border-t border-gray-50">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <DoorOpen className="h-3 w-3" /> {t('quoteRequests.detail.doorsSection')}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                <EditableField label={t('quoteRequests.detail.width')} value={data.door_width} field="door_width" onSave={saveNumberField} type="number" unit="mm" />
                <EditableField label={t('quoteRequests.detail.height')} value={data.door_height} field="door_height" onSave={saveNumberField} type="number" unit="mm" />
              </div>
            </div>
          </Card>

          {/* Wykończenie — always visible, all editable from DB */}
          <Card className="p-6 gap-0">
            <SectionHeader icon={Layers3} title={t('quoteRequests.detail.finishesSection')} />
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              <DbPickerField
                label={t('quoteRequests.detail.cabinModel')}
                selectedId={config?.cabinModelId}
                options={cabinModels.map(m => ({ id: m.id, name: m.name_pl }))}
                onSave={aid => saveAccessory('cabinModelId', aid)}
              />
              <DbPickerField
                label={t('quoteRequests.detail.fields.controlPanel')}
                selectedId={config?.panelId}
                options={cabinAccessories.filter(a => a.category === 'PANEL').map(a => ({ id: a.id, name: a.name_pl }))}
                onSave={aid => saveAccessory('panelId', aid, 'control_panel')}
              />
              <DbPickerField
                label={t('quoteRequests.detail.signal')}
                selectedId={config?.signalId}
                options={cabinAccessories.filter(a => a.category === 'SIGNAL').map(a => ({ id: a.id, name: a.name_pl }))}
                onSave={aid => saveAccessory('signalId', aid)}
              />
              <DbPickerField
                label={t('quoteRequests.detail.fields.ceiling')}
                selectedId={config?.ceilingId}
                options={cabinAccessories.filter(a => a.category === 'CEILING').map(a => ({ id: a.id, name: a.name_pl }))}
                onSave={aid => saveAccessory('ceilingId', aid, 'ceiling')}
              />
              <DbPickerField
                label={t('quoteRequests.detail.mirror')}
                selectedId={config?.mirrorId}
                options={cabinAccessories.filter(a => a.category === 'MIRROR').map(a => ({ id: a.id, name: a.name_pl }))}
                onSave={aid => saveAccessory('mirrorId', aid)}
              />
              <DbPickerField
                label={t('quoteRequests.detail.fields.handrail')}
                selectedId={config?.handrailId}
                options={cabinAccessories.filter(a => a.category === 'HANDRAIL').map(a => ({ id: a.id, name: a.name_pl }))}
                onSave={aid => saveAccessory('handrailId', aid, 'handrail')}
              />
              <DbPickerField
                label={t('quoteRequests.detail.fields.floor')}
                selectedId={config?.flooringId}
                options={cabinAccessories.filter(a => a.category === 'FLOORING').map(a => ({ id: a.id, name: a.name_pl }))}
                onSave={aid => saveAccessory('flooringId', aid, 'floor_material')}
              />
              <EditableField label={t('quoteRequests.detail.fields.lighting')} value={data.lighting} field="lighting" onSave={saveTextField} />
            </div>
            <div className="mt-5 pt-4 border-t border-gray-50">
              <ExtrasPickerField
                label={t('quoteRequests.detail.extrasLabel')}
                selectedIds={config?.extraIds ?? []}
                options={cabinAccessories.filter(a => a.category === 'EXTRA').map(a => ({ id: a.id, name: a.name_pl }))}
                onSave={ids => saveConfigKey('extraIds', ids.length > 0 ? ids : undefined)}
              />
            </div>
          </Card>

          {/* Konfiguracja instalacji — always visible */}
          <Card className="p-6 gap-0">
            <SectionHeader icon={ArrowUpDown} title={t('quoteRequests.detail.installationConfig')} />
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5">
              <EditableField
                label={t('quoteRequests.detail.liftingHeightLabel')}
                value={config?.liftingHeight ?? null}
                field="liftingHeight"
                onSave={(_, val) => saveConfigKey('liftingHeight', val ? Number(val) : undefined)}
                type="number" unit="m"
              />
              <EditableField
                label={t('quoteRequests.detail.accessCountLabel')}
                value={config?.accessCount ?? null}
                field="accessCount"
                onSave={(_, val) => saveConfigKey('accessCount', val ? Number(val) : undefined)}
                type="number"
              />
              <EditableField
                label={t('quoteRequests.detail.ei30Doors')}
                value={config?.ei30DoorsCount ?? null}
                field="ei30DoorsCount"
                onSave={(_, val) => saveConfigKey('ei30DoorsCount', val ? Number(val) : 0)}
                type="number" unit={t('quoteRequests.detail.fields.pcs')}
              />
              <EditableField
                label={t('quoteRequests.detail.ei60Doors')}
                value={config?.ei60DoorsCount ?? null}
                field="ei60DoorsCount"
                onSave={(_, val) => saveConfigKey('ei60DoorsCount', val ? Number(val) : 0)}
                type="number" unit={t('quoteRequests.detail.fields.pcs')}
              />
              <div>
                <FieldLabel>{t('quoteRequests.detail.leftMachine')}</FieldLabel>
                <button
                  onClick={() => saveConfigKey('leftSideMechanic', !config?.leftSideMechanic)}
                  className={`text-sm px-2.5 py-1 rounded border cursor-pointer transition-colors ${
                    config?.leftSideMechanic
                      ? 'bg-amber-50 border-amber-200 text-amber-700 font-medium'
                      : 'border-gray-200 text-gray-400 hover:border-amber-200 hover:text-amber-600'
                  }`}
                >
                  {config?.leftSideMechanic ? t('common.yes') : t('common.no')}
                </button>
              </div>
            </div>
          </Card>

          {/* Uwagi klienta — editable */}
          <Card className="p-6 gap-0">
            <SectionHeader icon={MessageSquare} title={t('quoteRequests.detail.clientNotes')} />
            <EditableTextarea
              label={t('quoteRequests.detail.fields.notes')}
              value={userNote}
              onSave={saveUserNote}
            />
          </Card>
        </div>

        {/* ── RIGHT COLUMN ────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-6">

          {/* Assign admin */}
          {isSuperAdmin && (
            <Card className="p-6 gap-0">
              <div className="flex items-center gap-2 mb-3">
                <UserCheck className="h-4 w-4 text-amber-500" />
                <h3 className="font-medium text-gray-900">{t('quoteRequests.detail.assignedAdmin')}</h3>
              </div>
              {data.assigned_admin ? (
                <div className="mb-3 p-2.5 rounded-lg bg-amber-50 border border-amber-100">
                  <p className="text-sm font-medium text-gray-900">{data.assigned_admin.name}</p>
                  <p className="text-xs text-gray-500">{data.assigned_admin.email}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-400 mb-3">{t('quoteRequests.detail.noAssignedAdmin')}</p>
              )}
              <select
                value={data.assigned_admin_id ?? ''}
                onChange={e => assignAdmin(e.target.value ? Number(e.target.value) : null)}
                disabled={assigning}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:bg-white disabled:opacity-50"
              >
                <option value="">{t('quoteRequests.detail.noAssignment')}</option>
                {admins.filter(a => a.role !== 'superadmin').map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
              {assigning && <p className="text-xs text-gray-400 mt-2">{t('common.saving')}</p>}
            </Card>
          )}

          {/* Elevator card with picker */}
          <Card className="p-6 gap-0">
            <h3 className="font-medium text-gray-900 mb-3">{t('quoteRequests.detail.matchedElevator')}</h3>
            {data.elevator ? (
              <div className="flex flex-col gap-1.5 mb-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                <p className="text-sm font-semibold text-gray-900">{data.elevator.manufacturer} {data.elevator.model}</p>
                {data.elevator.base_price ? (
                  <p className="text-xs text-gray-500">
                    {t('quoteRequests.detail.basePriceLabel')} <span className="font-semibold text-gray-700">{formatPrice(data.elevator.base_price)}</span>
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 italic">{t('quoteRequests.detail.priceTbd')}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400 mb-3">{t('quoteRequests.detail.noElevator')}</p>
            )}
            <Button variant="outline" size="sm" className="w-full mb-3" onClick={() => { setElevatorSearch(''); setShowElevatorPicker(true) }}>
              <Search className="h-4 w-4" />
              {data.elevator ? t('quoteRequests.detail.changeElevator') : t('quoteRequests.detail.selectElevator')}
            </Button>
            {data.elevator && (
              <button
                onClick={() => patchField('elevator_id', null)}
                className="text-xs text-gray-400 hover:text-red-500 w-full text-center cursor-pointer"
              >
                {t('quoteRequests.detail.clearElevator')}
              </button>
            )}
            <div className="mt-3 pt-3 border-t border-gray-100">
              {hasAcceptedOffer ? (
                <p className="text-xs text-center text-green-700 bg-green-50 border border-green-200 rounded-lg py-2 px-3">
                  ✓ {t('quoteRequests.detail.offerAcceptedNoNew')}
                </p>
              ) : (
                <Button variant="outline" size="sm" className="w-full" onClick={generateOffer} disabled={generating}>
                  <Wand2 className="h-4 w-4" />
                  {generating ? t('quoteRequests.detail.generating') : t('quoteRequests.detail.generateOffer')}
                </Button>
              )}
            </div>
          </Card>

          {/* Offer editor */}
          {(draftOffer || editingOffer) && (
            <Card className="p-6 gap-0">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900 flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-gray-400" />
                  {draftOffer ? draftOffer.offer_number : t('quoteRequests.detail.newOffer')}
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
                        className="w-full border border-gray-200 rounded px-2 py-1 text-xs bg-gray-50 focus:outline-none focus:ring-1 focus:ring-amber-300"
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
                    <button onClick={() => removeOfferItem(idx)} className="text-red-400 hover:text-red-600 mt-1 cursor-pointer">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <button onClick={addOfferItem} className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-800 cursor-pointer mb-3">
                <Plus className="h-3 w-3" /> {t('quoteRequests.detail.addItem')}
              </button>

              <div className="border-t border-gray-100 pt-3 mb-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t('quoteRequests.detail.netTotal')}</span>
                  <span className="font-semibold">{formatPrice(offerTotal)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>{t('quoteRequests.detail.vat')} 23%</span>
                  <span>{formatPrice(offerTotal * 0.23)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold">
                  <span>{t('quoteRequests.detail.gross')}</span>
                  <span>{formatPrice(offerTotal * 1.23)}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button size="sm" onClick={saveOffer} disabled={saving} className="w-full">
                  <Save className="h-4 w-4" />
                  {t('quoteRequests.detail.saveOffer')}
                </Button>
                <Button size="sm" onClick={sendOffer} disabled={saving || hasAcceptedOffer} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  <Mail className="h-4 w-4" />
                  {t('quoteRequests.detail.markAsSent')}
                </Button>
              </div>
            </Card>
          )}

          {/* Offer history */}
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
                          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded border border-amber-200 text-amber-700 hover:bg-amber-50 disabled:opacity-50 cursor-pointer transition-colors"
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

      {/* ── Elevator picker modal ──────────────────────────────────────────── */}
      {showElevatorPicker && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowElevatorPicker(false) }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[80vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">{t('quoteRequests.detail.selectElevator')}</h2>
              <button onClick={() => setShowElevatorPicker(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-5 py-3 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  autoFocus
                  type="text"
                  value={elevatorSearch}
                  onChange={e => setElevatorSearch(e.target.value)}
                  placeholder={t('quoteRequests.detail.searchElevator')}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:bg-white"
                />
              </div>
            </div>

            <div className="overflow-y-auto flex-1">
              {filteredElevators.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-10">{t('quoteRequests.detail.noElevatorsFound')}</p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {filteredElevators.map(elev => (
                    <button
                      key={elev.id}
                      onClick={() => { patchField('elevator_id', elev.id); setShowElevatorPicker(false) }}
                      className={`w-full text-left px-5 py-3.5 hover:bg-amber-50 transition-colors cursor-pointer ${data.elevator_id === elev.id ? 'bg-amber-50' : ''}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{elev.manufacturer} {elev.model}</p>
                          {elev.capacity && <p className="text-xs text-gray-400 mt-0.5">{elev.capacity} kg</p>}
                        </div>
                        <div className="text-right shrink-0">
                          {elev.base_price ? (
                            <p className="text-sm font-medium text-gray-700">{formatPrice(elev.base_price)}</p>
                          ) : (
                            <p className="text-xs text-gray-400 italic">{t('quoteRequests.detail.priceTbd')}</p>
                          )}
                          {data.elevator_id === elev.id && (
                            <p className="text-xs text-amber-600 font-semibold">✓ Wybrana</p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  )
}

export default QuoteRequestDetail
