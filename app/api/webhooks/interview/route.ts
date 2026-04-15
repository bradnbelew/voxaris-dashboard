import { createAdminClient } from '@/lib/supabase/admin'
import { generateInterviewSummary } from '@/lib/ai-summary'
import { sendNewApplicantEmail } from '@/lib/email'
import { headers } from 'next/headers'

const supabaseAdmin = createAdminClient()

export async function POST(request: Request) {
  const headersList = headers()
  const webhookSecret = headersList.get('x-webhook-secret')
  if (webhookSecret !== process.env.VOXARIS_WEBHOOK_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let payload: {
    organization_id?: string
    conversation_id?: string
    event_type?: string
    data?: Record<string, unknown>
  }

  try {
    payload = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { organization_id, conversation_id, event_type, data } = payload

  if (!organization_id || !conversation_id) {
    return Response.json({ error: 'Missing required fields: organization_id, conversation_id' }, { status: 400 })
  }

  try {
    switch (event_type) {
      case 'interview_started':
        await handleInterviewStarted(organization_id, conversation_id, data || {})
        break
      case 'objective_completed':
        await handleObjectiveCompleted(conversation_id, data || {})
        break
      case 'conversation_ended':
        await handleConversationEnded(conversation_id, data || {})
        break
      case 'transcript_ready':
        await handleTranscriptReady(conversation_id, data || {})
        break
      case 'recording_ready':
        await handleRecordingReady(conversation_id, data || {})
        break
      case 'perception_ready':
        await handlePerceptionReady(conversation_id, data || {})
        break
      case 'guardrail_triggered':
        await handleGuardrailTriggered(conversation_id, data || {})
        break
      default:
        console.warn(`Unknown event_type: ${event_type}`)
    }
  } catch (err) {
    console.error(`Webhook handler error for ${event_type}:`, err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }

  return Response.json({ ok: true })
}

async function handleInterviewStarted(
  organizationId: string,
  conversationId: string,
  data: Record<string, unknown>
) {
  const candidateData = {
    organization_id: organizationId,
    full_name: (data.candidate_name as string) || (data.full_name as string) || 'Unknown',
    email: (data.candidate_email as string) || (data.email as string) || undefined,
    phone: (data.candidate_phone as string) || (data.phone as string) || undefined,
    resume_text: data.resume_text as string | undefined,
  }

  // Upsert candidate
  const { data: candidate, error: candidateError } = await supabaseAdmin
    .from('candidates')
    .upsert(candidateData, { onConflict: 'organization_id,email' })
    .select('id')
    .single()

  if (candidateError) {
    // If upsert fails (e.g., no email), insert directly
    const { data: newCandidate, error: insertError } = await supabaseAdmin
      .from('candidates')
      .insert(candidateData)
      .select('id')
      .single()

    if (insertError) throw insertError

    await insertInterview(conversationId, organizationId, newCandidate!.id, data)
    return
  }

  await insertInterview(conversationId, organizationId, candidate!.id, data)
}

async function insertInterview(
  conversationId: string,
  organizationId: string,
  candidateId: string,
  data: Record<string, unknown>
) {
  const { error } = await supabaseAdmin.from('interviews').upsert(
    {
      conversation_id: conversationId,
      organization_id: organizationId,
      candidate_id: candidateId,
      applied_role: (data.applied_role as string) || 'general',
      status: 'active',
      consent_given: data.consent_given as boolean | undefined,
      consent_timestamp: data.consent_timestamp as string | undefined,
      years_experience: data.years_experience as string | undefined,
      most_recent_employer: data.most_recent_employer as string | undefined,
      started_at: new Date().toISOString(),
    },
    { onConflict: 'conversation_id' }
  )

  if (error) throw error
}

async function handleObjectiveCompleted(
  conversationId: string,
  data: Record<string, unknown>
) {
  // Fetch current interview to append to objectives_completed
  const { data: existing } = await supabaseAdmin
    .from('interviews')
    .select('objectives_completed')
    .eq('conversation_id', conversationId)
    .single()

  const objectives = existing?.objectives_completed || []
  const objective = data.objective as string
  if (objective && !objectives.includes(objective)) {
    objectives.push(objective)
  }

  const updateData: Record<string, unknown> = {
    objectives_completed: objectives,
    last_objective: objective,
    updated_at: new Date().toISOString(),
  }

  // Merge any screening data that came with this objective
  const screeningFields = [
    'work_authorized', 'venue_type', 'most_recent_employer',
    'years_experience', 'has_certification', 'certifications',
    'available_evenings', 'available_weekends', 'earliest_start_date',
    'confirmed_physical', 'candidate_questions',
    'recruiter_call_scheduled', 'preferred_callback_time',
    'disqualified', 'disqualification_reason',
  ]

  for (const field of screeningFields) {
    if (data[field] !== undefined) {
      updateData[field] = data[field]
    }
  }

  if (data.disqualified) {
    updateData.status = 'disqualified'
  }

  const { error } = await supabaseAdmin
    .from('interviews')
    .update(updateData)
    .eq('conversation_id', conversationId)

  if (error) throw error
}

async function handleConversationEnded(
  conversationId: string,
  data: Record<string, unknown>
) {
  const updateData: Record<string, unknown> = {
    status: (data.status as string) || 'completed',
    completed_at: new Date().toISOString(),
    ended_at: new Date().toISOString(),
    event_log: data.event_log,
  }

  // Merge any final screening data
  const screeningFields = [
    'work_authorized', 'years_experience', 'has_certification',
    'certifications', 'available_evenings', 'available_weekends',
    'earliest_start_date', 'confirmed_physical', 'disqualified',
    'disqualification_reason', 'recruiter_call_scheduled',
    'preferred_callback_time',
  ]

  for (const field of screeningFields) {
    if (data[field] !== undefined) {
      updateData[field] = data[field]
    }
  }

  const { error } = await supabaseAdmin
    .from('interviews')
    .update(updateData)
    .eq('conversation_id', conversationId)

  if (error) throw error

  // Trigger AI summary generation asynchronously
  generateSummaryAsync(conversationId).catch((err) =>
    console.error('Background summary generation failed:', err)
  )
}

async function generateSummaryAsync(conversationId: string) {
  const { data: interview } = await supabaseAdmin
    .from('interviews')
    .select('*, candidate:candidates(*)')
    .eq('conversation_id', conversationId)
    .single()

  if (!interview) return

  const candidate = interview.candidate as Record<string, unknown> | null

  const summary = await generateInterviewSummary({
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

  if (!summary) return

  const { error } = await supabaseAdmin
    .from('interviews')
    .update({
      ai_summary: summary.summary,
      ai_strengths: summary.strengths,
      ai_concerns: summary.concerns,
      ai_fit_score: summary.fit_score,
      ai_recommendation: summary.recommendation,
      transcript_summary: summary.transcript_summary,
    })
    .eq('conversation_id', conversationId)

  if (error) {
    console.error('Failed to save AI summary:', error)
    return
  }

  // Send email notification to all org members (fire-and-forget)
  notifyOrgMembers(interview, candidate, summary).catch((err) =>
    console.error('Email notification failed:', err)
  )
}

async function notifyOrgMembers(
  interview: Record<string, unknown>,
  candidate: Record<string, unknown> | null,
  summary: { summary: string; fit_score: number; recommendation: string }
) {
  // Get all user IDs in this organization
  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('organization_id', interview.organization_id as string)

  if (!profiles?.length) return

  // Fetch email for each user via admin auth API
  const emailResults = await Promise.all(
    profiles.map((p) => supabaseAdmin.auth.admin.getUserById(p.id))
  )

  const emails = emailResults
    .map((r) => r.data?.user?.email)
    .filter((e): e is string => !!e)

  if (!emails.length) return

  await sendNewApplicantEmail(emails, {
    candidateName: (candidate?.full_name as string) || 'Unknown Applicant',
    appliedRole: interview.applied_role as string,
    fitScore: summary.fit_score,
    recommendation: summary.recommendation,
    summaryExcerpt: summary.summary,
    interviewId: interview.id as string,
  })
}

async function handleTranscriptReady(
  conversationId: string,
  data: Record<string, unknown>
) {
  const { error } = await supabaseAdmin
    .from('interviews')
    .update({
      transcript: data.transcript,
    })
    .eq('conversation_id', conversationId)

  if (error) throw error

  // Re-trigger summary if transcript arrived after conversation ended
  const { data: interview } = await supabaseAdmin
    .from('interviews')
    .select('status, ai_summary')
    .eq('conversation_id', conversationId)
    .single()

  if (interview && interview.status === 'completed' && !interview.ai_summary) {
    generateSummaryAsync(conversationId).catch((err) =>
      console.error('Background summary generation failed:', err)
    )
  }
}

async function handleRecordingReady(
  conversationId: string,
  data: Record<string, unknown>
) {
  const { error } = await supabaseAdmin
    .from('interviews')
    .update({
      recording_url: data.recording_url as string,
      recording_s3_key: data.recording_s3_key as string,
    })
    .eq('conversation_id', conversationId)

  if (error) throw error
}

async function handlePerceptionReady(
  conversationId: string,
  data: Record<string, unknown>
) {
  const perception = data.perception_analysis as Record<string, unknown> | undefined
  const signals = data.perception_signals as unknown[] | undefined

  const updateData: Record<string, unknown> = {
    perception_analysis: perception,
  }

  if (signals) {
    updateData.perception_signals = signals
  }

  // Extract computed scores from perception data
  if (perception) {
    if (typeof perception.professional_presentation === 'number') {
      updateData.professional_score = perception.professional_presentation
    }
    if (typeof perception.eye_contact_percentage === 'number') {
      updateData.eye_contact_pct = perception.eye_contact_percentage
    }
    // Compute engagement score from available signals
    const eyeContact = (perception.eye_contact_percentage as number) || 50
    const profScore = (perception.professional_presentation as number) || 5
    const trajectory = perception.engagement_trajectory as string
    let trajectoryBonus = 0
    if (trajectory === 'increased') trajectoryBonus = 10
    else if (trajectory === 'decreased') trajectoryBonus = -10
    updateData.engagement_score = Math.min(
      100,
      Math.max(0, Math.round(eyeContact * 0.5 + profScore * 5 + trajectoryBonus))
    )
  }

  const { error } = await supabaseAdmin
    .from('interviews')
    .update(updateData)
    .eq('conversation_id', conversationId)

  if (error) throw error
}

async function handleGuardrailTriggered(
  conversationId: string,
  data: Record<string, unknown>
) {
  const { data: existing } = await supabaseAdmin
    .from('interviews')
    .select('guardrail_events')
    .eq('conversation_id', conversationId)
    .single()

  const events = (existing?.guardrail_events as unknown[]) || []
  events.push({
    guardrail: data.guardrail,
    triggered_at: new Date().toISOString(),
    details: data.details,
  })

  const { error } = await supabaseAdmin
    .from('interviews')
    .update({ guardrail_events: events })
    .eq('conversation_id', conversationId)

  if (error) throw error
}
