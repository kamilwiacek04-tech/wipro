import {useTranslation} from 'react-i18next'
import {images} from '@/constants/images'
import {Link} from 'react-router'

const TermsPage = () => {
    const {t} = useTranslation()
    return (
        <div className='min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4'>
            <div className='w-full max-w-3xl bg-white rounded-2xl shadow-sm p-8'>
                <div className='mb-8 flex justify-center'>
                    <img src={images.logo.image} alt={images.logo.alt} className='h-10' />
                </div>
                <h1 className='text-2xl font-bold text-gray-900 mb-6'>{t('terms.page.title')}</h1>
                <div className='text-gray-700 text-sm leading-relaxed flex flex-col gap-6'>
                    <section>
                        <h2 className='text-base font-semibold text-gray-900 mb-2'>§ 1. Postanowienia ogólne</h2>
                        <p className='m-0'>
                            Niniejszy regulamin określa zasady korzystania z internetowego konfiguratora dźwigów
                            osobowych (dalej: „Konfigurator”), dostępnego pod niniejszą domeną.
                        </p>
                        <p className='m-0 mt-2'>
                            Administratorem Konfiguratora oraz administratorem danych osobowych przetwarzanych
                            w związku z jego działaniem jest <strong>WINDY WIPRO SP. Z O. O.</strong> z siedzibą
                            w Kokotowie 942, 32-002 Węgrzce Wielkie, NIP: 6832103529, REGON: 382308124,
                            KRS: 0000765948, reprezentowana przez Janusza i Krzysztofa Kasperowskich
                            (dalej: „Administrator”).
                        </p>
                    </section>

                    <section>
                        <h2 className='text-base font-semibold text-gray-900 mb-2'>§ 2. Definicje</h2>
                        <ul className='m-0 pl-5 list-disc flex flex-col gap-1'>
                            <li><strong>Konfigurator</strong> — narzędzie internetowe umożliwiające określenie
                                parametrów technicznych i estetycznych dźwigu oraz przesłanie zapytania
                                ofertowego do Administratora.</li>
                            <li><strong>Użytkownik</strong> — osoba fizyczna lub podmiot korzystający
                                z Konfiguratora.</li>
                            <li><strong>Zapytanie ofertowe</strong> — formularz wypełniony i przesłany przez
                                Użytkownika za pośrednictwem Konfiguratora.</li>
                            <li><strong>Oferta</strong> — wycena przygotowana przez Administratora na
                                podstawie Zapytania ofertowego.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className='text-base font-semibold text-gray-900 mb-2'>§ 3. Zasady korzystania z Konfiguratora</h2>
                        <p className='m-0'>
                            Korzystanie z Konfiguratora polega na wypełnieniu wieloetapowego formularza
                            (dane inwestora i inwestycji, parametry szybu, wykończenia i akcesoria kabiny)
                            oraz przesłaniu Zapytania ofertowego. Po jego przesłaniu Użytkownik otrzymuje
                            automatycznie na podany adres e-mail wstępną Ofertę.
                        </p>
                        <p className='m-0 mt-2'>
                            Wycena przedstawiona w automatycznej Ofercie ma charakter orientacyjny
                            i niewiążący. Ostateczna cena oraz zakres realizacji ustalane są indywidualnie,
                            po kontakcie handlowym i weryfikacji technicznej obiektu przez Administratora.
                        </p>
                    </section>

                    <section>
                        <h2 className='text-base font-semibold text-gray-900 mb-2'>§ 4. Odpowiedzialność</h2>
                        <p className='m-0'>
                            Administrator dokłada starań, aby dane prezentowane w Konfiguratorze
                            (w tym ceny, parametry techniczne i dostępność wykończeń) były aktualne, jednak
                            nie gwarantuje ostatecznej ceny inwestycji bez indywidualnej weryfikacji
                            technicznej. Administrator nie ponosi odpowiedzialności za decyzje podjęte
                            wyłącznie na podstawie wstępnej, automatycznej Oferty.
                        </p>
                    </section>

                    <section>
                        <h2 className='text-base font-semibold text-gray-900 mb-2'>§ 5. Dane osobowe</h2>
                        <p className='m-0'>
                            Dane osobowe podane w Zapytaniu ofertowym (m.in. imię i nazwisko, adres e-mail,
                            numer telefonu, dane firmy) przetwarzane są przez Administratora w celu obsługi
                            Zapytania ofertowego i kontaktu handlowego, na podstawie art. 6 ust. 1 lit. b)
                            RODO (podjęcie działań przed zawarciem umowy) oraz lit. f) RODO (prawnie
                            uzasadniony interes Administratora polegający na prowadzeniu korespondencji
                            handlowej).
                        </p>
                        <p className='m-0 mt-2'>
                            Dane przechowywane są przez okres niezbędny do realizacji Zapytania ofertowego,
                            a następnie przez okres przedawnienia ewentualnych roszczeń. Dane nie są
                            przekazywane do państw trzecich ani wykorzystywane do zautomatyzowanego
                            podejmowania decyzji (profilowania).
                        </p>
                        <p className='m-0 mt-2'>
                            Użytkownikowi przysługuje prawo dostępu do danych, ich sprostowania, usunięcia,
                            ograniczenia przetwarzania, wniesienia sprzeciwu oraz przenoszenia danych,
                            a także prawo wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych.
                            W sprawach dotyczących danych osobowych można kontaktować się z Administratorem
                            pod adresem <a className='text-[var(--primary)] underline' href='mailto:projekty@windywipro.pl'>projekty@windywipro.pl</a>.
                        </p>
                    </section>

                    <section>
                        <h2 className='text-base font-semibold text-gray-900 mb-2'>§ 6. Pliki cookies</h2>
                        <p className='m-0'>
                            Konfigurator nie wykorzystuje obecnie plików cookies do celów analitycznych ani
                            marketingowych. Wykorzystywane są wyłącznie mechanizmy techniczne niezbędne do
                            prawidłowego działania formularza (przechowywanie stanu wypełnianego formularza
                            w przeglądarce Użytkownika).
                        </p>
                    </section>

                    <section>
                        <h2 className='text-base font-semibold text-gray-900 mb-2'>§ 7. Reklamacje i kontakt</h2>
                        <p className='m-0'>
                            Wszelkie uwagi i reklamacje dotyczące działania Konfiguratora lub przesłanej
                            Oferty można zgłaszać na adres e-mail{' '}
                            <a className='text-[var(--primary)] underline' href='mailto:projekty@windywipro.pl'>projekty@windywipro.pl</a>.
                        </p>
                    </section>

                    <section>
                        <h2 className='text-base font-semibold text-gray-900 mb-2'>§ 8. Postanowienia końcowe</h2>
                        <p className='m-0'>
                            Administrator zastrzega sobie prawo do zmiany niniejszego regulaminu. Zmiany
                            wchodzą w życie z chwilą publikacji nowej treści pod niniejszym adresem.
                            W sprawach nieuregulowanych niniejszym regulaminem zastosowanie mają przepisy
                            prawa polskiego.
                        </p>
                        <p className='m-0 mt-2 text-gray-400'>Regulamin obowiązuje od dnia 31.08.2026.</p>
                    </section>
                </div>
                <div className='mt-10 pt-6 border-t border-gray-100'>
                    <Link to='/' className='text-[var(--primary)] text-sm underline'>
                        {t('terms.page.backToForm')}
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default TermsPage
