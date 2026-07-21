import Stripe from 'stripe'

// Lazy singleton so a missing key never breaks the build — only fails when
// a Stripe route is actually hit without STRIPE_SECRET_KEY set.
let stripe = null

export function getStripe() {
  if (!stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error('STRIPE_SECRET_KEY manquant')
    stripe = new Stripe(key)
  }
  return stripe
}
