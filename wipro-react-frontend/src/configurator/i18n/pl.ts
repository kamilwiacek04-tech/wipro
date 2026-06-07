const pl = {
    navigation: {
        step: 'Krok {{step}}: {{title}}',
        steps: {
            data: 'Dane kontaktowe',
            shaftParameters: 'Parametry',
            finishesAndAccessories: 'Wykończenia i dodatki',
        }
    },
    general: {
        loading: 'Ładowanie',
        enterData: 'Wprowadź dane',
        select: 'Wybierz',
        details: 'Szczegóły',
        noImage: 'brak zdjęcia',
        return: 'Powrót',
        gotProblems: 'Napotkałeś problem? Wyślij maila na adres:',
        modalSuccess: {
            info: 'Sukces',
            infoDetails: 'Na maila {{email}} otrzymasz podsumowanie kalkulatora.',
            confirm: 'Potwierdź',
        },
        modalError: {
            info: 'Błąd',
            infoDetails: 'Wystąpił błąd wysłania danych. Spróbuj ponownie.',
            confirm: 'Wróć'
        }
    },
    form: {
        goNext: 'Dalej',
        submit: 'Wyślij',
        data: {
            title: 'Dane kontaktowe',
            sections: {
                contact: 'Dane kontaktowe',
                company: 'Dane firmy',
                installAddress: 'Miejsce montażu windy',
                other: 'Pozostałe',
            },
            fields: {
                name: 'Imię i nazwisko',
                email: 'Adres e-mail',
                phoneNumber: 'Numer telefonu',
                companyName: 'Nazwa firmy',
                nip: 'NIP',
                street: 'Ulica',
                houseNo: 'Numer budynku',
                localNo: 'Numer lokalu',
                postalCode: 'Kod pocztowy',
                city: 'Miejscowość',
                status: 'Status',
                investor: 'Nazwa inwestycji',
                additionalNotes: 'Dodatkowe informacje',
            },
            status: {
                contractor: 'Wykonawca',
                owner: 'Właściciel',
                architect: 'Architekt',
                costEstimator: 'Kosztorysant'
            }
        },
        errors: {
            require: 'Pole wymagane',
            invalidPhone: 'Niepoprawny numer telefonu',
            minPhoneNumbers: 'Pole musi mieć minimalnie 9 cyfr',
            maxPhoneNumbers: 'Pole może mieć maksymalnie 15 cyfr',
            invalidEmail: 'Niepoprawny adres email',
            invalidValue: 'Niepoprawna wartość',
            positive: 'Pole musi być liczbą dodatnią',
            intiger: 'Pole musi być liczbą całkowitą',
            number: 'Pole musi być liczbą',
            invalidPostalCode: 'Kod pocztowy musi mieć postać XX-XXX',
            invalidNip: 'NIP musi składać się z 10 cyfr (np. 1234567890 lub 123-456-78-90)',
            mustSelect: 'Musisz wybrać windę',
            maxNumber: 'Pole nie może być większe niż {{number}}',
            minNumber: 'Pole nie może być mniejsze niż {{number}}',
            sumOfDoors: 'Suma liczby drzwi klasy EI30 i EI60 nie może przekroczyć liczby dojść'
        },
        shaftParameters: {
            title: 'Parametry szybu',
            fields: {
                wannaProvide: 'Chcę podać {{field}}',
                capacity: 'Udźwig',
                shaftDimension: 'Wymiary szybu',
                shaftLen: 'Szerokość szybu',
                shaftDep: 'Głębokość szybu',
                stopDoorsCount: 'Liczba przystanków',
                accessCount: 'Liczba dojść',
                liftingHeight: 'Wysokość podnoszenia',
                liftType: 'Typ windy',
                liftParameter: 'Parametry windy',
                pitDepth: 'Głębokość podszybia',
                headroom: 'Wysokość nadszybia',
                ei30DoorsCount: 'Liczba drzwi o klasie odporności ogniowej EI30',
                ei60DoorsCount: 'Liczba drzwi o klasie odporności ogniowej EI60',
                accessDiagram: 'Schemat dojścia',
                leftSideMechanic: 'Mechanika po lewej stronie',
                ei30DoorsCountShort: 'Liczba drzwi EI30',
                ei60DoorsCountShort: 'Liczba drzwi EI60',
            },
            liftSpecyfication: {
                capacity: 'Udźwig',
                shaftDimension: 'Wymiary szybu'
            },
            carousel: {
                capacity: 'Udźwig',
                numberOfPassengers: 'Liczba pasażerów',
                speed: 'Prędkość'
            },
            liftPurpose: {
                passenger: 'Osobowa',
                freightPassenger: 'Towarowo-osobowa',
                hospital: 'Szpitalna',
                fire: 'Pożarowa'
            },
            summary: {
                title: 'Podsumowanie poprzedniego kroku'
            },
            accessDiagram: {
                front: 'Frontowe',
                throught: 'Przelotowe',
                corner: 'Kątowe',
                tripartite: 'Trójstronne'
            },
            throughCabinNote: 'W przypadku kabiny przelotowej lustro występuje na bocznej ścianie.'
        },
        finishesAndAccessories: {
            title: 'Wykończenia i dodatki',
            cabinModel: {
                stainlessSteel: 'Stal nierdzewna',
                ral: 'Ral',
                veneer: 'Fornir',
                veneerSteel: 'Fornir - stal',
                melamine: 'Melamina'
            },
            field: {
                extras: 'Dodatki',
                cabinModel: 'Model kabiny',
                cabinColor: 'Kolor kabiny',
                doorColor: 'Kolor drzwi',
                panel: 'Panel dyspozycji w kabinie',
                signal: 'Sygnalizacja przystanków',
                ceiling: 'Sufity',
                mirror: 'Lustra',
                handrail: 'Poręcze',
                flooring: 'Wykładzina',
                energyRecovery: 'System odzysku energii',
                antiVibrationSystems: 'Dodatkowy system antywibracyjny',
                cabinMonitoringSystem: 'Instalacja do monitoringu kabiny',
                shaftLighting: 'Oświetlenie szybu',
                increaseSpeed: 'Zwiększenie prędkości do 1,6 m/s',
            },
            manufactureOfDoors: {
                RAL_7040: 'RAL 7040',
                RAL_9006: 'RAL 9006',
                RAL_7016: 'RAL 7016',
                RAL_9005: 'RAL 9005',
                RAL_9016: 'RAL 9016',
                STAINLESS_STEEL: 'Stal nierdzewna',
            }
        }
    },
    terms: {
        bar: {
            text: 'Przechodząc do kolejnego kroku, akceptujesz nasz',
            link: 'regulamin',
        },
        link: 'Regulamin',
        page: {
            title: 'Regulamin',
            placeholder: 'Treść regulaminu zostanie tutaj opublikowana.',
            backToForm: '← Wróć do formularza',
        },
    },
    elevatorDetail: {
        details: 'Szczegóły',
        basePrice: 'Cena bazowa',
        params: 'Parametry',
        dimensions: 'Wymiary',
        elements: 'Elementy i akcesoria',
        capacity: 'Udźwig',
        persons: 'Liczba pasażerów',
        speed: 'Prędkość',
        driveType: 'Typ napędu',
        maxStops: 'Maks. liczba przystanków',
        shaftWidth: 'Szerokość szybu',
        shaftDepth: 'Głębokość szybu',
        cabinWidth: 'Szerokość kabiny',
        cabinDepth: 'Głębokość kabiny',
        cabinHeight: 'Wysokość kabiny',
        pitDepth: 'Głębokość podszybia',
        overhead: 'Wysokość nadszybia',
    },
}


export default pl;
export type Translations = typeof pl;