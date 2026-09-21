import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useSQLiteContext } from 'expo-sqlite';

import {
  getChildSettings,
  updateChildSettings,
  type ChildSettings,
  type ChildSettingsUpdate,
} from '@/db/child';
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
  save: (patch: ChildSettingsUpdate) => Promise<void>;
  refresh: () => Promise<void>;
}

const PreferencesContext = createContext<PreferencesContextValue>({
  ...DEFAULT_SETTINGS,
  save: async () => {},
  refresh: async () => {},
});

/** Instellingen horen bij het actieve kind — wisselen van kind (zie ActiveChildProvider)
 * ververst deze automatisch, zodat elk kind zijn eigen wiel/etc. behoudt. */
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const { childId } = useActiveChild();
  const [settings, setSettings] = useState<ChildSettings>(DEFAULT_SETTINGS);

  const refresh = useCallback(async () => {
    if (!childId) return;
    const next = await getChildSettings(db, childId);
    setSettings(next);
  }, [db, childId]);

  useEffect(() => {
    if (!childId) return;
    let ignore = false;
    (async () => {
      const next = await getChildSettings(db, childId);
      if (!ignore) setSettings(next);
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

  return (
    <PreferencesContext.Provider value={{ ...settings, save, refresh }}>{children}</PreferencesContext.Provider>
  );
}

export function usePreferences() {
  return useContext(PreferencesContext);
}
