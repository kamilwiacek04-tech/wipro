import React from 'react'
import '@/assets/styles/components/RadioButtonWithImage.css'
import RadioButtonContainer from '@/components/RadioButtonContainer'
import { accessDiagram } from '@/constants/formShaftParameters';
import { useTranslation } from 'react-i18next';
import ImagePreview from '@/components/ImagePreview'
import { AccessDiagramType } from '@/types/multiStepWizard/shaftParameters';

interface Props {
    currentValue: AccessDiagramType;
    onChange: (e: string) => void;
    checkboxElement?: React.ReactNode;
    leftMechanic?: boolean;
}

const RadioButtonWithImage = ({currentValue, onChange, checkboxElement, leftMechanic}: Props) => {
    const stylePath = 'radioButtonWithImage';
    const {t} = useTranslation();

  return (
    <div className={`${stylePath}Container`}>
        <RadioButtonContainer 
            items={Object.entries(accessDiagram).map(([key, item]) => ({
                id: key,
                title: item.title
            }))}
            selectedId={currentValue}
            onPress={(e) => onChange(e)}
            title={t('form.shaftParameters.fields.accessDiagram')}
            columnDirection
        >
            <ImagePreview 
                image={leftMechanic ? accessDiagram[currentValue].imageLeft : accessDiagram[currentValue].image}
                checkboxElement={checkboxElement}
            />
        </RadioButtonContainer>
    </div>
  )
}

export default RadioButtonWithImage