import { createClient } from '@/lib/supabase/server'
import { getOrgId } from '@/lib/supabase/get-org-id'
import { NextRequest } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = await getOrgId()
  if (!orgId) return Response.json({ error: 'No organization found' }, { status: 403 })

  let body: { content?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.content?.trim()) {
    return Response.json({ error: 'Content is required' }, { status: 400 })
  }

  // Verify the interview belongs to this org
  const { data: interview } = await supabase
    .from('interviews')
    .select('id')
    .eq('id', params.id)
    .eq('organization_id', orgId)
    .single()

  if (!interview) {
    return Response.json({ error: 'Interview not found' }, { status: 404 })
  }

  const { data: note, error } = await supabase
    .from('interview_notes')
    .insert({
      interview_id: params.id,
      organization_id: orgId,
      author_id: user.id,
      content: body.content.trim(),
    })
    .select('*, author:profiles(full_name, role)')
    .single()

  if (error) {
    console.error('[notes] Insert error:', error.message)
    return Response.json({ error: 'Failed to save note' }, { status: 500 })
  }

  return Response.json(note)
}
