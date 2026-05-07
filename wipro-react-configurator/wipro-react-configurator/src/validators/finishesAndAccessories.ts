import { CabinModelType, FormFinishesAndAccessories, ManufactureOfDoorsType } from '@/types/multiStepWizard/finishesAndAccessories';
import * as yup from 'yup';

export const dataSchema = new yup.ObjectSchema<FormFinishesAndAccessories>({
    cabinModel: yup.mixed<CabinModelType>().oneOf(['STAINLESS_STEEL', 'RAL', 'VENEER', 'VENEER_STEEL', 'MELAMINE'], 'form.errors.invalidValue').required('form.errors.require'),
    manufactureOfDoors: yup.mixed<ManufactureOfDoorsType>().oneOf(['RAL_7040', 'RAL_9006', 'RAL_7016', 'RAL_9005', 'RAL_9016', 'STAINLESS_STEEL'], 'form.errors.invalidValue').required('form.errors.require'),
    identicalDoors: yup.boolean(),
    manufactureOfCabinDoors: yup.mixed<ManufactureOfDoorsType>().oneOf(['RAL_7040', 'RAL_9006', 'RAL_7016', 'RAL_9005', 'RAL_9016', 'STAINLESS_STEEL'], 'form.errors.invalidValue').required('form.errors.require'),
    energyRecovery: yup.boolean(),
    antiVibrationSystems: yup.boolean(),
    cabinMonitoringSystem: yup.boolean(),
    shaftLighting: yup.boolean(),
    increaseSpeed: yup.boolean(),
})