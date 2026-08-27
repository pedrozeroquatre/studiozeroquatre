// — Enregistrer une commande payée —
//
// Stripe appelle cette fonction quand un paiement de l'espace client aboutit.
// Elle crée la commande ET la livraison, à la date choisie par le client, qui
// apparaît alors automatiquement dans l'OS.
//
// Elle s'exécute chez Supabase, jamais dans le navigateur ni dans le site :
// c'est ce qui permet d'utiliser la clé de service. Le site studiozeroquatre.com
// ne la voit jamais — il ne fait que créer la session de paiement.
//
// À déployer depuis le dépôt de l'OS :
//   supabase functions deploy enregistrer-commande-payee --no-verify-jwt
//
// `--no-verify-jwt` est nécessaire : l'appelant est Stripe, pas un utilisateur
// connecté. L'authentification se fait par la SIGNATURE Stripe, vérifiée
// ci-dessous — sans elle, n'importe qui pourrait s'offrir des livraisons.
//
// Secrets à poser (Edge Functions → Secrets) :
//   STRIPE_SECRET_KEY        sk_live_… (ou sk_test_… pour valider)
//   STRIPE_WEBHOOK_SECRET    whsec_… du endpoint qui pointe vers CETTE fonction
// SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont fournis automatiquement.

import Stripe from "https://esm.sh/stripe@17.7.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const repond = (corps: unknown, status = 200) =>
  new Response(JSON.stringify(corps), {
    status,
    headers: { "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method !== "POST") return repond({ erreur: "Méthode non autorisée." }, 405);

  const CLE_STRIPE = Deno.env.get("STRIPE_SECRET_KEY");
  const SECRET_WEBHOOK = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!CLE_STRIPE || !SECRET_WEBHOOK) {
    console.error("Secrets Stripe absents.");
    return repond({ erreur: "Configuration incomplète." }, 500);
  }

  const stripe = new Stripe(CLE_STRIPE, { apiVersion: "2025-01-27.acacia" });

  // — 1. Est-ce bien Stripe qui appelle ? —
  // Le corps doit être lu BRUT : la signature porte sur les octets exacts,
  // un JSON.parse suivi d'un re-stringify la casserait.
  const signature = req.headers.get("stripe-signature");
  const brut = await req.text();

  let evenement: Stripe.Event;
  try {
    evenement = await stripe.webhooks.constructEventAsync(
      brut,
      signature!,
      SECRET_WEBHOOK,
      undefined,
      Stripe.createSubtleCryptoProvider(),
    );
  } catch (e) {
    console.error("Signature Stripe invalide :", (e as Error).message);
    return repond({ erreur: "Signature invalide." }, 400);
  }

  // — 2. Est-ce un événement qui nous concerne ? —
  if (evenement.type !== "checkout.session.completed") {
    return repond({ ignore: evenement.type });
  }

  const session = evenement.data.object as Stripe.Checkout.Session;
  const m = session.metadata ?? {};

  // L'ancien portail (/portal) envoie ses propres paiements sur le webhook du
  // site Next.js. On ne traite que ce qui vient de l'espace client.
  if (m.source !== "espace") {
    return repond({ ignore: "paiement hors espace client" });
  }

  // Un paiement non abouti ne crée rien.
  if (session.payment_status !== "paid") {
    return repond({ ignore: `payment_status=${session.payment_status}` });
  }

  // — 3. Écriture —
  // Tout est fait par une seule fonction SQL, en une transaction : soit la
  // commande ET la livraison existent, soit rien. Elle est idempotente sur
  // stripe_session_id, parce que Stripe rejoue ses événements.
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  let lignes: unknown;
  try {
    lignes = JSON.parse(m.lignes ?? "[]");
  } catch {
    console.error("Lignes illisibles dans les métadonnées :", m.lignes);
    return repond({ erreur: "Lignes illisibles." }, 400);
  }

  const { data, error } = await supabase.rpc("enregistrer_commande_payee", {
    p_client: m.client_id,
    p_etablissement: m.etablissement_id,
    p_date: m.date_livraison,
    p_lignes: lignes,
    // Le montant fait foi côté Stripe : on reprend ce qui a réellement été
    // encaissé, pas ce que le navigateur avait annoncé.
    p_montant: (session.amount_total ?? 0) / 100,
    p_note: m.note ?? null,
    p_session: session.id,
  });

  if (error) {
    // On répond 500 pour que Stripe REJOUE : le client a payé, la commande
    // doit finir par exister. C'est l'inverse du webhook du site, qui lui
    // n'a qu'un email à envoyer.
    console.error("Enregistrement échoué :", error.message, m);
    return repond({ erreur: error.message }, 500);
  }

  console.log("Commande payée enregistrée :", data, "session", session.id);
  return repond({ commande: data });
});
