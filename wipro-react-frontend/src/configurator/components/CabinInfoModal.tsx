import { CabinModel } from '@/store/mainApi/response'
import { useTranslation } from 'react-i18next'

interface Props {
    item: CabinModel;
    onClose: () => void;
}

const CabinInfoModal = ({ item, onClose }: Props) => {
    const { i18n } = useTranslation()
    const name = i18n.language === 'pl' ? item.name_pl : item.name_en

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-[16px] max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="bg-[var(--secondary)] rounded-t-[16px] px-5 py-4 flex items-center justify-between">
                    <p className="m-0 text-white font-bold text-[15px] uppercase tracking-wide">{name}</p>
                    <button
                        onClick={onClose}
                        className="text-white text-xl leading-none cursor-pointer opacity-80 hover:opacity-100"
                    >
                        ×
                    </button>
                </div>

                {item.image_url && (
                    <img
                        src={item.image_url}
                        alt={name}
                        className="w-full object-cover"
                    />
                )}

                {item.details && item.details.length > 0 && (
                    <div className="px-5 py-4">
                        {item.details.map((row, i) => (
                            <div
                                key={i}
                                className="flex justify-between py-[6px] border-b border-gray-100 text-[14px] last:border-0"
                            >
                                <span className="font-semibold text-[var(--secondary)]">{row.label}:</span>
                                <span className="text-[var(--grey)] text-right ml-4">{row.value}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default CabinInfoModal
