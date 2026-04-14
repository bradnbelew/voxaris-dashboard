import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { Building2, Users, Plus } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'super_admin') redirect('/dashboard')

  const admin = createAdminClient()

  const { data: orgs } = await admin.from('organizations').select('*').order('created_at', { ascending: false })
  const { count: totalInterviews } = await admin.from('interviews').select('*', { count: 'exact', head: true })

  const orgList = orgs ?? []

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Admin Overview</h1>
          <p className="text-sm text-muted mt-1">Manage all Voxaris clients and organizations</p>
        </div>
        <Link
          href="/admin/clients/new"
          className="flex items-center gap-2 rounded bg-white px-4 py-2 text-sm font-medium text-black hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          Onboard Client
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Clients" value={String(orgList.length)} icon={<Building2 className="h-4 w-4" />} />
        <StatCard label="Total Interviews" value={String(totalInterviews ?? 0)} icon={<Users className="h-4 w-4" />} />
      </div>

      {/* Recent clients table */}
      <div className="rounded border border-border bg-card">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-sm font-semibold">Recent Clients</h2>
          <Link href="/admin/clients" className="text-xs text-muted hover:text-foreground transition-colors">
            View all →
          </Link>
        </div>
        {orgList.length === 0 ? (
          <p className="p-4 text-sm text-muted italic">No clients yet. Onboard your first client.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/5">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted uppercase tracking-wider">Company</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted uppercase tracking-wider">Slug</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted uppercase tracking-wider">Created</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-muted uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orgList.map((org) => (
                <tr key={org.id} className="hover:bg-muted/5 transition-colors">
                  <td className="px-4 py-3 font-medium">{org.name}</td>
                  <td className="px-4 py-3 text-muted font-mono text-xs">{org.slug}</td>
                  <td className="px-4 py-3 text-muted">{formatDate(org.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/clients/${org.id}`} className="text-xs text-muted hover:text-foreground transition-colors">
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

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-muted mb-2">
        {icon}
        <span className="text-xs uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-semibold font-mono">{value}</p>
    </div>
  )
}
