import React from 'react'
import '@/assets/styles/components/multiStepWizard/Data.css'
import { images } from '@/constants/images'

const DataSummary = () => {
  return (
    <div className='dataSummaryContainer'>
        <img 
            src={images.dataSummary.image} 
            alt={images.dataSummary.alt}
            className='dataSummaryIcon'
        />
    </div>
  )
}

export default DataSummary