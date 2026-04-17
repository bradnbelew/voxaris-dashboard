import { createAdminClient } from '@/lib/supabase/admin'
import { getTier } from '@/lib/stripe'

export interface UsageResult {
  minutesUsed: number
  minutesIncluded: number
  overageMinutes: number
  periodStart: string
  periodEnd: string // approximate — Stripe controls the true end
  planLabel: string
  priceMonthly: number
  overageRateCents: number
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
}

/**
 * Calculates minutes used for an org in the current billing period.
 * The billing period start is stored on the org as billing_cycle_start.
 * If not set, falls back to the 1st of the current month (UTC).
 */
export async function getOrgUsage(orgId: string): Promise<UsageResult> {
  const supabase = createAdminClient()

  const { data: org, error } = await supabase
    .from('organizations')
    .select(
      'plan, monthly_minute_limit, billing_cycle_start, stripe_customer_id, stripe_subscription_id'
    )
    .eq('id', orgId)
    .single()

  if (error || !org) throw new Error('Organization not found')

  const tier = getTier(org.plan)

  // Determine period start: stored cycle start or first of current month
  const now = new Date()
  const periodStart = org.billing_cycle_start
    ? new Date(org.billing_cycle_start)
    : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))

  // Approximate period end: one month after period start
  const periodEnd = new Date(periodStart)
  periodEnd.setUTCMonth(periodEnd.getUTCMonth() + 1)

  // Sum durations from interviews that ended within this period
  const { data: interviews } = await supabase
    .from('interviews')
    .select('started_at, ended_at')
    .eq('organization_id', orgId)
    .gte('started_at', periodStart.toISOString())
    .lt('started_at', periodEnd.toISOString())
    .not('ended_at', 'is', null)

  const totalSeconds = (interviews ?? []).reduce((sum, row) => {
    const dur =
      (new Date(row.ended_at!).getTime() - new Date(row.started_at).getTime()) / 1000
    return sum + Math.max(dur, 0)
  }, 0)

  const minutesUsed = Math.ceil(totalSeconds / 60)
  const minutesIncluded = org.monthly_minute_limit ?? tier.minutesIncluded
  const overageMinutes = Math.max(minutesUsed - minutesIncluded, 0)

  return {
    minutesUsed,
    minutesIncluded,
    overageMinutes,
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    planLabel: tier.label,
    priceMonthly: tier.priceMonthly,
    overageRateCents: tier.overageRateCents,
    stripeCustomerId: org.stripe_customer_id ?? null,
    stripeSubscriptionId: org.stripe_subscription_id ?? null,
  }
}
