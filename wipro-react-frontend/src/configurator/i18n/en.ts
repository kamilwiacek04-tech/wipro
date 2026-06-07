import { Translations } from "./pl";

const en: Translations = {
    navigation: {
        step: 'Step {{step}}: {{title}}',
        steps: {
            data: 'Contact details',
            shaftParameters: 'Parameters',
            finishesAndAccessories: 'Finishes and Accessories',
        }
    },
    general: {
        loading: 'Loading',
        enterData: 'Enter data',
        select: 'Select',
        details: 'Details',
        noImage: 'no image',
        return: 'Return',
        gotProblems: 'Have you encountered a problem? Send an email to:',
        modalSuccess: {
            info: 'Success',
            infoDetails: 'You will receive a summary of the calculator at {{email}}.',
            confirm: 'Confirm',
        },
        modalError: {
            info: 'Error',
            infoDetails: 'An error occurred while sending the data. Please try again.',
            confirm: 'Return'
        }
    },
    form: {
        goNext: 'Go Next',
        submit: 'Submit',
        data: {
            title: 'Contact details',
            sections: {
                contact: 'Contact details',
                company: 'Company details',
                installAddress: 'Lift installation site',
                other: 'Other',
            },
            fields: {
                name: 'First name and surname',
                email: 'Email address',
                phoneNumber: 'Phone Number',
                companyName: 'Company name',
                nip: 'VAT number',
                street: 'Street',
                houseNo: 'Building number',
                localNo: 'Premises number',
                postalCode: 'Postcode',
                city: 'Town',
                status: 'Status',
                investor: 'Investment name',
                additionalNotes: 'Additional information',
            },
            status: {
                contractor: 'Contractor',
                owner: 'Owner',
                architect: 'Architect',
                costEstimator: 'Cost estimator'
            }
        },
        errors: {
            require: 'Require field',
            invalidPhone: 'Invalid phone number',
            minPhoneNumbers: 'The field must have at least 9 digits',
            maxPhoneNumbers: 'The field can have a maximum of 15 digits',
            invalidEmail: 'Invalid email address',
            invalidValue: 'Invalid value',
            positive: 'The field must be a positive number',
            intiger: 'The field must be a intiger number',
            number: 'The field must be a number',
            invalidPostalCode: 'The postcode must be in the format XX-XXX',
            invalidNip: 'VAT number must be 10 digits (e.g. 1234567890 or 123-456-78-90)',
            mustSelect: 'You must select a lift',
            maxNumber: 'Field must be less than {{number}}',
            minNumber: 'Field must be higher than {{number}}',
            sumOfDoors: 'The sum of the number of EI30 and EI60 class doors must not exceed the number of access points.'
        },
        shaftParameters: {
            title: 'Shaft parameters',
            fields: {
                wannaProvide: 'I want to provide {{field}}',
                capacity: 'Capacity',
                shaftDimension: 'Shaft dimension',
                shaftLen: 'Shaft length',
                shaftDep: 'Shaft Depth',
                stopDoorsCount: 'Number of stops',
                accessCount: 'Number of access points',
                liftingHeight: 'Lifting height',
                liftType: 'Lift type',
                liftParameter: 'Lift parameters',
                pitDepth: 'Pit depth',
                headroom: 'Headroom',
                ei30DoorsCount: 'Number of doors with fire resistance class EI30',
                ei60DoorsCount: 'Number of doors with fire resistance class EI60',
                accessDiagram: 'Access diagram',
                leftSideMechanic: 'Mechanic on left side',
                ei30DoorsCountShort: 'Number of EI30 doors',
                ei60DoorsCountShort: 'Number of EI60 doors',
            },
            liftSpecyfication: {
                capacity: 'Capacity',
                shaftDimension: 'Shaft dimension'
            },
            carousel: {
                capacity: 'Capacity',
                numberOfPassengers: 'Number of passengers',
                speed: 'Speed'
            },
            liftPurpose: {
                passenger: 'Passenger',
                freightPassenger: 'Freight and passenger',
                hospital: 'Hospital',
                fire: 'Firefighting'
            },
            summary: {
                title: 'Summary of previous step'
            },
            accessDiagram: {
                front: 'Front',
                throught: 'Through',
                corner: 'Corner',
                tripartite: 'Tripartite'
            },
            throughCabinNote: 'For a through cabin, the mirror is located on the side wall.'
        },
        finishesAndAccessories: {
            title: 'Finishes and Accessories',
            cabinModel: {
                stainlessSteel: 'Stainless steel',
                ral: 'Ral',
                veneer: 'Veneer',
                veneerSteel: 'Veneer steel',
                melamine: 'Melamine'
            },
            field: {
                extras: 'Extras',
                cabinModel: 'Cabin model',
                cabinColor: 'Cabin color',
                doorColor: 'Door color',
                panel: 'Cabin control panel',
                signal: 'Floor indicator',
                ceiling: 'Ceilings',
                mirror: 'Mirrors',
                handrail: 'Handrails',
                flooring: 'Flooring',
                energyRecovery: 'Energy recovery system',
                antiVibrationSystems: 'Additional anti-vibration system',
                cabinMonitoringSystem: 'Cabin monitoring installation',
                shaftLighting: 'Shaft lighting',
                increaseSpeed: 'Increase speed to 1.6 m/s',
            },
            manufactureOfDoors: {
                RAL_7040: 'RAL 7040',
                RAL_9006: 'RAL 9006',
                RAL_7016: 'RAL 7016',
                RAL_9005: 'RAL 9005',
                RAL_9016: 'RAL 9016',
                STAINLESS_STEEL: 'Stainless steel',
            }
        }
    },
    elevatorDetail: {
        details: 'Details',
        basePrice: 'Base price',
        params: 'Parameters',
        dimensions: 'Dimensions',
        elements: 'Elements & accessories',
        capacity: 'Capacity',
        persons: 'Passengers',
        speed: 'Speed',
        driveType: 'Drive type',
        maxStops: 'Max stops',
        shaftWidth: 'Shaft width',
        shaftDepth: 'Shaft depth',
        cabinWidth: 'Cabin width',
        cabinDepth: 'Cabin depth',
        cabinHeight: 'Cabin height',
        pitDepth: 'Pit depth',
        overhead: 'Headroom',
    },
}


export default en;