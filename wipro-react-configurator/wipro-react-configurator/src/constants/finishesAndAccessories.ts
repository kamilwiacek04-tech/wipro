import { ManufactureOfDoorsType } from "@/types/multiStepWizard/finishesAndAccessories";
import { accessDiagram, liftPurposeType } from "./formShaftParameters";
import { images } from "./images";


export const summaryFinishesAndAccessories = [
    {
        title: 'form.shaftParameters.fields.accessDiagram',
        value: 'accessDiagram',
        object: accessDiagram
    },
    {
        title: 'form.shaftParameters.fields.leftSideMechanic',
        value: 'leftSideMechanic'
    },
    {
        title: 'form.shaftParameters.fields.stopDoorsCount',
        value: 'stopDoorsCount'
    },
    {
        title: 'form.shaftParameters.fields.accessCount',
        value: 'accessCount'
    },
    {
        title: 'form.shaftParameters.fields.liftingHeight',
        value: 'liftingHeight'
    },
    {
        title: 'form.shaftParameters.fields.liftType',
        value: 'liftPurpose',
        object: liftPurposeType
    },
    {
        title: 'form.shaftParameters.fields.ei30DoorsCountShort',
        value: 'ei30DoorsCount'
    },
    {
        title: 'form.shaftParameters.fields.ei60DoorsCountShort',
        value: 'ei60DoorsCount'
    },
    {
        title: 'form.shaftParameters.fields.pitDepth',
        value: 'pitDepth'
    },
    {
        title: 'form.shaftParameters.fields.headroom',
        value: 'headroom'
    },
    {
        title: 'form.shaftParameters.fields.capacity',
        value: 'elevatorUdzwig'
    }
]

export const cabinModel = [
    {
        image: images.ral,
        value: 'RAL',
        title: 'form.finishesAndAccessories.cabinModel.ral'
    },
    {
        image: images.melamine,
        value: 'MELAMINE',
        title: 'form.finishesAndAccessories.cabinModel.melamine'
    },
    {
        image: images.stainlessSteel,
        value: 'STAINLESS_STEEL',
        title: 'form.finishesAndAccessories.cabinModel.stainlessSteel'
    },
    {
        image: images.veneer,
        value: 'VENEER',
        title: 'form.finishesAndAccessories.cabinModel.veneer'
    },
    {
        image: images.vennerSteel,
        value: 'VENEER_STEEL',
        title: 'form.finishesAndAccessories.cabinModel.veneerSteel'
    }
]

export const manufactureOfDoors: {value: ManufactureOfDoorsType, color?: string, image?: string}[] = [
    {
        value: 'RAL_7040',
        color: '#9da2a6'
    },
    {
        value: 'RAL_9006',
        color: '#a7a6a7'
    },
    {
        value: 'RAL_7016',
        color: '#4e5256'
    },
    {
        value: 'RAL_9005',
        color: '#000000'
    },
    {
        value: 'RAL_9016',
        color: '#f9f9f9'
    },
    {
        value: 'STAINLESS_STEEL',
        image: 'ralXXX'
    }
]