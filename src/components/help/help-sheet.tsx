import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useI18n } from '@/lib/i18n';
import type { Dictionary } from '@/lib/i18n/translations';

interface HelpSheetProps {
  onClose: () => void;
}

interface HelpSection {
  icon: string;
  title: (t: Dictionary) => string;
  body: (t: Dictionary) => string;
}

const SECTIONS: HelpSection[] = [
  {
    icon: 'gesture-tap-button',
    title: (t) => t.help.wheelTitle,
    body: (t) => t.help.wheelBody,
  },
  {
    icon: 'tune-variant',
    title: (t) => t.help.customizeTitle,
    body: (t) => t.help.customizeBody,
  },
  {
    icon: 'clipboard-text-outline',
    title: (t) => t.help.reportTitle,
    body: (t) => t.help.reportBody,
  },
  {
    icon: 'account-multiple-outline',
    title: (t) => t.help.shareTitle,
    body: (t) => t.help.shareBody,
  },
  {
    icon: 'shield-lock-outline',
    title: (t) => t.help.privacyTitle,
    body: (t) => t.help.privacyBody,
  },
];

/** Uitlegscherm, bereikbaar via het ?-icoon in de header — geen Nuvo-equivalent, want
 * Nuvo's feature-set is kleiner/vanzelfsprekender. Vindra's wiel-aanpassen-concept
 * (conditie-specifieke typen die je zelf aan/uit zet) is minder direct te ontdekken
 * dan de rest van de app, vandaar deze uitleg. */
export function HelpSheet({ onClose }: HelpSheetProps) {
  const { t } = useI18n();

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        {/* Full-bleed dismiss layer, behind the card — the card is a plain View, not a
         * Pressable wrapping the ScrollView, because a ScrollView nested inside a
         * Pressable's tap-swallowing wrapper never became scrollable in practice —
         * same structural approach as SettingsSheetShell's own dismissArea. */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>{t.help.title}</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <MaterialCommunityIcons name="close" size={20} color="#AAB4B6" />
            </Pressable>
          </View>
          <Text style={styles.intro}>{t.help.intro}</Text>
          <ScrollView style={styles.list}>
            {SECTIONS.map((section) => (
              <View key={section.title(t)} style={styles.section}>
                <View style={styles.sectionIcon}>
                  <MaterialCommunityIcons name={section.icon as never} size={16} color="#91B39B" />
                </View>
                <View style={styles.sectionText}>
                  <Text style={styles.sectionTitle}>{section.title(t)}</Text>
                  <Text style={styles.sectionBody}>{section.body(t)}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeLabel}>{t.common.close}</Text>
          </Pressable>
        </View>
      </View>
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
    width: 320,
    maxHeight: '82%',
    backgroundColor: '#1C252A',
    borderRadius: 16,
    padding: 18,
    gap: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: '#F1EEE7',
    fontSize: 18,
    fontWeight: '700',
  },
  intro: {
    color: '#AAB4B6',
    fontSize: 13,
    marginBottom: 8,
  },
  list: {
    maxHeight: 360,
    marginBottom: 4,
  },
  section: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  sectionIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(145,179,155,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionText: {
    flex: 1,
  },
  sectionTitle: {
    color: '#F1EEE7',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  sectionBody: {
    color: '#AAB4B6',
    fontSize: 13,
    lineHeight: 18,
  },
  closeButton: {
    alignSelf: 'center',
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  closeLabel: {
    color: '#AAB4B6',
    fontSize: 14,
  },
});
