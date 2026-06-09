import { FormFinishesAndAccessories } from '@/types/multiStepWizard/finishesAndAccessories';
import * as yup from 'yup';

export const dataSchema = new yup.ObjectSchema<FormFinishesAndAccessories>({
    cabinModelId: yup.number().required('form.errors.require').min(1, 'form.errors.require'),
    cabinColorId: yup.number().default(0),
    doorColorId: yup.number().default(0),
    cabinDoorSameAsLanding: yup.boolean().default(true),
    cabinDoorColorId: yup.number().default(0),
    panelId: yup.number().default(0),
    signalId: yup.number().default(0),
    ceilingId: yup.number().default(0),
    mirrorId: yup.number().default(0),
    handrailId: yup.number().default(0),
    flooringId: yup.number().default(0),
    extraIds: yup.array().of(yup.number().required()).default([]),
});
