import { createClient } from '@/lib/supabase/server'
import { getOrgId } from '@/lib/supabase/get-org-id'
import { NextRequest } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = await getOrgId()
  if (!orgId) return Response.json({ error: 'No organization found' }, { status: 403 })

  let body: {
    title?: string
    description?: string
    pay_range?: string
    shift?: string
    venue_type?: string
    behavioral_questions?: string[]
    must_haves?: string[]
    certifications_preferred?: string[]
    active?: boolean
  }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const ALLOWED = ['title', 'description', 'pay_range', 'shift', 'venue_type',
    'behavioral_questions', 'must_haves', 'certifications_preferred', 'active']

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of ALLOWED) {
    if (key in body) update[key] = (body as Record<string, unknown>)[key]
  }

  const { data: role, error } = await supabase
    .from('roles')
    .update(update)
    .eq('id', params.id)
    .eq('organization_id', orgId)
    .select()
    .single()

  if (error) {
    console.error('[roles PATCH] error:', error.message)
    return Response.json({ error: 'Failed to update role' }, { status: 500 })
  }

  return Response.json({ role })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = await getOrgId()
  if (!orgId) return Response.json({ error: 'No organization found' }, { status: 403 })

  // Soft delete — set active = false
  const { error } = await supabase
    .from('roles')
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('organization_id', orgId)

  if (error) {
    console.error('[roles DELETE] error:', error.message)
    return Response.json({ error: 'Failed to deactivate role' }, { status: 500 })
  }

  return Response.json({ ok: true })
}
