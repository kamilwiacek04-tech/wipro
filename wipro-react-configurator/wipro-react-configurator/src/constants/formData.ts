import { StatusData } from "@/types/multiStepWizard/data";

export const statusData: Record<StatusData, { title: string}> = {
    'CONTRACTOR': {
        title: 'form.data.status.contractor'
    },
    'OWNER': {
        title: 'form.data.status.owner'
    },
    'ARCHITECT': {
        title: 'form.data.status.architect'
    },
    'COST_ESTIMATOR': {
        title: 'form.data.status.costEstimator'
    }
}