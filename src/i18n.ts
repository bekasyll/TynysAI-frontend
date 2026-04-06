import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { ru, enUS } from 'date-fns/locale';
import type { Locale } from 'date-fns';
import ruTranslation from './locales/ru.json';
import enTranslation from './locales/en.json';
import kkTranslation from './locales/kk.json';

const savedLang = localStorage.getItem('lang') ?? 'ru';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      ru: { translation: ruTranslation },
      en: { translation: enTranslation },
      kk: { translation: kkTranslation },
    },
    lng: savedLang,
    fallbackLng: 'ru',
    interpolation: {
      escapeValue: false,
    },
  });

export function getDateLocale(lang: string): Locale {
  if (lang === 'en') return enUS;
  return ru;
}

export function setLanguage(lang: string) {
  localStorage.setItem('lang', lang);
  i18n.changeLanguage(lang);
}

export default i18n;
