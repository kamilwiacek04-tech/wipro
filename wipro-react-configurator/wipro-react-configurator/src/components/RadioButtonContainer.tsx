import RadioButton from '@/components/RadioButton';
import '@/assets/styles/components/RadioButton.css'
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
}

const RadioButtonContainer = ({children, items, selectedId, onPress, title, columnDirection=false}: PropsWithChildren<Props>) => {
  return (
    <div className='radioButtonContainer'>
      {title && <p className='radioButtonLabel'>{title}</p>}
      <div className={`radioButtonItemContainer ${columnDirection && 'radioButtonItemContainerColumn'}`}>
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