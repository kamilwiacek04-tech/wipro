import React, { PropsWithChildren } from 'react'
import '@/assets/styles/components/ParagrapheText.css'

interface Props {
    isError?: boolean;
}

const ParagrapheText = ({children, isError = false}: PropsWithChildren<Props>) => {
  return (
    <div className={`paragrapheContainer ${isError && 'paragrapheContainerError'}`}>
        <p>{children}</p>
    </div>
  )
}

export default ParagrapheText