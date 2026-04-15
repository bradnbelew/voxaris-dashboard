import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest } from 'next/server'

async function isSuperAdmin(): Promise<boolean> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  return profile?.role === 'super_admin'
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isSuperAdmin())) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: {
    company_name?: string
    logo_url?: string
    primary_color?: string
    notification_email?: string
  }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const ALLOWED = ['company_name', 'logo_url', 'primary_color', 'notification_email']
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of ALLOWED) {
    if (key in body) update[key] = (body as Record<string, unknown>)[key]
  }

  if (Object.keys(update).length === 1) {
    return Response.json({ error: 'No valid fields provided' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: org, error } = await admin
    .from('organizations')
    .update(update)
    .eq('id', params.id)
    .select()
    .single()

  if (error) {
    console.error('[brand PATCH] error:', error.message)
    return Response.json({ error: 'Failed to update brand settings' }, { status: 500 })
  }

  return Response.json({ ok: true, org })
}
