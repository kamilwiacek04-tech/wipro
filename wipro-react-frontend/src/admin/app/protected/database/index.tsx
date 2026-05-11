import { useEffect, useState } from 'react'
import { Plus, ChevronDown, ChevronRight, Trash2, Save } from 'lucide-react'
import { Card } from '@admin/components/Cards'
import { Button } from '@admin/components/Button'
import SkeletonLoader from '@admin/components/SkeletonLoader'
import MainLayout from '@admin/components/layout/MainLayout'
import MainHeader from '@admin/components/layout/MainHeader'
import InlineEdit from '@admin/components/InlineEdit'
import api from '@admin/store/axiosInstance'
import { useTranslation } from 'react-i18next'
import { authStore } from '@admin/store/zustand/authStore'

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
  id: number; key: string; name_pl: string; name_en: string; sort_order: number; is_active: boolean
}
interface CabinModel {
  id: number; name_pl: string; name_en: string; image_url: string | null; details: DetailRow[] | null; sort_order: number; is_active: boolean
}
interface CabinAccessory {
  id: number; category: string; name_pl: string; name_en: string; image_url: string | null; sort_order: number; is_active: boolean
}
type DetailRow = { label: string; value: string }

const ACCESSORY_CATEGORIES = ['PANEL', 'SIGNAL', 'CEILING', 'MIRROR', 'HANDRAIL', 'FLOORING'] as const
const CATEGORY_LABELS: Record<string, string> = {
  PANEL: 'Panel dyspozycji', SIGNAL: 'Sygnalizacja', CEILING: 'Sufity',
  MIRROR: 'Lustra', HANDRAIL: 'Poręcze', FLOORING: 'Wykładzina', EXTRA: 'Dodatki',
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
    <label className="relative block w-14 h-14 rounded-lg border-2 border-dashed border-gray-200 hover:border-amber-400 cursor-pointer overflow-hidden bg-gray-50 transition-colors flex-shrink-0" title="Kliknij, aby wgrać zdjęcie">
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
  const update = (i: number, field: keyof DetailRow, v: string) =>
    onChange(value.map((row, j) => (j === i ? { ...row, [field]: v } : row)))
  const remove = (i: number) => onChange(value.filter((_, j) => j !== i))
  const add = () => onChange([...value, { label: '', value: '' }])
  const cls = 'border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-amber-300 flex-1 min-w-0'
  return (
    <div className="flex flex-col gap-1.5">
      {value.length === 0 && <p className="text-xs text-gray-400 italic">Brak szczegółów — kliknij „Dodaj wiersz"</p>}
      {value.map((row, i) => (
        <div key={i} className="flex gap-1.5 items-center">
          <input className={cls} placeholder="Etykieta (np. Sufit)" value={row.label} onChange={e => update(i, 'label', e.target.value)} />
          <input className={cls} placeholder="Wartość (np. ST1)" value={row.value} onChange={e => update(i, 'value', e.target.value)} />
          <button type="button" onClick={() => remove(i)} className="text-gray-400 hover:text-red-500 text-lg leading-none px-1 flex-shrink-0">×</button>
        </div>
      ))}
      <button type="button" onClick={add} className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-800 mt-0.5 w-fit">
        <Plus className="w-3 h-3" /> Dodaj wiersz
      </button>
    </div>
  )
}

// ─── Lift types tab ───────────────────────────────────────────────────────────
const LiftTypesTab = () => {
  const { t } = useTranslation()
  const [liftTypes, setLiftTypes] = useState<LiftType[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newType, setNewType] = useState({ key: '', name_pl: '', name_en: '', sort_order: 0 })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/admin/lift-types').then(r => setLiftTypes(r.data)).finally(() => setLoading(false))
  }, [])

  const updateType = async (id: number, field: string, value: string | boolean | number) => {
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
      setNewType({ key: '', name_pl: '', name_en: '', sort_order: 0 }); setShowAdd(false)
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            <div><label className="text-xs text-gray-500 mb-1 block">{t('settings.key')}</label><input {...inp('key')} placeholder="PASSENGER" /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">{t('settings.namePl')}</label><input {...inp('name_pl')} /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">{t('settings.nameEn')}</label><input {...inp('name_en')} /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">{t('settings.sortOrder')}</label><input {...inp('sort_order')} type="number" min="0" /></div>
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
const EMPTY_CABIN = { name_pl: '', name_en: '', sort_order: 0 }

const CabinModelsTab = () => {
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

  useEffect(() => {
    api.get('/admin/cabin-models').then(r => setModels(r.data)).finally(() => setLoading(false))
  }, [])

  const deleteModel = async (id: number) => {
    if (!confirm('Usunąć model kabiny?')) return
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
        <h2 className="font-semibold text-gray-900">Modele kabin</h2>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)}><Plus className="h-4 w-4" />Dodaj model</Button>
      </div>
      {showAdd && (
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/40">
          <div className="flex gap-4 mb-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Zdjęcie</label>
              <ImagePicker previewUrl={newImagePreview} onSelect={(file) => { setNewImageFile(file); setNewImagePreview(URL.createObjectURL(file)) }} />
            </div>
            <div className="flex-1 grid grid-cols-2 gap-3">
              <div><label className="text-xs text-gray-500 mb-1 block">Nazwa PL</label><input {...inp('name_pl')} /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">Nazwa EN</label><input {...inp('name_en')} /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">Kolejność</label><input {...inp('sort_order')} type="number" min="0" /></div>
            </div>
          </div>
          <div className="mb-4">
            <label className="text-xs text-gray-500 mb-2 block font-medium">Szczegóły modelu</label>
            <DetailsEditor value={newDetails} onChange={setNewDetails} />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={addModel} disabled={saving}><Save className="h-3 w-3" />{saving ? t('common.saving') : t('common.save')}</Button>
            <Button variant="ghost" size="sm" onClick={() => { setShowAdd(false); setNewDetails([]); setNewImageFile(null); setNewImagePreview(null) }}>{t('common.cancel')}</Button>
          </div>
        </div>
      )}
      {loading ? <div className="p-6"><SkeletonLoader count={3} /></div> : models.length === 0 ? (
        <div className="p-12 text-center text-gray-400 text-sm">Brak modeli kabin.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-4 py-3 w-20" />
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Nazwa PL</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Nazwa EN</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Kol.</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Szczeg.</th>
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
                    <td className="px-2 py-3"><Button variant="ghost" size="icon" onClick={() => deleteModel(m.id)} className="h-8 w-8 text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button></td>
                  </tr>
                  {expandedId === m.id && (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 bg-amber-50/40 border-b border-amber-100">
                        <p className="text-xs font-medium text-gray-600 mb-2">Szczegóły modelu kabiny:</p>
                        <DetailsEditor value={editingDetails} onChange={setEditingDetails} />
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" onClick={() => saveDetails(m.id)}><Save className="h-3 w-3" />Zapisz</Button>
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
const EMPTY_ACC = { category: 'PANEL', name_pl: '', name_en: '', sort_order: 0 }

const AccessoriesTab = () => {
  const { t } = useTranslation()
  const [accessories, setAccessories] = useState<CabinAccessory[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newAcc, setNewAcc] = useState(EMPTY_ACC)
  const [newAccImageFile, setNewAccImageFile] = useState<File | null>(null)
  const [newAccImagePreview, setNewAccImagePreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/admin/cabin-accessories').then(r => setAccessories(r.data)).finally(() => setLoading(false))
  }, [])

  const deleteAcc = async (id: number) => {
    if (!confirm('Usunąć akcesorium?')) return
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
      fd.append('is_active', '1')
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
        <h2 className="font-semibold text-gray-900">Akcesoria kabin</h2>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)}><Plus className="h-4 w-4" />Dodaj</Button>
      </div>

      {showAdd && (
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/40">
          <div className="flex gap-4 mb-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Zdjęcie</label>
              <ImagePicker previewUrl={newAccImagePreview} onSelect={(file) => { setNewAccImageFile(file); setNewAccImagePreview(URL.createObjectURL(file)) }} />
            </div>
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label className="text-xs text-gray-500 mb-1 block">Kategoria</label>
                <select value={newAcc.category} onChange={e => setNewAcc(p => ({ ...p, category: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-300">
                  {ACCESSORY_CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                </select>
              </div>
              <div><label className="text-xs text-gray-500 mb-1 block">Nazwa PL</label><input {...inp('name_pl')} /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">Nazwa EN</label><input {...inp('name_en')} /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">Kolejność</label><input {...inp('sort_order')} type="number" min="0" /></div>
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
                <th className="px-4 py-2 w-20 text-left text-xs font-medium text-gray-500 uppercase">Foto</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Nazwa PL</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Nazwa EN</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Kol.</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {ACCESSORY_CATEGORIES.filter(cat => grouped[cat].length > 0).map(cat => (
                <>
                  <tr key={`cat-${cat}`} className="bg-gray-50/60 border-t border-gray-100">
                    <td colSpan={6} className="px-4 py-2">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{CATEGORY_LABELS[cat]}</span>
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
                      <td className="px-2 py-3"><Button variant="ghost" size="icon" onClick={() => deleteAcc(a.id)} className="h-8 w-8 text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button></td>
                    </tr>
                  ))}
                </>
              ))}
              {ACCESSORY_CATEGORIES.every(cat => grouped[cat].length === 0) && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">Brak akcesorii</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

// ─── Extras tab ───────────────────────────────────────────────────────────────
const EMPTY_EXTRA = { name_pl: '', name_en: '', sort_order: 0 }

const ExtrasTab = () => {
  const { t } = useTranslation()
  const [extras, setExtras] = useState<CabinAccessory[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newExtra, setNewExtra] = useState(EMPTY_EXTRA)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/admin/cabin-accessories')
      .then(r => setExtras((r.data as CabinAccessory[]).filter(a => a.category === 'EXTRA')))
      .finally(() => setLoading(false))
  }, [])

  const deleteExtra = async (id: number) => {
    if (!confirm('Usunąć dodatek?')) return
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
        sort_order: newExtra.sort_order, is_active: true,
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
        <h2 className="font-semibold text-gray-900">Dodatki</h2>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)}><Plus className="h-4 w-4" />Dodaj</Button>
      </div>
      {showAdd && (
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/40">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
            <div><label className="text-xs text-gray-500 mb-1 block">Nazwa PL</label><input {...inp('name_pl')} /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">Nazwa EN</label><input {...inp('name_en')} /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">Kolejność</label><input {...inp('sort_order')} type="number" min="0" /></div>
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
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Nazwa PL</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Nazwa EN</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Kol.</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="w-10" />
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {extras.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-400">Brak dodatków</td></tr>
              )}
              {extras.map(a => (
                <tr key={a.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3"><InlineEdit value={a.name_pl} onSave={v => updateExtra(a.id, 'name_pl', v)} /></td>
                  <td className="px-4 py-3"><InlineEdit value={a.name_en} onSave={v => updateExtra(a.id, 'name_en', v)} /></td>
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

// ─── General settings tab ─────────────────────────────────────────────────────
const GeneralTab = () => {
  const { t } = useTranslation()
  const [maxStops, setMaxStops] = useState(16)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api.get('/admin/settings').then(r => setMaxStops(parseInt(r.data.max_stops ?? '16'))).finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true); setSaved(false)
    try {
      await api.patch('/admin/settings', { max_stops: maxStops })
      setSaved(true); setTimeout(() => setSaved(false), 2000)
    } finally { setSaving(false) }
  }

  return (
    <Card className="p-6 gap-4">
      <h2 className="font-semibold text-gray-900">{t('settings.generalSettings')}</h2>
      {loading ? <SkeletonLoader count={1} /> : (
        <div className="flex items-end gap-4">
          <div className="flex-1 max-w-xs">
            <label className="text-xs text-gray-500 mb-1 block">{t('settings.maxStops')}</label>
            <input type="number" min={2} max={50} value={maxStops} onChange={e => setMaxStops(parseInt(e.target.value) || 16)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
            <p className="text-xs text-gray-400 mt-1">{t('settings.maxStopsHint')}</p>
          </div>
          <Button onClick={save} disabled={saving} className="mb-6">
            {saving ? t('common.saving') : saved ? t('settings.saved') : t('settings.saveSettings')}
          </Button>
        </div>
      )}
    </Card>
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
}

const TechField = ({ label, value, elevatorId, field, onSaved, type = 'text' }: {
  label: string
  value: string | number | null | undefined
  elevatorId: number
  field: string
  onSaved: (elevatorId: number, field: string, value: string) => void
  type?: string
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
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Dane techniczne</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-3">
                <TechField label="Normy" value={elevator.standards} elevatorId={elevator.id} field="standards" onSaved={onUpdate} />
                <TechField label="Maszynownia" value={elevator.machine_room} elevatorId={elevator.id} field="machine_room" onSaved={onUpdate} />
                <TechField label="Wys. podnoszenia [m]" value={elevator.lifting_height} elevatorId={elevator.id} field="lifting_height" type="number" onSaved={onUpdate} />
                <TechField label="Szer. drzwi [mm]" value={elevator.door_width} elevatorId={elevator.id} field="door_width" type="number" onSaved={onUpdate} />
                <TechField label="Wys. drzwi [mm]" value={elevator.door_height} elevatorId={elevator.id} field="door_height" type="number" onSaved={onUpdate} />
                <TechField label="Klasa EI drzwi" value={elevator.door_fire_class} elevatorId={elevator.id} field="door_fire_class" onSaved={onUpdate} />
                <TechField label="Konstr. szybu" value={elevator.shaft_construction} elevatorId={elevator.id} field="shaft_construction" onSaved={onUpdate} />
                <TechField label="Wentylacja szybu" value={elevator.shaft_ventilation} elevatorId={elevator.id} field="shaft_ventilation" onSaved={onUpdate} />
                <TechField label="Temp. w szybie" value={elevator.shaft_temperature} elevatorId={elevator.id} field="shaft_temperature" onSaved={onUpdate} />
                <TechField label="Montaż" value={elevator.installation_type} elevatorId={elevator.id} field="installation_type" onSaved={onUpdate} />
                <TechField label="Wystrój kabiny" value={elevator.cabin_finish} elevatorId={elevator.id} field="cabin_finish" onSaved={onUpdate} />
                <TechField label="Drzwi kabinowe" value={elevator.cabin_door_finish} elevatorId={elevator.id} field="cabin_door_finish" onSaved={onUpdate} />
                <TechField label="Drzwi przystankowe" value={elevator.landing_door_finish} elevatorId={elevator.id} field="landing_door_finish" onSaved={onUpdate} />
                <div className="col-span-2 sm:col-span-3 lg:col-span-4">
                  <p className="text-xs text-gray-400 mb-0.5 uppercase tracking-wide">Wyposażenie</p>
                  <InlineEdit value={elevator.equipment ?? ''} onSave={v => onUpdate(elevator.id, 'equipment', v)} />
                </div>
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

type DatabaseTab = 'elevators' | 'lift-types' | 'cabin-models' | 'accessories' | 'extras' | 'general'

const DB_TABS: { id: DatabaseTab; label: string }[] = [
  { id: 'elevators', label: 'Windy' },
  { id: 'lift-types', label: 'Typy wind' },
  { id: 'cabin-models', label: 'Modele kabin' },
  { id: 'accessories', label: 'Akcesoria' },
  { id: 'extras', label: 'Dodatki' },
  { id: 'general', label: 'Ogólne' },
]

const Database = () => {
  const { t } = useTranslation()
  const [elevators, setElevators] = useState<Elevator[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState(EMPTY_ELEVATOR)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<DatabaseTab>('elevators')

  const load = () => {
    setLoading(true)
    api.get('/admin/elevators')
      .then(res => setElevators(res.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const updateElevator = async (id: number, field: string, value: string) => {
    const payload: Record<string, string | boolean | number> = {}
    if (field === 'is_active') payload[field] = value === '1'
    else if (['capacity', 'persons', 'cabin_width', 'cabin_depth', 'cabin_height', 'shaft_width', 'shaft_depth', 'pit_depth', 'overhead', 'max_stops', 'door_width', 'door_height'].includes(field)) payload[field] = parseInt(value)
    else if (['base_price', 'speed', 'lifting_height'].includes(field)) payload[field] = parseFloat(value)
    else payload[field] = value

    await api.patch(`/admin/elevators/${id}`, payload)
    setElevators(prev => prev.map(e => e.id === id ? { ...e, ...payload } as Elevator : e))
  }

  const deleteElevator = async (id: number) => {
    if (!confirm(t('elevators.confirmDelete'))) return
    await api.delete(`/admin/elevators/${id}`)
    setElevators(prev => prev.filter(e => e.id !== id))
  }

  const addElevator = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await api.post('/admin/elevators', {
        ...form,
        capacity: parseInt(form.capacity),
        persons: parseInt(form.persons),
        cabin_width: parseInt(form.cabin_width),
        cabin_depth: parseInt(form.cabin_depth),
        cabin_height: parseInt(form.cabin_height),
        shaft_width: parseInt(form.shaft_width),
        shaft_depth: parseInt(form.shaft_depth),
        pit_depth: parseInt(form.pit_depth),
        overhead: parseInt(form.overhead),
        speed: parseFloat(form.speed),
        max_stops: parseInt(form.max_stops),
        base_price: parseFloat(form.base_price),
        is_active: true,
      })
      setElevators(prev => [res.data, ...prev])
      setForm(EMPTY_ELEVATOR)
      setShowAdd(false)
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
      <MainHeader title={t('nav.database')} subTitle={tab === 'elevators' ? t('elevators.elevatorsCount', { count: elevators.length }) : undefined}>
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
              <div><label className="text-xs text-gray-500 mb-1 block">{t('elevators.manufacturer')}</label><input {...inp('manufacturer')} /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">{t('elevators.model')}</label><input {...inp('model')} /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">{t('elevators.capacityKg')}</label><input {...inp('capacity')} type="number" /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">{t('elevators.persons')}</label><input {...inp('persons')} type="number" /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">{t('elevators.cabinWidth')}</label><input {...inp('cabin_width')} type="number" /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">{t('elevators.cabinDepth')}</label><input {...inp('cabin_depth')} type="number" /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">{t('elevators.cabinHeight')}</label><input {...inp('cabin_height')} type="number" /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">{t('elevators.shaftWidth')}</label><input {...inp('shaft_width')} type="number" /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">{t('elevators.shaftDepth')}</label><input {...inp('shaft_depth')} type="number" /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">{t('elevators.pitDepth')}</label><input {...inp('pit_depth')} type="number" /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">{t('elevators.overhead')}</label><input {...inp('overhead')} type="number" /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">{t('elevators.speedMs')}</label><input {...inp('speed')} type="number" step="0.1" /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">{t('elevators.driveType')}</label><input {...inp('drive_type')} /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">{t('elevators.maxStops')}</label><input {...inp('max_stops')} type="number" /></div>
              <div className="col-span-2"><label className="text-xs text-gray-500 mb-1 block">{t('elevators.basePriceNet')}</label><input {...inp('base_price')} type="number" step="0.01" /></div>
            </div>
            {/* Technical parameters */}
            <div className="border-t border-gray-100 pt-4 mt-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Parametry techniczne</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-3">
                <div><label className="text-xs text-gray-500 mb-1 block">Normy</label><input {...optInp('standards')} /></div>
                <div><label className="text-xs text-gray-500 mb-1 block">Maszynownia</label><input {...optInp('machine_room')} /></div>
                <div><label className="text-xs text-gray-500 mb-1 block">Wys. podnoszenia [m]</label><input {...optInp('lifting_height')} type="number" step="0.01" /></div>
                <div><label className="text-xs text-gray-500 mb-1 block">Szer. drzwi [mm]</label><input {...optInp('door_width')} type="number" /></div>
                <div><label className="text-xs text-gray-500 mb-1 block">Wys. drzwi [mm]</label><input {...optInp('door_height')} type="number" /></div>
                <div><label className="text-xs text-gray-500 mb-1 block">Klasa EI drzwi</label><input {...optInp('door_fire_class')} /></div>
                <div><label className="text-xs text-gray-500 mb-1 block">Konstr. szybu</label><input {...optInp('shaft_construction')} /></div>
                <div><label className="text-xs text-gray-500 mb-1 block">Wentylacja szybu</label><input {...optInp('shaft_ventilation')} /></div>
                <div><label className="text-xs text-gray-500 mb-1 block">Temp. w szybie</label><input {...optInp('shaft_temperature')} /></div>
                <div><label className="text-xs text-gray-500 mb-1 block">Montaż</label><input {...optInp('installation_type')} /></div>
                <div><label className="text-xs text-gray-500 mb-1 block">Wystrój kabiny</label><input {...optInp('cabin_finish')} /></div>
                <div><label className="text-xs text-gray-500 mb-1 block">Drzwi kabinowe</label><input {...optInp('cabin_door_finish')} /></div>
                <div className="col-span-2"><label className="text-xs text-gray-500 mb-1 block">Drzwi przystankowe</label><input {...optInp('landing_door_finish')} /></div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Wyposażenie</label>
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

      {tab === 'lift-types' && <LiftTypesTab />}
      {tab === 'cabin-models' && <CabinModelsTab />}
      {tab === 'accessories' && <AccessoriesTab />}
      {tab === 'extras' && <ExtrasTab />}
      {tab === 'general' && <GeneralTab />}
    </MainLayout>
  )
}

export default Database
