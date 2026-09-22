import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import { BirthDateFields, parseBirthDate } from '@/components/settings/birth-date-fields';
import { ChildShareSheet } from '@/components/settings/child-share-sheet';
import { SectionLabel, SwipeToReveal } from '@/components/settings/settings-rows';
import { SettingsSheetShell } from '@/components/settings/settings-sheet-shell';
import { PrimaryButton } from '@/components/ui/primary-button';
import {
  createChild,
  deleteChild,
  listChildren,
  renameChild,
  setChildActive,
  updateChildBirthDate,
  type Child,
} from '@/db/child';
import { useActiveChild } from '@/lib/active-child-context';
import { useI18n } from '@/lib/i18n';
import { unshareChild } from '@/lib/sync';

interface ChildrenSettingsSheetProps {
  onClose: () => void;
}

export function ChildrenSettingsSheet({ onClose }: ChildrenSettingsSheetProps) {
  const db = useSQLiteContext();
  const { t } = useI18n();
  const { childId, setChildId } = useActiveChild();
  const [children, setChildren] = useState<Child[]>([]);
  const [newName, setNewName] = useState('');
  const [newDay, setNewDay] = useState('');
  const [newMonth, setNewMonth] = useState('');
  const [newYear, setNewYear] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingDay, setEditingDay] = useState('');
  const [editingMonth, setEditingMonth] = useState('');
  const [editingYear, setEditingYear] = useState('');
  const [sharingChild, setSharingChild] = useState<Child | null>(null);
  const [showLinkSheet, setShowLinkSheet] = useState(false);

  const refresh = useCallback(() => {
    listChildren(db, true).then(setChildren);
  }, [db]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    const id = await createChild(db, name, parseBirthDate(newDay, newMonth, newYear));
    setNewName('');
    setNewDay('');
    setNewMonth('');
    setNewYear('');
    refresh();
    await setChildId(id);
  };

  const handleSelect = async (id: string) => {
    await setChildId(id);
  };

  const handleArchive = async (id: string, isActive: boolean) => {
    // Archiving the last remaining active child would leave nothing to fall back the
    // active selection to (see below) — the app would keep pointing at an archived
    // child for the rest of the session, with no way to log anything. Block it outright
    // rather than land in that state.
    if (isActive && children.filter((c) => c.isActive).length <= 1) {
      Alert.alert(t.children.archiveButton, t.children.lastActiveWarning);
      return;
    }
    await setChildActive(db, id, !isActive);
    const fresh = await listChildren(db, true);
    setChildren(fresh);
    // Archiving the currently-selected child leaves it pointed at a row that no longer
    // counts as active — same fallback as handleDeleteChild, so the app never gets stuck
    // showing (or trying to log against) an archived child.
    if (isActive && childId === id) {
      const fallback = fresh.find((c) => c.isActive);
      if (fallback) await setChildId(fallback.id);
    }
  };

  const handleDeleteChild = async (id: string) => {
    // Best effort, before the local rows disappear — deleteChild itself needs no sync
    // knowledge (see its own comment), so this stays here rather than inside it.
    await unshareChild(db, id);
    await deleteChild(db, id);
    const fresh = await listChildren(db, true);
    setChildren(fresh);
    // The deleted child could still be the one selected on this device (e.g. it was
    // archived while active, without switching away first) — fall back to another
    // active child rather than leaving the app pointed at a row that no longer exists.
    if (childId === id) {
      const fallback = fresh.find((c) => c.isActive);
      if (fallback) await setChildId(fallback.id);
    }
  };

  const startEditing = (child: Child) => {
    setEditingId(child.id);
    setEditingName(child.name);
    const birthDate = new Date(child.birthDate);
    setEditingDay(String(birthDate.getDate()));
    setEditingMonth(String(birthDate.getMonth() + 1));
    setEditingYear(String(birthDate.getFullYear()));
  };

  const confirmEdit = async () => {
    const name = editingName.trim();
    if (editingId && name) {
      await renameChild(db, editingId, name);
      const birthDate = parseBirthDate(editingDay, editingMonth, editingYear);
      if (birthDate) await updateChildBirthDate(db, editingId, birthDate);
      refresh();
    }
    setEditingId(null);
  };

  const confirmDeletePrompt = (child: Child) => {
    Alert.alert(t.children.deleteButton, t.children.deleteWarning(child.name), [
      { text: t.common.cancel, style: 'cancel' },
      { text: t.children.deleteButton, style: 'destructive', onPress: () => handleDeleteChild(child.id) },
    ]);
  };

  // Vervangt de vroegere krappe rij met vijf losse tikzones (potlood/delen/archiveren/
  // prullenbak) door één herkenbaar "•••"-menu — standaard patroon voor zeldzame/
  // destructieve rij-acties, en met meer ruimte per optie dan naast elkaar passende
  // icoontjes.
  const handleRowMenu = (child: Child) => {
    const buttons: Parameters<typeof Alert.alert>[2] = [{ text: t.children.editButton, onPress: () => startEditing(child) }];
    if (child.isActive) {
      buttons.push({ text: t.children.shareButton, onPress: () => setSharingChild(child) });
      buttons.push({ text: t.children.archiveButton, onPress: () => handleArchive(child.id, true) });
    } else {
      buttons.push({ text: t.children.restoreButton, onPress: () => handleArchive(child.id, false) });
      buttons.push({ text: t.children.deleteButton, style: 'destructive', onPress: () => confirmDeletePrompt(child) });
    }
    buttons.push({ text: t.common.cancel, style: 'cancel' });
    Alert.alert(child.name, undefined, buttons);
  };

  const active = children.filter((child) => child.isActive);
  const archived = children.filter((child) => !child.isActive);

  // Veeg naar links i.p.v. een apart "•••"-tikdoel — zelfde gebaar als "Kinderen
  // beheren"/"Wiel aanpassen" en de verwijder-dag-rij in instellingen, voor consequent
  // gedrag. Een gewone tik bereikt nog gewoon de rowMain-Pressable eronder (zie
  // SwipeToReveal), dus kind-selectie blijft een tik.
  const renderRow = (child: Child) => (
    <SwipeToReveal key={child.id} onTrigger={() => handleRowMenu(child)} revealIcon="dots-horizontal">
      <View style={styles.row}>
        <Pressable style={styles.rowMain} onPress={() => handleSelect(child.id)} disabled={!child.isActive}>
          <LinearGradient
            colors={child.id === childId ? ['#E5BE87', '#D6A866'] : ['#454e5c', '#333c4a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatar}>
            <MaterialCommunityIcons name="baby-face-outline" size={16} color="#12171C" />
          </LinearGradient>
          <Text style={styles.rowLabel} numberOfLines={1}>
            {child.name}
          </Text>
          {child.id === childId && <Text style={styles.activeLabel}>{t.children.active}</Text>}
        </Pressable>
        <MaterialCommunityIcons name="gesture-swipe-left" size={16} color="#AAB4B6" />
      </View>
    </SwipeToReveal>
  );

  const isEditing = editingId !== null;

  return (
    <>
      <SettingsSheetShell
        nested
        title={isEditing ? t.children.editTitle : t.children.title}
        onClose={isEditing ? () => setEditingId(null) : onClose}
        footer={
          isEditing ? (
            <>
              <Pressable onPress={() => setEditingId(null)}>
                <Text style={styles.closeLabel}>{t.common.cancel}</Text>
              </Pressable>
              <PrimaryButton label={t.common.save} onPress={confirmEdit} />
            </>
          ) : (
            <Pressable onPress={onClose}>
              <Text style={styles.closeLabel}>{t.common.close}</Text>
            </Pressable>
          )
        }>
        {isEditing ? (
          <View style={styles.editForm}>
            <Text style={styles.dateLabel}>{t.children.namePlaceholder}</Text>
            <TextInput
              style={styles.input}
              value={editingName}
              onChangeText={setEditingName}
              placeholder={t.children.namePlaceholder}
              placeholderTextColor="#AAB4B6"
              autoFocus
              selectTextOnFocus
            />
            <Text style={styles.dateLabel}>{t.children.birthDateLabel}</Text>
            <BirthDateFields
              t={t}
              day={editingDay}
              month={editingMonth}
              year={editingYear}
              onChangeDay={setEditingDay}
              onChangeMonth={setEditingMonth}
              onChangeYear={setEditingYear}
              onSubmit={confirmEdit}
            />
          </View>
        ) : (
          <>
            <Text style={styles.hint}>{t.children.hint}</Text>

            {active.map(renderRow)}
            {archived.length > 0 && (
              <>
                <SectionLabel label={t.children.archivedSectionTitle} />
                {archived.map(renderRow)}
              </>
            )}

            <SectionLabel label={t.children.addButton} />
            <View style={styles.addSection}>
              <TextInput
                style={styles.input}
                value={newName}
                onChangeText={setNewName}
                placeholder={t.children.namePlaceholder}
                placeholderTextColor="#AAB4B6"
                selectTextOnFocus
              />
              <Text style={styles.dateLabel}>{t.children.birthDateLabel}</Text>
              <BirthDateFields
                t={t}
                day={newDay}
                month={newMonth}
                year={newYear}
                onChangeDay={setNewDay}
                onChangeMonth={setNewMonth}
                onChangeYear={setNewYear}
                onSubmit={handleAdd}
              />
              <PrimaryButton style={styles.addButton} label={t.children.addButton} onPress={handleAdd} />
            </View>

            <Pressable onPress={() => setShowLinkSheet(true)}>
              <LinearGradient colors={['#1c222c', '#12171C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.linkButton}>
                <MaterialCommunityIcons name="qrcode-scan" size={14} color="#F1EEE7" />
                <Text style={styles.linkButtonLabel}>{t.childShare.linkTab}</Text>
              </LinearGradient>
            </Pressable>
          </>
        )}
      </SettingsSheetShell>

      {sharingChild && (
        <ChildShareSheet mode="share" child={sharingChild} onClose={() => setSharingChild(null)} />
      )}
      {showLinkSheet && (
        <ChildShareSheet
          mode="link"
          onClose={() => setShowLinkSheet(false)}
          onLinked={() => {
            setShowLinkSheet(false);
            refresh();
          }}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  hint: {
    color: '#AAB4B6',
    fontSize: 12,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  editForm: {
    gap: 6,
  },
  dateLabel: {
    color: '#AAB4B6',
    fontSize: 12,
    marginTop: 6,
  },
  rowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    flex: 1,
    color: '#F1EEE7',
    fontSize: 15,
    fontWeight: '600',
  },
  activeLabel: {
    color: '#D6A866',
    fontSize: 11,
    fontWeight: '700',
  },
  addSection: {
    gap: 8,
  },
  input: {
    color: '#F1EEE7',
    fontSize: 15,
    backgroundColor: '#12171C',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  addButton: {
    marginTop: 4,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
    borderRadius: 10,
    paddingVertical: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  linkButtonLabel: {
    color: '#F1EEE7',
    fontSize: 13,
    fontWeight: '600',
  },
  closeLabel: {
    color: '#AAB4B6',
    fontSize: 14,
  },
});
