import { PropsWithChildren } from 'react'

interface Props {
    isError?: boolean;
}

const ParagrapheText = ({children, isError = false}: PropsWithChildren<Props>) => {
  return (
    <div className={`text-center ${isError ? 'text-[var(--red)]' : ''}`}>
        <p>{children}</p>
    </div>
  )
}

export default ParagrapheText
