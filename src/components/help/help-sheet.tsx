import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SettingsSheetShell } from '@/components/settings/settings-sheet-shell';
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
  { icon: 'gesture-tap-button', title: (t) => t.help.wheelTitle, body: (t) => t.help.wheelBody },
  { icon: 'clock-edit-outline', title: (t) => t.help.timeTitle, body: (t) => t.help.timeBody },
  { icon: 'pencil-outline', title: (t) => t.help.editTitle, body: (t) => t.help.editBody },
  { icon: 'tune-variant', title: (t) => t.help.customizeTitle, body: (t) => t.help.customizeBody },
  { icon: 'gesture-tap', title: (t) => t.help.headerTitle, body: (t) => t.help.headerBody },
  { icon: 'clipboard-text-outline', title: (t) => t.help.reportTitle, body: (t) => t.help.reportBody },
  { icon: 'account-multiple-outline', title: (t) => t.help.shareTitle, body: (t) => t.help.shareBody },
  { icon: 'shield-lock-outline', title: (t) => t.help.privacyTitle, body: (t) => t.help.privacyBody },
];

/** Uitlegscherm, geopend vanuit Instellingen (bewust geen extra icoon in de al volle
 * kopbalk). Behandelt vooral wat je niet vanzelf ontdekt: tijd markeren door de tijdlijn
 * vast te houden, events verslepen, wat de kopbalk-icoontjes doen (⇄ is linkshandig) en
 * waar je de conditie-specifieke wielknoppen aanzet. Ingesloten (`nested`) net als de
 * andere sub-schermen van Instellingen, zie SettingsSheetShell — een eigen Modal bovenop
 * de Instellingen-Modal kan op iOS stilletjes niet verschijnen. */
export function HelpSheet({ onClose }: HelpSheetProps) {
  const { t } = useI18n();

  return (
    <SettingsSheetShell
      nested
      title={t.help.title}
      onClose={onClose}
      footer={
        <Pressable onPress={onClose}>
          <Text style={styles.closeLabel}>{t.common.close}</Text>
        </Pressable>
      }>
      <Text style={styles.intro}>{t.help.intro}</Text>
      {SECTIONS.map((section) => (
        <View key={section.icon} style={styles.section}>
          <View style={styles.sectionIcon}>
            <MaterialCommunityIcons name={section.icon as never} size={16} color="#91B39B" />
          </View>
          <View style={styles.sectionText}>
            <Text style={styles.sectionTitle}>{section.title(t)}</Text>
            <Text style={styles.sectionBody}>{section.body(t)}</Text>
          </View>
        </View>
      ))}
    </SettingsSheetShell>
  );
}

const styles = StyleSheet.create({
  intro: {
    color: '#AAB4B6',
    fontSize: 12,
    marginBottom: 8,
  },
  section: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
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
  closeLabel: {
    color: '#AAB4B6',
    fontSize: 14,
  },
});
