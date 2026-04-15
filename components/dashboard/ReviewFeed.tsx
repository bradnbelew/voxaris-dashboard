'use client'

import { useState } from 'react'
import { CandidateDrawer } from './CandidateDrawer'
import { Clock, CheckCircle } from 'lucide-react'

function getInitialsColor(name: string): string {
  const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500']
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

function FitBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-gray-100 text-gray-500">No Score</span>
  if (score >= 80) return <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-success-bg text-success">Fit Score: {score}</span>
  if (score >= 60) return <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-warning-bg text-warning">Fit Score: {score}</span>
  return <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-destructive-bg text-destructive">Fit Score: {score}</span>
}

function MiniBar({ label, value }: { label: string; value: number | null }) {
  const pct = value !== null ? Math.min(100, Math.max(0, value)) : 0
  return (
    <div className="space-y-1 flex-1">
      <div className="flex justify-between">
        <span className="text-xs text-muted">{label}</span>
        <span className="text-xs font-medium text-foreground">{value !== null ? value : '—'}</span>
      </div>
      <div className="h-1.5 rounded-full bg-border">
        <div
          className={`h-1.5 rounded-full transition-all ${pct >= 80 ? 'bg-success' : pct >= 60 ? 'bg-warning' : pct > 0 ? 'bg-destructive' : 'bg-border-strong'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function getBestQuote(transcript: any[] | null): string | null {
  if (!transcript || !Array.isArray(transcript)) return null
  const userMessages = transcript.filter((m: any) => m.role === 'user' && typeof m.content === 'string' && m.content.length > 30)
  if (userMessages.length === 0) return null
  return userMessages.reduce((a: any, b: any) => a.content.length > b.content.length ? a : b).content
}

interface ReviewFeedProps {
  interviews: any[]
}

export function ReviewFeed({ interviews: initial }: ReviewFeedProps) {
  const [interviews, setInterviews] = useState(initial)
  const [drawerInterview, setDrawerInterview] = useState<any>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [actioning, setActioning] = useState<string | null>(null)

  const avgScore = interviews.length > 0
    ? Math.round(interviews.filter(i => i.ai_fit_score !== null).reduce((a, b) => a + (b.ai_fit_score ?? 0), 0) / (interviews.filter(i => i.ai_fit_score !== null).length || 1))
    : 0
  const timeSaved = (initial.length * 0.5).toFixed(1)

  async function handleAction(interviewId: string, status: 'shortlisted' | 'reviewed') {
    setActioning(interviewId)
    try {
      await fetch(`/api/interviews/${interviewId}/pipeline`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipeline_status: status }),
      })
      setInterviews(prev => prev.filter(i => i.id !== interviewId))
    } finally {
      setActioning(null)
    }
  }

  function openDrawer(interview: any) {
    setDrawerInterview(interview)
    setDrawerOpen(true)
  }

  return (
    <>
      {/* Status bar */}
      <div className="flex items-center gap-6 px-8 py-3.5 border-b border-border bg-white sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
          <span className="text-sm font-medium text-foreground">{interviews.length} candidate{interviews.length !== 1 ? 's' : ''} to review</span>
        </div>
        {avgScore > 0 && (
          <span className="text-sm text-muted">Avg score: <span className="font-semibold text-foreground">{avgScore}</span></span>
        )}
        <div className="flex items-center gap-1.5 text-sm text-success ml-auto">
          <Clock className="h-4 w-4" />
          <span>Saved <span className="font-semibold">{timeSaved} hrs</span> this week</span>
        </div>
      </div>

      {/* Feed */}
      <div className="px-8 py-6 space-y-4 max-w-3xl mx-auto">
        {interviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <CheckCircle className="h-12 w-12 text-success mb-4" />
            <h2 className="text-xl font-semibold text-foreground">You&apos;re all caught up</h2>
            <p className="text-sm text-muted mt-2">No candidates pending review. Check back after your next interview runs.</p>
          </div>
        ) : (
          interviews.map((interview) => {
            const candidate = interview.candidate
            const name = candidate?.full_name ?? interview.candidate_name ?? 'Unknown'
            const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
            const bestQuote = getBestQuote(interview.transcript)
            const isActioning = actioning === interview.id

            return (
              <div key={interview.id} className="rounded-2xl border border-border bg-card shadow-sm p-6 space-y-4 transition-all hover:shadow-md">
                {/* Header row */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full ${getInitialsColor(name)} flex items-center justify-center text-sm font-bold text-white shrink-0`}>
                      {initials}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-foreground leading-tight">{name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <FitBadge score={interview.ai_fit_score} />
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium text-foreground">{interview.applied_role ?? 'General'}</p>
                    <p className="text-xs text-muted mt-0.5">
                      {interview.started_at ? new Date(interview.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* AI Summary — hero text */}
                {interview.ai_summary ? (
                  <p className="text-sm leading-relaxed text-foreground">{interview.ai_summary}</p>
                ) : (
                  <p className="text-sm text-muted italic">AI summary will appear here once the interview is processed.</p>
                )}

                {/* Best quote */}
                {bestQuote && (
                  <blockquote className="rounded-lg bg-background border-l-4 border-accent px-4 py-3">
                    <p className="text-sm text-muted italic">&ldquo;{bestQuote.slice(0, 200)}{bestQuote.length > 200 ? '...' : ''}&rdquo;</p>
                  </blockquote>
                )}

                {/* Competency bars */}
                <div className="flex gap-4">
                  <MiniBar label="Engagement" value={interview.engagement_score} />
                  <MiniBar label="Professional" value={interview.professional_score} />
                  <MiniBar label="Fit Score" value={interview.ai_fit_score} />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2 border-t border-border">
                  <button
                    onClick={() => openDrawer(interview)}
                    className="text-sm text-muted hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-background"
                  >
                    View Profile
                  </button>
                  <div className="flex-1" />
                  <button
                    onClick={() => handleAction(interview.id, 'reviewed')}
                    disabled={isActioning}
                    className="text-sm text-destructive hover:bg-destructive-bg px-3 py-1.5 rounded-md transition-colors disabled:opacity-50"
                  >
                    Archive
                  </button>
                  <button
                    onClick={() => handleAction(interview.id, 'shortlisted')}
                    disabled={isActioning}
                    className="text-sm bg-accent text-white px-4 py-1.5 rounded-md hover:bg-accent/90 transition-colors disabled:opacity-50"
                  >
                    {isActioning ? 'Saving...' : 'Shortlist →'}
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      <CandidateDrawer
        interview={drawerInterview}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  )
}
