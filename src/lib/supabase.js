import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Gracefully handle missing env vars (e.g. on Vercel without env config)
let supabase = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn('Supabase env vars missing. Auth and database features will be disabled.');
  // Create a mock supabase object so the app doesn't crash
  supabase = {
    auth: {
      getSession: async () => ({ data: { session: null } }),
      getUser: async () => ({ data: { user: null } }),
      signInWithPassword: async () => ({ error: { message: 'Supabase not configured. Please add environment variables.' } }),
      signUp: async () => ({ error: { message: 'Supabase not configured. Please add environment variables.' } }),
      signOut: async () => ({}),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: null }), order: () => ({ limit: async () => ({ data: [] }), data: [] }), data: [] }), order: () => ({ limit: async () => ({ data: [] }), ascending: () => ({ data: [] }) }), data: [] }),
      insert: () => ({ select: () => ({ single: async () => ({ data: null, error: { message: 'Supabase not configured' } }) }) }),
    }),
  };
}

export { supabase };
