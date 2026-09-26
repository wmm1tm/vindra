import { minutesFromWindowStart } from '@/lib/day-window';

interface TimedItem {
  start_at: string;
}

export function assignColumns<T extends TimedItem>(
  items: T[],
  dotSize: number,
  pixelsPerHour: number,
  /** Begin van het dagvenster: posities zijn verstreken tijd sinds dan, zodat 23:50 en
   * 00:05 gewoon onder elkaar staan (ze delen geen kolom meer door de middernacht-sprong). */
  windowStart: Date
): Map<T, number> {
  const sorted = [...items].sort((a, b) => a.start_at.localeCompare(b.start_at));
  const columnBottoms: number[] = [];
  const result = new Map<T, number>();

  for (const item of sorted) {
    const top = (minutesFromWindowStart(new Date(item.start_at), windowStart) / 60) * pixelsPerHour;
    let column = columnBottoms.findIndex((bottom) => top - bottom >= dotSize);

    if (column === -1) {
      column = columnBottoms.length;
      columnBottoms.push(top + dotSize);
    } else {
      columnBottoms[column] = top + dotSize;
    }

    result.set(item, column);
  }

  return result;
}

interface RangedItem {
  start_at: string;
  end_at: string | null;
}

/** Kolomtoewijzing op basis van echte tijdsoverlap (zoomonafhankelijk), voor duur-events. */
export function assignIntervalColumns<T extends RangedItem>(items: T[]): Map<T, number> {
  const sorted = [...items].sort((a, b) => a.start_at.localeCompare(b.start_at));
  const columnEnds: number[] = [];
  const result = new Map<T, number>();

  for (const item of sorted) {
    const start = new Date(item.start_at).getTime();
    const end = item.end_at ? new Date(item.end_at).getTime() : Date.now();
    let column = columnEnds.findIndex((columnEnd) => columnEnd <= start);

    if (column === -1) {
      column = columnEnds.length;
      columnEnds.push(end);
    } else {
      columnEnds[column] = end;
    }

    result.set(item, column);
  }

  return result;
}
