import { MetricCard } from './MetricCard'

interface MetricsRowProps {
  totalInterviews: number
  todayCount: number
  passRate: number
  avgEngagement: number
  pendingReview: number
  sparkData?: { value: number }[]
}

export function MetricsRow({
  totalInterviews,
  todayCount,
  passRate,
  avgEngagement,
  pendingReview,
  sparkData,
}: MetricsRowProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        label="Total Interviews"
        value={totalInterviews}
        change={`+${todayCount} today`}
        changeType={todayCount > 0 ? 'positive' : 'neutral'}
        sparkData={sparkData}
      />
      <MetricCard
        label="Pass Rate"
        value={`${passRate}%`}
        changeType={passRate >= 70 ? 'positive' : passRate >= 50 ? 'neutral' : 'negative'}
      />
      <MetricCard
        label="Avg. Engagement"
        value={avgEngagement}
        changeType={avgEngagement >= 70 ? 'positive' : 'neutral'}
      />
      <MetricCard
        label="Pending Review"
        value={pendingReview}
        changeType={pendingReview > 10 ? 'negative' : 'neutral'}
      />
    </div>
  )
}
