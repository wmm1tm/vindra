import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useSQLiteContext } from 'expo-sqlite';

import {
  DURATION_KINDS,
  EVENT_TYPES,
  SECOND_LEVEL_OPTIONS,
  resolveWheelOrder,
  wheelEntryRequiresPremium,
  type EventDetails,
  type EventKind,
  type WheelEntry,
} from '@/constants/event-types';
import {
  closeEvent,
  getActiveEvent,
  getEventById,
  getEventsOverlappingRange,
  getFrequentNotes,
  getLastAmountMl,
  insertMomentEvent,
  reopenEvent,
  rescheduleEvent,
  softDeleteEvent,
  updateEventDetails,
  type EventRow,
} from '@/db/events';
import { useActiveChild } from '@/lib/active-child-context';
import { dateAtClockTime, dayWindow, logicalDay } from '@/lib/day-window';
import { AMOUNT_KINDS, computeKindTotals, formatGroupBadge, formatKindBadge } from '@/lib/event-summary';
import { useI18n } from '@/lib/i18n';
import { usePreferences } from '@/lib/preferences-context';
import { usePurchases } from '@/lib/purchases-context';
import { stopOpenSessions } from '@/lib/sleep-actions';
import { confirmStopRunningSleep, showSleepAlreadyStopped } from '@/lib/sleep-prompts';
import { pullBeforeAction } from '@/lib/sync';
import { hourFieldValue, parseHourField, safeEndTime, snapToNearestMinutes, TIME_SNAP_MINUTES } from '@/lib/time';
import { formatTime } from '@/lib/time-options';
import { arcPosition } from '@/lib/wheel-geometry';
import { PaywallScreen } from '@/components/paywall/paywall-screen';
import { AmPmToggle } from '@/components/ui/am-pm-toggle';
import { InlineInputCard } from '@/components/wheel/inline-input-card';
import { WheelBadge } from '@/components/wheel/wheel-badge';
import { WheelButton } from '@/components/wheel/wheel-button';
import { WheelHub } from '@/components/wheel/wheel-hub';
import { WheelRing, type WheelRingItem } from '@/components/wheel/wheel-ring';

const RADIUS = 210;
// Bij 7-8 knoppen overlappen de knoppen en hun namen op de standaardboog: dan een grotere
// én bredere boog (zoals Ebbly na de toesteltest van 2026-09-24).
const RADIUS_WIDE = 240;
const ANGLE_SPAN_WIDE_DEG = 152;
const WIDE_FROM_COUNT = 7;
const RADIUS_STEP = 100;
const ANGLE_SPAN_DEG = 130;
const ANCHOR_HEIGHT_RATIO = 0.63;
const EDGE_INSET = 30;
const CONFIRM_CANCEL_SPAN_DEG = 40;
// Dit is de "klaar met details toevoegen"-knop (stage 'details', ná het loggen) — het
// event zelf is dan al weggeschreven, dus bewust amber+pijl, niet groen+vinkje (dat is
// gereserveerd voor de knop die het event daadwerkelijk logt, zie InlineInputCard se
// variant="final" bij handmatige tijd-invoer hieronder).
const NEXT_COLOR = '#D6A866';
const CANCEL_COLOR = '#C97B7B';

// Ver genoeg om de hele boog (straal + knopgrootte) buiten beeld te schuiven.
const WHEEL_COLLAPSE_TRANSLATE = RADIUS_WIDE + 90;

type Stage = 'closed' | 'group' | 'options' | 'manualTime' | 'details';
type DetailField = 'amount' | 'note' | 'endTime' | 'temperature' | null;

interface WheelArcProps {
  onLogged: (row: EventRow) => void;
  onCancelledEvent: (row: EventRow) => void;
  mirrored?: boolean;
  selectedDate: Date;
  /** Is `selectedDate` de logische dag van nu? Dan is "nu" een zinnige standaardtijd. */
  isToday: boolean;
  targetTime?: Date | null;
  onTargetConsumed?: () => void;
  /** Verhoogd door de ouder bij elke wijziging die de badge-tellers kan raken (loggen,
   * bewerken, verwijderen, verslepen) — ook wijzigingen die niet via het wiel zelf
   * gebeurden, zoals verwijderen via het tijdlijn-detailscherm. */
  badgeRefreshToken?: number;
  /** Lang drukken op de wielknop in het midden: "Wiel aanpassen" openen. */
  onCustomizeWheel?: () => void;
}

export function WheelArc({
  onLogged,
  onCancelledEvent,
  mirrored = false,
  selectedDate,
  isToday,
  targetTime = null,
  onTargetConsumed,
  badgeRefreshToken = 0,
  onCustomizeWheel,
}: WheelArcProps) {
  const db = useSQLiteContext();
  const { volumeUnit, tempUnit, dayStartHour, wheelConfig, timeFormat } = usePreferences();
  const { t } = useI18n();
  const { childId } = useActiveChild();
  const { status: purchasesStatus } = usePurchases();
  const isEntitled = purchasesStatus === 'entitled';
  const [showPaywall, setShowPaywall] = useState(false);
  const wheelOrder = resolveWheelOrder(wheelConfig);
  // Badges tellen over hetzelfde dagvenster als de tijdlijn (dagstart-uur tot dagstart-uur).
  // Herlaadt ook op badgeRefreshToken, zodat wijzigingen buiten het wiel om (bewerken/
  // verwijderen/verslepen op de tijdlijn) de tellers hier ook bijwerken.
  const [badgeEvents, setBadgeEvents] = useState<EventRow[]>([]);
  const badgeWindow = dayWindow(selectedDate, dayStartHour);
  const badgeFrom = badgeWindow.start.getTime();
  const badgeTo = badgeWindow.end.getTime();

  useEffect(() => {
    if (!childId) return;
    // Incl. de nacht die gisteren begon: die telt vandaag mee voor het deel na de dagstart.
    getEventsOverlappingRange(db, childId, new Date(badgeFrom), new Date(badgeTo), DURATION_KINDS).then(
      setBadgeEvents
    );
  }, [db, childId, badgeFrom, badgeTo, badgeRefreshToken]);
  // Lokale, niet-gepersisteerde UI-staat (geen ChildSettings-veld): dit is een tijdelijke
  // "geef me nu ruimte"-keuze, geen stabiele per-kind-instelling zoals leftHanded — een
  // gedeeld kind zou anders op een ander toestel de wiel-staat van dit toestel overnemen.
  // Start altijd uitgeklapt bij het openen van de app.
  const [wheelExpanded, setWheelExpanded] = useState(true);
  const arcProgress = useSharedValue(1);
  // Kort wiebelen van de knoppen bij lang drukken op de hub, zoals iOS-apps op het
  // beginscherm wiebelen als je ze gaat schikken. Daarna opent "Wiel aanpassen".
  const wiggle = useSharedValue(0);
  useEffect(() => {
    arcProgress.value = withSpring(wheelExpanded ? 1 : 0, { damping: 20, stiffness: 200 });
  }, [wheelExpanded, arcProgress]);
  const [stage, setStage] = useState<Stage>('closed');
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [activeKind, setActiveKind] = useState<EventKind | null>(null);
  const [pendingDetails, setPendingDetails] = useState<EventDetails | undefined>(undefined);
  const [pendingAmountMl, setPendingAmountMl] = useState<number | undefined>(undefined);
  // Explicit start-time override. `null` means "use the moment the event is confirmed"
  // (the default, frictionless case) — anything the user deliberately picks (a relative
  // chip, a manual time, or a marker placed on the timeline) is frozen here immediately
  // so it can't silently drift while the user keeps adjusting other fields.
  const [pendingStartAt, setPendingStartAt] = useState<Date | null>(null);
  const [loggedEvent, setLoggedEvent] = useState<EventRow | null>(null);
  const [stoppingEvent, setStoppingEvent] = useState<EventRow | null>(null);
  const [detailField, setDetailField] = useState<DetailField>(null);
  const [amountValue, setAmountValue] = useState('');
  const [noteValue, setNoteValue] = useState('');
  const [quickNotes, setQuickNotes] = useState<string[]>([]);
  const [temperatureValue, setTemperatureValue] = useState('');
  const [manualHour, setManualHour] = useState('');
  const [manualPm, setManualPm] = useState(false);
  const [manualMinute, setManualMinute] = useState('');
  // Zodra het uur-veld 2 cijfers heeft, springt de focus vanzelf door naar minuten —
  // zie de handler bij de TextInput hieronder.
  const manualMinuteRef = useRef<TextInput>(null);
  const [endHour, setEndHour] = useState('');
  const [endMinute, setEndMinute] = useState('');

  const { width, height } = useWindowDimensions();
  const isWide = wheelOrder.length >= WIDE_FROM_COUNT;
  const radius = isWide ? RADIUS_WIDE : RADIUS;
  const angleSpanDeg = isWide ? ANGLE_SPAN_WIDE_DEG : ANGLE_SPAN_DEG;
  const stepDeg = wheelOrder.length > 1 ? angleSpanDeg / (wheelOrder.length - 1) : 0;
  const angleSpanRad = (angleSpanDeg * Math.PI) / 180;
  const tuckedCos = Math.cos(Math.PI - angleSpanRad / 2);
  const pivot = {
    x: width - EDGE_INSET - tuckedCos * radius,
    y: height * ANCHOR_HEIGHT_RATIO,
  };
  const arcStyle = useAnimatedStyle(() => ({
    opacity: arcProgress.value,
    transform: [
      { translateX: (1 - arcProgress.value) * (mirrored ? -WHEEL_COLLAPSE_TRANSLATE : WHEEL_COLLAPSE_TRANSLATE) },
      { rotate: `${wiggle.value}deg` },
    ],
  }));
  const mirrorX = (x: number) => (mirrored ? width - x : x);
  const keyboardAnchor = { x: mirrored ? EDGE_INSET : width - EDGE_INSET, y: 130 };

  const confirmCancelRadius = radius - 70;
  const cancelPos = arcPosition({
    index: 0,
    count: 2,
    radius: confirmCancelRadius,
    angleSpanDeg: CONFIRM_CANCEL_SPAN_DEG,
    pivot,
  });
  const confirmPos = arcPosition({
    index: 1,
    count: 2,
    radius: confirmCancelRadius,
    angleSpanDeg: CONFIRM_CANCEL_SPAN_DEG,
    pivot,
  });

  const positions = wheelOrder.map((entry, index) =>
    arcPosition({ index, count: wheelOrder.length, radius, angleSpanDeg, pivot })
  );
  // Anchored to the arc itself (pivot/RADIUS), not to the header above it — the header's
  // own height varies (the lane-summary pills only render when there's something to
  // summarize, see LaneSummaryPills) and used to leave this label sitting right on top of
  // the lane header on days with a shorter header. RADIUS is always >= the arc's actual
  // vertical reach (reach = RADIUS * sin(halfSpan) < RADIUS), so this clears the topmost
  // wheel button with room to spare regardless of screen height.
  const activeLabelTop = pivot.y - radius - 40;

  useEffect(() => {
    if (stage !== 'details' || !activeKind || !AMOUNT_KINDS.has(activeKind) || !childId) return;
    if (loggedEvent?.amount_ml !== null && loggedEvent?.amount_ml !== undefined) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAmountValue(String(loggedEvent.amount_ml));
      return;
    }
    getLastAmountMl(db, childId, activeKind).then((last) => {
      if (last !== null) setAmountValue(String(last));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, activeKind, db, childId]);

  useEffect(() => {
    if (stage !== 'details' || detailField !== 'note' || !childId) return;
    getFrequentNotes(db, childId).then(setQuickNotes);
  }, [stage, detailField, db, childId]);

  const resetState = () => {
    setStage('closed');
    setActiveEntryId(null);
    setActiveKind(null);
    setPendingDetails(undefined);
    setPendingAmountMl(undefined);
    setPendingStartAt(null);
    setLoggedEvent(null);
    setStoppingEvent(null);
    setDetailField(null);
    setAmountValue('');
    setNoteValue('');
    setQuickNotes([]);
    setTemperatureValue('');
    setManualHour('');
    setManualMinute('');
    setEndHour('');
    setEndMinute('');
  };

  const reset = () => {
    resetState();
    // A marked time on the timeline (targetTime) is only meant for the very next thing
    // you log with it. If the wheel closes for any other reason — cancelled, or "done"
    // after logging — without it (already) being consumed, it must not silently linger
    // and get picked up by some later, unrelated event. Harmless to call again when it
    // was already consumed via onTargetConsumed (see startKind/logAt). Use resetState
    // instead of this when a new pick is only *starting* (see handleEntryPress) — a
    // grouped entry (bv. "vast voedsel") needs a second tap to actually choose a kind,
    // and consuming the marker here would wipe it before that second tap ever runs it
    // through startKind.
    onTargetConsumed?.();
  };

  /** Aangeroepen zodra er niks meer te kiezen valt vóór het loggen (geen tweede niveau,
   * of net een tweede-niveau-optie gekozen) — logt in één moeite door in plaats van nog
   * een aparte bevestigingstap te eisen. Een expliciete tijd (`explicitStartAt`, een
   * merker van de tijdlijn) of "vandaag" (dus "nu" is een zinnig standaard) heeft niks
   * meer nodig; alleen als er geen zinnig standaard bestaat (een andere dag bekeken,
   * geen merker) is een tijd nog een echte keuze — dan pas naar handmatige invoer.
   * `kind`/`active` expliciet meegeven i.p.v. de net gezette activeKind/stoppingEvent-
   * state te laten lezen: startKind kan dit in dezelfde synchrone tik aanroepen, terwijl
   * React die state pas ná deze render doorvoert — zonder dit zou logAt daar nog de oude
   * (vorige) waarde van zien, wat een eerste tik op een direct-loggend type (of het
   * starten/stoppen van slapen) stil liet mislukken. */
  const proceedToLog = (kind: EventKind, active: EventRow | null, explicitStartAt: Date | null, details?: EventDetails) => {
    if (explicitStartAt) {
      logAt(kind, active, explicitStartAt, details);
      return;
    }
    if (isToday) {
      logAt(kind, active, snapToNearestMinutes(new Date()), details);
      return;
    }
    const now = new Date();
    setManualHour(hourFieldValue(now.getHours(), timeFormat));
    setManualPm(now.getHours() >= 12);
    setManualMinute(String(now.getMinutes()));
    setStage('manualTime');
  };

  const startKind = (kind: EventKind, active: EventRow | null) => {
    setActiveKind(kind);
    setPendingDetails(undefined);
    setPendingAmountMl(undefined);
    setPendingStartAt(targetTime ?? null);
    setLoggedEvent(null);
    setStoppingEvent(active);
    setDetailField(null);
    setAmountValue('');
    setNoteValue('');
    setTemperatureValue('');
    // Captured into pendingStartAt above — consume it now so it can't linger and get
    // picked up again later (see reset()'s comment). Doing this here, rather than only
    // in the generic reset(), is what makes a grouped entry's marker survive its
    // group-then-kind two-tap flow: see handleEntryPress.
    if (targetTime) onTargetConsumed?.();
    if (active || !EVENT_TYPES[kind].hasSecondLevel) {
      proceedToLog(kind, active, targetTime ?? null, undefined);
    } else {
      setStage('options');
    }
  };

  const beginKindFlow = (kind: EventKind) => {
    if (!childId) return;
    if (EVENT_TYPES[kind].isDuration) {
      (async () => {
        // Gedeeld kind: eerst kort ophalen, zodat een slaap die de partner net startte of
        // stopte meetelt (hooguit ~3 s; zonder internet gaat het gewoon lokaal verder).
        await pullBeforeAction(db, childId);
        const active = await getActiveEvent(db, childId, kind);
        const shownRunning = badgeEvents.find((event) => event.kind === kind && !event.end_at);
        if (active) {
          if (!shownRunning) {
            // Het scherm toonde "start", maar er liep al een slaap (van de partner): nooit
            // een tweede starten — vragen of deze tik hem moet stoppen.
            onLogged(active);
            const stopAt = targetTime ?? snapToNearestMinutes(new Date());
            const stop = await confirmStopRunningSleep(t, timeFormat, new Date(active.start_at), stopAt);
            if (!stop) {
              reset();
              return;
            }
          }
          startKind(kind, active);
          return;
        }
        // Het scherm toonde nog een lopende slaap, maar intussen is hij gestopt (door de
        // partner, via sync): deze tik was dus als STOP bedoeld. Nooit stil een nieuwe slaap
        // starten — melden, met de keuze om er toch een te starten.
        const current = shownRunning ? await getEventById(db, shownRunning.id) : null;
        if (shownRunning && current && (current.end_at || current.deleted_at)) {
          onLogged(current);
          showSleepAlreadyStopped(t, timeFormat, current.end_at ? new Date(current.end_at) : null, {
            onDismiss: reset,
            onStartNew: () => startKind(kind, null),
          });
          return;
        }
        startKind(kind, null);
      })();
      return;
    }
    startKind(kind, null);
  };

  // Een lopende slaap stoppen is altijd gratis (ook na een verlopen abonnement): de knop van
  // een type dat nu loopt is dan niet op slot.
  const isLocked = (entry: WheelEntry) => {
    if (isEntitled || !wheelEntryRequiresPremium(entry)) return false;
    const running = Boolean(
      entry.kind &&
        EVENT_TYPES[entry.kind].isDuration &&
        badgeEvents.some((event) => event.kind === entry.kind && !event.end_at)
    );
    return !running;
  };

  const handleEntryPress = (entry: WheelEntry) => {
    if (isLocked(entry)) {
      setShowPaywall(true);
      return;
    }
    if (activeEntryId === entry.id) {
      reset();
      return;
    }
    // Not the full reset(): a grouped entry (bv. "vast voedsel") only opens its
    // group-submenu here and picks the actual kind on a second tap, via beginKindFlow →
    // startKind — which is what actually consumes a marked timeline time. Clearing it
    // already at this first tap would wipe it before that second tap ever sees it.
    resetState();
    setActiveEntryId(entry.id);
    if (entry.groupMembers) {
      setStage('group');
      return;
    }
    beginKindFlow(entry.kind!);
  };

  const handleSelectOption = (id: string) => {
    if (!activeKind) return;
    const option = SECOND_LEVEL_OPTIONS[activeKind]?.find((o) => o.id === id);
    setPendingDetails(option?.details);
    // `details` expliciet doorgeven i.p.v. via de net gezette pendingDetails-state te
    // laten lezen: proceedToLog kan logAt in dezelfde synchrone tik aanroepen, terwijl
    // React de net aangeroepen setPendingDetails hierboven pas ná deze render verwerkt —
    // zonder dit zou de zojuist gekozen optie (bv. "plas") niet meegelogd worden. Een
    // tweede-niveau-keuze bestaat alleen voor niet-duur-events, dus hier is nooit een
    // lopende sessie (`active`) om te stoppen.
    proceedToLog(activeKind, null, pendingStartAt, option?.details);
  };

  const logAt = (kind: EventKind, active: EventRow | null, startAt: Date, details: EventDetails | undefined = pendingDetails) => {
    if (!childId) return;

    if (active) {
      // Nooit vóór (of op) de eigen start stoppen: de 5-minuten-snap van "nu" kan net vóór
      // een ongesnapte widget-start vallen.
      const endAt = safeEndTime(active.start_at, startAt);
      closeEvent(db, active.id, endAt).then(async (updatedAt) => {
        const closedRow: EventRow = { ...active, end_at: endAt.toISOString(), updated_at: updatedAt };
        onLogged(closedRow);
        setLoggedEvent(closedRow);
        setStage('details');
        onTargetConsumed?.();
        // Liep er nog een tweede slaap (twee toestellen startten offline elk een)? Die ook
        // sluiten, anders blijft er een "vergeten" open slaap staan.
        const others = await stopOpenSessions(db, childId, kind, endAt);
        others.forEach(onLogged);
      });
      return;
    }

    insertMomentEvent(db, childId, kind, startAt, details, pendingAmountMl).then((row) => {
      onLogged(row);
      setLoggedEvent(row);
      setStage('details');
      onTargetConsumed?.();
    });
  };

  const handleCancel = () => {
    if (loggedEvent) {
      if (stoppingEvent) {
        reopenEvent(db, loggedEvent.id).then((updatedAt) => {
          onLogged({ ...loggedEvent, end_at: null, updated_at: updatedAt });
          reset();
        });
      } else {
        softDeleteEvent(db, loggedEvent.id).then((updatedAt) => {
          onCancelledEvent({ ...loggedEvent, deleted_at: updatedAt, updated_at: updatedAt });
          reset();
        });
      }
      return;
    }
    reset();
  };

  const confirmManualTime = () => {
    if (!activeKind) return;
    const hours = parseHourField(manualHour, timeFormat, manualPm);
    const typedMinutes = Math.min(Math.max(Number(manualMinute) || 0, 0), 59);
    // Rounds the typed minute to the nearest 5-min mark (48 → 50, 02 → 00) so manually
    // entered times land on the same grid as the timeline — a 60 here (e.g. 58 rounds up)
    // is fine, Date.setHours below normalizes it into the next hour.
    const minutes = Math.round(typedMinutes / TIME_SNAP_MINUTES) * TIME_SNAP_MINUTES;
    // Stopping an event anchors to *its own* start day, not the day currently being
    // viewed — those can differ (an overnight sleep is still often looked at, and
    // stopped, from the next day's timeline). Rolls forward a day if the typed time
    // would otherwise land before the event even started, since that's exactly what
    // "ended at 00:30" after an evening start means.
    // Een nieuwe log valt binnen de bekeken logische dag: bij dagstart 06:00 is "03:00" op
    // maandag dus dinsdagnacht 03:00 (dateAtClockTime).
    let date: Date;
    if (stoppingEvent) {
      date = new Date(stoppingEvent.start_at);
      date.setHours(hours, minutes, 0, 0);
      if (date.getTime() < new Date(stoppingEvent.start_at).getTime()) date.setDate(date.getDate() + 1);
    } else {
      date = dateAtClockTime(selectedDate, hours, 0, dayStartHour);
      date.setMinutes(minutes);
    }
    // Dit is de enige overgebleven plek waar de gebruiker een tijd typt zonder dat er al
    // een zinnig standaard was (zie proceedToLog) — er valt hierna niks meer te kiezen,
    // dus loggen we meteen i.p.v. nog een aparte bevestigingstap te vragen. `stoppingEvent`
    // is hier veilig uit state te lezen (i.t.t. in proceedToLog/startKind): dit is een
    // aparte, latere tik, dus de state van de vorige render is inmiddels al gecommit.
    logAt(activeKind, stoppingEvent, date);
  };

  const persistDetails = (noteOverride?: string) => {
    if (!loggedEvent) return;
    const amountMl = amountValue.trim() ? Number(amountValue) : undefined;
    const note = (noteOverride ?? noteValue).trim() || undefined;
    const parsedTemperature = temperatureValue.trim()
      ? Number(temperatureValue.trim().replace(',', '.'))
      : undefined;
    const temperatureInput =
      parsedTemperature !== undefined && !Number.isNaN(parsedTemperature) ? parsedTemperature : undefined;
    const temperatureC =
      temperatureInput !== undefined
        ? tempUnit === 'fahrenheit'
          ? ((temperatureInput - 32) * 5) / 9
          : temperatureInput
        : undefined;

    updateEventDetails(db, loggedEvent.id, {
      amountMl,
      note,
      temperatureC,
      details: {
        side: loggedEvent.side ?? undefined,
        variant: loggedEvent.variant ?? undefined,
      },
    }).then((updatedAt) => {
      const updated: EventRow = {
        ...loggedEvent,
        amount_ml: amountMl ?? null,
        note: note ?? null,
        temperature_c: temperatureC ?? null,
        updated_at: updatedAt,
      };
      setLoggedEvent(updated);
      onLogged(updated);
    });
  };

  const confirmDetailField = () => {
    persistDetails();
    setDetailField(null);
  };

  const applyQuickNote = (note: string) => {
    setNoteValue(note);
    persistDetails(note);
    setDetailField(null);
  };

  const confirmEndTime = () => {
    if (!loggedEvent) return;
    const hours = Math.min(Math.max(Number(endHour) || 0, 0), 23);
    const minutes = Math.min(Math.max(Number(endMinute) || 0, 0), 59);
    const date = new Date(loggedEvent.start_at);
    date.setHours(hours, minutes, 0, 0);
    // "0:00" (or any clock time earlier than the start) means the end of the day the
    // event started, i.e. the start of the next calendar day — not a moment before it
    // even began. Roll forward a day rather than producing a negative/zero-length span.
    if (date.getTime() < new Date(loggedEvent.start_at).getTime()) {
      date.setDate(date.getDate() + 1);
    }

    closeEvent(db, loggedEvent.id, date).then((updatedAt) => {
      const updated: EventRow = { ...loggedEvent, end_at: date.toISOString(), updated_at: updatedAt };
      setLoggedEvent(updated);
      onLogged(updated);
      setDetailField(null);
    });
  };

  /** Sluit de lopende sessie meteen af op het einde van de logische dag waarin hij begon
   * (de dagrand = dagstart-uur, standaard 00:00) — een snelkoppeling naast "Eindtijd" voor
   * de nacht: je weet nog niet wanneer het kind wakker wordt, maar wil vannacht niet als één
   * (steeds langer lopend) open event op de tijdlijn laten staan. Anders dan de overige
   * detail-opties is hier niks meer te typen, dus dit logt direct. */
  const setEndOfDay = () => {
    if (!loggedEvent) return;
    const start = new Date(loggedEvent.start_at);
    const dayEnd = dayWindow(logicalDay(start, dayStartHour), dayStartHour).end;

    closeEvent(db, loggedEvent.id, dayEnd).then((updatedAt) => {
      const updated: EventRow = { ...loggedEvent, end_at: dayEnd.toISOString(), updated_at: updatedAt };
      setLoggedEvent(updated);
      onLogged(updated);
    });
  };

  /** Het spiegelbeeld van "Einde dag": voor 's ochtends, ná het wakker worden — je was er
   * vannacht niet bij om zelf een slaap-sessie te starten, dus dit maakt in één tik een
   * complete sessie van 00:00 tot het net gekozen startmoment, i.p.v. een sessie te
   * starten en die vervolgens nog apart te moeten afsluiten. Dat startmoment (nu, of een
   * expliciet gemarkeerde/handmatige tijd — zie startKind/pendingStartAt) is bewust het
   * eindpunt hier, niet de actuele kloktijd: als je bv. eerst 6:00 markeert en dan pas om
   * 8:00 "Sinds middernacht" tikt, moet dit 00:00–6:00 worden, niet 00:00–8:00. Alleen
   * zinvol op de dag die nu ook echt loopt (zie isToday). */
  const setSinceMidnight = () => {
    if (!loggedEvent) return;
    const anchor = new Date(loggedEvent.start_at);
    // Vanaf de dagrand (dagstart-uur) van de logische dag van het gekozen moment.
    const dayStart = dayWindow(logicalDay(anchor, dayStartHour), dayStartHour).start;

    rescheduleEvent(db, loggedEvent.id, dayStart, anchor).then((updatedAt) => {
      const updated: EventRow = {
        ...loggedEvent,
        start_at: dayStart.toISOString(),
        end_at: anchor.toISOString(),
        updated_at: updatedAt,
      };
      setLoggedEvent(updated);
      onLogged(updated);
    });
  };

  const handleSelectDetailField = (id: string) => {
    if (id === 'endOfDay') {
      setEndOfDay();
      return;
    }
    if (id === 'sinceMidnight') {
      setSinceMidnight();
      return;
    }
    if (id === 'endTime') {
      const now = new Date();
      setEndHour(String(now.getHours()));
      setEndMinute(String(now.getMinutes()));
    }
    if (id === 'temperature' && loggedEvent?.temperature_c !== null && loggedEvent?.temperature_c !== undefined) {
      const displayValue =
        tempUnit === 'fahrenheit'
          ? Math.round(((loggedEvent.temperature_c * 9) / 5 + 32) * 10) / 10
          : loggedEvent.temperature_c;
      setTemperatureValue(String(displayValue));
    }
    setDetailField(id as DetailField);
  };

  const activeEntry = wheelOrder.find((entry) => entry.id === activeEntryId) ?? null;
  const kindTotals = computeKindTotals(badgeEvents, badgeFrom, badgeTo);

  const groupItems: WheelRingItem[] =
    activeEntry?.groupMembers?.map((kind) => ({
      id: kind,
      label: EVENT_TYPES[kind].label(t),
      icon: EVENT_TYPES[kind].icon,
      iconSet: EVENT_TYPES[kind].iconSet,
      color: activeEntry.color,
      badge: formatKindBadge(kindTotals.get(kind), EVENT_TYPES[kind].isDuration, t),
    })) ?? [];

  const optionItems: WheelRingItem[] =
    activeKind && SECOND_LEVEL_OPTIONS[activeKind]
      ? SECOND_LEVEL_OPTIONS[activeKind]!.map((o) => ({
          id: o.id,
          label: o.label(t),
          icon: o.icon,
          iconSet: o.iconSet,
          color: o.color,
          caption: o.caption?.(t),
        }))
      : [];

  const canSetEndTime = Boolean(
    activeKind && loggedEvent && !loggedEvent.end_at && EVENT_TYPES[activeKind].isDuration
  );
  // Vindra heeft geen temperatuur-trackend event-type (dat was Nuvo-specifiek: de
  // 'fever'-variant van 'spit_up') — dit is de enige plek in het overgenomen wiel die
  // niet config-gedreven was, dus de enige bewuste handmatige aanpassing hier. De rest
  // van de temperatuur-machinerie (temperatureValue/temperatureC/detailField
  // 'temperature') blijft ongebruikt maar aanwezig, mocht een latere app dit wél nodig
  // hebben.
  const isFeverEntry = false;
  const temperatureLabel = tempUnit === 'fahrenheit' ? '°F' : '°C';
  const detailItems: WheelRingItem[] = [
    ...(activeKind && AMOUNT_KINDS.has(activeKind)
      ? [{ id: 'amount', label: volumeUnit, caption: t.wheel.amountCaption }]
      : []),
    ...(isFeverEntry ? [{ id: 'temperature', label: temperatureLabel }] : []),
    ...(canSetEndTime ? [{ id: 'endTime', icon: 'clock-end' as const, caption: t.wheel.endTimeCaption }] : []),
    ...(canSetEndTime ? [{ id: 'endOfDay', icon: 'weather-night' as const, caption: t.wheel.endOfDayCaption }] : []),
    ...(canSetEndTime && isToday
      ? [
          {
            id: 'sinceMidnight',
            icon: 'weather-sunset-up' as const,
            caption:
              dayStartHour === 0
                ? t.wheel.sinceMidnightCaption
                : t.wheel.sinceTimeCaption(formatTime(new Date(2000, 0, 1, dayStartHour), timeFormat)),
          },
        ]
      : []),
    { id: 'note', icon: 'notebook-outline' as const, caption: t.common.note },
  ];

  const activeLabel = activeKind
    ? `${EVENT_TYPES[activeKind].label(t)}${
        EVENT_TYPES[activeKind].isDuration ? (stoppingEvent ? t.wheel.endSuffix : t.wheel.startSuffix) : ''
      }`
    : (activeEntry?.label(t) ?? null);
  const activeLabelColor = activeKind ? EVENT_TYPES[activeKind].color : activeEntry?.color;

  const showCancel = stage !== 'closed';
  const showConfirm = stage === 'details' && !detailField;

  return (
    <View style={styles.layer} pointerEvents="box-none">
      {/* Once a specific event type is chosen, only the explicit cancel button (the red
          cross) may discard it — a mis-tap outside the wheel should no longer silently
          throw away a partially-logged event. Before that (still choosing within a
          group, e.g. which feeding type) tapping outside still closes as before, since
          nothing has actually started yet. */}
      {stage !== 'closed' && !activeKind && <Pressable style={StyleSheet.absoluteFill} onPress={handleCancel} />}

      {activeLabel && (
        <Text style={[styles.activeLabel, { top: activeLabelTop, color: activeLabelColor }]}>{activeLabel}</Text>
      )}

      {/* Wielknoppen + badges schuiven en vervagen samen weg bij inklappen — een tik erop
          bereikt ze dan niet meer (pointerEvents volgt de JS-staat, niet de geanimeerde
          waarde, want dat is geen style-property). Alleen déze twee kaarten zitten in de
          collapsible laag; ringen/bevestig-annuleer/invoerkaartjes hieronder niet, want
          die kunnen sowieso alleen verschijnen als het wiel al uitgeklapt was. */}
      <Animated.View style={[StyleSheet.absoluteFill, arcStyle]} pointerEvents={wheelExpanded ? 'box-none' : 'none'}>
        {wheelOrder.map((entry, index) => (
          <WheelButton
            key={entry.id}
            x={mirrorX(positions[index].x)}
            y={positions[index].y}
            color={entry.color}
            icon={entry.icon}
            iconSet={entry.iconSet}
            accessibilityLabel={entry.label(t)}
            caption={entry.label(t)}
            dimmed={activeEntryId !== null && activeEntryId !== entry.id}
            locked={isLocked(entry)}
            onPress={() => handleEntryPress(entry)}
          />
        ))}
        {/* Drawn after every main-wheel button so a badge is never visually covered by a
            neighbouring button — see WheelBadge. */}
        {wheelOrder.map((entry, index) => {
          if (activeEntryId !== null && activeEntryId !== entry.id) return null;
          const badge = entry.groupMembers
            ? formatGroupBadge(kindTotals, entry.groupMembers, t)
            : formatKindBadge(kindTotals.get(entry.kind!), EVENT_TYPES[entry.kind!].isDuration, t);
          if (!badge) return null;
          return (
            <WheelBadge
              key={entry.id}
              x={mirrorX(positions[index].x)}
              y={positions[index].y}
              text={badge}
              color={entry.color}
              screenWidth={width}
              screenHeight={height}
            />
          );
        })}
      </Animated.View>
      {stage === 'closed' && (
        <WheelHub
          mirrored={mirrored}
          y={pivot.y}
          expanded={wheelExpanded}
          onSetExpanded={setWheelExpanded}
          onCustomize={() => {
            setWheelExpanded(true);
            wiggle.value = withSequence(
              withTiming(-1.6, { duration: 60 }),
              withTiming(1.6, { duration: 80 }),
              withTiming(-1.2, { duration: 80 }),
              withTiming(1.2, { duration: 80 }),
              withTiming(0, { duration: 60 })
            );
            setTimeout(() => onCustomizeWheel?.(), 360);
          }}
        />
      )}

      {stage === 'group' && activeEntry && (
        <WheelRing
          items={groupItems}
          color={activeEntry.color}
          radius={radius + RADIUS_STEP}
          pivot={pivot}
          stepDeg={stepDeg}
          onSelect={(id) => beginKindFlow(id as EventKind)}
          mirrored={mirrored}
          screenWidth={width}
          screenHeight={height}
        />
      )}

      {stage === 'options' && activeKind && (
        <WheelRing
          items={optionItems}
          color={EVENT_TYPES[activeKind].color}
          radius={radius + RADIUS_STEP}
          pivot={pivot}
          stepDeg={stepDeg}
          onSelect={handleSelectOption}
          mirrored={mirrored}
          screenWidth={width}
          screenHeight={height}
        />
      )}

      {stage === 'manualTime' && (
        // variant="final": er valt hierna niks meer te kiezen (zie confirmManualTime),
        // dus dit ís de knop die het event daadwerkelijk logt — groen vinkje, niet amber.
        <InlineInputCard anchor={keyboardAnchor} mirrored={mirrored} onConfirm={confirmManualTime} variant="final">
          <TextInput
            style={styles.timeInput}
            value={manualHour}
            onChangeText={(text) => {
              setManualHour(text);
              if (text.length === 2) manualMinuteRef.current?.focus();
            }}
            keyboardType="number-pad"
            maxLength={2}
            autoFocus
            selectTextOnFocus
            placeholder={t.wheel.hourPlaceholder}
            placeholderTextColor="#AAB4B6"
          />
          <TextInput
            ref={manualMinuteRef}
            style={styles.timeInput}
            value={manualMinute}
            onChangeText={setManualMinute}
            keyboardType="number-pad"
            maxLength={2}
            selectTextOnFocus
            placeholder={t.wheel.minutePlaceholder}
            placeholderTextColor="#AAB4B6"
          />
          {timeFormat === '12h' && <AmPmToggle pm={manualPm} onChange={setManualPm} />}
        </InlineInputCard>
      )}

      {stage === 'details' && activeKind && !detailField && (
        <WheelRing
          items={detailItems}
          color={EVENT_TYPES[activeKind].color}
          radius={radius + RADIUS_STEP}
          pivot={pivot}
          stepDeg={stepDeg}
          onSelect={handleSelectDetailField}
          mirrored={mirrored}
          screenWidth={width}
          screenHeight={height}
        />
      )}

      {stage === 'details' && detailField === 'amount' && (
        <InlineInputCard anchor={keyboardAnchor} mirrored={mirrored} onConfirm={confirmDetailField}>
          <TextInput
            style={styles.amountInput}
            value={amountValue}
            onChangeText={setAmountValue}
            keyboardType="number-pad"
            autoFocus
            placeholder={t.wheel.amountPlaceholder(volumeUnit)}
            placeholderTextColor="#AAB4B6"
          />
        </InlineInputCard>
      )}

      {stage === 'details' && detailField === 'temperature' && (
        <InlineInputCard anchor={keyboardAnchor} mirrored={mirrored} onConfirm={confirmDetailField}>
          <TextInput
            style={styles.amountInput}
            value={temperatureValue}
            onChangeText={setTemperatureValue}
            keyboardType="decimal-pad"
            autoFocus
            placeholder={tempUnit === 'fahrenheit' ? '101.3' : '38.5'}
            placeholderTextColor="#AAB4B6"
          />
        </InlineInputCard>
      )}

      {stage === 'details' && detailField === 'endTime' && (
        <InlineInputCard anchor={keyboardAnchor} mirrored={mirrored} onConfirm={confirmEndTime}>
          <TextInput
            style={styles.timeInput}
            value={endHour}
            onChangeText={setEndHour}
            keyboardType="number-pad"
            maxLength={2}
            autoFocus
            placeholder={t.wheel.hourPlaceholder}
            placeholderTextColor="#AAB4B6"
          />
          <TextInput
            style={styles.timeInput}
            value={endMinute}
            onChangeText={setEndMinute}
            keyboardType="number-pad"
            maxLength={2}
            placeholder={t.wheel.minutePlaceholder}
            placeholderTextColor="#AAB4B6"
          />
        </InlineInputCard>
      )}

      {stage === 'details' && detailField === 'note' && (
        <InlineInputCard
          anchor={keyboardAnchor}
          mirrored={mirrored}
          onConfirm={confirmDetailField}
          width={quickNotes.length > 0 ? 260 : undefined}>
          <View style={styles.noteColumn}>
            {quickNotes.length > 0 && (
              <View style={styles.quickNoteRow}>
                {quickNotes.map((note) => (
                  <Pressable key={note} style={styles.quickNoteChip} onPress={() => applyQuickNote(note)}>
                    <Text style={styles.quickNoteLabel} numberOfLines={1}>
                      {note}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
            <TextInput
              style={styles.noteInput}
              value={noteValue}
              onChangeText={setNoteValue}
              autoFocus={quickNotes.length === 0}
              placeholder={t.common.note}
              placeholderTextColor="#AAB4B6"
            />
          </View>
        </InlineInputCard>
      )}

      {showCancel && (
        <WheelButton
          x={mirrorX(cancelPos.x)}
          y={cancelPos.y}
          color={CANCEL_COLOR}
          icon="close"
          accessibilityLabel={t.wheel.cancelLabel}
          onPress={handleCancel}
        />
      )}
      {showConfirm && (
        <WheelButton
          x={mirrorX(confirmPos.x)}
          y={confirmPos.y}
          color={NEXT_COLOR}
          icon="arrow-right"
          accessibilityLabel={t.wheel.doneLabel}
          onPress={reset}
        />
      )}

      <Modal visible={showPaywall} animationType="slide" onRequestClose={() => setShowPaywall(false)}>
        <PaywallScreen onClose={() => setShowPaywall(false)} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // Boven alles op het scherm: het wiel en zijn invoerkaartjes (tijd, hoeveelheid,
  // notitie) liggen over de kopbalk, en een kopbalk-rij met een eigen zIndex (Ebbly's
  // voortgangschips) tekende zich anders dwars door het kaartje heen.
  layer: {
    ...StyleSheet.absoluteFill,
    zIndex: 40,
  },
  activeLabel: {
    position: 'absolute',
    left: 0,
    right: 0,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  timeInput: {
    width: 44,
    color: '#F1EEE7',
    fontSize: 16,
    backgroundColor: '#12171C',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    textAlign: 'center',
  },
  amountInput: {
    flex: 1,
    color: '#F1EEE7',
    fontSize: 15,
    backgroundColor: '#12171C',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  noteInput: {
    flex: 1,
    color: '#F1EEE7',
    fontSize: 14,
    backgroundColor: '#12171C',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  noteColumn: {
    flex: 1,
    gap: 6,
  },
  quickNoteRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  quickNoteChip: {
    maxWidth: 120,
    backgroundColor: '#12171C',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  quickNoteLabel: {
    color: '#F1EEE7',
    fontSize: 12,
    fontWeight: '600',
  },
});
