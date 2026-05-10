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
    <div className="w-full relative overflow-hidden">
      <div className="flex justify-center items-center flex-col gap-6 px-3 w-[80%] max-[1200px]:w-full max-[800px]:w-[85%]">
        <h2 className="text-center mb-0">{t(`${textPath}.title`)}</h2>
        <img
          src={images.yellowArrow.image}
          alt={images.yellowArrow.alt}
          className="absolute h-[50px] -right-5 top-20 rotate-[105deg]"
        />
        <div className="w-full max-[1200px]:w-[90%] max-[800px]:w-[85%] flex flex-col gap-[15px]">
          {summaryShaftParametersItem.map((item, key) => (
            <SummaryRow
              key={key}
              title={t(item.title)}
              value={(item.object ? t((item.object as any)[(data as any)[item.value]]?.title) : (data as any)[item.value]) || '-'}
            />
          ))}
        </div>
        <SubmitButton
          title={t('general.return')}
          className='conf-btn-right'
          onPress={() => navigate('/data')}
        />
      </div>
    </div>
  )
}

export default ShaftParametersSummary
