import type { IconSet } from '@/components/ui/event-icon';
import type { Dictionary } from '@/lib/i18n/translations';

export type EventKind =
  | 'gedrag'
  | 'prikkel'
  | 'stemming'
  | 'medicatie'
  | 'slaap'
  | 'positief'
  | 'overig'
  | 'zelfverwonding'
  | 'weglopen'
  | 'stimmen'
  | 'eten'
  | 'zindelijkheid';

/** Elke tekst is een functie van de vertaaltabel naar een string, in plaats van een
 * vaste string — deze config-objecten zijn module-scope constanten die maar één keer
 * gebouwd worden, terwijl de actieve taal tijdens gebruik kan wisselen. Zelfde patroon
 * als Nuvo (zie NEXT_APP_VINDRA.md/PLAN.md sectie 2). */
export type Translated = (t: Dictionary) => string;

export interface EventTypeConfig {
  kind: EventKind;
  label: Translated;
  icon: string;
  iconSet: IconSet;
  endIcon?: string;
  endIconSet?: IconSet;
  color: string;
  isDuration: boolean;
  hasSecondLevel: boolean;
  /** Of dit event-type een actief abonnement vereist. Bewust hier per-type i.p.v. een
   * database-/schemaveld — zelfde reden als bij Nuvo: een nieuw gratis/premium-type
   * mag nooit een migratie vergen. */
  requiresPremium: boolean;
  /** SF Symbol voor de beginscherm-widget: die draait in een aparte iOS-runtime die
   * alleen SwiftUI kent, dus niet onze eigen iconensets. */
  widgetSymbol: string;
}

export const EVENT_TYPES: Record<EventKind, EventTypeConfig> = {
  // Enige gratis event-type (besloten 2026-09-21, zie PLAN.md sectie 2): laat de
  // differentiator — snel loggen tijdens het moment zelf — direct zien, vangt het
  // emotioneel hoogste-inzet-moment (een meltdown), en voorkomt dat de gratis versie
  // aanvoelt als "nog een moodtracker". Rapport/export blijft wél premium.
  gedrag: {
    kind: 'gedrag',
    widgetSymbol: 'exclamationmark.triangle.fill',
    label: (t) => t.eventTypes.gedrag,
    icon: 'report-problem',
    iconSet: 'material',
    color: '#C97B7B',
    isDuration: false,
    hasSecondLevel: true,
    requiresPremium: false,
  },
  prikkel: {
    kind: 'prikkel',
    widgetSymbol: 'bolt.fill',
    label: (t) => t.eventTypes.prikkel,
    icon: 'lightning-bolt',
    iconSet: 'mci',
    color: '#8C7FC9',
    isDuration: false,
    hasSecondLevel: true,
    requiresPremium: true,
  },
  stemming: {
    kind: 'stemming',
    widgetSymbol: 'face.smiling',
    label: (t) => t.eventTypes.stemming,
    icon: 'mood',
    iconSet: 'material',
    color: '#E3C077',
    isDuration: false,
    hasSecondLevel: true,
    requiresPremium: true,
  },
  medicatie: {
    kind: 'medicatie',
    widgetSymbol: 'pills.fill',
    label: (t) => t.eventTypes.medicatie,
    icon: 'medication',
    iconSet: 'material',
    color: '#4FA79E',
    isDuration: false,
    hasSecondLevel: false,
    requiresPremium: true,
  },
  slaap: {
    kind: 'slaap',
    widgetSymbol: 'moon.fill',
    label: (t) => t.eventTypes.slaap,
    icon: 'bedtime',
    iconSet: 'material',
    endIcon: 'wb-sunny',
    endIconSet: 'material',
    color: '#6C7BC2',
    isDuration: true,
    hasSecondLevel: false,
    requiresPremium: true,
  },
  positief: {
    kind: 'positief',
    widgetSymbol: 'star.fill',
    label: (t) => t.eventTypes.positief,
    icon: 'star',
    iconSet: 'material',
    color: '#7FA37A',
    isDuration: false,
    hasSecondLevel: false,
    requiresPremium: true,
  },
  // Ontbrak nog (2026-09-21, feedback op een testrun): Nuvo's eigen wiel heeft een
  // "Overig"-vangnet-type (kind: 'custom') dat hier geen equivalent had. Zelfde functie:
  // direct loggen, geen tweede keuzelaag, vrije notitie erna.
  overig: {
    kind: 'overig',
    widgetSymbol: 'plus.circle.fill',
    label: (t) => t.eventTypes.overig,
    icon: 'add-circle',
    iconSet: 'material',
    color: '#9C8AC9',
    isDuration: false,
    hasSecondLevel: false,
    requiresPremium: true,
  },
  // De volgende vijf zijn bewust "conditie-specifiek/minder belangrijk" (zie
  // PLAN.md): `defaultEnabled: false` op hun WheelEntry hieronder, dus ze staan wél in
  // de catalogus (en daarmee in "Wiel aanpassen") maar niet standaard op het wiel.
  zelfverwonding: {
    kind: 'zelfverwonding',
    widgetSymbol: 'bandage.fill',
    label: (t) => t.eventTypes.zelfverwonding,
    icon: 'bandage',
    iconSet: 'mci',
    color: '#B5697A',
    isDuration: false,
    hasSecondLevel: true,
    requiresPremium: true,
  },
  weglopen: {
    kind: 'weglopen',
    widgetSymbol: 'figure.run',
    label: (t) => t.eventTypes.weglopen,
    icon: 'run-fast',
    iconSet: 'mci',
    color: '#C9A86A',
    isDuration: false,
    hasSecondLevel: false,
    requiresPremium: true,
  },
  stimmen: {
    kind: 'stimmen',
    widgetSymbol: 'hand.wave.fill',
    label: (t) => t.eventTypes.stimmen,
    icon: 'hand-wave',
    iconSet: 'mci',
    color: '#8FB39C',
    isDuration: false,
    hasSecondLevel: true,
    requiresPremium: true,
  },
  eten: {
    kind: 'eten',
    widgetSymbol: 'fork.knife',
    label: (t) => t.eventTypes.eten,
    icon: 'silverware-fork-knife',
    iconSet: 'mci',
    color: '#C4823F',
    isDuration: false,
    hasSecondLevel: true,
    requiresPremium: true,
  },
  zindelijkheid: {
    kind: 'zindelijkheid',
    widgetSymbol: 'toilet.fill',
    label: (t) => t.eventTypes.zindelijkheid,
    icon: 'toilet',
    iconSet: 'mci',
    color: '#7FA3A3',
    isDuration: false,
    hasSecondLevel: true,
    requiresPremium: true,
  },
};

export interface WheelEntry {
  id: string;
  label: Translated;
  icon: string;
  iconSet: IconSet;
  color: string;
  kind?: EventKind;
  groupMembers?: EventKind[];
  /** Staat dit type standaard aan op een vers wiel (geen opgeslagen instelling nog)?
   * Ontbreekt (undefined) = `true`. `false` voor de conditie-specifieke typen
   * hieronder — zij zitten wél in de catalogus (en dus in "Wiel aanpassen"), maar
   * moeten er bewust handmatig bij gezet worden. Besloten 2026-09-21 op basis van
   * onderzoek naar wat andere apps/begeleiders van deze doelgroep bijhouden, zie
   * PLAN.md. */
  defaultEnabled?: boolean;
}

function entryForKind(kind: EventKind, defaultEnabled?: boolean): WheelEntry {
  return {
    id: kind,
    label: EVENT_TYPES[kind].label,
    icon: EVENT_TYPES[kind].icon,
    iconSet: EVENT_TYPES[kind].iconSet,
    color: EVENT_TYPES[kind].color,
    kind,
    defaultEnabled,
  };
}

/** Nuvo's eigen wiel toont er maximaal 8 (zie DEFAULT_WHEEL_ORDER in de Nuvo-repo) — de
 * boog-geometrie (lib/wheel-geometry.ts) is nooit met meer getest. "Wiel aanpassen"
 * moet hier hard op controleren, niet alleen de standaardconfiguratie. */
export const MAX_ACTIVE_WHEEL_ENTRIES = 8;

// Geen wielgroepen (in tegenstelling tot Nuvo's "Voeding"/"Vast voedsel") — elk type is
// al op zichzelf betekenisvol genoeg om een eigen wielknop te verdienen, zie PLAN.md
// sectie 3. Volgorde: kern-typen eerst (gedrag als gratis anker), daaromheen hun
// conditie-specifieke buren (zelfverwonding/weglopen/stimmen bij gedrag/prikkel, eten/
// zindelijkheid bij de "overige" cluster), "overig" als vangnet laatst — zelfde
// afsluitende positie als Nuvo's "custom".
export const DEFAULT_WHEEL_ORDER: WheelEntry[] = [
  entryForKind('gedrag'),
  entryForKind('prikkel'),
  entryForKind('zelfverwonding', false),
  entryForKind('weglopen', false),
  entryForKind('stimmen', false),
  entryForKind('stemming'),
  entryForKind('medicatie'),
  entryForKind('slaap'),
  entryForKind('eten', false),
  entryForKind('zindelijkheid', false),
  entryForKind('positief'),
  entryForKind('overig'),
];

/** Past een opgeslagen wiel-instelling toe: alleen de meegegeven id's, in die volgorde,
 * zijn ingeschakeld. Onbekende id's worden genegeerd; een lege lijst valt terug op het
 * standaardwiel. Zonder opgeslagen instelling: alleen de kern-typen (`defaultEnabled
 * !== false`), niet de hele catalogus — zie DEFAULT_WHEEL_ORDER hierboven. Een te lange
 * opgeslagen lijst (corrupt/verouderd) wordt hard afgekapt op MAX_ACTIVE_WHEEL_ENTRIES,
 * dezelfde grens als "Wiel aanpassen" zelf afdwingt. Zie constants/event-types.ts in de
 * Nuvo-repo voor de volledige toelichting waarom hier bewust geen "vul aan met nieuwe
 * types"-logica in zit. */
export function wheelEntryRequiresPremium(entry: WheelEntry): boolean {
  if (entry.groupMembers) return entry.groupMembers.every((kind) => EVENT_TYPES[kind].requiresPremium);
  return entry.kind ? EVENT_TYPES[entry.kind].requiresPremium : false;
}

export function resolveWheelOrder(configIds: string[] | null): WheelEntry[] {
  if (!configIds || configIds.length === 0) {
    return DEFAULT_WHEEL_ORDER.filter((entry) => entry.defaultEnabled !== false);
  }
  const byId = new Map(DEFAULT_WHEEL_ORDER.map((entry) => [entry.id, entry]));
  const ordered = configIds
    .map((id) => byId.get(id))
    .filter((entry): entry is WheelEntry => Boolean(entry))
    .slice(0, MAX_ACTIVE_WHEEL_ENTRIES);
  return ordered.length > 0 ? ordered : DEFAULT_WHEEL_ORDER.filter((entry) => entry.defaultEnabled !== false);
}

export interface EventDetails {
  side?: string;
  variant?: string;
}

export interface SecondLevelOption {
  id: string;
  label: Translated;
  icon?: string;
  iconSet?: IconSet;
  color?: string;
  caption?: Translated;
  details: EventDetails;
}

export const SECOND_LEVEL_OPTIONS: Partial<Record<EventKind, SecondLevelOption[]>> = {
  gedrag: [
    { id: 'licht', label: (t) => t.eventOptions.gedragLicht, color: '#DDA5A5', details: { variant: 'licht' } },
    { id: 'matig', label: (t) => t.eventOptions.gedragMatig, color: '#C97B7B', details: { variant: 'matig' } },
    { id: 'heftig', label: (t) => t.eventOptions.gedragHeftig, color: '#A85C5C', details: { variant: 'heftig' } },
  ],
  // Elke optie met een icoon krijgt ook een `caption` (tekst onder de wielknop) — zonder
  // die tekst was niet te zien wát een icoontje precies voorstelde (bv. het verschil
  // tussen "licht"/"geur" is bij een klein icoon niet vanzelfsprekend), gevonden bij een
  // echte testrun op toestel (2026-09-21). Nuvo's eigen luier-opties (pee/poo/empty)
  // hebben om dezelfde reden al een caption; alleen "beide" niet, omdat dat daar de
  // enige is zonder eigen icoon.
  prikkel: [
    {
      id: 'geluid',
      label: (t) => t.eventOptions.prikkelGeluid,
      icon: 'ear-hearing',
      iconSet: 'mci',
      color: '#8C7FC9',
      caption: (t) => t.eventOptions.prikkelGeluid,
      details: { variant: 'geluid' },
    },
    {
      id: 'licht',
      label: (t) => t.eventOptions.prikkelLicht,
      icon: 'wb-sunny',
      iconSet: 'material',
      color: '#A79BD6',
      caption: (t) => t.eventOptions.prikkelLicht,
      details: { variant: 'licht' },
    },
    {
      id: 'aanraking',
      label: (t) => t.eventOptions.prikkelAanraking,
      icon: 'hand-back-right',
      iconSet: 'mci',
      color: '#7A6DB5',
      caption: (t) => t.eventOptions.prikkelAanraking,
      details: { variant: 'aanraking' },
    },
    {
      id: 'geur',
      label: (t) => t.eventOptions.prikkelGeur,
      icon: 'flower',
      iconSet: 'mci',
      color: '#9C8FD1',
      caption: (t) => t.eventOptions.prikkelGeur,
      details: { variant: 'geur' },
    },
    { id: 'anders', label: (t) => t.eventOptions.other, details: { variant: 'anders' } },
  ],
  stemming: [
    {
      id: '1',
      label: (t) => t.eventOptions.stemming1,
      icon: 'sentiment-very-dissatisfied',
      iconSet: 'material',
      color: '#C97B7B',
      caption: (t) => t.eventOptions.stemming1,
      details: { variant: '1' },
    },
    {
      id: '2',
      label: (t) => t.eventOptions.stemming2,
      icon: 'sentiment-dissatisfied',
      iconSet: 'material',
      color: '#D6A56E',
      caption: (t) => t.eventOptions.stemming2,
      details: { variant: '2' },
    },
    {
      id: '3',
      label: (t) => t.eventOptions.stemming3,
      icon: 'sentiment-neutral',
      iconSet: 'material',
      color: '#E3C077',
      caption: (t) => t.eventOptions.stemming3,
      details: { variant: '3' },
    },
    {
      id: '4',
      label: (t) => t.eventOptions.stemming4,
      icon: 'sentiment-satisfied',
      iconSet: 'material',
      color: '#A9C27F',
      caption: (t) => t.eventOptions.stemming4,
      details: { variant: '4' },
    },
    {
      id: '5',
      label: (t) => t.eventOptions.stemming5,
      icon: 'sentiment-very-satisfied',
      iconSet: 'material',
      color: '#7FA37A',
      caption: (t) => t.eventOptions.stemming5,
      details: { variant: '5' },
    },
  ],
  // Ernst hergebruikt bewust dezelfde variant-id's/labels als "gedrag" (licht/matig/
  // heftig) — zelfde concept, geen aparte Dictionary-sleutels nodig.
  zelfverwonding: [
    { id: 'licht', label: (t) => t.eventOptions.gedragLicht, color: '#D6A8B3', details: { variant: 'licht' } },
    { id: 'matig', label: (t) => t.eventOptions.gedragMatig, color: '#B5697A', details: { variant: 'matig' } },
    { id: 'heftig', label: (t) => t.eventOptions.gedragHeftig, color: '#8F4A59', details: { variant: 'heftig' } },
  ],
  stimmen: [
    {
      id: 'fladderen',
      label: (t) => t.eventOptions.stimmenFladderen,
      icon: 'hand-wave',
      iconSet: 'mci',
      color: '#8FB39C',
      caption: (t) => t.eventOptions.stimmenFladderen,
      details: { variant: 'fladderen' },
    },
    {
      id: 'geluiden',
      label: (t) => t.eventOptions.stimmenGeluiden,
      icon: 'account-voice',
      iconSet: 'mci',
      color: '#7A9E8C',
      caption: (t) => t.eventOptions.stimmenGeluiden,
      details: { variant: 'geluiden' },
    },
    {
      id: 'wiegen',
      label: (t) => t.eventOptions.stimmenWiegen,
      icon: 'autorenew',
      iconSet: 'mci',
      color: '#6B8F7D',
      caption: (t) => t.eventOptions.stimmenWiegen,
      details: { variant: 'wiegen' },
    },
    { id: 'anders', label: (t) => t.eventOptions.other, details: { variant: 'anders' } },
  ],
  eten: [
    {
      id: 'geweigerd',
      label: (t) => t.eventOptions.etenGeweigerd,
      icon: 'food-off',
      iconSet: 'mci',
      color: '#A2672F',
      caption: (t) => t.eventOptions.etenGeweigerd,
      details: { variant: 'geweigerd' },
    },
    {
      id: 'nieuw',
      label: (t) => t.eventOptions.etenNieuw,
      icon: 'food-variant',
      iconSet: 'mci',
      color: '#C4823F',
      caption: (t) => t.eventOptions.etenNieuw,
      details: { variant: 'nieuw' },
    },
    {
      id: 'gegeten',
      label: (t) => t.eventOptions.etenGegeten,
      icon: 'check-circle',
      iconSet: 'material',
      color: '#9DBA97',
      caption: (t) => t.eventOptions.etenGegeten,
      details: { variant: 'gegeten' },
    },
  ],
  zindelijkheid: [
    {
      id: 'geslaagd',
      label: (t) => t.eventOptions.zindelijkheidGeslaagd,
      icon: 'check-bold',
      iconSet: 'mci',
      color: '#9DBA97',
      caption: (t) => t.eventOptions.zindelijkheidGeslaagd,
      details: { variant: 'geslaagd' },
    },
    {
      id: 'ongelukje',
      label: (t) => t.eventOptions.zindelijkheidOngelukje,
      icon: 'close-thick',
      iconSet: 'mci',
      color: '#C97B7B',
      caption: (t) => t.eventOptions.zindelijkheidOngelukje,
      details: { variant: 'ongelukje' },
    },
  ],
};

/** Icon/kleur voor één gelogd event — de variant-specifieke waarde uit
 * `SECOND_LEVEL_OPTIONS` als die bestaat, anders het event-type zelf. Zelfde patroon
 * als Nuvo's getEventVisual. */
export function getEventVisual(kind: EventKind, variant: string | null): { icon: string; iconSet: IconSet; color: string } {
  const base = EVENT_TYPES[kind];
  const option = variant ? SECOND_LEVEL_OPTIONS[kind]?.find((o) => o.details.variant === variant) : undefined;
  return {
    icon: option?.icon ?? base.icon,
    iconSet: option?.iconSet ?? base.iconSet,
    color: option?.color ?? base.color,
  };
}

/** Of een kind-string uit de database, een sync-payload of een back-up een type is dat
 * deze app-versie kent. Een partner met een nieuwere versie kan een type loggen dat hier
 * (nog) niet bestaat; zo'n event slaan we over in plaats van te crashen op
 * `EVENT_TYPES[kind]` === undefined. */
export function isKnownEventKind(kind: string): kind is EventKind {
  return Object.prototype.hasOwnProperty.call(EVENT_TYPES, kind);
}
