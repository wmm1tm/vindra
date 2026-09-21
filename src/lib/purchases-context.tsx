import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import Purchases, { type CustomerInfo, type CustomerInfoUpdateListener } from 'react-native-purchases';

import { ENTITLEMENT_ID, isPurchasesConfigured } from '@/lib/purchases';

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
 * conventie als isSyncConfigured in lib/supabase.ts. */
export function PurchasesProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<PurchasesStatus>(isPurchasesConfigured ? 'loading' : 'entitled');
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);

  const applyCustomerInfo = useCallback((info: CustomerInfo) => {
    setCustomerInfo(info);
    setStatus(deriveStatus(info));
    setTrialDaysLeft(deriveTrialDaysLeft(info));
  }, []);

  const refresh = useCallback(async () => {
    if (!isPurchasesConfigured) return;
    const info = await Purchases.getCustomerInfo();
    applyCustomerInfo(info);
  }, [applyCustomerInfo]);

  useEffect(() => {
    if (!isPurchasesConfigured) return;
    let ignore = false;
    Purchases.getCustomerInfo().then((info) => {
      if (!ignore) applyCustomerInfo(info);
    });
    const listener: CustomerInfoUpdateListener = applyCustomerInfo;
    Purchases.addCustomerInfoUpdateListener(listener);
    return () => {
      ignore = true;
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [applyCustomerInfo]);

  return (
    <PurchasesContext.Provider value={{ status, customerInfo, trialDaysLeft, refresh }}>{children}</PurchasesContext.Provider>
  );
}

export function usePurchases() {
  return useContext(PurchasesContext);
}
