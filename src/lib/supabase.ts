// Client navigateur uniquement (composants 'use client')
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Détection Capacitor
const isCapacitor = typeof window !== 'undefined' && !!(window as any).Capacitor;

// Storage natif Capacitor via Preferences plugin
const getCapacitorStorage = () => {
  if (!isCapacitor) return null;
  try {
    const { Preferences } = require('@capacitor/preferences');
    return {
      getItem: async (key: string) => {
        const { value } = await Preferences.get({ key });
        return value;
      },
      setItem: async (key: string, value: string) => {
        await Preferences.set({ key, value });
      },
      removeItem: async (key: string) => {
        await Preferences.remove({ key });
      },
    };
  } catch {
    return null;
  }
};

let client: ReturnType<typeof createSupabaseClient> | null = null;

export function createClient() {
  if (client) return client;

  const capacitorStorage = getCapacitorStorage();

  client = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        ...(capacitorStorage ? { storage: capacitorStorage } : {}),
        storageKey: 'portfolio-tracker-auth',
      },
    }
  );
  return client;
}
