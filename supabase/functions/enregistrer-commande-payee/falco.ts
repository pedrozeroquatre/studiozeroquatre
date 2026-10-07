// — Facturer une commande payée dans Falco —
//
// Appelé par index.ts une fois la commande enregistrée. Crée la facture dans
// Falco, la fait approuver (Falco attribue alors le numéro légal), puis
// l'envoie par Peppol — ou par e-mail si le restaurant n'est pas inscrit sur
// Peppol (vérifié avant l'envoi, cf. canalEnvoi).
//
// Doc : https://docs.falco-app.be (spec OpenAPI publique, /reference/*.md).
//
// Secrets (Edge Functions → Secrets) :
//   FALCO_APP_SECRET   as_test_… (sandbox) ou as_live_… — celui de l'application
//                      créée sur dev.falco-app.be
//   FALCO_API_KEY      sk_test_… (sandbox) ou sk_live_… — généré dans Falco
//                      par l'organisation du studio, pour cette application
//   FALCO_API_URL      facultatif. Par défaut le SANDBOX : on ne passe en
//                      production (https://api.falco-app.be/v1) qu'exprès.
// Sans les deux premiers, rien n'est facturé et la commande passe quand même.
//
// ── Reprise et doublons ─────────────────────────────────────────────────────
// L'avancement est noté sur la commande (`commandes_clients.falco_*`), étape
// par étape : une facture créée a son id noté AVANT d'être approuvée, une
// facture approuvée a son numéro noté avant d'être envoyée. Si quoi que ce soit
// échoue, on reprend là où on s'est arrêté au lieu de tout refaire.
//
// Pour reprendre à la main : Stripe → Développeurs → Événements → l'événement
// du paiement → « Renvoyer ». La commande existe déjà (idempotence), et la
// facturation repart de son dernier état.
//
// Deux livraisons simultanées du même événement ne facturent pas deux fois :
// la commande est « réservée » (`falco_statut = 'en_cours'`) par une mise à
// jour conditionnelle, que seule l'une des deux peut gagner.

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { appelFalco, ErreurFalco, canalEnvoi, ficheClient, lignesFacture, corpsFacture } from "./falco-api.mjs";

// Une réservation plus vieille que ça vient d'une exécution morte en route.
const RESERVATION_PERIMEE_MS = 10 * 60 * 1000;

export type LigneStripe = {
  description: string | null;
  quantity: number | null;
  amount_subtotal: number; // centimes HTVA
  amount_total: number;    // centimes TVAC
};

type Contexte = {
  supabase: SupabaseClient;
  commandeId: string;
  lignesMeta: { reference: string; quantite: number }[];
  lignesStripe: LigneStripe[];
};

const env = (cle: string) => Deno.env.get(cle);
const appel = (methode: string, chemin: string, corps?: unknown) => appelFalco(methode, chemin, corps, env);

export function falcoConfigure() {
  return Boolean(env("FALCO_APP_SECRET") && env("FALCO_API_KEY"));
}

// ── Le client Falco ─────────────────────────────────────────────────────────
// Un restaurant = un client Falco, mémorisé dans `etablissements.falco_client_id`.
// À chaque facture, on lui repousse la fiche actuelle : si le restaurant a
// corrigé son adresse dans l'espace, la facture suivante la porte.
async function clientFalco(supabase: SupabaseClient, etab: Record<string, string | null>) {
  const fiche = ficheClient(etab);

  if (etab.falco_client_id) {
    await appel("PATCH", `/customers/${etab.falco_client_id}`, fiche);
    return etab.falco_client_id;
  }

  // Pas encore lié : peut-être déjà créé à la main dans Falco par le studio.
  const trouves = await appel("GET", `/customers?vat=${encodeURIComponent(fiche.vat_number)}`);
  let id: string | undefined = trouves?.data?.[0]?.id;
  if (id) {
    await appel("PATCH", `/customers/${id}`, fiche);
  } else {
    id = (await appel("POST", "/customers", fiche))?.id;
  }
  if (!id) throw new ErreurFalco("Falco n'a pas rendu d'identifiant client.", 0);

  await supabase.from("etablissements").update({ falco_client_id: id }).eq("id", etab.id);
  return id;
}

async function noter(supabase: SupabaseClient, commandeId: string, champs: Record<string, unknown>) {
  const { error } = await supabase.from("commandes_clients")
    .update({ ...champs, falco_le: new Date().toISOString() })
    .eq("id", commandeId);
  if (error) console.error("Falco — avancement non noté :", error.message, champs);
}

// ── Le parcours ─────────────────────────────────────────────────────────────
export async function facturer({ supabase, commandeId, lignesMeta, lignesStripe }: Contexte) {
  // 1. Réserver la commande. Ne passe que si elle n'est ni facturée, ni en
  //    cours ailleurs (sauf réservation morte).
  const perimee = new Date(Date.now() - RESERVATION_PERIMEE_MS).toISOString();
  const { data: reservee, error: eReserve } = await supabase.from("commandes_clients")
    .update({ falco_statut: "en_cours", falco_erreur: null, falco_le: new Date().toISOString() })
    .eq("id", commandeId)
    .or(`falco_statut.is.null,falco_statut.eq.erreur,and(falco_statut.eq.en_cours,falco_le.lt.${perimee})`)
    .select("numero, etablissement_id, falco_facture_id, falco_numero");

  if (eReserve) {
    console.error("Falco — réservation impossible :", eReserve.message);
    return;
  }
  if (!reservee?.length) {
    console.log("Falco — commande déjà facturée ou en cours :", commandeId);
    return;
  }
  const commande = reservee[0];

  try {
    const { data: etab, error: eEtab } = await supabase.from("etablissements")
      .select("id, societe, tva, facturation_rue, facturation_cp, facturation_ville, facturation_pays, facturation_email, falco_client_id")
      .eq("id", commande.etablissement_id)
      .single();
    if (eEtab || !etab) throw new ErreurFalco("Restaurant introuvable.", 0);

    const manque = ["societe", "tva", "facturation_rue", "facturation_cp", "facturation_ville", "facturation_email"]
      .filter((k) => !String(etab[k as keyof typeof etab] ?? "").trim());
    if (manque.length) throw new ErreurFalco(`Fiche de facturation incomplète : ${manque.join(", ")}.`, 0);

    const clientId = await clientFalco(supabase, etab);

    // 2. La facture, en brouillon. Avant d'en créer une, on vérifie qu'une
    //    exécution précédente ne l'a pas créée sans réussir à noter son id :
    //    elle porterait le numéro de commande en référence.
    let factureId: string | null = commande.falco_facture_id;
    if (!factureId) {
      const recentes = await appel("GET", `/invoices?customer_id=${clientId}&sort_by=created_at&sort_direction=desc&page_size=20`);
      factureId = recentes?.data?.find((f: { purchase_order_reference?: string }) =>
        f.purchase_order_reference === commande.numero)?.id ?? null;
    }
    if (!factureId) {
      const creee = await appel("POST", "/invoices", corpsFacture({
        clientId,
        numeroCommande: commande.numero,
        lignes: lignesFacture(lignesMeta, lignesStripe),
      }));
      factureId = creee?.id;
      if (!factureId) throw new ErreurFalco("Falco n'a pas rendu d'identifiant de facture.", 0);
    }
    await noter(supabase, commandeId, { falco_facture_id: factureId });

    // 3. Approbation : la facture est verrouillée et reçoit son numéro légal.
    let numero: string | null = commande.falco_numero;
    if (!numero) {
      const approuvee = await appel("POST", `/invoices/${factureId}/approve`, {});
      numero = approuvee?.number ?? approuvee?.invoice?.number ?? null;
      await noter(supabase, commandeId, { falco_numero: numero });
    }

    // 4. Envoi, par un seul canal : Peppol — la voie légale en B2B — si le
    //    restaurant y est inscrit, e-mail sinon.
    const envoi = await canalEnvoi(appel, ficheClient(etab).vat_number);
    if (envoi === "peppol") {
      const r = await appel("POST", `/invoices/${factureId}/send`, { send_peppol: true });
      if (r?.peppol_status?.status !== "submitted") {
        throw new ErreurFalco(`Envoi Peppol refusé : ${r?.peppol_status?.error_message ?? r?.peppol_status?.status}`, 0);
      }
    } else {
      await appel("POST", `/invoices/${factureId}/send`, { send_email: { email: etab.facturation_email } });
    }

    await noter(supabase, commandeId, { falco_statut: "ok", falco_envoi: envoi, falco_erreur: null });
    console.log(`Falco — facture ${numero} envoyée (${envoi}) pour ${commande.numero}`);
  } catch (e) {
    const message = (e as Error).message;
    console.error("Falco — facturation échouée :", message, commande.numero);
    await noter(supabase, commandeId, { falco_statut: "erreur", falco_erreur: message.slice(0, 1000) });
  }
}
