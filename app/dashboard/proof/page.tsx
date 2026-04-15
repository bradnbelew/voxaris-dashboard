import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOrgId } from '@/lib/supabase/get-org-id'
import { subWeeks, startOfWeek, endOfWeek, format } from 'date-fns'
import { WeeklyChart } from '@/components/dashboard/WeeklyChart'

export const dynamic = 'force-dynamic'

export default async function ProofPage() {
  const orgId = await getOrgId()
  if (!orgId) redirect('/login')

  const supabase = createClient()
  const { data: interviewsRaw } = await supabase
    .from('interviews')
    .select('id, status, pipeline_status, ai_fit_score, started_at, completed_at')
    .eq('organization_id', orgId)

  const interviews = interviewsRaw ?? []

  const completed = interviews.filter(i => i.status === 'completed' || i.status === 'ended')
  const hired = interviews.filter(i => i.pipeline_status === 'hired')
  const rejected = interviews.filter(i => i.pipeline_status === 'rejected')

  const hoursPerInterview = 0.5
  const hourlyRate = 25
  const totalHours = +(completed.length * hoursPerInterview).toFixed(1)
  const totalSaved = Math.round(totalHours * hourlyRate)
  const avgPerCandidate = completed.length > 0 ? (totalHours * 60 / completed.length).toFixed(1) : '0'

  const hiredAvg = hired.length > 0 && hired.some(i => i.ai_fit_score !== null)
    ? Math.round(hired.filter(i => i.ai_fit_score !== null).reduce((a, b) => a + (b.ai_fit_score ?? 0), 0) / hired.filter(i => i.ai_fit_score !== null).length)
    : null

  const rejectedAvg = rejected.length > 0 && rejected.some(i => i.ai_fit_score !== null)
    ? Math.round(rejected.filter(i => i.ai_fit_score !== null).reduce((a, b) => a + (b.ai_fit_score ?? 0), 0) / rejected.filter(i => i.ai_fit_score !== null).length)
    : null

  // 8 weeks of data
  const weeklyData = Array.from({ length: 8 }, (_, i) => {
    const weekStart = startOfWeek(subWeeks(new Date(), 7 - i))
    const weekEnd = endOfWeek(weekStart)
    const count = interviews.filter(iv => {
      const d = new Date(iv.started_at)
      return d >= weekStart && d <= weekEnd
    }).length
    return { week: format(weekStart, 'MMM d'), count }
  })

  const insightSentence = completed.length > 0
    ? `Your team reviewed ${completed.length} candidate${completed.length !== 1 ? 's' : ''} this month in an average of ${avgPerCandidate} minutes each, saving an estimated ${totalHours} hours.`
    : 'Complete your first interviews to start seeing ROI metrics here.'

  return (
    <div className="min-h-screen">
      <div className="relative overflow-hidden bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 px-8 py-8">
        <div className="pointer-events-none absolute -top-10 -right-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-6 left-1/3 h-32 w-32 rounded-full bg-indigo-300/20 blur-2xl" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-widest text-violet-200 mb-1">ROI Dashboard</p>
          <h1 className="text-2xl font-bold text-white">Proof</h1>
          <p className="mt-1 text-sm text-violet-200">The ROI screen. Show this at every 30-day review.</p>
        </div>
      </div>
    <div className="p-8 space-y-8 max-w-4xl">

      {/* Time & Cost Saved */}
      <div className="grid grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <p className="text-xs font-medium text-muted uppercase tracking-wider mb-2">Hours Saved This Month</p>
          <p className="text-5xl font-bold text-foreground">{totalHours}</p>
          <p className="text-sm text-muted mt-2">Based on {completed.length} completed interviews × 30 min avg</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <p className="text-xs font-medium text-muted uppercase tracking-wider mb-2">Estimated Cost Saved</p>
          <p className="text-5xl font-bold text-success">${totalSaved.toLocaleString()}</p>
          <p className="text-sm text-muted mt-2">At ${hourlyRate}/hr recruiter rate · {totalHours} hrs × ${hourlyRate}</p>
        </div>
      </div>

      {/* Weekly chart */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <p className="text-sm font-semibold text-foreground mb-4">Interviews Completed — Last 8 Weeks</p>
        <WeeklyChart data={weeklyData} />
      </div>

      {/* Hire quality */}
      {(hiredAvg !== null || rejectedAvg !== null) && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <p className="text-sm font-semibold text-foreground mb-4">Hire Quality — AI Score Accuracy</p>
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-success">{hiredAvg ?? '—'}</p>
              <p className="text-sm text-muted mt-1">Avg score of hired candidates</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-destructive">{rejectedAvg ?? '—'}</p>
              <p className="text-sm text-muted mt-1">Avg score of rejected candidates</p>
            </div>
          </div>
          {hiredAvg !== null && rejectedAvg !== null && (
            <p className="text-xs text-muted mt-4 text-center">
              {hiredAvg > rejectedAvg
                ? `The AI score correctly ranks hired candidates ${hiredAvg - rejectedAvg} points higher on average.`
                : 'More data needed to validate scoring accuracy.'}
            </p>
          )}
        </div>
      )}

      {/* Insight sentence */}
      <div className="rounded-xl border border-accent/20 bg-accent-bg px-6 py-4">
        <p className="text-sm font-medium text-accent">{insightSentence}</p>
      </div>
    </div>
    </div>
  )
}
