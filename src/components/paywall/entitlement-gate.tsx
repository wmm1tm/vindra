import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { PaywallScreen } from '@/components/paywall/paywall-screen';
import { usePurchases } from '@/lib/purchases-context';

/** Dark placeholder while the initial entitlement check is in flight — avoids a white
 * flash on this dark-first app while `usePurchases()` still says 'loading'. */
function PaywallLoadingScreen() {
  return <View style={styles.loading} />;
}

/** Not wired into app/_layout.tsx yet — see the TODO comment there. Once it is, this
 * replaces the entire app with the paywall for anyone without an active entitlement. */
export function EntitlementGate({ children }: { children: ReactNode }) {
  const { status } = usePurchases();
  if (status === 'loading') return <PaywallLoadingScreen />;
  if (status === 'not-entitled') return <PaywallScreen />;
  return <>{children}</>;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#12171C',
  },
});
