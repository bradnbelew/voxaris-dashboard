import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getOrgId } from '@/lib/supabase/get-org-id'
import { stripe, BILLING_TIERS, PlanKey } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = await getOrgId()
  if (!orgId) return NextResponse.json({ error: 'No organization' }, { status: 400 })

  const { plan } = await req.json() as { plan: PlanKey }
  const tier = BILLING_TIERS[plan]
  if (!tier) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

  const admin = createAdminClient()
  const { data: org } = await admin
    .from('organizations')
    .select('name, stripe_customer_id')
    .eq('id', orgId)
    .single()

  if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: org.stripe_customer_id ?? undefined,
    customer_email: org.stripe_customer_id ? undefined : user.email,
    line_items: [
      { price: tier.flatPriceId, quantity: 1 },
      { price: tier.overagePriceId },
    ],
    metadata: {
      org_id: orgId,
      plan,
    },
    subscription_data: {
      metadata: { org_id: orgId, plan },
    },
    success_url: `${baseUrl}/dashboard/billing?success=1`,
    cancel_url: `${baseUrl}/dashboard/billing?canceled=1`,
  })

  return NextResponse.json({ url: session.url })
}
