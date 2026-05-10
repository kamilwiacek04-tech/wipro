import RadioButton from '@/components/RadioButton';
import { PropsWithChildren } from 'react';

interface Props {
    items: {
        id: string;
        title: string;
    }[];
    selectedId: string;
    onPress: (e: string) => void;
    title?: string;
    columnDirection?: boolean;
    scrollable?: boolean;
}

const RadioButtonContainer = ({children, items, selectedId, onPress, title, columnDirection=false, scrollable=false}: PropsWithChildren<Props>) => {
  return (
    <div className="flex flex-row mb-3.75 border border-[var(--greyOpacity)] p-4 rounded-[10px] relative gap-[10px]">
      {title && <p className="m-0 text-[var(--grey)] font-semibold text-[15px] absolute -top-3 left-3 bg-white">{title}</p>}
      <div className={
        scrollable
          ? 'conf-scroll flex flex-nowrap gap-5 flex-1 overflow-x-auto pb-1'
          : `flex justify-around flex-wrap gap-5 flex-1 ${columnDirection ? 'flex-col' : ''}`
      }>
        {items.map((item, index) => (
          <RadioButton
            key={index}
            item={item}
            isSelected={item.id===selectedId}
            onPress={(e) => onPress(e)}
          />
        ))}
      </div>
      {children}
    </div>
  )
}

export default RadioButtonContainer
