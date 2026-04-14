import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOrgId } from '@/lib/supabase/get-org-id'
import { MetricsRow } from '@/components/dashboard/MetricsRow'
import { RecentInterviews } from '@/components/dashboard/RecentInterviews'
import { RoleChart } from '@/components/dashboard/RoleChart'
import { VolumeChart } from '@/components/dashboard/VolumeChart'
import { format, subDays, startOfDay, isToday } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const orgId = await getOrgId()
  if (!orgId) redirect('/login')

  const supabase = createClient()

  // Fetch all interviews scoped to this org
  const { data: interviewsRaw } = await supabase
    .from('interviews')
    .select('id, status, pipeline_status, applied_role, engagement_score, ai_fit_score, created_at, candidate:candidates(full_name, email)')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
  const interviews = interviewsRaw ?? []

  // Calculate metrics
  const totalInterviews = interviews.length
  const todayCount = interviews.filter((i) => isToday(new Date(i.created_at))).length
  const completed = interviews.filter((i) => i.status === 'completed')
  const disqualified = interviews.filter((i) => i.status === 'disqualified')
  const passRate = totalInterviews > 0
    ? Math.round((completed.length / (completed.length + disqualified.length || 1)) * 100)
    : 0
  const engagementScores = interviews
    .map((i) => i.engagement_score)
    .filter((s): s is number => s !== null)
  const avgEngagement = engagementScores.length > 0
    ? Math.round(engagementScores.reduce((a, b) => a + b, 0) / engagementScores.length)
    : 0
  const pendingReview = interviews.filter((i) => i.pipeline_status === 'pending_review').length

  // Sparkline data (last 7 days)
  const sparkData = Array.from({ length: 7 }, (_, i) => {
    const date = startOfDay(subDays(new Date(), 6 - i))
    const count = interviews.filter((iv) => {
      const d = startOfDay(new Date(iv.created_at))
      return d.getTime() === date.getTime()
    }).length
    return { value: count }
  })

  // Role distribution
  const roleCounts: Record<string, number> = {}
  for (const iv of interviews) {
    roleCounts[iv.applied_role] = (roleCounts[iv.applied_role] || 0) + 1
  }
  const roleData = Object.entries(roleCounts)
    .map(([role, count]) => ({ role, count }))
    .sort((a, b) => b.count - a.count)

  // Volume data (last 30 days)
  const volumeData = Array.from({ length: 30 }, (_, i) => {
    const date = subDays(new Date(), 29 - i)
    const dateStr = format(date, 'MMM d')
    const dayStart = startOfDay(date)
    const count = interviews.filter((iv) => {
      const d = startOfDay(new Date(iv.created_at))
      return d.getTime() === dayStart.getTime()
    }).length
    return { date: dateStr, count }
  })

  // Recent interviews (last 10) scoped to this org
  const { data: recentInterviewsRaw } = await supabase
    .from('interviews')
    .select('*, candidate:candidates(full_name, email)')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(10)
  const recentInterviews = recentInterviewsRaw ?? []

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Overview</h1>

      <MetricsRow
        totalInterviews={totalInterviews}
        todayCount={todayCount}
        passRate={passRate}
        avgEngagement={avgEngagement}
        pendingReview={pendingReview}
        sparkData={sparkData}
      />

      <RecentInterviews initialInterviews={recentInterviews as any} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RoleChart data={roleData} />
        <VolumeChart data={volumeData} />
      </div>
    </div>
  )
}
