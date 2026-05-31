// Initialises the shared Supabase client.
// window.supabase is the object exposed by the CDN script loaded before this file.
// We overwrite it with the ready-to-use client so all other scripts just call `supabase.from(...)`.
// Supabase project credentials.
// The anon key is intentionally public — it is safe to commit.
// Security is enforced by Row Level Security (RLS) policies in Supabase, not by this key.
// Never put the secret/service_role key here.
const SUPABASE_URL     = 'https://uevovvrxwrwvxqnhehmm.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_rCMvKFXmLVqbHrvnyjiGbg_rIY7iuKm';

// Overwrite window.supabase (the CDN library) with the ready-to-use client instance.
// Using window.supabase = ... makes it accessible to all other script files.
// auth options are set explicitly because the new sb_publishable_ key format
// does not always enable session persistence by default.
window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage:            window.localStorage,
    persistSession:     true,
    detectSessionInUrl: false,
  }
});
