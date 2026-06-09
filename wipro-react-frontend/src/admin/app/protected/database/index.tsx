import { Button } from '@admin/components/Button'
import { Card } from '@admin/components/Cards'
import InlineEdit from '@admin/components/InlineEdit'
import SkeletonLoader from '@admin/components/SkeletonLoader'
import MainHeader from '@admin/components/layout/MainHeader'
import MainLayout from '@admin/components/layout/MainLayout'
import api from '@admin/store/axiosInstance'
import { authStore } from '@admin/store/zustand/authStore'
import { toast } from '@admin/store/zustand/toastStore'
import { ChevronDown, ChevronRight, FileDown, Plus, Save, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

// ─── Settings helpers ─────────────────────────────────────────────────────────

const apiBase = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api').replace(/\/$/, '')

async function uploadImage(path: string, file: File): Promise<string> {
  const token = authStore.getState().token
  const fd = new FormData()
  fd.append('image', file)
  const res = await fetch(`${apiBase}${path}`, {
    method: 'POST',
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
      Accept: 'application/json',
    },
    body: fd,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw Object.assign(new Error('Upload failed'), { response: err })
  }
  const data = await res.json()
  return data.image_url
}

interface LiftType {
  id: number; key: string; name_pl: string; name_en: string; sort_order: number; is_active: boolean; base_price: number | null; price_per_stop: number | null
}
interface CabinModel {
  id: number; name_pl: string; name_en: string; image_url: string | null; details: DetailRow[] | null; sort_order: number; is_active: boolean; price_addition: number
}
interface CabinAccessory {
  id: number; category: string; name_pl: string; name_en: string; image_url: string | null; sort_order: number; is_active: boolean; price_addition: number
}
interface CabinColor {
  id: number
  name_pl: string
  name_en: string
  image_url: string | null
  visible_for_cabin: boolean
  visible_for_door: boolean
  price_addition_cabin: number
  price_addition_door: number
  sort_order: number
  is_active: boolean
}
interface CabinType {
  id: number
  key: string
  name_pl: string
  name_en: string
  image_right_url: string | null
  image_left_url: string | null
  price: string
  sort_order: number
  is_active: boolean
}
type DetailRow = { label: string; value: string }

const ACCESSORY_CATEGORIES = ['PANEL', 'SIGNAL', 'CEILING', 'MIRROR', 'HANDRAIL', 'FLOORING'] as const
const CATEGORY_LABELS_PL: Record<string, string> = {
  PANEL: 'Panel dyspozycji', SIGNAL: 'Sygnalizacja', CEILING: 'Sufity',
  MIRROR: 'Lustra', HANDRAIL: 'Poręcze', FLOORING: 'Wykładzina', EXTRA: 'Dodatki',
}
const CATEGORY_LABELS_EN: Record<string, string> = {
  PANEL: 'Control panel', SIGNAL: 'Signalization', CEILING: 'Ceilings',
  MIRROR: 'Mirrors', HANDRAIL: 'Handrails', FLOORING: 'Flooring', EXTRA: 'Extras',
}

const CamSvg = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
  </svg>
)

const ImagePicker = ({
  previewUrl, uploadUrl, onSelect, onUploaded,
}: {
  previewUrl?: string | null
  uploadUrl?: string
  onSelect?: (file: File) => void
  onUploaded?: (url: string) => void
}) => {
  const { t } = useTranslation()
  const [uploading, setUploading] = useState(false)
  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (uploadUrl) {
      setUploading(true)
      try {
        const url = await uploadImage(uploadUrl, file)
        onUploaded?.(url)
      } catch { /* silent */ } finally {
        setUploading(false); e.target.value = ''
      }
    } else {
      onSelect?.(file)
    }
  }
  return (
    <label className="relative block w-14 h-14 rounded-lg border-2 border-dashed border-gray-200 hover:border-amber-400 cursor-pointer overflow-hidden bg-gray-50 transition-colors flex-shrink-0" title={t('database.uploadImage')}>
      <input type="file" accept="image/*" className="hidden" onChange={handleChange} />
      {uploading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : previewUrl ? (
        <img src={previewUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-gray-300"><CamSvg /></div>
      )}
    </label>
  )
}

const DetailsEditor = ({ value, onChange }: { value: DetailRow[]; onChange: (v: DetailRow[]) => void }) => {
  const { t } = useTranslation()
  const update = (i: number, field: keyof DetailRow, v: string) =>
    onChange(value.map((row, j) => (j === i ? { ...row, [field]: v } : row)))
  const remove = (i: number) => onChange(value.filter((_, j) => j !== i))
  const add = () => onChange([...value, { label: '', value: '' }])
  const cls = 'border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-amber-300 flex-1 min-w-0'
  return (
    <div className="flex flex-col gap-1.5">
      {value.length === 0 && <p className="text-xs text-gray-400 italic">{t('database.cabinModels.noDetails')}</p>}
      {value.map((row, i) => (
        <div key={i} className="flex gap-1.5 items-center">
          <input className={cls} placeholder={t('database.cabinModels.detailLabelPlaceholder')} value={row.label} onChange={e => update(i, 'label', e.target.value)} />
          <input className={cls} placeholder={t('database.cabinModels.detailValuePlaceholder')} value={row.value} onChange={e => update(i, 'value', e.target.value)} />
          <button type="button" onClick={() => remove(i)} className="text-gray-400 hover:text-red-500 text-lg leading-none px-1 flex-shrink-0">×</button>
        </div>
      ))}
      <button type="button" onClick={add} className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-800 mt-0.5 w-fit">
        <Plus className="w-3 h-3" /> {t('database.cabinModels.addRow')}
      </button>
    </div>
  )
}

// ─── Lift types tab ───────────────────────────────────────────────────────────
const LiftTypesTab = ({ onCountChange }: { onCountChange?: (n: number) => void }) => {
  const { t } = useTranslation()
  const [liftTypes, setLiftTypes] = useState<LiftType[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newType, setNewType] = useState({ key: '', name_pl: '', name_en: '', sort_order: 0, base_price: null as number | null, price_per_stop: null as number | null })
  const [saving, setSaving] = useState(false)

  useEffect(() => { onCountChange?.(liftTypes.length) }, [liftTypes.length])

  useEffect(() => {
    api.get('/admin/lift-types').then(r => setLiftTypes(r.data)).finally(() => setLoading(false))
  }, [])

  const updateType = async (id: number, field: string, value: string | boolean | number | null) => {
    await api.patch(`/admin/lift-types/${id}`, { [field]: value })
    setLiftTypes(prev => prev.map(lt => lt.id === id ? { ...lt, [field]: value } : lt))
  }
  const deleteType = async (id: number) => {
    if (!confirm(t('settings.confirmDeleteType'))) return
    await api.delete(`/admin/lift-types/${id}`)
    setLiftTypes(prev => prev.filter(lt => lt.id !== id))
  }
  const addType = async () => {
    if (!newType.key || !newType.name_pl || !newType.name_en) return
    setSaving(true)
    try {
      const res = await api.post('/admin/lift-types', { ...newType, is_active: true })
      setLiftTypes(prev => [...prev, res.data])
      setNewType({ key: '', name_pl: '', name_en: '', sort_order: 0, base_price: null, price_per_stop: null }); setShowAdd(false)
    } finally { setSaving(false) }
  }
  const inp = (key: keyof typeof newType) => ({
    value: String(newType[key]),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setNewType(p => ({ ...p, [key]: key === 'sort_order' ? parseInt(e.target.value) || 0 : e.target.value })),
    className: 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-300',
  })

  return (
    <Card className="gap-0 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">{t('settings.liftTypes')}</h2>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)}><Plus className="h-4 w-4" />{t('settings.addLiftType')}</Button>
      </div>
      {showAdd && (
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/40">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-3">
            <div><label className="text-xs text-gray-500 mb-1 block">{t('settings.key')}</label><input {...inp('key')} placeholder="PASSENGER" /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">{t('settings.namePl')}</label><input {...inp('name_pl')} /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">{t('settings.nameEn')}</label><input {...inp('name_en')} /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">{t('settings.sortOrder')}</label><input {...inp('sort_order')} type="number" min="0" /></div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">{t('database.liftTypes.basePrice')}</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-300"
                placeholder="0.00"
                value={newType.base_price ?? ''}
                onChange={e => setNewType(prev => ({ ...prev, base_price: e.target.value === '' ? null : parseFloat(e.target.value) }))}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">{t('database.liftTypes.pricePerStop')}</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-300"
                placeholder="0.00"
                value={newType.price_per_stop ?? ''}
                onChange={e => setNewType(prev => ({ ...prev, price_per_stop: e.target.value === '' ? null : parseFloat(e.target.value) }))}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={addType} disabled={saving}><Save className="h-3 w-3" />{saving ? t('common.saving') : t('common.save')}</Button>
            <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)}>{t('common.cancel')}</Button>
          </div>
        </div>
      )}
      {loading ? <div className="p-6"><SkeletonLoader count={4} /></div> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">{t('settings.key')}</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('settings.namePl')}</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('settings.nameEn')}</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('settings.sortOrder')}</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('common.status')}</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.liftTypes.basePrice')}</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.liftTypes.pricePerStop')}</th>
              <th className="w-10" />
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {liftTypes.map(lt => (
                <tr key={lt.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-3 font-mono text-xs text-gray-500">{lt.key}</td>
                  <td className="px-4 py-3"><InlineEdit value={lt.name_pl} onSave={v => updateType(lt.id, 'name_pl', v)} /></td>
                  <td className="px-4 py-3"><InlineEdit value={lt.name_en} onSave={v => updateType(lt.id, 'name_en', v)} /></td>
                  <td className="px-4 py-3 text-center"><InlineEdit value={lt.sort_order} type="number" onSave={v => updateType(lt.id, 'sort_order', parseInt(v))} /></td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => updateType(lt.id, 'is_active', !lt.is_active)} className={`text-xs px-2 py-0.5 rounded-full cursor-pointer ${lt.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {lt.is_active ? t('settings.active') : t('settings.inactive')}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-center">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-24 border border-gray-200 rounded px-2 py-1 text-sm"
                      defaultValue={lt.base_price ?? ''}
                      onBlur={e => updateType(lt.id, 'base_price', e.target.value === '' ? null : parseFloat(e.target.value))}
                    />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-center">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-24 border border-gray-200 rounded px-2 py-1 text-sm"
                      defaultValue={lt.price_per_stop ?? ''}
                      onBlur={e => updateType(lt.id, 'price_per_stop', e.target.value === '' ? null : parseFloat(e.target.value))}
                    />
                  </td>
                  <td className="px-2 py-3"><Button variant="ghost" size="icon" onClick={() => deleteType(lt.id)} className="h-8 w-8 text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

// ─── Cabin models tab ─────────────────────────────────────────────────────────
const EMPTY_CABIN = { name_pl: '', name_en: '', sort_order: 0, price_addition: 0 }

const CabinModelsTab = ({ onCountChange }: { onCountChange?: (n: number) => void }) => {
  const { t } = useTranslation()
  const [models, setModels] = useState<CabinModel[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newModel, setNewModel] = useState(EMPTY_CABIN)
  const [newImageFile, setNewImageFile] = useState<File | null>(null)
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null)
  const [newDetails, setNewDetails] = useState<DetailRow[]>([])
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [editingDetails, setEditingDetails] = useState<DetailRow[]>([])

  useEffect(() => { onCountChange?.(models.length) }, [models.length])

  useEffect(() => {
    api.get('/admin/cabin-models').then(r => setModels(r.data)).finally(() => setLoading(false))
  }, [])

  const deleteModel = async (id: number) => {
    if (!confirm(t('database.cabinModels.confirmDelete'))) return
    await api.delete(`/admin/cabin-models/${id}`)
    setModels(prev => prev.filter(m => m.id !== id))
  }
  const toggleActive = async (m: CabinModel) => {
    await api.patch(`/admin/cabin-models/${m.id}`, { is_active: !m.is_active })
    setModels(prev => prev.map(x => x.id === m.id ? { ...x, is_active: !x.is_active } : x))
  }
  const updateModel = async (id: number, field: string, value: string | number) => {
    await api.patch(`/admin/cabin-models/${id}`, { [field]: value })
    setModels(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m))
  }
  const handleImageUploaded = (id: number, url: string) => {
    setModels(prev => prev.map(m => m.id === id ? { ...m, image_url: url } : m))
  }
  const openDetails = (m: CabinModel) => {
    if (expandedId === m.id) { setExpandedId(null); return }
    setExpandedId(m.id); setEditingDetails(m.details ?? [])
  }
  const saveDetails = async (id: number) => {
    await api.patch(`/admin/cabin-models/${id}`, { details: editingDetails })
    setModels(prev => prev.map(m => m.id === id ? { ...m, details: editingDetails } : m))
    setExpandedId(null)
  }
  const addModel = async () => {
    if (!newModel.name_pl || !newModel.name_en) return
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('name_pl', newModel.name_pl); fd.append('name_en', newModel.name_en)
      fd.append('sort_order', String(newModel.sort_order)); fd.append('is_active', '1')
      fd.append('price_addition', String(newModel.price_addition))
      if (newImageFile) fd.append('image', newImageFile)
      if (newDetails.length > 0) fd.append('details', JSON.stringify(newDetails))
      const res = await api.post('/admin/cabin-models', fd)
      setModels(prev => [...prev, res.data])
      setNewModel(EMPTY_CABIN); setNewDetails([]); setNewImageFile(null); setNewImagePreview(null); setShowAdd(false)
    } finally { setSaving(false) }
  }
  const inp = (key: keyof typeof newModel) => ({
    value: String(newModel[key]),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setNewModel(p => ({ ...p, [key]: key === 'sort_order' ? parseInt(e.target.value) || 0 : e.target.value })),
    className: 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-300',
  })

  return (
    <Card className="gap-0 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">{t('database.cabinModels.title')}</h2>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)}><Plus className="h-4 w-4" />{t('database.cabinModels.add')}</Button>
      </div>
      {showAdd && (
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/40">
          <div className="flex gap-4 mb-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">{t('database.cabinModels.photo')}</label>
              <ImagePicker previewUrl={newImagePreview} onSelect={(file) => { setNewImageFile(file); setNewImagePreview(URL.createObjectURL(file)) }} />
            </div>
            <div className="flex-1 grid grid-cols-2 gap-3">
              <div><label className="text-xs text-gray-500 mb-1 block">{t('settings.namePl')}</label><input {...inp('name_pl')} /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">{t('settings.nameEn')}</label><input {...inp('name_en')} /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">{t('database.cabinModels.sortOrder')}</label><input {...inp('sort_order')} type="number" min="0" /></div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">{t('database.cabinModels.priceAddition')}</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-300"
                  placeholder="0.00"
                  value={newModel.price_addition ?? 0}
                  onChange={e => setNewModel(prev => ({ ...prev, price_addition: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>
          </div>
          <div className="mb-4">
            <label className="text-xs text-gray-500 mb-2 block font-medium">{t('database.cabinModels.detailsTitle')}</label>
            <DetailsEditor value={newDetails} onChange={setNewDetails} />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={addModel} disabled={saving}><Save className="h-3 w-3" />{saving ? t('common.saving') : t('common.save')}</Button>
            <Button variant="ghost" size="sm" onClick={() => { setShowAdd(false); setNewDetails([]); setNewImageFile(null); setNewImagePreview(null) }}>{t('common.cancel')}</Button>
          </div>
        </div>
      )}
      {loading ? <div className="p-6"><SkeletonLoader count={3} /></div> : models.length === 0 ? (
        <div className="p-12 text-center text-gray-400 text-sm">{t('database.cabinModels.noModels')}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-4 py-3 w-20" />
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('settings.namePl')}</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('settings.nameEn')}</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.cabinModels.sortOrder')}</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('common.status')}</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.cabinModels.detailsCol')}</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.cabinModels.priceAddition')}</th>
              <th className="w-10" />
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {models.map(m => (
                <>
                  <tr key={m.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-2">
                      <ImagePicker previewUrl={m.image_url} uploadUrl={`/admin/cabin-models/${m.id}/image`} onUploaded={(url) => handleImageUploaded(m.id, url)} />
                    </td>
                    <td className="px-4 py-3"><InlineEdit value={m.name_pl} onSave={v => updateModel(m.id, 'name_pl', v)} /></td>
                    <td className="px-4 py-3"><InlineEdit value={m.name_en} onSave={v => updateModel(m.id, 'name_en', v)} /></td>
                    <td className="px-4 py-3 text-center"><InlineEdit value={m.sort_order} type="number" onSave={v => updateModel(m.id, 'sort_order', parseInt(v))} /></td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => toggleActive(m)} className={`text-xs px-2 py-0.5 rounded-full cursor-pointer ${m.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {m.is_active ? t('settings.active') : t('settings.inactive')}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button type="button" onClick={() => openDetails(m)} className={`text-xs px-2 py-0.5 rounded cursor-pointer transition-colors ${expandedId === m.id ? 'bg-amber-100 text-amber-700' : 'text-amber-600 hover:text-amber-800 underline'}`}>
                        {m.details?.length ?? 0} poz.
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-24 border border-gray-200 rounded px-2 py-1 text-sm"
                        defaultValue={m.price_addition ?? 0}
                        onBlur={e => updateModel(m.id, 'price_addition', parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td className="px-2 py-3"><Button variant="ghost" size="icon" onClick={() => deleteModel(m.id)} className="h-8 w-8 text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button></td>
                  </tr>
                  {expandedId === m.id && (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 bg-amber-50/40 border-b border-amber-100">
                        <p className="text-xs font-medium text-gray-600 mb-2">{t('database.cabinModels.detailsSectionTitle')}</p>
                        <DetailsEditor value={editingDetails} onChange={setEditingDetails} />
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" onClick={() => saveDetails(m.id)}><Save className="h-3 w-3" />{t('common.save')}</Button>
                          <Button variant="ghost" size="sm" onClick={() => setExpandedId(null)}>{t('common.cancel')}</Button>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

// ─── Accessories tab ──────────────────────────────────────────────────────────
const EMPTY_ACC = { category: 'PANEL', name_pl: '', name_en: '', sort_order: 0, price_addition: 0 }

const AccessoriesTab = ({ onCountChange }: { onCountChange?: (n: number) => void }) => {
  const { t, i18n } = useTranslation()
  const [accessories, setAccessories] = useState<CabinAccessory[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newAcc, setNewAcc] = useState(EMPTY_ACC)
  const [newAccImageFile, setNewAccImageFile] = useState<File | null>(null)
  const [newAccImagePreview, setNewAccImagePreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { onCountChange?.(accessories.filter(a => a.category !== 'EXTRA').length) }, [accessories.length])

  useEffect(() => {
    api.get('/admin/cabin-accessories').then(r => setAccessories(r.data)).finally(() => setLoading(false))
  }, [])

  const deleteAcc = async (id: number) => {
    if (!confirm(t('database.accessories.confirmDelete'))) return
    await api.delete(`/admin/cabin-accessories/${id}`)
    setAccessories(prev => prev.filter(a => a.id !== id))
  }
  const toggleActive = async (a: CabinAccessory) => {
    await api.patch(`/admin/cabin-accessories/${a.id}`, { is_active: !a.is_active })
    setAccessories(prev => prev.map(x => x.id === a.id ? { ...x, is_active: !x.is_active } : x))
  }
  const updateAcc = async (id: number, field: string, value: string | number) => {
    await api.patch(`/admin/cabin-accessories/${id}`, { [field]: value })
    setAccessories(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a))
  }
  const handleImageUploaded = (id: number, url: string) => {
    setAccessories(prev => prev.map(a => a.id === id ? { ...a, image_url: url } : a))
  }
  const addAcc = async () => {
    if (!newAcc.name_pl || !newAcc.name_en) return
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('category', newAcc.category); fd.append('name_pl', newAcc.name_pl)
      fd.append('name_en', newAcc.name_en); fd.append('sort_order', String(newAcc.sort_order))
      fd.append('is_active', '1'); fd.append('price_addition', String(newAcc.price_addition))
      if (newAccImageFile) fd.append('image', newAccImageFile)
      const res = await api.post('/admin/cabin-accessories', fd)
      setAccessories(prev => [...prev, res.data])
      setNewAcc(EMPTY_ACC); setNewAccImageFile(null); setNewAccImagePreview(null); setShowAdd(false)
    } finally { setSaving(false) }
  }
  const inp = (key: keyof typeof newAcc) => ({
    value: String(newAcc[key]),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setNewAcc(p => ({ ...p, [key]: key === 'sort_order' ? parseInt(e.target.value) || 0 : e.target.value })),
    className: 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-300',
  })
  const grouped = ACCESSORY_CATEGORIES.reduce((acc, cat) => {
    acc[cat] = accessories.filter(a => a.category === cat)
    return acc
  }, {} as Record<string, CabinAccessory[]>)

  return (
    <Card className="gap-0 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">{t('database.accessories.title')}</h2>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)}><Plus className="h-4 w-4" />{t('database.accessories.add')}</Button>
      </div>

      {showAdd && (
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/40">
          <div className="flex gap-4 mb-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">{t('database.accessories.photo')}</label>
              <ImagePicker previewUrl={newAccImagePreview} onSelect={(file) => { setNewAccImageFile(file); setNewAccImagePreview(URL.createObjectURL(file)) }} />
            </div>
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label className="text-xs text-gray-500 mb-1 block">{t('elevators.category')}</label>
                <select value={newAcc.category} onChange={e => setNewAcc(p => ({ ...p, category: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-300">
                  {ACCESSORY_CATEGORIES.map(c => <option key={c} value={c}>{i18n.resolvedLanguage === 'pl' ? CATEGORY_LABELS_PL[c] : CATEGORY_LABELS_EN[c]}</option>)}
                </select>
              </div>
              <div><label className="text-xs text-gray-500 mb-1 block">{t('settings.namePl')}</label><input {...inp('name_pl')} /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">{t('settings.nameEn')}</label><input {...inp('name_en')} /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">{t('database.accessories.sortOrder')}</label><input {...inp('sort_order')} type="number" min="0" /></div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">{t('database.accessories.priceAddition')}</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-300"
                  placeholder="0.00"
                  value={newAcc.price_addition}
                  onChange={e => setNewAcc(prev => ({ ...prev, price_addition: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={addAcc} disabled={saving}><Save className="h-3 w-3" />{saving ? t('common.saving') : t('common.save')}</Button>
            <Button variant="ghost" size="sm" onClick={() => { setShowAdd(false); setNewAccImageFile(null); setNewAccImagePreview(null) }}>{t('common.cancel')}</Button>
          </div>
        </div>
      )}

      {loading ? <div className="p-6"><SkeletonLoader count={4} /></div> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-4 py-2 w-20 text-left text-xs font-medium text-gray-500 uppercase">{t('database.accessories.photo')}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('settings.namePl')}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('settings.nameEn')}</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.accessories.sortOrder')}</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('common.status')}</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.accessories.priceAddition')}</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {ACCESSORY_CATEGORIES.filter(cat => grouped[cat].length > 0).map(cat => (
                <>
                  <tr key={`cat-${cat}`} className="bg-gray-50/60 border-t border-gray-100">
                    <td colSpan={7} className="px-4 py-2">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{i18n.resolvedLanguage === 'pl' ? CATEGORY_LABELS_PL[cat] : CATEGORY_LABELS_EN[cat]}</span>
                    </td>
                  </tr>
                  {grouped[cat].map(a => (
                    <tr key={a.id} className="hover:bg-gray-50/50 border-t border-gray-50">
                      <td className="px-4 py-2 w-20">
                        <ImagePicker previewUrl={a.image_url} uploadUrl={`/admin/cabin-accessories/${a.id}/image`} onUploaded={(url) => handleImageUploaded(a.id, url)} />
                      </td>
                      <td className="px-4 py-3"><InlineEdit value={a.name_pl} onSave={v => updateAcc(a.id, 'name_pl', v)} /></td>
                      <td className="px-4 py-3"><InlineEdit value={a.name_en} onSave={v => updateAcc(a.id, 'name_en', v)} /></td>
                      <td className="px-4 py-3 text-center"><InlineEdit value={a.sort_order} type="number" onSave={v => updateAcc(a.id, 'sort_order', parseInt(v))} /></td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => toggleActive(a)} className={`text-xs px-2 py-0.5 rounded-full cursor-pointer ${a.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {a.is_active ? t('settings.active') : t('settings.inactive')}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="w-24 border border-gray-200 rounded px-2 py-1 text-sm"
                          defaultValue={a.price_addition ?? 0}
                          onBlur={e => api.patch(`/admin/cabin-accessories/${a.id}`, { price_addition: parseFloat(e.target.value) || 0 })}
                        />
                      </td>
                      <td className="px-2 py-3"><Button variant="ghost" size="icon" onClick={() => deleteAcc(a.id)} className="h-8 w-8 text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button></td>
                    </tr>
                  ))}
                </>
              ))}
              {ACCESSORY_CATEGORIES.every(cat => grouped[cat].length === 0) && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">{t('database.accessories.noAccessories')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

// ─── Extras tab ───────────────────────────────────────────────────────────────
const EMPTY_EXTRA = { name_pl: '', name_en: '', sort_order: 0, price_addition: 0 }

const ExtrasTab = ({ onCountChange }: { onCountChange?: (n: number) => void }) => {
  const { t } = useTranslation()
  const [extras, setExtras] = useState<CabinAccessory[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newExtra, setNewExtra] = useState(EMPTY_EXTRA)
  const [saving, setSaving] = useState(false)

  useEffect(() => { onCountChange?.(extras.length) }, [extras.length])

  useEffect(() => {
    api.get('/admin/cabin-accessories')
      .then(r => setExtras((r.data as CabinAccessory[]).filter(a => a.category === 'EXTRA')))
      .finally(() => setLoading(false))
  }, [])

  const deleteExtra = async (id: number) => {
    if (!confirm(t('database.extras.confirmDelete'))) return
    await api.delete(`/admin/cabin-accessories/${id}`)
    setExtras(prev => prev.filter(a => a.id !== id))
  }
  const toggleActive = async (a: CabinAccessory) => {
    await api.patch(`/admin/cabin-accessories/${a.id}`, { is_active: !a.is_active })
    setExtras(prev => prev.map(x => x.id === a.id ? { ...x, is_active: !x.is_active } : x))
  }
  const updateExtra = async (id: number, field: string, value: string | number) => {
    await api.patch(`/admin/cabin-accessories/${id}`, { [field]: value })
    setExtras(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a))
  }
  const addExtra = async () => {
    if (!newExtra.name_pl || !newExtra.name_en) return
    setSaving(true)
    try {
      const res = await api.post('/admin/cabin-accessories', {
        category: 'EXTRA', name_pl: newExtra.name_pl, name_en: newExtra.name_en,
        sort_order: newExtra.sort_order, price_addition: newExtra.price_addition, is_active: true,
      })
      setExtras(prev => [...prev, res.data])
      setNewExtra(EMPTY_EXTRA); setShowAdd(false)
    } finally { setSaving(false) }
  }
  const inp = (key: keyof typeof newExtra) => ({
    value: String(newExtra[key]),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setNewExtra(p => ({ ...p, [key]: key === 'sort_order' ? parseInt(e.target.value) || 0 : e.target.value })),
    className: 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-300',
  })

  return (
    <Card className="gap-0 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">{t('database.extras.title')}</h2>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)}><Plus className="h-4 w-4" />{t('database.extras.add')}</Button>
      </div>
      {showAdd && (
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/40">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            <div><label className="text-xs text-gray-500 mb-1 block">{t('settings.namePl')}</label><input {...inp('name_pl')} /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">{t('settings.nameEn')}</label><input {...inp('name_en')} /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">{t('database.accessories.priceAddition')}</label><input {...inp('price_addition')} type="number" min="0" step="0.01" /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">{t('database.accessories.sortOrder')}</label><input {...inp('sort_order')} type="number" min="0" /></div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={addExtra} disabled={saving}><Save className="h-3 w-3" />{saving ? t('common.saving') : t('common.save')}</Button>
            <Button variant="ghost" size="sm" onClick={() => { setShowAdd(false); setNewExtra(EMPTY_EXTRA) }}>{t('common.cancel')}</Button>
          </div>
        </div>
      )}
      {loading ? <div className="p-6"><SkeletonLoader count={3} /></div> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('settings.namePl')}</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('settings.nameEn')}</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.accessories.priceAddition')}</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.accessories.sortOrder')}</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('common.status')}</th>
              <th className="w-10" />
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {extras.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-400">{t('database.extras.noExtras')}</td></tr>
              )}
              {extras.map(a => (
                <tr key={a.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3"><InlineEdit value={a.name_pl} onSave={v => updateExtra(a.id, 'name_pl', v)} /></td>
                  <td className="px-4 py-3"><InlineEdit value={a.name_en} onSave={v => updateExtra(a.id, 'name_en', v)} /></td>
                  <td className="px-4 py-3 text-center">
                    <input type="number" min="0" step="0.01" className="w-24 border border-gray-200 rounded px-2 py-1 text-sm" defaultValue={a.price_addition ?? 0} onBlur={e => api.patch(`/admin/cabin-accessories/${a.id}`, { price_addition: parseFloat(e.target.value) || 0 })} />
                  </td>
                  <td className="px-4 py-3 text-center"><InlineEdit value={a.sort_order} type="number" onSave={v => updateExtra(a.id, 'sort_order', parseInt(v))} /></td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => toggleActive(a)} className={`text-xs px-2 py-0.5 rounded-full cursor-pointer ${a.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {a.is_active ? t('settings.active') : t('settings.inactive')}
                    </button>
                  </td>
                  <td className="px-2 py-3"><Button variant="ghost" size="icon" onClick={() => deleteExtra(a.id)} className="h-8 w-8 text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

// ─── Cabin types tab ──────────────────────────────────────────────────────────
const CabinTypesTab = ({ onCountChange }: { onCountChange?: (n: number) => void }) => {
  const { t } = useTranslation()
  const [cabinTypes, setCabinTypes] = useState<CabinType[]>([])
  const [loadingCabinTypes, setLoadingCabinTypes] = useState(true)

  useEffect(() => { onCountChange?.(cabinTypes.length) }, [cabinTypes.length])

  const loadCabinTypes = () => {
    setLoadingCabinTypes(true)
    api.get('/admin/cabin-types').then(r => setCabinTypes(r.data)).finally(() => setLoadingCabinTypes(false))
  }

  useEffect(() => { loadCabinTypes() }, [])

  const updateCabinType = async (id: number, field: string, value: unknown) => {
    await api.patch(`/admin/cabin-types/${id}`, { [field]: value })
    loadCabinTypes()
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-gray-900">{t('database.cabinTypes.title')}</h2>
          <p className="text-xs text-gray-400 mt-0.5">{t('database.cabinTypes.subtitle')}</p>
        </div>
      </div>

      {loadingCabinTypes ? (
        <div className="flex justify-center py-8"><SkeletonLoader count={4} /></div>
      ) : (
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.cabinTypes.key')}</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.cabinTypes.namePl')}</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.cabinTypes.nameEn')}</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.cabinTypes.imageRight')}</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.cabinTypes.imageLeft')}</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.cabinTypes.price')}</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('settings.active')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {cabinTypes.map(ct => (
              <tr key={ct.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-mono text-gray-500">{ct.key}</td>
                <td className="px-4 py-3">
                  <input
                    className="border border-gray-200 rounded px-2 py-1 text-sm w-32"
                    defaultValue={ct.name_pl}
                    onBlur={e => updateCabinType(ct.id, 'name_pl', e.target.value)}
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    className="border border-gray-200 rounded px-2 py-1 text-sm w-32"
                    defaultValue={ct.name_en}
                    onBlur={e => updateCabinType(ct.id, 'name_en', e.target.value)}
                  />
                </td>
                {(['right', 'left'] as const).map(side => {
                  const urlField = side === 'right' ? 'image_right_url' : 'image_left_url'
                  return (
                    <td key={side} className="px-4 py-3">
                      <ImagePicker
                        previewUrl={ct[urlField]}
                        uploadUrl={`/admin/cabin-types/${ct.id}/image/${side}`}
                        onUploaded={() => loadCabinTypes()}
                      />
                    </td>
                  )
                })}
                <td className="px-4 py-3">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-24 border border-gray-200 rounded px-2 py-1 text-sm"
                    defaultValue={ct.price}
                    onBlur={e => updateCabinType(ct.id, 'price', parseFloat(e.target.value) || 0)}
                  />
                </td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => updateCabinType(ct.id, 'is_active', !ct.is_active)}>
                    {ct.is_active
                      ? <ToggleRight className="h-5 w-5 text-green-500" />
                      : <ToggleLeft className="h-5 w-5 text-gray-400" />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  )
}

// ─── Cabin colors tab ─────────────────────────────────────────────────────────
const EMPTY_COLOR = {
  name_pl: '', name_en: '',
  visible_for_cabin: true, visible_for_door: true,
  price_addition_cabin: 0, price_addition_door: 0,
  sort_order: 0,
}

const CabinColorsTab = ({ onCountChange }: { onCountChange?: (n: number) => void }) => {
  const { t } = useTranslation()
  const [colors, setColors] = useState<CabinColor[]>([])
  const [loadingColors, setLoadingColors] = useState(true)
  const [showAddColor, setShowAddColor] = useState(false)
  const [newColor, setNewColor] = useState(EMPTY_COLOR)
  const [saving, setSaving] = useState(false)

  useEffect(() => { onCountChange?.(colors.length) }, [colors.length])

  const loadColors = () => {
    setLoadingColors(true)
    api.get('/admin/cabin-colors').then(r => setColors(r.data)).finally(() => setLoadingColors(false))
  }

  useEffect(() => { loadColors() }, [])

  const handleImageUploaded = (id: number, url: string) => {
    setColors(prev => prev.map(c => c.id === id ? { ...c, image_url: url } : c))
  }

  const deleteColor = async (id: number) => {
    if (!confirm(t('database.colors.confirmDelete'))) return
    await api.delete(`/admin/cabin-colors/${id}`)
    loadColors()
  }

  const handleColorField = async (id: number, field: string, value: unknown) => {
    await api.patch(`/admin/cabin-colors/${id}`, { [field]: value })
    loadColors()
  }

  const createColor = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/admin/cabin-colors', newColor)
      setNewColor(EMPTY_COLOR)
      setShowAddColor(false)
      loadColors()
    } finally { setSaving(false) }
  }

  const INPUT_CLASS = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-300'

  return (
    <Card className="gap-0 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">{t('database.colors.title')}</h2>
        <Button size="sm" onClick={() => setShowAddColor(!showAddColor)}><Plus className="h-4 w-4" />{t('database.colors.add')}</Button>
      </div>

      {showAddColor && (
        <form onSubmit={createColor} className="px-6 py-4 border-b border-gray-100 bg-gray-50/40">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">{t('database.colors.namePl')}</label>
              <input required className={INPUT_CLASS} value={newColor.name_pl} onChange={e => setNewColor(p => ({ ...p, name_pl: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">{t('database.colors.nameEn')}</label>
              <input required className={INPUT_CLASS} value={newColor.name_en} onChange={e => setNewColor(p => ({ ...p, name_en: e.target.value }))} />
            </div>
            <div className="sm:col-span-1">
              <label className="text-xs text-gray-500 mb-1 block">{t('database.colors.image')}</label>
              <p className="text-xs text-gray-400 italic">{t('database.colors.imageAfterCreate')}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">{t('database.colors.sortOrder')}</label>
              <input type="number" min="0" className={INPUT_CLASS} value={newColor.sort_order} onChange={e => setNewColor(p => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">{t('database.colors.priceAdditionCabin')}</label>
              <input type="number" min="0" step="0.01" className={INPUT_CLASS} placeholder="0.00" value={newColor.price_addition_cabin} onChange={e => setNewColor(p => ({ ...p, price_addition_cabin: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">{t('database.colors.priceAdditionDoor')}</label>
              <input type="number" min="0" step="0.01" className={INPUT_CLASS} placeholder="0.00" value={newColor.price_addition_door} onChange={e => setNewColor(p => ({ ...p, price_addition_door: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div className="flex flex-col gap-2 justify-end">
              <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                <input type="checkbox" checked={newColor.visible_for_cabin} onChange={e => setNewColor(p => ({ ...p, visible_for_cabin: e.target.checked }))} className="rounded" />
                {t('database.colors.visibleForCabin')}
              </label>
              <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                <input type="checkbox" checked={newColor.visible_for_door} onChange={e => setNewColor(p => ({ ...p, visible_for_door: e.target.checked }))} className="rounded" />
                {t('database.colors.visibleForDoor')}
              </label>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={saving}><Save className="h-3 w-3" />{saving ? t('common.saving') : t('common.save')}</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => { setShowAddColor(false); setNewColor(EMPTY_COLOR) }}>{t('common.cancel')}</Button>
          </div>
        </form>
      )}

      {loadingColors ? <div className="p-6"><SkeletonLoader count={4} /></div> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-4 py-3 w-20 text-left text-xs font-medium text-gray-500 uppercase">{t('database.colors.image')}</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.colors.namePl')}</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.colors.nameEn')}</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.colors.visibleForCabin')}</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.colors.visibleForDoor')}</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.colors.priceAdditionCabin')}</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.colors.priceAdditionDoor')}</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.colors.sortOrder')}</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('common.status')}</th>
              <th className="w-10" />
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {colors.length === 0 && (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-sm text-gray-400">{t('database.colors.noColors')}</td></tr>
              )}
              {colors.map(c => (
                <tr key={c.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <ImagePicker
                      previewUrl={c.image_url}
                      uploadUrl={`/admin/cabin-colors/${c.id}/image`}
                      onUploaded={(url) => handleImageUploaded(c.id, url)}
                    />
                  </td>
                  <td className="px-4 py-3"><InlineEdit value={c.name_pl} onSave={v => handleColorField(c.id, 'name_pl', v)} /></td>
                  <td className="px-4 py-3"><InlineEdit value={c.name_en} onSave={v => handleColorField(c.id, 'name_en', v)} /></td>
                  <td className="px-4 py-3 text-center">
                    <input type="checkbox" checked={c.visible_for_cabin} onChange={e => handleColorField(c.id, 'visible_for_cabin', e.target.checked)} className="rounded cursor-pointer" />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input type="checkbox" checked={c.visible_for_door} onChange={e => handleColorField(c.id, 'visible_for_door', e.target.checked)} className="rounded cursor-pointer" />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input type="number" min="0" step="0.01" className="w-24 border border-gray-200 rounded px-2 py-1 text-sm" defaultValue={c.price_addition_cabin} onBlur={e => handleColorField(c.id, 'price_addition_cabin', parseFloat(e.target.value) || 0)} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input type="number" min="0" step="0.01" className="w-24 border border-gray-200 rounded px-2 py-1 text-sm" defaultValue={c.price_addition_door} onBlur={e => handleColorField(c.id, 'price_addition_door', parseFloat(e.target.value) || 0)} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input type="number" min="0" className="w-16 border border-gray-200 rounded px-2 py-1 text-sm text-center" defaultValue={c.sort_order} onBlur={e => handleColorField(c.id, 'sort_order', parseInt(e.target.value) || 0)} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => handleColorField(c.id, 'is_active', !c.is_active)} className={`text-xs px-2 py-0.5 rounded-full cursor-pointer ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {c.is_active ? t('settings.active') : t('settings.inactive')}
                    </button>
                  </td>
                  <td className="px-2 py-3"><Button variant="ghost" size="icon" onClick={() => deleteColor(c.id)} className="h-8 w-8 text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

// ─── General settings tab ─────────────────────────────────────────────────────
const GeneralTab = () => {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)

  // max_stops
  const [maxStops, setMaxStops] = useState(16)
  const [savingStops, setSavingStops] = useState(false)
  const [savedStops, setSavedStops] = useState(false)

  // company
  const [companyName, setCompanyName] = useState('')
  const [companyAddress, setCompanyAddress] = useState('')
  const [companyNip, setCompanyNip] = useState('')
  const [companyRegon, setCompanyRegon] = useState('')
  const [companyKrs, setCompanyKrs] = useState('')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [savingCompany, setSavingCompany] = useState(false)
  const [savedCompany, setSavedCompany] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  // pricing
  const [ei30Price, setEi30Price] = useState('')
  const [ei60Price, setEi60Price] = useState('')
  const [profitMargin, setProfitMargin] = useState('')
  const [savingPricing, setSavingPricing] = useState(false)
  const [savedPricing, setSavedPricing] = useState(false)

  useEffect(() => {
    api.get('/settings').then(r => {
      const d = r.data
      setMaxStops(parseInt(d.max_stops ?? '16'))
      setCompanyName(d.company_name ?? '')
      setCompanyAddress(d.company_address ?? '')
      setCompanyNip(d.company_nip ?? '')
      setCompanyRegon(d.company_regon ?? '')
      setCompanyKrs(d.company_krs ?? '')
      setEi30Price(d.door_ei30_price ?? '')
      setEi60Price(d.door_ei60_price ?? '')
      setProfitMargin(d.profit_margin_percent ?? '')
      if (d.company_logo_path) {
        const rel = (d.company_logo_path as string).replace(/^public\//, '')
        setLogoUrl(`${apiBase.replace('/api', '')}/storage/${rel}`)
      }
    }).finally(() => setLoading(false))
  }, [])

  const saveStops = async () => {
    setSavingStops(true); setSavedStops(false)
    try {
      await api.patch('/admin/settings', { max_stops: maxStops })
      setSavedStops(true); setTimeout(() => setSavedStops(false), 2000)
    } finally { setSavingStops(false) }
  }

  const saveCompany = async () => {
    setSavingCompany(true); setSavedCompany(false)
    try {
      await api.patch('/admin/settings', {
        company_name: companyName,
        company_address: companyAddress,
        company_nip: companyNip,
        company_regon: companyRegon,
        company_krs: companyKrs,
      })
      setSavedCompany(true); setTimeout(() => setSavedCompany(false), 2000)
    } finally { setSavingCompany(false) }
  }

  const savePricing = async () => {
    setSavingPricing(true); setSavedPricing(false)
    try {
      await api.patch('/admin/settings', {
        door_ei30_price: parseFloat(ei30Price) || 0,
        door_ei60_price: parseFloat(ei60Price) || 0,
        profit_margin_percent: parseFloat(profitMargin) || 0,
      })
      setSavedPricing(true); setTimeout(() => setSavedPricing(false), 2000)
    } finally { setSavingPricing(false) }
  }

  const uploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingLogo(true)
    try {
      const token = authStore.getState().token
      const fd = new FormData()
      fd.append('logo', file)
      const res = await fetch(`${apiBase}/admin/settings/logo`, {
        method: 'POST',
        headers: { Authorization: token ? `Bearer ${token}` : '', Accept: 'application/json' },
        body: fd,
      })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      setLogoUrl(data.logo_url)
      e.target.value = ''
    } catch { /* silent */ } finally { setUploadingLogo(false) }
  }

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-300'

  if (loading) return <Card className="p-6"><SkeletonLoader count={3} /></Card>

  return (
    <div className="flex flex-col gap-4">

      {/* Max stops */}
      <Card className="p-6 gap-4">
        <h2 className="font-semibold text-gray-900">{t('settings.generalSettings')}</h2>
        <div className="flex items-end gap-4">
          <div className="flex-1 max-w-xs">
            <label className="text-xs text-gray-500 mb-1 block">{t('settings.maxStops')}</label>
            <input type="number" min={2} max={50} value={maxStops}
              onChange={e => setMaxStops(parseInt(e.target.value) || 16)} className={inputCls} />
            <p className="text-xs text-gray-400 mt-1">{t('settings.maxStopsHint')}</p>
          </div>
          <Button onClick={saveStops} disabled={savingStops} className="mb-6">
            {savingStops ? t('common.saving') : savedStops ? t('settings.saved') : t('settings.saveSettings')}
          </Button>
        </div>
      </Card>

      {/* Company info */}
      <Card className="p-6 gap-4">
        <h2 className="font-semibold text-gray-900">{t('settings.companyInfo')}</h2>

        {/* Logo */}
        <div className="flex items-center gap-4">
          <div className="w-24 h-16 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50 overflow-hidden flex-shrink-0">
            {logoUrl
              ? <img src={logoUrl} alt="logo" className="w-full h-full object-contain p-1" />
              : <span className="text-xs text-gray-400">{t('settings.companyLogo')}</span>
            }
          </div>
          <label className="cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={uploadLogo} />
            <span className="text-sm text-amber-600 hover:text-amber-700 font-medium">
              {uploadingLogo ? t('common.saving') + '...' : logoUrl ? t('settings.changeLogo') : t('settings.uploadLogo')}
            </span>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">{t('settings.companyName')}</label>
            <input value={companyName} onChange={e => setCompanyName(e.target.value)} className={inputCls} />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">{t('settings.companyAddress')}</label>
            <input value={companyAddress} onChange={e => setCompanyAddress(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">{t('settings.companyNip')}</label>
            <input value={companyNip} onChange={e => setCompanyNip(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">{t('settings.companyRegon')}</label>
            <input value={companyRegon} onChange={e => setCompanyRegon(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">{t('settings.companyKrs')}</label>
            <input value={companyKrs} onChange={e => setCompanyKrs(e.target.value)} className={inputCls} />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={saveCompany} disabled={savingCompany}>
            {savingCompany ? t('common.saving') : savedCompany ? t('settings.saved') : t('settings.saveCompany')}
          </Button>
        </div>
      </Card>

      {/* Pricing */}
      <Card className="p-6 gap-4">
        <h2 className="font-semibold text-gray-900">{t('settings.pricingTitle')}</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">{t('settings.ei30Price')}</label>
            <input type="number" min={0} step={0.01} value={ei30Price}
              onChange={e => setEi30Price(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">{t('settings.ei60Price')}</label>
            <input type="number" min={0} step={0.01} value={ei60Price}
              onChange={e => setEi60Price(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">{t('settings.profitMargin')}</label>
            <input type="number" min={0} max={100} step={0.1} value={profitMargin}
              onChange={e => setProfitMargin(e.target.value)} className={inputCls} />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={savePricing} disabled={savingPricing}>
            {savingPricing ? t('common.saving') : savedPricing ? t('settings.saved') : t('settings.savePricing')}
          </Button>
        </div>
      </Card>

    </div>
  )
}

interface ElevatorElement {
  id: number
  name: string
  category: string
  price: number
}

interface Elevator {
  id: number
  model: string
  manufacturer: string
  capacity: number
  persons: number
  cabin_width: number
  cabin_depth: number
  cabin_height: number
  shaft_width: number
  shaft_depth: number
  pit_depth: number
  overhead: number
  speed: number
  drive_type: string
  max_stops: number
  base_price: number
  is_active: boolean
  elements_count?: number
  elements?: ElevatorElement[]
  // Technical fields
  standards?: string | null
  machine_room?: string | null
  lifting_height?: number | null
  door_width?: number | null
  door_height?: number | null
  door_fire_class?: string | null
  shaft_construction?: string | null
  shaft_ventilation?: string | null
  shaft_temperature?: string | null
  installation_type?: string | null
  cabin_finish?: string | null
  cabin_door_finish?: string | null
  landing_door_finish?: string | null
  equipment?: string | null
  // Drawing paths
  drawing_standard_pdf?: string | null
  drawing_standard_dwg?: string | null
  drawing_standard_bim?: string | null
  drawing_standard_doc?: string | null
  drawing_throughway_pdf?: string | null
  drawing_throughway_dwg?: string | null
  drawing_throughway_bim?: string | null
  drawing_throughway_doc?: string | null
  coeff_stops?: number | null
  coeff_cabin_model?: number | null
  coeff_cabin_throughway?: number | null
  coeff_cabin_doors?: number | null
  coeff_landing_doors?: number | null
  coeff_ei30?: number | null
  coeff_ei60?: number | null
}

const TechField = ({ label, value, elevatorId, field, onSaved, type = 'text' }: {
  label: string
  value: string | number | null | undefined
  elevatorId: number
  field: string
  onSaved: (elevatorId: number, field: string, value: string) => void
  type?: 'text' | 'number'
}) => (
  <div>
    <p className="text-xs text-gray-400 mb-0.5 uppercase tracking-wide">{label}</p>
    <InlineEdit
      value={value ?? ''}
      type={type}
      onSave={v => onSaved(elevatorId, field, v)}
    />
  </div>
)

const ElevatorRow = ({ elevator, onUpdate, onDelete }: {
  elevator: Elevator
  onUpdate: (id: number, field: string, value: string) => void
  onDelete: (id: number) => void
}) => {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const [elements, setElements] = useState<ElevatorElement[]>([])
  const [loadingElements, setLoadingElements] = useState(false)
  const [newElement, setNewElement] = useState({ name: '', category: '', price: '' })
  const [addingElement, setAddingElement] = useState(false)
  const [saving, setSaving] = useState(false)
  const [localElevator, setLocalElevator] = useState(elevator)
  const [drawingFiles, setDrawingFiles] = useState<{ standard: Record<string, File | null>; throughway: Record<string, File | null> }>({
    standard: { pdf: null, dwg: null, bim: null },
    throughway: { pdf: null, dwg: null, bim: null },
  })
  const [drawingDoc, setDrawingDoc] = useState<{ standard: File | null; throughway: File | null }>({
    standard: null,
    throughway: null,
  })
  const [uploadingDrawing, setUploadingDrawing] = useState<Record<string, boolean>>({})

  const uploadDrawing = async (type: 'standard' | 'throughway') => {
    const files = drawingFiles[type]
    if (!files.pdf && !files.dwg && !files.bim && !drawingDoc[type]) {
      alert(t('database.drawings.selectAtLeastOne'))
      return
    }
    setUploadingDrawing(prev => ({ ...prev, [type]: true }))
    try {
      const token = authStore.getState().token
      const fd = new FormData()
      if (files.pdf) fd.append('pdf', files.pdf)
      if (files.dwg) fd.append('dwg', files.dwg)
      if (files.bim) fd.append('bim', files.bim)
      if (drawingDoc[type]) fd.append('doc', drawingDoc[type]!)
      const res = await fetch(`${apiBase}/admin/elevators/${elevator.id}/drawings/${type}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        body: fd,
      })
      if (!res.ok) throw new Error('Upload failed')
      const updated = await res.json()
      setLocalElevator(updated)
      setDrawingFiles(prev => ({ ...prev, [type]: { pdf: null, dwg: null, bim: null } }))
      setDrawingDoc(prev => ({ ...prev, [type]: null }))
    } catch {
      alert(t('database.drawings.uploadError'))
    } finally {
      setUploadingDrawing(prev => ({ ...prev, [type]: false }))
    }
  }

  const downloadDrawing = async (type: 'standard' | 'throughway', ext: 'pdf' | 'dwg' | 'bim' | 'doc') => {
    const token = authStore.getState().token
    const res = await fetch(`${apiBase}/admin/elevators/${elevator.id}/drawings/${type}/${ext}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) { alert(t('database.drawings.fileNotAvailable')); return }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const cd = res.headers.get('Content-Disposition')
    const match = cd?.match(/filename="?([^";]+)"?/)
    a.download = match?.[1] ?? `rysunek-${type}-${elevator.model}.${ext}`
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const loadElements = () => {
    if (elements.length > 0) return
    setLoadingElements(true)
    api.get(`/admin/elevators/${elevator.id}/elements`)
      .then(res => setElements(res.data))
      .finally(() => setLoadingElements(false))
  }

  const toggleExpand = () => {
    if (!expanded) loadElements()
    setExpanded(!expanded)
  }

  const updateElement = async (elementId: number, field: string, value: string) => {
    await api.patch(`/admin/elevator-elements/${elementId}`, { [field]: field === 'price' ? Number(value) : value })
    setElements(prev => prev.map(e => e.id === elementId ? { ...e, [field]: field === 'price' ? Number(value) : value } : e))
  }

  const deleteElement = async (elementId: number) => {
    if (!confirm(t('elevators.confirmDeleteElement'))) return
    await api.delete(`/admin/elevator-elements/${elementId}`)
    setElements(prev => prev.filter(e => e.id !== elementId))
  }

  const addElement = async () => {
    if (!newElement.name || !newElement.category || !newElement.price) return
    setSaving(true)
    try {
      const res = await api.post(`/admin/elevators/${elevator.id}/elements`, {
        name: newElement.name,
        category: newElement.category,
        price: Number(newElement.price),
      })
      setElements(prev => [...prev, res.data])
      setNewElement({ name: '', category: '', price: '' })
      setAddingElement(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <tr className="hover:bg-gray-50/50">
        <td className="px-4 py-3">
          <button onClick={toggleExpand} className="text-gray-400 hover:text-gray-700 cursor-pointer">
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </td>
        <td className="px-2 py-3">
          <InlineEdit value={elevator.manufacturer} onSave={v => onUpdate(elevator.id, 'manufacturer', v)} />
        </td>
        <td className="px-2 py-3">
          <InlineEdit value={elevator.model} onSave={v => onUpdate(elevator.id, 'model', v)} />
        </td>
        <td className="px-2 py-3 text-center">
          <InlineEdit value={elevator.capacity} onSave={v => onUpdate(elevator.id, 'capacity', v)} type="number" unit="kg" />
        </td>
        <td className="px-2 py-3 text-center">
          <InlineEdit value={elevator.persons} onSave={v => onUpdate(elevator.id, 'persons', v)} type="number" unit="os." />
        </td>
        <td className="px-2 py-3 text-xs text-gray-500">
          <span title={`${elevator.cabin_width}×${elevator.cabin_depth}×${elevator.cabin_height} mm`}>
            {elevator.cabin_width}×{elevator.cabin_depth}×{elevator.cabin_height}
          </span>
        </td>
        <td className="px-2 py-3">
          <InlineEdit value={elevator.drive_type} onSave={v => onUpdate(elevator.id, 'drive_type', v)} />
        </td>
        <td className="px-2 py-3 text-right">
          <InlineEdit value={elevator.base_price} onSave={v => onUpdate(elevator.id, 'base_price', v)} type="number" unit="zł" />
        </td>
        <td className="px-2 py-3 text-center">
          <button
            onClick={() => onUpdate(elevator.id, 'is_active', elevator.is_active ? '0' : '1')}
            className={`text-xs px-2 py-0.5 rounded-full cursor-pointer ${elevator.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
          >
            {elevator.is_active ? t('elevators.active') : t('elevators.inactive')}
          </button>
        </td>
        <td className="px-2 py-3 text-right">
          <Button variant="ghost" size="icon" onClick={() => onDelete(elevator.id)} className="h-8 w-8 text-red-400 hover:text-red-600">
            <Trash2 className="h-4 w-4" />
          </Button>
        </td>
      </tr>

      {expanded && (
        <tr>
          <td colSpan={10} className="bg-gray-50/70 px-8 py-4 border-t border-b border-gray-100">
            <p className="text-xs font-medium text-gray-500 mb-2">{t('elevators.elementsTitle')}</p>

            {loadingElements ? (
              <p className="text-xs text-gray-400">{t('common.loading')}</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {elements.length === 0 && !addingElement && (
                  <p className="text-xs text-gray-400">{t('elevators.noElements')}</p>
                )}
                {elements.map(el => (
                  <div key={el.id} className="flex items-center gap-3 text-sm">
                    <span className="text-xs text-gray-400 w-24 shrink-0">
                      <InlineEdit value={el.category} onSave={v => updateElement(el.id, 'category', v)} />
                    </span>
                    <span className="flex-1">
                      <InlineEdit value={el.name} onSave={v => updateElement(el.id, 'name', v)} />
                    </span>
                    <span className="text-right w-28">
                      <InlineEdit value={el.price} type="number" onSave={v => updateElement(el.id, 'price', v)} unit="zł" />
                    </span>
                    <button onClick={() => deleteElement(el.id)} className="text-red-300 hover:text-red-600 cursor-pointer">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}

                {addingElement && (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      placeholder={t('elevators.categoryPlaceholder')}
                      value={newElement.category}
                      onChange={e => setNewElement(p => ({ ...p, category: e.target.value }))}
                      className="w-32 border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-amber-300"
                    />
                    <input
                      placeholder={t('elevators.elementNamePlaceholder')}
                      value={newElement.name}
                      onChange={e => setNewElement(p => ({ ...p, name: e.target.value }))}
                      className="flex-1 border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-amber-300"
                    />
                    <input
                      type="number"
                      placeholder={t('elevators.priceNetPlaceholder')}
                      value={newElement.price}
                      onChange={e => setNewElement(p => ({ ...p, price: e.target.value }))}
                      className="w-24 border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-amber-300"
                    />
                    <Button size="sm" onClick={addElement} disabled={saving}>
                      <Save className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setAddingElement(false)}>{t('common.cancel')}</Button>
                  </div>
                )}

                <button
                  onClick={() => setAddingElement(true)}
                  className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-800 cursor-pointer mt-1"
                >
                  <Plus className="h-3 w-3" /> {t('elevators.addElement')}
                </button>
              </div>
            )}

            {/* Dane techniczne */}
            <div className="mt-5 pt-4 border-t border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{t('database.technical.sectionTitle')}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-3">
                <TechField label={t('database.technical.standards')} value={elevator.standards} elevatorId={elevator.id} field="standards" onSaved={onUpdate} />
                <TechField label={t('database.technical.machineRoom')} value={elevator.machine_room} elevatorId={elevator.id} field="machine_room" onSaved={onUpdate} />
                <TechField label={t('database.technical.liftingHeight')} value={elevator.lifting_height} elevatorId={elevator.id} field="lifting_height" type="number" onSaved={onUpdate} />
                <TechField label={t('database.technical.doorWidth')} value={elevator.door_width} elevatorId={elevator.id} field="door_width" type="number" onSaved={onUpdate} />
                <TechField label={t('database.technical.doorHeight')} value={elevator.door_height} elevatorId={elevator.id} field="door_height" type="number" onSaved={onUpdate} />
                <TechField label={t('database.technical.doorFireClass')} value={elevator.door_fire_class} elevatorId={elevator.id} field="door_fire_class" onSaved={onUpdate} />
                <TechField label={t('database.technical.shaftConstruction')} value={elevator.shaft_construction} elevatorId={elevator.id} field="shaft_construction" onSaved={onUpdate} />
                <TechField label={t('database.technical.shaftVentilation')} value={elevator.shaft_ventilation} elevatorId={elevator.id} field="shaft_ventilation" onSaved={onUpdate} />
                <TechField label={t('database.technical.shaftTemperature')} value={elevator.shaft_temperature} elevatorId={elevator.id} field="shaft_temperature" onSaved={onUpdate} />
                <TechField label={t('database.technical.installationType')} value={elevator.installation_type} elevatorId={elevator.id} field="installation_type" onSaved={onUpdate} />
                <TechField label={t('database.technical.cabinFinish')} value={elevator.cabin_finish} elevatorId={elevator.id} field="cabin_finish" onSaved={onUpdate} />
                <TechField label={t('database.technical.cabinDoorFinish')} value={elevator.cabin_door_finish} elevatorId={elevator.id} field="cabin_door_finish" onSaved={onUpdate} />
                <TechField label={t('database.technical.landingDoorFinish')} value={elevator.landing_door_finish} elevatorId={elevator.id} field="landing_door_finish" onSaved={onUpdate} />
                <div className="col-span-2 sm:col-span-3 lg:col-span-4">
                  <p className="text-xs text-gray-400 mb-0.5 uppercase tracking-wide">{t('database.technical.equipment')}</p>
                  <InlineEdit value={elevator.equipment ?? ''} onSave={v => onUpdate(elevator.id, 'equipment', v)} />
                </div>
              </div>
            </div>

            {/* Rysunki */}
            <div className="mt-5 pt-4 border-t border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{t('database.drawings.sectionTitle')}</p>
              {(['standard', 'throughway'] as const).map(type => (
                <div key={type} className="mt-4 first:mt-0">
                  <p className="text-xs font-medium text-gray-600 mb-2">
                    {type === 'standard' ? t('database.drawings.standard') : t('database.drawings.throughway')}
                  </p>
                  {/* Current files */}
                  <div className="flex gap-2 mb-3 flex-wrap">
                    {(['pdf', 'dwg', 'bim', 'doc'] as const).map(ext => {
                      const path = localElevator[`drawing_${type}_${ext}` as keyof typeof localElevator]
                      const label = ext === 'doc' ? t('database.drawings.descDoc') : ext.toUpperCase()
                      return (
                        <button
                          key={ext}
                          onClick={() => path ? downloadDrawing(type, ext) : undefined}
                          disabled={!path}
                          className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded border transition-colors ${
                            path
                              ? 'border-amber-200 text-amber-700 hover:bg-amber-50 cursor-pointer'
                              : 'border-gray-100 text-gray-300 cursor-default'
                          }`}
                        >
                          <FileDown className="h-3 w-3" />
                          {label}
                        </button>
                      )
                    })}
                  </div>
                  {/* Upload new set */}
                  <div className="flex flex-wrap gap-2 items-end">
                    {(['pdf', 'dwg', 'bim'] as const).map(ext => (
                      <div key={ext} className="flex flex-col gap-1">
                        <label className="text-xs text-gray-400">{ext.toUpperCase()}</label>
                        <input
                          type="file"
                          accept={ext === 'pdf' ? '.pdf' : undefined}
                          onChange={e => setDrawingFiles(prev => ({ ...prev, [type]: { ...prev[type], [ext]: e.target.files?.[0] ?? null } }))}
                          className="text-xs text-gray-600 border border-gray-200 rounded px-2 py-1 w-40 bg-gray-50"
                        />
                      </div>
                    ))}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-400">{t('database.drawings.descDoc')}</label>
                      <input
                        type="file"
                        accept=".doc,.docx"
                        onChange={e => setDrawingDoc(prev => ({ ...prev, [type]: e.target.files?.[0] ?? null }))}
                        className="text-xs text-gray-600 border border-gray-200 rounded px-2 py-1 w-44 bg-gray-50"
                      />
                    </div>
                    <Button
                      size="sm"
                      onClick={() => uploadDrawing(type)}
                      disabled={uploadingDrawing[type]}
                    >
                      {uploadingDrawing[type] ? t('database.drawings.uploading') : t('database.drawings.upload')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Współczynniki rekompensujące udźwig */}
            <div className="mt-5 pt-4 border-t border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                {t('database.coefficients.sectionTitle')}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                <TechField label={t('database.coefficients.stops')} value={localElevator.coeff_stops} elevatorId={localElevator.id} field="coeff_stops" onSaved={(id, f, v) => { onUpdate(id, f, v); setLocalElevator(prev => ({ ...prev, coeff_stops: v ? parseFloat(v) : null })) }} type="number" />
                <TechField label={t('database.coefficients.cabinModel')} value={localElevator.coeff_cabin_model} elevatorId={localElevator.id} field="coeff_cabin_model" onSaved={(id, f, v) => { onUpdate(id, f, v); setLocalElevator(prev => ({ ...prev, coeff_cabin_model: v ? parseFloat(v) : null })) }} type="number" />
                <TechField label={t('database.coefficients.cabinThroughway')} value={localElevator.coeff_cabin_throughway} elevatorId={localElevator.id} field="coeff_cabin_throughway" onSaved={(id, f, v) => { onUpdate(id, f, v); setLocalElevator(prev => ({ ...prev, coeff_cabin_throughway: v ? parseFloat(v) : null })) }} type="number" />
                <TechField label={t('database.coefficients.cabinDoors')} value={localElevator.coeff_cabin_doors} elevatorId={localElevator.id} field="coeff_cabin_doors" onSaved={(id, f, v) => { onUpdate(id, f, v); setLocalElevator(prev => ({ ...prev, coeff_cabin_doors: v ? parseFloat(v) : null })) }} type="number" />
                <TechField label={t('database.coefficients.landingDoors')} value={localElevator.coeff_landing_doors} elevatorId={localElevator.id} field="coeff_landing_doors" onSaved={(id, f, v) => { onUpdate(id, f, v); setLocalElevator(prev => ({ ...prev, coeff_landing_doors: v ? parseFloat(v) : null })) }} type="number" />
                <TechField label={t('database.coefficients.ei30')} value={localElevator.coeff_ei30} elevatorId={localElevator.id} field="coeff_ei30" onSaved={(id, f, v) => { onUpdate(id, f, v); setLocalElevator(prev => ({ ...prev, coeff_ei30: v ? parseFloat(v) : null })) }} type="number" />
                <TechField label={t('database.coefficients.ei60')} value={localElevator.coeff_ei60} elevatorId={localElevator.id} field="coeff_ei60" onSaved={(id, f, v) => { onUpdate(id, f, v); setLocalElevator(prev => ({ ...prev, coeff_ei60: v ? parseFloat(v) : null })) }} type="number" />
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

const EMPTY_ELEVATOR = {
  model: '',
  manufacturer: '',
  capacity: '',
  persons: '',
  cabin_width: '',
  cabin_depth: '',
  cabin_height: '',
  shaft_width: '',
  shaft_depth: '',
  pit_depth: '',
  overhead: '',
  speed: '',
  drive_type: '',
  max_stops: '',
  base_price: '',
  standards: '',
  machine_room: '',
  lifting_height: '',
  door_width: '',
  door_height: '',
  door_fire_class: '',
  shaft_construction: '',
  shaft_ventilation: '',
  shaft_temperature: '',
  installation_type: '',
  cabin_finish: '',
  cabin_door_finish: '',
  landing_door_finish: '',
  equipment: '',
}

type DatabaseTab = 'elevators' | 'lift-types' | 'cabin-models' | 'accessories' | 'extras' | 'cabin-colors' | 'cabin-types' | 'general'


const Database = () => {
  const { t } = useTranslation()

  const DB_TABS = [
    { id: 'elevators' as DatabaseTab,    label: t('database.tabs.elevators') },
    { id: 'lift-types' as DatabaseTab,   label: t('database.tabs.liftTypes') },
    { id: 'cabin-models' as DatabaseTab, label: t('database.tabs.cabinModels') },
    { id: 'accessories' as DatabaseTab,   label: t('database.tabs.accessories') },
    { id: 'extras' as DatabaseTab,        label: t('database.tabs.extras') },
    { id: 'cabin-colors' as DatabaseTab,  label: t('database.tabs.cabinColors') },
    { id: 'cabin-types' as DatabaseTab,   label: t('database.tabs.cabinTypes') },
    { id: 'general' as DatabaseTab,       label: t('database.tabs.general') },
  ]

  const getTabSubtitle = (tab: DatabaseTab, n: number): string => {
    if (tab === 'general') return t('database.subtitles.general')
    const key = {
      'elevators':     'database.subtitles.elevators',
      'lift-types':    'database.subtitles.liftTypes',
      'cabin-models':  'database.subtitles.cabinModels',
      'accessories':   'database.subtitles.accessories',
      'extras':        'database.subtitles.extras',
      'cabin-colors':  'database.subtitles.cabinColors',
      'cabin-types':   'database.subtitles.cabinTypes',
    }[tab]
    return t(key as any, { count: n })
  }
  const [elevators, setElevators] = useState<Elevator[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState(EMPTY_ELEVATOR)
  const [saving, setSaving] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({})
  const [tab, setTab] = useState<DatabaseTab>('elevators')
  const [counts, setCounts] = useState<Partial<Record<DatabaseTab, number>>>({})

  const load = () => {
    setLoading(true)
    api.get('/admin/elevators')
      .then(res => setElevators(res.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const updateElevator = async (id: number, field: string, value: string) => {
    const payload: Record<string, string | boolean | number | null> = {}
    const nullableInts = ['shaft_width', 'shaft_depth', 'pit_depth', 'overhead', 'door_width', 'door_height']
    const nullableFloats = [
      'base_price', 'lifting_height',
      'coeff_stops', 'coeff_cabin_model', 'coeff_cabin_throughway',
      'coeff_cabin_doors', 'coeff_landing_doors', 'coeff_ei30', 'coeff_ei60',
    ]
    if (field === 'is_active') payload[field] = value === '1'
    else if (['capacity', 'persons', 'cabin_width', 'cabin_depth', 'cabin_height', 'max_stops'].includes(field)) payload[field] = parseInt(value)
    else if (nullableInts.includes(field)) payload[field] = value.trim() !== '' ? parseInt(value) : null
    else if (['speed'].includes(field)) payload[field] = parseFloat(value)
    else if (nullableFloats.includes(field)) payload[field] = value.trim() !== '' ? parseFloat(value) : null
    else payload[field] = value.trim() !== '' ? value : null

    try {
      await api.patch(`/admin/elevators/${id}`, payload)
      setElevators(prev => prev.map(e => e.id === id ? { ...e, ...payload } as Elevator : e))
    } catch (err: any) {
      const errors = err?.response?.data?.errors as Record<string, string[]> | undefined
      if (errors) {
        Object.values(errors).forEach(msgs => toast.error(msgs[0]))
      } else {
        toast.error(err?.response?.data?.message ?? t('database.errorSave'))
      }
    }
  }

  const deleteElevator = async (id: number) => {
    if (!confirm(t('elevators.confirmDelete'))) return
    await api.delete(`/admin/elevators/${id}`)
    setElevators(prev => prev.filter(e => e.id !== id))
  }

  const addElevator = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setFormErrors({})
    try {
      const num = (v: string) => v !== '' ? parseInt(v) : null
      const flt = (v: string) => v !== '' ? parseFloat(v) : null
      const res = await api.post('/admin/elevators', {
        ...form,
        capacity: parseInt(form.capacity),
        persons: parseInt(form.persons),
        cabin_width: parseInt(form.cabin_width),
        cabin_depth: parseInt(form.cabin_depth),
        cabin_height: parseInt(form.cabin_height),
        shaft_width: num(form.shaft_width),
        shaft_depth: num(form.shaft_depth),
        pit_depth: num(form.pit_depth),
        overhead: num(form.overhead),
        speed: parseFloat(form.speed),
        drive_type: form.drive_type || null,
        max_stops: parseInt(form.max_stops),
        base_price: flt(form.base_price),
        lifting_height: flt(form.lifting_height),
        door_width: num(form.door_width),
        door_height: num(form.door_height),
        is_active: true,
      })
      setElevators(prev => [res.data, ...prev])
      setForm(EMPTY_ELEVATOR)
      setShowAdd(false)
    } catch (err: any) {
      const errors = err?.response?.data?.errors as Record<string, string[]> | undefined
      if (errors) {
        setFormErrors(errors)
        Object.values(errors).forEach(msgs => toast.error(msgs[0]))
      } else {
        toast.error(err?.response?.data?.message ?? t('database.errorSave'))
      }
    } finally {
      setSaving(false)
    }
  }

  const inp = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [key]: e.target.value })),
    className: 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-300',
    required: true,
  })

  const optInp = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [key]: e.target.value })),
    className: 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-300',
  })

  return (
    <MainLayout headerComponent={
      <MainHeader title={t('nav.database')} subTitle={getTabSubtitle(tab, tab === 'elevators' ? elevators.length : (counts[tab] ?? 0))}>
        {tab === 'elevators' && (
          <Button size="sm" onClick={() => setShowAdd(!showAdd)}>
            <Plus className="h-4 w-4" />
            {t('elevators.add')}
          </Button>
        )}
      </MainHeader>
    }>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 -mb-2 overflow-x-auto">
        {DB_TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              tab === id ? 'border-[#ffb400] text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Add elevator form */}
      {showAdd && (
        <Card className="p-6 gap-0">
          <h3 className="font-medium text-gray-900 mb-4">{t('elevators.newElevator')}</h3>
          <form onSubmit={addElevator}>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">{t('elevators.manufacturer')}</label>
                <input {...inp('manufacturer')} />
                {formErrors.manufacturer && <p className="text-xs text-red-500 mt-0.5">{formErrors.manufacturer[0]}</p>}
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">{t('elevators.model')}</label>
                <input {...inp('model')} />
                {formErrors.model && <p className="text-xs text-red-500 mt-0.5">{formErrors.model[0]}</p>}
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">{t('elevators.capacityKg')}</label>
                <input {...inp('capacity')} type="number" />
                {formErrors.capacity && <p className="text-xs text-red-500 mt-0.5">{formErrors.capacity[0]}</p>}
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">{t('elevators.persons')}</label>
                <input {...inp('persons')} type="number" />
                {formErrors.persons && <p className="text-xs text-red-500 mt-0.5">{formErrors.persons[0]}</p>}
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">{t('elevators.cabinWidth')}</label>
                <input {...inp('cabin_width')} type="number" />
                {formErrors.cabin_width && <p className="text-xs text-red-500 mt-0.5">{formErrors.cabin_width[0]}</p>}
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">{t('elevators.cabinDepth')}</label>
                <input {...inp('cabin_depth')} type="number" />
                {formErrors.cabin_depth && <p className="text-xs text-red-500 mt-0.5">{formErrors.cabin_depth[0]}</p>}
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">{t('elevators.cabinHeight')}</label>
                <input {...inp('cabin_height')} type="number" />
                {formErrors.cabin_height && <p className="text-xs text-red-500 mt-0.5">{formErrors.cabin_height[0]}</p>}
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">{t('elevators.speedMs')}</label>
                <input {...inp('speed')} type="number" step="0.1" />
                {formErrors.speed && <p className="text-xs text-red-500 mt-0.5">{formErrors.speed[0]}</p>}
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">{t('elevators.maxStops')}</label>
                <input {...inp('max_stops')} type="number" />
                {formErrors.max_stops && <p className="text-xs text-red-500 mt-0.5">{formErrors.max_stops[0]}</p>}
              </div>
              <div><label className="text-xs text-gray-500 mb-1 block">{t('elevators.shaftWidth')} <span className="text-gray-300">(opcj.)</span></label><input {...optInp('shaft_width')} type="number" /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">{t('elevators.shaftDepth')} <span className="text-gray-300">(opcj.)</span></label><input {...optInp('shaft_depth')} type="number" /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">{t('elevators.pitDepth')} <span className="text-gray-300">(opcj.)</span></label><input {...optInp('pit_depth')} type="number" /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">{t('elevators.overhead')} <span className="text-gray-300">(opcj.)</span></label><input {...optInp('overhead')} type="number" /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">{t('elevators.driveType')} <span className="text-gray-300">(opcj.)</span></label><input {...optInp('drive_type')} /></div>
              <div className="col-span-2"><label className="text-xs text-gray-500 mb-1 block">{t('elevators.basePriceNet')} <span className="text-gray-300">(opcj.)</span></label><input {...optInp('base_price')} type="number" step="0.01" /></div>
            </div>
            {/* Technical parameters */}
            <div className="border-t border-gray-100 pt-4 mt-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{t('database.technical.techParamsSection')}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-3">
                <div><label className="text-xs text-gray-500 mb-1 block">{t('database.technical.standards')}</label><input {...optInp('standards')} /></div>
                <div><label className="text-xs text-gray-500 mb-1 block">{t('database.technical.machineRoom')}</label><input {...optInp('machine_room')} /></div>
                <div><label className="text-xs text-gray-500 mb-1 block">{t('database.technical.liftingHeight')}</label><input {...optInp('lifting_height')} type="number" step="0.01" /></div>
                <div><label className="text-xs text-gray-500 mb-1 block">{t('database.technical.doorWidth')}</label><input {...optInp('door_width')} type="number" /></div>
                <div><label className="text-xs text-gray-500 mb-1 block">{t('database.technical.doorHeight')}</label><input {...optInp('door_height')} type="number" /></div>
                <div><label className="text-xs text-gray-500 mb-1 block">{t('database.technical.doorFireClass')}</label><input {...optInp('door_fire_class')} /></div>
                <div><label className="text-xs text-gray-500 mb-1 block">{t('database.technical.shaftConstruction')}</label><input {...optInp('shaft_construction')} /></div>
                <div><label className="text-xs text-gray-500 mb-1 block">{t('database.technical.shaftVentilation')}</label><input {...optInp('shaft_ventilation')} /></div>
                <div><label className="text-xs text-gray-500 mb-1 block">{t('database.technical.shaftTemperature')}</label><input {...optInp('shaft_temperature')} /></div>
                <div><label className="text-xs text-gray-500 mb-1 block">{t('database.technical.installationType')}</label><input {...optInp('installation_type')} /></div>
                <div><label className="text-xs text-gray-500 mb-1 block">{t('database.technical.cabinFinish')}</label><input {...optInp('cabin_finish')} /></div>
                <div><label className="text-xs text-gray-500 mb-1 block">{t('database.technical.cabinDoorFinish')}</label><input {...optInp('cabin_door_finish')} /></div>
                <div className="col-span-2"><label className="text-xs text-gray-500 mb-1 block">{t('database.technical.landingDoorFinish')}</label><input {...optInp('landing_door_finish')} /></div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">{t('database.technical.equipment')}</label>
                <textarea
                  value={form.equipment}
                  onChange={e => setForm(p => ({ ...p, equipment: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button type="submit" size="sm" disabled={saving}>{saving ? t('common.saving') : t('elevators.add')}</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowAdd(false)}>{t('common.cancel')}</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Elevators table */}
      {tab === 'elevators' && (
        <Card className="gap-0 overflow-hidden">
          {loading ? (
            <div className="p-6"><SkeletonLoader count={4} /></div>
          ) : elevators.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              {t('elevators.noElevators')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[800px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="w-8 px-4 py-3" />
                    <th className="text-left px-2 py-3 text-xs font-medium text-gray-500 uppercase">{t('elevators.manufacturer')}</th>
                    <th className="text-left px-2 py-3 text-xs font-medium text-gray-500 uppercase">{t('elevators.model')}</th>
                    <th className="text-center px-2 py-3 text-xs font-medium text-gray-500 uppercase">{t('elevators.capacity')}</th>
                    <th className="text-center px-2 py-3 text-xs font-medium text-gray-500 uppercase">{t('elevators.persons')}</th>
                    <th className="text-left px-2 py-3 text-xs font-medium text-gray-500 uppercase">{t('elevators.cabin')}</th>
                    <th className="text-left px-2 py-3 text-xs font-medium text-gray-500 uppercase">{t('elevators.driveType')}</th>
                    <th className="text-right px-2 py-3 text-xs font-medium text-gray-500 uppercase">{t('elevators.basePrice')}</th>
                    <th className="text-center px-2 py-3 text-xs font-medium text-gray-500 uppercase">{t('elevators.status')}</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {elevators.map(elevator => (
                    <ElevatorRow
                      key={elevator.id}
                      elevator={elevator}
                      onUpdate={updateElevator}
                      onDelete={deleteElevator}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {tab === 'lift-types' && <LiftTypesTab onCountChange={n => setCounts(p => ({ ...p, 'lift-types': n }))} />}
      {tab === 'cabin-models' && <CabinModelsTab onCountChange={n => setCounts(p => ({ ...p, 'cabin-models': n }))} />}
      {tab === 'accessories' && <AccessoriesTab onCountChange={n => setCounts(p => ({ ...p, 'accessories': n }))} />}
      {tab === 'extras' && <ExtrasTab onCountChange={n => setCounts(p => ({ ...p, 'extras': n }))} />}
      {tab === 'cabin-colors' && <CabinColorsTab onCountChange={n => setCounts(p => ({ ...p, 'cabin-colors': n }))} />}
      {tab === 'cabin-types' && <CabinTypesTab onCountChange={n => setCounts(p => ({ ...p, 'cabin-types': n }))} />}
      {tab === 'general' && <GeneralTab />}
    </MainLayout>
  )
}

export default Database
