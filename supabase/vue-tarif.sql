-- Espace client — exposer au client son propre tarif
--
-- À EXÉCUTER PAR TOI dans le SQL Editor du projet Supabase partagé avec l'OS.
-- Je ne touche pas à la base : cette vue est une proposition, pas un fait.
--
-- ── Pourquoi c'est nécessaire ───────────────────────────────────────────────
-- Aucune vue `portail_*` n'expose de prix. L'espace client peut donc prendre
-- des quantités, mais pas afficher de montant — ni au moment de commander, ni
-- pour brancher un paiement plus tard.
--
-- ── Pourquoi ça ne trahit rien ──────────────────────────────────────────────
-- `clients.prix` est commenté « prix de vente HTVA / boîte » : c'est le prix
-- que ce client PAIE DÉJÀ et qui figure sur chacune de ses factures. Le lui
-- montrer ne lui apprend rien.
--
-- La marge, elle, reste hors de portée : elle se déduit de `prix` MOINS le
-- coût d'achat, et ce coût (0,1378 €/boîte, la constante COST de l'OS) n'est
-- ni dans cette vue ni dans aucune autre. Restent également invisibles :
--   • clients.plaques  — coût des plaques flexo
--   • clients.notes    — notes commerciales (« cible reconquête », « perdu »)
--   • clients.volume_mensuel, clients.statut, clients.contrat
-- Un `select *` sur la table livrerait tout ça ; cette vue ne rend qu'une
-- colonne, pour la seule ligne du client connecté.
--
-- Même filtre que les autres vues du portail, mêmes droits (rien pour anon,
-- lecture pour les comptes connectés).

-- `etablissements.prix` existe déjà et l'intention est écrite dans le SQL de
-- Pedro : « laissée à NULL, on retombe sur clients.prix ». On respecte ça —
-- si un restaurant a son propre prix, c'est lui qui vaut.
create or replace view portail_mon_tarif as
  select c.id, coalesce(e.prix, c.prix) as prix_unitaire_htva
  from clients c
  left join etablissements e on e.id = mon_etablissement_id()
  where mon_client_id() is not null
    and c.id = mon_client_id();

revoke all on portail_mon_tarif from public, anon;
grant select on portail_mon_tarif to authenticated;


-- ── Vérification (facultatif) ───────────────────────────────────────────────
-- Connecté avec un compte client, doit renvoyer une seule ligne :
--   select * from portail_mon_tarif;
-- En anonyme, doit être refusé :
--   permission denied for view portail_mon_tarif


-- ── Un prix par client, sauf exception ──────────────────────────────────────
-- `clients.prix` s'applique à tous les formats et à tous les restaurants d'un
-- client (Pizza N' Shake : 0,26 € pour Ixelles comme pour Molenbeek).
-- `etablissements.prix` permet de déroger pour un restaurant précis ; il est
-- NULL partout aujourd'hui.
--
-- ⚠ Limite connue : la vue rend UNE ligne, celle du restaurant du compte
-- connecté. Un compte « groupe » (rattaché à aucun restaurant) verra donc le
-- prix du client, même si l'un de ses restaurants a une dérogation. Sans objet
-- tant que tous les `etablissements.prix` sont NULL ; le jour où tu en poses
-- un, dis-le-moi, il faudra passer à une vue par établissement.
--
-- ⚠ En revanche, ce prix devient celui qui est DÉBITÉ. Avant d'ouvrir le
-- paiement, relis la liste une fois :
--   select nom, statut, prix from clients order by nom;
