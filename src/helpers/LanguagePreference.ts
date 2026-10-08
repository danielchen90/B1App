import i18n from "i18next";

// Cross-site language contract (Mary Banks sites): a page opened with ?lang=<code> adopts
// that language, remembers it for later visits, and keeps <html lang/dir> in sync with the
// language actually shown (the hosted sites switcher reads <html lang> and passes it on).
// Only languages the stock ChurchApps locale helper supports are honoured (same list and
// aliases as Locale.supportedLanguages / extraCodes in @churchapps/apphelper, which are private).

const STORAGE_KEY = "b1Lang";
const SUPPORTED = [
  "de", "en", "es", "fr", "hi", "it", "ko", "no", "pt", "ru", "tl", "zh"
];
const ALIASES: Record<string, string> = { nb: "no", nn: "no" };

const isObject = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === "object" && !Array.isArray(v);
const deepMerge = (target: Record<string, unknown>, source: Record<string, unknown>) => {
  for (const key of Object.keys(source)) {
    if (isObject(source[key])) {
      if (!isObject(target[key])) target[key] = {};
      deepMerge(target[key] as Record<string, unknown>, source[key] as Record<string, unknown>);
    } else target[key] = source[key];
  }
  return target;
};

const normalize = (raw: string | null | undefined): string | null => {
  if (!raw) return null;
  const base = raw.trim().toLowerCase().split(/[-_]/)[0];
  if (!base) return null;
  const mapped = ALIASES[base] || base;
  return SUPPORTED.includes(mapped) ? mapped : null;
};

const readCookie = (): string | null => {
  const match = document.cookie.match(new RegExp("(?:^|; )" + STORAGE_KEY + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
};

const remember = (lang: string) => {
  try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* storage blocked */ }
  try { document.cookie = STORAGE_KEY + "=" + encodeURIComponent(lang) + "; path=/; max-age=31536000; SameSite=Lax"; } catch { /* cookies blocked */ }
};

/** The language this visitor chose: ?lang= on this URL (remembered), else the remembered one. */
export const preferredLanguage = (): string | null => {
  if (typeof window === "undefined") return null;
  const fromUrl = normalize(new URLSearchParams(window.location.search).get("lang"));
  if (fromUrl) { remember(fromUrl); return fromUrl; }
  let stored: string | null = null;
  try { stored = localStorage.getItem(STORAGE_KEY); } catch { /* storage blocked */ }
  return normalize(stored) || normalize(readCookie());
};

const syncDocumentLanguage = () => {
  if (typeof document === "undefined") return;
  const lng = (i18n.resolvedLanguage || i18n.language || "en").split("-")[0];
  document.documentElement.lang = lng;
  document.documentElement.dir = i18n.dir(lng);
};

let listening = false;

/** Run after Locale.init: switch to the chosen language (loading its files) and sync <html>. */
export const applyPreferredLanguage = async (backends: string[]) => {
  if (typeof window === "undefined" || !i18n.isInitialized) return;
  const pref = preferredLanguage();
  if (pref && pref !== i18n.resolvedLanguage) {
    let ready = pref === "en" || i18n.hasResourceBundle(pref, "translation");
    if (!ready) {
      let data: Record<string, unknown> = {};
      for (const backend of backends) {
        try {
          const res = await fetch(backend.replace("{{lng}}", pref));
          if (res.ok) data = deepMerge(data, await res.json());
        } catch { /* fall back to what loaded */ }
      }
      if (Object.keys(data).length > 0) {
        i18n.addResourceBundle(pref, "translation", data, true, true);
        ready = true;
      }
    }
    if (ready) await i18n.changeLanguage(pref);
  }
  if (!listening) { i18n.on("languageChanged", syncDocumentLanguage); listening = true; }
  syncDocumentLanguage();
};
