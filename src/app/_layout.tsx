import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router/react-navigation';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider, type SQLiteDatabase } from 'expo-sqlite';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { ErrorBoundary } from '@/components/error-boundary';
import { DATABASE_NAME } from '@/db/schema';
import { migrateDbIfNeeded } from '@/db/migrate';
import { ensureAtLeastOneChild } from '@/db/child';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ActiveChildProvider } from '@/lib/active-child-context';
import { I18nProvider } from '@/lib/i18n';
import { PreferencesProvider } from '@/lib/preferences-context';
import { configurePurchases } from '@/lib/purchases';
import { PurchasesProvider } from '@/lib/purchases-context';

async function initDatabase(db: SQLiteDatabase) {
  await migrateDbIfNeeded(db);
  await ensureAtLeastOneChild(db);
}

configurePurchases();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SQLiteProvider databaseName={DATABASE_NAME} onInit={initDatabase}>
          <ActiveChildProvider>
            <PreferencesProvider>
              <I18nProvider>
                <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                  <PurchasesProvider>
                    {/* Bewust géén app-brede paywall-gate meer — alleen "slapen" is
                        gratis, de rest wordt per event-type gegated in WheelArc (zie
                        constants/event-types.ts se requiresPremium). */}
                    <Stack>
                      <Stack.Screen name="index" options={{ headerShown: false }} />
                    </Stack>
                  </PurchasesProvider>
                  <StatusBar style="auto" />
                </ThemeProvider>
              </I18nProvider>
            </PreferencesProvider>
          </ActiveChildProvider>
        </SQLiteProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
