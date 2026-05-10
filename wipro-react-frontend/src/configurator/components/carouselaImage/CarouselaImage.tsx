import { CabinModel } from '@/store/mainApi/response'
import CarouselaItem from './CarouselaItem'

interface Props {
    items: CabinModel[];
    currentValue: number;
    onChange: (id: number) => void;
    onInfo: (item: CabinModel) => void;
    lang: string;
}

const CarouselaImage = ({ items, currentValue, onChange, onInfo, lang }: Props) => {
    return (
        <div className="conf-scroll overflow-x-auto pb-2">
            <div className="flex flex-row gap-[10px] min-w-max">
                {items.map((item) => (
                    <CarouselaItem
                        key={item.id}
                        item={item}
                        selected={currentValue === item.id}
                        onChange={onChange}
                        onInfo={onInfo}
                        lang={lang}
                    />
                ))}
            </div>
        </div>
    )
}

export default CarouselaImage
