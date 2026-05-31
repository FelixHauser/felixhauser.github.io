// Initialises the shared Supabase client.
// window.supabase is the object exposed by the CDN script loaded before this file.
// We overwrite it with the ready-to-use client so all other scripts just call `supabase.from(...)`.
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
