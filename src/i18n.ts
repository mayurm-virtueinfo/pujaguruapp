import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './locales/en/translation.json';
import hi from './locales/hi/translation.json';

const resources = {
  en: { translation: en },
  hi: { translation: hi },
};

const LANGUAGE_KEY = 'appLanguage';

const initI18next = async () => {
  const storedLang = await AsyncStorage.getItem(LANGUAGE_KEY);
  const defaultLang = storedLang || 'en';

  await i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: defaultLang,
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
    });
};

export default i18n;

export const initializeI18n = initI18next;

export const changeLanguage = async (lng: string) => {
  await i18n.changeLanguage(lng);
  await AsyncStorage.setItem(LANGUAGE_KEY, lng);
};
