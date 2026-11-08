import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lgxpleazipxgllvvyeyv.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseAnonKey.trim() !== '' &&
  supabaseAnonKey !== '[I WILL PASTE HERE]'
);

// Fallback dummy key to prevent createClient from crashing at build time or initialization
const safeKey = isSupabaseConfigured
  ? supabaseAnonKey
  : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.empty-placeholder-for-build';

export const supabase = createClient(supabaseUrl, safeKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  realtime: {
    transport: typeof window === 'undefined' ? (WebSocket as unknown as undefined) : undefined,
  },
});
