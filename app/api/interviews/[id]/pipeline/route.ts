import { createClient } from '@/lib/supabase/server'
import { getOrgId } from '@/lib/supabase/get-org-id'
import { sendCandidateShortlistedEmail, sendCandidateRejectedEmail } from '@/lib/email'
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

  // Fetch current interview state + candidate + org name before updating
  const { data: existing } = await supabase
    .from('interviews')
    .select(`
      pipeline_status, applied_role,
      candidate:candidates(full_name, email)
    `)
    .eq('id', params.id)
    .eq('organization_id', orgId)
    .single()

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

  // Send candidate notification emails (only when status actually changes)
  const newStatus = body.pipeline_status
  const prevStatus = existing?.pipeline_status

  if (existing && newStatus !== prevStatus && (newStatus === 'shortlisted' || newStatus === 'rejected')) {
    const candidateArr = existing.candidate as { full_name: string; email: string | null }[] | null
    const candidate = Array.isArray(candidateArr) ? candidateArr[0] ?? null : (candidateArr as unknown as { full_name: string; email: string | null } | null)
    const candidateEmail = candidate?.email
    const candidateName = candidate?.full_name || 'Candidate'
    const role = existing.applied_role
      ? existing.applied_role.charAt(0).toUpperCase() + existing.applied_role.slice(1).replace(/_/g, ' ')
      : 'the position'

    // Fetch org name separately
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', orgId)
      .single()

    const orgName = org?.name || 'the organization'

    if (candidateEmail) {
      try {
        if (newStatus === 'shortlisted') {
          await sendCandidateShortlistedEmail({ candidateEmail, candidateName, role, orgName })
        } else {
          await sendCandidateRejectedEmail({ candidateEmail, candidateName, role, orgName })
        }
      } catch (err) {
        console.error('[pipeline] Candidate email send failed:', err)
      }
    }
  }

  return Response.json({ ok: true, pipeline_status: body.pipeline_status })
}
