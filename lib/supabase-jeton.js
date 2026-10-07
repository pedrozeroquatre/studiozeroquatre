import { createClient } from '@supabase/supabase-js'

// Client Supabase **serveur** agissant AU NOM du visiteur connecté.
//
// Les routes de l'espace (/api/espace/*) reçoivent le jeton de session du
// client et s'en servent tel quel : chaque requête part sous son identité, donc
// RLS s'applique exactement comme dans son navigateur. Un jeton trafiqué ne lit
// rien. Aucune clé secrète Supabase n'entre ici.
export function supabasePourJeton(jeton) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const cle = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !cle) return null

  return createClient(url, cle, {
    global: { headers: { Authorization: `Bearer ${jeton}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
