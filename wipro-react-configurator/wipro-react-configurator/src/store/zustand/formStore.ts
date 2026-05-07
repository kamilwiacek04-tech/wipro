import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FormType } from '@/types/global';

interface FormState {
  store: FormType;
  updateField: <K extends keyof FormType>(
    key: K,
    field: keyof FormType[K],
    value: string | number | boolean
  ) => void;
}

export const useFormStore = create<FormState>()(
  persist(
    (set) => ({
      store: {
        data: {
          name: '',
          phoneNumber: '',
          email: '',
          street: '',
          houseNo: '',
          localNo: '',
          postalCode: '',
          city: '',
          status: 'ARCHITECT',
          investor: ''
        },
        shaftTempParameters: {
          liftSpecification: 'CAPACITY',
          liftCapacity: '0',
          shaftDep: '0',
          shaftLen: '0'
        },
        shaftParameters: {
          elevatorId: 0,
          elevatorUdzwig: 0,
          stopDoorsCount: 1,
          accessCount: 1,
          liftingHeight: 3,
          liftPurpose: 'FREIGHT_PASSENGER',
          accessDiagram: 'FRONT',
          ei30DoorsCount: 0,
          ei60DoorsCount: 0,
          pitDepth: '0',
          headroom: '0',
          leftSideMechanic: false,
        },
        finishesAndAccessories: {
          cabinModel: 'STAINLESS_STEEL',
          manufactureOfDoors: 'RAL_7040',
          identicalDoors: true,
          manufactureOfCabinDoors: 'RAL_7040',
          energyRecovery: false,
          antiVibrationSystems: false,
          cabinMonitoringSystem: false,
          shaftLighting: false,
          increaseSpeed: false
        }
      },
      updateField: (key, field, value) =>
        set((state) => ({
          store: {
            ...state.store,
            [key]: {
              ...state.store[key],
              [field]: value
            }
          }
        }))
    }),
    {
      name: 'form-storage'
    }
  )
);