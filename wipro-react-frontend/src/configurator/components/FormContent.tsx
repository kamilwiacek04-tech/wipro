import { PropsWithChildren } from 'react'

const FormContent = ({children}: PropsWithChildren) => {
  return (
    <div className="shadow-[0_4px_10px_rgba(0,0,0,0.1)] p-5 rounded-[10px]">{children}</div>
  )
}

export default FormContent
