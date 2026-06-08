import {useTranslation} from 'react-i18next'
import {CabinColor} from '@/store/mainApi/response'

interface Props {
    items: CabinColor[]
    currentValue: number
    onChange: (id: number) => void
}

const ColorSelector = ({items, currentValue, onChange}: Props) => {
    const {i18n} = useTranslation()

    if (items.length === 0) return null

    return (
        <div className='flex flex-row flex-wrap gap-3'>
            {items.map((color) => {
                const name = i18n.language === 'pl' ? color.name_pl : color.name_en
                const isSelected = color.id === currentValue
                return (
                    <button
                        key={color.id}
                        type='button'
                        onClick={() => onChange(isSelected ? 0 : color.id)}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-colors ${
                            isSelected
                                ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                                : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                        {color.image_url ? (
                            <img
                                src={color.image_url}
                                alt={name}
                                className='w-10 h-10 rounded-md object-cover border border-gray-200 shadow-sm shrink-0'
                            />
                        ) : (
                            <div className='w-10 h-10 rounded-md border border-gray-200 bg-gray-100 shrink-0' />
                        )}
                        <span className='text-[12px] text-gray-600 text-center max-w-[70px] leading-tight'>{name}</span>
                    </button>
                )
            })}
        </div>
    )
}

export default ColorSelector
