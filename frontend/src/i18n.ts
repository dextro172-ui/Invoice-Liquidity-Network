import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "../public/locales/en/translation.json";
import es from "../public/locales/es/translation.json";

const resources = {
  en: { translation: en },
  es: { translation: es },
};

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: "en",
      supportedLngs: ["en", "es"],
      defaultNS: "translation",
      ns: ["translation"],
      interpolation: {
        escapeValue: false,
      },
      detection: {
        order: ["localStorage", "navigator"],
        caches: ["localStorage"],
        lookupLocalStorage: "language",
      },
    });
}

export default i18n;