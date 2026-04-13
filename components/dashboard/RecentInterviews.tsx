'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Interview } from '@/lib/types'
import { formatRelativeDate, getStatusColor, getFitScoreColor } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface RecentInterviewsProps {
  initialInterviews: (Interview & { candidate?: { full_name: string; email: string | null } })[]
}

export function RecentInterviews({ initialInterviews }: RecentInterviewsProps) {
  const [interviews, setInterviews] = useState(initialInterviews)

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('recent-interviews')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'interviews' },
        async () => {
          // Re-fetch recent interviews on any change
          const { data } = await supabase
            .from('interviews')
            .select('*, candidate:candidates(full_name, email)')
            .order('created_at', { ascending: false })
            .limit(10)

          if (data) setInterviews(data as typeof interviews)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div className="border border-border rounded bg-card">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold">Recent Interviews</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-card-hover">
              <th className="px-4 py-2 text-left text-xs font-medium text-muted uppercase tracking-wider">Candidate</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-muted uppercase tracking-wider">Role</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-muted uppercase tracking-wider">Date</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-muted uppercase tracking-wider">Status</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-muted uppercase tracking-wider">Fit</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-muted uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody>
            {interviews.map((interview) => (
              <tr key={interview.id} className="border-b border-border last:border-0 hover:bg-card-hover transition-colors">
                <td className="px-4 py-2.5">
                  <div>
                    <p className="font-medium text-foreground">{interview.candidate?.full_name ?? 'Unknown'}</p>
                    {interview.candidate?.email && (
                      <p className="text-xs text-muted">{interview.candidate.email}</p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <span className="text-xs font-mono text-muted">{interview.applied_role}</span>
                </td>
                <td className="px-4 py-2.5">
                  <span className="text-xs text-muted">{formatRelativeDate(interview.created_at)}</span>
                </td>
                <td className="px-4 py-2.5">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(interview.status)}`}>
                    {interview.status}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <span className={`font-mono text-sm ${getFitScoreColor(interview.ai_fit_score)}`}>
                    {interview.ai_fit_score ?? '—'}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <Link
                    href={`/dashboard/interviews/${interview.id}`}
                    className="text-xs text-accent hover:underline"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {interviews.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted">
                  No interviews yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
