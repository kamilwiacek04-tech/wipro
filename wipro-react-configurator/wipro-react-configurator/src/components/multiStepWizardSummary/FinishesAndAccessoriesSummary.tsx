import '@/assets/styles/components/multiStepWizard/ShaftParameters.css'
import { images } from '@/constants/images';
import { RootState } from '@/store';
import { FormShaftParameters } from '@/types/multiStepWizard/shaftParameters';
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux';
import SummaryRow from '@/components/SummaryRow';
import SubmitButton from '@/components/SubmitButton';
import { useNavigate } from 'react-router';
import { summaryFinishesAndAccessories } from '@/constants/finishesAndAccessories';

const FinishesAndAccessoriesSummary = () => {
    const {t} = useTranslation();
    const textPath = 'form.shaftParameters.summary';
    const data: FormShaftParameters = useSelector((state: RootState) => state.form.shaftParameters)
    const navigate = useNavigate();

  return (
    <div className='shaftParametersSummaryMainContainer'>
        <div className='shaftParametersSummaryContainer'>
            <h2 className='shaftParametersSummaryHeader'>
            {t(`${textPath}.title`)}
            </h2>
            <img 
              src={images.yellowArrow.image}
              alt={images.yellowArrow.alt}
              className='shaftParametersSummaryImage'
            />
            <div className='shaftParametersSummaryContent'>
              {summaryFinishesAndAccessories.map((item, key) => (
                <SummaryRow
                  key={key}
                  title={t(item.title)}
                  value={(item.object ? t(item.object[data[item.value]].title) : (typeof data[item.value] === 'boolean' ? (data[item.value] ? 'TAK' : 'NIE') : data[item.value])) || '-'}
                />
              ))}
            </div>
            <SubmitButton
              title={t('general.return')}
              className='alignToRight'
              onPress={() => navigate('/shaftParameters')}
            />
        </div>
    </div>
  )
}

export default FinishesAndAccessoriesSummary