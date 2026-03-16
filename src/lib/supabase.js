import { createClient } from '@supabase/supabase-js';

// These are PUBLIC/ANON keys — safe to be in the browser for Vite apps.
// Security is enforced by Supabase Row Level Security (RLS) policies on the database,
// which restrict anonymous users to INSERT-only (no reading or editing other leads).
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('CRITICAL: Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are missing. Check your .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
