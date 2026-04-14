import { createClient } from '@/lib/supabase/server'
import { getOrgId } from '@/lib/supabase/get-org-id'
import { NextRequest } from 'next/server'

const VALID_STATUSES = ['pending_review', 'reviewed', 'shortlisted', 'rejected', 'hired']

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = await getOrgId()
  if (!orgId) return Response.json({ error: 'No organization found' }, { status: 403 })

  // Check role — only admin/recruiter can update pipeline
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role === 'viewer') {
    return Response.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  let body: { pipeline_status?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.pipeline_status || !VALID_STATUSES.includes(body.pipeline_status)) {
    return Response.json({ error: 'Invalid pipeline_status' }, { status: 400 })
  }

  const updateData: Record<string, unknown> = {
    pipeline_status: body.pipeline_status,
    updated_at: new Date().toISOString(),
  }

  // Mark reviewed_at when first reviewed
  if (body.pipeline_status !== 'pending_review') {
    updateData.reviewed_at = new Date().toISOString()
    updateData.reviewed_by = user.id
  }

  const { error } = await supabase
    .from('interviews')
    .update(updateData)
    .eq('id', params.id)
    .eq('organization_id', orgId)

  if (error) {
    console.error('[pipeline] Update error:', error.message)
    return Response.json({ error: 'Failed to update pipeline status' }, { status: 500 })
  }

  return Response.json({ ok: true, pipeline_status: body.pipeline_status })
}
