import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import Purchases, { type CustomerInfo, type CustomerInfoUpdateListener } from 'react-native-purchases';
import { useSQLiteContext } from 'expo-sqlite';

import { getAppState, setAppState } from '@/db/app-state';
import { ENTITLEMENT_ID, isPurchasesConfigured } from '@/lib/purchases';
import { setSyncPaused } from '@/lib/sync';

export type PurchasesStatus = 'loading' | 'entitled' | 'not-entitled';

interface PurchasesContextValue {
  status: PurchasesStatus;
  customerInfo: CustomerInfo | null;
  /** Whole days left in a trial-period entitlement, or null outside a trial. Reading
   * "now" is impure, so it's computed once here (inside the async customer-info
   * callback) rather than during render — consumers just read this plain number. */
  trialDaysLeft: number | null;
  refresh: () => Promise<void>;
}

/** Laatst bekende status (app_state), zodat een betaler zonder internet of bij een
 * RevenueCat-storing niet ineens sloten ziet. */
const CACHED_STATUS_KEY = 'purchases_status';

function deriveStatus(customerInfo: CustomerInfo): PurchasesStatus {
  return customerInfo.entitlements.active[ENTITLEMENT_ID] ? 'entitled' : 'not-entitled';
}

function deriveTrialDaysLeft(customerInfo: CustomerInfo): number | null {
  const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
  if (!entitlement || entitlement.periodType !== 'TRIAL' || !entitlement.expirationDate) return null;
  return Math.max(0, Math.ceil((new Date(entitlement.expirationDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
}

const PurchasesContext = createContext<PurchasesContextValue>({
  status: 'loading',
  customerInfo: null,
  trialDaysLeft: null,
  refresh: async () => {},
});

/** Houdt de entitlement-status app-breed bij, zelfde "laad eenmaal, geef door via een
 * hook"-opzet als lib/active-child-context.tsx. Zonder geconfigureerde API-key (zie
 * lib/purchases.ts) resolvet de status meteen naar 'entitled' — dezelfde fail-open
 * conventie als isSyncConfigured in lib/supabase.ts.
 *
 * Lukt het ophalen niet (geen internet, storing), dan geldt de laatst bekende status; is
 * die er niet, dan 'not-entitled' (de paywall heeft zelf een "opnieuw proberen") — nooit
 * eeuwig 'loading'. Bij terugkomen naar de voorgrond wordt opnieuw geprobeerd. */
export function PurchasesProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [status, setStatus] = useState<PurchasesStatus>(isPurchasesConfigured ? 'loading' : 'entitled');
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);

  const applyCustomerInfo = useCallback(
    (info: CustomerInfo) => {
      const next = deriveStatus(info);
      setCustomerInfo(info);
      setStatus(next);
      setTrialDaysLeft(deriveTrialDaysLeft(info));
      setAppState(db, CACHED_STATUS_KEY, next).catch(() => undefined);
    },
    [db]
  );

  const refresh = useCallback(async () => {
    if (!isPurchasesConfigured) return;
    const info = await Purchases.getCustomerInfo();
    applyCustomerInfo(info);
  }, [applyCustomerInfo]);

  useEffect(() => {
    if (!isPurchasesConfigured) return;
    let ignore = false;
    let fetched = false;

    const fetchInfo = () =>
      Purchases.getCustomerInfo()
        .then((info) => {
          fetched = true;
          if (!ignore) applyCustomerInfo(info);
        })
        .catch(async (error) => {
          console.warn('[purchases] getCustomerInfo failed', error);
          if (ignore || fetched) return;
          const cached = await getAppState(db, CACHED_STATUS_KEY).catch(() => null);
          if (ignore || fetched) return;
          setStatus((current) =>
            current !== 'loading' ? current : cached === 'entitled' ? 'entitled' : 'not-entitled'
          );
        });

    // Eerst de bewaarde status tonen (snel, ook offline), daarna de echte.
    getAppState(db, CACHED_STATUS_KEY)
      .then((cached) => {
        if (ignore || fetched) return;
        if (cached === 'entitled' || cached === 'not-entitled') {
          setStatus((current) => (current === 'loading' ? cached : current));
        }
      })
      .catch(() => undefined);
    fetchInfo();

    const listener: CustomerInfoUpdateListener = applyCustomerInfo;
    Purchases.addCustomerInfoUpdateListener(listener);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') fetchInfo();
    });
    return () => {
      ignore = true;
      Purchases.removeCustomerInfoUpdateListener(listener);
      subscription.remove();
    };
  }, [db, applyCustomerInfo]);

  // Partner-sync is Pro: bij een verlopen abonnement pauzeert hij (data blijft staan).
  useEffect(() => {
    setSyncPaused(status === 'not-entitled');
  }, [status]);

  return (
    <PurchasesContext.Provider value={{ status, customerInfo, trialDaysLeft, refresh }}>{children}</PurchasesContext.Provider>
  );
}

export function usePurchases() {
  return useContext(PurchasesContext);
}
