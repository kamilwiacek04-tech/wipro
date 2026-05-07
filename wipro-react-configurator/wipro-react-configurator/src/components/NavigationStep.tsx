import { navigation } from '@/constants/navigation';
import React from 'react'
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

interface Props {
    step: string;
    current?: string;
    currentStep: number;
}

const NavigationStep = ({step, current, currentStep}: Props) => {
    const {t} = useTranslation();
    const isCurrent = current === step;
    const isPressable = navigation.steps.slice(0, navigation.steps.findIndex((e) => e === current)+1).includes(step);
    const navigate = useNavigate();

  return (
    <div className={`navigationStep ${isCurrent && 'navigationStepActive'} ${isPressable && 'navigationStepPressable'}`} onClick={() => {isPressable ? navigate(`/${step}`) : undefined}}>
        <p className={`navigationStepText ${isCurrent && 'navigationStepTextActive'}`}>
            {t(`navigation.step`, { step: currentStep, title: t(`navigation.steps.${step}`)})}
        </p>
    </div>
  )
}

export default NavigationStep