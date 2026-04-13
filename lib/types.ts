export interface Organization {
  id: string
  name: string
  slug: string
  logo_url: string | null
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  organization_id: string
  full_name: string | null
  avatar_url: string | null
  role: 'admin' | 'recruiter' | 'viewer'
  created_at: string
  updated_at: string
}

export interface Candidate {
  id: string
  organization_id: string
  full_name: string
  email: string | null
  phone: string | null
  resume_text: string | null
  created_at: string
  updated_at: string
}

export type InterviewStatus = 'active' | 'completed' | 'disqualified' | 'ended' | 'error'
export type PipelineStatus = 'pending_review' | 'reviewed' | 'shortlisted' | 'rejected' | 'hired'
export type AIRecommendation = 'strong_yes' | 'yes' | 'maybe' | 'no'

export interface PerceptionAnalysis {
  professional_presentation?: number
  discomfort_moments?: string[]
  engagement_trajectory?: 'increased' | 'decreased' | 'flat'
  alone_during_interview?: boolean
  eye_contact_percentage?: number
}

export interface PerceptionSignal {
  type: 'candidate_strong_signal' | 'flag_unprofessional_setting' | 'escalate_to_recruiter'
  standout_moment?: string
  observation?: string
  reason?: string
  timestamp?: string
}

export interface TranscriptMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface GuardrailEvent {
  guardrail: string
  triggered_at: string
  details?: string
}

export interface Interview {
  id: string
  organization_id: string
  candidate_id: string
  conversation_id: string
  applied_role: string
  source: string
  status: InterviewStatus
  pipeline_status: PipelineStatus
  disqualified: boolean
  disqualification_reason: string | null
  work_authorized: boolean | null
  years_experience: string | null
  venue_type: string | null
  most_recent_employer: string | null
  has_certification: boolean | null
  certifications: string[] | null
  available_evenings: boolean | null
  available_weekends: boolean | null
  earliest_start_date: string | null
  confirmed_physical: boolean | null
  candidate_questions: string[] | null
  recruiter_call_scheduled: boolean
  preferred_callback_time: string | null
  consent_given: boolean
  consent_timestamp: string | null
  objectives_completed: string[]
  last_objective: string | null
  perception_analysis: PerceptionAnalysis | null
  perception_signals: PerceptionSignal[]
  engagement_score: number | null
  professional_score: number | null
  eye_contact_pct: number | null
  ai_summary: string | null
  ai_strengths: string[] | null
  ai_concerns: string[] | null
  ai_fit_score: number | null
  ai_recommendation: AIRecommendation | null
  transcript: TranscriptMessage[] | null
  transcript_summary: string | null
  recording_url: string | null
  recording_s3_key: string | null
  guardrail_events: GuardrailEvent[]
  event_log: Record<string, unknown>[]
  started_at: string
  completed_at: string | null
  ended_at: string | null
  reviewed_at: string | null
  reviewed_by: string | null
  created_at: string
  updated_at: string
  // Joined fields
  candidate?: Candidate
}

export interface InterviewNote {
  id: string
  interview_id: string
  organization_id: string
  author_id: string
  content: string
  created_at: string
  author?: Profile
}

export interface WebhookPayload {
  organization_id: string
  conversation_id: string
  event_type:
    | 'interview_started'
    | 'objective_completed'
    | 'conversation_ended'
    | 'transcript_ready'
    | 'recording_ready'
    | 'perception_ready'
    | 'guardrail_triggered'
  data: Record<string, unknown>
}

export interface DashboardMetrics {
  totalInterviews: number
  todayCount: number
  passRate: number
  avgEngagement: number
  pendingReview: number
}
