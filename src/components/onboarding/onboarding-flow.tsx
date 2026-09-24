import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OnboardingChildStep, type ChildDraft } from '@/components/onboarding/onboarding-child-step';
import { OnboardingRolesStep } from '@/components/onboarding/onboarding-roles-step';
import { OnboardingTip } from '@/components/onboarding/onboarding-tip';
import { PaywallScreen } from '@/components/paywall/paywall-screen';
import { parseBirthDate } from '@/components/settings/birth-date-fields';
import { EventIcon } from '@/components/ui/event-icon';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Design, GLOW, glowStyle } from '@/constants/design';
import { EVENT_TYPES } from '@/constants/event-types';
import { DEFAULT_CHILD_NAME, getChildWithSettings, renameChild, updateChildBirthDate } from '@/db/child';
import { useActiveChild } from '@/lib/active-child-context';
import { withAlpha } from '@/lib/color';
import { useI18n } from '@/lib/i18n';
import { selectionFromWheelConfig, wheelFromSelection } from '@/lib/onboarding-wheel';
import { usePreferences } from '@/lib/preferences-context';
import { usePurchases } from '@/lib/purchases-context';

const ACCENT = Design.accent;
const STEP_COUNT = 6;
const CHILD_STEP = 1;
const ROLES_STEP = 2;
const WIDGET_STEP = 4;
/** Voorbeeldknoppen in de widget-stap: wat een abonnee op het beginscherm ziet. */
const WIDGET_DEMO_KINDS = ['gedrag', 'prikkel', 'stemming', 'slaap'] as const;
const DEMO_KINDS = ['gedrag', 'prikkel', 'stemming'] as const;
const EMPTY_DRAFT: ChildDraft = { name: '', day: '', month: '', year: '' };

function sameSet(a: ReadonlySet<string>, b: ReadonlySet<string>) {
  return a.size === b.size && [...a].every((id) => b.has(id));
}

interface OnboardingFlowProps {
  onDone: () => void;
  /** Na het opslaan van naam/geboortedatum, zodat het hoofdscherm zijn kinderlijst (en
   * daarmee de naambanner) meteen ververst. */
  onChildUpdated: () => void;
}

/** Intro bij de eerste start (gevraagd 2026-09-24, zie PLAN.md). Zes korte stappen, elk
 * over te slaan: welkom, het kind, wat er speelt (zet optionele typen op het wiel), hoe
 * loggen werkt, de widget, en delen/privacy. Daarna, zonder abonnement, de bestaande paywall met een
 * sluitknop. Alleen wat met "Volgende" bevestigd is, wordt opgeslagen; "Overslaan" sluit
 * zonder verdere wijzigingen. Daarna komt hij niet meer terug, behalve via Instellingen →
 * "Intro opnieuw bekijken". */
export function OnboardingFlow({ onDone, onChildUpdated }: OnboardingFlowProps) {
  const db = useSQLiteContext();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const preferences = usePreferences();
  const { childId } = useActiveChild();
  const { status: purchasesStatus } = usePurchases();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<ChildDraft>(EMPTY_DRAFT);
  const [savedName, setSavedName] = useState('');
  const [savedSelection, setSavedSelection] = useState<ReadonlySet<string>>(() =>
    selectionFromWheelConfig(preferences.wheelConfig)
  );
  const [selected, setSelected] = useState<ReadonlySet<string>>(savedSelection);
  const [busy, setBusy] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  // Bij opnieuw bekijken staat de echte naam al ingevuld. De geboortedatum bewust niet:
  // een kind zonder ingevulde datum heeft intern de aanmaakdatum als waarde, en die
  // voorinvullen zou er als een echte geboortedatum uitzien.
  useEffect(() => {
    if (!childId) return;
    let ignore = false;
    getChildWithSettings(db, childId).then((child) => {
      if (ignore || !child || child.name === DEFAULT_CHILD_NAME) return;
      setDraft((current) => (current.name ? current : { ...current, name: child.name }));
      setSavedName(child.name);
    });
    return () => {
      ignore = true;
    };
  }, [db, childId]);

  const finish = async () => {
    await preferences.setOnboardingDone(true);
    onDone();
  };

  const saveChild = async () => {
    if (!childId) return;
    const name = draft.name.trim();
    const birthDate = parseBirthDate(draft.day, draft.month, draft.year);
    if (name && name !== savedName) {
      await renameChild(db, childId, name);
      setSavedName(name);
    }
    if (name && birthDate) await updateChildBirthDate(db, childId, birthDate);
    if (name) onChildUpdated();
  };

  const saveWheel = async () => {
    if (sameSet(selected, savedSelection)) return;
    await preferences.save({ wheelConfig: selected.size > 0 ? wheelFromSelection(selected).ids : null });
    setSavedSelection(selected);
  };

  const next = async () => {
    if (busy) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBusy(true);
    try {
      if (step === CHILD_STEP) await saveChild();
      if (step === ROLES_STEP) await saveWheel();
    } finally {
      setBusy(false);
    }
    if (step < STEP_COUNT - 1) {
      setStep(step + 1);
      return;
    }
    // Laatste stap: het abonnement aanbieden als dat er nog niet is, altijd met een
    // duidelijke sluitknop. Anders meteen klaar.
    if (purchasesStatus !== 'entitled') setShowPaywall(true);
    else finish();
  };

  const toggleRole = (entryId: string) => {
    setSelected((current) => {
      const nextSelection = new Set(current);
      if (nextSelection.has(entryId)) nextSelection.delete(entryId);
      else nextSelection.add(entryId);
      return nextSelection;
    });
  };

  let content: ReactNode;
  if (step === 0) {
    content = (
      <View style={styles.centered}>
        <View style={styles.logoRing}>
          <MaterialCommunityIcons name="compass-outline" size={60} color={ACCENT} />
        </View>
        <Text style={styles.bigTitle}>{t.onboarding.welcomeTitle}</Text>
        <Text style={[styles.body, styles.centeredText]}>{t.onboarding.welcomeBody}</Text>
        <Text style={[styles.tagline, styles.centeredText]}>{t.onboarding.welcomeTagline}</Text>
      </View>
    );
  } else if (step === CHILD_STEP) {
    content = <OnboardingChildStep draft={draft} onChange={setDraft} onSubmit={next} />;
  } else if (step === ROLES_STEP) {
    content = <OnboardingRolesStep selected={selected} onToggle={toggleRole} />;
  } else if (step === 3) {
    content = (
      <View style={styles.page}>
        <Text style={styles.title}>{t.onboarding.logTitle}</Text>
        <View style={styles.demoRow}>
          {DEMO_KINDS.map((kind) => {
            const type = EVENT_TYPES[kind];
            return (
              <View key={kind} style={styles.demoItem}>
                <LinearGradient
                  colors={Design.coreGradient}
                  locations={[0, 0.6, 1]}
                  start={{ x: 0.3, y: 0.15 }}
                  end={{ x: 0.8, y: 0.95 }}
                  style={[styles.demoButton, { borderColor: type.color }, glowStyle(type.color, GLOW, 0.55, 10)]}>
                  <EventIcon name={type.icon} set={type.iconSet} size={26} color={type.color} />
                </LinearGradient>
                <Text style={styles.demoLabel}>{type.label(t)}</Text>
              </View>
            );
          })}
          <View style={styles.demoItem}>
            <View style={styles.demoHub}>
              <MaterialCommunityIcons name="tune-variant" size={20} color={ACCENT} />
            </View>
          </View>
        </View>
        <OnboardingTip icon="gesture-tap" text={t.onboarding.logTap} />
        <OnboardingTip icon="format-list-bulleted" text={t.onboarding.logSecondLevel} />
        <OnboardingTip icon="pencil-outline" text={t.onboarding.logDetails} />
        <OnboardingTip icon="gesture-tap-hold" text={t.onboarding.logMove} />
        <OnboardingTip icon="tune-variant" text={t.onboarding.logHub} />
      </View>
    );
  } else if (step === WIDGET_STEP) {
    content = (
      <View style={styles.page}>
        <Text style={styles.title}>{t.onboarding.widgetTitle}</Text>
        <Text style={styles.body}>{t.onboarding.widgetBody}</Text>
        <View style={styles.widgetMock}>
          <Text style={styles.widgetBrand}>Vindra</Text>
          <View style={styles.widgetGrid}>
            {WIDGET_DEMO_KINDS.map((kind) => {
              const type = EVENT_TYPES[kind];
              return (
                <View key={kind} style={[styles.widgetCell, { backgroundColor: withAlpha(type.color, 0.18) }]}>
                  <EventIcon name={type.icon} set={type.iconSet} size={20} color={type.color} />
                  <Text style={[styles.widgetLabel, { color: type.color }]} numberOfLines={1}>
                    {type.label(t)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
        <OnboardingTip icon="numeric-1-circle-outline" text={t.onboarding.widgetStep1} />
        <OnboardingTip icon="numeric-2-circle-outline" text={t.onboarding.widgetStep2} />
        <OnboardingTip icon="numeric-3-circle-outline" text={t.onboarding.widgetStep3} />
        <Text style={styles.footnote}>{t.onboarding.widgetFootnote}</Text>
      </View>
    );
  } else {
    content = (
      <View style={styles.page}>
        <Text style={styles.title}>{t.onboarding.shareTitle}</Text>
        <OnboardingTip icon="clipboard-text-outline" text={t.onboarding.shareReport} />
        <OnboardingTip icon="qrcode" text={t.onboarding.sharePartner} />
        <OnboardingTip icon="cellphone-lock" text={t.onboarding.sharePrivacy} />
        <OnboardingTip icon="information-outline" text={t.onboarding.shareNoDiagnosis} />
      </View>
    );
  }

  const nextLabel = step === 0 ? t.onboarding.start : step === STEP_COUNT - 1 ? t.onboarding.finish : t.onboarding.next;

  return (
    <Modal animationType="fade" presentationStyle="fullScreen" onRequestClose={finish}>
      <LinearGradient colors={['#242E33', '#12171C']} style={styles.screen}>
        <KeyboardAvoidingView
          style={[styles.inner, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }]}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.topBar}>
            <View style={styles.dots}>
              {Array.from({ length: STEP_COUNT }, (_, i) => (
                <View key={i} style={[styles.dot, i === step && styles.dotActive, i < step && styles.dotDone]} />
              ))}
            </View>
            <Pressable onPress={finish} hitSlop={10} accessibilityRole="button">
              <Text style={styles.skip}>{t.onboarding.skip}</Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            <Animated.View key={step} entering={FadeInRight.duration(240)} exiting={FadeOutLeft.duration(160)}>
              {content}
            </Animated.View>
          </ScrollView>

          <View style={styles.bottomBar}>
            {step > 0 ? (
              <Pressable onPress={() => setStep(step - 1)} hitSlop={10} accessibilityRole="button">
                <Text style={styles.back}>{t.onboarding.back}</Text>
              </Pressable>
            ) : (
              <View />
            )}
            <PrimaryButton label={nextLabel} onPress={next} loading={busy} />
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>

      {showPaywall && (
        <View style={StyleSheet.absoluteFill}>
          <PaywallScreen onClose={finish} />
        </View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 20,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 40,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#3a4250',
  },
  dotActive: {
    width: 22,
    backgroundColor: ACCENT,
  },
  dotDone: {
    backgroundColor: '#8C7550',
  },
  skip: {
    color: '#AAB4B6',
    fontSize: 15,
    fontWeight: '500',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  centered: {
    alignItems: 'center',
    gap: 16,
  },
  centeredText: {
    textAlign: 'center',
  },
  page: {
    gap: 14,
  },
  logoRing: {
    width: 116,
    height: 116,
    borderRadius: 58,
    borderWidth: 2,
    borderColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1C252A',
    ...glowStyle(ACCENT, GLOW, 0.6, 24),
    marginBottom: 8,
  },
  bigTitle: {
    color: '#F1EEE7',
    fontSize: 30,
    fontWeight: '700',
    textAlign: 'center',
  },
  title: {
    color: '#F1EEE7',
    fontSize: 26,
    fontWeight: '700',
  },
  body: {
    color: '#C9CFD1',
    fontSize: 16,
    lineHeight: 23,
  },
  tagline: {
    color: ACCENT,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  demoRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 18,
    marginVertical: 6,
  },
  demoItem: {
    alignItems: 'center',
    gap: 6,
  },
  demoButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoLabel: {
    color: Design.text,
    fontSize: 11,
    fontWeight: '700',
  },
  demoHub: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: ACCENT,
    backgroundColor: Design.coreGradient[1],
    alignItems: 'center',
    justifyContent: 'center',
  },
  widgetMock: {
    alignSelf: 'center',
    width: 170,
    height: 170,
    borderRadius: 26,
    backgroundColor: Design.ground,
    borderWidth: 1,
    borderColor: withAlpha(Design.text, 0.12),
    padding: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  widgetBrand: {
    color: ACCENT,
    fontSize: 14,
    fontWeight: '800',
  },
  widgetGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  widgetCell: {
    width: '47%',
    flexGrow: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: 4,
  },
  widgetLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  footnote: {
    color: '#7F898C',
    fontSize: 13,
    lineHeight: 18,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
  },
  back: {
    color: '#AAB4B6',
    fontSize: 16,
    fontWeight: '500',
  },
});
