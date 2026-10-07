-- Facturation Falco — le suivi, côté base
--
-- À EXÉCUTER PAR TOI dans le SQL Editor, APRÈS supabase/facturation.sql.
-- Réexécutable tel quel. Aucune vue n'est modifiée, aucune politique RLS
-- non plus : seules les colonnes ci-dessous s'ajoutent, et seule l'Edge
-- Function `enregistrer-commande-payee` (clé de service) les écrit.
--
-- ── Pourquoi ─────────────────────────────────────────────────────────────────
-- Chaque commande payée devient une facture Falco, envoyée par Peppol. La
-- fonction note son avancement sur la commande pour pouvoir reprendre où elle
-- s'est arrêtée sans jamais facturer deux fois (cf. falco.ts).


-- ————————————— 1. Sur la commande —————————————
--
--   falco_statut      NULL (pas encore traitée) · en_cours · ok · erreur
--   falco_facture_id  identifiant Falco — noté dès la création du brouillon
--   falco_numero      numéro légal, attribué par Falco à l'approbation
--   falco_envoi       peppol · email
--   falco_erreur      le message de Falco quand ça a échoué
--   falco_le          dernière étape franchie

alter table commandes_clients add column if not exists falco_statut     text;
alter table commandes_clients add column if not exists falco_facture_id text;
alter table commandes_clients add column if not exists falco_numero     text;
alter table commandes_clients add column if not exists falco_envoi      text;
alter table commandes_clients add column if not exists falco_erreur     text;
alter table commandes_clients add column if not exists falco_le         timestamptz;

alter table commandes_clients drop constraint if exists commandes_clients_falco_statut_valide;
alter table commandes_clients add  constraint commandes_clients_falco_statut_valide
  check (falco_statut is null or falco_statut in ('en_cours', 'ok', 'erreur'));


-- ————————————— 2. Sur le restaurant —————————————
--
-- Un restaurant = un client dans Falco. Mémorisé pour ne pas le recréer à
-- chaque facture (Falco ne dédoublonne pas de lui-même).

alter table etablissements add column if not exists falco_client_id text;


-- ————————————— 3. Le suivi —————————————
--
-- Les factures qui n'ont pas abouti. À regarder de temps en temps, tant que
-- l'OS ne les affiche pas :
--
--   select k.numero, c.nom as client, e.nom as restaurant,
--          k.falco_statut, k.falco_erreur, k.falco_le
--   from commandes_clients k
--   join clients c on c.id = k.client_id
--   left join etablissements e on e.id = k.etablissement_id
--   where k.paiement_recu
--     and coalesce(k.falco_statut, '') <> 'ok'
--   order by k.paye_le desc;
--
-- Pour relancer l'une d'elles : Stripe → Développeurs → Événements → le
-- paiement (checkout.session.completed) → « Renvoyer ». La commande n'est pas
-- recréée, seule la facturation reprend.
--
-- Les commandes payées AVANT la mise en route de Falco n'ont pas de facture
-- et n'en auront pas automatiquement : elles se font à la main dans Falco.
