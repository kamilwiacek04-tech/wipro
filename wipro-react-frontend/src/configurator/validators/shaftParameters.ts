import { liftSpecificationShaftParameters, rangeValue } from '@/constants/formShaftParameters';
import { AccessDiagramType, FormShaftParameters, FormShaftTempParameters, LiftPurposeType } from '@/types/multiStepWizard/shaftParameters';
import * as yup from 'yup';

const numberWithComma = () =>
  yup
    .number()
    .transform((_value, originalValue) => {
      if (typeof originalValue === 'number') return originalValue;
      if (typeof originalValue !== 'string') return NaN;

      const s = originalValue.trim();
      if (s === '') return NaN;

      const validNumberRegex = /^[-+]?(?:\d+|(?:\d{1,3}(?:[.\s]\d{3})+))(?:[.,]\d+)?$/;

      if (!validNumberRegex.test(s)) {
        return NaN;
      }

      const normalized = s.replace(/[.\s]/g, '').replace(',', '.');

      const n = Number(normalized);
      return Number.isFinite(n) ? n : NaN;
    });

export const dataSchemaTemp: yup.ObjectSchema<FormShaftTempParameters> = yup.object({
  liftSpecification: yup
    .mixed<keyof typeof liftSpecificationShaftParameters>()
    .oneOf(
      Object.keys(liftSpecificationShaftParameters) as (keyof typeof liftSpecificationShaftParameters)[],
      'form.errors.invalidValue'
    )
    .required('form.errors.require'),

  liftCapacity: numberWithComma().when('liftSpecification', {
    is: 'CAPACITY',
    then: (schema) =>
      schema
        .required('form.errors.require')
        .typeError('form.errors.number')
        .integer('form.errors.intiger')
        .positive('form.errors.positive'),
    otherwise: (schema) => schema.strip(),
  }) as unknown as yup.Schema<string | undefined>,

  shaftLen: numberWithComma().when('liftSpecification', {
    is: 'SHAFT_DIMENSIONS',
    then: (schema) =>
      schema
        .required('form.errors.require')
        .typeError('form.errors.number')
        .positive('form.errors.positive'),
    otherwise: (schema) => schema.strip(),
  }) as unknown as yup.Schema<string | undefined>,

  shaftDep: numberWithComma().when('liftSpecification', {
    is: 'SHAFT_DIMENSIONS',
    then: (schema) =>
      schema
        .required('form.errors.require')
        .typeError('form.errors.number')
        .positive('form.errors.positive'),
    otherwise: (schema) => schema.strip(),
  }) as unknown as yup.Schema<string | undefined>,
});

export const createDataSchema = (maxStops: number): yup.ObjectSchema<FormShaftParameters> => yup.object({
  elevatorId: yup.number().required('form.errors.require').typeError('form.errors.mustSelect').positive('form.errors.positive'),
  elevatorUdzwig: yup.number().default(0),
  stopDoorsCount: yup.number().required('form.errors.require').typeError('form.errors.number').min(rangeValue['stopDoorsCount'].min, ({ min }) => `form.errors.minNumber|${min}`).max(maxStops, ({ max }) => `form.errors.maxNumber|${max}`),
  accessCount: yup.number().required('form.errors.require').typeError('form.errors.number').min(rangeValue['accessCount'].min, ({ min }) => `form.errors.minNumber|${min}`).when('stopDoorsCount', (stopDoorsCount, schema) => {
    const count = typeof stopDoorsCount === 'number' ? stopDoorsCount : Number(stopDoorsCount);
    return count ? schema.max(count * 2, () => `form.errors.maxNumber|${count * 2}`) : schema;
  }),
  liftingHeight: yup.number().required('form.errors.require').typeError('form.errors.number').positive('form.errors.positive').when('stopDoorsCount', ([stops], schema) => {
    const s = typeof stops === 'number' && stops > 0 ? stops : 1;
    const max = 3 * s;
    return schema.max(max, () => `form.errors.maxNumber|${max}`);
  }),
  liftPurpose: yup.mixed<LiftPurposeType>().oneOf(['PASSENGER', 'FREIGHT_PASSENGER', 'HOSPITAL', 'FIRE'], 'form.errors.invalidValue').required('form.errors.require'),
  accessDiagram: yup.mixed<AccessDiagramType>().oneOf(['FRONT', 'THROUGHT', 'CORNER', 'TRIPARTITE']).required('form.errors.require'),
  ei30DoorsCount: yup
    .number()
    .required('form.errors.require')
    .typeError('form.errors.number')
    .min(rangeValue['ei30DoorsCount'].min, ({ min }) => `form.errors.minNumber|${min}`)
    .test('ei30Max', 'form.errors.sumOfDoors', function(value) {
      const { accessCount, ei60DoorsCount } = this.parent;
      if (value == null || accessCount == null || ei60DoorsCount == null) return true;
      return value + ei60DoorsCount <= accessCount;
    }),
  ei60DoorsCount: yup
    .number()
    .required('form.errors.require')
    .typeError('form.errors.number')
    .min(rangeValue['ei60DoorsCount'].min, ({ min }) => `form.errors.minNumber|${min}`)
    .test('ei60Max', 'form.errors.sumOfDoors', function(value) {
      const { accessCount, ei30DoorsCount } = this.parent;
      if (value == null || accessCount == null || ei30DoorsCount == null) return true;
      return value + ei30DoorsCount <= accessCount;
    }),
  pitDepth: numberWithComma().required('form.errors.require').typeError('form.errors.number').min(1, () => `form.errors.minNumber|${1}`) as unknown as yup.Schema<string | undefined>,
  headroom: numberWithComma().required('form.errors.require').typeError('form.errors.number').min(1, () => `form.errors.minNumber|${1}`) as unknown as yup.Schema<string | undefined>,
  leftSideMechanic: yup.boolean().required(),
});

export const dataSchema = createDataSchema(rangeValue['stopDoorsCount'].max);
