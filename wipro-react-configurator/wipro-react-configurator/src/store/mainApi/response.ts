import mainApi from '@/store/mainApi/index';
import { ApiResponse } from '@/types/mainApi/general';
import { Elevator } from '@/types/mainApi/response';
import { FormData } from '@/types/multiStepWizard/data';
import { FormFinishesAndAccessories } from '@/types/multiStepWizard/finishesAndAccessories';
import { float, FormShaftParameters } from '@/types/multiStepWizard/shaftParameters';

interface FindElevatorBody {
    liftCapacity?: float;
    shaftLen?: float;
    shaftDep?: float;
}

interface SendToPowerAutomateBody {
    data: FormData;
    shaftParameters: FormShaftParameters;
    finishesAndAccessories: FormFinishesAndAccessories;
}

interface StoreQuoteRequestBody {
    investor_name: string;
    investor_email: string;
    investor_phone?: string;
    investor_company?: string;
    investor_address?: string;
    investor_city?: string;
    investment_name?: string;
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
                url: 'elevFinder',
                body
            })
        }),
        sendToPowerAutomate: build.mutation<ApiResponse<void>, SendToPowerAutomateBody>({
            query: (body) => ({
                fullUrl: 'https://default89dc4655b4884dfcbc067f6003c40e.77.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/44a5af7595d64dca9a9a61a243da36e3/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=eSGq1x9QfVyIXSS_mtX5Qg-Cy1DCw4Zlw8yQ2hkGWg4',
                method: 'POST',
                body,
            })
        }),
        storeQuoteRequest: build.mutation<{ success: boolean; message: string; request_number: string }, StoreQuoteRequestBody>({
            query: (body) => ({
                url: 'quote-requests',
                method: 'POST',
                body,
            })
        }),
    })
})

export const {
    useLazyFindElevatorQuery,
    useSendToPowerAutomateMutation,
    useStoreQuoteRequestMutation,
} = responseEndpoints;
