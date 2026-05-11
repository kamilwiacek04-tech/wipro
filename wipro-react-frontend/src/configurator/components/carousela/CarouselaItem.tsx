import { Elevator } from '@/types/mainApi/response';
import { useTranslation } from 'react-i18next';

interface Props {
    item: Elevator;
    currentValue?: number;
    onChange?: (e: number) => void;
    onDetails?: (id: number) => void;
}

const CarouselaItem = ({item, currentValue, onChange, onDetails}: Props) => {
  const {t} = useTranslation();
  const isSelected = currentValue === item.id;

  return (
    <div
      className={[
        'flex flex-col items-center flex-[0_0_170px] w-[170px] border-2 border-[#e4e4e4] rounded-[14px] overflow-hidden cursor-pointer bg-white',
        'transition-[border-color,box-shadow,transform] duration-200 ease select-none',
        'hover:border-[var(--primary)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.09)] hover:-translate-y-0.5',
        'min-[1600px]:flex-[0_0_200px] min-[1600px]:w-[200px]',
        'min-[2000px]:flex-[0_0_220px] min-[2000px]:w-[220px]',
        'max-[500px]:flex-[0_0_140px] max-[500px]:w-[140px]',
        isSelected ? 'border-[var(--primary)] bg-[#ffb40015] shadow-[0_0_0_3px_#ffb40040]' : '',
      ].join(' ')}
      onClick={() => onChange?.(item.id)}
    >
      <div className="flex flex-col items-center gap-1 pt-[14px] pb-[10px] px-3 w-full">
        <span className="text-[28px] leading-none">🛗</span>
        <p className="text-[13px] font-bold text-[var(--secondary)] m-0 text-center leading-tight">{item.manufacturer} {item.model}</p>
        {isSelected && (
          <span className="inline-flex items-center justify-center w-[18px] h-[18px] bg-[var(--primary)] text-[var(--secondary)] rounded-full text-[11px] font-bold mt-0.5">✓</span>
        )}
      </div>

      <div className="flex flex-col w-full border-t border-[#f0f0f0] flex-1">
        <div className="flex justify-between items-center py-[5px] px-3 border-b border-[#f5f5f5]">
          <span className="text-[11px] text-[var(--grey)]">{t('elevatorDetail.capacity')}</span>
          <span className="text-[12px] font-semibold text-[var(--secondary)]">{item.udzwig} kg</span>
        </div>
        <div className="flex justify-between items-center py-[5px] px-3 border-b border-[#f5f5f5]">
          <span className="text-[11px] text-[var(--grey)]">{t('form.shaftParameters.carousel.numberOfPassengers')}</span>
          <span className="text-[12px] font-semibold text-[var(--secondary)]">{item.liczbaPasazerow}</span>
        </div>
        <div className="flex justify-between items-center py-[5px] px-3">
          <span className="text-[11px] text-[var(--grey)]">{t('form.shaftParameters.carousel.speed')}</span>
          <span className="text-[12px] font-semibold text-[var(--secondary)]">{item.predkosc} m/s</span>
        </div>
      </div>

      <div className="flex flex-col gap-[5px] py-2 px-[10px] w-full">
        <button
          className="w-full border-none bg-[var(--primary)] py-[7px] rounded-[8px] cursor-pointer text-[13px] font-semibold text-[var(--secondary)] hover:opacity-80 transition-opacity"
          onClick={(e) => { e.stopPropagation(); onChange?.(item.id); }}
        >
          {t('general.select')}
        </button>
        {onDetails && (
          <button
            className="w-full border-[1.5px] border-[#d8d8d8] bg-transparent py-[6px] rounded-[8px] cursor-pointer text-[12px] text-[var(--grey)] hover:border-[var(--primary)] hover:text-[var(--secondary)] transition-[border-color,color]"
            onClick={(e) => { e.stopPropagation(); onDetails(item.id); }}
          >
            {t('elevatorDetail.details')}
          </button>
        )}
      </div>
    </div>
  )
}

export default CarouselaItem
