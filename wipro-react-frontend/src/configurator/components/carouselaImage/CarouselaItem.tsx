import ImageLightbox from '@/components/ImageLightbox';
import { CabinModel } from '@/store/mainApi/response';
import { useTranslation } from 'react-i18next';

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
                'relative w-[160px] shrink-0 border border-[var(--primary)] rounded-[10px] p-[10px] text-center',
                'transition-shadow duration-300',
                'hover:shadow-[0_4px_10px_rgba(0,0,0,0.2)]',
                selected ? 'bg-[#ffb40026]' : '',
            ].join(' ')}>
                <p className="text-[13px] font-semibold mb-2 m-0 text-center">{name}</p>
                {item.image_url ? (
                    <ImageLightbox
                        src={item.image_url}
                        alt={name}
                        className="max-w-full rounded-[10px] mb-[15px] w-full object-cover"
                    />
                ) : (
                    <div className="w-full h-[120px] rounded-[10px] mb-[15px] bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                        brak zdjęcia
                    </div>
                )}
                <div className="flex flex-col gap-1.5">
                    <button
                        type="button"
                        className="w-full border-none bg-[var(--primary)] py-[7px] rounded-[8px] cursor-pointer text-[13px] font-semibold text-[var(--secondary)]"
                        onClick={() => onChange(item.id)}
                    >
                        {t('general.select')}
                    </button>
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onInfo(item); }}
                        className="w-full border-[1.5px] border-[#d8d8d8] bg-transparent py-[6px] rounded-[8px] cursor-pointer text-[12px] text-[var(--grey)] hover:border-[var(--primary)] hover:text-[var(--secondary)] transition-[border-color,color]"
                    >
                        {t('elevatorDetail.details')}
                    </button>
                </div>
            </div>
    )
}

export default CarouselaItem
