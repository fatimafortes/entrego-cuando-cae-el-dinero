import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * Bypasses RLS with the service role key. Only for server code that must
 * read across suppliers without a user session — e.g. the public
 * /regla/[stand_id] page, which has no authenticated user to scope RLS to.
 * anon has no grants on stands/card_texts at all (0001/0002), so this is
 * the only way that page can read anything; it must select only the exact
 * columns safe to render publicly.
 */
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
