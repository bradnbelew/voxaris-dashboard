import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOrgId } from '@/lib/supabase/get-org-id'
import { ReviewFeed } from '@/components/dashboard/ReviewFeed'

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
    .order('started_at', { ascending: false })

  const interviews = interviewsRaw ?? []

  return (
    <div className="min-h-screen">
      {/* Gradient Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 px-8 py-8">
        <div className="pointer-events-none absolute -top-10 -right-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-6 left-1/3 h-32 w-32 rounded-full bg-indigo-300/20 blur-2xl" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-widest text-violet-200 mb-1">Review Queue</p>
          <h1 className="text-2xl font-bold text-white">Pending Review</h1>
          <p className="mt-1 text-sm text-violet-200">
            Candidates awaiting your decision — shortlist or archive.
          </p>
        </div>
      </div>
      <ReviewFeed interviews={interviews} />
    </div>
  )
}
