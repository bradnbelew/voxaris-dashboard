import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createClient } from '@/lib/supabase/server'
import { getOrgId } from '@/lib/supabase/get-org-id'
import { NextRequest } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = await getOrgId()
  if (!orgId) return Response.json({ error: 'No organization found for user' }, { status: 403 })

  const { data: interview, error } = await supabase
    .from('interviews')
    .select('recording_url, recording_s3_key, organization_id')
    .eq('id', params.id)
    .eq('organization_id', orgId)
    .single()

  if (error || !interview) {
    return Response.json({ error: 'Interview not found' }, { status: 404 })
  }

  if (!interview.recording_url && !interview.recording_s3_key) {
    return Response.json({ error: 'No recording available' }, { status: 404 })
  }

  // If we have an S3 key, generate a signed URL
  if (interview.recording_s3_key) {
    const s3 = new S3Client({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    })

    const url = await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: process.env.AWS_S3_RECORDING_BUCKET!,
        Key: interview.recording_s3_key,
      }),
      { expiresIn: 3600 } // 1 hour
    )

    return Response.json({ url })
  }

  // Fallback: use the direct URL if no S3 key
  return Response.json({ url: interview.recording_url })
}
