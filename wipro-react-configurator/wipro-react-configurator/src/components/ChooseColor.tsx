import { ManufactureOfDoorsType } from '@/types/multiStepWizard/finishesAndAccessories';
import '@/assets/styles/components/ChooseColor.css'
import { manufactureOfDoors } from '@/constants/finishesAndAccessories';
import { images } from '@/constants/images';
import { useTranslation } from 'react-i18next';

interface Props {
    currentValue: ManufactureOfDoorsType;
    name: string;
    onChange: (e: ManufactureOfDoorsType) => void
}

const ChooseColor = ({currentValue, name, onChange}: Props) => {
    const styleRoute = 'chooseColorView';
    const textPath = 'form.finishesAndAccessories.manufactureOfDoors'
    const {t} = useTranslation();

  return (
    <div className={`${styleRoute}Container`}>
        <p className={`${styleRoute}Label`}>{name}</p>
        <div className={`${styleRoute}ColorContainer`}>
            {manufactureOfDoors.map((item, key) => (
                <div 
                    key={`${key}_ChooseImage_${name}`}
                    className={`${styleRoute}ColorItem ${currentValue===item.value && styleRoute+'ColorItemSelected'}`}
                    onClick={() => onChange(item.value)}
                >
                    <p className={`${styleRoute}Text`}>{t(`${textPath}.${item.value}`)}</p>
                    {item.color ? (
                        <div className={`${styleRoute}Color`} style={{backgroundColor: item.color}}/>
                    ) : (
                        <img className={`${styleRoute}Color`} src={images[item.image].image} alt={images[item.image].alt} />
                    )}
                </div>
            ))}
        </div>
    </div>
  )
}

export default ChooseColor