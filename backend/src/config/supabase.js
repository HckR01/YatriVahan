import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

const commonOptions = {
  auth: {
    autoRefreshToken: false,
    detectSessionInUrl: false,
    persistSession: false,
  },
  global: {
    headers: { "X-Client-Info": "yatri-vahan-backend/1.0" },
  },
};

// Used only to validate user access tokens through Supabase Auth.
export const supabaseAuth = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY,
  commonOptions,
);

// The service key bypasses RLS. Every service method must enforce ownership.
export const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  commonOptions,
);

