import {useState} from 'react'
import {Link} from 'react-router'
import {useTranslation} from 'react-i18next'
import {X} from 'lucide-react'

const TermsBar = () => {
    const {t} = useTranslation()
    const [dismissed, setDismissed] = useState(false)

    if (dismissed) return null

    return (
        <div className='fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-center gap-4 shadow-lg'>
            <p className='text-[13px] text-gray-600 text-center'>
                {t('terms.bar.text')}{' '}
                <Link
                    to='/regulamin'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-[var(--primary)] underline font-medium'
                >
                    {t('terms.bar.link')}
                </Link>
            </p>
            <button
                onClick={() => setDismissed(true)}
                className='flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors'
                aria-label='Zamknij'
            >
                <X className='w-4 h-4' />
            </button>
        </div>
    )
}

export default TermsBar
