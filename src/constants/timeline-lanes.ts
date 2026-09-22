import { EVENT_TYPES, type EventKind, type Translated } from '@/constants/event-types';

export type LaneId = 'behavior' | 'sensory' | 'mood' | 'care';

export interface TimelineLane {
  id: LaneId;
  label: Translated;
  kinds: EventKind[];
  color: string;
}

/** Kolomindeling voor de tijdlijn — herzien 2026-09-22 (was besloten 2026-09-21, zie
 * PLAN.md sectie 4, maar dat was vóór de uitbreiding naar 12 event-typen). De oude
 * indeling ('behavior' bevatte 5 typen, 'other' ook 5) werd onoverzichtelijk zodra
 * meerdere van die typen rond hetzelfde moment gelogd worden — precies wanneer overzicht
 * het hardst nodig is (een meltdown veroorzaakt realistisch gedrag+prikkel+
 * zelfverwonding+weglopen+stimmen kort na elkaar). Nieuwe indeling groepeert op
 * betekenis i.p.v. simpelweg "kern-type erbij", en is bewust zo gekozen dat typen die
 * tijdens één crisismoment sámen gelogd worden (gedrag/zelfverwonding/weglopen) een
 * eigen, niet-overlappende kolom houden i.p.v. te concurreren met sensorische typen om
 * dezelfde ruimte. Blijft op 4 kolommen (niet meer): eventsAreaWidth op het kleinste
 * ondersteunde toestel (iPhone SE, ~287px) deelt door MIN_LANE_WIDTH (60) net geen 5
 * kolommen toe zonder dat de tijdlijn moet gaan horizontaal scrollen, wat de UI niet
 * ondersteunt.
 *
 * - **Gedrag** (`behavior`): gedrag, zelfverwonding, weglopen — exact dezelfde groep die
 *   al de uitgebreide ABC-velden krijgt in `event-detail-sheet.tsx` ("iets ging mis, wat
 *   ging eraan vooraf"-achtige gebeurtenissen). Bewust géén prikkel/stimmen meer hierin.
 * - **Prikkel** (`sensory`): prikkel, stimmen — de sensorische familie; stimmen is vaak
 *   zelf een sensorische zelfregulatiestrategie, hoort inhoudelijk dichter bij prikkel
 *   dan bij gedrag/incidenten.
 * - **Stemming** (`mood`): stemming, positief — het "hoe gaat het emotioneel"-signaal;
 *   positief is het positieve tegenwicht van stemming, geen incident of routine.
 * - **Verzorging** (`care`): medicatie, slaap, eten, zindelijkheid, overig — routine-/
 *   verzorgingsmomenten plus het vangnet-type. Groter dan de andere kolommen (5 typen),
 *   maar dit zijn juist de typen die zelden allemaal tegelijk binnen enkele minuten
 *   gelogd worden (in tegenstelling tot een acuut gedragsmoment), dus het praktische
 *   overlap-risico is laag ondanks het hogere aantal. */
export const TIMELINE_LANES: TimelineLane[] = [
  {
    id: 'behavior',
    label: (t) => t.timeline.laneBehavior,
    kinds: ['gedrag', 'zelfverwonding', 'weglopen'],
    // Eigen tint i.p.v. één van de leden hergebruiken — deze kolom groepeert meerdere
    // types, dus reusen van bv. het gedrag-icoon zou de pil laten lijken alsof-ie alleen
    // over gedrag gaat.
    color: '#B98C8C',
  },
  {
    id: 'sensory',
    label: (t) => t.timeline.laneSensory,
    kinds: ['prikkel', 'stimmen'],
    // Hergebruikt de gedempte blauwtint uit het app-brede kleurenpalet (zie app.json/
    // PLAN.md "Schemering met saliegroen") — geeft die ondersteunende kleur een
    // functionele rol i.p.v. ergens los toegepast te worden.
    color: '#879BC2',
  },
  {
    id: 'mood',
    label: (t) => t.timeline.laneMood,
    kinds: ['stemming', 'positief'],
    // Zelfde saliegroen als de twee decoratieve UI-accenten — positief/groen is al de
    // bestaande associatie in de stemmingsschaal zelf (stemming5 = '#7FA37A', ook groen).
    color: '#91B39B',
  },
  {
    id: 'care',
    label: (t) => t.timeline.laneCare,
    kinds: ['medicatie', 'slaap', 'eten', 'zindelijkheid', 'overig'],
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
