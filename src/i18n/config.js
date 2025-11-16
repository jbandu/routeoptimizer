import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslations from './locales/en.json';
import esTranslations from './locales/es.json';

// Configure i18next
i18n
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass i18n to react-i18next
  .init({
    resources: {
      en: {
        translation: enTranslations
      },
      es: {
        translation: esTranslations
      }
    },
    fallbackLng: 'es', // Default to Spanish for COPA
    lng: localStorage.getItem('copa-language') || 'es', // Use stored preference or default to Spanish

    interpolation: {
      escapeValue: false // React already escapes values
    },

    // Detection options
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'copa-language'
    },

    // Debugging (disable in production)
    debug: import.meta.env.DEV
  });

// Save language preference when it changes
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('copa-language', lng);
  document.documentElement.lang = lng;
});

export default i18n;
