import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOrgId } from '@/lib/supabase/get-org-id'
import {
  getPipelineColor,
  getPipelineLabel,
  getRecommendationLabel,
  getRecommendationColor,
} from '@/lib/utils'
import Link from 'next/link'
import { Users, TrendingUp, CheckCircle, Clock } from 'lucide-react'

export const dynamic = 'force-dynamic'

function ScorePill({ score }: { score: number | null }) {
  if (score === null) {
    return <span className="text-sm text-muted-foreground">—</span>
  }
  const color =
    score >= 80
      ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
      : score >= 60
      ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
      : 'bg-red-50 text-red-700 ring-1 ring-red-200'
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${color}`}>
      {score}
      <span className="font-normal opacity-60">/ 100</span>
    </span>
  )
}

function RecPill({ rec }: { rec: string | null }) {
  const label = getRecommendationLabel(rec)
  const color = getRecommendationColor(rec)
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${color}`}>
      {label}
    </span>
  )
}

function StatusPill({ status }: { status: string }) {
  const label = getPipelineLabel(status)
  const color = getPipelineColor(status)
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${color}`}>
      {label}
    </span>
  )
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
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

export default async function InterviewsPage() {
  const orgId = await getOrgId()
  if (!orgId) redirect('/login')

  const supabase = createClient()

  const { data: raw } = await supabase
    .from('interviews')
    .select('id, full_name, email, applied_role, ai_fit_score, ai_recommendation, pipeline_status, started_at, completed_at')
    .eq('organization_id', orgId)
    .order('started_at', { ascending: false })

  const interviews = raw ?? []

  const totalCompleted = interviews.length
  const withScores = interviews.filter((i) => i.ai_fit_score !== null)
  const avgScore =
    withScores.length > 0
      ? Math.round(withScores.reduce((a, b) => a + (b.ai_fit_score ?? 0), 0) / withScores.length)
      : null
  const shortlisted = interviews.filter((i) => i.pipeline_status === 'shortlisted' || i.pipeline_status === 'hired').length
  const pending = interviews.filter((i) => i.pipeline_status === 'pending_review').length

  return (
    <div className="min-h-screen">
      {/* Gradient Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 px-4 sm:px-8 py-6 sm:py-8">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-10 -right-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-6 left-1/3 h-32 w-32 rounded-full bg-indigo-300/20 blur-2xl" />

        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-widest text-violet-200 mb-1">
            Candidate Interviews
          </p>
          <h1 className="text-2xl font-bold text-white">All Interviews</h1>
          <p className="mt-1 text-sm text-violet-200">
            Every AI-screened candidate — scored, ranked, and ready to review.
          </p>

          {/* Stats row */}
          <div className="mt-4 flex flex-wrap gap-2 sm:gap-4">
            <div className="flex items-center gap-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2.5">
              <Users className="h-4 w-4 text-violet-200" />
              <div>
                <p className="text-lg font-bold text-white leading-none">{totalCompleted}</p>
                <p className="text-[10px] text-violet-200 mt-0.5">Total Interviews</p>
              </div>
            </div>
            {avgScore !== null && (
              <div className="flex items-center gap-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2.5">
                <TrendingUp className="h-4 w-4 text-violet-200" />
                <div>
                  <p className="text-lg font-bold text-white leading-none">{avgScore}</p>
                  <p className="text-[10px] text-violet-200 mt-0.5">Avg Fit Score</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2.5">
              <CheckCircle className="h-4 w-4 text-violet-200" />
              <div>
                <p className="text-lg font-bold text-white leading-none">{shortlisted}</p>
                <p className="text-[10px] text-violet-200 mt-0.5">Shortlisted</p>
              </div>
            </div>
            {pending > 0 && (
              <div className="flex items-center gap-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2.5">
                <Clock className="h-4 w-4 text-violet-200" />
                <div>
                  <p className="text-lg font-bold text-white leading-none">{pending}</p>
                  <p className="text-[10px] text-violet-200 mt-0.5">Awaiting Review</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-8 py-4 sm:py-6">
        {interviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-24 text-center">
            <Users className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-base font-semibold text-foreground">No interviews yet</p>
            <p className="text-sm text-muted mt-1">Candidates will appear here once they complete an AI screening.</p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="sm:hidden space-y-3">
              {interviews.map((interview) => {
                const name = interview.full_name ?? 'Unknown'
                const initials = getInitials(name)
                const gradient = getAvatarGradient(name)
                const date = interview.started_at
                  ? new Date(interview.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : '—'
                return (
                  <Link key={interview.id} href={`/dashboard/interviews/${interview.id}`}>
                    <div className="bg-white rounded-xl border border-border p-4 shadow-sm active:opacity-75">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`h-9 w-9 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-xs font-bold text-white shrink-0`}>
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground text-sm leading-tight">{name}</p>
                          <p className="text-xs text-muted">{interview.applied_role ?? '—'} · {date}</p>
                        </div>
                        <ScorePill score={interview.ai_fit_score} />
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <RecPill rec={interview.ai_recommendation} />
                        <StatusPill status={interview.pipeline_status ?? 'pending_review'} />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-background">
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Candidate</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Role</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Fit Score</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">AI Recommendation</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Pipeline Status</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Date</th>
                    <th className="px-5 py-3.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {interviews.map((interview) => {
                    const name = interview.full_name ?? 'Unknown'
                    const initials = getInitials(name)
                    const gradient = getAvatarGradient(name)
                    const date = interview.started_at
                      ? new Date(interview.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : '—'
                    return (
                      <tr key={interview.id} className="group transition-colors hover:bg-[#faf8ff]">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className={`h-8 w-8 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-xs font-bold text-white shrink-0`}>{initials}</div>
                            <div>
                              <p className="font-medium text-foreground leading-tight">{name}</p>
                              {interview.email && <p className="text-xs text-muted truncate max-w-[180px]">{interview.email}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-foreground">{interview.applied_role ?? '—'}</td>
                        <td className="px-5 py-3.5"><ScorePill score={interview.ai_fit_score} /></td>
                        <td className="px-5 py-3.5"><RecPill rec={interview.ai_recommendation} /></td>
                        <td className="px-5 py-3.5"><StatusPill status={interview.pipeline_status ?? 'pending_review'} /></td>
                        <td className="px-5 py-3.5 text-muted">{date}</td>
                        <td className="px-5 py-3.5 text-right">
                          <Link href={`/dashboard/interviews/${interview.id}`} className="text-xs font-medium text-accent hover:text-accent/80 transition-colors opacity-0 group-hover:opacity-100">
                            View →
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
