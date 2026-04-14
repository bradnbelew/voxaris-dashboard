import { getFitScoreColor, getEngagementLabel } from '@/lib/utils'

interface ScoreCardsProps {
  fitScore: number | null
  engagementScore: number | null
  professionalScore: number | null
  eyeContactPct: number | null
}

export function ScoreCards({ fitScore, engagementScore, professionalScore, eyeContactPct }: ScoreCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <ScoreCard
        label="AI Fit Score"
        value={fitScore !== null ? `${fitScore}` : '—'}
        sub={fitScore !== null ? '/100' : undefined}
        valueClass={getFitScoreColor(fitScore)}
      />
      <ScoreCard
        label="Engagement"
        value={engagementScore !== null ? `${engagementScore}` : '—'}
        sub={engagementScore !== null ? `/ 100 · ${getEngagementLabel(engagementScore)}` : undefined}
      />
      <ScoreCard
        label="Professional Score"
        value={professionalScore !== null ? `${professionalScore}` : '—'}
        sub={professionalScore !== null ? '/ 10' : undefined}
      />
      <ScoreCard
        label="Eye Contact"
        value={eyeContactPct !== null ? `${eyeContactPct}%` : '—'}
        sub="of interview"
      />
    </div>
  )
}

function ScoreCard({
  label,
  value,
  sub,
  valueClass,
}: {
  label: string
  value: string
  sub?: string
  valueClass?: string
}) {
  return (
    <div className="rounded border border-border bg-card p-4">
      <p className="text-xs text-muted uppercase tracking-wider mb-1">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-semibold font-mono ${valueClass ?? 'text-foreground'}`}>
          {value}
        </span>
        {sub && <span className="text-xs text-muted">{sub}</span>}
      </div>
    </div>
  )
}
