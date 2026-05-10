import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next';
import { images } from '@/constants/images';

interface Props {
    label: string;
    error?: string;
    value?: any;
    inputMode?: 'text' | 'number' | 'email' | 'tel';
    multiline?: boolean;
}

const TextInput = ({label, error, value, inputMode, multiline}: Props) => {
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
    <div className='conf-input-wrap'>
        {multiline ? (
          <textarea
            id={inputId}
            className={`conf-input resize-none overflow-hidden ${error ? 'conf-input-err' : ''}`}
            placeholder=' '
            rows={1}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = el.scrollHeight + 'px';
            }}
            {...value}
          />
        ) : (
          <input
            id={inputId}
            className={`conf-input ${error ? 'conf-input-err' : ''}`}
            type={inputMode || 'text'}
            placeholder=' '
            {...value}
          />
        )}
        <label className='conf-label' htmlFor={inputId}>{label}</label>
        {showIcon && (
            <img
              src={error ? images.error.image : images.inputPass.image}
              alt={error ? images.error.alt : images.inputPass.alt}
              className="w-4 h-4 absolute right-0 top-0"
            />
        )}
        <p className="text-[14px] mt-1 text-[var(--red)]">{errorMassage}</p>
    </div>
  )
}

export default TextInput
