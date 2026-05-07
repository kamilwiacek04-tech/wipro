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
      className={`carouselaItemContainer${isSelected ? ' carouselaItemContainerSelected' : ''}`}
      onClick={() => onChange(item.id)}
    >
      <div className="carouselaItemIconWrap">
        <span className="carouselaItemIcon">🛗</span>
        <p className="carouselaItemCapacity">{item.udzwig} kg</p>
        {isSelected && <span className="carouselaItemSelectedBadge">✓</span>}
      </div>

      <div className="carouselaItemStats">
        <div className="carouselaItemStat">
          <span className="carouselaItemStatLabel">{t('form.shaftParameters.carousel.numberOfPassengers')}</span>
          <span className="carouselaItemStatValue">{item.liczbaPasazerow}</span>
        </div>
        <div className="carouselaItemStat">
          <span className="carouselaItemStatLabel">{t('form.shaftParameters.carousel.speed')}</span>
          <span className="carouselaItemStatValue">{item.predkosc} m/s</span>
        </div>
      </div>

      <div className='carouselaItemButtonContainer'>
        <button
          className='carouselaItemButton'
          onClick={(e) => { e.stopPropagation(); onChange(item.id); }}
        >
          {t('general.select')}
        </button>
        {onDetails && (
          <button
            className='carouselaItemButtonOutlined'
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
