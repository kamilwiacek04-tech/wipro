import { AccessDiagramType, LiftPurposeType, LiftSpecificationType } from "@/types/multiStepWizard/shaftParameters";
import { statusData } from "@/constants/formData";
import { useFormStore } from "@/store/zustand/formStore";

export const liftSpecificationShaftParameters: Record<LiftSpecificationType, {title: string}> = {
    'CAPACITY': {
        title: 'form.shaftParameters.liftSpecyfication.capacity'
    },
    'SHAFT_DIMENSIONS': {
        title: 'form.shaftParameters.liftSpecyfication.shaftDimension'
    }
}

export const liftPurposeType: Record<LiftPurposeType, {title: string}> = {
    'PASSENGER': {
        title: 'form.shaftParameters.liftPurpose.passenger'
    },
    'FREIGHT_PASSENGER': {
        title: 'form.shaftParameters.liftPurpose.freightPassenger'
    },
    'HOSPITAL': {
        title: 'form.shaftParameters.liftPurpose.hospital'
    },
    'FIRE': {
        title: 'form.shaftParameters.liftPurpose.fire'
    }
}

export const rangeValue: Record<string, {min: number, max: number, dependOn?: { path: string, field: string}, dependsOn?: { main: { path: string, field: string}, second: {path: string, field: string}}}> = {
    'stopDoorsCount': {
        min: 1,
        max: 16,
    },
    'accessCount': {
        min: 1,
        max: useFormStore.getState().store.shaftParameters.stopDoorsCount*2,
        dependOn: {
            path: 'shaftParameters',
            field: 'stopDoorsCount'
        }
    },
    'liftingHeight': {
        min: 3,
        max: 50,
    },
    'ei30DoorsCount': {
        min: 0,
        max: useFormStore.getState().store.shaftParameters.accessCount - useFormStore.getState().store.shaftParameters.ei60DoorsCount,
        dependsOn: {
            main: {
                path: 'shaftParameters',
                field: 'accessCount'
            },
            second: {
                path: 'shaftParameters',
                field: 'ei60DoorsCount'
            }
        }
    },
    'ei60DoorsCount': {
        min: 0,
        max: useFormStore.getState().store.shaftParameters.accessCount - useFormStore.getState().store.shaftParameters.ei30DoorsCount,
        dependsOn: {
            main: {
                path: 'shaftParameters',
                field: 'accessCount'
            },
            second: {
                path: 'shaftParameters',
                field: 'ei30DoorsCount'
            }
        }
    }
}

export const summaryShaftParametersItem = [
    {
        title: 'form.data.fields.name',
        value: 'name'
    },
    {
        title: 'form.data.fields.email',
        value: 'email'
    },
    {
        title: 'form.data.fields.phoneNumber',
        value: 'phoneNumber'
    },
    {
        title: 'form.data.fields.street',
        value: 'street'
    },
    {
        title: 'form.data.fields.houseNo',
        value: 'houseNo'
    },
    {
        title: 'form.data.fields.localNo',
        value: 'localNo'
    },
    {
        title: 'form.data.fields.postalCode',
        value: 'postalCode'
    },
    {
        title: 'form.data.fields.city',
        value: 'city'
    },
    {
        title: 'form.data.fields.status',
        value: 'status',
        object: statusData
    },
    {
        title: 'form.data.fields.investor',
        value: 'investor'
    }
]

export const accessDiagram: Record<AccessDiagramType, {title: string, image: string, imageLeft: string}> = {
    'FRONT': {
        title: 'form.shaftParameters.accessDiagram.front',
        image: 'front',
        imageLeft: 'frontLeft',
    },
    'THROUGHT': {
        title: 'form.shaftParameters.accessDiagram.throught',
        image: 'throught',
        imageLeft: 'throughtLeft',
    },
    'CORNER' : {
        title: 'form.shaftParameters.accessDiagram.corner',
        image: 'corner',
        imageLeft: 'cornerLeft',
    },
    'TRIPARTITE': {
        title: 'form.shaftParameters.accessDiagram.tripartite',
        image: 'tripartite',
        imageLeft: 'tripartiteLeft',
    },
}