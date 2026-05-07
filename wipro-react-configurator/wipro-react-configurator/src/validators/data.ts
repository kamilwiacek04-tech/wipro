import { statusData } from '@/constants/formData';
import { FormData } from '@/types/multiStepWizard/data'
import * as yup from 'yup'

const EMAIL_REGEX = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const PHONE_REGEX = /^(\+?\d{1,4}[ \-]?)?(\d{3}[ \-]?\d{3}[ \-]?\d{3,4})$/;
const POSTALCODE_REGEX = /^\d{2}-\d{3}$/;


export const dataSchema = new yup.ObjectSchema<FormData>({
    name: yup.string().required('form.errors.require'),
    phoneNumber: yup.string().required('form.errors.require').matches(PHONE_REGEX, 'form.errors.invalidPhone'),
    email: yup.string().required('form.errors.require').matches(EMAIL_REGEX, 'form.errors.invalidEmail'),
    street: yup.string().required('form.errors.require'),
    postalCode: yup.string().required('form.errors.require').matches(POSTALCODE_REGEX, 'form.errors.invalidPostalCode'),
    houseNo: yup.string().required('form.errors.require'),
    localNo: yup.string(),
    city: yup.string().required('form.errors.require'),
    status: yup.mixed<keyof typeof statusData>().oneOf(Object.keys(statusData) as (keyof typeof statusData)[], 'form.errors.invalidValue'),
    investor: yup.string()
})