import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en.json";
import hi from "./locales/hi.json";
import bn from "./locales/bn.json";
import te from "./locales/te.json";
import mr from "./locales/mr.json";
import ta from "./locales/ta.json";
import ur from "./locales/ur.json";
import gu from "./locales/gu.json";
import kn from "./locales/kn.json";
import or from "./locales/or.json";
import ml from "./locales/ml.json";
import pa from "./locales/pa.json";
import as from "./locales/as.json";
import mai from "./locales/mai.json";
import sa from "./locales/sa.json";
import ks from "./locales/ks.json";
import ne from "./locales/ne.json";
import sd from "./locales/sd.json";
import kok from "./locales/kok.json";
import doi from "./locales/doi.json";
import mni from "./locales/mni.json";
import sat from "./locales/sat.json";
import brx from "./locales/brx.json";

export const SUPPORTED_LANGUAGES: { code: string; name: string; native: string }[] = [
  { code: "en", name: "English", native: "English" },
  { code: "hi", name: "Hindi", native: "हिन्दी" },
  { code: "bn", name: "Bengali", native: "বাংলা" },
  { code: "te", name: "Telugu", native: "తెలుగు" },
  { code: "mr", name: "Marathi", native: "मराठी" },
  { code: "ta", name: "Tamil", native: "தமிழ்" },
  { code: "ur", name: "Urdu", native: "اردو" },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ" },
  { code: "or", name: "Odia", native: "ଓଡ଼ିଆ" },
  { code: "ml", name: "Malayalam", native: "മലയാളം" },
  { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ" },
  { code: "as", name: "Assamese", native: "অসমীয়া" },
  { code: "mai", name: "Maithili", native: "मैथिली" },
  { code: "sa", name: "Sanskrit", native: "संस्कृतम्" },
  { code: "ks", name: "Kashmiri", native: "कॉशुर" },
  { code: "ne", name: "Nepali", native: "नेपाली" },
  { code: "sd", name: "Sindhi", native: "سنڌي" },
  { code: "kok", name: "Konkani", native: "कोंकणी" },
  { code: "doi", name: "Dogri", native: "डोगरी" },
  { code: "mni", name: "Manipuri", native: "মৈতৈলোন্" },
  { code: "sat", name: "Santali", native: "ᱥᱟᱱᱛᱟᱲᱤ" },
  { code: "brx", name: "Bodo", native: "बड़ो" },
];

export const RTL_LANGUAGES = new Set(["ur", "sd", "ks"]);

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      bn: { translation: bn },
      te: { translation: te },
      mr: { translation: mr },
      ta: { translation: ta },
      ur: { translation: ur },
      gu: { translation: gu },
      kn: { translation: kn },
      or: { translation: or },
      ml: { translation: ml },
      pa: { translation: pa },
      as: { translation: as },
      mai: { translation: mai },
      sa: { translation: sa },
      ks: { translation: ks },
      ne: { translation: ne },
      sd: { translation: sd },
      kok: { translation: kok },
      doi: { translation: doi },
      mni: { translation: mni },
      sat: { translation: sat },
      brx: { translation: brx },
    },
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "edulinker-lang",
    },
  });

const applyDir = (lng: string) => {
  const dir = RTL_LANGUAGES.has(lng) ? "rtl" : "ltr";
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("lang", lng);
    document.documentElement.setAttribute("dir", dir);
  }
};
applyDir(i18n.language || "en");
i18n.on("languageChanged", applyDir);

export default i18n;