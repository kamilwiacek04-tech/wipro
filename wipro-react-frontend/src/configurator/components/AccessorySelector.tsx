import ImageLightbox from '@/components/ImageLightbox'
import { CabinAccessory } from '@/store/mainApi/response'
import { useTranslation } from 'react-i18next'

interface Props {
    title: string;
    items: CabinAccessory[];
    currentValue: number;
    onChange: (id: number) => void;
}

const AccessorySelector = ({ title, items, currentValue, onChange }: Props) => {
    const { i18n, t } = useTranslation()

    if (items.length === 0) return null

    return (
        <div className="flex flex-col gap-2">
            <p className="m-0 text-[var(--grey)] font-semibold text-[15px]">{title}</p>
            <div className="conf-scroll overflow-x-auto pb-2">
                <div className="flex flex-row gap-3 min-w-max">
                    {items.map((item) => {
                        const name = i18n.language === 'pl' ? item.name_pl : item.name_en
                        const selected = currentValue === item.id
                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => onChange(selected ? 0 : item.id)}
                                className={[
                                    'flex flex-col items-center gap-2 p-3 rounded-[10px] border transition-all duration-200 cursor-pointer min-w-[120px] max-w-[150px]',
                                    selected
                                        ? 'border-[var(--primary)] bg-[#ffb40026]'
                                        : 'border-[var(--greyOpacity)] hover:border-[var(--primary)] hover:bg-[#ffb4000f]',
                                ].join(' ')}
                            >
                                {item.image_url ? (
                                    <ImageLightbox
                                        src={item.image_url}
                                        alt={name}
                                        className="w-full h-[80px] object-cover rounded-[6px]"
                                    />
                                ) : (
                                    <div className="w-full h-[80px] rounded-[6px] bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                                        {t('general.noImage')}
                                    </div>
                                )}
                                <span className="text-[12px] text-center leading-tight text-[var(--secondary)] font-medium">
                                    {name}
                                </span>
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

export default AccessorySelector
