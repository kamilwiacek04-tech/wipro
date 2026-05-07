import AnimatedPage from '@/components/AnimatedPage'
import FormContent from '@/components/FormContent'
import { useTranslation } from 'react-i18next'
import '@/assets/styles/components/multiStepWizard/ShaftParameters.css'
import TitleParagraph from '@/components/TitleParagraph'
import AnimatedPageSide from '@/components/AnimatedPageSide'
import ShaftParametersSummary from '@/components/multiStepWizardSummary/ShaftParametersSummary'
import { Controller, useForm } from 'react-hook-form'
import { FormShaftParameters, FormShaftTempParameters } from '@/types/multiStepWizard/shaftParameters'
import { useSelector } from 'react-redux'
import { RootState, useAppDispatch } from '@/store'
import RadioButtonContainer from '@/components/RadioButtonContainer'
import { liftSpecificationShaftParameters, liftPurposeType, rangeValue } from '@/constants/formShaftParameters'
import { useFormStore } from '@/store/zustand/formStore'
import TextInput from '@/components/TextInput';
import { yupResolver } from '@hookform/resolvers/yup'
import { dataSchema, dataSchemaTemp } from '@/validators/shaftParameters'
import { fillField } from '@/store/slices/formSlice'
import { useNavigate } from 'react-router'
import { useLazyFindElevatorQuery } from '@/store/mainApi/response'
import { useEffect, useState } from 'react'
import CarouselLift from '@/components/carousela/CarouselLift'
import ParagrapheText from '@/components/ParagrapheText'
import NumberInput from '@/components/NumberInput'
import SubmitButton from '@/components/SubmitButton'
import RadioButtonWithImage from '../RadioButtonWithImage'
import CheckboxElement from '../CheckboxElement'
import { replaceDots } from '@/functions/replaceDots'
import ElevatorDetailModal from '@/components/ElevatorDetailModal'

const ShaftParameters = () => {
  const {t} = useTranslation();
  const defaultDataTemp: FormShaftTempParameters = useSelector((state: RootState) => state.form.shaftTempParameters);
  const defaultData: FormShaftParameters = useSelector((state: RootState) => state.form.shaftParameters);
  const { updateField } = useFormStore();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [findElevator, {data, isFetching}] = useLazyFindElevatorQuery();
  const [delayedLoading, setDelayedLoading] = useState(false);
  const [detailElevatorId, setDetailElevatorId] = useState<number | null>(null);

  const {
    register: registerTemp,
    formState: { errors: errorsTemp },
    control: controlTemp,
    getValues: getValuesTemp,
    trigger: triggerTemp
  } = useForm<FormShaftTempParameters>({
    defaultValues: defaultDataTemp,
    mode: 'onChange'
  })

  const {
    formState: { errors },
    control: control,
    trigger,
    getValues,
    register
  } = useForm<FormShaftParameters>({
    resolver: yupResolver(dataSchema),
    defaultValues: defaultData,
    mode: 'onChange'
  })

  const onSubmit = async () => {
    const isValidTemp = await triggerTemp();
    const isValidMain = await trigger(); 
    if(isValidTemp && isValidMain){
      const data: FormShaftParameters = {
        elevatorId: getValues('elevatorId'),
        elevatorUdzwig: getValues('elevatorUdzwig'),
        stopDoorsCount: getValues('stopDoorsCount'),
        accessCount: getValues('accessCount'),
        liftingHeight: getValues('liftingHeight'),
        liftPurpose: getValues('liftPurpose'),
        accessDiagram: getValues('accessDiagram'),
        ei30DoorsCount: getValues('ei30DoorsCount'),
        ei60DoorsCount: getValues('ei60DoorsCount'),
        pitDepth: replaceDots(getValues('pitDepth')),
        headroom: replaceDots(getValues('headroom')),
        leftSideMechanic: getValues('leftSideMechanic')
      }
      const dataTemp: FormShaftTempParameters = {
        liftSpecification: getValuesTemp('liftSpecification'),
        liftCapacity: getValuesTemp('liftCapacity'),
        shaftDep: getValuesTemp('shaftDep'),
        shaftLen: getValuesTemp('shaftLen')
      }
      dispatch(fillField({
        key: 'shaftParameters',
        value: data
      }))
      dispatch(fillField({
        key: 'shaftTempParameters',
        value: dataTemp
      }))
      console.log(data)
      navigate('/finishesAndAccessories')
    }
  }

  useEffect(() => {
    setDelayedLoading(true);
    const spec = getValuesTemp('liftSpecification');

    let timeout = null;

    timeout = setTimeout(() => {
      if (spec === 'CAPACITY') {
        findElevator({
          liftCapacity: getValuesTemp('liftCapacity'),
        });
      } else if (spec === 'SHAFT_DIMENSIONS') {
        findElevator({
          shaftDep: getValuesTemp('shaftDep'),
          shaftLen: getValuesTemp('shaftLen'),
        });
      }
      setDelayedLoading(false);
    }, 1000);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [
    getValuesTemp('liftCapacity'),
    getValuesTemp('shaftDep'),
    getValuesTemp('shaftLen'),
    getValuesTemp('liftSpecification'),
  ]);

  return (
    <div className='bodyContainer'>
      {detailElevatorId !== null && (
        <ElevatorDetailModal elevatorId={detailElevatorId} onClose={() => setDetailElevatorId(null)} />
      )}
      <AnimatedPage>
        <FormContent>
          <TitleParagraph text={t('form.shaftParameters.title')} />
          <form className='formContent'>
            <div className='doubleColumnForm'>
              <div className='radioContainerField'>
                <Controller 
                  control={control}
                  name='accessDiagram'
                  render={({ field }) => (
                    <RadioButtonWithImage 
                        currentValue={field.value}
                        onChange={(e) => {
                          updateField('shaftParameters', 'accessDiagram', e)
                          field.onChange(e)
                        }}
                        checkboxElement={
                          <Controller 
                            control={control}
                            name='leftSideMechanic'
                            render={({ field }) => (
                              <CheckboxElement 
                                currentValue={field.value}
                                onChange={(e) => {
                                  updateField('shaftParameters', 'leftSideMechanic', e)
                                  field.onChange(e)
                                }}
                              />
                            )}
                          />
                        }
                        leftMechanic={getValues('leftSideMechanic')}
                    />
                  )}
                />
              </div>
              <div className='columnInputField'>
                <Controller 
                  control={control}
                  name='stopDoorsCount'
                  render={({ field }) => (
                    <NumberInput 
                      title={t('form.shaftParameters.fields.stopDoorsCount')}
                      currentValue={field.value}
                      range={rangeValue['stopDoorsCount']}
                      onChange={(e) => {
                        updateField('shaftParameters', 'stopDoorsCount', e)
                        field.onChange(e)
                      }}
                      error={errors.stopDoorsCount?.message}
                    />
                  )}
                />
                <Controller 
                  control={control}
                  name='accessCount'
                  render={({ field }) => (
                    <NumberInput 
                      title={t('form.shaftParameters.fields.accessCount')}
                      currentValue={field.value}
                      range={rangeValue['accessCount']}
                      onChange={(e) => {
                        updateField('shaftParameters', 'accessCount', e)
                        field.onChange(e)
                      }}
                      error={errors.accessCount?.message}
                    />
                  )}
                />
                <Controller 
                  control={control}
                  name='liftingHeight'
                  render={({ field }) => (
                    <NumberInput 
                      title={`${t('form.shaftParameters.fields.liftingHeight')} [m]`}
                      currentValue={field.value}
                      range={rangeValue['liftingHeight']}
                      onChange={(e) => {
                        updateField('shaftParameters', 'liftingHeight', e)
                        field.onChange(e)
                      }}
                      error={errors.liftingHeight?.message}
                    />
                  )}
                />
              </div>
            </div>
              <Controller 
              control={control}
              name='liftPurpose'
              render={({ field }) => (
                <RadioButtonContainer 
                  items={Object.entries(liftPurposeType).map(([key, item]) => ({
                    id: key,
                    title: item.title
                  }))}
                  selectedId={field.value}
                  onPress={(e) => {
                    updateField('shaftParameters', 'liftPurpose', e);
                    field.onChange(e)
                  }}
                  title={t('form.shaftParameters.fields.liftType')}
                />
              )}
            />
            <div className='doubleTextInput'>
              <Controller 
                control={control}
                name='ei30DoorsCount'
                render={({ field }) => (
                  <NumberInput 
                    title={t('form.shaftParameters.fields.ei30DoorsCount')}
                    currentValue={field.value}
                    range={rangeValue['ei30DoorsCount']}
                    onChange={(e) => {
                      updateField('shaftParameters', 'ei30DoorsCount', e)
                      field.onChange(e)
                    }}
                  />
                )}
              />
              <Controller 
                control={control}
                name='ei60DoorsCount'
                render={({ field }) => (
                  <NumberInput 
                    title={t('form.shaftParameters.fields.ei60DoorsCount')}
                    currentValue={field.value}
                    range={rangeValue['ei60DoorsCount']}
                    onChange={(e) => {
                      updateField('shaftParameters', 'ei60DoorsCount', e)
                      field.onChange(e)
                    }}
                  />
                )}
              />
            </div>
            {(errors.ei30DoorsCount?.message || errors.ei30DoorsCount?.message) && (
              <p className='inputNumberError inputNumberErrorContainer'>{t(errors.ei30DoorsCount?.message ?? errors.ei60DoorsCount?.message)}</p>
            )}
            <div className='textInputShaftTypeContainer'>
                <TextInput 
                  label={`${t('form.shaftParameters.fields.pitDepth')} [cm]`}
                  value={register('pitDepth', {
                    onChange: (e) => (
                      updateField('shaftParameters', 'pitDepth', replaceDots(e.target.value))
                      )
                  })}
                  error={errors.pitDepth?.message}
                />
                <TextInput 
                  label={`${t('form.shaftParameters.fields.headroom')} [cm]`}
                  value={register('headroom', {
                    onChange: (e) => updateField('shaftParameters', 'headroom', replaceDots(e.target.value))
                  })}
                  error={errors.headroom?.message}
                />
              </div>
          </form>
          <div style={{marginTop: 10}} className='formContent'>
            <Controller
              control={controlTemp}
              name='liftSpecification'
              render={({ field }) => (
                <RadioButtonContainer 
                  items={Object.entries(liftSpecificationShaftParameters).map(([key, item]) => ({
                    id: key,
                    title: t(item.title)
                  }))}
                  selectedId={field.value}
                  onPress={(e) => {
                    updateField('shaftTempParameters', 'liftSpecification', e)
                    field.onChange(e)
                  }}
                  title={t('form.shaftParameters.fields.liftParameter')}
                />
              )}
            />
            {getValuesTemp('liftSpecification') === 'CAPACITY' ? (
              <TextInput 
                label={`${t('form.shaftParameters.fields.capacity')} [kg]`}
                value={registerTemp('liftCapacity', {
                  onChange: (e) => updateField('shaftTempParameters', 'liftCapacity', replaceDots(e.target.value))
                })}
                inputMode={'number'}
                error={errorsTemp.liftCapacity?.message}
              />
            ) : (
              <div className='textInputShaftTypeContainer'>
                <TextInput 
                  label={`${t('form.shaftParameters.fields.shaftLen')} [m]`}
                  value={registerTemp('shaftLen', {
                    onChange: (e) => updateField('shaftTempParameters', 'shaftLen', replaceDots(e.target.value))
                  })}
                  error={errorsTemp.shaftLen?.message}
                />
                <TextInput 
                  label={`${t('form.shaftParameters.fields.shaftDep')} [m]`}
                  value={registerTemp('shaftDep', {
                    onChange: (e) => updateField('shaftTempParameters', 'shaftDep', replaceDots(e.target.value))
                  })}
                  error={errorsTemp.shaftDep?.message}
                />
              </div>
            )}
          </div>
          {isFetching || delayedLoading || (data && data.status===2) ? (
            <Controller 
              control={control}
              name='elevatorId'
              render={({ field }) => (
                <CarouselLift
                  isFetching={isFetching || delayedLoading}
                  items={data?.data}
                  error={errors.elevatorId?.message}
                  currentValue={field.value}
                  onChange={(e) => {
                    updateField('shaftParameters', 'elevatorId', e)
                    const selectedElevator = data?.data?.find(item => item.id === e)
                    if (selectedElevator) {
                      updateField('shaftParameters', 'elevatorUdzwig', selectedElevator.udzwig)
                    }
                    field.onChange(e)
                  }}
                  onDetails={(id) => setDetailElevatorId(id)}
                  />
              )}
            />
          ) : (data && (data.status===1 || data.status===0) ? (
            <ParagrapheText isError={data.status===0}>{data.info ?? data.error}</ParagrapheText>
          ) : (
            <ParagrapheText>{t('general.enterData')}</ParagrapheText>
          ))}
          <div className='submitButtonHolder'>
            <SubmitButton title={t('form.goNext')} onPress={onSubmit} />
          </div>
        </FormContent>
      </AnimatedPage>
      <AnimatedPageSide>
        <ShaftParametersSummary />
      </AnimatedPageSide>
    </div>
  )
}

export default ShaftParameters