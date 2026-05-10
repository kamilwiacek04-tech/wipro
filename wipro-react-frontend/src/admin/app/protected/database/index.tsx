import { useEffect, useState } from 'react'
import { Plus, ChevronDown, ChevronRight, Trash2, Save } from 'lucide-react'
import { Card } from '@admin/components/Cards'
import { Button } from '@admin/components/Button'
import SkeletonLoader from '@admin/components/SkeletonLoader'
import MainLayout from '@admin/components/layout/MainLayout'
import MainHeader from '@admin/components/layout/MainHeader'
import InlineEdit from '@admin/components/InlineEdit'
import api from '@admin/store/axiosInstance'
import { formatPrice } from '@admin/functions/formatDate'
import { useTranslation } from 'react-i18next'

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
}

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
                      className="w-32 border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-300"
                    />
                    <input
                      placeholder={t('elevators.elementNamePlaceholder')}
                      value={newElement.name}
                      onChange={e => setNewElement(p => ({ ...p, name: e.target.value }))}
                      className="flex-1 border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-300"
                    />
                    <input
                      type="number"
                      placeholder={t('elevators.priceNetPlaceholder')}
                      value={newElement.price}
                      onChange={e => setNewElement(p => ({ ...p, price: e.target.value }))}
                      className="w-24 border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-300"
                    />
                    <Button size="sm" onClick={addElement} disabled={saving}>
                      <Save className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setAddingElement(false)}>{t('common.cancel')}</Button>
                  </div>
                )}

                <button
                  onClick={() => setAddingElement(true)}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 cursor-pointer mt-1"
                >
                  <Plus className="h-3 w-3" /> {t('elevators.addElement')}
                </button>
              </div>
            )}
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
}

const Database = () => {
  const { t } = useTranslation()
  const [elevators, setElevators] = useState<Elevator[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState(EMPTY_ELEVATOR)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<'elevators' | 'elements'>('elevators')

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
    else if (['capacity', 'persons', 'cabin_width', 'cabin_depth', 'cabin_height', 'shaft_width', 'shaft_depth', 'pit_depth', 'overhead', 'max_stops'].includes(field)) payload[field] = parseInt(value)
    else if (['base_price', 'speed'].includes(field)) payload[field] = parseFloat(value)
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
    className: 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300',
    required: true,
  })

  return (
    <MainLayout headerComponent={
      <MainHeader title={t('nav.database')} subTitle={t('elevators.elevatorsCount', { count: elevators.length })}>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)}>
          <Plus className="h-4 w-4" />
          {t('elevators.add')}
        </Button>
      </MainHeader>
    }>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 -mb-2">
        {(['elevators', 'elements'] as const).map(tabKey => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              tab === tabKey ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tabKey === 'elevators' ? t('elevators.tabElevators') : t('elevators.tabElements')}
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
            <div className="flex gap-2">
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

      {/* Elements overview tab */}
      {tab === 'elements' && (
        <Card className="gap-0 overflow-hidden">
          <div className="p-6">
            <p className="text-sm text-gray-600">{t('elevators.elementsOverviewHint')}</p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {elevators.map(e => (
                <div key={e.id} className="border border-gray-100 rounded-lg p-4">
                  <p className="font-medium text-sm">{e.manufacturer} {e.model}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {t('elevators.capacity')}: {e.capacity} kg · {t('elevators.basePrice')}: {formatPrice(e.base_price)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </MainLayout>
  )
}

export default Database
