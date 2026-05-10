import { useTranslation } from 'react-i18next'
import { CabinModel } from '@/store/mainApi/response'

interface Props {
    item: CabinModel;
    selected: boolean;
    onChange: (id: number) => void;
    onInfo: (item: CabinModel) => void;
    lang: string;
}

const CarouselaItem = ({ item, selected, onChange, onInfo, lang }: Props) => {
    const { t } = useTranslation();
    const name = lang === 'pl' ? item.name_pl : item.name_en;

    return (
        <div className={[
            'relative max-w-full h-auto flex-1 min-w-[140px] border border-[var(--primary)] rounded-[10px] p-[10px] text-center',
            'transition-all duration-300 ease',
            'hover:scale-[1.02] hover:shadow-[0_4px_10px_rgba(0,0,0,0.2)]',
            selected ? 'bg-[#ffb40026]' : '',
        ].join(' ')}>
            <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onInfo(item); }}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[var(--primary)] text-[var(--secondary)] text-xs font-bold flex items-center justify-center cursor-pointer z-10 leading-none"
                title={t('general.details')}
            >
                i
            </button>
            <p className="text-[13px] font-semibold mb-2 pr-6">{name}</p>
            {item.image_url ? (
                <img
                    src={item.image_url}
                    alt={name}
                    className="max-w-full rounded-[10px] mb-[15px] w-full object-cover"
                />
            ) : (
                <div className="w-full h-[120px] rounded-[10px] mb-[15px] bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                    brak zdjęcia
                </div>
            )}
            <div className="flex flex-col">
                <div
                    className="w-full border-none bg-[var(--primary)] py-[7px] rounded-[8px] cursor-pointer text-[13px] font-semibold text-[var(--secondary)]"
                    onClick={() => onChange(item.id)}
                >
                    {t('general.select')}
                </div>
            </div>
        </div>
    )
}

export default CarouselaItem
