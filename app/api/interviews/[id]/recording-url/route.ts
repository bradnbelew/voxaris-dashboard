import { createClient } from '@/lib/supabase/server'
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

  const { data: interview, error } = await supabase
    .from('interviews')
    .select('recording_url, recording_s3_key')
    .eq('id', params.id)
    .single()

  if (error || !interview) {
    return Response.json({ error: 'Interview not found' }, { status: 404 })
  }

  if (!interview.recording_url && !interview.recording_s3_key) {
    return Response.json({ error: 'No recording available' }, { status: 404 })
  }

  // If we have a direct recording URL, return it
  // In production, you'd generate a signed S3 URL here using AWS SDK
  if (interview.recording_url) {
    return Response.json({ url: interview.recording_url })
  }

  // Generate signed S3 URL if only s3_key is available
  // This requires AWS SDK v3:
  //   import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
  //   import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
  //
  //   const s3 = new S3Client({ region: process.env.AWS_REGION })
  //   const command = new GetObjectCommand({
  //     Bucket: process.env.AWS_S3_RECORDING_BUCKET,
  //     Key: interview.recording_s3_key,
  //   })
  //   const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 })

  return Response.json({
    error: 'S3 signed URL generation requires AWS SDK configuration',
  }, { status: 501 })
}
