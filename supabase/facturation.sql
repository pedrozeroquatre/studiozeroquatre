-- Espace client — la fiche de facturation, remplie par le client lui-même
--
-- À EXÉCUTER PAR TOI dans le SQL Editor du projet Supabase partagé avec l'OS.
-- Je ne touche pas à la base. Réexécutable tel quel : tout y est
-- `if not exists` ou `create or replace`.
--
-- ── Pourquoi ─────────────────────────────────────────────────────────────────
-- Pour envoyer une facture par Peppol (obligatoire en B2B depuis le 01/01/2026),
-- il faut pour chaque restaurant : la raison sociale, le numéro de TVA,
-- l'adresse du siège et un e-mail de facturation. Aujourd'hui :
--   • `etablissements.societe` et `etablissements.tva` existent, mais sont
--     remplis à la main par le studio, et pas partout ;
--   • `etablissements.adresse` est un champ libre qui sert à la LIVRAISON —
--     on n'y touche pas ;
--   • aucun e-mail de facturation.
--
-- Le client remplit donc sa fiche lui-même à sa première connexion : il tape
-- son numéro de TVA, le site interroge VIES (le registre TVA de l'UE) qui rend
-- la raison sociale et l'adresse officielles, il confirme.
--
-- ── Ce que ce fichier fait ──────────────────────────────────────────────────
--   1. des colonnes `facturation_*` sur `etablissements`
--   2. une NOUVELLE vue, `portail_ma_facturation` — aucune vue existante n'est
--      modifiée (cf. supabase-portail-contrat.sql dans l'OS : toucher une vue
--      a déjà cassé l'espace une fois)
--   3. une fonction `enregistrer_facturation()`, seule écriture permise
--   4. rien d'autre — aucune politique RLS n'est modifiée


-- ————————————— 1. Les colonnes —————————————
--
-- `societe` et `tva` restent les colonnes de référence : ce sont celles que
-- l'OS affiche déjà. La fiche les met à jour au lieu d'en créer des doublons.
-- L'adresse de facturation, elle, a ses propres colonnes, découpées comme
-- Peppol les attend — et distinctes de `adresse`, qui reste celle de livraison.

alter table etablissements add column if not exists facturation_rue    text;
alter table etablissements add column if not exists facturation_cp     text;
alter table etablissements add column if not exists facturation_ville  text;
alter table etablissements add column if not exists facturation_pays   text default 'BE';
alter table etablissements add column if not exists facturation_email  text;
alter table etablissements add column if not exists facturation_maj_le timestamptz;


-- ————————————— 2. La vue —————————————
--
-- Une ligne par restaurant visible du compte : le sien, ou tous ceux du client
-- pour un compte groupe. Même filtre que `portail_mes_etablissements`.
--
-- `complete` dit à l'espace s'il doit encore demander la fiche. Calculée ici
-- plutôt que dans le navigateur, pour que la route de paiement et l'espace
-- appliquent exactement la même règle.

create or replace view portail_ma_facturation as
  select e.id, e.nom,
         e.societe, e.tva,
         e.facturation_rue   as rue,
         e.facturation_cp    as cp,
         e.facturation_ville as ville,
         e.facturation_pays  as pays,
         e.facturation_email as email,
         (coalesce(btrim(e.societe), '') <> ''
          and coalesce(btrim(e.tva), '') <> ''
          and coalesce(btrim(e.facturation_rue), '') <> ''
          and coalesce(btrim(e.facturation_cp), '') <> ''
          and coalesce(btrim(e.facturation_ville), '') <> ''
          and coalesce(btrim(e.facturation_email), '') <> '') as complete
  from etablissements e
  where mon_client_id() is not null
    and e.client_id = mon_client_id()
    and e.actif
    and (mon_etablissement_id() is null or e.id = mon_etablissement_id());

revoke all on portail_ma_facturation from public, anon;
grant select on portail_ma_facturation to authenticated;


-- ————————————— 3. Enregistrer la fiche —————————————
--
-- Même modèle que `passer_commande()` : la fonction impose elle-même le client.
-- Un compte rattaché à un restaurant écrit TOUJOURS pour celui-là ; un compte
-- groupe précise lequel, et la fonction vérifie qu'il est bien à lui.
--
-- Le numéro de TVA est revérifié ici (format belge + clé de contrôle modulo
-- 97) : c'est la base qui fait foi, pas le navigateur.
--
-- ⚠ Limite assumée : la consultation VIES se fait côté site, avant l'appel.
-- Un client qui appellerait cette fonction à la main pourrait poser une raison
-- sociale fantaisiste pour SON restaurant — jamais pour celui d'un autre. Il ne
-- ferait que fausser ses propres factures ; le numéro de TVA, lui, doit passer
-- la clé de contrôle. La facturation Falco pourra reconsulter VIES au moment
-- d'émettre si on veut le garantir.
--
-- Pas d'e-mail fourni → celui du compte connecté.

create or replace function enregistrer_facturation(
  p_societe       text,
  p_tva           text,
  p_rue           text,
  p_cp            text,
  p_ville         text,
  p_email         text default null,
  p_etablissement uuid default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  cid     uuid;
  eid     uuid;
  chiffres text;
  v_email  text;
begin
  cid := mon_client_id();
  if cid is null then
    raise exception 'Aucun client associé à ce compte.';
  end if;

  eid := coalesce(mon_etablissement_id(), p_etablissement);
  if eid is null then
    raise exception 'Précisez le restaurant concerné.';
  end if;
  if not exists (select 1 from etablissements
                  where id = eid and client_id = cid and actif) then
    raise exception 'Ce restaurant n''appartient pas à ce compte.';
  end if;

  -- « BE 0431.188.259 », « be0431188259 », « 431188259 » → 0431188259
  chiffres := regexp_replace(upper(coalesce(p_tva, '')), '[^0-9]', '', 'g');
  if length(chiffres) = 9 then
    chiffres := '0' || chiffres;
  end if;
  if chiffres !~ '^[01][0-9]{9}$'
     or 97 - (left(chiffres, 8)::bigint % 97) <> right(chiffres, 2)::int then
    raise exception 'Numéro de TVA belge invalide.';
  end if;

  if coalesce(btrim(p_societe), '') = '' then raise exception 'Raison sociale manquante.'; end if;
  if coalesce(btrim(p_rue), '')     = '' then raise exception 'Adresse manquante.'; end if;
  if coalesce(btrim(p_cp), '') !~ '^[0-9]{4}$' then raise exception 'Code postal invalide.'; end if;
  if coalesce(btrim(p_ville), '')   = '' then raise exception 'Ville manquante.'; end if;

  v_email := lower(coalesce(nullif(btrim(p_email), ''), auth.jwt() ->> 'email'));
  if v_email is null or v_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$' then
    raise exception 'Adresse e-mail de facturation invalide.';
  end if;

  update etablissements set
    societe            = left(btrim(p_societe), 200),
    tva                = 'BE' || chiffres,
    facturation_rue    = left(btrim(p_rue), 200),
    facturation_cp     = btrim(p_cp),
    facturation_ville  = left(btrim(p_ville), 120),
    facturation_pays   = 'BE',
    facturation_email  = left(v_email, 200),
    facturation_maj_le = now()
  where id = eid;

  return eid;
end $$;

revoke all on function enregistrer_facturation(text, text, text, text, text, text, uuid)
  from public, anon;
grant execute on function enregistrer_facturation(text, text, text, text, text, text, uuid)
  to authenticated;


-- ————————————— 4. Vérifications —————————————
--
-- Connecté avec un compte client :
--   select * from portail_ma_facturation;   -- ses restaurants, complete = false
-- En anonyme, doit être refusé :
--   permission denied for view portail_ma_facturation
--
-- Côté studio, qui n'a pas encore rempli sa fiche :
--   select c.nom as client, e.nom as restaurant, e.tva, e.facturation_email
--   from etablissements e join clients c on c.id = e.client_id
--   where e.actif and e.facturation_maj_le is null
--   order by c.nom, e.nom;
--
-- Et le contrôle complet, depuis le dépôt de l'OS :
--   npm run verifier
