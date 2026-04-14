'use client'
import { X, CheckCircle2, XCircle } from 'lucide-react'
import { useEffect } from 'react'

interface CandidateDrawerProps {
  interview: any
  open: boolean
  onClose: () => void
}

function FitBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-600">No Score</span>
  if (score >= 80) return <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-success-bg text-success">{score} / 100</span>
  if (score >= 60) return <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-warning-bg text-warning">{score} / 100</span>
  return <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-destructive-bg text-destructive">{score} / 100</span>
}

export function CandidateDrawer({ interview, open, onClose }: CandidateDrawerProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!interview) return null

  const candidate = interview.candidate
  const name = candidate?.full_name ?? interview.candidate_name ?? 'Unknown'

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 z-50 h-full w-[480px] bg-card shadow-xl transition-transform duration-300 flex flex-col ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-muted">{interview.applied_role ?? 'Role'}</span>
              <FitBadge score={interview.ai_fit_score} />
            </div>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-muted hover:bg-card-hover transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Contact */}
          {(candidate?.email || candidate?.phone) && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted uppercase tracking-wider">Contact</p>
              {candidate?.email && <p className="text-sm text-foreground">{candidate.email}</p>}
              {candidate?.phone && <p className="text-sm text-foreground">{candidate.phone}</p>}
            </div>
          )}

          {/* AI Summary */}
          {interview.ai_summary && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted uppercase tracking-wider">AI Summary</p>
              <p className="text-sm text-foreground leading-relaxed">{interview.ai_summary}</p>
            </div>
          )}

          {/* Strengths / Concerns */}
          {(interview.ai_strengths?.length > 0 || interview.ai_concerns?.length > 0) && (
            <div className="grid grid-cols-2 gap-4">
              {interview.ai_strengths?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-success uppercase tracking-wider">Strengths</p>
                  <ul className="space-y-1">
                    {interview.ai_strengths.map((s: string, i: number) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-success mt-0.5 shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {interview.ai_concerns?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-destructive uppercase tracking-wider">Concerns</p>
                  <ul className="space-y-1">
                    {interview.ai_concerns.map((c: string, i: number) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-foreground">
                        <XCircle className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Screening */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted uppercase tracking-wider">Screening Data</p>
            <div className="rounded-lg border border-border divide-y divide-border">
              {[
                { label: 'Work Authorized', value: interview.work_authorized === true ? 'Yes' : interview.work_authorized === false ? 'No' : '—' },
                { label: 'Experience', value: interview.years_experience ?? '—' },
                { label: 'Recent Employer', value: interview.most_recent_employer ?? '—' },
                { label: 'Available Evenings', value: interview.available_evenings === true ? 'Yes' : interview.available_evenings === false ? 'No' : '—' },
                { label: 'Available Weekends', value: interview.available_weekends === true ? 'Yes' : interview.available_weekends === false ? 'No' : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between px-3 py-2">
                  <span className="text-xs text-muted">{label}</span>
                  <span className="text-xs font-medium text-foreground">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Objectives */}
          {interview.objectives_completed?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted uppercase tracking-wider">Objectives Completed</p>
              <div className="flex flex-wrap gap-1.5">
                {interview.objectives_completed.map((obj: string) => (
                  <span key={obj} className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs bg-success-bg text-success">
                    {obj.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
