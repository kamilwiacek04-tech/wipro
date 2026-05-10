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

