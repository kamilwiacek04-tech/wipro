import React, { PropsWithChildren } from "react"
import '@/assets/styles/layouts/BasicLayout.css'
import ModalProvider from "../modal/ModalProvider"

const BasicLayout = ({children}: PropsWithChildren) => {
  return (
    <ModalProvider>
      <div className="container">
        {children}
      </div>
    </ModalProvider>
  )
}

export default BasicLayout