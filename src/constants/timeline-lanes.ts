import { EVENT_TYPES, type EventKind, type Translated } from '@/constants/event-types';

export type LaneId = 'behavior' | 'mood' | 'medication' | 'other';

export interface TimelineLane {
  id: LaneId;
  label: Translated;
  kinds: EventKind[];
  color: string;
}

/** Vaste kolomindeling voor de tijdlijn — besloten 2026-09-21, zie PLAN.md sectie 4.
 * Zelfde 4-kolommen-structuur als Nuvo. Slaap staat bewust onder "Overig" samen met
 * positieve momenten i.p.v. een eigen 5e kolom, om bij Nuvo's bewezen indeling te
 * blijven. */
export const TIMELINE_LANES: TimelineLane[] = [
  {
    id: 'behavior',
    label: (t) => t.timeline.laneBehavior,
    // Uitgebreid 2026-09-21 met de conditie-specifieke typen die qua aard bij gedrag/
    // prikkels horen (ook als ze via "Wiel aanpassen" uitstaan — een lane moet elk
    // EventKind dekken, ongeacht of het wiel het toont).
    kinds: ['gedrag', 'prikkel', 'zelfverwonding', 'weglopen', 'stimmen'],
    // Eigen tint i.p.v. één van de leden hergebruiken — zelfde reden als Nuvo's
    // "Voeding"-pil: deze kolom groepeert meerdere types, dus reusen van bv. het rode
    // gedrag-icoon zou de pil laten lijken alsof-ie alleen over gedrag gaat.
    color: '#B98C8C',
  },
  { id: 'mood', label: (t) => t.timeline.laneMood, kinds: ['stemming'], color: EVENT_TYPES.stemming.color },
  { id: 'medication', label: (t) => t.timeline.laneMedication, kinds: ['medicatie'], color: EVENT_TYPES.medicatie.color },
  {
    id: 'other',
    label: (t) => t.timeline.laneOther,
    kinds: ['slaap', 'positief', 'overig', 'eten', 'zindelijkheid'],
    color: '#8C99B9',
  },
];

const KIND_TO_LANE_INDEX = ((): Record<EventKind, number> => {
  const lookup = {} as Record<EventKind, number>;
  TIMELINE_LANES.forEach((lane, index) => {
    lane.kinds.forEach((kind) => {
      lookup[kind] = index;
    });
  });
  const missing = (Object.keys(EVENT_TYPES) as EventKind[]).filter((kind) => !(kind in lookup));
  if (missing.length > 0) {
    throw new Error(`TIMELINE_LANES mist event-type(n): ${missing.join(', ')}`);
  }
  return lookup;
})();

export function laneIndexForKind(kind: EventKind): number {
  return KIND_TO_LANE_INDEX[kind];
}

/** Horizontal gutter shared by every timeline row. */
export const TIMELINE_HORIZONTAL_PADDING = 16;

const MIN_LANE_WIDTH = 60;

export function laneWidth(eventsAreaWidth: number): number {
  return Math.max(MIN_LANE_WIDTH, eventsAreaWidth / TIMELINE_LANES.length);
}
