import { useTranslation } from 'react-i18next';

interface Props {
    item: {
        id: string;
        title: string;
    };
    isSelected: boolean;
    onPress: (e: string) => void;
}

const RadioButton = ({item, isSelected, onPress}: Props) => {
    const {t} = useTranslation();

  return (
    <div
      className={[
        'border-[0.5px] border-[var(--primary)] rounded-[10px] flex-1 px-[10px] py-0 text-center cursor-pointer',
        'transition-all duration-[250ms] ease-in-out flex items-center justify-center',
        isSelected ? 'bg-[#ffb40026]' : '',
      ].join(' ')}
      onClick={() => onPress(item.id)}
    >
        <p>{t(item.title)}</p>
    </div>
  )
}

export default RadioButton
