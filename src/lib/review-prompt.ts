import * as StoreReview from 'expo-store-review';
import type { SQLiteDatabase } from 'expo-sqlite';

import { getLoggingStats, getReviewPromptState, recordReviewPrompt } from '@/db/review-prompt';

const MIN_EVENTS = 10;
const MIN_DAYS = 3;
const MAX_ASKS = 3;
const MIN_DAYS_BETWEEN_ASKS = 120;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Vraagt om een App Store-beoordeling, maar alleen als iemand de app echt gebruikt: minstens
 * 10 events op minstens 3 verschillende dagen, hooguit 3 keer in totaal en niet vaker dan eens
 * per 120 dagen. Geen eigen "vind je de app leuk?"-vraag vooraf (Apple raadt dat af), alleen het
 * systeemvenster; iOS beperkt dat zelf nog verder (max. 3 keer per jaar) en toont het soms niet.
 * De aanroeper zorgt dat het moment klopt (net gelogd via het wiel, geen intro of paywall open,
 * geen nachtmodus). Gooit nooit: een mislukte vraag mag het loggen niet raken. */
export async function maybeAskForReview(db: SQLiteDatabase): Promise<void> {
  try {
    const state = await getReviewPromptState(db);
    if (state.count >= MAX_ASKS) return;
    const now = new Date();
    if (state.lastAskedAt && now.getTime() - state.lastAskedAt.getTime() < MIN_DAYS_BETWEEN_ASKS * DAY_MS) return;

    const stats = await getLoggingStats(db);
    if (stats.events < MIN_EVENTS || stats.days < MIN_DAYS) return;

    if (!(await StoreReview.isAvailableAsync()) || !(await StoreReview.hasAction())) return;
    await recordReviewPrompt(db, state, now);
    await StoreReview.requestReview();
  } catch (error) {
    console.warn('[review] vragen mislukt', error);
  }
}
