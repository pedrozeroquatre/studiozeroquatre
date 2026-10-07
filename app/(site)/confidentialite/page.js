import PageLegale, { Bloc, Liste, Lien } from '@/components/legal/PageLegale'
import { SOCIETE } from '@/lib/societe'

export const metadata = {
  title: 'Politique de confidentialité — Studio Zeroquatre',
}

export default function Confidentialite() {
  return (
    <PageLegale surtitre="Informations légales" titre="Politique de confidentialité" miseAJour="30 septembre 2026">
      <Bloc titre="Responsable du traitement">
        <p>
          {SOCIETE.denomination}, {SOCIETE.siege}, BCE {SOCIETE.bce}. Pour toute question relative à vos
          données : <Lien href={`mailto:${SOCIETE.email}`}>{SOCIETE.email}</Lien>.
        </p>
      </Bloc>

      <Bloc titre="Données collectées et finalités">
        <p><strong className="text-text">Formulaire de contact</strong> — nom, email et message, pour répondre à votre demande.</p>
        <p>
          <strong className="text-text">Demande de devis</strong> — nom du restaurant, nom, email, téléphone,
          produits, formats et volumes souhaités, pour établir et suivre votre devis.
        </p>
        <p>
          <strong className="text-text">Espace client</strong> — email et mot de passe du compte, établissements,
          commandes, livraisons et documents, pour vous permettre de commander et de suivre vos livraisons.
          Les comptes sont créés par le studio ; il n’y a pas d’inscription publique.
        </p>
        <p>
          <strong className="text-text">Paiement</strong> — les paiements sont traités par Stripe. Vos données
          de carte sont saisies sur la page de Stripe et ne transitent jamais par nos serveurs.
        </p>
        <p>
          <strong className="text-text">Sécurité</strong> — l’adresse IP de l’expéditeur d’un formulaire est gardée
          en mémoire pendant une heure au plus, pour limiter les envois abusifs. Elle n’est pas enregistrée.
        </p>
      </Bloc>

      <Bloc titre="Bases légales">
        <Liste>
          <li>l’exécution d’un contrat ou de mesures précontractuelles (devis, commandes, espace client) ;</li>
          <li>notre intérêt légitime à répondre aux messages reçus et à sécuriser le site ;</li>
          <li>nos obligations légales, notamment comptables et fiscales (factures, paiements).</li>
        </Liste>
      </Bloc>

      <Bloc titre="Destinataires et sous-traitants">
        <p>Vos données ne sont ni vendues ni louées. Elles sont traitées, pour notre compte, par :</p>
        <Liste>
          <li>Vercel Inc. — hébergement du site ;</li>
          <li>Supabase Inc. — base de données et authentification de l’espace client ;</li>
          <li>Stripe Payments Europe Ltd — paiement en ligne ;</li>
          <li>Namecheap Inc. (Private Email) — messagerie, réception des formulaires.</li>
        </Liste>
        <p>
          Certains de ces prestataires sont établis hors de l’Union européenne. Ces transferts sont encadrés
          par les clauses contractuelles types de la Commission européenne ou par le cadre de protection des
          données UE–États-Unis.
        </p>
      </Bloc>

      <Bloc titre="Durées de conservation">
        <Liste>
          <li>messages et demandes de devis sans suite : 3 ans après le dernier échange ;</li>
          <li>compte de l’espace client : pendant la relation commerciale, puis supprimé au plus tard un an après sa fin ;</li>
          <li>commandes, paiements et factures : la durée imposée par les obligations comptables et fiscales belges (jusqu’à 10 ans).</li>
        </Liste>
      </Bloc>

      <Bloc titre="Vos droits">
        <p>
          Vous pouvez demander l’accès à vos données, leur rectification, leur effacement, la limitation de
          leur traitement ou leur portabilité, et vous opposer à un traitement fondé sur notre intérêt
          légitime. Écrivez-nous à <Lien href={`mailto:${SOCIETE.email}`}>{SOCIETE.email}</Lien> ; nous
          répondons dans un délai d’un mois.
        </p>
        <p>
          Vous pouvez aussi introduire une réclamation auprès de l’Autorité de protection des données, rue de
          la Presse 35, 1000 Bruxelles —{' '}
          <Lien href="https://www.autoriteprotectiondonnees.be">autoriteprotectiondonnees.be</Lien>.
        </p>
      </Bloc>

      <Bloc id="cookies" titre="Cookies">
        <p>
          Ce site n’utilise ni cookies publicitaires, ni outils de mesure d’audience, ni traceurs tiers.
        </p>
        <p>
          Seul l’espace client enregistre dans votre navigateur le jeton de votre session, pour vous garder
          connecté. Il est strictement nécessaire au fonctionnement du service et ne requiert donc pas de
          consentement. Il disparaît lorsque vous vous déconnectez.
        </p>
        <p>
          La page de paiement est hébergée par Stripe, qui y dépose ses propres cookies, notamment pour
          prévenir la fraude.
        </p>
      </Bloc>
    </PageLegale>
  )
}
