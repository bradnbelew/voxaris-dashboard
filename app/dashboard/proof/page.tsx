import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOrgId } from '@/lib/supabase/get-org-id'
import { subWeeks, startOfWeek, endOfWeek, format } from 'date-fns'
import { InterviewTrendChart } from '@/components/dashboard/InterviewTrendChart'
import { BarChart2, Users, TrendingUp, CheckCircle, Award } from 'lucide-react'

export const dynamic = 'force-dynamic'

function FunnelBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center gap-4">
      <div className="w-32 shrink-0 text-right">
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
      <div className="flex-1 h-8 bg-background rounded-lg overflow-hidden">
        <div
          className={`h-full rounded-lg ${color} transition-all flex items-center justify-end pr-3`}
          style={{ width: `${Math.max(pct, 4)}%` }}
        >
          {pct > 12 && <span className="text-xs font-semibold text-white">{count}</span>}
        </div>
      </div>
      {pct <= 12 && <span className="text-sm font-semibold text-foreground w-6">{count}</span>}
      <span className="text-xs text-muted w-10 shrink-0">{pct}%</span>
    </div>
  )
}

function ScoreBand({ label, count, max, color, bg }: { label: string; count: number; max: number; color: string; bg: string }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 shrink-0">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${bg}`}>{label}</span>
      </div>
      <div className="flex-1 h-6 bg-background rounded-md overflow-hidden">
        <div className={`h-full rounded-md ${color}`} style={{ width: `${Math.max(pct, count > 0 ? 4 : 0)}%` }} />
      </div>
      <span className="text-sm font-bold text-foreground w-6 text-right">{count}</span>
    </div>
  )
}

export default async function AnalyticsPage() {
  const orgId = await getOrgId()
  if (!orgId) redirect('/login')

  const supabase = createClient()
  const { data: raw } = await supabase
    .from('interviews')
    .select('id, status, pipeline_status, ai_fit_score, ai_recommendation, started_at, applied_role, fit_signal')
    .eq('organization_id', orgId)

  const interviews = raw ?? []

  // ── Core counts ─────────────────────────────────────────────────────────
  const total = interviews.length
  const completed = interviews.filter(i => i.status === 'completed' || i.status === 'ended')
  const pending   = interviews.filter(i => i.pipeline_status === 'pending_review')
  const reviewed  = interviews.filter(i => i.pipeline_status === 'reviewed')
  const shortlisted = interviews.filter(i => i.pipeline_status === 'shortlisted')
  const hired     = interviews.filter(i => i.pipeline_status === 'hired')
  const rejected  = interviews.filter(i => i.pipeline_status === 'rejected' || i.status === 'disqualified')

  const withScores = interviews.filter(i => i.ai_fit_score !== null)
  const avgScore = withScores.length > 0
    ? Math.round(withScores.reduce((a, b) => a + (b.ai_fit_score ?? 0), 0) / withScores.length)
    : null
  const shortlistRate = completed.length > 0
    ? Math.round(((shortlisted.length + hired.length) / completed.length) * 100)
    : null
  const passRate = withScores.length > 0
    ? Math.round((withScores.filter(i => (i.ai_fit_score ?? 0) >= 60).length / withScores.length) * 100)
    : null

  // ── Score distribution ───────────────────────────────────────────────────
  const score80 = withScores.filter(i => (i.ai_fit_score ?? 0) >= 80).length
  const score60 = withScores.filter(i => (i.ai_fit_score ?? 0) >= 60 && (i.ai_fit_score ?? 0) < 80).length
  const score40 = withScores.filter(i => (i.ai_fit_score ?? 0) >= 40 && (i.ai_fit_score ?? 0) < 60).length
  const score0  = withScores.filter(i => (i.ai_fit_score ?? 0) < 40).length
  const maxBand = Math.max(score80, score60, score40, score0, 1)

  // ── AI recommendation breakdown ──────────────────────────────────────────
  const recCounts = {
    strong_yes: interviews.filter(i => i.ai_recommendation === 'strong_yes').length,
    yes:        interviews.filter(i => i.ai_recommendation === 'yes').length,
    maybe:      interviews.filter(i => i.ai_recommendation === 'maybe').length,
    no:         interviews.filter(i => i.ai_recommendation === 'no').length,
  }

  // ── Role breakdown ───────────────────────────────────────────────────────
  const roleMap: Record<string, number> = {}
  for (const iv of interviews) {
    const r = iv.applied_role ?? 'Unspecified'
    roleMap[r] = (roleMap[r] ?? 0) + 1
  }
  const roles = Object.entries(roleMap).sort((a, b) => b[1] - a[1])
  const maxRoleCount = roles[0]?.[1] ?? 1

  // ── Weekly trend ─────────────────────────────────────────────────────────
  const weeklyData = Array.from({ length: 8 }, (_, i) => {
    const weekStart = startOfWeek(subWeeks(new Date(), 7 - i))
    const weekEnd   = endOfWeek(weekStart)
    const count = interviews.filter(iv => {
      const d = new Date(iv.started_at)
      return d >= weekStart && d <= weekEnd
    }).length
    return { week: format(weekStart, 'MMM d'), count }
  })

  // ── Hire quality ─────────────────────────────────────────────────────────
  const hiredScores   = hired.filter(i => i.ai_fit_score !== null)
  const rejectedScores = rejected.filter(i => i.ai_fit_score !== null)
  const hiredAvg   = hiredScores.length > 0   ? Math.round(hiredScores.reduce((a, b) => a + (b.ai_fit_score ?? 0), 0) / hiredScores.length) : null
  const rejectedAvg = rejectedScores.length > 0 ? Math.round(rejectedScores.reduce((a, b) => a + (b.ai_fit_score ?? 0), 0) / rejectedScores.length) : null

  const stats = [
    { label: 'Total Interviews', value: total.toString(), icon: Users, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Avg Fit Score', value: avgScore !== null ? avgScore.toString() : '—', icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Shortlist Rate', value: shortlistRate !== null ? `${shortlistRate}%` : '—', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Pass Rate (≥60)', value: passRate !== null ? `${passRate}%` : '—', icon: Award, color: 'text-amber-600', bg: 'bg-amber-50' },
  ]

  return (
    <div className="min-h-screen">
      {/* Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 px-8 py-8">
        <div className="pointer-events-none absolute -top-12 -right-12 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-8 left-1/4 h-40 w-40 rounded-full bg-indigo-300/20 blur-2xl" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-widest text-violet-200 mb-1.5">Hiring Intelligence</p>
          <h1 className="text-3xl font-bold text-white tracking-tight">Analytics</h1>
          <p className="mt-1.5 text-sm text-violet-200">Pipeline health, score distributions, and hiring patterns.</p>
        </div>
      </div>

      <div className="px-8 py-8 space-y-8 max-w-6xl mx-auto">

        {/* Stat tiles */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-border p-5 shadow-sm">
              <div className={`h-9 w-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                <s.icon className={`h-4.5 w-4.5 ${s.color}`} style={{ width: '18px', height: '18px' }} />
              </div>
              <p className="text-3xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Pipeline Funnel + Rec breakdown */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* Pipeline funnel */}
          <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <BarChart2 className="h-4 w-4 text-accent" />
              <h2 className="text-sm font-semibold text-foreground">Pipeline Funnel</h2>
              <span className="ml-auto text-xs text-muted">{total} total</span>
            </div>
            <div className="space-y-3">
              <FunnelBar label="Pending Review" count={pending.length}    total={total} color="bg-amber-400" />
              <FunnelBar label="Reviewed"       count={reviewed.length}   total={total} color="bg-indigo-400" />
              <FunnelBar label="Shortlisted"    count={shortlisted.length} total={total} color="bg-violet-500" />
              <FunnelBar label="Hired"          count={hired.length}      total={total} color="bg-emerald-500" />
              <FunnelBar label="Rejected"       count={rejected.length}   total={total} color="bg-red-400" />
            </div>
          </div>

          {/* AI Recommendation breakdown */}
          <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="h-4 w-4 text-accent" />
              <h2 className="text-sm font-semibold text-foreground">AI Recommendation Breakdown</h2>
            </div>
            <div className="space-y-4">
              {[
                { key: 'strong_yes', label: 'Strong Yes', color: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
                { key: 'yes',        label: 'Yes',        color: 'bg-emerald-300', text: 'text-emerald-600', bg: 'bg-emerald-50/60' },
                { key: 'maybe',      label: 'Maybe',      color: 'bg-amber-400',   text: 'text-amber-700',  bg: 'bg-amber-50' },
                { key: 'no',         label: 'No',         color: 'bg-red-400',     text: 'text-red-700',    bg: 'bg-red-50' },
              ].map(({ key, label, color, text, bg }) => (
                <ScoreBand
                  key={key}
                  label={label}
                  count={recCounts[key as keyof typeof recCounts]}
                  max={Math.max(...Object.values(recCounts), 1)}
                  color={color}
                  bg={`${bg} ${text}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Weekly trend */}
        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold text-foreground">Interviews Over Time</h2>
            <span className="ml-auto text-xs text-muted">Last 8 weeks</span>
          </div>
          <InterviewTrendChart data={weeklyData} />
        </div>

        {/* Score distribution + Role breakdown side by side */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* Score distribution */}
          <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <Award className="h-4 w-4 text-accent" />
              <h2 className="text-sm font-semibold text-foreground">Score Distribution</h2>
              <span className="ml-auto text-xs text-muted">{withScores.length} scored</span>
            </div>
            <div className="space-y-3">
              <ScoreBand label="80 – 100" count={score80} max={maxBand} color="bg-emerald-500" bg="bg-emerald-50 text-emerald-700" />
              <ScoreBand label="60 – 79"  count={score60} max={maxBand} color="bg-amber-400"   bg="bg-amber-50 text-amber-700" />
              <ScoreBand label="40 – 59"  count={score40} max={maxBand} color="bg-orange-400"  bg="bg-orange-50 text-orange-700" />
              <ScoreBand label="0 – 39"   count={score0}  max={maxBand} color="bg-red-400"     bg="bg-red-50 text-red-700" />
            </div>
          </div>

          {/* Role breakdown */}
          <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <Users className="h-4 w-4 text-accent" />
              <h2 className="text-sm font-semibold text-foreground">Interviews by Role</h2>
            </div>
            {roles.length === 0 ? (
              <p className="text-sm text-muted">No data yet.</p>
            ) : (
              <div className="space-y-3">
                {roles.map(([role, count]) => (
                  <div key={role} className="flex items-center gap-3">
                    <div className="w-36 shrink-0 text-sm text-foreground truncate" title={role}>{role}</div>
                    <div className="flex-1 h-6 bg-background rounded-md overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-400 to-indigo-500 rounded-md"
                        style={{ width: `${Math.max((count / maxRoleCount) * 100, count > 0 ? 6 : 0)}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-foreground w-5 text-right">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* AI Score Accuracy */}
        {(hiredAvg !== null || rejectedAvg !== null) && (
          <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <CheckCircle className="h-4 w-4 text-accent" />
              <h2 className="text-sm font-semibold text-foreground">AI Score Accuracy</h2>
              <span className="ml-auto text-xs text-muted">Hired vs. Rejected</span>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-5 text-center">
                <p className="text-5xl font-bold text-emerald-600">{hiredAvg ?? '—'}</p>
                <p className="text-sm text-emerald-700 mt-2 font-medium">Avg score — Hired</p>
                <p className="text-xs text-muted mt-0.5">{hiredScores.length} candidate{hiredScores.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="rounded-xl bg-red-50 border border-red-100 p-5 text-center">
                <p className="text-5xl font-bold text-red-500">{rejectedAvg ?? '—'}</p>
                <p className="text-sm text-red-700 mt-2 font-medium">Avg score — Rejected</p>
                <p className="text-xs text-muted mt-0.5">{rejectedScores.length} candidate{rejectedScores.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            {hiredAvg !== null && rejectedAvg !== null && (
              <p className="text-xs text-muted mt-4 text-center">
                {hiredAvg > rejectedAvg
                  ? `The AI correctly ranked hired candidates ${hiredAvg - rejectedAvg} points higher on average — scores are working.`
                  : 'Accumulate more data to validate AI scoring accuracy.'}
              </p>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
