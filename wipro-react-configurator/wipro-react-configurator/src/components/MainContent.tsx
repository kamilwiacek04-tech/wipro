import React, { PropsWithChildren } from 'react'
import '@/assets/styles/components/MainContent.css'

const MainContent = ({children}: PropsWithChildren) => {
  return (
    <div  className='mainContent'>{children}</div>
  )
}

export default MainContent