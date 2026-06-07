import {Link} from 'react-router'
import {useTranslation} from 'react-i18next'

const Footer = () => {
    const {t} = useTranslation()
    return (
        <div className='mt-[15px] flex flex-col gap-1 items-center justify-center'>
            <div className='flex flex-row gap-1 items-center'>
                <p className='m-0 text-[var(--grey)]'>{t('general.gotProblems')}</p>
                <a className='text-[var(--grey)]' href='mailto:projekty@windywipro.pl'>projekty@windywipro.pl</a>
            </div>
            <Link
                to='/regulamin'
                target='_blank'
                rel='noopener noreferrer'
                className='text-[12px] text-gray-400 hover:text-gray-600 underline'
            >
                {t('terms.link')}
            </Link>
        </div>
    )
}

export default Footer
