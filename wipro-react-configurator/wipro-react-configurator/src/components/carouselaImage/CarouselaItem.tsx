import React from 'react'
import { useTranslation } from 'react-i18next'

interface Props {
    item: {
        image: {
            image: any,
            alt: string
        },
        value: string,
        title: string
    },
    selected: boolean;
    onChange: (e: string) => void;
}

const CarouselaItem = ({item, selected, onChange}: Props) => {
    const {t} = useTranslation();

  return (
    <div className={`itemCarouselaContainer ${selected && 'carouselaItemContainerSelected'}`}>
        <p className='carouselaImageItemText'>{t(item.title)}</p>
        <img 
            src={item.image.image} 
            alt={item.image.alt} 
            className='itemCarouselaImage'
        />
        <div className='carouselaItemButtonContainer' > 
          <div className='carouselaItemButton' onClick={() => onChange(item.value)}>
            {t('general.select')}
          </div>
        </div>
    </div>
  )
}

export default CarouselaItem