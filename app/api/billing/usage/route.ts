import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOrgId } from '@/lib/supabase/get-org-id'
import { getOrgUsage } from '@/lib/billing'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = await getOrgId()
  if (!orgId) return NextResponse.json({ error: 'No organization' }, { status: 400 })

  const usage = await getOrgUsage(orgId)
  return NextResponse.json(usage)
}
