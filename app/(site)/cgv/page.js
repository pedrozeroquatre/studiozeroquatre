import PageLegale, { Bloc, Liste, Lien } from '@/components/legal/PageLegale'
import { SOCIETE, CGV_VERSION_LIBELLE } from '@/lib/societe'

export const metadata = {
  title: 'Conditions générales de vente — Studio Zeroquatre',
}

// ⚠ Toute modification de ce texte change la version : mettre à jour
// CGV_VERSION et CGV_VERSION_LIBELLE dans lib/societe.js, sans quoi les
// paiements continueraient d'enregistrer l'ancienne.
export default function Cgv() {
  return (
    <PageLegale surtitre="Informations légales" titre="Conditions générales de vente" miseAJour={CGV_VERSION_LIBELLE}>
      <Bloc titre="1. Champ d’application">
        <p>
          Les présentes conditions régissent toutes les ventes conclues par {SOCIETE.denomination}
          {' '}({SOCIETE.siege}, BCE {SOCIETE.bce}, TVA {SOCIETE.tva}), ci-après « le studio », avec ses clients.
        </p>
        <p>
          Le studio vend exclusivement à des professionnels (restaurants, hôtels, commerces). Les présentes
          conditions prévalent sur les conditions générales du client, sauf accord écrit contraire.
          Toute commande vaut acceptation des présentes conditions.
        </p>
      </Bloc>

      <Bloc titre="2. Commandes">
        <p>Une commande peut être passée de deux manières :</p>
        <Liste>
          <li>
            <strong className="text-text">sur devis</strong> — pour une nouvelle création ou un nouveau produit.
            La commande est ferme à l’acceptation écrite du devis. Aucune production n’est lancée sans la
            validation, par le client, du visuel ou du prototype qui lui a été soumis ;
          </li>
          <li>
            <strong className="text-text">depuis l’espace client</strong> — pour réassortir des produits déjà
            validés. La commande est ferme dès la confirmation du paiement.
          </li>
        </Liste>
      </Bloc>

      <Bloc titre="3. Prix">
        <p>
          Les prix sont exprimés en euros, hors TVA. La TVA belge au taux en vigueur (21 %) s’y ajoute.
        </p>
        <p>
          Dans l’espace client, le prix unitaire appliqué est le tarif convenu avec le client ; le montant
          total TVA comprise est affiché avant tout paiement. Pour une commande sur devis, le prix est celui
          du devis accepté, dans sa durée de validité.
        </p>
      </Bloc>

      <Bloc titre="4. Paiement">
        <p>
          Les commandes passées depuis l’espace client se paient en ligne, par carte, au moment de la
          commande. Le paiement est traité par Stripe ; le studio n’a jamais accès aux données de carte.
        </p>
        <p>
          Les commandes sur devis se paient selon les modalités indiquées sur le devis ou la facture, et à
          défaut dans les 30 jours suivant la date de facture.
        </p>
        <p>
          Tout montant impayé à l’échéance porte de plein droit, sans mise en demeure, des intérêts au taux
          prévu par la loi du 2 août 2002 concernant la lutte contre le retard de paiement dans les
          transactions commerciales, ainsi qu’une indemnité forfaitaire pour frais de recouvrement de 40 €,
          sans préjudice de frais supérieurs dûment justifiés.
        </p>
      </Bloc>

      <Bloc titre="5. Livraison">
        <p>
          <strong className="text-text">Espace client</strong> — la livraison a lieu à l’établissement du client,
          à la date choisie lors de la commande et, si un créneau horaire a été réservé, dans ce créneau.
        </p>
        <p>
          <strong className="text-text">Commandes sur devis</strong> — le délai de production est indiqué sur le
          devis. En Belgique, la livraison intervient dans un délai de 2 à 5 jours ouvrables après
          l’expédition.
        </p>
        <p>
          Les délais de production sont donnés à titre indicatif. Un retard ne peut justifier l’annulation de
          la commande qu’après une mise en demeure écrite restée sans effet pendant 15 jours, et n’ouvre
          droit à aucune indemnité.
        </p>
      </Bloc>

      <Bloc titre="6. Réception et réclamations">
        <p>
          Le client vérifie la marchandise à la livraison. Tout défaut apparent, manquant ou erreur de
          produit doit être signalé par écrit à <Lien href={`mailto:${SOCIETE.email}`}>{SOCIETE.email}</Lien>{' '}
          dans les 8 jours suivant la livraison, photos à l’appui. Passé ce délai, la livraison est réputée
          acceptée.
        </p>
        <p>
          Une réclamation reconnue fondée donne lieu, au choix du studio, au remplacement des produits
          concernés ou à un avoir. Une réclamation ne suspend pas l’obligation de paiement.
        </p>
      </Bloc>

      <Bloc titre="7. Annulation et modification">
        <p>
          Les produits étant personnalisés, une commande ferme ne peut être annulée ou modifiée qu’avec
          l’accord du studio et tant que sa production ou sa préparation n’a pas commencé. Les produits
          personnalisés ne sont ni repris ni échangés, sauf défaut reconnu au sens de l’article 6.
        </p>
      </Bloc>

      <Bloc titre="8. Fichiers et propriété intellectuelle">
        <p>
          Le client garantit disposer des droits sur les logos, textes et visuels qu’il fournit pour être
          imprimés, et garantit le studio contre toute réclamation de tiers à ce sujet.
        </p>
        <p>
          Sauf opposition écrite du client, le studio peut présenter les réalisations effectuées pour lui
          sur son site et ses réseaux sociaux.
        </p>
      </Bloc>

      <Bloc titre="9. Réserve de propriété">
        <p>
          Les marchandises restent la propriété du studio jusqu’au paiement complet de leur prix. Les
          risques sont transférés au client dès la livraison.
        </p>
      </Bloc>

      <Bloc titre="10. Responsabilité et force majeure">
        <p>
          La responsabilité du studio est limitée au montant de la commande concernée. Le studio ne répond
          pas des dommages indirects, tels qu’une perte d’exploitation ou de chiffre d’affaires.
        </p>
        <p>
          Le studio n’est pas responsable d’un retard ou d’une inexécution dus à un cas de force majeure,
          notamment une rupture d’approvisionnement de ses fournisseurs, une grève ou une interruption des
          transports.
        </p>
      </Bloc>

      <Bloc titre="11. Données personnelles">
        <p>
          Le traitement des données du client est décrit dans la{' '}
          <Lien href="/confidentialite">politique de confidentialité</Lien>.
        </p>
      </Bloc>

      <Bloc titre="12. Droit applicable et litiges">
        <p>
          Les présentes conditions sont soumises au droit belge. Tout litige relève de la compétence
          exclusive des tribunaux de l’arrondissement judiciaire de Bruxelles.
        </p>
      </Bloc>
    </PageLegale>
  )
}
