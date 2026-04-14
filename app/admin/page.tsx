import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { Building2, Users, BarChart2, Clock, Plus } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'super_admin') redirect('/dashboard')

  const admin = createAdminClient()

  const [
    { data: orgs },
    { count: totalInterviews },
    { count: totalCompleted },
    { count: totalPending },
  ] = await Promise.all([
    admin.from('organizations').select('*').order('created_at', { ascending: false }),
    admin.from('interviews').select('*', { count: 'exact', head: true }),
    admin.from('interviews').select('*', { count: 'exact', head: true }).in('status', ['completed', 'ended']),
    admin.from('interviews').select('*', { count: 'exact', head: true }).eq('pipeline_status', 'pending_review'),
  ])

  const orgList = orgs ?? []

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Overview</h1>
          <p className="text-sm text-muted mt-1">Manage all Voxaris clients and organizations</p>
        </div>
        <Link
          href="/admin/clients/new"
          className="flex items-center gap-2 rounded-lg bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Onboard Client
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Clients" value={String(orgList.length)} icon={<Building2 className="h-5 w-5 text-accent" />} accent />
        <StatCard label="Total Interviews" value={String(totalInterviews ?? 0)} icon={<Users className="h-5 w-5 text-muted" />} />
        <StatCard label="Completed" value={String(totalCompleted ?? 0)} icon={<BarChart2 className="h-5 w-5 text-success" />} />
        <StatCard label="Pending Review" value={String(totalPending ?? 0)} icon={<Clock className="h-5 w-5 text-warning" />} />
      </div>

      {/* Recent clients */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Recent Clients</h2>
          <Link href="/admin/clients" className="text-xs text-accent hover:underline">
            View all →
          </Link>
        </div>
        {orgList.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <Building2 className="h-10 w-10 text-muted mx-auto mb-3" />
            <p className="text-sm text-muted italic">No clients yet. Onboard your first client.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-background">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Slug</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orgList.slice(0, 8).map((org) => (
                <tr key={org.id} className="hover:bg-background transition-colors">
                  <td className="px-6 py-3 font-medium text-foreground">{org.name}</td>
                  <td className="px-6 py-3 text-muted font-mono text-xs">{org.slug}</td>
                  <td className="px-6 py-3 text-muted">{formatDate(org.created_at)}</td>
                  <td className="px-6 py-3 text-right">
                    <Link
                      href={`/admin/clients/${org.id}`}
                      className="text-xs font-medium text-accent hover:underline"
                    >
                      Manage →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, accent }: { label: string; value: string; icon: React.ReactNode; accent?: boolean }) {
  return (
    <div className={`rounded-xl border bg-card p-5 shadow-sm ${accent ? 'border-accent/30 ring-1 ring-accent/10' : 'border-border'}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-muted uppercase tracking-wider">{label}</span>
        {icon}
      </div>
      <p className={`text-3xl font-bold ${accent ? 'text-accent' : 'text-foreground'}`}>{value}</p>
    </div>
  )
}
