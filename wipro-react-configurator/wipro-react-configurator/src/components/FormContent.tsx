import React, { PropsWithChildren } from 'react'
import '@/assets/styles/components/FormContent.css'

const FormContent = ({children}: PropsWithChildren) => {
  return (
    <div className='formContainer'>{children}</div>
  )
}

export default FormContent