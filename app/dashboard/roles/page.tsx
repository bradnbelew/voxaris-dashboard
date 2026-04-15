import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOrgId } from '@/lib/supabase/get-org-id'
import { Briefcase, Plus } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function RolesPage() {
  const orgId = await getOrgId()
  if (!orgId) redirect('/login')

  const supabase = createClient()
  const { data: interviewsRaw } = await supabase
    .from('interviews')
    .select('id, applied_role, ai_fit_score, pipeline_status, status, started_at')
    .eq('organization_id', orgId)

  const interviews = interviewsRaw ?? []

  // Aggregate by role
  const roleMap: Record<string, { interviews: typeof interviews }> = {}
  for (const iv of interviews) {
    const role = iv.applied_role ?? 'General'
    if (!roleMap[role]) roleMap[role] = { interviews: [] }
    roleMap[role].interviews.push(iv)
  }

  const roles = Object.entries(roleMap).map(([name, data]) => {
    const all = data.interviews
    const completed = all.filter(i => i.status === 'completed' || i.status === 'ended')
    const pending = all.filter(i => i.pipeline_status === 'pending_review')
    const scores = all.map(i => i.ai_fit_score).filter((s): s is number => s !== null)
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null
    const oldest = all.reduce((a, b) => new Date(a.started_at) < new Date(b.started_at) ? a : b, all[0])
    const daysOpen = oldest ? Math.floor((Date.now() - new Date(oldest.started_at).getTime()) / 86400000) : 0
    return { name, total: all.length, completed: completed.length, pending: pending.length, avgScore, daysOpen }
  }).sort((a, b) => b.pending - a.pending)

  return (
    <div className="min-h-screen">
      <div className="relative overflow-hidden bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 px-8 py-8">
        <div className="pointer-events-none absolute -top-10 -right-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-6 left-1/3 h-32 w-32 rounded-full bg-indigo-300/20 blur-2xl" />
        <div className="relative flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-200 mb-1">Open Positions</p>
            <h1 className="text-2xl font-bold text-white">Roles</h1>
            <p className="mt-1 text-sm text-violet-200">Active job roles and their interview pipeline status.</p>
          </div>
          <button className="flex items-center gap-2 rounded-lg bg-white/15 backdrop-blur-sm border border-white/20 text-white px-4 py-2 text-sm font-medium hover:bg-white/25 transition-colors">
            <Plus className="h-4 w-4" />
            Create Role
          </button>
        </div>
      </div>

      <div className="p-8 space-y-4">
      {roles.length === 0 ? (
        <div className="text-center py-20">
          <Briefcase className="h-12 w-12 text-muted mx-auto mb-4" />
          <p className="text-foreground font-medium">No roles yet</p>
          <p className="text-sm text-muted mt-1">Roles are created automatically when interviews run.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {roles.map(role => (
            <div key={role.name} className={`relative rounded-2xl border bg-card p-6 shadow-sm transition-all hover:shadow-md ${role.pending > 0 ? 'border-violet-200 ring-1 ring-violet-100' : 'border-border'}`}>
              {role.pending > 0 && (
                <span className="absolute top-4 right-4 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent" />
                </span>
              )}
              <div className="flex items-start gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center shrink-0">
                  <Briefcase className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-foreground leading-tight">{role.name}</h2>
                  <p className="text-xs text-muted mt-0.5">{role.daysOpen} days active</p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <Stat label="Total" value={String(role.total)} />
                <Stat label="Completed" value={String(role.completed)} />
                <Stat label="To Review" value={String(role.pending)} highlight={role.pending > 0} />
                <Stat label="Avg Score" value={role.avgScore !== null ? String(role.avgScore) : '—'} />
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  )
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="text-center">
      <p className={`text-xl font-bold ${highlight ? 'text-accent' : 'text-foreground'}`}>{value}</p>
      <p className="text-xs text-muted mt-0.5">{label}</p>
    </div>
  )
}
