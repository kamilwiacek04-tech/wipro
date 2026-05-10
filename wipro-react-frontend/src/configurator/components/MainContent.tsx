import { PropsWithChildren } from 'react'

const MainContent = ({children}: PropsWithChildren) => {
  return (
    <div className="w-full min-w-0 flex flex-row overflow-hidden max-[600px]:p-0 max-[1200px]:flex-col max-[1200px]:gap-5">
      {children}
    </div>
  )
}

export default MainContent
