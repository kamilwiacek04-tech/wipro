
export type CabinModelType = 'STAINLESS_STEEL' | 'RAL' | 'VENEER' | 'VENEER_STEEL' | 'MELAMINE';

export type ManufactureOfDoorsType = 'RAL_7040' | 'RAL_9006' | 'RAL_7016' | 'RAL_9005' | 'RAL_9016' | 'STAINLESS_STEEL';

export interface FormFinishesAndAccessories {
    cabinModel:  CabinModelType;
    manufactureOfDoors: ManufactureOfDoorsType;
    identicalDoors: boolean;
    manufactureOfCabinDoors: ManufactureOfDoorsType;
    energyRecovery: boolean;
    antiVibrationSystems: boolean;
    cabinMonitoringSystem: boolean;
    shaftLighting: boolean;
    increaseSpeed: boolean;
}