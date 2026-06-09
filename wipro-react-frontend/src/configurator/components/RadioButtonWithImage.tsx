import RadioButtonContainer from '@/components/RadioButtonContainer'
import {useTranslation} from 'react-i18next'
import ImagePreview from '@/components/ImagePreview'
import {CabinType} from '@/store/mainApi/response'

interface Props {
    items: CabinType[];
    currentValue: string;
    onChange: (e: string) => void;
    checkboxElement?: React.ReactNode;
    leftMechanic?: boolean;
}

const RadioButtonWithImage = ({items, currentValue, onChange, checkboxElement, leftMechanic}: Props) => {
    const {i18n, t} = useTranslation()

    const current = items.find(item => item.key === currentValue)
    const imageUrl = current
        ? (leftMechanic
            ? (current.image_left_url ?? current.image_right_url ?? '')
            : (current.image_right_url ?? ''))
        : ''

    const radioItems = items.map(item => ({
        id: item.key,
        title: i18n.language === 'pl' ? item.name_pl : item.name_en,
    }))

    return (
        <div>
            <RadioButtonContainer
                items={radioItems}
                selectedId={currentValue}
                onPress={(e) => onChange(e)}
                title={t('form.shaftParameters.fields.accessDiagram')}
                columnDirection
            >
                <ImagePreview
                    image={imageUrl}
                    checkboxElement={checkboxElement}
                />
            </RadioButtonContainer>
        </div>
    )
}

export default RadioButtonWithImage
