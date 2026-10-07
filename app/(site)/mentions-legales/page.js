import PageLegale, { Bloc, Lien } from '@/components/legal/PageLegale'
import { SOCIETE } from '@/lib/societe'

export const metadata = {
  title: 'Mentions légales — Studio Zeroquatre',
}

export default function MentionsLegales() {
  return (
    <PageLegale surtitre="Informations légales" titre="Mentions légales" miseAJour="30 septembre 2026">
      <Bloc titre="Éditeur du site">
        <p>
          Le site {SOCIETE.site} est édité par <strong className="text-text">{SOCIETE.denomination}</strong>,{' '}
          {SOCIETE.forme} de droit belge.
        </p>
        <p>
          Siège social : {SOCIETE.siege}
          <br />
          Numéro d’entreprise (BCE) : {SOCIETE.bce}
          <br />
          Numéro de TVA : {SOCIETE.tva}
          <br />
          Email : <Lien href={`mailto:${SOCIETE.email}`}>{SOCIETE.email}</Lien>
          <br />
          Téléphone : <Lien href={SOCIETE.telephoneHref}>{SOCIETE.telephone}</Lien>
        </p>
        <p>Responsable de la publication : {SOCIETE.responsable}.</p>
      </Bloc>

      <Bloc titre="Hébergement">
        <p>
          Le site est hébergé par Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis —{' '}
          <Lien href="https://vercel.com">vercel.com</Lien>.
        </p>
        <p>
          Les données de l’espace client sont hébergées par Supabase Inc. —{' '}
          <Lien href="https://supabase.com">supabase.com</Lien>.
        </p>
      </Bloc>

      <Bloc titre="Propriété intellectuelle">
        <p>
          Les textes, photographies, visuels et le logo présents sur ce site sont la propriété de{' '}
          {SOCIETE.nom} ou de leurs titulaires respectifs. Toute reproduction sans accord écrit préalable
          est interdite.
        </p>
      </Bloc>

      <Bloc titre="Données personnelles et cookies">
        <p>
          Le traitement de vos données est décrit dans la{' '}
          <Lien href="/confidentialite">politique de confidentialité</Lien>, qui comprend la{' '}
          <Lien href="/confidentialite#cookies">mention relative aux cookies</Lien>.
        </p>
      </Bloc>

      <Bloc titre="Conditions de vente">
        <p>
          Les ventes sont régies par nos <Lien href="/cgv">conditions générales de vente</Lien>.
        </p>
      </Bloc>
    </PageLegale>
  )
}
