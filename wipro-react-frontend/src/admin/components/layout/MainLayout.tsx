import type { PropsWithChildren, ReactElement } from 'react'

interface Props {
  headerComponent?: ReactElement
  className?: string
}

const MainLayout = ({ children, headerComponent, className }: PropsWithChildren<Props>) => {
  return (
    <div className={`flex flex-col flex-1 gap-6 ${className ?? ''}`}>
      {headerComponent}
      {children}
    </div>
  )
}

export default MainLayout
