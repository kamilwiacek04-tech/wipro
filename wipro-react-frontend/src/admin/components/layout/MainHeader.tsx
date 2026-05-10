import type { PropsWithChildren, ReactNode } from 'react'

interface Props {
  title?: string
  subTitle?: ReactNode
}

const MainHeader = ({ children, title, subTitle }: PropsWithChildren<Props>) => {
  return (
    <div className="flex items-center justify-between flex-col gap-4 md:flex-row md:gap-0">
      <div>
        {title && <h1 className="text-gray-900 text-2xl lg:text-3xl xl:text-4xl font-semibold mb-1">{title}</h1>}
        {subTitle && <p className="text-gray-500 text-sm lg:text-base">{subTitle}</p>}
      </div>
      {children}
    </div>
  )
}

export default MainHeader
