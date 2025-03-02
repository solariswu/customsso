import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enJSON from './I18n/en.json'
import ptJSON from './I18n/pt.json'


i18n
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    resources: {
      en: { ...enJSON },
      pt: { ...ptJSON },
    },
    lng: "en",
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    }

  });


export default i18n;