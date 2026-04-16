import { getRecommendationLabel, getRecommendationColor } from '@/lib/utils'
import type { AIRecommendation } from '@/lib/types'
import { Sparkles } from 'lucide-react'
import { RerunAnalysisButton } from './RerunAnalysisButton'

interface AISummaryProps {
  summary: string | null
  strengths: string[] | null
  concerns: string[] | null
  recommendation: AIRecommendation | null
  transcriptSummary: string | null
  interviewId: string
  userRole: 'admin' | 'recruiter' | 'viewer' | 'super_admin'
}

export function AISummary({ summary, strengths, concerns, recommendation, transcriptSummary, interviewId, userRole }: AISummaryProps) {
  const hasData = summary || strengths?.length || concerns?.length
  const canRerun = userRole === 'admin' || userRole === 'recruiter' || userRole === 'super_admin'

  return (
    <div className="rounded border border-border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-muted" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">AI Analysis</h2>
        </div>
        <div className="flex items-center gap-2">
          {recommendation && (
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getRecommendationColor(recommendation)}`}>
              {getRecommendationLabel(recommendation)}
            </span>
          )}
          {canRerun && <RerunAnalysisButton interviewId={interviewId} />}
        </div>
      </div>

      {!hasData && (
        <p className="text-sm text-muted italic">
          AI analysis will appear here once the interview is complete.
        </p>
      )}

      {summary && (
        <div>
          <p className="text-xs text-muted uppercase tracking-wider mb-2">Summary</p>
          <p className="text-sm leading-relaxed text-foreground">{summary}</p>
        </div>
      )}

      {transcriptSummary && transcriptSummary !== summary && (
        <div>
          <p className="text-xs text-muted uppercase tracking-wider mb-2">Transcript Summary</p>
          <p className="text-sm leading-relaxed text-muted">{transcriptSummary}</p>
        </div>
      )}

      {strengths && strengths.length > 0 && (
        <div>
          <p className="text-xs text-muted uppercase tracking-wider mb-2">Strengths</p>
          <ul className="space-y-1">
            {strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-success mt-0.5 shrink-0">+</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {concerns && concerns.length > 0 && (
        <div>
          <p className="text-xs text-muted uppercase tracking-wider mb-2">Concerns</p>
          <ul className="space-y-1">
            {concerns.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-destructive mt-0.5 shrink-0">−</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
