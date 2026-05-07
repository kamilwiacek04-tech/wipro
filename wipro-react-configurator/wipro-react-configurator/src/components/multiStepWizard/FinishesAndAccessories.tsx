import AnimatedPage from '@/components/AnimatedPage'
import FormContent from '@/components/FormContent'
import TitleParagraph from '@/components/TitleParagraph'
import { useTranslation } from 'react-i18next'
import AnimatedPageSide from '@/components/AnimatedPageSide'
import FinishesAndAccessoriesSummary from '@/components/multiStepWizardSummary/FinishesAndAccessoriesSummary'
import { Controller, useForm } from 'react-hook-form'
import { FormFinishesAndAccessories } from '@/types/multiStepWizard/finishesAndAccessories'
import { yupResolver } from '@hookform/resolvers/yup'
import { dataSchema } from '@/validators/finishesAndAccessories'
import { useSelector } from 'react-redux'
import { RootState, useAppDispatch, useAppSelector } from '@/store'
import { fillField, formSelectors } from '@/store/slices/formSlice'
import CarouselaImage from '@/components/carouselaImage/CarouselaImage'
import { cabinModel } from '@/constants/finishesAndAccessories'
import '@/assets/styles/components/multiStepWizard/FinishesAndAccessories.css'
import { useFormStore } from '@/store/zustand/formStore'
import BorderInput from '@/components/BorderInput'
import CheckboxElement from '@/components/CheckboxElement'
import ChooseColor from '@/components/ChooseColor'
import SubmitButton from '@/components/SubmitButton'
import { openModal } from '@/store/slices/modalSlice'
import { useStoreQuoteRequestMutation } from '@/store/mainApi/response'
import { useEffect } from 'react'

const FinishesAndAccessories = () => {
  const {t} = useTranslation();
  const textPath = 'form.finishesAndAccessories';
  const defaultData: FormFinishesAndAccessories = useSelector((state: RootState) => state.form.finishesAndAccessories);
  const dispatch = useAppDispatch();
  const { updateField } = useFormStore();
  const [sendData, {data: apiData, isLoading, isSuccess, isError, error}] = useStoreQuoteRequestMutation();

  const formData = useAppSelector(formSelectors.data);
  const shaftParameters = useAppSelector(formSelectors.shaftParameters);

  const {
    formState: { errors },
    control,
    handleSubmit,
    getValues
  } = useForm<FormFinishesAndAccessories>({
    resolver: yupResolver(dataSchema),
    defaultValues: defaultData,
    mode: 'onChange'
  })

  const onSubmit = (dataCurr: FormFinishesAndAccessories) => {
      dispatch(fillField({
        key: 'finishesAndAccessories',
        value: dataCurr
      }))

      const address = [formData.street, formData.houseNo, formData.localNo]
        .filter(Boolean)
        .join(' ');

      sendData({
        investor_name: formData.name,
        investor_email: formData.email,
        investor_phone: formData.phoneNumber || undefined,
        investor_company: formData.investor || undefined,
        investor_address: address || undefined,
        investor_city: formData.city || undefined,
        investment_name: formData.investor || undefined,
        stops: shaftParameters.stopDoorsCount,
        pit_depth: shaftParameters.pitDepth ? parseInt(String(shaftParameters.pitDepth), 10) : undefined,
        overhead: shaftParameters.headroom ? parseInt(String(shaftParameters.headroom), 10) : undefined,
        drive_type: shaftParameters.liftPurpose,
        door_type: shaftParameters.accessDiagram,
        elevator_id: shaftParameters.elevatorId || undefined,
        additional_notes: JSON.stringify({
          liftingHeight: shaftParameters.liftingHeight,
          accessCount: shaftParameters.accessCount,
          ei30DoorsCount: shaftParameters.ei30DoorsCount,
          ei60DoorsCount: shaftParameters.ei60DoorsCount,
          leftSideMechanic: shaftParameters.leftSideMechanic,
          status: formData.status,
          cabinModel: dataCurr.cabinModel,
          manufactureOfDoors: dataCurr.manufactureOfDoors,
          identicalDoors: dataCurr.identicalDoors,
          manufactureOfCabinDoors: dataCurr.manufactureOfCabinDoors,
          energyRecovery: dataCurr.energyRecovery,
          antiVibrationSystems: dataCurr.antiVibrationSystems,
          cabinMonitoringSystem: dataCurr.cabinMonitoringSystem,
          shaftLighting: dataCurr.shaftLighting,
          increaseSpeed: dataCurr.increaseSpeed,
        }),
      });
    }

    useEffect(() => {
      if(!isLoading && isSuccess && !isError) {
        dispatch(openModal({
          type: 'success'
        }));
      }

      if(!isLoading && isError && !isSuccess) {
        dispatch(openModal({
          type: 'error'
        }))
      }
    }, [isLoading, isSuccess, apiData, error, isError])

  return (
    <div className='bodyContainer'>
      <AnimatedPage>
        <FormContent>
          <TitleParagraph text={t(`${textPath}.title`)} />
          <form className='formContainer finishesAndAccessoriesForm' onSubmit={handleSubmit(onSubmit)}>
            <BorderInput
              title={t('form.finishesAndAccessories.field.cabinModel')}
            >
              <Controller 
                control={control}
                name='cabinModel'
                render={({ field }) => (
                  <CarouselaImage 
                    items={cabinModel}
                    currentValue={field.value}
                    onChange={(e) => {
                      updateField('finishesAndAccessories', 'cabinModel', e)
                      field.onChange(e)
                    }}
                  />
                )}
              />
            </BorderInput>
            <BorderInput
              title={t('form.finishesAndAccessories.field.manufactureOfDoors')}
            >
              <Controller 
                control={control}
                name='manufactureOfDoors'
                render={({ field }) => (
                  <ChooseColor 
                    currentValue={field.value}
                    name={t('form.finishesAndAccessories.field.stopDoors')}
                    onChange={(e) => {
                      updateField('finishesAndAccessories', 'manufactureOfDoors', e)
                      field.onChange(e)
                    }}
                  />
                )}
              />
              <Controller 
                control={control}
                name='identicalDoors'
                render={({ field }) => (
                  <CheckboxElement 
                    currentValue={field.value}
                    onChange={(e) => {
                      updateField('finishesAndAccessories', 'identicalDoors', e)
                      field.onChange(e)
                    }}
                    name={t('form.finishesAndAccessories.field.identicalDoors')}
                  />
                )}
              />
            {!getValues('identicalDoors') && (
              <Controller 
                control={control}
                name='manufactureOfCabinDoors'
                render={({ field }) => (
                  <ChooseColor 
                    currentValue={field.value}
                    name={t('form.finishesAndAccessories.field.cabinDoors')}
                    onChange={(e) => {
                      updateField('finishesAndAccessories', 'manufactureOfCabinDoors', e)
                      field.onChange(e)
                    }}
                  />
                )}
              />
            )}
            </BorderInput>
            <BorderInput
              title={t('form.finishesAndAccessories.field.extras')}
            >
              <Controller 
                control={control}
                name='energyRecovery'
                render={({ field }) => (
                  <CheckboxElement 
                    currentValue={field.value}
                    onChange={(e) => {
                      updateField('finishesAndAccessories', 'energyRecovery', e)
                      field.onChange(e)
                    }}
                    name={t('form.finishesAndAccessories.field.energyRecovery')}
                  />
                )}
              />
              <Controller 
                control={control}
                name='antiVibrationSystems'
                render={({ field }) => (
                  <CheckboxElement 
                    currentValue={field.value}
                    onChange={(e) => {
                      updateField('finishesAndAccessories', 'antiVibrationSystems', e)
                      field.onChange(e)
                    }}
                    name={t('form.finishesAndAccessories.field.antiVibrationSystems')}
                  />
                )}
              />
              <Controller 
                control={control}
                name='cabinMonitoringSystem'
                render={({ field }) => (
                  <CheckboxElement 
                    currentValue={field.value}
                    onChange={(e) => {
                      updateField('finishesAndAccessories', 'cabinMonitoringSystem', e)
                      field.onChange(e)
                    }}
                    name={t('form.finishesAndAccessories.field.cabinMonitoringSystem')}
                  />
                )}
              />
              <Controller 
                control={control}
                name='shaftLighting'
                render={({ field }) => (
                  <CheckboxElement 
                    currentValue={field.value}
                    onChange={(e) => {
                      updateField('finishesAndAccessories', 'shaftLighting', e)
                      field.onChange(e)
                    }}
                    name={t('form.finishesAndAccessories.field.shaftLighting')}
                  />
                )}
              />
              <Controller 
                control={control}
                name='increaseSpeed'
                render={({ field }) => (
                  <CheckboxElement 
                    currentValue={field.value}
                    onChange={(e) => {
                      updateField('finishesAndAccessories', 'increaseSpeed', e)
                      field.onChange(e)
                    }}
                    name={t('form.finishesAndAccessories.field.increaseSpeed')}
                  />
                )}
              />
            </BorderInput>
            <SubmitButton title={t('form.submit')} />
          </form>
        </FormContent>
      </AnimatedPage>
      <AnimatedPageSide>
        <FinishesAndAccessoriesSummary />
      </AnimatedPageSide>
    </div>
  )
}

export default FinishesAndAccessories