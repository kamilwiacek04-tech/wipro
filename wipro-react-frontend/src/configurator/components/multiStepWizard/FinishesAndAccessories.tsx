import AccessorySelector from '@/components/AccessorySelector'
import AnimatedPage from '@/components/AnimatedPage'
import AnimatedPageSide from '@/components/AnimatedPageSide'
import BorderInput from '@/components/BorderInput'
import CarouselaImage from '@/components/carouselaImage/CarouselaImage'
import CheckboxElement from '@/components/CheckboxElement'
import FormContent from '@/components/FormContent'
import Loading from '@/components/Loading'
import FinishesAndAccessoriesSummary from '@/components/multiStepWizardSummary/FinishesAndAccessoriesSummary'
import SubmitButton from '@/components/SubmitButton'
import TitleParagraph from '@/components/TitleParagraph'
import { RootState, useAppDispatch, useAppSelector } from '@/store'
import { useGetCabinAccessoriesQuery, useGetCabinColorsQuery, useGetCabinModelsQuery, useStoreQuoteRequestMutation } from '@/store/mainApi/response'
import ColorSelector from '@/components/ColorSelector'
import { fillField, formSelectors } from '@/store/slices/formSlice'
import { openModal } from '@/store/slices/modalSlice'
import { useFormStore } from '@/store/zustand/formStore'
import { FormFinishesAndAccessories } from '@/types/multiStepWizard/finishesAndAccessories'
import { dataSchema } from '@/validators/finishesAndAccessories'
import { yupResolver } from '@hookform/resolvers/yup'
import { useEffect } from 'react'
import {Controller, useForm, useWatch} from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

const ACCESSORY_SECTIONS: Array<{
    key: keyof Pick<FormFinishesAndAccessories, 'panelId' | 'signalId' | 'ceilingId' | 'mirrorId' | 'handrailId' | 'flooringId'>;
    category: string;
    labelKey: string;
}> = [
    { key: 'panelId',    category: 'PANEL',    labelKey: 'form.finishesAndAccessories.field.panel' },
    { key: 'signalId',   category: 'SIGNAL',   labelKey: 'form.finishesAndAccessories.field.signal' },
    { key: 'ceilingId',  category: 'CEILING',  labelKey: 'form.finishesAndAccessories.field.ceiling' },
    { key: 'mirrorId',   category: 'MIRROR',   labelKey: 'form.finishesAndAccessories.field.mirror' },
    { key: 'handrailId', category: 'HANDRAIL', labelKey: 'form.finishesAndAccessories.field.handrail' },
    { key: 'flooringId', category: 'FLOORING', labelKey: 'form.finishesAndAccessories.field.flooring' },
]

const FinishesAndAccessories = () => {
    const { t, i18n } = useTranslation()
    const textPath = 'form.finishesAndAccessories'
    const defaultData: FormFinishesAndAccessories = useSelector((state: RootState) => state.form.finishesAndAccessories)
    const dispatch = useAppDispatch()
    const { updateField } = useFormStore()

    const [sendData, { data: apiData, isLoading, isSuccess, isError, error }] = useStoreQuoteRequestMutation()
    const { data: cabinModels, isLoading: loadingModels } = useGetCabinModelsQuery()
    const { data: accessories, isLoading: loadingAccessories } = useGetCabinAccessoriesQuery()
    const { data: cabinColors, isLoading: loadingColors } = useGetCabinColorsQuery()

    const formData = useAppSelector(formSelectors.data)
    const shaftParameters = useAppSelector(formSelectors.shaftParameters)

    const { formState: { errors }, control, handleSubmit } = useForm<FormFinishesAndAccessories>({
        resolver: yupResolver(dataSchema),
        defaultValues: defaultData,
        mode: 'onChange',
    })

    const cabinDoorSameAsLanding = useWatch({control, name: 'cabinDoorSameAsLanding'})

    const onSubmit = (dataCurr: FormFinishesAndAccessories) => {
        dispatch(fillField({ key: 'finishesAndAccessories', value: dataCurr }))

        const installAddress = [formData.street, formData.houseNo, formData.localNo]
            .filter(Boolean)
            .join(' ')

        sendData({
            investor_name: formData.name,
            investor_email: formData.email,
            investor_phone: formData.phoneNumber || undefined,
            investor_company: formData.companyName || undefined,
            investor_nip: formData.nip || undefined,
            investment_name: formData.investor || undefined,
            investment_address: installAddress || undefined,
            investment_city: formData.city || undefined,
            stops: shaftParameters.stopDoorsCount,
            pit_depth: shaftParameters.pitDepth ? parseInt(String(shaftParameters.pitDepth), 10) : undefined,
            overhead: shaftParameters.headroom ? parseInt(String(shaftParameters.headroom), 10) : undefined,
            drive_type: shaftParameters.liftPurpose,
            door_type: shaftParameters.accessDiagram,
            elevator_id: shaftParameters.elevatorId || undefined,
            additional_notes: [
                formData.additionalNotes,
                JSON.stringify({
                    liftingHeight: shaftParameters.liftingHeight,
                    accessCount: shaftParameters.accessCount,
                    ei30DoorsCount: shaftParameters.ei30DoorsCount,
                    ei60DoorsCount: shaftParameters.ei60DoorsCount,
                    leftSideMechanic: shaftParameters.leftSideMechanic,
                    status: formData.status,
                    cabinModelId: dataCurr.cabinModelId,
                    cabinColorId: dataCurr.cabinColorId || undefined,
                    doorColorId: dataCurr.doorColorId || undefined,
                    cabinDoorSameAsLanding: dataCurr.cabinDoorSameAsLanding,
                    cabinDoorColorId: dataCurr.cabinDoorSameAsLanding ? undefined : (dataCurr.cabinDoorColorId || undefined),
                    panelId: dataCurr.panelId || undefined,
                    signalId: dataCurr.signalId || undefined,
                    ceilingId: dataCurr.ceilingId || undefined,
                    mirrorId: dataCurr.mirrorId || undefined,
                    handrailId: dataCurr.handrailId || undefined,
                    flooringId: dataCurr.flooringId || undefined,
                    extraIds: dataCurr.extraIds,
                }),
            ].filter(Boolean).join('\n\n'),
        })
    }

    useEffect(() => {
        if (!isLoading && isSuccess && !isError) {
            dispatch(openModal({ type: 'success' }))
        }
        if (!isLoading && isError && !isSuccess) {
            dispatch(openModal({ type: 'error' }))
        }
    }, [isLoading, isSuccess, apiData, error, isError])

    const isLoadingAll = loadingModels || loadingAccessories || loadingColors

    return (
        <div className="flex flex-row flex-1 overflow-hidden max-[1200px]:flex-col max-[1200px]:gap-5">
            <AnimatedPage>
                <FormContent>
                    <TitleParagraph text={t(`${textPath}.title`)} />
                    {isLoadingAll ? (
                        <div className="flex justify-center py-10">
                            <Loading />
                        </div>
                    ) : (
                        <form className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)}>
                            {/* Model kabiny */}
                            <BorderInput title={t(`${textPath}.field.cabinModel`)}>
                                <Controller
                                    control={control}
                                    name="cabinModelId"
                                    render={({ field }) => (
                                        <CarouselaImage
                                            items={cabinModels ?? []}
                                            currentValue={field.value}
                                            lang={i18n.language}
                                            onChange={(id) => {
                                                updateField('finishesAndAccessories', 'cabinModelId', id)
                                                field.onChange(id)
                                            }}
                                            onInfo={(item) => dispatch(openModal({ type: 'cabinInfo', cabinModel: item }))}
                                        />
                                    )}
                                />
                                {errors.cabinModelId && (
                                    <p className="text-[14px] text-[var(--red)] mt-1">{t(errors.cabinModelId.message ?? '')}</p>
                                )}
                            </BorderInput>

                            {/* Kolor kabiny */}
                            {(cabinColors?.filter(c => c.visible_for_cabin) ?? []).length > 0 && (
                                <BorderInput title={t(`${textPath}.field.cabinColor`)}>
                                    <Controller
                                        control={control}
                                        name='cabinColorId'
                                        render={({field}) => (
                                            <ColorSelector
                                                items={cabinColors?.filter(c => c.visible_for_cabin) ?? []}
                                                currentValue={field.value}
                                                onChange={(id) => {
                                                    updateField('finishesAndAccessories', 'cabinColorId', id)
                                                    field.onChange(id)
                                                }}
                                            />
                                        )}
                                    />
                                </BorderInput>
                            )}

                            {/* Kolor drzwi przystankowych */}
                            {(cabinColors?.filter(c => c.visible_for_door) ?? []).length > 0 && (
                                <BorderInput title={t(`${textPath}.field.landingDoorColor`)}>
                                    <Controller
                                        control={control}
                                        name='doorColorId'
                                        render={({field}) => (
                                            <ColorSelector
                                                items={cabinColors?.filter(c => c.visible_for_door) ?? []}
                                                currentValue={field.value}
                                                onChange={(id) => {
                                                    updateField('finishesAndAccessories', 'doorColorId', id)
                                                    field.onChange(id)
                                                }}
                                            />
                                        )}
                                    />
                                    <Controller
                                        control={control}
                                        name='cabinDoorSameAsLanding'
                                        render={({field}) => (
                                            <label className='flex items-center gap-2 mt-3 cursor-pointer select-none'>
                                                <input
                                                    type='checkbox'
                                                    checked={field.value}
                                                    onChange={e => {
                                                        updateField('finishesAndAccessories', 'cabinDoorSameAsLanding', e.target.checked)
                                                        field.onChange(e.target.checked)
                                                    }}
                                                    className='w-4 h-4 accent-(--primary)'
                                                />
                                                <span className='text-[13px] text-gray-600'>{t(`${textPath}.field.cabinDoorSameAsLanding`)}</span>
                                            </label>
                                        )}
                                    />
                                </BorderInput>
                            )}

                            {/* Kolor drzwi kabinowych — only when checkbox is false */}
                            {!cabinDoorSameAsLanding && (cabinColors?.filter(c => c.visible_for_door) ?? []).length > 0 && (
                                <BorderInput title={t(`${textPath}.field.cabinDoorColor`)}>
                                    <Controller
                                        control={control}
                                        name='cabinDoorColorId'
                                        render={({field}) => (
                                            <ColorSelector
                                                items={cabinColors?.filter(c => c.visible_for_door) ?? []}
                                                currentValue={field.value}
                                                onChange={(id) => {
                                                    updateField('finishesAndAccessories', 'cabinDoorColorId', id)
                                                    field.onChange(id)
                                                }}
                                            />
                                        )}
                                    />
                                </BorderInput>
                            )}

                            {/* Sekcje akcesoriów */}
                            {ACCESSORY_SECTIONS.map(({ key, category, labelKey }) => {
                                const items = accessories?.[category as keyof typeof accessories] ?? []
                                if (items.length === 0) return null
                                return (
                                    <BorderInput key={key} title={t(labelKey)}>
                                        <Controller
                                            control={control}
                                            name={key}
                                            render={({ field }) => (
                                                <AccessorySelector
                                                    title=""
                                                    items={items}
                                                    currentValue={field.value}
                                                    onChange={(id) => {
                                                        updateField('finishesAndAccessories', key, id)
                                                        field.onChange(id)
                                                    }}
                                                />
                                            )}
                                        />
                                    </BorderInput>
                                )
                            })}

                            {/* Dodatki z bazy danych */}
                            {(accessories?.['EXTRA'] ?? []).length > 0 && (
                                <BorderInput title={t(`${textPath}.field.extras`)}>
                                    <Controller
                                        control={control}
                                        name="extraIds"
                                        render={({ field }) => (
                                            <div className="flex flex-col">
                                                {(accessories?.['EXTRA'] ?? []).map((extra) => {
                                                    const name = i18n.language === 'pl' ? extra.name_pl : extra.name_en
                                                    const checked = (field.value ?? []).includes(extra.id)
                                                    return (
                                                        <CheckboxElement
                                                            key={extra.id}
                                                            currentValue={checked}
                                                            name={name}
                                                            onChange={(val) => {
                                                                const next = val
                                                                    ? [...(field.value ?? []), extra.id]
                                                                    : (field.value ?? []).filter((id) => id !== extra.id)
                                                                updateField('finishesAndAccessories', 'extraIds', next)
                                                                field.onChange(next)
                                                            }}
                                                        />
                                                    )
                                                })}
                                            </div>
                                        )}
                                    />
                                </BorderInput>
                            )}

                            <SubmitButton title={t('form.submit')} isLoading={isLoading} />
                        </form>
                    )}
                </FormContent>
            </AnimatedPage>
            <AnimatedPageSide>
                <FinishesAndAccessoriesSummary />
            </AnimatedPageSide>
        </div>
    )
}

export default FinishesAndAccessories
