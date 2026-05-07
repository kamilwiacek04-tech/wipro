import React from 'react'
import '@/assets/styles/components/Loading.css'
import { useTranslation } from 'react-i18next'

const Loading = () => {
  const {t} = useTranslation();
  return (
    <div className='loadingContainer'>
        <div className='loadingChild' />
    </div>
  )
}

export default Loading