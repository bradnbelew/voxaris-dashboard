import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
})

// ─── Tier definitions ────────────────────────────────────────────────
// Prices are set up in the Stripe dashboard. Each plan has:
//   - flatPriceId: the recurring flat-fee price
//   - overagePriceId: the metered per-minute overage price (linked to Billing Meter)
//   - setupFeeId: one-time price charged at checkout alongside the subscription
// Overage is only charged for minutes ABOVE minutesIncluded.

export const BILLING_TIERS = {
  go: {
    label: 'Go',
    priceMonthly: 289,
    setupFee: 249,
    minutesIncluded: 250,
    overageRateCents: 150, // $1.50 per extra minute
    flatPriceId: process.env.STRIPE_PRICE_GO_FLAT!,
    overagePriceId: process.env.STRIPE_PRICE_GO_OVERAGE!,
    setupFeeId: process.env.STRIPE_PRICE_GO_SETUP!,
  },
  grow: {
    label: 'Grow',
    priceMonthly: 769,
    setupFee: 499,
    minutesIncluded: 750,
    overageRateCents: 125, // $1.25 per extra minute
    flatPriceId: process.env.STRIPE_PRICE_GROW_FLAT!,
    overagePriceId: process.env.STRIPE_PRICE_GROW_OVERAGE!,
    setupFeeId: process.env.STRIPE_PRICE_GROW_SETUP!,
  },
  scale: {
    label: 'Scale',
    priceMonthly: 1499,
    setupFee: 749,
    minutesIncluded: 1500,
    overageRateCents: 100, // $1.00 per extra minute
    flatPriceId: process.env.STRIPE_PRICE_SCALE_FLAT!,
    overagePriceId: process.env.STRIPE_PRICE_SCALE_OVERAGE!,
    setupFeeId: process.env.STRIPE_PRICE_SCALE_SETUP!,
  },
  pro: {
    label: 'Pro',
    priceMonthly: 2399,
    setupFee: 999,
    minutesIncluded: 2500,
    overageRateCents: 80, // $0.80 per extra minute
    flatPriceId: process.env.STRIPE_PRICE_PRO_FLAT!,
    overagePriceId: process.env.STRIPE_PRICE_PRO_OVERAGE!,
    setupFeeId: process.env.STRIPE_PRICE_PRO_SETUP!,
  },
  enterprise: {
    label: 'Enterprise',
    priceMonthly: 3259,
    setupFee: 1499,
    minutesIncluded: 3500,
    overageRateCents: 70, // $0.70 per extra minute
    flatPriceId: process.env.STRIPE_PRICE_ENTERPRISE_FLAT!,
    overagePriceId: process.env.STRIPE_PRICE_ENTERPRISE_OVERAGE!,
    setupFeeId: process.env.STRIPE_PRICE_ENTERPRISE_SETUP!,
  },
} as const

export type PlanKey = keyof typeof BILLING_TIERS

export function getTier(plan: string) {
  return BILLING_TIERS[plan as PlanKey] ?? BILLING_TIERS.go
}
