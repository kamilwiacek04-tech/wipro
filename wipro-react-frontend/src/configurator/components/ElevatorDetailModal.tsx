import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface ElevatorElement {
  id: number
  name: string
  category: string
  price: number
}

interface ElevatorDetail {
  id: number
  manufacturer: string
  model: string
  capacity: number
  persons: number
  cabin_width: number
  cabin_depth: number
  cabin_height: number
  shaft_width: number | null
  shaft_depth: number | null
  pit_depth: number | null
  overhead: number | null
  speed: string
  drive_type: string | null
  max_stops: number
  base_price: string | null
  description: string | null
  elements: ElevatorElement[]
  // Technical fields
  standards?: string | null
  machine_room?: string | null
  lifting_height?: string | null
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
}

interface Props {
  elevatorId: number
  onClose: () => void
}

const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/'

const ElevatorDetailModal = ({ elevatorId, onClose }: Props) => {
  const { t } = useTranslation()
  const [data, setData] = useState<ElevatorDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const url = apiBase.replace(/\/$/, '') + `/elevators/${elevatorId}`
    fetch(url, { headers: { Accept: 'application/json' } })
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [elevatorId])

  const fmt = (v: number | string | null | undefined) =>
    v !== null && v !== undefined ? String(v) : '—'

  const price = (v: number | string) =>
    Number(v).toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })

  const Row = ({ label, value }: { label: string; value: string }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: 14 }}>
      <span style={{ color: '#888' }}>{label}</span>
      <span style={{ fontWeight: 500, color: '#1a1a1a' }}>{value}</span>
    </div>
  )

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}
    >
      <div
        style={{ background: 'white', borderRadius: 12, padding: 32, maxWidth: 560, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}
        onClick={e => e.stopPropagation()}
      >
        {loading ? (
          <p style={{ textAlign: 'center', color: '#888', padding: '40px 0' }}>{t('general.loading')}...</p>
        ) : !data ? (
          <p style={{ textAlign: 'center', color: '#888', padding: '40px 0' }}>—</p>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
                  {data.manufacturer} {data.model}
                </h2>
                {data.description && <p style={{ fontSize: 13, color: '#888', margin: '4px 0 0' }}>{data.description}</p>}
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#999', lineHeight: 1 }}>×</button>
            </div>

            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#555', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('elevatorDetail.params')}</h3>
            <Row label={t('elevatorDetail.capacity')} value={`${data.capacity} kg`} />
            <Row label={t('elevatorDetail.persons')} value={fmt(data.persons)} />
            <Row label={t('elevatorDetail.speed')} value={`${data.speed} m/s`} />
            {data.drive_type && <Row label={t('elevatorDetail.driveType')} value={fmt(data.drive_type)} />}
            <Row label={t('elevatorDetail.maxStops')} value={fmt(data.max_stops)} />
            {data.base_price && (
              <Row label={t('elevatorDetail.basePrice')} value={Number(data.base_price).toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })} />
            )}

            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#555', margin: '16px 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('elevatorDetail.dimensions')}</h3>
            <Row label={t('elevatorDetail.cabinWidth')} value={`${data.cabin_width} mm`} />
            <Row label={t('elevatorDetail.cabinDepth')} value={`${data.cabin_depth} mm`} />
            <Row label={t('elevatorDetail.cabinHeight')} value={`${data.cabin_height} mm`} />
            {data.shaft_width != null && <Row label={t('elevatorDetail.shaftWidth')} value={`${data.shaft_width} mm`} />}
            {data.shaft_depth != null && <Row label={t('elevatorDetail.shaftDepth')} value={`${data.shaft_depth} mm`} />}
            {data.pit_depth != null && <Row label={t('elevatorDetail.pitDepth')} value={`${data.pit_depth} mm`} />}
            {data.overhead != null && <Row label={t('elevatorDetail.overhead')} value={`${data.overhead} mm`} />}
            {data.lifting_height && <Row label="Wys. podnoszenia" value={`${data.lifting_height} m`} />}

            {(data.standards || data.machine_room || data.door_width || data.door_height || data.door_fire_class ||
              data.shaft_construction || data.shaft_ventilation || data.shaft_temperature ||
              data.installation_type || data.cabin_finish || data.cabin_door_finish || data.landing_door_finish) && (
              <>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: '#555', margin: '16px 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Parametry techniczne</h3>
                {data.standards && <Row label="Normy" value={data.standards} />}
                {data.machine_room && <Row label="Maszynownia" value={data.machine_room} />}
                {data.door_width != null && <Row label="Szer. drzwi" value={`${data.door_width} mm`} />}
                {data.door_height != null && <Row label="Wys. drzwi" value={`${data.door_height} mm`} />}
                {data.door_fire_class && <Row label="Klasa EI drzwi" value={data.door_fire_class} />}
                {data.shaft_construction && <Row label="Konstr. szybu" value={data.shaft_construction} />}
                {data.shaft_ventilation && <Row label="Wentylacja szybu" value={data.shaft_ventilation} />}
                {data.shaft_temperature && <Row label="Temp. w szybie" value={data.shaft_temperature} />}
                {data.installation_type && <Row label="Montaż" value={data.installation_type} />}
                {data.cabin_finish && <Row label="Wystrój kabiny" value={data.cabin_finish} />}
                {data.cabin_door_finish && <Row label="Drzwi kabinowe" value={data.cabin_door_finish} />}
                {data.landing_door_finish && <Row label="Drzwi przystankowe" value={data.landing_door_finish} />}
              </>
            )}
            {data.equipment && (
              <>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: '#555', margin: '16px 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Wyposażenie</h3>
                <p style={{ fontSize: 13, color: '#555', margin: 0, whiteSpace: 'pre-wrap' }}>{data.equipment}</p>
              </>
            )}

            {data.elements.length > 0 && (
              <>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: '#555', margin: '16px 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('elevatorDetail.elements')}</h3>
                {data.elements.map(el => (
                  <div key={el.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: 14 }}>
                    <span style={{ color: '#555' }}><span style={{ fontSize: 11, color: '#aaa', marginRight: 6 }}>{el.category}</span>{el.name}</span>
                    <span style={{ fontWeight: 500, color: '#1a1a1a' }}>{price(el.price)}</span>
                  </div>
                ))}
              </>
            )}

            <button
              onClick={onClose}
              style={{ marginTop: 24, width: '100%', background: '#ffb400', color: '#1a1a1a', border: 'none', borderRadius: 8, padding: '12px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              {t('general.return')}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default ElevatorDetailModal
