import mainApi from '@/store/mainApi/index';
import { ApiResponse } from '@/types/mainApi/general';
import { Elevator } from '@/types/mainApi/response';
import { float } from '@/types/multiStepWizard/shaftParameters';

export interface LiftType {
    id: number;
    key: string;
    name_pl: string;
    name_en: string;
    sort_order: number;
    is_active: boolean;
}

export interface AppSettings {
    max_stops: string;
    [key: string]: string;
}

export interface CabinModel {
    id: number;
    name_pl: string;
    name_en: string;
    image_url: string | null;
    details: Array<{ label: string; value: string }> | null;
    sort_order: number;
    is_active: boolean;
}

export type AccessoryCategory = 'PANEL' | 'SIGNAL' | 'CEILING' | 'MIRROR' | 'HANDRAIL' | 'FLOORING' | 'EXTRA';

export interface CabinAccessory {
    id: number;
    category: AccessoryCategory;
    name_pl: string;
    name_en: string;
    image_url: string | null;
    sort_order: number;
    is_active: boolean;
}

export type GroupedAccessories = Partial<Record<AccessoryCategory, CabinAccessory[]>>;

export interface CabinColor {
    id: number;
    name_pl: string;
    name_en: string;
    image_url: string | null;
    visible_for_cabin: boolean;
    visible_for_door: boolean;
    price_addition_cabin: string;
    price_addition_door: string;
    sort_order: number;
    is_active: boolean;
}

export interface CabinType {
    id: number;
    key: string;
    name_pl: string;
    name_en: string;
    image_right_url: string | null;
    image_left_url: string | null;
    price: string;
    sort_order: number;
    is_active: boolean;
}

interface FindElevatorBody {
    liftCapacity?: float;
    shaftLen?: float;
    shaftDep?: float;
}


interface StoreQuoteRequestBody {
    investor_name: string;
    investor_email: string;
    investor_phone?: string;
    investor_company?: string;
    investor_nip?: string;
    investor_address?: string;
    investor_city?: string;
    investment_name?: string;
    investment_address?: string;
    investment_city?: string;
    stops?: number;
    pit_depth?: number;
    overhead?: number;
    drive_type?: string;
    door_type?: string;
    elevator_id?: number;
    additional_notes?: string;
}

const responseEndpoints = mainApi.injectEndpoints({
    overrideExisting: true,
    endpoints: (build) => ({
        findElevator: build.query<ApiResponse<Elevator[]>, FindElevatorBody>({
            query: (body) => ({
                url: '/elevFinder',
                body
            })
        }),
        storeQuoteRequest: build.mutation<{ success: boolean; message: string; request_number: string }, StoreQuoteRequestBody>({
            query: (body) => ({
                url: '/quote-requests',
                method: 'POST',
                body,
            })
        }),
        getLiftTypes: build.query<LiftType[], void>({
            query: () => ({
                url: '/lift-types',
                method: 'GET',
            })
        }),
        getSettings: build.query<AppSettings, void>({
            query: () => ({
                url: '/settings',
                method: 'GET',
            })
        }),
        getCabinModels: build.query<CabinModel[], void>({
            query: () => ({
                url: '/cabin-models',
                method: 'GET',
            })
        }),
        getCabinAccessories: build.query<GroupedAccessories, void>({
            query: () => ({
                url: '/cabin-accessories',
                method: 'GET',
            })
        }),
        getCabinColors: build.query<CabinColor[], void>({
            query: () => ({url: '/cabin-colors', method: 'GET'})
        }),
        getCabinTypes: build.query<CabinType[], void>({
            query: () => ({url: '/cabin-types', method: 'GET'})
        }),
    })
})

export const {
    useLazyFindElevatorQuery,
    useStoreQuoteRequestMutation,
    useGetLiftTypesQuery,
    useGetSettingsQuery,
    useGetCabinModelsQuery,
    useGetCabinAccessoriesQuery,
    useGetCabinColorsQuery,
    useGetCabinTypesQuery,
} = responseEndpoints;
