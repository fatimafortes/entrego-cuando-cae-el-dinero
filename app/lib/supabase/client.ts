import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for use in Client Components. Only the anon key ever
 * reaches the browser — the service role key is never imported here.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
