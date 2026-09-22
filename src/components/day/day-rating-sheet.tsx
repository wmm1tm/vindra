import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useI18n } from '@/lib/i18n';

const RATINGS = Array.from({ length: 10 }, (_, i) => i + 1);

interface DayRatingSheetProps {
  currentRating: number | null;
  onClose: () => void;
  onSelect: (rating: number) => void;
}

export function DayRatingSheet({ currentRating, onClose, onSelect }: DayRatingSheetProps) {
  const { t } = useI18n();
  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>{t.dayRating.title}</Text>
          <View style={styles.grid}>
            {RATINGS.map((rating) => (
              <Pressable
                key={rating}
                style={[styles.ratingButton, rating === currentRating && styles.ratingButtonActive]}
                onPress={() => onSelect(rating)}>
                <Text style={[styles.ratingLabel, rating === currentRating && styles.ratingLabelActive]}>
                  {rating}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: 300,
    backgroundColor: '#1C252A',
    borderRadius: 16,
    padding: 20,
    gap: 14,
  },
  title: {
    color: '#F1EEE7',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  ratingButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#12171C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingButtonActive: {
    backgroundColor: '#D6A866',
  },
  ratingLabel: {
    color: '#F1EEE7',
    fontSize: 16,
    fontWeight: '600',
  },
  ratingLabelActive: {
    color: '#12171C',
  },
});
