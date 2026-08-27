import { createClient } from '@supabase/supabase-js'

// Client Supabase **navigateur** de l'espace client.
//
// Il n'utilise que la clé publishable (anon), publique par conception : tout le
// cloisonnement est fait côté base. Le client connecté n'a aucun droit sur les
// tables — il ne lit que les vues `portail_*` et n'écrit que via la fonction
// `passer_commande()`. Ne jamais poser la service role key ici : c'est du code
// qui part dans le navigateur.
//
// À ne pas confondre avec lib/supabase.js, qui est le client **serveur**
// (service role) de l'ancienne persistance Stripe.

// ── Lecture du lien d'invitation ────────────────────────────────────────────
// Supabase dépose le jeton dans le fragment (#access_token=…&type=invite).
// supabase-js le consomme *et efface le fragment* dès l'initialisation du
// client, donc on met de côté ce dont la page a besoin AVANT de le créer :
// le type de lien (invite / recovery) et l'éventuelle erreur (lien expiré).
// L'ordre est garanti : les deux instructions sont dans ce module, exécutées
// de haut en bas, et createClient() n'est appelé que plus bas, à la demande.
export const LIEN = lireLien()

function lireLien() {
  const vide = { present: false, type: null, erreur: null, code: null, description: null }
  if (typeof window === 'undefined') return vide

  const fragment = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : ''
  const p = new URLSearchParams(fragment)

  return {
    present: p.has('access_token') || p.has('error'),
    type: p.get('type'),                       // 'invite' | 'recovery' | 'magiclink' | …
    erreur: p.get('error'),                    // 'access_denied' quand le lien est mort
    code: p.get('error_code'),                 // 'otp_expired' au bout de 24 h
    description: p.get('error_description'),
  }
}

// Le lien est mort : expiré (24 h) ou déjà utilisé.
export function lienExpire() {
  return Boolean(LIEN.erreur)
}

// Le visiteur arrive d'un mail (invitation ou réinitialisation) : dans les deux
// cas la suite est la même — il choisit son mot de passe.
export function lienChoixMotDePasse() {
  return LIEN.present && !LIEN.erreur
}

// ── Le client ───────────────────────────────────────────────────────────────
let cache = null

export function getEspaceSupabase() {
  if (cache) return cache

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const cle = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !cle) return null

  cache = createClient(url, cle, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // Récupère la session déposée dans le fragment par le lien d'invitation.
      detectSessionInUrl: true,
      // Les mails partent du serveur Supabase : jetons dans le fragment,
      // pas de code PKCE.
      flowType: 'implicit',
      // Clé de stockage propre à l'espace client, pour ne pas marcher sur une
      // éventuelle session de l'OS ouverte dans le même navigateur.
      storageKey: 'szq-espace-auth',
    },
  })
  return cache
}

export function espaceConfigure() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}
