-- Tout client a au moins un restaurant
--
-- À EXÉCUTER PAR TOI dans le SQL Editor. Facultatif mais recommandé.
--
-- ── Le problème ─────────────────────────────────────────────────────────────
-- `creer-acces-client` n'exige que `client_id` ; `etablissement_id` est
-- optionnel, et c'est normal — le laisser NULL crée un compte « groupe » qui
-- voit tous les restaurants du client. Mais rien ne vérifie que le client en a
-- au moins UN.
--
-- Un client sans aucun restaurant peut donc recevoir un accès, se connecter,
-- voir son espace… et ne rien pouvoir commander : `enregistrer_commande_payee()`
-- comme `passer_commande()` ont besoin de savoir où livrer. C'est arrivé avec
-- « Nouveau client ».
--
-- La migration initiale créait bien un établissement par défaut pour chaque
-- client qui n'en avait pas, mais elle n'a tourné qu'une fois : tout client
-- créé depuis est passé à travers.
--
-- ── Le correctif ────────────────────────────────────────────────────────────
-- Un déclencheur, pour que ce soit vrai par construction et quel que soit le
-- chemin de création (l'OS, un import, une requête à la main).

create or replace function etablissement_par_defaut()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into etablissements (client_id, nom, societe, actif)
  values (new.id, new.nom, nullif(new.societes, ''), true)
  on conflict (client_id, nom) do nothing;
  return new;
end $$;

drop trigger if exists clients_etablissement_par_defaut on clients;
create trigger clients_etablissement_par_defaut
  after insert on clients
  for each row execute function etablissement_par_defaut();


-- Rattrapage des clients déjà créés sans restaurant (dont « Nouveau client ») :
insert into etablissements (client_id, nom, societe, actif)
select c.id, c.nom, nullif(c.societes, ''), true
from clients c
where not exists (select 1 from etablissements e where e.client_id = c.id)
on conflict (client_id, nom) do nothing;


-- ── Vérification ────────────────────────────────────────────────────────────
-- Doit ne rien renvoyer :
--   select c.nom from clients c
--   where not exists (select 1 from etablissements e where e.client_id = c.id);
