import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOrgId } from '@/lib/supabase/get-org-id'
import { PipelineActions } from '@/components/interview-detail/PipelineActions'
import { ScoreCards } from '@/components/interview-detail/ScoreCards'
import { AISummary } from '@/components/interview-detail/AISummary'
import { CandidateInfo } from '@/components/interview-detail/CandidateInfo'
import { ScreeningData } from '@/components/interview-detail/ScreeningData'
import { TranscriptView } from '@/components/interview-detail/TranscriptView'
import { GuardrailEvents } from '@/components/interview-detail/GuardrailEvents'
import { InterviewNotes } from '@/components/interview-detail/InterviewNotes'
import { RecordingPlayer } from '@/components/interview-detail/RecordingPlayer'
import {
  getStatusColor,
  getPipelineColor,
  getPipelineLabel,
  getRecommendationLabel,
  getRecommendationColor,
} from '@/lib/utils'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function InterviewDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const orgId = await getOrgId()
  if (!orgId) redirect('/login')

  const supabase = createClient()

  // Fetch interview scoped to org
  const { data: interview, error } = await supabase
    .from('interviews')
    .select('*, candidate:candidates(*)')
    .eq('id', params.id)
    .eq('organization_id', orgId)
    .single()

  if (error || !interview) notFound()

  // Fetch notes with author info
  const { data: notesRaw } = await supabase
    .from('interview_notes')
    .select('*, author:profiles(full_name, role)')
    .eq('interview_id', params.id)
    .order('created_at', { ascending: true })
  const notes = notesRaw ?? []

  // Get current user for notes
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', user!.id)
    .single()

  const candidate = interview.candidate as any
  const roleName = interview.applied_role
    ? interview.applied_role.charAt(0).toUpperCase() + interview.applied_role.slice(1)
    : 'General'

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Link
            href="/dashboard/interviews"
            className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Interviews
          </Link>
          <h1 className="text-2xl font-semibold">
            {candidate?.full_name ?? 'Unknown Candidate'}
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted">{roleName}</span>
            <span className="text-muted">·</span>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(interview.status)}`}
            >
              {interview.status.charAt(0).toUpperCase() + interview.status.slice(1)}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getPipelineColor(interview.pipeline_status)}`}
            >
              {getPipelineLabel(interview.pipeline_status)}
            </span>
            {interview.ai_recommendation && (
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getRecommendationColor(interview.ai_recommendation)}`}
              >
                AI: {getRecommendationLabel(interview.ai_recommendation)}
              </span>
            )}
          </div>
        </div>

        {/* Pipeline actions */}
        <PipelineActions
          interviewId={interview.id}
          currentStatus={interview.pipeline_status}
          userRole={profile?.role ?? 'viewer'}
        />
      </div>

      {/* Score cards row */}
      <ScoreCards
        fitScore={interview.ai_fit_score}
        engagementScore={interview.engagement_score}
        professionalScore={interview.professional_score}
        eyeContactPct={interview.eye_contact_pct}
      />

      {/* Main content grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left col — candidate + screening */}
        <div className="space-y-6 lg:col-span-1">
          <CandidateInfo
            candidate={candidate}
            startedAt={interview.started_at}
            completedAt={interview.completed_at}
            conversationId={interview.conversation_id}
            source={interview.source}
            consentGiven={interview.consent_given}
          />
          <ScreeningData interview={interview as any} />
        </div>

        {/* Right col — AI summary + transcript + notes */}
        <div className="space-y-6 lg:col-span-2">
          <RecordingPlayer recordingUrl={interview.recording_url} />

          <AISummary
            summary={interview.ai_summary}
            strengths={interview.ai_strengths}
            concerns={interview.ai_concerns}
            recommendation={interview.ai_recommendation}
            transcriptSummary={interview.transcript_summary}
          />

          {interview.guardrail_events && (interview.guardrail_events as any[]).length > 0 && (
            <GuardrailEvents events={interview.guardrail_events as any[]} />
          )}

          <TranscriptView transcript={interview.transcript as any} />

          <InterviewNotes
            interviewId={interview.id}
            organizationId={orgId}
            authorId={user!.id}
            notes={notes as any}
          />
        </div>
      </div>
    </div>
  )
}
