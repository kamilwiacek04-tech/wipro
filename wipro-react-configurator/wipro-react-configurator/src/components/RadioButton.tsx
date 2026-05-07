import React from 'react'
import '@/assets/styles/components/RadioButton.css'
import { useTranslation } from 'react-i18next';

interface Props {
    item: {
        id: string;
        title: string;
    };
    isSelected: boolean;
    onPress: (e: string) => void;
}

const RadioButton = ({item, isSelected, onPress}: Props) => {
    const {t} = useTranslation();

  return (
    <div 
        className={`radioButtonItem ${isSelected && 'radioButtonItemSelected'}`}
        onClick={() => onPress(item.id)}    
    >
        <p>{t(item.title)}</p>
    </div>
  )
}

export default RadioButton