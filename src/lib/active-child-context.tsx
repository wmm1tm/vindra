import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useSQLiteContext } from 'expo-sqlite';

import { getActiveChildId, setActiveChildId } from '@/db/child';

interface ActiveChildContextValue {
  /** null tijdens de allereerste laadslag; daarna altijd een geldig kind-id. */
  childId: string | null;
  setChildId: (id: string) => Promise<void>;
}

const ActiveChildContext = createContext<ActiveChildContextValue>({
  childId: null,
  setChildId: async () => {},
});

export function ActiveChildProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [childId, setChildIdState] = useState<string | null>(null);

  useEffect(() => {
    getActiveChildId(db).then(setChildIdState);
  }, [db]);

  const setChildId = useCallback(
    async (id: string) => {
      await setActiveChildId(db, id);
      setChildIdState(id);
    },
    [db]
  );

  // Nog niets geladen: even niets renderen in plaats van met een tijdelijk/verkeerd
  // kind-id te starten (dat zou heel even data van het verkeerde kind kunnen tonen).
  if (childId === null) return null;

  return <ActiveChildContext.Provider value={{ childId, setChildId }}>{children}</ActiveChildContext.Provider>;
}

export function useActiveChild() {
  return useContext(ActiveChildContext);
}
