import { Checkbox } from '@mui/material'
import React from 'react'
import { useTranslation } from 'react-i18next'

interface Props {
    currentValue: boolean;
    onChange: (e: boolean) => void;
    name?: string;
}

const CheckboxElement = ({currentValue, onChange, name}: Props) => {
    const {t} = useTranslation();

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onChange(event.target.checked)
    };

  return (
    <div className='checkboxElement'>
        <Checkbox 
            checked={currentValue} 
            sx={{
                color: '#ffb400',
                '&.Mui-checked': {
                    color: '#ffb400',
                },
            }}
            onChange={handleChange}
        />
        <p>{name ?? t('form.shaftParameters.fields.leftSideMechanic')}</p>
    </div>
  )
}

export default CheckboxElement