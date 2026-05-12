import { CabinModel } from '@/store/mainApi/response'
import { useTranslation } from 'react-i18next'

interface Props {
    item: CabinModel;
    onClose: () => void;
}

const CabinInfoModal = ({ item, onClose }: Props) => {
    const { i18n, t } = useTranslation()
    const name = i18n.language === 'pl' ? item.name_pl : item.name_en

    return (
        <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
            onClick={onClose}
        >
            <div
                style={{ background: 'white', borderRadius: 12, padding: 32, maxWidth: 560, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                    <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>{name}</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#999', lineHeight: 1 }}>×</button>
                </div>

                {item.image_url && (
                    <img
                        src={item.image_url}
                        alt={name}
                        style={{ width: '100%', borderRadius: 8, marginBottom: 20, objectFit: 'cover' }}
                    />
                )}

                {item.details && item.details.length > 0 && (
                    <>
                        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#555', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {t('general.details')}
                        </h3>
                        {item.details.map((row, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: 14 }}>
                                <span style={{ color: '#888' }}>{row.label}</span>
                                <span style={{ fontWeight: 500, color: '#1a1a1a' }}>{row.value}</span>
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
            </div>
        </div>
    )
}

export default CabinInfoModal
