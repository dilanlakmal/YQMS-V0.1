// src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import translationEN from '../lang/locales/en/en_trans.json';
import translationKM from '../lang/locales/kh/kh_trans.json';
import translationCH from '../lang/locales/ch/ch_trans.json';

const resources = {
  en: {
    translation: translationEN
  },
  kh: {
    translation: translationKM
  },
  ch: {
    translation: translationCH
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
