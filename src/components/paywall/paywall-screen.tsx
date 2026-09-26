import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Purchases, {
  INTRO_ELIGIBILITY_STATUS,
  PURCHASES_ERROR_CODE,
  type PurchasesPackage,
} from 'react-native-purchases';

import { EventIcon } from '@/components/ui/event-icon';
import { IconButton } from '@/components/ui/icon-button';
import { PrimaryButton } from '@/components/ui/primary-button';
import { useI18n } from '@/lib/i18n';
import { ENTITLEMENT_ID } from '@/lib/purchases';

// Apple's standard EULA — generic, works for any app with no custom Terms of Use, so
// this one's correct as-is. Guideline 3.1.2 requires a functional link to it (and to
// the privacy policy) on the purchase screen itself, not just in the App Store listing
// text.
const EULA_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';
// Op het eigen domein (vindra.nl), in het Nederlands of Engels — de site heeft alleen die twee.
const PRIVACY_POLICY_URL_NL = 'https://vindra.nl/nl/privacy/';
const PRIVACY_POLICY_URL_EN = 'https://vindra.nl/en/privacy/';

type OfferingsState =
  | { kind: 'loading' }
  | { kind: 'error' }
  | { kind: 'empty' }
  | {
      kind: 'loaded';
      monthly: PurchasesPackage | null;
      annual: PurchasesPackage | null;
      /** Product-ids waarvoor deze Apple ID de proefperiode nog echt krijgt. */
      trialEligible: Set<string>;
    };

/** Guideline 3.1.2: alleen een proefperiode beloven als Apple hem deze gebruiker ook echt
 * geeft (wie al eens een proef had, krijgt hem niet opnieuw). Bij twijfel (onbekend, fout)
 * tonen we hem niet — de gewone prijs klopt altijd. */
async function loadTrialEligibility(packages: PurchasesPackage[]): Promise<Set<string>> {
  const ids = packages.map((pkg) => pkg.product.identifier);
  try {
    const result = await Purchases.checkTrialOrIntroductoryPriceEligibility(ids);
    return new Set(
      ids.filter((id) => result[id]?.status === INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_ELIGIBLE)
    );
  } catch {
    return new Set();
  }
}

async function loadOfferings(): Promise<OfferingsState> {
  try {
    const current = (await Purchases.getOfferings()).current;
    if (!current || (!current.monthly && !current.annual)) return { kind: 'empty' };
    const packages = [current.monthly, current.annual].filter((pkg): pkg is PurchasesPackage => pkg !== null);
    const trialEligible = await loadTrialEligibility(packages);
    return { kind: 'loaded', monthly: current.monthly, annual: current.annual, trialEligible };
  } catch {
    return { kind: 'error' };
  }
}

/** Leest de introductieprijs die de App Store/RevenueCat zelf teruggeeft i.p.v. de
 * proefperiode-lengte hard te coderen — zo klopt dit vanzelf als de proefperiode ooit
 * per plan verschilt, alleen op één van de twee staat, of ergens wegvalt. `null` als er
 * geen (gratis) introductieaanbieding op dit product zit. */
function freeTrialDays(product: PurchasesPackage['product']): number | null {
  const intro = product.introPrice;
  if (!intro || intro.price !== 0) return null;
  switch (intro.periodUnit) {
    case 'DAY':
      return intro.periodNumberOfUnits;
    case 'WEEK':
      return intro.periodNumberOfUnits * 7;
    case 'MONTH':
      return intro.periodNumberOfUnits * 30;
    case 'YEAR':
      return intro.periodNumberOfUnits * 365;
    default:
      return null;
  }
}

function PlanOption({
  label,
  price,
  trialLabel,
  active,
  onPress,
}: {
  label: string;
  price: string;
  trialLabel?: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.planOptionWrapper}>
      <LinearGradient
        colors={active ? ['#E5BE87', '#D6A866'] : ['#1b212a', '#12171C']}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={[styles.planOption, active && styles.planOptionActive]}>
        <Text style={[styles.planLabel, active && styles.planLabelActive]}>{label}</Text>
        <Text style={[styles.planPrice, active && styles.planLabelActive]}>{price}</Text>
        {trialLabel && <Text style={[styles.planTrial, active && styles.planLabelActive]}>{trialLabel}</Text>}
      </LinearGradient>
    </Pressable>
  );
}

/** Volledig scherm. `onClose` is optioneel: weggelaten wanneer dit scherm de enige weg
 * vooruit is (bv. een toekomstige volledige-app-gate); meegegeven wanneer het als
 * per-feature-upsell verschijnt (bv. een premium wiel-knop) waar de gebruiker ook gewoon
 * mag afzien en verdergaan met wat al gratis is — zie EntitlementGate resp. WheelArc.
 * Prijzen komen live van RevenueCat/de App Store (`priceString`) i.p.v. hardcoded, zodat
 * ze automatisch kloppen per regio/valuta. */
export function PaywallScreen({ onClose, notice }: { onClose?: () => void; notice?: string }) {
  const { t, language } = useI18n();
  const privacyPolicyUrl = language === 'nl' ? PRIVACY_POLICY_URL_NL : PRIVACY_POLICY_URL_EN;
  const insets = useSafeAreaInsets();
  const [state, setState] = useState<OfferingsState>({ kind: 'loading' });
  const [selected, setSelected] = useState<'monthly' | 'annual'>('annual');
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);

  const retryOfferings = () => {
    setState({ kind: 'loading' });
    loadOfferings().then(setState);
  };

  useEffect(() => {
    loadOfferings().then(setState);
  }, []);

  const selectedPackage =
    state.kind === 'loaded' ? (selected === 'monthly' ? state.monthly : state.annual) ?? state.monthly ?? state.annual : null;
  const trialDaysFor = (pkg: PurchasesPackage | null) =>
    pkg && state.kind === 'loaded' && state.trialEligible.has(pkg.product.identifier) ? freeTrialDays(pkg.product) : null;
  const selectedTrialDays = trialDaysFor(selectedPackage);
  const monthlyTrialDays = trialDaysFor(state.kind === 'loaded' ? state.monthly : null);
  const annualTrialDays = trialDaysFor(state.kind === 'loaded' ? state.annual : null);

  const handleSubscribe = () => {
    if (!selectedPackage) return;
    setPurchasing(true);
    setPurchaseError(null);
    Purchases.purchasePackage(selectedPackage)
      .then(() => onClose?.())
      .catch((error) => {
        // Een geannuleerde native aankoopsheet (gebruiker tikt zelf weg) is geen fout —
        // alleen een echte mislukking (netwerk, geweigerde betaling, ...) laten zien.
        if (error?.code !== PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
          setPurchaseError(t.subscription.purchaseError);
        }
      })
      .finally(() => setPurchasing(false));
  };

  const handleRestore = () => {
    setRestoring(true);
    setRestoreMessage(null);
    Purchases.restorePurchases()
      .then((customerInfo) => {
        const restored = Boolean(customerInfo.entitlements.active[ENTITLEMENT_ID]);
        setRestoreMessage(restored ? t.subscription.restoreSuccess : t.subscription.restoreNone);
        if (restored) onClose?.();
      })
      .catch(() => setRestoreMessage(t.subscription.restoreError))
      .finally(() => setRestoring(false));
  };

  return (
    <LinearGradient colors={['#242E33', '#1C252A']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={styles.screen}>
      {onClose && (
        <View style={[styles.closeRow, { paddingTop: insets.top + 8 }]}>
          <IconButton onPress={onClose}>
            <EventIcon name="close" set="mci" size={18} color="#F1EEE7" />
          </IconButton>
        </View>
      )}
      <View style={styles.content}>
        <Text style={styles.title}>{t.subscription.title}</Text>
        {notice && <Text style={styles.notice}>{notice}</Text>}
        <Text style={styles.benefitIntro}>{t.subscription.benefitIntro}</Text>
        <View style={styles.benefitList}>
          <Text style={styles.benefit}>{'• ' + t.subscription.benefit1}</Text>
          <Text style={styles.benefit}>{'• ' + t.subscription.benefit2}</Text>
          <Text style={styles.benefit}>{'• ' + t.subscription.benefit3}</Text>
        </View>

        {state.kind === 'loading' && (
          <View style={styles.statusBlock}>
            <ActivityIndicator color="#D6A866" />
            <Text style={styles.statusText}>{t.subscription.loadingOfferings}</Text>
          </View>
        )}

        {state.kind === 'error' && (
          <View style={styles.statusBlock}>
            <Text style={styles.statusText}>{t.subscription.loadError}</Text>
            <PrimaryButton variant="neutral" label={t.subscription.retry} onPress={retryOfferings} />
          </View>
        )}

        {state.kind === 'empty' && (
          <View style={styles.statusBlock}>
            <Text style={styles.statusText}>{t.subscription.noOfferings}</Text>
          </View>
        )}

        {state.kind === 'loaded' && (
          <>
            <View style={styles.planRow}>
              {state.monthly && (
                <PlanOption
                  label={t.subscription.monthlyLabel}
                  price={state.monthly.product.priceString}
                  trialLabel={monthlyTrialDays != null ? t.subscription.trialBadge(monthlyTrialDays) : undefined}
                  active={selected === 'monthly'}
                  onPress={() => setSelected('monthly')}
                />
              )}
              {state.annual && (
                <PlanOption
                  label={t.subscription.yearlyLabel}
                  price={state.annual.product.priceString}
                  trialLabel={annualTrialDays != null ? t.subscription.trialBadge(annualTrialDays) : undefined}
                  active={selected === 'annual'}
                  onPress={() => setSelected('annual')}
                />
              )}
            </View>
            {/* Guideline 3.1.2 wil de proefperiode-duur + wat erna gebeurt zichtbaar vóór
             * aankoop, niet alleen in de App Store-beschrijving — vandaar deze losse regel
             * + het aangepaste knoplabel hieronder, in plaats van alleen de prijs te tonen. */}
            {selectedTrialDays != null && selectedPackage && (
              <Text style={styles.trialIntro}>
                {t.subscription.trialIntro(
                  selectedTrialDays,
                  selectedPackage.product.priceString,
                  selectedPackage === state.annual ? 'annual' : 'monthly',
                )}
              </Text>
            )}
            <PrimaryButton
              label={selectedTrialDays != null ? t.subscription.startTrialButton : t.subscription.subscribeButton}
              onPress={handleSubscribe}
              loading={purchasing}
              disabled={!selectedPackage}
              style={styles.subscribeButton}
            />
            {purchaseError && <Text style={styles.statusText}>{purchaseError}</Text>}
          </>
        )}

        <PrimaryButton
          variant="neutral"
          label={t.subscription.restoreButton}
          onPress={handleRestore}
          loading={restoring}
          style={styles.restoreButton}
        />
        {restoreMessage && <Text style={styles.statusText}>{restoreMessage}</Text>}

        <Text style={styles.terms}>{t.subscription.termsDisclosure}</Text>
        <View style={styles.termsLinks}>
          <Pressable onPress={() => Linking.openURL(EULA_URL)}>
            <Text style={styles.termsLink}>{t.subscription.termsOfUseLabel}</Text>
          </Pressable>
          <Text style={styles.terms}> · </Text>
          <Pressable onPress={() => Linking.openURL(privacyPolicyUrl)}>
            <Text style={styles.termsLink}>{t.subscription.privacyPolicyLabel}</Text>
          </Pressable>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  closeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 6,
  },
  title: {
    color: '#F1EEE7',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  notice: {
    color: '#E3A857',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  benefitIntro: {
    color: '#F1EEE7',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  benefitList: {
    gap: 4,
    marginBottom: 20,
  },
  benefit: {
    color: '#AAB4B6',
    fontSize: 13,
  },
  statusBlock: {
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  statusText: {
    color: '#AAB4B6',
    fontSize: 13,
    textAlign: 'center',
  },
  planRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  planOptionWrapper: {
    flex: 1,
  },
  planOption: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.06)',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  planOptionActive: {
    borderColor: 'rgba(255,255,255,0.25)',
    shadowColor: '#D6A866',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  planLabel: {
    color: '#F1EEE7',
    fontSize: 13,
    fontWeight: '600',
  },
  planLabelActive: {
    color: '#12171C',
  },
  planPrice: {
    color: '#AAB4B6',
    fontSize: 15,
    fontWeight: '700',
  },
  planTrial: {
    color: '#D6A866',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  trialIntro: {
    color: '#F1EEE7',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 10,
  },
  subscribeButton: {
    marginBottom: 10,
  },
  restoreButton: {
    marginTop: 4,
  },
  terms: {
    color: '#AAB4B6',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 12,
  },
  termsLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 2,
  },
  termsLink: {
    color: '#B79A6B',
    fontSize: 11,
    textDecorationLine: 'underline',
  },
});
