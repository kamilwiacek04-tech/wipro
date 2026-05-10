import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en';
import pl from './pl';

i18next
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      pl: { translation: pl },
    },
    lng: 'pl',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18next;