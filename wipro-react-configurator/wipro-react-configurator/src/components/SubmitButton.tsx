import React from 'react'
import '@/assets/styles/components/SubmitButton.css'

interface Props {
    title: string;
    onPress?: (data: any) => void;
    className?: string;
}

const SubmitButton = ({title, onPress, className}: Props) => {
  return (
    <button className={`submitButton ${className}`} type='submit' onClick={onPress}>{title}</button>
  )
}

export default SubmitButton