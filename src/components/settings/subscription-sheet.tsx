import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import Purchases from 'react-native-purchases';

import { SettingsSheetShell } from '@/components/settings/settings-sheet-shell';
import { PrimaryButton } from '@/components/ui/primary-button';
import { useI18n } from '@/lib/i18n';
import { ENTITLEMENT_ID } from '@/lib/purchases';
import { usePurchases } from '@/lib/purchases-context';

interface SubscriptionSheetProps {
  onClose: () => void;
}

export function SubscriptionSheet({ onClose }: SubscriptionSheetProps) {
  const { t, localeTag } = useI18n();
  const { status, customerInfo, trialDaysLeft, refresh } = usePurchases();
  const [restoring, setRestoring] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);

  // Herlaad de status elke keer dat dit scherm opent — de laatst opgehaalde
  // customerInfo (bij app-start) kan inmiddels uren/dagen oud zijn.
  useEffect(() => {
    refresh();
  }, [refresh]);

  const entitlement = customerInfo?.entitlements.active[ENTITLEMENT_ID];
  let statusText = t.subscription.statusNone;
  if (status === 'loading') {
    statusText = t.subscription.statusLoading;
  } else if (entitlement) {
    statusText =
      trialDaysLeft !== null
        ? t.subscription.statusTrial(trialDaysLeft)
        : t.subscription.statusActiveUntil(
            entitlement.expirationDate ? new Date(entitlement.expirationDate).toLocaleDateString(localeTag) : '—'
          );
  }

  const handleManage = () => {
    Purchases.showManageSubscriptions().catch(() => {});
  };

  const handleRestore = () => {
    setRestoring(true);
    setRestoreMessage(null);
    Purchases.restorePurchases()
      .then(() => {
        setRestoreMessage(t.subscription.restoreSuccess);
        return refresh();
      })
      .catch(() => setRestoreMessage(t.subscription.restoreError))
      .finally(() => setRestoring(false));
  };

  return (
    <SettingsSheetShell nested title={t.settings.subscriptionButton} onClose={onClose}>
      <Text style={styles.status}>{statusText}</Text>
      <PrimaryButton variant="neutral" label={t.subscription.manageButton} onPress={handleManage} style={styles.button} />
      <PrimaryButton
        variant="neutral"
        label={t.subscription.restoreButton}
        onPress={handleRestore}
        loading={restoring}
        style={styles.button}
      />
      {restoreMessage && <Text style={styles.hint}>{restoreMessage}</Text>}
    </SettingsSheetShell>
  );
}

const styles = StyleSheet.create({
  status: {
    color: '#ECEDEE',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 14,
  },
  button: {
    marginTop: 10,
  },
  hint: {
    color: '#8B95A1',
    fontSize: 12,
    marginTop: 8,
  },
});
