import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useSQLiteContext } from 'expo-sqlite';

import {
  getChildSettings,
  updateChildSettings,
  type ChildSettings,
  type ChildSettingsUpdate,
} from '@/db/child';
import { getOnboardingDone, setOnboardingDone as persistOnboardingDone } from '@/db/onboarding';
import { useActiveChild } from '@/lib/active-child-context';

const DEFAULT_SETTINGS: ChildSettings = {
  timeFormat: '24h',
  tempUnit: 'celsius',
  volumeUnit: 'ml',
  leftHanded: false,
  dayStartHour: 0,
  wheelConfig: null,
  nightModeAuto: false,
  language: 'system',
  onboardingNameDismissed: false,
};

interface PreferencesContextValue extends ChildSettings {
  /** false tot de instellingen uit de database zijn gelezen. Nodig om bv. de intro niet
   * even te laten opflitsen bij iemand die hem al gedaan heeft. */
  loaded: boolean;
  /** Is de intro bij de eerste start doorlopen of overgeslagen? Toestelniveau, niet per
   * kind (zie db/onboarding.ts), maar hier meegegeven omdat het net als de rest een
   * weergave-instelling is die het hoofdscherm moet kennen. */
  onboardingDone: boolean;
  setOnboardingDone: (done: boolean) => Promise<void>;
  save: (patch: ChildSettingsUpdate) => Promise<void>;
  refresh: () => Promise<void>;
}

const PreferencesContext = createContext<PreferencesContextValue>({
  ...DEFAULT_SETTINGS,
  loaded: false,
  onboardingDone: true,
  setOnboardingDone: async () => {},
  save: async () => {},
  refresh: async () => {},
});

/** Instellingen horen bij het actieve kind — wisselen van kind (zie ActiveChildProvider)
 * ververst deze automatisch, zodat elk kind zijn eigen wiel/etc. behoudt. */
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const { childId } = useActiveChild();
  const [settings, setSettings] = useState<ChildSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [onboardingDone, setOnboardingDoneState] = useState(true);

  const refresh = useCallback(async () => {
    if (!childId) return;
    const next = await getChildSettings(db, childId);
    setSettings(next);
  }, [db, childId]);

  useEffect(() => {
    if (!childId) return;
    let ignore = false;
    (async () => {
      const [next, done] = await Promise.all([getChildSettings(db, childId), getOnboardingDone(db)]);
      if (!ignore) {
        setSettings(next);
        setOnboardingDoneState(done);
        setLoaded(true);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [db, childId]);

  const save = useCallback(
    async (patch: ChildSettingsUpdate) => {
      if (!childId) return;
      await updateChildSettings(db, childId, patch);
      await refresh();
    },
    [db, childId, refresh]
  );

  const setOnboardingDone = useCallback(
    async (done: boolean) => {
      await persistOnboardingDone(db, done);
      setOnboardingDoneState(done);
    },
    [db]
  );

  return (
    <PreferencesContext.Provider value={{ ...settings, loaded, onboardingDone, setOnboardingDone, save, refresh }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  return useContext(PreferencesContext);
}
