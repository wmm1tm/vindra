import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

interface SettingsSheetShellProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Rendered below the scrollable content, outside the ScrollView, so it's never
   * dependent on scroll position — e.g. a Save button. Optional. */
  footer?: ReactNode;
  /** True for any settings screen that can be opened while another SettingsSheetShell is
   * already showing (e.g. "Kinderen"/"Wiel" from the main settings sheet). Stacking two
   * real RN <Modal>s is unreliable — on iOS especially, presenting a second native modal
   * while one is already up can silently fail to appear. A nested sheet instead renders
   * as a plain absolutely-positioned overlay (same look, no native modal of its own) —
   * see `overlay` below for how it actually reaches the screen. */
  nested?: boolean;
  /** Extra content rendered inside this shell's own <Modal>, after its main content —
   * for a nested screen this shell can open on top of itself. A <Modal> portals its
   * children into their own native window; a `nested` screen mounted as a plain JS
   * sibling of <SettingsSheetShell> *outside* this prop would end up rendered behind
   * that window (invisible, tap doing nothing), because it never entered the portal.
   * Passing it in here keeps it inside the same window so it actually stacks on top.
   * Only meaningful when this shell owns a real Modal (`nested` false). */
  overlay?: ReactNode;
}

/** Shared structure for every settings-related sheet: a full-width panel slid up from
 * the bottom (more room than a small centered card, and the standard mobile pattern for
 * this kind of screen) wrapped in a KeyboardAvoidingView, so a text input's keyboard
 * never covers a button — every settings sheet used to reimplement this independently,
 * and only some of them remembered the KeyboardAvoidingView part. */
export function SettingsSheetShell({ title, onClose, children, footer, nested = false, overlay }: SettingsSheetShellProps) {
  const content = (
    <KeyboardAvoidingView
      style={[styles.backdrop, nested && styles.backdropNested]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Pressable style={styles.dismissArea} onPress={onClose} />
      <LinearGradient colors={['#242E33', '#1C252A']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={styles.sheet}>
        <View style={styles.grabber} />
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <LinearGradient colors={['#252c38', '#181d25']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={20} color="#AAB4B6" />
            </LinearGradient>
          </Pressable>
        </View>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
        {footer && <View style={styles.footer}>{footer}</View>}
      </LinearGradient>
    </KeyboardAvoidingView>
  );

  if (nested) return content;

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      {content}
      {overlay}
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  backdropNested: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  dismissArea: {
    flex: 1,
  },
  sheet: {
    width: '100%',
    maxHeight: '88%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 24,
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3a4250',
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    color: '#F1EEE7',
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingBottom: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#2a313c',
  },
});
