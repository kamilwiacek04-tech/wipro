import { images } from '@/constants/images';
import React from 'react'

interface Props {
    image: string;
    checkboxElement?: React.ReactNode;
}

const ImagePreview = ({image, checkboxElement}: Props) => {
  return (
    <div className='imagePreviewContainer'>
        <img 
            src={images[image].image}
            alt={images[image].alt}
            className='imagePreviewImage'
        />
        {checkboxElement}
    </div>
  )
}

export default ImagePreview