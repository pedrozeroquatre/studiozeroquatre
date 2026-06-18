export const translations = {
  fr: {
    nav_realisations: 'Réalisations',
    nav_processus: 'Processus',
    nav_devis: 'Devis',
    nav_portal: 'Espace clients',
    hero_eyebrow: 'Studio de packaging · Bruxelles',
    hero_slogan: 'Chaque boîte raconte votre histoire.',
    volta_eyebrow: 'Réalisation',
    volta_headline: 'Volta Supper Club',
    volta_desc: 'Packaging complet pour un restaurant bruxellois exigeant — boîtes pizza kraft, sacs sur mesure et barquettes illustrées qui prolongent l\'expérience au-delà de la table.',
    process_title: 'Notre processus',
    process_1_title: 'Brief',
    process_1_desc: 'Vous nous partagez votre univers, vos contraintes et votre volume. On écoute avant de proposer.',
    process_2_title: 'Création',
    process_2_desc: 'Nos graphistes conçoivent des packagings qui respectent votre identité et se distinguent sur le comptoir.',
    process_3_title: 'Validation',
    process_3_desc: 'Prototypes physiques envoyés pour approbation. Aucune commande ne part sans votre feu vert.',
    process_4_title: 'Livraison',
    process_4_desc: 'Production et livraison directement dans votre établissement, dans les délais convenus.',
    cta_headline: 'Prêt à sublimer votre packaging ?',
    cta_button: 'Demander un devis',
    marquee_items: ['STUDIO ZEROQUATRE', 'PACKAGING SUR MESURE', 'BOÎTES PIZZA', 'SACS KRAFT', 'BARQUETTES', 'GOBELETS', 'BRUXELLES'],
  },
  en: {
    nav_realisations: 'Projects',
    nav_processus: 'Process',
    nav_devis: 'Quote',
    nav_portal: 'Client portal',
    hero_eyebrow: 'Packaging studio · Brussels',
    hero_slogan: 'Every box tells your story.',
    volta_eyebrow: 'Project',
    volta_headline: 'Volta Supper Club',
    volta_desc: 'Complete packaging for a demanding Brussels restaurant — kraft pizza boxes, custom bags and illustrated trays that extend the experience beyond the table.',
    process_title: 'Our process',
    process_1_title: 'Brief',
    process_1_desc: 'You share your universe, constraints and volume. We listen before proposing.',
    process_2_title: 'Design',
    process_2_desc: 'Our designers create packaging that respects your identity and stands out on the counter.',
    process_3_title: 'Validation',
    process_3_desc: 'Physical prototypes sent for approval. No order ships without your sign-off.',
    process_4_title: 'Delivery',
    process_4_desc: 'Production and delivery directly to your establishment, within the agreed timelines.',
    cta_headline: 'Ready to elevate your packaging?',
    cta_button: 'Request a quote',
    marquee_items: ['STUDIO ZEROQUATRE', 'CUSTOM PACKAGING', 'PIZZA BOXES', 'KRAFT BAGS', 'TRAYS', 'CUPS', 'BRUSSELS'],
  },
}

export function applyLang(lang) {
  if (typeof document === 'undefined') return
  document.documentElement.lang = lang
  document.querySelectorAll('[data-fr][data-en]').forEach((el) => {
    el.textContent = el.dataset[lang]
  })
  document.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }))
}
