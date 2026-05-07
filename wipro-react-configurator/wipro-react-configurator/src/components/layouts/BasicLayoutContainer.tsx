import { images } from '@/constants/images'
import React, { PropsWithChildren } from 'react'
import '@/assets/styles/layouts/BasicLayoutContainer.css'
import Footer from '@/components/Footer'

const BasicLayoutContainer = ({children}: PropsWithChildren) => {
  return (
    <div className='layoutContainer'>
        <img 
            src={images.logo.image}
            alt={images.logo.alt}
        />
        <div className='fullParentSize mainContainer'>
          {children}
        </div>
        <Footer />
    </div>
  )
}

export default BasicLayoutContainer