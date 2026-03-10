import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'

// Client-side Supabase (uses anon key, respects RLS)
export const createSupabaseClient = () => createClientComponentClient()

// Server-side Supabase (uses service role, bypasses RLS — use only in API routes)
export const createSupabaseAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
