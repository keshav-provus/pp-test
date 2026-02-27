import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client using service role key
// Only use in API routes / server components — NEVER expose to the client
const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default supabaseServer;
