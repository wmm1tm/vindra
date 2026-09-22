import Constants from 'expo-constants';
import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';

const iosApiKey = (Constants.expoConfig?.extra?.revenuecatIosApiKey as string | undefined) ?? '';
const androidApiKey =
  (Constants.expoConfig?.extra?.revenuecatAndroidApiKey as string | undefined) ?? '';

const apiKey = Platform.OS === 'ios' ? iosApiKey : androidApiKey;

/** true zolang er nog geen RevenueCat-API-key voor dit platform is ingevuld (zie
 * app.json `extra`) — abonnement-/entitlement-checks moeten dit checken en zich dan
 * stil gedragen in plaats van te crashen. */
export const isPurchasesConfigured = Boolean(apiKey);

/** Entitlement-identifier zoals ingesteld in het RevenueCat-dashboard — moet daar
 * exact zo heten (RevenueCat staat wijzigen achteraf niet toe). */
export const ENTITLEMENT_ID = 'vindra_premium';

export function configurePurchases() {
  if (!isPurchasesConfigured) return;
  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
  }
  Purchases.configure({ apiKey });
}
