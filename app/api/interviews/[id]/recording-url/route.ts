import { createClient } from '@/lib/supabase/server'
import { getOrgId } from '@/lib/supabase/get-org-id'
import { NextRequest } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get the user's org and validate the interview belongs to it
  const orgId = await getOrgId()
  if (!orgId) {
    return Response.json({ error: 'No organization found for user' }, { status: 403 })
  }

  const { data: interview, error } = await supabase
    .from('interviews')
    .select('recording_url, recording_s3_key, organization_id')
    .eq('id', params.id)
    .eq('organization_id', orgId) // ensures user can only access their org's recordings
    .single()

  if (error || !interview) {
    return Response.json({ error: 'Interview not found' }, { status: 404 })
  }

  if (!interview.recording_url && !interview.recording_s3_key) {
    return Response.json({ error: 'No recording available' }, { status: 404 })
  }

  if (interview.recording_url) {
    return Response.json({ url: interview.recording_url })
  }

  return Response.json({
    error: 'S3 signed URL generation requires AWS SDK configuration',
  }, { status: 501 })
}
