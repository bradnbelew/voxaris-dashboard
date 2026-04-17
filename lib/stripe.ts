import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
})

// ─── Tier definitions ────────────────────────────────────────────────
// Prices are set up in the Stripe dashboard. Each plan has:
//   - flatPriceId: the recurring flat-fee price
//   - overagePriceId: the metered per-minute overage price
// Overage is only charged for minutes ABOVE minutesIncluded.

export const BILLING_TIERS = {
  starter: {
    label: 'Starter',
    priceMonthly: 49,
    minutesIncluded: 100,
    overageRateCents: 25, // $0.25 per extra minute
    flatPriceId: process.env.STRIPE_PRICE_STARTER_FLAT!,
    overagePriceId: process.env.STRIPE_PRICE_STARTER_OVERAGE!,
  },
  growth: {
    label: 'Pro',
    priceMonthly: 149,
    minutesIncluded: 400,
    overageRateCents: 20, // $0.20 per extra minute
    flatPriceId: process.env.STRIPE_PRICE_GROWTH_FLAT!,
    overagePriceId: process.env.STRIPE_PRICE_GROWTH_OVERAGE!,
  },
  enterprise: {
    label: 'Enterprise',
    priceMonthly: 399,
    minutesIncluded: 1200,
    overageRateCents: 15, // $0.15 per extra minute
    flatPriceId: process.env.STRIPE_PRICE_ENTERPRISE_FLAT!,
    overagePriceId: process.env.STRIPE_PRICE_ENTERPRISE_OVERAGE!,
  },
} as const

export type PlanKey = keyof typeof BILLING_TIERS

export function getTier(plan: string) {
  return BILLING_TIERS[plan as PlanKey] ?? BILLING_TIERS.starter
}
