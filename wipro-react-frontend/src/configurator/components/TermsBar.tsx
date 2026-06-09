import {useState} from 'react'
import {Link} from 'react-router'
import {useTranslation} from 'react-i18next'
import {X} from 'lucide-react'

const TermsBar = () => {
    const {t} = useTranslation()
    const [dismissed, setDismissed] = useState(false)

    if (dismissed) return null

    return (
        <div className='fixed bottom-5 left-1/2 -translate-x-1/2 z-40 px-4 w-full max-w-xl pointer-events-none'>
            <div className='pointer-events-auto flex items-center gap-3 bg-[var(--secondary)] text-white rounded-2xl px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.22)] ring-1 ring-white/10'>
                <span
                    className='shrink-0 w-1.5 h-8 rounded-full'
                    style={{background: 'var(--primary)'}}
                />
                <p className='flex-1 text-[13px] leading-snug text-white/80'>
                    {t('terms.bar.text')}{' '}
                    <Link
                        to='/regulamin'
                        target='_blank'
                        rel='noopener noreferrer'
                        className='font-semibold text-[var(--primary)] hover:brightness-110 transition-all underline-offset-2 hover:underline'
                    >
                        {t('terms.bar.link')}
                    </Link>
                </p>
                <button
                    onClick={() => setDismissed(true)}
                    className='shrink-0 flex items-center justify-center bg-transparent border-none p-0 cursor-pointer text-[var(--primary)] hover:brightness-125 transition-all'
                    aria-label='Zamknij'
                >
                    <X className='w-4 h-4' />
                </button>
            </div>
        </div>
    )
}

export default TermsBar
