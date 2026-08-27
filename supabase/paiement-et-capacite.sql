-- Espace client — paiement Stripe, création de la livraison, capacité de tournée
--
-- À EXÉCUTER PAR TOI dans le SQL Editor du projet Supabase partagé avec l'OS.
-- Je ne touche pas à la base. À exécuter APRÈS supabase/vue-tarif.sql.
--
-- Ce fichier fait trois choses :
--   1. de quoi savoir qu'une commande est payée, sans jamais montrer la
--      référence de transaction au client
--   2. une vue disant quels jours sont complets (4 livraisons/jour)
--   3. rien d'autre — aucune politique RLS n'est modifiée


-- ————————————— 1. Le paiement d'une commande —————————————
--
-- `commandes_clients` n'avait aucun champ de paiement. On en ajoute deux.
-- `stripe_session_id` n'est PAS exposé dans `portail_mes_commandes` : la vue
-- liste ses colonnes une par une, donc ajouter une colonne à la table ne la
-- rend pas visible au client. C'est voulu — une référence de transaction n'a
-- rien à faire sous les yeux du restaurateur.

alter table commandes_clients add column if not exists paiement_recu     boolean default false;
alter table commandes_clients add column if not exists paye_le           timestamptz;
alter table commandes_clients add column if not exists montant_htva      numeric(10,2);
alter table commandes_clients add column if not exists stripe_session_id text;
alter table commandes_clients add column if not exists livraison_id      uuid references livraisons(id) on delete set null;

-- Idempotence : Stripe rejoue ses événements (retries, redelivery). Sans cet
-- index, un même paiement créerait deux commandes et deux livraisons.
create unique index if not exists commandes_clients_stripe_session_key
  on commandes_clients (stripe_session_id)
  where stripe_session_id is not null;


-- ————————————— 2. Le client voit que sa commande est payée —————————————
--
-- On ÉTEND `portail_mes_commandes` (on ne la remplace pas par autre chose) :
-- mêmes colonnes qu'avant, plus l'état de paiement et le montant. Toujours
-- pas de `notes_internes`, toujours pas de `stripe_session_id`.

create or replace view portail_mes_commandes as
  select k.id, k.numero, e.nom as etablissement, k.statut,
         k.demande_le, k.souhaitee_le, k.notes_client,
         k.paiement_recu, k.montant_htva
  from commandes_clients k
  left join etablissements e on e.id = k.etablissement_id
  where mon_client_id() is not null
    and k.client_id = mon_client_id()
    and (mon_etablissement_id() is null
         or k.etablissement_id = mon_etablissement_id());

revoke all on portail_mes_commandes from public, anon;
grant select on portail_mes_commandes to authenticated;


-- ————————————— 3. Les jours complets —————————————
--
-- Capacité : 4 livraisons par jour, tous clients confondus. Le calendrier de
-- l'espace grise ces jours-là.
--
-- Cette vue ne rend QUE des dates. Pas de nom, pas de compteur, pas de client :
-- un restaurateur apprend que le mardi est plein, rien de plus. C'est le
-- minimum nécessaire pour que le calendrier soit honnête.
--
-- Pour changer la capacité, change le 4 ci-dessous et réexécute ce bloc.

create or replace view portail_jours_complets as
  select l.date_livraison as date
  from livraisons l
  where mon_client_id() is not null
    and l.date_livraison >= current_date
  group by l.date_livraison
  having count(*) >= 4;

revoke all on portail_jours_complets from public, anon;
grant select on portail_jours_complets to authenticated;


-- ————————————— 4. Enregistrer une commande payée —————————————
--
-- Appelée UNIQUEMENT par l'Edge Function `enregistrer-commande-payee`, une
-- fois la signature Stripe vérifiée. Elle écrit la commande ET la livraison
-- dans la même transaction : un rejeu Stripe ne peut pas laisser une livraison
-- orpheline, et une erreur au milieu n'écrit rien du tout.
--
-- ⚠ Le droit d'exécution est retiré à `authenticated` : si un client pouvait
-- l'appeler, il marquerait ses propres commandes payées sans rien payer.
-- Seul `service_role` peut, et cette clé ne vit que dans les secrets Supabase.

create or replace function enregistrer_commande_payee(
  p_client        uuid,
  p_etablissement uuid,
  p_date          date,
  p_lignes        jsonb,
  p_montant       numeric,
  p_note          text,
  p_session       text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nom       text;
  v_livraison uuid;
  v_commande  uuid;
  v_resume    text;
  l           jsonb;
begin
  -- Idempotence : Stripe rejoue ses événements. On rend la commande déjà
  -- enregistrée plutôt que d'en créer une deuxième.
  select id into v_commande from commandes_clients where stripe_session_id = p_session;
  if v_commande is not null then
    return v_commande;
  end if;

  if p_etablissement is null then
    raise exception 'Établissement manquant.';
  end if;
  if not exists (select 1 from etablissements e
                  where e.id = p_etablissement and e.client_id = p_client) then
    raise exception 'Ce restaurant n''appartient pas à ce client.';
  end if;

  select nom into v_nom from clients where id = p_client;

  -- `livraisons.produits` est le résumé texte que l'OS affiche en liste.
  select string_agg(format('%s × %s', x->>'reference', x->>'quantite'), ', ')
    into v_resume
    from jsonb_array_elements(p_lignes) x;

  insert into livraisons (date_livraison, client, client_id, etablissement_id,
                          produits, prix_htva, tva_taux, livre, paiement_recu)
  values (p_date, v_nom, p_client, p_etablissement,
          coalesce(v_resume, ''), p_montant, 21, false, true)
  returning id into v_livraison;

  for l in select * from jsonb_array_elements(p_lignes) loop
    insert into livraison_lignes (livraison_id, taille, quantite)
    values (v_livraison, l->>'reference', (l->>'quantite')::int);
  end loop;

  insert into commandes_clients (client_id, etablissement_id, numero, statut,
                                 souhaitee_le, notes_client, paiement_recu,
                                 paye_le, montant_htva, stripe_session_id, livraison_id)
  values (p_client, p_etablissement,
          'CMD-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('seq_commande_client')::text, 4, '0'),
          'confirmee', p_date, left(coalesce(p_note, ''), 2000), true,
          now(), p_montant, p_session, v_livraison)
  returning id into v_commande;

  return v_commande;
end $$;

revoke all on function enregistrer_commande_payee(uuid, uuid, date, jsonb, numeric, text, text)
  from public, anon, authenticated;
grant execute on function enregistrer_commande_payee(uuid, uuid, date, jsonb, numeric, text, text)
  to service_role;


-- ————————————— 5. Vérifications —————————————
--
-- Connecté avec un compte client :
--   select * from portail_jours_complets;     -- des dates, ou rien
--   select * from portail_mes_commandes;      -- doit inclure paiement_recu
--
-- En anonyme, les deux doivent être refusées :
--   permission denied for view …
--
-- Et le contrôle complet, depuis le dépôt de l'OS :
--   npm run verifier
