import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type Session } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[Supabase] Variables manquantes. Ajoute EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY dans Vercel.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/** Récupère la session actuelle de manière fiable */
export async function getCurrentSession(): Promise<Session | null> {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) return null;
    return data.session ?? null;
  } catch {
    return null;
  }
}

/** Déconnexion complète avec nettoyage */
export async function signOutClean(): Promise<void> {
  try {
    // 1. Signout côté serveur Supabase (invalide le refresh token)
    await supabase.auth.signOut({ scope: 'global' });
  } catch (e) {
    console.warn('[Auth] signOut error:', e);
  }
  // 2. Nettoyage manuel de sécurité (AsyncStorage peut garder des résidus)
  try {
    await AsyncStorage.removeItem(`sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`);
  } catch {}
}