import AnimatedPage from '@/components/AnimatedPage'
import FormContent from '@/components/FormContent'
import { useTranslation } from 'react-i18next'
import TextInput from '@/components/TextInput'
import '@/assets/styles/components/multiStepWizard/Data.css'
import { Controller, useForm } from 'react-hook-form'
import { yupResolver } from "@hookform/resolvers/yup";
import { dataSchema } from '@/validators/data'
import { FormData } from '@/types/multiStepWizard/data'
import { useSelector } from 'react-redux'
import { RootState, useAppDispatch } from '@/store'
import { useFormStore } from '@/store/zustand/formStore'
import { fillField } from '@/store/slices/formSlice'
import { useNavigate} from 'react-router'
import SubmitButton from '@/components/SubmitButton'
import TitleParagraph from '@/components/TitleParagraph'
import RadioButtonContainer from '@/components/RadioButtonContainer';
import { statusData } from '@/constants/formData'
import AnimatedPageSide from '@/components/AnimatedPageSide'
import DataSummary from '@/components/multiStepWizardSummary/DataSummary'

const Data = () => {
  const {t} = useTranslation();
  const defaultData: FormData = useSelector((state: RootState) => state.form.data);
  const { updateField } = useFormStore();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    control
  } = useForm<FormData>({
    resolver: yupResolver(dataSchema),
    defaultValues: defaultData
  });

  const onSubmit = (data: FormData) => {
    dispatch(fillField({
      key: 'data',
      value: data
    }))
    console.log(data);
    navigate('/shaftParameters');
  }

  return (
    <div className='bodyContainer'>
      <AnimatedPage>
        <FormContent>
          <TitleParagraph text={t('form.data.title')} />
          <form className='formContent' onSubmit={handleSubmit(onSubmit)}>
            <TextInput 
              label={t('form.data.fields.name')+'*'} 
              value={register('name', {
                onChange: (e) => updateField('data', 'name', e.target.value)
              })}
              error={errors.name?.message}  
            />
            <TextInput 
              label={t('form.data.fields.phoneNumber')+'*'} 
              value={register('phoneNumber', {
                onChange: (e) => updateField('data', 'phoneNumber', e.target.value)
              })}
              error={errors.phoneNumber?.message}
              inputMode={'tel'}
            />
            <TextInput 
              label={t('form.data.fields.email')+'*'} 
              value={register('email', {
                onChange: (e) => updateField('data', 'email', e.target.value)
              })}
              error={errors.email?.message}
              inputMode={'email'}
            />
            <Controller
              control={control}
              name='status'
              render={({ field }) => (
                <RadioButtonContainer 
                  items={Object.entries(statusData).map(([key, item]) => ({
                    id: key,
                    title: item.title
                  }))}
                  selectedId={field.value}
                  onPress={(e) => {
                    updateField('data', 'status', e);
                    field.onChange(e)
                  }}
                  title={t('form.data.fields.status')}
                />
              )}
            />
            <div className='doubleTextInput'>
              <TextInput 
                label={t('form.data.fields.street')+'*'} 
                value={register('street', {
                  onChange: (e) => updateField('data', 'street', e.target.value)
                })}
                error={errors.street?.message}  
              />
              <TextInput 
                label={t('form.data.fields.postalCode')+'*'} 
                value={register('postalCode', {
                  onChange: (e) => updateField('data', 'postalCode', e.target.value)
                })}
                error={errors.postalCode?.message}  
              />
            </div>
            <div className='doubleTextInput'>
              <TextInput 
                label={t('form.data.fields.houseNo')+'*'} 
                value={register('houseNo', {
                  onChange: (e) => updateField('data', 'houseNo', e.target.value)
                })}
                error={errors.houseNo?.message}  
              />
              <TextInput 
                label={t('form.data.fields.localNo')} 
                value={register('localNo', {
                  onChange: (e) => updateField('data', 'localNo', e.target.value)
                })}
                error={errors.localNo?.message}  
              />
            </div>
            <TextInput 
              label={t('form.data.fields.city')+'*'} 
              value={register('city', {
                onChange: (e) => updateField('data', 'city', e.target.value)
              })}
              error={errors.city?.message}  
            />
            <TextInput 
              label={t('form.data.fields.investor')} 
              value={register('investor', {
                onChange: (e) => updateField('data', 'investor', e.target.value)
              })}
              error={errors.investor?.message}  
            />
            <SubmitButton title={t('form.goNext')} />
          </form>
        </FormContent>
      </AnimatedPage>
      <AnimatedPageSide>
        <DataSummary />
      </AnimatedPageSide>
    </div>
  )
}

export default Data