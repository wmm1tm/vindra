import { createContext, useContext, type ReactNode } from 'react';

import { GLOW } from '@/constants/design';

const GlowContext = createContext<number>(GLOW);

/** Levert de actuele gloedsterkte: `GLOW`, of 0 in nachtmodus. */
export function GlowProvider({ nightMode, children }: { nightMode: boolean; children: ReactNode }) {
  return <GlowContext.Provider value={nightMode ? 0 : GLOW}>{children}</GlowContext.Provider>;
}

/** Gloedsterkte voor het huidige scherm (0 = geen gloed). */
export function useGlow(): number {
  return useContext(GlowContext);
}
