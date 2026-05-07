import { useTranslation } from 'react-i18next'

const LanguageSwitcher = () => {
  const { i18n } = useTranslation()
  const isPolish = i18n.language === 'pl'

  return (
    <button
      onClick={() => i18n.changeLanguage(isPolish ? 'en' : 'pl')}
      title={isPolish ? 'Switch to English' : 'Przełącz na Polski'}
      style={{ background: 'none', border: '1px solid #e0e0e0', borderRadius: '6px', padding: '3px 10px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', color: '#888', letterSpacing: '0.05em' }}
    >
      {isPolish ? 'EN' : 'PL'}
    </button>
  )
}

export default LanguageSwitcher
