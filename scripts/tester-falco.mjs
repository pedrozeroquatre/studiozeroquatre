// Test de la facturation Falco, SANS paiement et SANS vraie facture.
//
// Rejoue contre le SANDBOX Falco exactement le parcours de l'Edge Function
// `enregistrer-commande-payee` — mêmes fonctions, même fichier
// (falco-api.mjs) : client, facture, approbation, choix du canal, envoi.
// Seule la commande est fictive, avec des lignes calculées comme Stripe les
// calcule.
//
//   node scripts/tester-falco.mjs
//
// En sandbox, le canal est toujours l'e-mail (réseau Peppol de test, où les
// vraies sociétés n'existent pas) : l'e-mail part peut-être pour de vrai, d'où
// FALCO_TEST_EMAIL.
//
// Clés dans .env.local (jamais commité) :
//   FALCO_APP_SECRET=as_test_…
//   FALCO_API_KEY=sk_test_…
//   FALCO_TEST_EMAIL=… facultatif — où partirait la facture par e-mail
//
// Refuse de tourner avec des clés de production : un test ne doit jamais
// émettre de numéro de facture réel.

import { readFileSync } from "node:fs";
import {
  appelFalco, canalEnvoi, ficheClient, lignesFacture, corpsFacture,
} from "../supabase/functions/enregistrer-commande-payee/falco-api.mjs";

const vert = (t) => `\x1b[32m${t}\x1b[0m`;
const rouge = (t) => `\x1b[31m${t}\x1b[0m`;
const gris = (t) => `\x1b[90m${t}\x1b[0m`;

// .env.local, lu à la main : pas de dépendance pour quatre lignes.
const fichier = (() => {
  try { return readFileSync(new URL("../.env.local", import.meta.url), "utf8"); } catch { return ""; }
})();
const variables = Object.fromEntries(
  fichier.split("\n")
    .map((l) => l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/))
    .filter(Boolean)
    .map(([, k, v]) => [k, v.replace(/^["']|["']$/g, "")]),
);
const env = (cle) => process.env[cle] || variables[cle] || undefined;

if (!env("FALCO_APP_SECRET") || !env("FALCO_API_KEY")) {
  console.error(rouge("FALCO_APP_SECRET et FALCO_API_KEY manquent dans .env.local."));
  process.exit(1);
}
if (/as_live_|sk_live_/.test(env("FALCO_APP_SECRET") + env("FALCO_API_KEY")) || /api\.falco-app\.be/.test(env("FALCO_API_URL") || "")) {
  console.error(rouge("Clés ou adresse de PRODUCTION détectées. Ce test ne tourne qu'en sandbox."));
  process.exit(1);
}

const appel = (methode, chemin, corps) => appelFalco(methode, chemin, corps, env);
const etape = (t) => console.log(`\n${t}`);

// La fiche du studio, comme si le compte test l'avait remplie dans l'espace.
const etab = {
  societe: "SRL Studio ZeroQuatre",
  tva: "BE1038659469",
  facturation_rue: "Rue de l'Abbaye 40",
  facturation_cp: "1050",
  facturation_ville: "Ixelles",
  facturation_pays: "BE",
  facturation_email: env("FALCO_TEST_EMAIL") || "contact@studiozeroquatre.com",
};

// Deux lignes calculées comme la route de paiement et Stripe : HTVA arrondi
// au centime par ligne, puis TVA 21 % arrondie par ligne. Le prix à 4
// décimales est volontaire — c'est le cas à valider.
const prix = 0.255;
const lignesMeta = [
  { reference: "33×33×4", quantite: 1000 },
  { reference: "30×30×4", quantite: 300 },
];
const lignesStripe = lignesMeta.map((l) => {
  const ht = Math.round(l.quantite * prix * 100);
  return { description: `${l.reference} — ${l.quantite} boîtes`, amount_subtotal: ht, amount_total: ht + Math.round(ht * 0.21) };
});

try {
  etape("Organisation");
  const org = await appel("GET", "/organization/whoami");
  console.log(vert("  ✓"), org?.name ?? org?.organization?.name ?? JSON.stringify(org).slice(0, 120));

  etape("Client");
  const fiche = ficheClient(etab);
  const trouves = await appel("GET", `/customers?vat=${encodeURIComponent(fiche.vat_number)}`);
  let clientId = trouves?.data?.[0]?.id;
  if (clientId) {
    await appel("PATCH", `/customers/${clientId}`, fiche);
    console.log(vert("  ✓"), `existant, mis à jour (${clientId})`);
  } else {
    clientId = (await appel("POST", "/customers", fiche))?.id;
    console.log(vert("  ✓"), `créé (${clientId})`);
  }

  etape("Facture (brouillon)");
  const numeroCommande = `TEST-${Date.now()}`;
  const lignes = lignesFacture(lignesMeta, lignesStripe);
  for (const l of lignes) console.log(gris(`  ${l.quantity} × ${l.unit_price} = ${l.base_amount} HTVA`));
  const facture = await appel("POST", "/invoices", corpsFacture({ clientId, numeroCommande, lignes }));
  console.log(vert("  ✓"), `${facture?.id} — ${facture?.base_amount} HTVA, ${facture?.total_amount} TVAC`);

  const attendu = lignesStripe.reduce((s, l) => s + l.amount_total, 0) / 100;
  if (Number(facture?.total_amount) !== attendu) {
    console.log(rouge("  ✗"), `Falco calcule ${facture?.total_amount} TVAC, Stripe aurait encaissé ${attendu.toFixed(2)}`);
  } else {
    console.log(vert("  ✓"), "même total que Stripe, au centime");
  }

  etape("Approbation");
  const approuvee = await appel("POST", `/invoices/${facture.id}/approve`, {});
  console.log(vert("  ✓"), `numéro ${approuvee?.number ?? approuvee?.invoice?.number}`);

  etape("Canal d'envoi");
  const canal = await canalEnvoi(appel, fiche.vat_number);
  console.log(vert("  ✓"), canal === "peppol" ? "inscrit sur Peppol" : "pas sur Peppol → e-mail", gris("(en sandbox : réseau Peppol de test)"));

  etape("Envoi");
  if (canal === "peppol") {
    const r = await appel("POST", `/invoices/${facture.id}/send`, { send_peppol: true });
    const statut = r?.peppol_status?.status;
    console.log(statut === "submitted" ? vert("  ✓") : rouge("  ✗"), `Peppol : ${statut}`, r?.peppol_status?.error_message ?? "");
  } else {
    await appel("POST", `/invoices/${facture.id}/send`, { send_email: { email: etab.facturation_email } });
    console.log(vert("  ✓"), `e-mail à ${etab.facturation_email}`);
  }

  console.log(vert("\nParcours complet."));
} catch (e) {
  console.error(rouge(`\n✗ ${e.message}`));
  process.exit(1);
}
