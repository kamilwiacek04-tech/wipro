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
                <div className='text-gray-500 text-sm italic'>
                    <p>{t('terms.page.placeholder')}</p>
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
