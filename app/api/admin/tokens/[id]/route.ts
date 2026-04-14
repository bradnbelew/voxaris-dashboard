import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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

  let body: { active?: boolean }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (typeof body.active !== 'boolean') {
    return Response.json({ error: 'active (boolean) is required' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('client_tokens')
    .update({ active: body.active })
    .eq('id', params.id)

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ ok: true, active: body.active })
}
