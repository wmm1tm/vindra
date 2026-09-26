import { Alert } from 'react-native';

import type { TimeFormat } from '@/db/child';
import type { Dictionary } from '@/lib/i18n/translations';
import { formatTime } from '@/lib/time-options';

/** "Slaap loopt sinds 21:00. Om 06:00 stoppen?" — na een "start" van een verouderde widget
 * terwijl er al een slaap liep. Resolvet true bij [Stoppen], false bij [Nee]. */
export function confirmStopRunningSleep(
  t: Dictionary,
  timeFormat: TimeFormat,
  runningSince: Date,
  stopAt: Date
): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      t.sleepConflict.staleStartTitle,
      t.sleepConflict.staleStartMessage(formatTime(runningSince, timeFormat), formatTime(stopAt, timeFormat)),
      [
        { text: t.sleepConflict.keepRunning, style: 'cancel', onPress: () => resolve(false) },
        { text: t.sleepConflict.stop, onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    );
  });
}

/** Een stop terwijl de slaap al gestopt was (door de partner of op een ander toestel). Met
 * `onStartNew` erbij (wiel) staat er ook een knop "Nieuwe slaap starten", zodat een tik die
 * als stop bedoeld was nooit stil een nieuwe slaap start. */
export function showSleepAlreadyStopped(
  t: Dictionary,
  timeFormat: TimeFormat,
  lastEnd: Date | null,
  { onStartNew, onDismiss }: { onStartNew?: () => void; onDismiss?: () => void } = {}
) {
  const message = lastEnd
    ? t.sleepConflict.alreadyStoppedAt(formatTime(lastEnd, timeFormat))
    : t.sleepConflict.alreadyStopped;
  const buttons: Parameters<typeof Alert.alert>[2] = [{ text: t.sleepConflict.ok, style: 'cancel', onPress: onDismiss }];
  if (onStartNew) buttons.push({ text: t.sleepConflict.startNew, onPress: onStartNew });
  Alert.alert(t.sleepConflict.alreadyStoppedTitle, message, buttons, { cancelable: true, onDismiss });
}
