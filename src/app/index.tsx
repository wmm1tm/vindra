import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS, useSharedValue } from 'react-native-reanimated';
import { useSQLiteContext } from 'expo-sqlite';

import { DayPickerSheet } from '@/components/day/day-picker-sheet';
import { DayRatingSheet } from '@/components/day/day-rating-sheet';
import { DayReportSheet } from '@/components/day/day-report-sheet';
import { OnboardingFlow } from '@/components/onboarding/onboarding-flow';
import { ChildSwitcherSheet } from '@/components/settings/child-switcher-sheet';
import { SettingsSheet } from '@/components/settings/settings-sheet';
import { WheelSettingsSheet } from '@/components/settings/wheel-settings-sheet';
import { CAPSULE_WIDTH, COLUMN_GAP, EventCapsule } from '@/components/timeline/event-capsule';
import { DOT_GAP, DOT_SIZE, EventDot } from '@/components/timeline/event-dot';
import { EventDetailSheet } from '@/components/timeline/event-detail-sheet';
import { HourColumn } from '@/components/timeline/hour-column';
import { LaneHeader } from '@/components/timeline/lane-header';
import { LaneSummaryPills } from '@/components/timeline/lane-summary-pills';
import { HoldBanner } from '@/components/timeline/hold-banner';
import { NowLine } from '@/components/timeline/now-line';
import { OnboardingNameBanner } from '@/components/timeline/onboarding-name-banner';
import { TargetTimeLine } from '@/components/timeline/target-time-line';
import { TimelineGrid } from '@/components/timeline/timeline-grid';
import { IconButton } from '@/components/ui/icon-button';
import { WheelArc } from '@/components/wheel/wheel-arc';
import { EVENT_TYPES } from '@/constants/event-types';
import { HOUR_COLUMN_WIDTH, PIXELS_PER_HOUR } from '@/constants/timeline';
import {
  TIMELINE_HORIZONTAL_PADDING,
  TIMELINE_LANES,
  laneIndexForKind,
  laneWidth,
} from '@/constants/timeline-lanes';
import { getDayRating, setDayRating } from '@/db/day-log';
import { DEFAULT_CHILD_NAME, listChildren, type Child } from '@/db/child';
import {
  getEventsForDay,
  getOpenOrOverlappingEvents,
  rescheduleEvent,
  softDeleteEvent,
  type EventRow,
} from '@/db/events';
import { useActiveChild } from '@/lib/active-child-context';
import { GlowProvider } from '@/lib/glow-context';
import { useI18n } from '@/lib/i18n';
import { usePreferences } from '@/lib/preferences-context';
import { usePurchases } from '@/lib/purchases-context';
import { pushDayRating, pushEvent, useSyncLoop } from '@/lib/sync';
import { dateKey, minutesSinceMidnight, TIME_SNAP_MINUTES } from '@/lib/time';
import { maybeAskForReview } from '@/lib/review-prompt';
import { assignColumns, assignIntervalColumns } from '@/lib/timeline-layout';
import { syncWidget } from '@/lib/widget-sync';

const MIN_PIXELS_PER_HOUR = 55;
const MAX_PIXELS_PER_HOUR = 280;
const LONG_PRESS_TOLERANCE = 16;
// A dragged start/end marker can't cross the other one — this is how close they're
// allowed to get.
const MIN_EVENT_DURATION_MINUTES = TIME_SNAP_MINUTES;
// How far the finger may travel without cancelling the long-press. RNGH's default
// (~10px) is meant to tell a hold apart from a scroll, but that same limit would also
// cancel the drag-to-adjust once the press has activated — so it's set generously high
// and we lean on minDuration + the ScrollView's own pan recognition to keep a normal
// scroll swipe from being mistaken for a long-press in the first place.
const LONG_PRESS_MAX_DISTANCE = 10000;
/** Wacht tot de log-animatie van het wiel klaar is voordat het review-venster verschijnt. */
const REVIEW_PROMPT_DELAY_MS = 1500;

// Which event kinds are duration-based, for getOpenOrOverlappingEvents — the db layer
// itself doesn't know this (that's app-level config), so callers supply the list.
const DURATION_KINDS = Object.values(EVENT_TYPES)
  .filter((type) => type.isDuration)
  .map((type) => type.kind);

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Which part of an event a long-press landed on. A duration event's own start/end
 * markers can be grabbed independently (the duration is then recomputed automatically)
 * — grabbing the bar between them (or a moment event's dot) moves the whole thing. */
type ReschedulingEdge = 'start' | 'end' | 'whole';

interface ReschedulingTarget {
  event: EventRow;
  edge: ReschedulingEdge;
}

/** Pixel-offset (van de vastgezette rand) van een event's vaste tijdlijn-kolom — gedeeld
 * tussen de render-loop en findEventNear hieronder, zodat lang-druk-hit-testing exact
 * dezelfde positie gebruikt als waar het event daadwerkelijk getekend wordt. */
function laneOffsetForEvent(event: EventRow, laneWidthPx: number) {
  return laneIndexForKind(event.kind) * laneWidthPx;
}

/** Finds the event (if any) a long-press landed on, and which part of it — so the
 * gesture can reschedule just that part instead of marking a fresh time. Checks both
 * axes: vertical, same tolerance as before; and horizontal, against wherever that
 * event is actually rendered (its column) — without this an event spanning much of the
 * night (like an overnight sleep) would swallow every long-press at that height,
 * anywhere across the screen, leaving no way to mark a fresh time for a night feed. A
 * marker only counts if its true point in time actually falls within the viewed day —
 * a session that started yesterday or hasn't ended yet has no real start/end marker
 * drawn here to grab (see EventCapsule's "continues" chevron), so those edges are
 * skipped in favour of the (still available) whole-bar drag. */
function findEventNear(
  x: number,
  y: number,
  events: EventRow[],
  pixelsPerHour: number,
  dayStart: Date,
  columns: Map<EventRow, number>,
  durationColumns: Map<EventRow, number>,
  mirrored: boolean,
  // `x`/`y` come from a gesture attached to the events area itself, so this must be
  // *that* area's own width (not the full window) — a mirrored dot's `right: offset`
  // position converts to a local left-edge x-coordinate via this area's own width, not
  // the screen's.
  eventsAreaWidth: number,
  isToday: boolean,
  laneWidthPx: number
): ReschedulingTarget | null {
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  for (const event of events) {
    const isDuration = EVENT_TYPES[event.kind].isDuration;
    const itemWidth = isDuration ? CAPSULE_WIDTH : DOT_SIZE;
    const gap = isDuration ? COLUMN_GAP : DOT_GAP;
    const column = (isDuration ? durationColumns.get(event) : columns.get(event)) ?? 0;
    const offset = laneOffsetForEvent(event, laneWidthPx) + column * (itemWidth + gap);
    const left = mirrored ? eventsAreaWidth - offset - itemWidth : offset;
    const right = left + itemWidth;
    if (x < left - LONG_PRESS_TOLERANCE || x > right + LONG_PRESS_TOLERANCE) continue;

    const trueStart = new Date(event.start_at);
    const continuesBefore = trueStart.getTime() < dayStart.getTime();
    const startTop = continuesBefore ? 0 : (minutesSinceMidnight(trueStart) / 60) * pixelsPerHour;

    if (!isDuration) {
      if (Math.abs(y - startTop) <= LONG_PRESS_TOLERANCE) return { event, edge: 'whole' };
      continue;
    }
    if (!continuesBefore && Math.abs(y - startTop) <= LONG_PRESS_TOLERANCE) return { event, edge: 'start' };
    // An ongoing event (no end_at yet) has no real end marker to grab, but its whole bar
    // — up to "now" (or the end of the viewed day, if that's in the past) — must still be
    // draggable as a whole, same as a finished one; only the exact end-marker grab point
    // needs a real end_at. Matches EventCapsule's own effectiveEnd fallback.
    const trueEnd = event.end_at ? new Date(event.end_at) : isToday ? new Date() : dayEnd;
    // >= , not > : an end landing exactly on the boundary (midnight) must still count
    // as "continues" — see the identical fix in EventCapsule for why.
    const continuesAfter = trueEnd.getTime() >= dayEnd.getTime();
    const endTop = continuesAfter ? 24 * pixelsPerHour : (minutesSinceMidnight(trueEnd) / 60) * pixelsPerHour;
    if (event.end_at && !continuesAfter && Math.abs(y - endTop) <= LONG_PRESS_TOLERANCE) return { event, edge: 'end' };
    const top = Math.min(startTop, endTop) - LONG_PRESS_TOLERANCE;
    const bottom = Math.max(startTop, endTop) + LONG_PRESS_TOLERANCE;
    if (y >= top && y <= bottom) return { event, edge: 'whole' };
  }
  return null;
}

function snapMinutes(rawMinutes: number) {
  return Math.round(rawMinutes / TIME_SNAP_MINUTES) * TIME_SNAP_MINUTES;
}

function snappedTimeAt(y: number, pixelsPerHour: number, day: Date) {
  const snapped = snapMinutes((y / pixelsPerHour) * 60);
  const clamped = Math.min(Math.max(snapped, 0), 24 * 60 - TIME_SNAP_MINUTES);
  const date = new Date(day);
  date.setHours(Math.floor(clamped / 60), clamped % 60, 0, 0);
  return date;
}

function isWithinNightWindow(date: Date) {
  const hour = date.getHours();
  return hour >= 22 || hour < 6;
}

function formatWeekdayDate(date: Date, localeTag: string) {
  return new Intl.DateTimeFormat(localeTag, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
}

// Most locales (incl. nl/de/fr/es/pt) lowercase weekday names in running text — fine for
// formatWeekdayDate's sentence-like use elsewhere, but this is used on its own as the
// header's primary title, at the same visual weight as "Vandaag" (which is capitalized),
// so it needs the same treatment.
function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatWeekdayLabel(date: Date, localeTag: string) {
  return capitalize(new Intl.DateTimeFormat(localeTag, { weekday: 'long' }).format(date));
}

function formatDayMonth(date: Date, localeTag: string) {
  return new Intl.DateTimeFormat(localeTag, { day: 'numeric', month: 'long' }).format(date);
}

export default function TimelineScreen() {
  const db = useSQLiteContext();
  const preferences = usePreferences();
  const { t, localeTag } = useI18n();
  const { childId } = useActiveChild();
  const { status: purchasesStatus } = usePurchases();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const mirrored = preferences.leftHanded;
  const scrollRef = useRef<ScrollView>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventRow | null>(null);
  const [pixelsPerHour, setPixelsPerHour] = useState(PIXELS_PER_HOUR);
  const [dayRating, setDayRatingState] = useState<number | null>(null);
  const [showRatingSheet, setShowRatingSheet] = useState(false);
  const [showReportSheet, setShowReportSheet] = useState(false);
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  // Geopend door lang drukken op de wielknop in het midden (zie WheelHub), als eigen
  // Modal, los van Instellingen.
  const [showWheelSettings, setShowWheelSettings] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const [markedTime, setMarkedTime] = useState<Date | null>(null);
  const [manualNightMode, setManualNightMode] = useState<boolean | null>(null);
  const [autoNightNow, setAutoNightNow] = useState(() => new Date());
  const [children, setChildren] = useState<Child[]>([]);
  const [showChildSwitcher, setShowChildSwitcher] = useState(false);
  const [badgeRefreshToken, setBadgeRefreshToken] = useState(0);
  const baseScale = useSharedValue(PIXELS_PER_HOUR);

  // Shared between the day/child-change effect below and the sync loop's onChanged —
  // a background pull applies remote events straight to SQLite (applyRemoteEvent),
  // bypassing the setEvents calls local edits use, so without re-running this fetch a
  // partner's events would sit in the local DB invisibly until something else happened
  // to trigger a refetch (switching day/child, reopening the app).
  const refetchEvents = useCallback(() => {
    if (!childId) return;
    Promise.all([
      getEventsForDay(db, childId, selectedDate),
      getOpenOrOverlappingEvents(db, childId, selectedDate, DURATION_KINDS),
    ]).then(([dayEvents, carriedOver]) => setEvents([...carriedOver, ...dayEvents]));
    getDayRating(db, childId, dateKey(selectedDate)).then(setDayRatingState);
  }, [db, childId, selectedDate]);

  useSyncLoop(
    db,
    useCallback(() => {
      setBadgeRefreshToken((token) => token + 1);
      refetchEvents();
    }, [refetchEvents])
  );

  // Alleen relevant zodra er meer dan één kind is — bij een enkel kind zou de naam in
  // de header alleen maar ruis toevoegen (spec §1: "geen ruis").
  const refetchChildren = useCallback(() => {
    listChildren(db).then(setChildren);
  }, [db]);
  useEffect(() => {
    refetchChildren();
  }, [refetchChildren, childId, showSettings]);
  const activeChild = children.find((c) => c.id === childId);
  const activeChildName = children.length > 1 ? activeChild?.name : null;
  // Blijft staan tot de naam niet meer de auto-gegenereerde standaardwaarde is, of de
  // gebruiker 'm expliciet wegtikt — nooit als verplichte stap vóór de eerste tik.
  const showOnboardingNameBanner = activeChild?.name === DEFAULT_CHILD_NAME && !preferences.onboardingNameDismissed;

  const isToday = selectedDate.getTime() === startOfDay(new Date()).getTime();
  const selectedDateKey = dateKey(selectedDate);
  const formattedDate = formatWeekdayDate(selectedDate, localeTag);
  // Header-only split of formattedDate into a short title line + a date subline, so the
  // header has the same two-line shape on every day — it used to collapse to one line
  // (the full formattedDate as the bold title, nothing below it) on any day but today.
  const headerTitle = isToday ? t.common.today : formatWeekdayLabel(selectedDate, localeTag);
  const headerDateLine = formatDayMonth(selectedDate, localeTag);
  // A manual tap always wins for the rest of this session; without one, auto mode
  // decides based on the clock (re-checked every minute so it flips on its own at
  // 22:00/06:00 if the app is left open).
  const isNightMode = manualNightMode ?? (preferences.nightModeAuto && isWithinNightWindow(autoNightNow));

  useEffect(() => {
    if (!preferences.nightModeAuto) return;
    const id = setInterval(() => setAutoNightNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, [preferences.nightModeAuto]);

  useEffect(() => {
    if (!childId) return;
    // A session that started before today and hasn't ended yet (or only just did) —
    // e.g. an overnight sleep — never shows up in getEventsForDay (that only matches on
    // start_at), so it's fetched separately and merged in. The two sets never overlap:
    // one is start_at within today, the other strictly before it. See refetchEvents.
    refetchEvents();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMarkedTime(null);
  }, [childId, selectedDate, selectedDateKey, refetchEvents]);

  // Beginscherm-widget (lib/widget-sync.ts): bij openen en bij terugkomen naar de app de
  // tikken van de widget inlezen als events (ook slaap starten/stoppen), en na elke
  // wijziging de tellers en de slaapstand erop bijwerken. Doet niets in Expo Go.
  const { wheelConfig, dayStartHour, timeFormat } = preferences;
  const isEntitled = purchasesStatus === 'entitled';
  const runWidgetSync = useCallback(() => {
    if (!childId) return;
    syncWidget(db, childId, wheelConfig, dayStartHour, isEntitled, timeFormat === '12h', t).then((changed) => {
      if (changed.length === 0) return;
      refetchEvents();
      setBadgeRefreshToken((token) => token + 1);
      for (const row of changed) pushEvent(db, childId, row);
    });
  }, [db, childId, wheelConfig, dayStartHour, isEntitled, timeFormat, t, refetchEvents]);
  useEffect(() => {
    runWidgetSync();
  }, [runWidgetSync, badgeRefreshToken]);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') runWidgetSync();
    });
    return () => subscription.remove();
  }, [runWidgetSync]);

  useEffect(() => {
    if (!isToday) return;
    const nowOffset = (minutesSinceMidnight(new Date()) / 60) * pixelsPerHour;
    const maxScroll = 24 * pixelsPerHour - windowHeight;
    const target = Math.min(Math.max(nowOffset - windowHeight / 2, 0), Math.max(maxScroll, 0));

    scrollRef.current?.scrollTo({ y: target, animated: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isToday]);

  // Computed up here (not just before the render return) because findEventNear's
  // hit-testing needs the same column assignment used for actually drawing each event.
  const durationEvents = events.filter((event) => EVENT_TYPES[event.kind].isDuration);
  const momentEvents = events.filter((event) => !EVENT_TYPES[event.kind].isDuration);
  // Sub-column packing runs once per lane instead of once globally, so a bottle at 10:00
  // and a diaper at 10:01 never fight over a column — they're in different lanes and
  // never see each other. assignColumns/assignIntervalColumns are keyed by object
  // identity, so merging the per-lane Maps back together is safe (no cross-lane key
  // collisions, since every event belongs to exactly one lane).
  const eventsAreaWidth = windowWidth - TIMELINE_HORIZONTAL_PADDING * 2 - HOUR_COLUMN_WIDTH;
  const laneWidthPx = laneWidth(eventsAreaWidth);
  const columns = new Map<EventRow, number>();
  const durationColumns = new Map<EventRow, number>();
  TIMELINE_LANES.forEach((_lane, laneIndex) => {
    const laneEvents = events.filter((event) => laneIndexForKind(event.kind) === laneIndex);
    assignColumns(
      laneEvents.filter((event) => !EVENT_TYPES[event.kind].isDuration),
      DOT_SIZE,
      pixelsPerHour
    ).forEach((value, key) => columns.set(key, value));
    assignIntervalColumns(laneEvents.filter((event) => EVENT_TYPES[event.kind].isDuration)).forEach((value, key) =>
      durationColumns.set(key, value)
    );
  });

  const handleLogged = useCallback(
    (row: EventRow) => {
      setEvents((current) => {
        const index = current.findIndex((event) => event.id === row.id);
        if (index === -1) return [...current, row];
        const next = [...current];
        next[index] = row;
        return next;
      });
      // Elke wijziging (loggen, bewerken, verslepen) kan de badge-tellers op de
      // wielknoppen raken — dit laat de wheel weten dat hij opnieuw moet tellen.
      setBadgeRefreshToken((token) => token + 1);
      if (childId) pushEvent(db, childId, row);
    },
    [db, childId]
  );

  // Alleen een log via het wiel is een "net iets gedaan"-moment om om een review te vragen:
  // niet na bewerken/verslepen en niet vanuit de widget. Nooit in de nachtmodus en niet
  // zolang de intro nog loopt. Even wachten zodat de log-animatie klaar is.
  const reviewAllowed = preferences.loaded && preferences.onboardingDone && !isNightMode;
  const handleWheelLogged = useCallback(
    (row: EventRow) => {
      handleLogged(row);
      if (reviewAllowed) setTimeout(() => maybeAskForReview(db), REVIEW_PROMPT_DELAY_MS);
    },
    [db, handleLogged, reviewAllowed]
  );

  const handleDelete = useCallback(() => {
    if (!selectedEvent) return;
    softDeleteEvent(db, selectedEvent.id).then((updatedAt) => {
      setEvents((current) => current.filter((event) => event.id !== selectedEvent.id));
      setSelectedEvent(null);
      setBadgeRefreshToken((token) => token + 1);
      if (childId) {
        pushEvent(db, childId, { ...selectedEvent, deleted_at: updatedAt, updated_at: updatedAt });
      }
    });
  }, [db, childId, selectedEvent]);

  const handleWheelCancelled = useCallback(
    (row: EventRow) => {
      setEvents((current) => current.filter((event) => event.id !== row.id));
      setBadgeRefreshToken((token) => token + 1);
      if (childId) pushEvent(db, childId, row);
    },
    [db, childId]
  );

  const handleDayEventsDeleted = useCallback(
    (rows: EventRow[]) => {
      if (rows.length === 0) return;
      const deletedIds = new Set(rows.map((row) => row.id));
      setEvents((current) => current.filter((event) => !deletedIds.has(event.id)));
      setBadgeRefreshToken((token) => token + 1);
      if (childId) rows.forEach((row) => pushEvent(db, childId, row));
    },
    [db, childId]
  );

  const handleReschedule = useCallback(
    (event: EventRow, startAt: Date, endAt: Date | null) => {
      rescheduleEvent(db, event.id, startAt, endAt).then((updatedAt) => {
        handleLogged({
          ...event,
          start_at: startAt.toISOString(),
          end_at: endAt ? endAt.toISOString() : null,
          updated_at: updatedAt,
        });
      });
    },
    [db, handleLogged]
  );

  const handleSelectRating = useCallback(
    (rating: number) => {
      if (!childId) return;
      setDayRating(db, childId, selectedDateKey, rating).then(() => {
        setDayRatingState(rating);
        setShowRatingSheet(false);
        pushDayRating(db, childId, selectedDateKey, rating);
      });
    },
    [db, childId, selectedDateKey]
  );

  const applyZoom = useCallback((next: number) => {
    setPixelsPerHour(Math.min(Math.max(next, MIN_PIXELS_PER_HOUR), MAX_PIXELS_PER_HOUR));
  }, []);

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      baseScale.value = pixelsPerHour;
    })
    .onUpdate((e) => {
      runOnJS(applyZoom)(baseScale.value * e.scale);
    });

  // Called once when the long-press activates (hit-tested against existing events) and
  // then again on every finger move while still held. If the press landed on an
  // existing event, this becomes a reschedule-drag of that event instead of marking a
  // fresh time — same gesture, same snapping, same TargetTimeLine, so it behaves
  // identically to manual time-picking rather than being a separate mechanism. Using
  // the functional setState form keeps this safe against the rapid-fire calls a drag
  // produces, since each call reacts to the latest committed marker, not a stale one.
  const isDraggingMark = useSharedValue(false);
  // Which event (and which part of it — start marker, end marker, or the whole thing)
  // this gesture landed on — set once at the start, read again at the end to decide
  // whether to persist a reschedule. A ref because it only needs to be read inside
  // callbacks; `reschedulingTarget` below is its render-facing twin.
  const reschedulingTargetRef = useRef<ReschedulingTarget | null>(null);
  const [reschedulingTarget, setReschedulingTarget] = useState<ReschedulingTarget | null>(null);

  // Per-frame drag state, set once in startDrag (onStart) and read on the UI thread by
  // every onTouchesMove — plain numbers only (no Date objects, no helper-function
  // calls), so the per-move handler below never needs to hop to the JS thread just to
  // compute a candidate time. dragEdge 'fresh' means "no existing event grabbed, map
  // finger position straight to a time"; otherwise it shifts dragAnchorMs by how far the
  // finger has moved since dragAnchorY, clamped to [dragMinMs, dragMaxMs].
  const dragEdge = useSharedValue<'start' | 'end' | 'whole' | 'fresh'>('fresh');
  const dragAnchorMs = useSharedValue(0);
  const dragAnchorY = useSharedValue(0);
  const dragMinMs = useSharedValue(-Infinity);
  const dragMaxMs = useSharedValue(Infinity);
  // Last snapped value actually committed to React state — lets onTouchesMove bail out
  // entirely on the UI thread for the (common) case where the finger moved but hasn't
  // crossed the next snap boundary yet, instead of round-tripping to JS and calling
  // setState on every raw touch-move regardless of whether the value changed.
  const lastSentMs = useSharedValue<number | null>(null);
  const dayStartMs = selectedDate.getTime();

  const commitMarkedTime = useCallback((ms: number, isFirst: boolean) => {
    setMarkedTime(new Date(ms));
    Haptics.impactAsync(isFirst ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // Not wrapped in useCallback: it closes over `columns`/`durationColumns` (plain Maps
  // recomputed each render), and the gesture object below is itself rebuilt fresh every
  // render anyway (react-native-gesture-handler doesn't need a stable identity here) —
  // so manual memoization wouldn't buy anything, and the React Compiler already handles
  // this component's re-renders. Runs once per gesture, on the JS thread (via runOnJS
  // from onStart) — the heavier hit-testing here (array/Map scans) is fine as a single
  // call; it's the per-move updates below that must avoid it.
  const startDrag = (x: number, y: number) => {
    const target = findEventNear(
      x,
      y,
      events,
      pixelsPerHour,
      selectedDate,
      columns,
      durationColumns,
      mirrored,
      eventsAreaWidth,
      isToday,
      laneWidthPx
    );
    reschedulingTargetRef.current = target;
    setReschedulingTarget(target);
    dragAnchorY.value = y;

    let initialMs: number;
    if (target) {
      const anchor = target.edge === 'end' ? target.event.end_at! : target.event.start_at;
      dragEdge.value = target.edge;
      dragAnchorMs.value = new Date(anchor).getTime();
      dragMinMs.value =
        target.edge === 'end' ? new Date(target.event.start_at).getTime() + MIN_EVENT_DURATION_MINUTES * 60000 : -Infinity;
      dragMaxMs.value =
        target.edge === 'start' && target.event.end_at
          ? new Date(target.event.end_at).getTime() - MIN_EVENT_DURATION_MINUTES * 60000
          : Infinity;
      initialMs = Math.min(Math.max(dragAnchorMs.value, dragMinMs.value), dragMaxMs.value);
    } else {
      dragEdge.value = 'fresh';
      initialMs = snappedTimeAt(y, pixelsPerHour, selectedDate).getTime();
    }
    lastSentMs.value = initialMs;
    commitMarkedTime(initialMs, true);
  };

  const finishMark = useCallback(() => {
    const target = reschedulingTargetRef.current;
    reschedulingTargetRef.current = null;
    setReschedulingTarget(null);
    if (!target) return;
    const { event, edge } = target;
    setMarkedTime((current) => {
      if (current) {
        if (edge === 'start' && current.getTime() !== new Date(event.start_at).getTime()) {
          handleReschedule(event, current, event.end_at ? new Date(event.end_at) : null);
        } else if (edge === 'end' && current.getTime() !== new Date(event.end_at!).getTime()) {
          handleReschedule(event, new Date(event.start_at), current);
        } else if (edge === 'whole' && current.getTime() !== new Date(event.start_at).getTime()) {
          const originalStart = new Date(event.start_at).getTime();
          const originalEnd = event.end_at ? new Date(event.end_at).getTime() : null;
          const newEnd = originalEnd !== null ? new Date(current.getTime() + (originalEnd - originalStart)) : null;
          handleReschedule(event, current, newEnd);
        }
      }
      return null;
    });
  }, [handleReschedule]);

  const cancelPendingReschedule = useCallback(() => {
    if (reschedulingTargetRef.current !== null) {
      reschedulingTargetRef.current = null;
      setReschedulingTarget(null);
      setMarkedTime(null);
    }
  }, []);

  const longPressGesture = Gesture.LongPress()
    .minDuration(450)
    .maxDistance(LONG_PRESS_MAX_DISTANCE)
    // startDrag only reads/writes reschedulingTargetRef when the gesture actually
    // fires, never during render — same reasoning as onEnd below.
    // eslint-disable-next-line react-hooks/refs
    .onStart((e) => {
      isDraggingMark.value = true;
      runOnJS(startDrag)(e.x, e.y);
    })
    .onTouchesMove((e) => {
      if (!isDraggingMark.value) return;
      const touch = e.allTouches[0];
      if (!touch) return;

      let nextMs: number;
      if (dragEdge.value === 'fresh') {
        const rawMinutes = (touch.y / pixelsPerHour) * 60;
        const snapped = Math.round(rawMinutes / TIME_SNAP_MINUTES) * TIME_SNAP_MINUTES;
        const clamped = Math.min(Math.max(snapped, 0), 24 * 60 - TIME_SNAP_MINUTES);
        nextMs = dayStartMs + clamped * 60000;
      } else {
        const rawDeltaMinutes = ((touch.y - dragAnchorY.value) / pixelsPerHour) * 60;
        const snappedDeltaMinutes = Math.round(rawDeltaMinutes / TIME_SNAP_MINUTES) * TIME_SNAP_MINUTES;
        nextMs = Math.min(Math.max(dragAnchorMs.value + snappedDeltaMinutes * 60000, dragMinMs.value), dragMaxMs.value);
      }

      if (nextMs === lastSentMs.value) return;
      lastSentMs.value = nextMs;
      runOnJS(commitMarkedTime)(nextMs, false);
    })
    // finishMark/cancelPendingReschedule only read the ref when the gesture actually
    // fires, never during render — the gesture builder just stores these callbacks for
    // later, it doesn't invoke them now.
    // eslint-disable-next-line react-hooks/refs
    .onEnd(() => {
      isDraggingMark.value = false;
      runOnJS(finishMark)();
    })
    .onFinalize(() => {
      isDraggingMark.value = false;
      runOnJS(cancelPendingReschedule)();
    });

  const timelineHeight = 24 * pixelsPerHour;
  const reschedulePreview =
    reschedulingTarget && markedTime ? { edge: reschedulingTarget.edge, time: markedTime } : null;
  // Caps the inline detail text so it doesn't run into the next lane — see
  // event-dot.tsx/event-capsule.tsx's detailMaxWidth prop.
  const MIN_DETAIL_MAX_WIDTH = 40;
  const capsuleDetailMaxWidth = Math.max(MIN_DETAIL_MAX_WIDTH, laneWidthPx - CAPSULE_WIDTH - 10);
  const dotDetailMaxWidth = Math.max(MIN_DETAIL_MAX_WIDTH, laneWidthPx - DOT_SIZE - 10);

  return (
    <GlowProvider nightMode={isNightMode}>
      <View style={[styles.screen, isNightMode && styles.screenNight]}>
        <View style={styles.header}>
          <View style={styles.headerTitleColumn}>
            <View style={styles.headerTitleRow}>
              <Pressable style={styles.headerTitleShrink} onPress={() => setShowDayPicker(true)}>
                <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
                  {headerTitle}
                </Text>
              </Pressable>
              {activeChildName && (
                <Pressable style={styles.headerTitleShrink} onPress={() => setShowChildSwitcher(true)} hitSlop={6}>
                  <Text style={styles.headerChildBadge} numberOfLines={1} ellipsizeMode="tail">
                    {activeChildName}
                  </Text>
                </Pressable>
              )}
            </View>
            <Pressable onPress={() => setShowDayPicker(true)}>
              <Text style={styles.headerDate}>{headerDateLine}</Text>
            </Pressable>
          </View>
          <View style={styles.headerButtons}>
            <IconButton onPress={() => setShowRatingSheet(true)} hitSlop={8}>
              <MaterialCommunityIcons name={dayRating !== null ? 'star' : 'star-outline'} size={20} color="#F1EEE7" />
            </IconButton>
            <IconButton onPress={() => setShowReportSheet(true)} hitSlop={8}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={20} color="#F1EEE7" />
            </IconButton>
            <IconButton onPress={() => preferences.save({ leftHanded: !preferences.leftHanded })} hitSlop={8}>
              <MaterialCommunityIcons name="swap-horizontal" size={20} color="#F1EEE7" />
            </IconButton>
            <IconButton onPress={() => setManualNightMode(!isNightMode)} hitSlop={8} active={isNightMode}>
              <MaterialCommunityIcons name="weather-night" size={20} color={isNightMode ? '#E0673A' : '#F1EEE7'} />
            </IconButton>
            <IconButton onPress={() => setShowSettings(true)} hitSlop={8}>
              <MaterialCommunityIcons name="cog-outline" size={20} color="#F1EEE7" />
            </IconButton>
          </View>
        </View>
        {showOnboardingNameBanner && childId && (
          <OnboardingNameBanner childId={childId} onSaved={refetchChildren} />
        )}
        <LaneSummaryPills selectedDate={selectedDate} badgeRefreshToken={badgeRefreshToken} />
        <View style={styles.timelineWrapper}>
          <LaneHeader
            mirrored={mirrored}
            laneWidth={laneWidthPx}
            hourColumnWidth={HOUR_COLUMN_WIDTH}
            activeLaneIndex={reschedulingTarget ? laneIndexForKind(reschedulingTarget.event.kind) : null}
          />
          <GestureDetector gesture={pinchGesture}>
            <ScrollView ref={scrollRef} contentContainerStyle={{ height: timelineHeight }}>
              <View style={[styles.timelineRow, mirrored && styles.timelineRowMirrored]}>
                <HourColumn pixelsPerHour={pixelsPerHour} />
                {/* Vóór de events getekend, zodat de nu-lijn eronder loopt i.p.v. over de labels. */}
                <NowLine pixelsPerHour={pixelsPerHour} mirrored={mirrored} color={isNightMode ? '#E0673A' : undefined} />
                <GestureDetector gesture={longPressGesture}>
                  <View style={styles.eventsArea}>
                    <TimelineGrid pixelsPerHour={pixelsPerHour} />
                    {durationEvents.map((event) => (
                      <EventCapsule
                        key={event.id}
                        event={event}
                        column={durationColumns.get(event) ?? 0}
                        pixelsPerHour={pixelsPerHour}
                        onPress={() => setSelectedEvent(event)}
                        mirrored={mirrored}
                        dayStart={selectedDate}
                        isToday={isToday}
                        previewEdit={reschedulingTarget?.event.id === event.id ? reschedulePreview : null}
                        laneOffset={laneOffsetForEvent(event, laneWidthPx)}
                        detailMaxWidth={capsuleDetailMaxWidth}
                        dimmed={reschedulingTarget !== null && reschedulingTarget.event.id !== event.id}
                      />
                    ))}
                    {momentEvents.map((event) => (
                      <EventDot
                        key={event.id}
                        event={event}
                        column={columns.get(event) ?? 0}
                        pixelsPerHour={pixelsPerHour}
                        onPress={() => setSelectedEvent(event)}
                        mirrored={mirrored}
                        previewOffsetMinutes={
                          reschedulingTarget?.event.id === event.id && reschedulePreview
                            ? (reschedulePreview.time.getTime() - new Date(event.start_at).getTime()) / 60000
                            : null
                        }
                        laneOffset={laneOffsetForEvent(event, laneWidthPx)}
                        detailMaxWidth={dotDetailMaxWidth}
                        dimmed={reschedulingTarget !== null && reschedulingTarget.event.id !== event.id}
                      />
                    ))}
                    {markedTime && (
                      <TargetTimeLine
                        time={markedTime}
                        pixelsPerHour={pixelsPerHour}
                        onClear={reschedulingTarget ? undefined : () => setMarkedTime(null)}
                      />
                    )}
                  </View>
                </GestureDetector>
              </View>
            </ScrollView>
          </GestureDetector>
          {/* Nachtmodus dimt de tijdlijn — het wiel zit in een eigen laag hieronder en
              blijft dus, net als bedoeld, volledig zichtbaar. */}
          {isNightMode && <View pointerEvents="none" style={styles.nightOverlay} />}
          {reschedulingTarget && (
            <HoldBanner
              event={reschedulingTarget.event}
              edge={reschedulingTarget.edge}
              previewTime={markedTime}
              laneWidth={laneWidthPx}
              hourColumnWidth={HOUR_COLUMN_WIDTH}
              mirrored={mirrored}
            />
          )}
        </View>
        <WheelArc
          onLogged={handleWheelLogged}
          onCancelledEvent={handleWheelCancelled}
          mirrored={mirrored}
          selectedDate={selectedDate}
          targetTime={markedTime}
          onTargetConsumed={() => setMarkedTime(null)}
          badgeRefreshToken={badgeRefreshToken}
          onCustomizeWheel={() => setShowWheelSettings(true)}
        />
        {showWheelSettings && <WheelSettingsSheet nested={false} onClose={() => setShowWheelSettings(false)} />}
        {selectedEvent && (
          <EventDetailSheet
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
            onDelete={handleDelete}
            onSaved={handleLogged}
          />
        )}
        {showRatingSheet && (
          <DayRatingSheet
            currentRating={dayRating}
            onClose={() => setShowRatingSheet(false)}
            onSelect={handleSelectRating}
          />
        )}
        {showReportSheet && (
          <DayReportSheet
            selectedDate={selectedDate}
            dateLabel={formattedDate}
            rating={dayRating}
            events={events}
            onClose={() => setShowReportSheet(false)}
          />
        )}
        {showDayPicker && (
          <DayPickerSheet
            selectedDate={selectedDate}
            onClose={() => setShowDayPicker(false)}
            onSelect={(date) => {
              setSelectedDate(startOfDay(date));
              setShowDayPicker(false);
            }}
          />
        )}
        {showSettings && (
          <SettingsSheet
            onClose={() => setShowSettings(false)}
            selectedDate={selectedDate}
            dayLabel={isToday ? t.common.today : formattedDate}
            onDayEventsDeleted={handleDayEventsDeleted}
          />
        )}
        {showChildSwitcher && (
          <ChildSwitcherSheet childList={children} onClose={() => setShowChildSwitcher(false)} />
        )}
        {/* Pas tonen zodra de instellingen gelezen zijn (preferences.loaded), anders flitst de
            intro even op bij iemand die hem al gedaan heeft. Bestaande gebruikers met events
            of een eigen kindnaam slaan hem vanzelf over (zie db/onboarding.ts). */}
        {preferences.loaded && !preferences.onboardingDone && (
          <OnboardingFlow onDone={refetchChildren} onChildUpdated={refetchChildren} />
        )}
      </View>
    </GlowProvider>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#12171C',
  },
  screenNight: {
    backgroundColor: '#05060a',
  },
  timelineWrapper: {
    flex: 1,
  },
  nightOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerTitleColumn: {
    flex: 1,
    marginRight: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  // Lets a long child name or a long formatted date truncate with an ellipsis instead of
  // overflowing the header row and pushing headerButtons off-screen (RN's default
  // flexShrink is 0, so without this the row simply grows past the screen width).
  headerTitleShrink: {
    flexShrink: 1,
  },
  headerTitle: {
    color: '#F1EEE7',
    fontSize: 22,
    fontWeight: '600',
  },
  headerChildBadge: {
    color: '#12171C',
    backgroundColor: '#D6A866',
    fontSize: 11,
    fontWeight: '700',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  headerDate: {
    color: '#AAB4B6',
    fontSize: 14,
    marginTop: 2,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
    flexShrink: 0,
  },
  timelineRow: {
    flex: 1,
    flexDirection: 'row',
    position: 'relative',
    paddingHorizontal: TIMELINE_HORIZONTAL_PADDING,
  },
  timelineRowMirrored: {
    flexDirection: 'row-reverse',
  },
  eventsArea: {
    flex: 1,
  },
});
