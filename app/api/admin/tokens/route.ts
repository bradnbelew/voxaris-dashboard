import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { randomBytes } from 'crypto'

async function isSuperAdmin(): Promise<boolean> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'super_admin'
}

export async function POST(request: NextRequest) {
  if (!(await isSuperAdmin())) return Response.json({ error: 'Forbidden' }, { status: 403 })

  let body: { organization_id?: string }
  try { body = await request.json() }
  catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  if (!body.organization_id) return Response.json({ error: 'organization_id required' }, { status: 400 })

  const admin = createAdminClient()
  const token = 'tk_' + randomBytes(16).toString('hex')
  const { data, error } = await admin
    .from('client_tokens')
    .insert({ token, organization_id: body.organization_id, active: true })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true, token: data }, { status: 201 })
}
