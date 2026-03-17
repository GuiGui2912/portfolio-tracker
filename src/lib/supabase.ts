// Client navigateur uniquement (composants 'use client')
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Storage persistant pour Capacitor Android
const capacitorStorage = {
  getItem: (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch { return null; }
  },
  setItem: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
      // Double stockage dans sessionStorage pour Capacitor
      sessionStorage.setItem(key, value);
    } catch {}
  },
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    } catch {}
  },
};

let client: ReturnType<typeof createSupabaseClient> | null = null;

export function createClient() {
  if (client) return client;
  client = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storage: capacitorStorage,
        storageKey: 'portfolio-tracker-auth',
      },
    }
  );
  return client;
}
