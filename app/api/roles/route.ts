import { createClient } from '@/lib/supabase/server'
import { getOrgId } from '@/lib/supabase/get-org-id'
import { NextRequest } from 'next/server'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = await getOrgId()
  if (!orgId) return Response.json({ error: 'No organization found' }, { status: 403 })

  const { data: roles, error } = await supabase
    .from('roles')
    .select('*')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[roles GET] error:', error.message)
    return Response.json({ error: 'Failed to fetch roles' }, { status: 500 })
  }

  return Response.json({ roles: roles ?? [] })
}

export async function POST(request: NextRequest) {
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
  }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.title?.trim()) {
    return Response.json({ error: 'title is required' }, { status: 400 })
  }

  const { data: role, error } = await supabase
    .from('roles')
    .insert({
      organization_id: orgId,
      title: body.title.trim(),
      description: body.description?.trim() || null,
      pay_range: body.pay_range?.trim() || null,
      shift: body.shift?.trim() || null,
      venue_type: body.venue_type?.trim() || null,
      behavioral_questions: body.behavioral_questions ?? [],
      must_haves: body.must_haves ?? [],
      certifications_preferred: body.certifications_preferred ?? [],
    })
    .select()
    .single()

  if (error) {
    console.error('[roles POST] error:', error.message)
    return Response.json({ error: 'Failed to create role' }, { status: 500 })
  }

  return Response.json({ role }, { status: 201 })
}
