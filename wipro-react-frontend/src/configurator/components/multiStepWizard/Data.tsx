import AnimatedPage from '@/components/AnimatedPage'
import AnimatedPageSide from '@/components/AnimatedPageSide'
import FormContent from '@/components/FormContent'
import DataSummary from '@/components/multiStepWizardSummary/DataSummary'
import RadioButtonContainer from '@/components/RadioButtonContainer'
import SubmitButton from '@/components/SubmitButton'
import TextInput from '@/components/TextInput'
import TitleParagraph from '@/components/TitleParagraph'
import { statusData } from '@/constants/formData'
import { RootState, useAppDispatch } from '@/store'
import { fillField } from '@/store/slices/formSlice'
import { useFormStore } from '@/store/zustand/formStore'
import { FormData } from '@/types/multiStepWizard/data'
import { dataSchema } from '@/validators/data'
import { yupResolver } from "@hookform/resolvers/yup"
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router'

const SectionTitle = ({ text }: { text: string }) => (
  <p className="text-[13px] font-semibold text-[var(--grey)] uppercase tracking-wide mt-2 mb-1">{text}</p>
)

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
    control,
  } = useForm<FormData>({
    resolver: yupResolver(dataSchema),
    defaultValues: defaultData
  });

  const onSubmit = (data: FormData) => {
    dispatch(fillField({ key: 'data', value: data }))
    navigate('/shaftParameters');
  }

  return (
    <div className="flex flex-row overflow-hidden max-[1200px]:flex-col max-[1200px]:gap-5">
      <AnimatedPage>
        <FormContent>
          <TitleParagraph text={t('form.data.title')} />
          <form className="p-[10px] flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)}>

            {/* Dane kontaktowe */}
            <SectionTitle text={t('form.data.sections.contact')} />
            <TextInput
              label={t('form.data.fields.name')+'*'}
              value={register('name', { onChange: (e) => updateField('data', 'name', e.target.value) })}
              error={errors.name?.message}
            />
            <TextInput
              label={t('form.data.fields.phoneNumber')+'*'}
              value={register('phoneNumber', { onChange: (e) => updateField('data', 'phoneNumber', e.target.value) })}
              error={errors.phoneNumber?.message}
              inputMode='tel'
            />
            <TextInput
              label={t('form.data.fields.email')+'*'}
              value={register('email', { onChange: (e) => updateField('data', 'email', e.target.value) })}
              error={errors.email?.message}
              inputMode='email'
            />
            <Controller
              control={control}
              name='status'
              render={({ field }) => (
                <RadioButtonContainer
                  items={Object.entries(statusData).map(([key, item]) => ({ id: key, title: item.title }))}
                  selectedId={field.value}
                  onPress={(e) => { updateField('data', 'status', e); field.onChange(e) }}
                  title={t('form.data.fields.status')}
                />
              )}
            />

            {/* Dane firmy */}
            <SectionTitle text={t('form.data.sections.company')} />
            <TextInput
              label={t('form.data.fields.companyName')+'*'}
              value={register('companyName', { onChange: (e) => updateField('data', 'companyName', e.target.value) })}
              error={errors.companyName?.message}
            />
            <TextInput
              label={t('form.data.fields.nip')+'*'}
              value={register('nip', { onChange: (e) => updateField('data', 'nip', e.target.value) })}
              error={errors.nip?.message}
            />

            {/* Adres montażu */}
            <SectionTitle text={t('form.data.sections.installAddress')} />
            <div className="flex gap-5 max-[500px]:flex-col">
              <TextInput
                label={t('form.data.fields.street')+'*'}
                value={register('street', { onChange: (e) => updateField('data', 'street', e.target.value) })}
                error={errors.street?.message}
              />
              <TextInput
                label={t('form.data.fields.postalCode')+'*'}
                value={register('postalCode', { onChange: (e) => updateField('data', 'postalCode', e.target.value) })}
                error={errors.postalCode?.message}
              />
            </div>
            <div className="flex gap-5 max-[500px]:flex-col">
              <TextInput
                label={t('form.data.fields.houseNo')+'*'}
                value={register('houseNo', { onChange: (e) => updateField('data', 'houseNo', e.target.value) })}
                error={errors.houseNo?.message}
              />
              <TextInput
                label={t('form.data.fields.localNo')}
                value={register('localNo', { onChange: (e) => updateField('data', 'localNo', e.target.value) })}
                error={errors.localNo?.message}
              />
            </div>
            <TextInput
              label={t('form.data.fields.city')+'*'}
              value={register('city', { onChange: (e) => updateField('data', 'city', e.target.value) })}
              error={errors.city?.message}
            />

            {/* Pozostałe */}
            <SectionTitle text={t('form.data.sections.other')} />
            <TextInput
              label={t('form.data.fields.investor')}
              value={register('investor', { onChange: (e) => updateField('data', 'investor', e.target.value) })}
              error={errors.investor?.message}
            />
            <TextInput
              label={t('form.data.fields.additionalNotes')}
              value={register('additionalNotes', { onChange: (e) => updateField('data', 'additionalNotes', e.target.value) })}
              error={errors.additionalNotes?.message}
              multiline
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
