import { PropsWithChildren } from 'react';

interface Props {
    title?: string;
}

const BorderInput = ({children, title}: PropsWithChildren<Props>) => {
  return (
    <div className="border border-[var(--greyOpacity)] p-4 rounded-[10px] relative">
        {title && <p className="text-[var(--grey)] text-[15px] font-semibold absolute -top-2.5 left-[10px] bg-white m-0">{title}</p>}
        {children}
    </div>
  )
}

export default BorderInput
