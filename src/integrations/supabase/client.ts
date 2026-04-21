import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Clerk session token getter — set by AuthContext after ClerkProvider mounts.
// Supabase will call this on every request to attach a fresh Clerk JWT.
let clerkTokenGetter: (() => Promise<string | null>) | null = null;

export const setClerkTokenGetter = (getter: (() => Promise<string | null>) | null) => {
  clerkTokenGetter = getter;
};

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    // Clerk owns the session — disable Supabase's own auth state.
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
  // Native Clerk → Supabase third-party auth integration:
  // Supabase trusts the Clerk-issued JWT and resolves auth.uid() from it.
  accessToken: async () => {
    if (!clerkTokenGetter) return null;
    try {
      return await clerkTokenGetter();
    } catch {
      return null;
    }
  },
} as Parameters<typeof createClient>[2]);