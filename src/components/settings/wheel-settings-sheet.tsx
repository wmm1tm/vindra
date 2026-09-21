import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';

import { SettingsSheetShell } from '@/components/settings/settings-sheet-shell';
import { EventIcon } from '@/components/ui/event-icon';
import { PrimaryButton } from '@/components/ui/primary-button';
import { DEFAULT_WHEEL_ORDER, type WheelEntry } from '@/constants/event-types';
import type { Dictionary } from '@/lib/i18n/translations';
import { useI18n } from '@/lib/i18n';
import { usePreferences } from '@/lib/preferences-context';

interface WheelSettingsSheetProps {
  onClose: () => void;
}

interface Row {
  entry: WheelEntry;
  enabled: boolean;
}

const ROW_HEIGHT = 52;

function buildInitialRows(config: string[] | null): Row[] {
  if (!config) {
    return DEFAULT_WHEEL_ORDER.map((entry) => ({ entry, enabled: true }));
  }
  const enabled = config
    .map((id) => DEFAULT_WHEEL_ORDER.find((entry) => entry.id === id))
    .filter((entry): entry is WheelEntry => Boolean(entry))
    .map((entry) => ({ entry, enabled: true }));
  const disabled = DEFAULT_WHEEL_ORDER.filter((entry) => !config.includes(entry.id)).map((entry) => ({
    entry,
    enabled: false,
  }));
  return [...enabled, ...disabled];
}

/** One reorderable row. Only the drag-handle icon starts a pan — the checkbox and label
 * stay plain taps. While dragging, this row floats free at `dragStartIndex * ROW_HEIGHT +
 * dragY` (fixed to where the drag *began*, never to this row's live `index` prop, which
 * keeps changing as `onReorder` shuffles the array underneath it — using the live index
 * here instead would make the row's on-screen position jump every time it swaps past
 * another one). Every other row just renders at `index * ROW_HEIGHT`, so it visually
 * slides into place as the array reorders around the floating row. */
function DraggableWheelRow({
  row,
  index,
  rowCount,
  draggingId,
  dragStartIndex,
  dragY,
  onToggle,
  onReorder,
  onDragEnd,
  t,
}: {
  row: Row;
  index: number;
  rowCount: number;
  draggingId: SharedValue<string | null>;
  dragStartIndex: SharedValue<number>;
  dragY: SharedValue<number>;
  onToggle: () => void;
  onReorder: (entryId: string, targetIndex: number) => void;
  onDragEnd: () => void;
  t: Dictionary;
}) {
  const entryId = row.entry.id;
  const lastTarget = useSharedValue(index);

  // react-hooks/immutability doesn't know about Reanimated's shared-value model yet —
  // mutating `.value` on a shared value received as a prop is exactly how Reanimated is
  // meant to be used (that's the whole point of a *shared* value), not a real props
  // mutation.
  /* eslint-disable react-hooks/immutability */
  const pan = Gesture.Pan()
    .onStart(() => {
      draggingId.value = entryId;
      dragStartIndex.value = index;
      lastTarget.value = index;
      dragY.value = 0;
    })
    .onUpdate((e) => {
      if (draggingId.value !== entryId) return;
      dragY.value = e.translationY;
      const rawTarget = Math.round((dragStartIndex.value * ROW_HEIGHT + e.translationY) / ROW_HEIGHT);
      const clamped = Math.min(Math.max(rawTarget, 0), rowCount - 1);
      if (clamped === lastTarget.value) return;
      lastTarget.value = clamped;
      runOnJS(onReorder)(entryId, clamped);
    })
    .onEnd(() => {
      dragY.value = withSpring(0, { damping: 20, stiffness: 300 });
      draggingId.value = null;
      runOnJS(onDragEnd)();
    });
  /* eslint-enable react-hooks/immutability */

  const animatedStyle = useAnimatedStyle(() => {
    const isDragging = draggingId.value === entryId;
    return {
      top: isDragging ? dragStartIndex.value * ROW_HEIGHT + dragY.value : index * ROW_HEIGHT,
      zIndex: isDragging ? 1 : 0,
      opacity: isDragging ? 0.92 : 1,
    };
  });

  return (
    <Animated.View style={[styles.row, animatedStyle]}>
      <Pressable
        style={[styles.checkbox, row.enabled && { backgroundColor: row.entry.color }]}
        onPress={onToggle}
        hitSlop={6}>
        {row.enabled && <MaterialCommunityIcons name="check" size={14} color="#12161c" />}
      </Pressable>
      <View style={[styles.icon, { backgroundColor: row.entry.color }]}>
        <EventIcon name={row.entry.icon} set={row.entry.iconSet} size={16} color="#12161c" />
      </View>
      <Text style={[styles.rowLabel, !row.enabled && styles.rowLabelDisabled]} numberOfLines={1}>
        {row.entry.label(t)}
      </Text>
      <GestureDetector gesture={pan}>
        <View style={styles.dragHandle} hitSlop={6}>
          <MaterialCommunityIcons name="drag-horizontal-variant" size={22} color="#8B95A1" />
        </View>
      </GestureDetector>
    </Animated.View>
  );
}

export function WheelSettingsSheet({ onClose }: WheelSettingsSheetProps) {
  const preferences = usePreferences();
  const { t } = useI18n();
  const [rows, setRows] = useState<Row[]>(() => buildInitialRows(preferences.wheelConfig));
  const [saved, setSaved] = useState(false);

  const draggingId = useSharedValue<string | null>(null);
  const dragStartIndex = useSharedValue(0);
  const dragY = useSharedValue(0);

  const toggleRow = (index: number) => {
    setRows((current) => current.map((row, i) => (i === index ? { ...row, enabled: !row.enabled } : row)));
    setSaved(false);
  };

  const reorderRows = (entryId: string, targetIndex: number) => {
    setRows((current) => {
      const fromIndex = current.findIndex((row) => row.entry.id === entryId);
      if (fromIndex === -1 || fromIndex === targetIndex) return current;
      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
    setSaved(false);
  };

  const handleSave = () => {
    const enabledIds = rows.filter((row) => row.enabled).map((row) => row.entry.id);
    preferences.save({ wheelConfig: enabledIds.length > 0 ? enabledIds : null }).then(() => setSaved(true));
  };

  return (
    <SettingsSheetShell
      nested
      title={t.wheelSettings.title}
      onClose={onClose}
      footer={
        <>
          <Pressable onPress={onClose}>
            <Text style={styles.closeLabel}>{t.common.close}</Text>
          </Pressable>
          <PrimaryButton label={saved ? t.common.saved : t.common.save} onPress={handleSave} />
        </>
      }>
      <Text style={styles.hint}>{t.wheelSettings.hint}</Text>

      <View style={[styles.list, { height: rows.length * ROW_HEIGHT }]}>
        {rows.map((row, index) => (
          <DraggableWheelRow
            key={row.entry.id}
            row={row}
            index={index}
            rowCount={rows.length}
            draggingId={draggingId}
            dragStartIndex={dragStartIndex}
            dragY={dragY}
            onToggle={() => toggleRow(index)}
            onReorder={reorderRows}
            onDragEnd={() => {}}
            t={t}
          />
        ))}
      </View>
    </SettingsSheetShell>
  );
}

const styles = StyleSheet.create({
  hint: {
    color: '#8B95A1',
    fontSize: 12,
    marginBottom: 8,
  },
  list: {
    position: 'relative',
  },
  row: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#3a4250',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    flex: 1,
    color: '#ECEDEE',
    fontSize: 14,
    fontWeight: '600',
  },
  rowLabelDisabled: {
    color: '#8B95A1',
  },
  dragHandle: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeLabel: {
    color: '#8B95A1',
    fontSize: 14,
  },
});
