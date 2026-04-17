import Stripe from 'stripe'
import { BILLING_TIERS, getTier } from './billing-tiers'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
})

// Re-export tier data for server-side use
export { BILLING_TIERS, getTier }
export type { PlanKey } from './billing-tiers'

// ─── Price IDs (server-only, never sent to client) ───────────────────
export const TIER_PRICE_IDS = {
  go: {
    flatPriceId: process.env.STRIPE_PRICE_GO_FLAT!,
    overagePriceId: process.env.STRIPE_PRICE_GO_OVERAGE!,
    setupFeeId: process.env.STRIPE_PRICE_GO_SETUP!,
  },
  grow: {
    flatPriceId: process.env.STRIPE_PRICE_GROW_FLAT!,
    overagePriceId: process.env.STRIPE_PRICE_GROW_OVERAGE!,
    setupFeeId: process.env.STRIPE_PRICE_GROW_SETUP!,
  },
  scale: {
    flatPriceId: process.env.STRIPE_PRICE_SCALE_FLAT!,
    overagePriceId: process.env.STRIPE_PRICE_SCALE_OVERAGE!,
    setupFeeId: process.env.STRIPE_PRICE_SCALE_SETUP!,
  },
  pro: {
    flatPriceId: process.env.STRIPE_PRICE_PRO_FLAT!,
    overagePriceId: process.env.STRIPE_PRICE_PRO_OVERAGE!,
    setupFeeId: process.env.STRIPE_PRICE_PRO_SETUP!,
  },
  enterprise: {
    flatPriceId: process.env.STRIPE_PRICE_ENTERPRISE_FLAT!,
    overagePriceId: process.env.STRIPE_PRICE_ENTERPRISE_OVERAGE!,
    setupFeeId: process.env.STRIPE_PRICE_ENTERPRISE_SETUP!,
  },
} as const
