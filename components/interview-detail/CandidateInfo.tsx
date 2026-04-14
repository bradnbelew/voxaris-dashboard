import { formatDateTime } from '@/lib/utils'
import { Mail, Phone, Calendar, ExternalLink } from 'lucide-react'
import type { Candidate } from '@/lib/types'

interface CandidateInfoProps {
  candidate: Candidate | null
  startedAt: string
  completedAt: string | null
  conversationId: string
  source: string
  consentGiven: boolean
}

export function CandidateInfo({
  candidate,
  startedAt,
  completedAt,
  conversationId,
  source,
  consentGiven,
}: CandidateInfoProps) {
  return (
    <div className="rounded border border-border bg-card p-4 space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Candidate</h2>

      <div className="space-y-2">
        {candidate?.email && (
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted shrink-0" />
            <a href={`mailto:${candidate.email}`} className="hover:text-foreground text-muted transition-colors">
              {candidate.email}
            </a>
          </div>
        )}
        {candidate?.phone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted shrink-0" />
            <span className="text-muted">{candidate.phone}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted shrink-0" />
          <span className="text-muted">Started {formatDateTime(startedAt)}</span>
        </div>
        {completedAt && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted shrink-0" />
            <span className="text-muted">Completed {formatDateTime(completedAt)}</span>
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-border space-y-1">
        <Row label="Source" value={source ?? '—'} />
        <Row label="Consent" value={consentGiven ? 'Given' : 'Not given'} valueClass={consentGiven ? 'text-success' : 'text-destructive'} />
        <Row label="Conversation ID" value={conversationId} mono />
      </div>

      {candidate?.resume_text && (
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted uppercase tracking-wider mb-2">Resume</p>
          <div className="max-h-40 overflow-y-auto text-xs text-muted leading-relaxed whitespace-pre-wrap">
            {candidate.resume_text}
          </div>
        </div>
      )}
    </div>
  )
}

function Row({
  label,
  value,
  mono,
  valueClass,
}: {
  label: string
  value: string
  mono?: boolean
  valueClass?: string
}) {
  return (
    <div className="flex justify-between items-start gap-2 text-xs">
      <span className="text-muted shrink-0">{label}</span>
      <span className={`text-right truncate max-w-[60%] ${mono ? 'font-mono' : ''} ${valueClass ?? 'text-foreground'}`}>
        {value}
      </span>
    </div>
  )
}
