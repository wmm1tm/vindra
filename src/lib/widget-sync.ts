import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import type { SQLiteDatabase } from 'expo-sqlite';

import { EVENT_TYPES, isKnownEventKind, resolveWheelOrder, type EventKind, type WheelEntry } from '@/constants/event-types';
import { getAppStateJson, setAppStateJson } from '@/db/app-state';
import {
  closeEvent,
  getEventsForRange,
  getLastClosedEvent,
  getOpenEvents,
  insertMomentEvent,
  softDeleteEvent,
  type EventRow,
} from '@/db/events';
import { dayWindow, logicalDay } from '@/lib/day-window';
import type { Dictionary } from '@/lib/i18n/translations';
import { pullChanges } from '@/lib/sync';
import { safeEndTime } from '@/lib/time';
import type { PendingLog, QuickLogButton, QuickLogProps } from '@/widgets/quick-log-widget';

type QuickLogWidget = typeof import('@/widgets/quick-log-widget').QuickLog;

const WIDGET_BUTTON_COUNT = 4;
const SLEEP_KIND: EventKind = 'slaap';
/** Een tik met een tijdstip verder in de toekomst dan dit (klok van het toestel verzet)
 * verwerken we nog niet; hij blijft in de rij staan. Er is bewust géén maximumleeftijd meer:
 * een tik van gisteren is nog steeds iets wat iemand echt deed. */
const FUTURE_TOLERANCE_MS = 60_000;
/** Stopt de widget een slaap binnen deze tijd na een start UIT DEZELFDE REEKS tikken, dan
 * heffen start en stop elkaar op (per ongeluk getikt). Nooit bij een slaap die de partner of
 * de app zelf startte. Zelfde regel als Nuvo. */
const MIN_SLEEP_MS = 60_000;
/** Zo lang wachten we op een pull (gedeeld kind) voordat widgettikken verwerkt worden. */
const PULL_BEFORE_IMPORT_TIMEOUT_MS = 4000;
/** Verwerkte tik-ids bewaren we zo lang, zodat een tik nooit twee keer geïmporteerd wordt. */
const PROCESSED_TAP_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
const PROCESSED_TAPS_KEY = 'widget_processed_taps';

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

function mayLog(kind: EventKind, entitled: boolean) {
  return entitled || !EVENT_TYPES[kind].requiresPremium;
}

/** De wielknoppen die op de widget komen: de eerste die je mag loggen, in wielvolgorde
 * (duur-types alleen slaap). Ook gebruikt door "Wiel aanpassen" om ze te markeren. Loopt er
 * een slaap, dan blijft de slaapknop er ook zonder abonnement op: een lopende slaap stoppen
 * is altijd gratis. */
export function widgetEntries(wheelOrder: WheelEntry[], entitled: boolean, sleepRunning = false): WheelEntry[] {
  return wheelOrder
    .filter((entry) => {
      if (!entry.kind) return false;
      const isSleep = entry.kind === SLEEP_KIND;
      if (EVENT_TYPES[entry.kind].isDuration && !isSleep) return false;
      return mayLog(entry.kind, entitled) || (isSleep && sleepRunning);
    })
    .slice(0, WIDGET_BUTTON_COUNT);
}

/** Iets waar de app de gebruiker na een widget-import naar moet vragen of over moet melden. */
export type WidgetNotice =
  /** Een "start" van een verouderde widget terwijl er al een slaap liep (van vóór de tik):
   * vraag "Slaap loopt sinds 21:00. Om 06:00 stoppen?". */
  | { kind: 'staleStart'; running: EventRow; tappedAt: Date }
  /** Een "stop" terwijl er geen slaap meer liep (de partner stopte al). */
  | { kind: 'alreadyStopped'; lastEnd: Date | null };

export interface WidgetSyncResult {
  /** Aangemaakte, afgesloten of weggehaalde events — de aanroeper toont ze en pusht ze. */
  changed: EventRow[];
  notices: WidgetNotice[];
}

export interface WidgetSyncOptions {
  db: SQLiteDatabase;
  childId: string;
  wheelConfig: string[] | null;
  isEntitled: boolean;
  use12h: boolean;
  dayStartHour: number;
  /** Is dit kind gedeeld? Dan eerst een pull, zodat een partner-start/-stop meetelt. */
  isShared: boolean;
  /** Titel van de widget: "Vindra", of de naam van het kind als er meer dan één is. */
  title: string;
  t: Dictionary;
}

/** Deterministisch id van een tik: dezelfde tik (ook als hij in meerdere timeline-entries
 * staat) krijgt altijd hetzelfde id. */
export function tapId(item: PendingLog): string {
  return `${item.k}-${item.a ?? ''}-${item.t}`;
}

type ProcessedTaps = Record<string, number>;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | undefined> {
  return Promise.race([promise, new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), ms))]);
}

async function applySleepTap(
  db: SQLiteDatabase,
  childId: string,
  item: PendingLog,
  startedThisBatch: Set<string>,
  notices: WidgetNotice[]
): Promise<EventRow[]> {
  const kind = item.k as EventKind;
  const at = new Date(item.t);
  const open = await getOpenEvents(db, childId, kind);

  if (item.a === 'start') {
    if (open.length === 0) {
      const row = await insertMomentEvent(db, childId, kind, at);
      startedThisBatch.add(row.id);
      return [row];
    }
    const running = open[open.length - 1];
    // Loopt er al een slaap die vóór deze tik begon, en niet uit deze reeks tikken? Dan
    // toonde de widget een verouderde stand ("Start" terwijl de partner al startte): niet
    // stil negeren en geen tweede slaap openen, maar vragen of hij nu gestopt moet worden.
    if (new Date(running.start_at).getTime() < item.t && !startedThisBatch.has(running.id)) {
      notices.push({ kind: 'staleStart', running, tappedAt: at });
    }
    return [];
  }

  if (item.a === 'stop') {
    if (open.length === 0) {
      const last = await getLastClosedEvent(db, childId, kind);
      notices.push({ kind: 'alreadyStopped', lastEnd: last?.end_at ? new Date(last.end_at) : null });
      return [];
    }
    const changed: EventRow[] = [];
    for (const running of open) {
      const startMs = new Date(running.start_at).getTime();
      // Een slaap die pas NA de tik begon (de partner startte later) stoppen we niet.
      if (startMs >= item.t) continue;
      if (startedThisBatch.has(running.id) && item.t - startMs < MIN_SLEEP_MS) {
        const deletedAt = await softDeleteEvent(db, running.id);
        changed.push({ ...running, deleted_at: deletedAt, updated_at: deletedAt });
        continue;
      }
      const end = safeEndTime(running.start_at, at);
      const updatedAt = await closeEvent(db, running.id, end);
      changed.push({ ...running, end_at: end.toISOString(), updated_at: updatedAt });
    }
    return changed;
  }
  return [];
}

/** Verwerkt één tik. Ook knoppen die Pro vereisen worden zonder (actueel) abonnement
 * gelogd: de knop stond op de widget toen er getikt werd, dus de tik was toegestaan. Een
 * lopende slaap stoppen kan altijd. */
async function applyTap(
  db: SQLiteDatabase,
  childId: string,
  item: PendingLog,
  startedThisBatch: Set<string>,
  notices: WidgetNotice[]
): Promise<EventRow[]> {
  if (!isKnownEventKind(item.k)) return [];
  if (EVENT_TYPES[item.k].isDuration) {
    if (item.k !== SLEEP_KIND) return [];
    return applySleepTap(db, childId, item, startedThisBatch, notices);
  }
  return [await insertMomentEvent(db, childId, item.k, new Date(item.t))];
}

function readPending(timeline: { props?: unknown }[]): PendingLog[] {
  const seen = new Set<string>();
  const pending: PendingLog[] = [];
  for (const entry of timeline) {
    for (const item of (entry.props as QuickLogProps | undefined)?.pending ?? []) {
      const id = tapId(item);
      if (seen.has(id)) continue;
      seen.add(id);
      pending.push(item);
    }
  }
  return pending.sort((a, b) => a.t - b.t);
}

let lastSnapshotJson: string | null = null;

async function writeSnapshot(
  widget: QuickLogWidget,
  options: WidgetSyncOptions,
  remainingPending: PendingLog[],
  hadPending: boolean
) {
  const { db, childId, wheelConfig, isEntitled, use12h, dayStartHour, title, t } = options;
  const now = new Date();
  // Zelfde venster als de wielbadges: de logische dag van nu (dagstart-uur tot dagstart-uur).
  const window = dayWindow(logicalDay(now, dayStartHour), dayStartHour);
  const todays = await getEventsForRange(db, childId, window.start, window.end);
  const open = await getOpenEvents(db, childId, SLEEP_KIND);
  const activeSleep = open.length > 0 ? open[open.length - 1] : null;
  const allowed = widgetEntries(resolveWheelOrder(wheelConfig), isEntitled, activeSleep !== null);
  const buttons: QuickLogButton[] = allowed.map((entry) => {
    const kind = entry.kind!;
    const isSleep = kind === SLEEP_KIND;
    return {
      id: kind,
      label: EVENT_TYPES[kind].label(t),
      symbol: EVENT_TYPES[kind].widgetSymbol,
      color: EVENT_TYPES[kind].color,
      // Slaap telt, net als in de app, per gestarte slaap in dit dagvenster.
      count: todays.filter((event) => event.kind === kind).length,
      ...(isSleep ? { sleep: true, since: activeSleep ? new Date(activeSleep.start_at).getTime() : 0 } : {}),
    };
  });
  const props: QuickLogProps = {
    title,
    totalLabel: t.widget.today,
    // "N vandaag" telt precies wat de knoppen tonen.
    total: buttons.reduce((sum, button) => sum + button.count, 0),
    buttons,
    pending: remainingPending,
    sleepStartLabel: t.widget.sleepStart,
    sleepSinceLabel: t.widget.sleepSince,
    use12h,
    lockedHint: isEntitled ? '' : t.widget.lockedHint,
  };
  // Op de volgende dagrand springen de tellers vanzelf naar 0 (tweede timeline-entry), ook
  // als de app dan niet open is.
  const nextDayProps: QuickLogProps = {
    ...props,
    total: 0,
    buttons: buttons.map((button) => ({ ...button, count: 0 })),
  };
  const json = JSON.stringify([props, window.end.getTime()]);
  // De sync-tik vuurt elke 30 s: alleen herschrijven als er echt iets veranderde (of als er
  // tikken uit de rij gehaald moeten worden).
  if (!hadPending && json === lastSnapshotJson) return;
  widget.updateTimeline([
    { date: now, props },
    { date: window.end, props: nextDayProps },
  ]);
  lastSnapshotJson = json;
}

async function runSyncWidget(options: WidgetSyncOptions): Promise<WidgetSyncResult> {
  const widget = getWidget();
  if (!widget) return { changed: [], notices: [] };
  const { db, childId, isShared } = options;

  const changed: EventRow[] = [];
  const notices: WidgetNotice[] = [];
  const remaining: PendingLog[] = [];
  let hadPending = false;
  let readFailed = false;
  try {
    const pending = readPending(await widget.getTimeline());
    hadPending = pending.length > 0;
    if (pending.length > 0) {
      // Gedeeld kind: eerst ophalen wat de partner deed (met time-out), zodat een slaap die
      // de partner al startte of stopte meetelt bij het verwerken van deze tikken.
      if (isShared) await withTimeout(pullChanges(db, childId), PULL_BEFORE_IMPORT_TIMEOUT_MS);

      const processed = await getAppStateJson<ProcessedTaps>(db, PROCESSED_TAPS_KEY, {});
      const now = Date.now();
      const startedThisBatch = new Set<string>();
      for (const item of pending) {
        const id = tapId(item);
        if (processed[id] !== undefined) continue;
        if (item.t > now + FUTURE_TOLERANCE_MS) {
          remaining.push(item);
          continue;
        }
        const rows = await applyTap(db, childId, item, startedThisBatch, notices);
        processed[id] = item.t;
        // Per event alleen de laatste stand teruggeven: anders kunnen twee pushes van hetzelfde
        // event in de verkeerde volgorde bij de partner aankomen.
        for (const row of rows) {
          const earlier = changed.findIndex((other) => other.id === row.id);
          if (earlier !== -1) changed.splice(earlier, 1);
          changed.push(row);
        }
      }
      for (const [id, t] of Object.entries(processed)) {
        if (now - t > PROCESSED_TAP_RETENTION_MS) delete processed[id];
      }
      await setAppStateJson(db, PROCESSED_TAPS_KEY, processed);
    }
  } catch (error) {
    console.warn('[widget] uitlezen mislukt', error);
    // Bij een fout de widget niet herschrijven: dat zou onverwerkte tikken uit de rij halen.
    // Wat wel verwerkt is, staat in de verwerkte ids en wordt de volgende keer overgeslagen.
    readFailed = true;
  }

  try {
    if (!readFailed) await writeSnapshot(widget, options, remaining, hadPending);
  } catch (error) {
    console.warn('[widget] bijwerken mislukt', error);
  }

  return { changed, notices };
}

let inFlight: Promise<WidgetSyncResult> | null = null;
let queued: Promise<WidgetSyncResult> | null = null;
let latestOptions: WidgetSyncOptions | null = null;

/** Verwerkt de tikken die sinds de vorige keer op de widget gedaan zijn (op volgorde) en
 * schrijft daarna verse props terug: de echte slaapstand uit de database, tellers van vandaag
 * en de knoppen die de gebruiker mag loggen. Veilig om vaak aan te roepen.
 *
 * Mutex: er loopt er hooguit één tegelijk; een aanroep tijdens een lopende run zet hooguit
 * één herhaling in de rij (met de nieuwste opties). Elke tik heeft een vast id dat na
 * verwerking in app_state bewaard wordt, dus dubbel importeren kan niet — ook niet als de
 * widget de tik nog een keer aanlevert. */
export function syncWidget(options: WidgetSyncOptions): Promise<WidgetSyncResult> {
  latestOptions = options;
  if (!inFlight) {
    inFlight = runSyncWidget(options).finally(() => {
      inFlight = null;
    });
    return inFlight;
  }
  if (!queued) {
    queued = inFlight
      .catch(() => undefined)
      .then(() => {
        queued = null;
        return syncWidget(latestOptions ?? options);
      });
  }
  return queued;
}
