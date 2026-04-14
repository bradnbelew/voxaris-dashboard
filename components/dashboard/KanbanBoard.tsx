'use client'

import { useState } from 'react'
import { Clock, Search } from 'lucide-react'
import { CandidateDrawer } from './CandidateDrawer'
import { differenceInDays } from 'date-fns'

const COLUMNS = [
  { key: 'pending_review', label: 'Pending Review', color: 'bg-warning-bg text-warning border-warning/20' },
  { key: 'reviewed', label: 'Reviewed', color: 'bg-accent-bg text-accent border-accent/20' },
  { key: 'shortlisted', label: 'Shortlisted', color: 'bg-success-bg text-success border-success/20' },
  { key: 'rejected', label: 'Rejected', color: 'bg-destructive-bg text-destructive border-destructive/20' },
  { key: 'hired', label: 'Hired', color: 'bg-success-bg text-success border-success/20' },
] as const

function getInitialsColor(name: string): string {
  const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500']
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

interface KanbanBoardProps { interviews: any[] }

export function KanbanBoard({ interviews }: KanbanBoardProps) {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [drawerInterview, setDrawerInterview] = useState<any>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const roles = Array.from(new Set(interviews.map(i => i.applied_role).filter(Boolean)))

  const filtered = interviews.filter(i => {
    const name = i.candidate?.full_name ?? i.candidate_name ?? ''
    const matchesSearch = name.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === 'all' || i.applied_role === roleFilter
    return matchesSearch && matchesRole
  })

  return (
    <>
      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search candidates..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
          />
        </div>
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-accent/20"
        >
          <option value="all">All Roles</option>
          {roles.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* Kanban columns */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map(col => {
          const colInterviews = filtered.filter(i => i.pipeline_status === col.key)
          const avgScore = colInterviews.length > 0 && colInterviews.some(i => i.ai_fit_score !== null)
            ? Math.round(colInterviews.filter(i => i.ai_fit_score !== null).reduce((a, b) => a + (b.ai_fit_score ?? 0), 0) / colInterviews.filter(i => i.ai_fit_score !== null).length)
            : null

          return (
            <div key={col.key} className="flex-shrink-0 w-64">
              {/* Column header */}
              <div className={`flex items-center justify-between rounded-lg border px-3 py-2 mb-3 ${col.color}`}>
                <span className="text-xs font-semibold">{col.label}</span>
                <div className="flex items-center gap-1.5">
                  {avgScore !== null && <span className="text-xs opacity-75">avg {avgScore}</span>}
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/60 text-xs font-bold">
                    {colInterviews.length}
                  </span>
                </div>
              </div>

              {/* Cards */}
              <div className="space-y-2">
                {colInterviews.length === 0 && (
                  <div className="rounded-lg border border-dashed border-border py-8 text-center">
                    <p className="text-xs text-muted">Empty</p>
                  </div>
                )}
                {colInterviews.map(interview => {
                  const name = interview.candidate?.full_name ?? interview.candidate_name ?? 'Unknown'
                  const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
                  const daysInStage = interview.started_at ? differenceInDays(new Date(), new Date(interview.started_at)) : 0
                  const isStale = daysInStage > 5
                  const score = interview.ai_fit_score

                  return (
                    <button
                      key={interview.id}
                      onClick={() => { setDrawerInterview(interview); setDrawerOpen(true) }}
                      className="w-full text-left rounded-lg border border-border bg-card p-3 shadow-sm hover:shadow-md hover:border-border-strong transition-all space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`h-7 w-7 rounded-full ${getInitialsColor(name)} flex items-center justify-center text-xs font-bold text-white shrink-0`}>
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">{name}</p>
                          <p className="text-xs text-muted truncate">{interview.applied_role ?? 'General'}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        {score !== null ? (
                          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${score >= 80 ? 'bg-success-bg text-success' : score >= 60 ? 'bg-warning-bg text-warning' : 'bg-destructive-bg text-destructive'}`}>
                            {score}
                          </span>
                        ) : <span />}
                        <div className={`flex items-center gap-1 text-xs ${isStale ? 'text-destructive' : 'text-muted'}`}>
                          {isStale && <Clock className="h-3 w-3" />}
                          {daysInStage}d
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <CandidateDrawer
        interview={drawerInterview}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  )
}
