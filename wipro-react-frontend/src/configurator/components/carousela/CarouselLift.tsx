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
    <div className="flex flex-col w-full mt-[10px] mb-1 min-w-0">
        {isFetching ? (
            <div className="flex justify-center py-6">
                <Loading />
            </div>
        ) : (
            <div className="conf-scroll w-full overflow-x-auto pb-3 min-[1600px]:pb-4">
                <div className="inline-flex flex-row gap-3 py-1 px-0.5">
                    {items?.map((item, key) => (
                        <CarouselaItem key={'CarouselaItem_'+key} item={item} currentValue={currentValue} onChange={onChange} onDetails={onDetails} />
                    ))}
                </div>
            </div>
        )}
        <p className="text-[14px] mt-1 text-[var(--red)]">{t(error ?? '')}</p>
    </div>
  )
}

export default CarouselLift
