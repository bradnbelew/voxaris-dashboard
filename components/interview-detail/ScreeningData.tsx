import type { Interview } from '@/lib/types'

interface ScreeningDataProps {
  interview: Interview
}

export function ScreeningData({ interview }: ScreeningDataProps) {
  return (
    <div className="rounded border border-border bg-card p-4 space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Screening Data</h2>

      <div className="space-y-1">
        <Row label="Work Authorized" value={boolDisplay(interview.work_authorized)} boolValue={interview.work_authorized} />
        <Row label="Years Experience" value={interview.years_experience ?? '—'} />
        <Row label="Most Recent Employer" value={interview.most_recent_employer ?? '—'} />
        <Row label="Venue Type" value={interview.venue_type ?? '—'} />
        <Row label="Has Certification" value={boolDisplay(interview.has_certification)} boolValue={interview.has_certification} />
        {interview.certifications && interview.certifications.length > 0 && (
          <Row label="Certifications" value={interview.certifications.join(', ')} />
        )}
        <Row label="Available Evenings" value={boolDisplay(interview.available_evenings)} boolValue={interview.available_evenings} />
        <Row label="Available Weekends" value={boolDisplay(interview.available_weekends)} boolValue={interview.available_weekends} />
        <Row label="Earliest Start Date" value={interview.earliest_start_date ?? '—'} />
        <Row label="Confirmed Physical" value={boolDisplay(interview.confirmed_physical)} boolValue={interview.confirmed_physical} />
        <Row label="Recruiter Call" value={boolDisplay(interview.recruiter_call_scheduled)} boolValue={interview.recruiter_call_scheduled} />
        {interview.preferred_callback_time && (
          <Row label="Callback Time" value={interview.preferred_callback_time} />
        )}
      </div>

      {interview.objectives_completed && interview.objectives_completed.length > 0 && (
        <div className="pt-3 border-t border-border">
          <p className="text-xs text-muted uppercase tracking-wider mb-2">Objectives Completed</p>
          <div className="flex flex-wrap gap-1">
            {interview.objectives_completed.map((obj) => (
              <span
                key={obj}
                className="inline-flex items-center rounded px-2 py-0.5 text-xs bg-success/10 text-success"
              >
                {formatObjective(obj)}
              </span>
            ))}
          </div>
        </div>
      )}

      {interview.disqualified && (
        <div className="pt-3 border-t border-border">
          <p className="text-xs text-muted uppercase tracking-wider mb-1">Disqualification Reason</p>
          <p className="text-sm text-destructive">{interview.disqualification_reason ?? 'Not specified'}</p>
        </div>
      )}
    </div>
  )
}

function boolDisplay(val: boolean | null | undefined): string {
  if (val === null || val === undefined) return '—'
  return val ? 'Yes' : 'No'
}

function formatObjective(obj: string): string {
  return obj.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function Row({
  label,
  value,
  boolValue,
}: {
  label: string
  value: string
  boolValue?: boolean | null
}) {
  const valueColor =
    boolValue === true ? 'text-success' :
    boolValue === false ? 'text-destructive' :
    'text-foreground'

  return (
    <div className="flex justify-between items-start gap-2 text-xs">
      <span className="text-muted shrink-0">{label}</span>
      <span className={`text-right ${valueColor}`}>{value}</span>
    </div>
  )
}
