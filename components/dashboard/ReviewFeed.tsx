'use client'

import { useState } from 'react'
import { CandidateDrawer } from './CandidateDrawer'
import Link from 'next/link'
import { CheckCircle, CheckCheck, X } from 'lucide-react'

function getAvatarGradient(name: string): string {
  const gradients = [
    'from-violet-500 to-indigo-500',
    'from-fuchsia-500 to-purple-500',
    'from-blue-500 to-cyan-500',
    'from-emerald-500 to-teal-500',
    'from-orange-500 to-amber-500',
    'from-pink-500 to-rose-500',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return gradients[Math.abs(hash) % gradients.length]
}

function getScoreAccent(score: number | null) {
  if (score === null) return { bar: 'bg-border', text: 'text-muted', bg: '' }
  if (score >= 80) return { bar: 'bg-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50' }
  if (score >= 60) return { bar: 'bg-amber-500', text: 'text-amber-600', bg: 'bg-amber-50' }
  return { bar: 'bg-red-500', text: 'text-red-600', bg: 'bg-red-50' }
}

function RecPill({ rec }: { rec: string | null }) {
  const map: Record<string, { label: string; cls: string }> = {
    strong_yes: { label: 'Strong Yes', cls: 'bg-emerald-100 text-emerald-700' },
    yes:        { label: 'Yes',        cls: 'bg-emerald-50 text-emerald-600' },
    maybe:      { label: 'Maybe',      cls: 'bg-amber-100 text-amber-700' },
    no:         { label: 'No',         cls: 'bg-red-100 text-red-700' },
  }
  const { label, cls } = map[rec ?? ''] ?? { label: 'Pending', cls: 'bg-slate-100 text-slate-500' }
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{label}</span>
}

function MiniBar({ label, value }: { label: string; value: number | null }) {
  const pct = value !== null ? Math.min(100, Math.max(0, value)) : 0
  const color = pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-400' : pct > 0 ? 'bg-red-400' : 'bg-border'
  return (
    <div className="flex-1">
      <div className="flex justify-between mb-1">
        <span className="text-[11px] text-muted">{label}</span>
        <span className="text-[11px] font-semibold text-foreground">{value ?? '—'}</span>
      </div>
      <div className="h-1.5 rounded-full bg-border">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

interface ReviewFeedProps {
  interviews: any[]
}

export function ReviewFeed({ interviews: initial }: ReviewFeedProps) {
  const [interviews, setInterviews] = useState(initial)
  const [drawerInterview, setDrawerInterview] = useState<any>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [actioning, setActioning] = useState<string | null>(null)

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

  // Sort highest score first
  const sorted = [...interviews].sort((a, b) => (b.ai_fit_score ?? 0) - (a.ai_fit_score ?? 0))

  return (
    <>
      <div className="px-4 sm:px-8 py-4 sm:py-6 space-y-4">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-white py-28 text-center">
            <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
              <CheckCircle className="h-7 w-7 text-emerald-500" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">All caught up</h2>
            <p className="text-sm text-muted mt-1 max-w-xs">No candidates pending review. New interviews will appear here automatically.</p>
          </div>
        ) : (
          sorted.map((interview) => {
            const candidate = interview.candidate
            const name = interview.full_name ?? candidate?.full_name ?? 'Unknown'
            const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
            const gradient = getAvatarGradient(name)
            const score = interview.ai_fit_score
            const accent = getScoreAccent(score)
            const isActioning = actioning === interview.id
            const strengths: string[] = interview.ai_strengths ?? []
            const concerns: string[] = interview.ai_concerns ?? []

            return (
              <div
                key={interview.id}
                className="group bg-white rounded-2xl border border-border shadow-sm overflow-hidden transition-all hover:shadow-md hover:border-accent/30 cursor-pointer"
                onClick={() => { setDrawerInterview(interview); setDrawerOpen(true) }}
              >
                {/* Score accent bar */}
                <div className={`h-1 w-full ${accent.bar}`} />

                <div className="p-4 sm:p-6">
                  <div className="flex gap-3 sm:gap-5">
                    {/* Score + Avatar column */}
                    <div className="flex flex-col items-center gap-1.5 shrink-0 w-12 sm:w-14 pt-0.5">
                      <div className={`h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-sm font-bold text-white`}>
                        {initials}
                      </div>
                      {score !== null && (
                        <div className="text-center">
                          <div className={`text-xl sm:text-2xl font-bold leading-none ${accent.text}`}>{score}</div>
                          <div className="text-[9px] text-muted leading-tight">/100</div>
                        </div>
                      )}
                    </div>

                    {/* Main content */}
                    <div className="flex-1 min-w-0">
                      {/* Name + actions row */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm sm:text-base font-semibold text-foreground leading-tight">{name}</h3>
                            <RecPill rec={interview.ai_recommendation} />
                          </div>
                          <div className="flex items-center gap-1.5 mt-1 text-xs text-muted flex-wrap">
                            <span>{interview.applied_role ?? 'General'}</span>
                            {interview.started_at && (
                              <>
                                <span className="text-border-strong">·</span>
                                <span>{new Date(interview.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                              </>
                            )}
                            {interview.most_recent_employer && (
                              <span className="hidden sm:inline truncate max-w-[140px]">· {interview.most_recent_employer}</span>
                            )}
                          </div>
                        </div>

                        {/* Actions — desktop inline, mobile below */}
                        <div className="hidden sm:flex items-center gap-2 shrink-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleAction(interview.id, 'reviewed') }}
                            disabled={isActioning}
                            title="Archive"
                            className="h-9 w-9 flex items-center justify-center rounded-lg border border-border text-muted hover:text-destructive hover:border-destructive/40 hover:bg-destructive-bg transition-colors disabled:opacity-50"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleAction(interview.id, 'shortlisted') }}
                            disabled={isActioning}
                            className="flex items-center gap-2 text-sm font-semibold bg-accent text-white rounded-xl px-4 py-2 hover:bg-accent/90 transition-colors disabled:opacity-50 shadow-sm"
                          >
                            <CheckCheck className="h-4 w-4" />
                            {isActioning ? 'Saving…' : 'Shortlist'}
                          </button>
                        </div>
                      </div>

                      {/* AI Summary */}
                      {interview.ai_summary ? (
                        <p className="mt-2.5 text-sm text-foreground/80 leading-relaxed line-clamp-2">
                          {interview.ai_summary}
                        </p>
                      ) : (
                        <p className="mt-2.5 text-sm text-muted italic">AI summary pending.</p>
                      )}

                      {/* Strengths + Concerns tags */}
                      {(strengths.length > 0 || concerns.length > 0) && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {strengths.slice(0, 2).map((s, i) => (
                            <span key={i} className="inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full px-2.5 py-0.5">
                              <CheckCircle className="h-3 w-3 shrink-0" />
                              <span className="truncate max-w-[160px] sm:max-w-[220px]">{s}</span>
                            </span>
                          ))}
                          {concerns.slice(0, 1).map((c, i) => (
                            <span key={i} className="inline-flex items-center gap-1 text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-100 rounded-full px-2.5 py-0.5">
                              <span className="truncate max-w-[160px] sm:max-w-[220px]">{c}</span>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Score bars */}
                      <div className="mt-3 flex gap-3 sm:gap-5">
                        <MiniBar label="Engagement" value={interview.engagement_score} />
                        <MiniBar label="Professional" value={interview.professional_score} />
                        <MiniBar label="Fit" value={interview.ai_fit_score} />
                      </div>

                      {/* Desktop: open profile hint */}
                      <p className="hidden sm:block mt-3 text-xs text-accent font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        Click anywhere to open profile →
                      </p>

                      {/* Mobile actions */}
                      <div className="sm:hidden mt-3 pt-3 border-t border-border flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleAction(interview.id, 'reviewed') }}
                          disabled={isActioning}
                          className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-xl border border-border text-muted hover:text-destructive hover:border-destructive/40 hover:bg-destructive-bg transition-colors disabled:opacity-50"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleAction(interview.id, 'shortlisted') }}
                          disabled={isActioning}
                          className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold bg-accent text-white rounded-xl px-4 py-2.5 hover:bg-accent/90 transition-colors disabled:opacity-50"
                        >
                          <CheckCheck className="h-4 w-4" />
                          {isActioning ? 'Saving…' : 'Shortlist'}
                        </button>
                      </div>
                    </div>
                  </div>
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
