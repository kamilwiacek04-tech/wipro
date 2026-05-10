import { PropsWithChildren } from "react"
import ModalProvider from "../modal/ModalProvider"

const BasicLayout = ({children}: PropsWithChildren) => {
  return (
    <ModalProvider>
      <div className="flex w-full h-full justify-center items-center">
        {children}
      </div>
    </ModalProvider>
  )
}

export default BasicLayout
