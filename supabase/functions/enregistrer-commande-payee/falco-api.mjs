// L'API Falco : les appels, la fiche client et les lignes de facture.
//
// En JavaScript pur, sans rien de propre à Deno, pour être partagé entre
// l'Edge Function (falco.ts) et le test hors ligne (scripts/tester-falco.mjs) :
// le test vérifie ainsi exactement les requêtes que la fonction enverra.

export const TVA = "21.0";
const SANDBOX = "https://api.sandbox.falco-app.be/v1";

export class ErreurFalco extends Error {
  constructor(message, status = 0) {
    super(message);
    this.status = status;
  }
}

const attendre = (essai) => new Promise((r) => setTimeout(r, 2000 * 2 ** (essai - 1)));

// Falco limite à 60 requêtes/minute et recommande de réessayer en doublant le
// délai à partir de 2 s. On ne réessaie que ce qui peut passer au deuxième
// coup : 429, 5xx, réseau — et « document-is-still-processing », le 403 que
// Falco rend tant qu'un envoi précédent (la tentative Peppol, typiquement)
// n'est pas terminé. Un 4xx de validation échouerait pareil.
//
// `env(cle)` lit FALCO_APP_SECRET, FALCO_API_KEY et FALCO_API_URL — dans les
// secrets Supabase pour la fonction, dans .env.local pour le test. Sans
// FALCO_API_URL, c'est le SANDBOX : la production ne s'atteint qu'exprès.
export async function appelFalco(methode, chemin, corps, env) {
  const base = (env("FALCO_API_URL") || SANDBOX).replace(/\/+$/, "");

  for (let essai = 1; ; essai++) {
    let res;
    try {
      res = await fetch(base + chemin, {
        method: methode,
        headers: {
          "X-Falco-App-Secret": env("FALCO_APP_SECRET"),
          "X-Falco-Api-Key": env("FALCO_API_KEY"),
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: corps === undefined ? undefined : JSON.stringify(corps),
        signal: AbortSignal.timeout(15000),
      });
    } catch (e) {
      if (essai >= 4) throw new ErreurFalco(`Falco injoignable : ${e.message}`);
      await attendre(essai);
      continue;
    }

    if (res.status === 429 || res.status >= 500) {
      if (essai >= 4) throw new ErreurFalco(`Falco ${res.status} sur ${chemin}`, res.status);
      await attendre(essai);
      continue;
    }

    const texte = await res.text();
    let json = null;
    try { json = texte ? JSON.parse(texte) : null; } catch { json = { detail: texte.slice(0, 300) }; }

    if (res.status === 403 && /still-processing/.test(json?.type || "")) {
      if (essai >= 5) throw new ErreurFalco(`Falco : document toujours en traitement sur ${chemin}`, 403);
      await attendre(essai);
      continue;
    }

    if (!res.ok) {
      // Erreurs au format RFC 9457 : { title, detail, code }.
      // Certains refus arrivent sans rien de tout ça : on garde alors le corps
      // brut et l'en-tête d'authentification, sinon l'erreur est muette.
      const detail = [json?.title, json?.detail, json?.code, json?.type].filter(Boolean).join(" — ")
        || texte.slice(0, 300)
        || res.headers.get("www-authenticate")
        || res.statusText;
      throw new ErreurFalco(`${methode} ${chemin} → ${res.status} ${detail}`, res.status);
    }
    return json;
  }
}

// Montants en chaînes, deux décimales : Falco refuse les nombres (cf. « Data
// Models »). On part toujours de centimes entiers, jamais de flottants.
export const euros = (centimes) => (centimes / 100).toFixed(2);

// La date d'aujourd'hui à Bruxelles, pas en UTC : un paiement à 0 h 30 le 1er
// du mois appartient à ce mois-là.
export const aujourdhui = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Brussels" }).format(new Date());

// La fiche Falco d'un restaurant, depuis sa ligne `etablissements`.
export function ficheClient(etab) {
  const chiffres = String(etab.tva || "").replace(/[^0-9]/g, "");
  return {
    name: etab.societe,
    language: "fr",
    is_vat_liable: true,
    vat_number: `BE${chiffres}`,
    company_number: chiffres,
    emails: [etab.facturation_email],
    address: {
      line1: etab.facturation_rue,
      zip: etab.facturation_cp,
      city: etab.facturation_ville,
      country: etab.facturation_pays || "BE",
    },
  };
}

// On facture exactement ce que Stripe a encaissé, ligne par ligne : même
// montant HTVA par ligne. La TVA, Falco la calcule lui-même — il refuse un
// `total_amount` quand les prix sont HTVA (malgré sa doc, qui le dit requis).
// Le test hors ligne vérifie que son total tombe au centime sur celui de
// Stripe. Les lignes Stripe sont dans l'ordre des métadonnées (cf. la route
// de paiement du site), ce qui permet de retrouver le nombre de boîtes.
//
// Une ligne Stripe vaut « quantité × prix » arrondi au centime ; le prix
// unitaire garde donc jusqu'à 4 décimales (0,2550 €/boîte), comme en base.
//
// lignesMeta   [{ reference, quantite }]            — métadonnées de la session
// lignesStripe [{ description, amount_subtotal }] — en centimes HTVA
export function lignesFacture(lignesMeta, lignesStripe) {
  return lignesStripe.map((l, i) => {
    const meta = lignesMeta.length === lignesStripe.length ? lignesMeta[i] : null;
    const quantite = meta?.quantite > 0 ? meta.quantite : 1;
    const unitaire = (l.amount_subtotal / 100 / quantite).toFixed(4).replace(/(\.\d\d)0{1,2}$/, "$1");

    return {
      line_type: "article",
      reference: meta?.reference ?? undefined,
      description: meta ? `Boîtes ${meta.reference}` : (l.description || "Boîtes"),
      quantity: String(quantite),
      unit_price: unitaire,
      unit_of_measure: "C62", // « unité », liste UN/ECE rec. 20
      tax_rate: TVA,
      discount_rate: "0",
      base_amount: euros(l.amount_subtotal),
    };
  });
}

// Le corps de POST /invoices.
export function corpsFacture({ clientId, numeroCommande, lignes }) {
  const date = aujourdhui();
  return {
    document_type: "sale_invoice",
    document_date: date,
    due_date: date, // déjà payée
    language: "fr",
    customer_id: clientId,
    purchase_order_reference: numeroCommande,
    our_references: numeroCommande,
    payment_status: "paid",
    tax_regime: { type: "standard" },
    lines: lignes,
  };
}

// Par où envoyer la facture : Peppol si le restaurant y est inscrit, e-mail
// sinon. On demande AVANT d'envoyer, plutôt que d'essayer Peppol et de se
// replier sur l'e-mail : une tentative Peppol ratée laisse le document « en
// traitement » chez Falco, et tout envoi suivant est refusé.
//
// En sandbox, Falco cherche sur le réseau Peppol de TEST, où les vraies
// sociétés n'existent pas : la réponse y est donc toujours « e-mail ».
export async function canalEnvoi(appel, vatNumber) {
  try {
    const r = await appel("GET", `/peppol/participants/find?vat_number=${encodeURIComponent(vatNumber)}&document_type=invoice`);
    return r?.participant_identifier ? "peppol" : "email";
  } catch (e) {
    if (e instanceof ErreurFalco && e.status === 404) return "email";
    throw e;
  }
}
