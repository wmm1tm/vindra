import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import type { SQLiteDatabase } from 'expo-sqlite';

import { EVENT_TYPES, isKnownEventKind, resolveWheelOrder, type EventKind, type WheelEntry } from '@/constants/event-types';
import { closeEvent, getActiveEvent, getEventsForRange, insertMomentEvent, type EventRow } from '@/db/events';
import type { Dictionary } from '@/lib/i18n/translations';
import type { PendingLog, QuickLogButton, QuickLogProps } from '@/widgets/quick-log-widget';

type QuickLogWidget = typeof import('@/widgets/quick-log-widget').QuickLog;

const WIDGET_BUTTON_COUNT = 4;
const SLEEP_KIND: EventKind = 'slaap';
const DAY_MS = 24 * 60 * 60 * 1000;
/** Tikken van langer geleden dan dit negeren we (bv. een widget die maanden onaangeraakt
 * stond en ineens weer gelezen wordt): liever niets loggen dan iets op een rare dag. */
const MAX_PENDING_AGE_MS = 7 * DAY_MS;

let cachedWidget: QuickLogWidget | null | undefined;

/** De widget-module laadt een native iOS-module die in Expo Go en op Android/web niet
 * bestaat; daar zou een gewone import de hele app laten crashen. Dus lui laden, alleen op
 * iOS buiten Expo Go, en een mislukking gewoon als "geen widget" behandelen. */
function getWidget(): QuickLogWidget | null {
  if (cachedWidget !== undefined) return cachedWidget;
  cachedWidget = null;
  if (Platform.OS !== 'ios' || Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cachedWidget = (require('@/widgets/quick-log-widget') as typeof import('@/widgets/quick-log-widget')).QuickLog;
  } catch (error) {
    console.warn('[widget] niet beschikbaar', error);
  }
  return cachedWidget;
}

function dayRange(dayStartHour: number) {
  const start = new Date();
  if (start.getHours() < dayStartHour) start.setDate(start.getDate() - 1);
  start.setHours(dayStartHour, 0, 0, 0);
  return { start, end: new Date(start.getTime() + DAY_MS) };
}

function mayLog(kind: EventKind, entitled: boolean) {
  return entitled || !EVENT_TYPES[kind].requiresPremium;
}

/** De wielknoppen die op de widget komen: de eerste die je mag loggen, in wielvolgorde
 * (duur-types alleen slaap). Ook gebruikt door "Wiel aanpassen" om ze te markeren. */
export function widgetEntries(wheelOrder: WheelEntry[], entitled: boolean): WheelEntry[] {
  return wheelOrder
    .filter(
      (entry) =>
        entry.kind && mayLog(entry.kind, entitled) && (!EVENT_TYPES[entry.kind].isDuration || entry.kind === SLEEP_KIND)
    )
    .slice(0, WIDGET_BUTTON_COUNT);
}

/** Zet één wachtende widget-tik om in een database-wijziging. Geeft de nieuwe of gewijzigde
 * rij terug, of null als de tik niets (meer) betekent: een start terwijl er al een slaap
 * loopt, een stop zonder lopende slaap of van vóór de start, of een type dat de gebruiker
 * zonder abonnement niet mag loggen. */
async function applyPending(db: SQLiteDatabase, childId: string, item: PendingLog, entitled: boolean) {
  if (!isKnownEventKind(item.k) || !mayLog(item.k, entitled)) return null;
  const type = EVENT_TYPES[item.k];
  const at = new Date(item.t);

  if (!type.isDuration) return insertMomentEvent(db, childId, item.k, at);
  if (item.k !== SLEEP_KIND) return null;

  const active = await getActiveEvent(db, childId, item.k);
  if (item.a === 'start') {
    if (active) return null;
    return insertMomentEvent(db, childId, item.k, at);
  }
  if (item.a === 'stop') {
    if (!active || new Date(active.start_at).getTime() >= item.t) return null;
    const updatedAt = await closeEvent(db, active.id, at);
    return { ...active, end_at: at.toISOString(), updated_at: updatedAt };
  }
  return null;
}

/** Leest de tikken die op de widget gedaan zijn sinds de vorige keer, zet ze op volgorde als
 * echte events in de database, en schrijft daarna verse props terug (lege `pending`, tellers
 * van vandaag, de echte slaapstand en de knoppen die de gebruiker mag loggen). Veilig om vaak
 * aan te roepen: bij app-start, bij terugkomen naar de voorgrond en na elke log.
 *
 * Geeft de rijen terug die zijn aangemaakt of gewijzigd, zodat de aanroeper ze kan
 * synchroniseren met de partner. Zonder abonnement toont de widget alleen gratis typen
 * (gedrag); slaap starten en stoppen hoort bij het abonnement, net als in de app.
 *
 * Dubbel verwerken wordt voorkomen doordat `pending` direct na het importeren wordt geleegd;
 * een tik die precies tussen lezen en terugschrijven valt, kan in theorie verloren gaan
 * (milliseconden-venster), wat we accepteren boven een ingewikkelder protocol. */
export async function syncWidget(
  db: SQLiteDatabase,
  childId: string,
  wheelConfig: string[] | null,
  dayStartHour: number,
  entitled: boolean,
  use12h: boolean,
  t: Dictionary
): Promise<EventRow[]> {
  const widget = getWidget();
  if (!widget) return [];

  const changed: EventRow[] = [];
  try {
    const timeline = await widget.getTimeline();
    const seen = new Set<string>();
    const pending: PendingLog[] = [];
    for (const entry of timeline) {
      for (const item of (entry.props as QuickLogProps | undefined)?.pending ?? []) {
        const key = `${item.k}-${item.t}-${item.a ?? ''}`;
        if (seen.has(key)) continue;
        seen.add(key);
        pending.push(item);
      }
    }
    pending.sort((a, b) => a.t - b.t);
    const now = Date.now();
    for (const item of pending) {
      if (now - item.t > MAX_PENDING_AGE_MS || item.t > now + 60_000) continue;
      const row = await applyPending(db, childId, item, entitled);
      if (row) changed.push(row);
    }
  } catch (error) {
    console.warn('[widget] uitlezen mislukt', error);
  }

  try {
    const { start, end } = dayRange(dayStartHour);
    const todays = await getEventsForRange(db, childId, start, end);
    const allowed = widgetEntries(resolveWheelOrder(wheelConfig), entitled);
    const activeSleep = allowed.some((entry) => entry.kind === SLEEP_KIND)
      ? await getActiveEvent(db, childId, SLEEP_KIND)
      : null;
    const buttons: QuickLogButton[] = allowed.map((entry) => {
      const kind = entry.kind!;
      const isSleep = kind === SLEEP_KIND;
      return {
        id: kind,
        label: EVENT_TYPES[kind].label(t),
        symbol: EVENT_TYPES[kind].widgetSymbol,
        color: EVENT_TYPES[kind].color,
        count: todays.filter((event) => event.kind === kind).length,
        ...(isSleep ? { sleep: true, since: activeSleep ? new Date(activeSleep.start_at).getTime() : 0 } : {}),
      };
    });
    widget.updateSnapshot({
      title: 'Vindra',
      totalLabel: t.widget.today,
      total: todays.length,
      buttons,
      pending: [],
      sleepStartLabel: t.widget.sleepStart,
      sleepSinceLabel: t.widget.sleepSince,
      use12h,
      lockedHint: entitled ? '' : t.widget.lockedHint,
    });
  } catch (error) {
    console.warn('[widget] bijwerken mislukt', error);
  }

  return changed;
}
