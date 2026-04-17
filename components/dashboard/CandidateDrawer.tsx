'use client'
import { X, CheckCircle2, XCircle, User, TrendingUp, Briefcase } from 'lucide-react'
import { useEffect } from 'react'
import Link from 'next/link'

interface CandidateDrawerProps {
  interview: any
  open: boolean
  onClose: () => void
}

function ScoreRing({ score }: { score: number | null }) {
  if (score === null) return null
  const color = score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-500' : 'text-red-500'
  const bg = score >= 80 ? 'bg-emerald-50' : score >= 60 ? 'bg-amber-50' : 'bg-red-50'
  const ring = score >= 80 ? 'ring-emerald-200' : score >= 60 ? 'ring-amber-200' : 'ring-red-200'
  return (
    <div className={`flex flex-col items-center justify-center rounded-2xl ${bg} ring-1 ${ring} px-5 py-3`}>
      <span className={`text-3xl font-bold leading-none ${color}`}>{score}</span>
      <span className="text-[11px] text-muted mt-1">/ 100 Fit</span>
    </div>
  )
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
        <div className={`h-1.5 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

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

export function CandidateDrawer({ interview, open, onClose }: CandidateDrawerProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!interview) return null

  const candidate = interview.candidate
  const name = interview.full_name ?? candidate?.full_name ?? interview.candidate_name ?? 'Unknown'
  const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
  const gradient = getAvatarGradient(name)
  const recMap: Record<string, { label: string; cls: string }> = {
    strong_yes: { label: 'Strong Yes', cls: 'bg-emerald-100 text-emerald-700' },
    yes:        { label: 'Yes',        cls: 'bg-emerald-50 text-emerald-600' },
    maybe:      { label: 'Maybe',      cls: 'bg-amber-100 text-amber-700' },
    no:         { label: 'No',         cls: 'bg-red-100 text-red-700' },
  }
  const rec = recMap[interview.ai_recommendation ?? ''] ?? { label: 'Pending', cls: 'bg-slate-100 text-slate-500' }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Centered modal */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 transition-all duration-200 ${open ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
      >
        <div className="w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">

          {/* Header — gradient banner */}
          <div className="relative bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 px-6 py-5">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-4">
              <div className={`h-14 w-14 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-lg font-bold text-white shrink-0 ring-2 ring-white/40`}>
                {initials}
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-white leading-tight">{name}</h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-sm text-violet-200">{interview.applied_role ?? 'General'}</span>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${rec.cls}`}>
                    {rec.label}
                  </span>
                </div>
              </div>
              <div className="ml-auto shrink-0">
                <ScoreRing score={interview.ai_fit_score} />
              </div>
            </div>

            {/* Score bars */}
            {(interview.engagement_score !== null || interview.professional_score !== null) && (
              <div className="mt-4 flex gap-4 bg-white/10 rounded-xl px-4 py-3">
                <MiniBar label="Engagement" value={interview.engagement_score} />
                <MiniBar label="Professional" value={interview.professional_score} />
                <MiniBar label="Fit" value={interview.ai_fit_score} />
              </div>
            )}
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">

            {/* Contact */}
            {(candidate?.email || interview.email || candidate?.phone) && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Contact</p>
                <div className="space-y-1">
                  {(candidate?.email || interview.email) && (
                    <p className="text-sm text-foreground">{candidate?.email ?? interview.email}</p>
                  )}
                  {candidate?.phone && (
                    <p className="text-sm text-foreground">{candidate.phone}</p>
                  )}
                </div>
              </div>
            )}

            {/* AI Summary */}
            {interview.ai_summary && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">AI Summary</p>
                <p className="text-sm text-foreground leading-relaxed bg-background rounded-xl p-3 border border-border">
                  {interview.ai_summary}
                </p>
              </div>
            )}

            {/* Strengths + Concerns */}
            {(interview.ai_strengths?.length > 0 || interview.ai_concerns?.length > 0) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {interview.ai_strengths?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-2">Strengths</p>
                    <ul className="space-y-1.5">
                      {interview.ai_strengths.map((s: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {interview.ai_concerns?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-red-500 mb-2">Concerns</p>
                    <ul className="space-y-1.5">
                      {interview.ai_concerns.map((c: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                          <XCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Screening */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Screening</p>
              <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
                {[
                  { label: 'Work Authorized', value: interview.work_authorized === true ? 'Yes' : interview.work_authorized === false ? 'No' : '—' },
                  { label: 'Years Experience', value: interview.years_experience ?? '—' },
                  { label: 'Recent Employer', value: interview.most_recent_employer ?? '—' },
                  { label: 'Available Evenings', value: interview.available_evenings === true ? 'Yes' : interview.available_evenings === false ? 'No' : '—' },
                  { label: 'Available Weekends', value: interview.available_weekends === true ? 'Yes' : interview.available_weekends === false ? 'No' : '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between px-4 py-2.5 bg-background even:bg-white">
                    <span className="text-sm text-muted">{label}</span>
                    <span className="text-sm font-medium text-foreground">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Objectives */}
            {interview.objectives_completed?.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Objectives Completed</p>
                <div className="flex flex-wrap gap-1.5">
                  {interview.objectives_completed.map((obj: string) => (
                    <span key={obj} className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                      {obj.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer — view full profile link */}
          <div className="border-t border-border px-6 py-4 bg-background flex items-center justify-between gap-3">
            <p className="text-xs text-muted">Full profile includes transcript, recording & notes</p>
            <Link
              href={`/dashboard/interviews/${interview.id}`}
              onClick={onClose}
              className="flex items-center gap-2 text-sm font-semibold bg-accent text-white rounded-xl px-4 py-2 hover:bg-accent/90 transition-colors shrink-0"
            >
              Open Full Profile →
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
