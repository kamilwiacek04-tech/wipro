import CarouselaItem from './CarouselaItem'

interface Props {
    items: {
        image: {
            image: any,
            alt: string
        },
        value: string,
        title: string
    }[],
    currentValue: string;
    onChange: (e: string) => void;
}

const CarouselaImage = ({items, currentValue, onChange}: Props) => {
  return (
    <div className='carouselItemContainer'>
      {items.map((item, key) => (
        <CarouselaItem 
          key={`Item_${key}_${item.value}`}
          item={item}
          selected={currentValue===item.value}
          onChange={onChange}
        />
      ))}
    </div>
  )
}

export default CarouselaImage