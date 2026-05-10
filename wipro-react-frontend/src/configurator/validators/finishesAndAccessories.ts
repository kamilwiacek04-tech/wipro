import { FormFinishesAndAccessories } from '@/types/multiStepWizard/finishesAndAccessories';
import * as yup from 'yup';

export const dataSchema = new yup.ObjectSchema<FormFinishesAndAccessories>({
    cabinModelId: yup.number().required('form.errors.require').min(1, 'form.errors.require'),
    panelId: yup.number().default(0),
    signalId: yup.number().default(0),
    ceilingId: yup.number().default(0),
    mirrorId: yup.number().default(0),
    handrailId: yup.number().default(0),
    flooringId: yup.number().default(0),
    energyRecovery: yup.boolean().required(),
    antiVibrationSystems: yup.boolean().required(),
    cabinMonitoringSystem: yup.boolean().required(),
    shaftLighting: yup.boolean().required(),
    increaseSpeed: yup.boolean().required(),
});
