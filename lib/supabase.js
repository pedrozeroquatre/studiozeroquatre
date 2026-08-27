import { createClient } from '@supabase/supabase-js'

// Client Supabase **serveur uniquement** — il utilise la service role key, qui
// contourne RLS. Ne jamais l'importer depuis un composant client.
//
// Tant que les variables d'env ne sont pas posées, getSupabase() renvoie null
// et les appelants dégradent proprement : le site continue de tourner sans
// persistance (emails + localStorage), il n'y a rien à décommenter le jour où
// les clés arrivent.

let cached = null

export function getSupabase() {
  if (cached) return cached

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return cached
}

export function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
}
