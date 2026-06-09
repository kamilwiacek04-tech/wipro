import {useState} from 'react'
import {Link} from 'react-router'
import {useTranslation} from 'react-i18next'
import {X, Info} from 'lucide-react'

const TermsBar = () => {
    const {t} = useTranslation()
    const [dismissed, setDismissed] = useState(false)

    if (dismissed) return null

    return (
        <div className='fixed bottom-0 left-0 right-0 z-40 flex items-center justify-center px-4 py-2.5 bg-amber-50 border-t border-amber-200 shadow-[0_-2px_12px_rgba(0,0,0,0.06)]'>
            <div className='flex items-center gap-2.5 max-w-2xl w-full'>
                <Info className='w-4 h-4 text-amber-500 shrink-0' />
                <p className='flex-1 text-[13px] text-amber-900 leading-snug'>
                    {t('terms.bar.text')}{' '}
                    <Link
                        to='/regulamin'
                        target='_blank'
                        rel='noopener noreferrer'
                        className='font-semibold underline underline-offset-2 hover:text-amber-700 transition-colors'
                    >
                        {t('terms.bar.link')}
                    </Link>
                </p>
                <button
                    onClick={() => setDismissed(true)}
                    className='shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-amber-600 hover:bg-amber-100 transition-colors'
                    aria-label='Zamknij'
                >
                    <X className='w-3.5 h-3.5' />
                </button>
            </div>
        </div>
    )
}

export default TermsBar
