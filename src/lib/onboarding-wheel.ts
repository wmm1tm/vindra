import { DEFAULT_WHEEL_ORDER, MAX_ACTIVE_WHEEL_ENTRIES, type EventKind, type WheelEntry } from '@/constants/event-types';

/** De conditie-specifieke typen die de intro aanbiedt: precies de entries die standaard
 * uit staan (`defaultEnabled: false`), afgeleid in plaats van hier opnieuw opgesomd, zodat
 * een nieuw optioneel type vanzelf in de intro verschijnt. */
export const OPTIONAL_WHEEL_ENTRIES: WheelEntry[] = DEFAULT_WHEEL_ORDER.filter((entry) => entry.defaultEnabled === false);

const BASE_WHEEL_ENTRIES: WheelEntry[] = DEFAULT_WHEEL_ORDER.filter((entry) => entry.defaultEnabled !== false);

/** Welke basisknoppen als eerste plaatsmaken als de keuze in de intro samen met de basis
 * niet onder MAX_ACTIVE_WHEEL_ENTRIES past. Vangnet "Overig" eerst (een notitie kan ook bij
 * elk ander event), dan "Positief moment", dan Slaap, dan Medicatie. Gedrag, Prikkel en
 * Stemming blijven altijd staan: dat is de kern van het rapport voor school of
 * behandelaar. Alles wat wegvalt, is later met één tik terug te zetten via "Wiel
 * aanpassen", en de intro zegt dat er ook bij. */
const DROP_ORDER: EventKind[] = ['overig', 'positief', 'slaap', 'medicatie'];

export interface OnboardingWheel {
  /** Entry-ids voor `wheelConfig`, in de vaste volgorde van DEFAULT_WHEEL_ORDER. */
  ids: string[];
  /** Basisknoppen die wegvielen om binnen het maximum te blijven (leeg als alles past). */
  dropped: WheelEntry[];
}

/** Van de keuzes in de intro ("wat speelt er bij je kind?") naar een wielindeling: de
 * basis plus de gekozen optionele typen, begrensd op MAX_ACTIVE_WHEEL_ENTRIES. */
export function wheelFromSelection(selected: ReadonlySet<string>): OnboardingWheel {
  const optional = OPTIONAL_WHEEL_ENTRIES.filter((entry) => selected.has(entry.id));
  const kept = new Set(BASE_WHEEL_ENTRIES.map((entry) => entry.id));
  const dropped: WheelEntry[] = [];
  for (const kind of DROP_ORDER) {
    if (kept.size + optional.length <= MAX_ACTIVE_WHEEL_ENTRIES) break;
    const entry = BASE_WHEEL_ENTRIES.find((candidate) => candidate.kind === kind);
    if (entry && kept.delete(entry.id)) dropped.push(entry);
  }
  for (const entry of optional) kept.add(entry.id);
  const ids = DEFAULT_WHEEL_ORDER.filter((entry) => kept.has(entry.id))
    .map((entry) => entry.id)
    .slice(0, MAX_ACTIVE_WHEEL_ENTRIES);
  return { ids, dropped };
}

/** Welke optionele typen al op een opgeslagen wiel staan: het startpunt van de keuzestap
 * als iemand de intro later opnieuw bekijkt. */
export function selectionFromWheelConfig(config: string[] | null): Set<string> {
  if (!config) return new Set();
  return new Set(OPTIONAL_WHEEL_ENTRIES.filter((entry) => config.includes(entry.id)).map((entry) => entry.id));
}
