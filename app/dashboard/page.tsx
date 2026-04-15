import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOrgId } from '@/lib/supabase/get-org-id'
import { ReviewFeed } from '@/components/dashboard/ReviewFeed'
import { Inbox, TrendingUp, Users } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ReviewPage() {
  const orgId = await getOrgId()
  if (!orgId) redirect('/login')

  const supabase = createClient()

  const { data: interviewsRaw } = await supabase
    .from('interviews')
    .select('*, candidate:candidates(full_name, email, phone)')
    .eq('organization_id', orgId)
    .eq('pipeline_status', 'pending_review')
    .order('ai_fit_score', { ascending: false })

  const interviews = interviewsRaw ?? []

  const withScores = interviews.filter(i => i.ai_fit_score !== null)
  const avgScore = withScores.length > 0
    ? Math.round(withScores.reduce((a: number, b: any) => a + b.ai_fit_score, 0) / withScores.length)
    : null
  const strongYes = interviews.filter(i => i.ai_recommendation === 'strong_yes' || i.ai_recommendation === 'yes').length

  return (
    <div className="min-h-screen">
      {/* Gradient Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 px-4 sm:px-8 py-6 sm:py-8">
        <div className="pointer-events-none absolute -top-12 -right-12 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-8 left-1/4 h-40 w-40 rounded-full bg-indigo-300/20 blur-2xl" />
        <div className="pointer-events-none absolute top-4 right-1/3 h-24 w-24 rounded-full bg-fuchsia-400/10 blur-2xl" />

        <div className="relative flex items-end justify-between gap-6 flex-wrap">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-200 mb-1.5">Review Queue</p>
            <h1 className="text-3xl font-bold text-white tracking-tight">Pending Review</h1>
            <p className="mt-1.5 text-sm text-violet-200 max-w-md">
              AI-screened candidates ranked by fit score — shortlist the ones worth your time.
            </p>
          </div>

          <div className="flex gap-2 sm:gap-3 flex-wrap mt-4 sm:mt-0">
            <div className="flex items-center gap-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 px-5 py-3">
              <Inbox className="h-4 w-4 text-violet-200 shrink-0" />
              <div>
                <p className="text-2xl font-bold text-white leading-none">{interviews.length}</p>
                <p className="text-[10px] text-violet-200 mt-0.5">To Review</p>
              </div>
            </div>
            {avgScore !== null && (
              <div className="flex items-center gap-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 px-5 py-3">
                <TrendingUp className="h-4 w-4 text-violet-200 shrink-0" />
                <div>
                  <p className="text-2xl font-bold text-white leading-none">{avgScore}</p>
                  <p className="text-[10px] text-violet-200 mt-0.5">Avg Score</p>
                </div>
              </div>
            )}
            {strongYes > 0 && (
              <div className="flex items-center gap-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 px-5 py-3">
                <Users className="h-4 w-4 text-violet-200 shrink-0" />
                <div>
                  <p className="text-2xl font-bold text-white leading-none">{strongYes}</p>
                  <p className="text-[10px] text-violet-200 mt-0.5">Recommended</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ReviewFeed interviews={interviews} />
    </div>
  )
}
