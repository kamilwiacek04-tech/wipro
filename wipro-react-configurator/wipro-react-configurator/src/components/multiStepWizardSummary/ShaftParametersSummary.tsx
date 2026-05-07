import { images } from '@/constants/images'
import { RootState } from '@/store'
import { FormData } from '@/types/multiStepWizard/data'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import SummaryRow from '@/components/SummaryRow'
import { summaryShaftParametersItem } from '@/constants/formShaftParameters'
import SubmitButton from '../SubmitButton'
import { useNavigate } from 'react-router'

const ShaftParametersSummary = () => {
  const data: FormData = useSelector((state: RootState) => state.form.data);
  const {t} = useTranslation();
  const textPath = 'form.shaftParameters.summary';
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
          {summaryShaftParametersItem.map((item, key) => (
            <SummaryRow 
              key={key}
              title={t(item.title)}
              value={(item.object ? t(item.object[data[item.value]].title) : data[item.value]) || '-'}
            />
          ))}
        </div>
        <SubmitButton 
          title={t('general.return')}
          className='alignToRight'
          onPress={() => navigate('/data')}
        />
      </div>
    </div>
  )
}

export default ShaftParametersSummary