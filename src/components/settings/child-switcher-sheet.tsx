import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { Child } from '@/db/child';
import { useActiveChild } from '@/lib/active-child-context';
import { useI18n } from '@/lib/i18n';

interface ChildSwitcherSheetProps {
  childList: Child[];
  onClose: () => void;
}

/** Lichte snelwissel-lijst voor onderweg — alleen wisselen, geen toevoegen/archiveren.
 * Dat blijft in instellingen ("Kinderen beheren…"), zie ChildrenSettingsSheet. */
export function ChildSwitcherSheet({ childList, onClose }: ChildSwitcherSheetProps) {
  const { t } = useI18n();
  const { childId, setChildId } = useActiveChild();

  const handleSelect = async (id: string) => {
    await setChildId(id);
    onClose();
  };

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>{t.children.title}</Text>
          <ScrollView style={styles.list}>
            {childList.map((child) => (
              <Pressable key={child.id} style={styles.row} onPress={() => handleSelect(child.id)}>
                <View style={[styles.avatar, child.id === childId && styles.avatarActive]}>
                  <MaterialCommunityIcons name="baby-face-outline" size={16} color="#12171C" />
                </View>
                <Text style={styles.rowLabel} numberOfLines={1}>
                  {child.name}
                </Text>
                {child.id === childId && <MaterialCommunityIcons name="check" size={18} color="#D6A866" />}
              </Pressable>
            ))}
          </ScrollView>
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
    width: 260,
    maxHeight: '60%',
    backgroundColor: '#1C252A',
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  title: {
    color: '#F1EEE7',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  list: {
    maxHeight: 260,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3a4250',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarActive: {
    backgroundColor: '#D6A866',
  },
  rowLabel: {
    flex: 1,
    color: '#F1EEE7',
    fontSize: 15,
    fontWeight: '600',
  },
});
