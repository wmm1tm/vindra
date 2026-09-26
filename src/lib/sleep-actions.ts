import type { SQLiteDatabase } from 'expo-sqlite';

import type { EventKind } from '@/constants/event-types';
import { closeEvent, getOpenEvents, type EventRow } from '@/db/events';
import { safeEndTime } from '@/lib/time';

/** Sluit ALLE lopende sessies van dit type (normaal één; twee als twee toestellen offline
 * elk een slaap startten) af op `at`, nooit vóór hun eigen start (safeEndTime). Een sessie
 * die pas ná `at` begon blijft lopen. Geeft de gewijzigde rijen terug, om te tonen en te
 * pushen. */
export async function stopOpenSessions(
  db: SQLiteDatabase,
  childId: string,
  kind: EventKind,
  at: Date
): Promise<EventRow[]> {
  const open = await getOpenEvents(db, childId, kind);
  const changed: EventRow[] = [];
  for (const running of open) {
    if (new Date(running.start_at).getTime() >= at.getTime()) continue;
    const end = safeEndTime(running.start_at, at);
    const updatedAt = await closeEvent(db, running.id, end);
    changed.push({ ...running, end_at: end.toISOString(), updated_at: updatedAt });
  }
  return changed;
}
