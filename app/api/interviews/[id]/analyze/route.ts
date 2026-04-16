import { createClient } from '@/lib/supabase/server'
import { getOrgId } from '@/lib/supabase/get-org-id'
import { generateInterviewSummary } from '@/lib/ai-summary'
import { NextRequest } from 'next/server'

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = await getOrgId()
  if (!orgId) return Response.json({ error: 'No organization found' }, { status: 403 })

  // Check role — only admin/recruiter can trigger re-analysis
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role === 'viewer') {
    return Response.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  // Fetch interview (scoped to org)
  const { data: interview, error } = await supabase
    .from('interviews')
    .select('*, candidate:candidates(*)')
    .eq('id', params.id)
    .eq('organization_id', orgId)
    .single()

  if (error || !interview) {
    return Response.json({ error: 'Interview not found' }, { status: 404 })
  }

  const candidate = interview.candidate as Record<string, unknown> | null

  const result = await generateInterviewSummary({
    applied_role: interview.applied_role,
    transcript: interview.transcript,
    perception_analysis: interview.perception_analysis,
    perception_signals: interview.perception_signals || [],
    work_authorized: interview.work_authorized,
    years_experience: interview.years_experience,
    certifications: interview.certifications,
    available_evenings: interview.available_evenings,
    available_weekends: interview.available_weekends,
    disqualified: interview.disqualified,
    disqualification_reason: interview.disqualification_reason,
    resume_text: candidate?.resume_text as string | null | undefined,
  })

  if (!result) {
    return Response.json({ error: 'AI summary generation failed. Check ANTHROPIC_API_KEY.' }, { status: 500 })
  }

  const { error: updateError } = await supabase
    .from('interviews')
    .update({
      ai_summary: result.summary,
      ai_strengths: result.strengths,
      ai_concerns: result.concerns,
      ai_fit_score: result.fit_score,
      ai_recommendation: result.recommendation,
      transcript_summary: result.transcript_summary,
    })
    .eq('id', params.id)

  if (updateError) {
    console.error('[analyze] Failed to save AI summary:', updateError)
    return Response.json({ error: 'Failed to save results' }, { status: 500 })
  }

  return Response.json({ success: true })
}
