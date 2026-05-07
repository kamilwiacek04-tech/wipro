import React, { useEffect, useState } from 'react'
import '@/assets/styles/components/TextInput.css'
import { useTranslation } from 'react-i18next';
import { images } from '@/constants/images';

interface Props {
    label: string;
    error?: string;
    value?: any;
    inputMode?: 'text' | 'number' | 'email' | 'tel';
}

const TextInput = ({label, error, value, inputMode}: Props) => {
    const {t} = useTranslation();
    const [showIcon, setShowIcon] = useState<boolean>(false);
    const inputId = `text-input-${label.replace(/\s+/g, '-')}`;

    let errorMassage = '';
    if(error) {
        if(error.includes('|')) {
            const [key, value] = error.split('|');
            errorMassage = t(key, {number: value})
        } else {
            errorMassage = t(error)
        }
    }

    useEffect(() => {
      if(!showIcon && error) setShowIcon(true);
    }, [showIcon, error])

  return (
    <div className='textInputContainer'>
        <input id={inputId} className={`textInputContent ${error && 'textInputContentError'}`} type={inputMode || 'text'} placeholder=' ' {...value} />
        <label className='labelContainer' htmlFor={inputId}>{label}</label>
        {showIcon && (
            <img src={error ? images.error.image : images.inputPass.image} alt={error ? images.error.alt : images.inputPass.alt} className='inputIcon' />
        )}
        <p className='textInputError'>{errorMassage}</p>
    </div>
  )
}

export default TextInput