// Client-safe tier definitions — no Stripe SDK import
// Used by both server routes (via lib/stripe.ts) and client components

export const BILLING_TIERS = {
  go: {
    label: 'Go',
    priceMonthly: 289,
    setupFee: 249,
    minutesIncluded: 250,
    overageRateCents: 150,
  },
  grow: {
    label: 'Grow',
    priceMonthly: 769,
    setupFee: 499,
    minutesIncluded: 750,
    overageRateCents: 125,
  },
  scale: {
    label: 'Scale',
    priceMonthly: 1499,
    setupFee: 749,
    minutesIncluded: 1500,
    overageRateCents: 100,
  },
  pro: {
    label: 'Pro',
    priceMonthly: 2399,
    setupFee: 999,
    minutesIncluded: 2500,
    overageRateCents: 80,
  },
  enterprise: {
    label: 'Enterprise',
    priceMonthly: 3259,
    setupFee: 1499,
    minutesIncluded: 3500,
    overageRateCents: 70,
  },
} as const

export type PlanKey = keyof typeof BILLING_TIERS

export function getTier(plan: string) {
  return BILLING_TIERS[plan as PlanKey] ?? BILLING_TIERS.go
}
