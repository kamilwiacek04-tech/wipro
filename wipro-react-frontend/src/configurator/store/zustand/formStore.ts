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
          status: 'ARCHITECT',
          companyName: '',
          nip: '',
          street: '',
          houseNo: '',
          localNo: '',
          postalCode: '',
          city: '',
          investor: '',
          additionalNotes: '',
        },
        shaftTempParameters: {
          liftSpecification: 'CAPACITY',
          liftCapacity: undefined,
          shaftDep: undefined,
          shaftLen: undefined,
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
          pitDepth: undefined,
          headroom: undefined,
          leftSideMechanic: false,
        },
        finishesAndAccessories: {
          cabinModelId: 0,
          panelId: 0,
          signalId: 0,
          ceilingId: 0,
          mirrorId: 0,
          handrailId: 0,
          flooringId: 0,
          energyRecovery: false,
          antiVibrationSystems: false,
          cabinMonitoringSystem: false,
          shaftLighting: false,
          increaseSpeed: false,
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