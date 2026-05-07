import React from 'react'
import '@/assets/styles/components/NumberInput.css'
import { Slider } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useFormStore } from '@/store/zustand/formStore';

interface Props {
    title: string;
    currentValue: number;
    range: {
        min: number;
        max: number;
        dependOn?: {
            path: string;
            field: string;
        },
        dependsOn?: {
            main: {
                path: string;
                field: string;
            }
            second: {
                path: string;
                field: string;
            }
        }
    },
    onChange: (e: number) => void;
    error?: string;
}

const NumberInput = ({title, currentValue, range, onChange, error}: Props) => {
    const {t} = useTranslation();

    const handleSliderChange = (event: Event, newValue: number) => {
        onChange(newValue)
    };

    const formState = useFormStore.getState().store

    let errorMassage = '';
    if(error) {
        if(error.includes('|')) {
            const [key, value] = error.split('|');
            errorMassage = t(key, {number: value})
        } else {
            errorMassage = t(error)
        }
    }

  return (
    <div className='numberInputContainer'>
        <p className='numberInputText'>{title}</p>
        <div className='inputContainer'>
            <Slider 
                min={range.min} 
                max={range.dependOn ? (
                    formState[range.dependOn.path]?.[range.dependOn.field]*2
                ) : (range.dependsOn ? (
                    formState[range.dependsOn.main.path]?.[range.dependsOn.main.field]-formState[range.dependsOn.second.path]?.[range.dependsOn.second.field]
                ) : range.max)} 
                value={currentValue}
                onChange={handleSliderChange}
                valueLabelDisplay="auto"
                sx={{
                    color: "var(--primary)",
                }}
            />
            <input 
                className='inputText'
                type='number'
                min={range.min}
                max={range.dependOn ? (
                    formState[range.dependOn.path]?.[range.dependOn.field]*2
                ) : (range.dependsOn ? (
                    formState[range.dependsOn.main.path]?.[range.dependsOn.main.field]-formState[range.dependsOn.second.path]?.[range.dependsOn.second.field]
                ) : range.max)}  
                value={currentValue}
                onChange={(e) => onChange(parseInt(e.target.value))}
            />
        </div>
        <p className='inputNumberError'>{errorMassage}</p>
    </div>
  )
}

export default NumberInput