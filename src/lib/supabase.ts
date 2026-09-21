import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const supabaseUrl = (Constants.expoConfig?.extra?.supabaseUrl as string | undefined) ?? '';
const supabaseAnonKey = (Constants.expoConfig?.extra?.supabaseAnonKey as string | undefined) ?? '';

/** true zolang de gebruiker nog geen Supabase-project heeft aangemaakt/gekoppeld (zie
 * app.json `extra`) — sync-functies moeten dit checken en zich dan stil gedragen in
 * plaats van te crashen, zodat de rest van de app gewoon lokaal blijft werken. */
export const isSyncConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Geen accounts/inloggen nodig (zie plan) — sessie-opslag expliciet uit, zodat er ook
// geen AsyncStorage-gedrag actief is dat we niet gebruiken.
export const supabase: SupabaseClient | null = isSyncConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;
