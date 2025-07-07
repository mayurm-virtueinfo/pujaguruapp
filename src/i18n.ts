import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';

import en from './locales/en/translation.json';
import hi from './locales/hi/translation.json';

const resources = {
  en: {translation: en},
  hi: {translation: hi},
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;

export const changeLanguage = (lng: string) => {
  i18n.changeLanguage(lng);
};
