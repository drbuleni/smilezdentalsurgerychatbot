import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Browser client — uses anon key, subject to RLS
export function createBrowserClient() {
  return createClient(supabaseUrl, supabaseAnonKey)
}

// Server / API route client — uses service role key, bypasses RLS
export function createServerClient() {
  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  })
}

// Default export is the server client for convenience in API routes
export const supabaseAdmin = () => createServerClient()
