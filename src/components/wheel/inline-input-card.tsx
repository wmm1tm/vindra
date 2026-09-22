import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

interface InlineInputCardProps {
  anchor: { x: number; y: number };
  children: ReactNode;
  onConfirm: () => void;
  mirrored?: boolean;
  width?: number;
  /** 'step' (default): confirms just this field and returns to the wheel — amber with an
   * arrow, matching every other "not done yet" affordance in the wheel. 'final': this
   * confirm literally logs the event right now (only the manual-time-entry field uses
   * this, since that's the one remaining case where nothing else is left to decide) —
   * green with a checkmark, the one true "event bevestigd" action. */
  variant?: 'step' | 'final';
}

const DEFAULT_CARD_WIDTH = 200;
const CARD_HEIGHT = 60;

export function InlineInputCard({
  anchor,
  children,
  onConfirm,
  mirrored = false,
  width = DEFAULT_CARD_WIDTH,
  variant = 'step',
}: InlineInputCardProps) {
  const isFinal = variant === 'final';
  // Measured after the first render so a taller card (e.g. the note field's quick-chip
  // row, only known once its content is in) still centers on `anchor` instead of always
  // assuming CARD_HEIGHT — that used to only shift the confirm button and input down by
  // however much the content grew, off the point it's meant to be anchored to.
  const [measuredHeight, setMeasuredHeight] = useState(CARD_HEIGHT);

  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onConfirm();
  };

  return (
    <View
      onLayout={(e) => setMeasuredHeight(e.nativeEvent.layout.height)}
      style={[
        styles.card,
        { width, left: mirrored ? anchor.x : anchor.x - width, top: anchor.y - measuredHeight / 2 },
      ]}>
      {children}
      <Pressable
        style={[styles.confirm, isFinal && styles.confirmFinal]}
        onPress={handleConfirm}
        hitSlop={8}>
        <MaterialCommunityIcons name={isFinal ? 'check' : 'arrow-right'} size={24} color="#12171C" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    minHeight: CARD_HEIGHT,
    backgroundColor: '#1C252A',
    borderRadius: 14,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  confirm: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#D6A866',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmFinal: {
    backgroundColor: '#7FA37A',
  },
});
