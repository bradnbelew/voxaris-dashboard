import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { stripe, getTier } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { getOrgUsage } from '@/lib/billing'

export const dynamic = 'force-dynamic'

// Stripe requires the raw body for signature verification
export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = headers().get('stripe-signature')

  if (!sig) return NextResponse.json({ error: 'No signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    return NextResponse.json({ error: `Webhook signature invalid: ${err}` }, { status: 400 })
  }

  const admin = createAdminClient()

  switch (event.type) {
    // ── Customer subscribed ───────────────────────────────────────────
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode !== 'subscription') break

      const orgId = session.metadata?.org_id
      const plan = session.metadata?.plan
      if (!orgId || !plan) break

      const subscription = await stripe.subscriptions.retrieve(session.subscription as string, {
        expand: ['items.data.price'],
      })

      const tier = getTier(plan)
      // In Stripe v22, period is on subscription items, not the subscription itself
      const periodStart = subscription.items.data[0]?.current_period_start

      await admin
        .from('organizations')
        .update({
          plan,
          monthly_minute_limit: tier.minutesIncluded,
          stripe_customer_id: subscription.customer as string,
          stripe_subscription_id: subscription.id,
          billing_cycle_start: periodStart
            ? new Date(periodStart * 1000).toISOString()
            : new Date().toISOString(),
        })
        .eq('id', orgId)
      break
    }

    // ── Subscription updated (plan change, renewal) ───────────────────
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const orgId = sub.metadata?.org_id
      if (!orgId) break

      const plan = sub.metadata?.plan ?? 'starter'
      const tier = getTier(plan)
      const periodStart = sub.items.data[0]?.current_period_start

      await admin
        .from('organizations')
        .update({
          plan,
          monthly_minute_limit: tier.minutesIncluded,
          billing_cycle_start: periodStart
            ? new Date(periodStart * 1000).toISOString()
            : null,
        })
        .eq('stripe_subscription_id', sub.id)
      break
    }

    // ── Subscription cancelled ────────────────────────────────────────
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await admin
        .from('organizations')
        .update({
          plan: 'starter',
          monthly_minute_limit: 100,
          stripe_subscription_id: null,
          billing_cycle_start: null,
        })
        .eq('stripe_subscription_id', sub.id)
      break
    }

    // ── Invoice created — report metered overage before it finalizes ──
    // Stripe fires this ~1 hour before the invoice is finalized.
    // In v22, invoice.subscription is accessed via invoice.parent.subscription_details.subscription
    case 'invoice.created': {
      const invoice = event.data.object as Stripe.Invoice

      // Extract subscription ID from the v22 parent structure
      const subDetails = invoice.parent?.subscription_details
      if (!subDetails?.subscription) break
      const subscriptionId =
        typeof subDetails.subscription === 'string'
          ? subDetails.subscription
          : subDetails.subscription.id

      const { data: org } = await admin
        .from('organizations')
        .select('id, stripe_customer_id')
        .eq('stripe_subscription_id', subscriptionId)
        .single()

      if (!org?.stripe_customer_id) break

      const usage = await getOrgUsage(org.id)
      if (usage.overageMinutes <= 0) break

      // Report overage via Stripe Billing Meters (v22 API)
      // Requires a Meter configured in Stripe dashboard with:
      //   event_name: STRIPE_METER_EVENT_NAME (e.g., 'voxaris_interview_minutes')
      //   customer_mapping.event_payload_key: 'stripe_customer_id'
      //   value_settings.event_payload_key: 'value'
      await stripe.billing.meterEvents.create({
        event_name: process.env.STRIPE_METER_EVENT_NAME!,
        payload: {
          stripe_customer_id: org.stripe_customer_id,
          value: String(usage.overageMinutes),
        },
      })
      break
    }
  }

  return NextResponse.json({ received: true })
}
