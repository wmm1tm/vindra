import { getLocales } from 'expo-localization';
import { createContext, useContext, useMemo, type ReactNode } from 'react';

import type { LanguageSetting } from '@/db/child';
import { usePreferences } from '@/lib/preferences-context';
import { de, en, es, fr, nl, pt, type Dictionary } from '@/lib/i18n/translations';

// Every LanguageSetting other than 'system' (which resolves to one of these via
// detectDeviceLanguage) is a real, selectable app language — kept as one derived type
// instead of its own union so the two can't drift apart.
export type AppLanguage = Exclude<LanguageSetting, 'system'>;

const DICTIONARIES: Record<AppLanguage, Dictionary> = { nl, en, de, es, fr, pt };
const LOCALE_TAGS: Record<AppLanguage, string> = {
  nl: 'nl-NL',
  en: 'en-US',
  de: 'de-DE',
  es: 'es-ES',
  fr: 'fr-FR',
  pt: 'pt-BR',
};

function detectDeviceLanguage(): AppLanguage {
  const code = getLocales()[0]?.languageCode;
  if (code && code in DICTIONARIES) return code as AppLanguage;
  return 'en';
}

interface I18nContextValue {
  language: AppLanguage;
  localeTag: string;
  t: Dictionary;
}

const I18nContext = createContext<I18nContextValue>({
  language: 'nl',
  localeTag: LOCALE_TAGS.nl,
  t: nl,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const { language: languageSetting } = usePreferences();

  const value = useMemo<I18nContextValue>(() => {
    const language = languageSetting === 'system' ? detectDeviceLanguage() : languageSetting;
    return { language, localeTag: LOCALE_TAGS[language], t: DICTIONARIES[language] };
  }, [languageSetting]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
