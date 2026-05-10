import { navigation } from '@/constants/navigation';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

interface Props {
    step: string;
    current?: string;
    currentStep: number;
}

const clipPaths = {
  default: 'polygon(5% 0%, 93% 0%, 100% 50%, 93% 100%, 5% 100%, 10% 50%)',
  first: 'polygon(0% 0%, 93% 0%, 100% 50%, 93% 100%, 0% 100%, 0% 50%)',
  last: 'polygon(5% 0%, 100% 0%, 100% 50%, 100% 100%, 5% 100%, 10% 50%)',
}

const NavigationStep = ({step, current, currentStep}: Props) => {
    const {t} = useTranslation();
    const isCurrent = current === step;
    const steps = navigation.steps;
    const index = steps.indexOf(step);
    const isPressable = steps.slice(0, steps.findIndex((e) => e === current)+1).includes(step);
    const navigate = useNavigate();

    const clipPath = index === 0 ? clipPaths.first : index === steps.length - 1 ? clipPaths.last : clipPaths.default;

  return (
    <div
      className={[
        'conf-nav-step',
        'flex-1 flex justify-center items-center px-[18px] py-0',
        isCurrent ? 'bg-[var(--primary)] transition-all duration-1000 ease' : '',
        isPressable ? 'cursor-pointer' : '',
      ].join(' ')}
      style={{ clipPath }}
      onClick={() => isPressable ? navigate(`/${step}`) : undefined}
    >
        <p className={`text-center text-[14px] font-semibold ${isCurrent ? 'text-[var(--black)] font-bold' : 'text-white'}`}>
            {t(`navigation.step`, { step: currentStep, title: t(`navigation.steps.${step}`)})}
        </p>
    </div>
  )
}

export default NavigationStep
