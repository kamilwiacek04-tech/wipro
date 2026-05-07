import React, { PropsWithChildren } from 'react'
import '@/assets/styles/components/BorderInput.css'

interface Props {
    title?: string;
}

const BorderInput = ({children, title}: PropsWithChildren<Props>) => {
  return (
    <div className='borderComponentContainer'>
        {title && <p className='boderComponentLabel'>{title}</p>}
        {children}
    </div>
  )
}

export default BorderInput