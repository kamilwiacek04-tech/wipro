import { useEffect, useState } from 'react'
import { Plus, Trash2, Save } from 'lucide-react'
import { Card } from '@admin/components/Cards'
import { Button } from '@admin/components/Button'
import SkeletonLoader from '@admin/components/SkeletonLoader'
import MainLayout from '@admin/components/layout/MainLayout'
import MainHeader from '@admin/components/layout/MainHeader'
import InlineEdit from '@admin/components/InlineEdit'
import api from '@admin/store/axiosInstance'
import { authStore } from '@admin/store/zustand/authStore'
import { useTranslation } from 'react-i18next'

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
  MIRROR: 'Lustra', HANDRAIL: 'Poręcze', FLOORING: 'Wykładzina',
}

type Tab = 'lift-types' | 'cabin-models' | 'accessories' | 'general'

// ─── ImagePicker ──────────────────────────────────────────────────────────────
const CamSvg = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
  </svg>
)

const ImagePicker = ({
  previewUrl,
  uploadUrl,
  onSelect,
  onUploaded,
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
        setUploading(false)
        e.target.value = ''
      }
    } else {
      onSelect?.(file)
    }
  }

  return (
    <label
      className="relative block w-14 h-14 rounded-lg border-2 border-dashed border-gray-200 hover:border-blue-400 cursor-pointer overflow-hidden bg-gray-50 transition-colors flex-shrink-0"
      title="Kliknij, aby wgrać zdjęcie"
    >
      <input type="file" accept="image/*" className="hidden" onChange={handleChange} />
      {uploading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : previewUrl ? (
        <img src={previewUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-gray-300">
          <CamSvg />
        </div>
      )}
    </label>
  )
}

// ─── DetailsEditor ────────────────────────────────────────────────────────────
const DetailsEditor = ({
  value,
  onChange,
}: {
  value: DetailRow[]
  onChange: (v: DetailRow[]) => void
}) => {
  const update = (i: number, field: keyof DetailRow, v: string) =>
    onChange(value.map((row, j) => (j === i ? { ...row, [field]: v } : row)))
  const remove = (i: number) => onChange(value.filter((_, j) => j !== i))
  const add = () => onChange([...value, { label: '', value: '' }])

  const cls = 'border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-300 flex-1 min-w-0'

  return (
    <div className="flex flex-col gap-1.5">
      {value.length === 0 && (
        <p className="text-xs text-gray-400 italic">Brak szczegółów — kliknij „Dodaj wiersz"</p>
      )}
      {value.map((row, i) => (
        <div key={i} className="flex gap-1.5 items-center">
          <input className={cls} placeholder="Etykieta (np. Sufit)" value={row.label} onChange={e => update(i, 'label', e.target.value)} />
          <input className={cls} placeholder="Wartość (np. ST1)" value={row.value} onChange={e => update(i, 'value', e.target.value)} />
          <button type="button" onClick={() => remove(i)} className="text-gray-400 hover:text-red-500 text-lg leading-none px-1 flex-shrink-0">×</button>
        </div>
      ))}
      <button type="button" onClick={add} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-0.5 w-fit">
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
      setNewType({ key: '', name_pl: '', name_en: '', sort_order: 0 })
      setShowAdd(false)
    } finally { setSaving(false) }
  }

  const inp = (key: keyof typeof newType) => ({
    value: String(newType[key]),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setNewType(p => ({ ...p, [key]: key === 'sort_order' ? parseInt(e.target.value) || 0 : e.target.value })),
    className: 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300',
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
    setExpandedId(m.id)
    setEditingDetails(m.details ?? [])
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
      fd.append('name_pl', newModel.name_pl)
      fd.append('name_en', newModel.name_en)
      fd.append('sort_order', String(newModel.sort_order))
      fd.append('is_active', '1')
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
    className: 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300',
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
              <ImagePicker
                previewUrl={newImagePreview}
                onSelect={(file) => { setNewImageFile(file); setNewImagePreview(URL.createObjectURL(file)) }}
              />
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
                      <ImagePicker
                        previewUrl={m.image_url}
                        uploadUrl={`/admin/cabin-models/${m.id}/image`}
                        onUploaded={(url) => handleImageUploaded(m.id, url)}
                      />
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
                      <button
                        type="button"
                        onClick={() => openDetails(m)}
                        className={`text-xs px-2 py-0.5 rounded cursor-pointer transition-colors ${expandedId === m.id ? 'bg-blue-100 text-blue-700' : 'text-blue-600 hover:text-blue-800 underline'}`}
                      >
                        {m.details?.length ?? 0} poz.
                      </button>
                    </td>
                    <td className="px-2 py-3"><Button variant="ghost" size="icon" onClick={() => deleteModel(m.id)} className="h-8 w-8 text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button></td>
                  </tr>
                  {expandedId === m.id && (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 bg-blue-50/40 border-b border-blue-100">
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
      fd.append('category', newAcc.category)
      fd.append('name_pl', newAcc.name_pl)
      fd.append('name_en', newAcc.name_en)
      fd.append('sort_order', String(newAcc.sort_order))
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
    className: 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300',
  })

  const grouped = ACCESSORY_CATEGORIES.reduce((acc, cat) => {
    acc[cat] = accessories.filter(a => a.category === cat)
    return acc
  }, {} as Record<string, CabinAccessory[]>)

  return (
    <div className="flex flex-col gap-4">
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
                <ImagePicker
                  previewUrl={newAccImagePreview}
                  onSelect={(file) => { setNewAccImageFile(file); setNewAccImagePreview(URL.createObjectURL(file)) }}
                />
              </div>
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-xs text-gray-500 mb-1 block">Kategoria</label>
                  <select
                    value={newAcc.category}
                    onChange={e => setNewAcc(p => ({ ...p, category: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  >
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
      </Card>

      {loading ? <div className="p-6"><SkeletonLoader count={4} /></div> : (
        ACCESSORY_CATEGORIES.map(cat => (
          grouped[cat].length > 0 && (
            <Card key={cat} className="gap-0 overflow-hidden">
              <div className="px-6 py-3 border-b border-gray-100 bg-gray-50/30">
                <p className="font-medium text-sm text-gray-700">{CATEGORY_LABELS[cat]}</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="px-4 py-2 w-20 text-left text-xs font-medium text-gray-500 uppercase">Foto</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Nazwa PL</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Nazwa EN</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Kol.</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="w-10" />
                  </tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {grouped[cat].map(a => (
                      <tr key={a.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-2 w-20">
                          <ImagePicker
                            previewUrl={a.image_url}
                            uploadUrl={`/admin/cabin-accessories/${a.id}/image`}
                            onUploaded={(url) => handleImageUploaded(a.id, url)}
                          />
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
                  </tbody>
                </table>
              </div>
            </Card>
          )
        ))
      )}
    </div>
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
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
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

// ─── Main page ────────────────────────────────────────────────────────────────
const TABS: { id: Tab; label: string }[] = [
  { id: 'lift-types', label: 'Typy wind' },
  { id: 'cabin-models', label: 'Modele kabin' },
  { id: 'accessories', label: 'Akcesoria' },
  { id: 'general', label: 'Ogólne' },
]

const SettingsPage = () => {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('lift-types')

  return (
    <MainLayout headerComponent={
      <MainHeader title={t('settings.title')} subTitle={t('settings.subtitle')} />
    }>
      <div className="flex gap-2 border-b border-gray-200 -mb-2">
        {TABS.map(({ id, label }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${tab === id ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'lift-types' && <LiftTypesTab />}
      {tab === 'cabin-models' && <CabinModelsTab />}
      {tab === 'accessories' && <AccessoriesTab />}
      {tab === 'general' && <GeneralTab />}
    </MainLayout>
  )
}

export default SettingsPage
