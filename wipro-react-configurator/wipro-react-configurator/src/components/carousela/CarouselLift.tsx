import '@/assets/styles/components/CarouselLift.css'
import Loading from '@/components/Loading';
import { Elevator } from '@/types/mainApi/response';
import CarouselaItem from '@/components/carousela/CarouselaItem';
import { useTranslation } from 'react-i18next';

interface Props {
    isFetching: boolean;
    items?: Elevator[];
    error?: string;
    currentValue?: number;
    onChange?: (e: number) => void;
    onDetails?: (id: number) => void;
}

const CarouselLift = ({isFetching, items, error, currentValue, onChange, onDetails}: Props) => {
    const {t} = useTranslation();

  return (
    <div className='carouselContainer'>
        {isFetching ? (
            <Loading />
        ) : (
            <div className="elevatorScrollWrapper">
                <div className="elevatorGrid">
                    {items.map((item, key) => (
                        <CarouselaItem key={'CarouselaItem_'+key} item={item} currentValue={currentValue} onChange={onChange} onDetails={onDetails} />
                    ))}
                </div>
            </div>
        )}
        <p className='textInputError'>{t(error)}</p>
    </div>
  )
}

export default CarouselLift
