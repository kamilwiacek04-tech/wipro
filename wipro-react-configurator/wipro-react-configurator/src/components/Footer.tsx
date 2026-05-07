import React from 'react'
import '@/assets/styles/components/Footer.css'
import { useTranslation } from 'react-i18next'

const Footer = () => {
    const {t} = useTranslation();

  return (
    <div className='footerContainer'>
        <p className='footerParagraph'>{t('general.gotProblems')}</p>
        <a className='footerParagraph' href='mailto:projekty@windywipro.pl'>projekty@windywipro.pl</a>
    </div>
  )
}

export default Footer