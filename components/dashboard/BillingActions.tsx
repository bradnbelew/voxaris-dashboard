'use client'

import { useState } from 'react'
import { BILLING_TIERS, PlanKey } from '@/lib/stripe'

interface BillingActionsProps {
  hasSubscription: boolean
  currentPlan: string
}

export function BillingActions({ hasSubscription, currentPlan }: BillingActionsProps) {
  const [loading, setLoading] = useState(false)

  async function openPortal() {
    setLoading(true)
    const res = await fetch('/api/billing/portal', { method: 'POST' })
    const { url, error } = await res.json()
    if (error) { alert(error); setLoading(false); return }
    window.location.href = url
  }

  async function startCheckout(plan: PlanKey) {
    setLoading(true)
    const res = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    })
    const { url, error } = await res.json()
    if (error) { alert(error); setLoading(false); return }
    window.location.href = url
  }

  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
      <h2 className="text-sm font-semibold text-foreground">Manage Subscription</h2>
      <div className="flex flex-wrap gap-3">
        {hasSubscription ? (
          <button
            onClick={openPortal}
            disabled={loading}
            className="rounded-lg bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading…' : 'Manage Billing →'}
          </button>
        ) : (
          <>
            {(Object.entries(BILLING_TIERS) as [PlanKey, typeof BILLING_TIERS[PlanKey]][]).map(
              ([key, tier]) => {
                const isActive = tier.label === currentPlan
                return (
                  <button
                    key={key}
                    onClick={() => startCheckout(key)}
                    disabled={loading || isActive}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                      isActive
                        ? 'bg-border text-muted cursor-default'
                        : 'bg-accent text-white hover:bg-accent/90'
                    }`}
                  >
                    {isActive ? `${tier.label} (Current)` : `Subscribe to ${tier.label}`}
                  </button>
                )
              }
            )}
          </>
        )}
      </div>
      <p className="text-xs text-muted">
        Payment is securely processed by Stripe. You can update your payment method or cancel anytime.
      </p>
    </section>
  )
}
