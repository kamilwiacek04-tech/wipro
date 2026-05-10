import { useTranslation } from 'react-i18next'

const Footer = () => {
    const {t} = useTranslation();

  return (
    <div className="mt-[15px] flex flex-row gap-1 items-center justify-center">
        <p className="m-0 text-[var(--grey)]">{t('general.gotProblems')}</p>
        <a className="text-[var(--grey)]" href='mailto:projekty@windywipro.pl'>projekty@windywipro.pl</a>
    </div>
  )
}

export default Footer
