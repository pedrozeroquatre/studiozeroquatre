-- Studio Zeroquatre — historique des commandes
--
-- À exécuter une fois dans le SQL Editor de Supabase (projet → SQL Editor → New query).
--
-- Deux sources alimentent cette table :
--   • 'stripe' — écrit par le webhook Stripe quand un paiement est confirmé
--   • 'import' — l'historique repris du fichier Numbers (commandes antérieures au portail)
--
-- Le portail lit cette table pour afficher l'historique du client et alimenter
-- « Refaire ma dernière commande ».

create table if not exists public.orders (
  id                uuid primary key default gen_random_uuid(),

  ref               text not null,                    -- SZQ-XXXXXXXX
  client_id         text not null,                    -- clé de lib/clients.js (ex. 'volta')
  client_name       text not null,

  -- Lignes de commande figées au moment de l'achat : [{ id, fmt, qual, qty,
  -- unit_price, subtotal_cents }]. On les fige plutôt que de les recalculer
  -- depuis lib/clients.js, sinon un changement de prix réécrirait le passé.
  items             jsonb not null default '[]'::jsonb,

  total_cents       integer not null default 0,
  currency          text not null default 'eur',

  delivery_date     date,
  delivery_time     text,                             -- 'hh:mm', pas de type time : champ libre côté client
  note              text,

  source            text not null default 'stripe',   -- 'stripe' | 'import'
  status            text not null default 'paid',     -- 'paid' | 'pending' | 'cancelled'

  stripe_session_id text,                             -- null pour les commandes importées
  paid_at           timestamptz,
  created_at        timestamptz not null default now()
);

-- Idempotence du webhook : Stripe rejoue ses événements (retries, redelivery).
-- Sans cette contrainte, un même paiement créerait plusieurs commandes.
create unique index if not exists orders_stripe_session_id_key
  on public.orders (stripe_session_id)
  where stripe_session_id is not null;

-- Lecture principale du portail : les commandes d'un client, plus récentes d'abord.
create index if not exists orders_client_created_idx
  on public.orders (client_id, created_at desc);

-- RLS activé sans aucune policy : personne ne peut lire/écrire avec la clé anon.
-- Tous les accès passent par le serveur Next.js avec la service role key, qui
-- contourne RLS. C'est volontaire — le portail n'a pas d'auth Supabase, c'est
-- le code d'accès (lib/clients.js) qui autorise, côté serveur.
alter table public.orders enable row level security;

-- ── Dashboard admin (autre site, à venir) ────────────────────────────────────
-- Cette base est partagée : ce repo ÉCRIT les commandes (webhook Stripe), le
-- dashboard admin les LIT. Règles à tenir :
--
--   • le dashboard ne doit PAS réutiliser la service role key de ce projet —
--     lui donner sa propre auth (Supabase Auth) et décommenter la policy
--     ci-dessous, qui ouvre la lecture aux comptes connectés uniquement ;
--   • un seul écrivain (le webhook), sinon les deux sources divergent ;
--   • ce fichier est le contrat : renommer une colonne ici casse l'autre site.
--
-- create policy "lecture pour les comptes connectés"
--   on public.orders for select
--   to authenticated
--   using (true);
