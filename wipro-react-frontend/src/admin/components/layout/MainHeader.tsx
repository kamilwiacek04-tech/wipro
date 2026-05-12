import type { PropsWithChildren, ReactNode } from 'react'

interface Props {
  title?: string
  subTitle?: ReactNode
}

const MainHeader = ({ children, title, subTitle }: PropsWithChildren<Props>) => {
  return (
    <div className="flex items-start justify-between flex-col gap-4 md:flex-row md:items-center md:gap-0">
      <div className="flex items-start gap-3">
        <div
          className="w-1 rounded-full self-stretch hidden sm:block"
          style={{ background: '#ffb400', minHeight: '32px' }}
        />
        <div>
          {title && (
            <h1 className="text-gray-900 text-2xl lg:text-3xl font-bold tracking-tight mb-0.5 leading-tight">
              {title}
            </h1>
          )}
          {subTitle && (
            <p className="text-gray-400 text-sm font-normal">{subTitle}</p>
          )}
        </div>
      </div>
      {children && (
        <div className="flex items-center gap-2 shrink-0">
          {children}
        </div>
      )}
    </div>
  )
}

export default MainHeader
