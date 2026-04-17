import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOrgId } from '@/lib/supabase/get-org-id'
import { getOrgUsage } from '@/lib/billing'
import { BILLING_TIERS } from '@/lib/stripe'
import { BillingActions } from '@/components/dashboard/BillingActions'

export const dynamic = 'force-dynamic'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatDollars(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

export default async function BillingPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const orgId = await getOrgId()
  if (!orgId) redirect('/login')

  const usage = await getOrgUsage(orgId)

  const pct = Math.min((usage.minutesUsed / usage.minutesIncluded) * 100, 100)
  const isOver = usage.overageMinutes > 0
  const isNearLimit = !isOver && pct >= 80
  const overageCost = (usage.overageMinutes * usage.overageRateCents) / 100

  return (
    <div className="p-8 space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Billing</h1>
        <p className="text-sm text-muted mt-1">
          Manage your plan and track AI interview minutes.
        </p>
      </div>

      {/* Current plan */}
      <section className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Current Plan</h2>
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-accent-bg text-accent">
            {usage.planLabel}
          </span>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-border">
          <div>
            <p className="text-sm font-medium text-foreground">Monthly fee</p>
            <p className="text-xs text-muted">Billed on the {formatDate(usage.periodStart)} each month</p>
          </div>
          <span className="text-sm font-semibold text-foreground">
            ${usage.priceMonthly}/mo
          </span>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-border">
          <div>
            <p className="text-sm font-medium text-foreground">Included minutes</p>
            <p className="text-xs text-muted">Resets {formatDate(usage.periodEnd)}</p>
          </div>
          <span className="text-sm font-semibold text-foreground">
            {usage.minutesIncluded} min/mo
          </span>
        </div>

        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-medium text-foreground">Overage rate</p>
            <p className="text-xs text-muted">Per additional minute after included allowance</p>
          </div>
          <span className="text-sm font-semibold text-foreground">
            {formatDollars(usage.overageRateCents)}/min
          </span>
        </div>
      </section>

      {/* Usage meter */}
      <section className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Usage This Period</h2>
          <span className="text-xs text-muted">
            {formatDate(usage.periodStart)} – {formatDate(usage.periodEnd)}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-foreground">
              {usage.minutesUsed} of {usage.minutesIncluded} minutes used
            </span>
            <span className={isOver ? 'text-red-500 font-semibold' : isNearLimit ? 'text-warning font-medium' : 'text-muted'}>
              {pct.toFixed(0)}%
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-border overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                isOver ? 'bg-red-500' : isNearLimit ? 'bg-warning' : 'bg-accent'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-muted">
            {usage.minutesIncluded - usage.minutesUsed > 0
              ? `${usage.minutesIncluded - usage.minutesUsed} minutes remaining`
              : 'Included minutes exhausted'}
          </p>
        </div>

        {isOver && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-semibold text-red-700">
              {usage.overageMinutes} overage {usage.overageMinutes === 1 ? 'minute' : 'minutes'}
            </p>
            <p className="text-xs text-red-600 mt-0.5">
              Estimated overage charge: <strong>${overageCost.toFixed(2)}</strong> at{' '}
              {formatDollars(usage.overageRateCents)}/min. This will be added to your next invoice.
            </p>
          </div>
        )}

        {isNearLimit && !isOver && (
          <div className="rounded-lg border border-warning bg-warning-bg px-4 py-3">
            <p className="text-sm font-medium text-warning">
              You've used {pct.toFixed(0)}% of your included minutes.
            </p>
            <p className="text-xs text-warning mt-0.5">
              Consider upgrading to avoid overage charges.
            </p>
          </div>
        )}
      </section>

      {/* Actions */}
      <BillingActions
        hasSubscription={!!usage.stripeSubscriptionId}
        currentPlan={usage.planLabel}
      />

      {/* Available plans */}
      <section className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Available Plans</h2>
        <div className="grid gap-3">
          {(Object.entries(BILLING_TIERS) as [string, typeof BILLING_TIERS[keyof typeof BILLING_TIERS]][]).map(([key, tier]) => {
            const isActive = tier.label === usage.planLabel
            return (
              <div
                key={key}
                className={`rounded-lg border p-4 flex items-center justify-between ${
                  isActive ? 'border-accent bg-accent-bg' : 'border-border'
                }`}
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">{tier.label}</p>
                  <p className="text-xs text-muted">
                    {tier.minutesIncluded} min/mo · overage at {formatDollars(tier.overageRateCents)}/min
                  </p>
                  <p className="text-xs text-muted">
                    ${tier.setupFee} one-time setup
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">${tier.priceMonthly}/mo</p>
                  {isActive && (
                    <span className="text-xs text-accent font-medium">Current plan</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
