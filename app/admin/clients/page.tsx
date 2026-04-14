import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function AdminClientsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'super_admin') redirect('/dashboard')

  const admin = createAdminClient()

  const { data: orgs } = await admin
    .from('organizations')
    .select('*')
    .order('created_at', { ascending: false })

  const orgList = orgs ?? []

  // Enrich each org with interview count and token info
  const enriched = await Promise.all(
    orgList.map(async (org) => {
      const [{ count: interviewCount }, { data: tokens }] = await Promise.all([
        admin.from('interviews').select('*', { count: 'exact', head: true }).eq('organization_id', org.id),
        admin.from('client_tokens').select('id, token, active, created_at').eq('organization_id', org.id),
      ])
      return {
        ...org,
        interview_count: interviewCount ?? 0,
        tokens: tokens ?? [],
        active_token_count: (tokens ?? []).filter((t) => t.active).length,
      }
    })
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Clients</h1>
          <p className="text-sm text-muted mt-1">{enriched.length} organization{enriched.length !== 1 ? 's' : ''} total</p>
        </div>
        <Link
          href="/admin/clients/new"
          className="flex items-center gap-2 rounded bg-white px-4 py-2 text-sm font-medium text-black hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          Onboard Client
        </Link>
      </div>

      <div className="rounded border border-border bg-card">
        {enriched.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-muted italic">No clients yet.</p>
            <Link
              href="/admin/clients/new"
              className="mt-4 inline-flex items-center gap-2 rounded bg-white px-4 py-2 text-sm font-medium text-black hover:opacity-90 transition-opacity"
            >
              <Plus className="h-4 w-4" />
              Onboard your first client
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/5">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Company</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Slug</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Interviews</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Active Tokens</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Created</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {enriched.map((org) => (
                <tr key={org.id} className="hover:bg-muted/5 transition-colors">
                  <td className="px-4 py-3 font-medium">{org.name}</td>
                  <td className="px-4 py-3 text-muted font-mono text-xs">{org.slug}</td>
                  <td className="px-4 py-3 text-muted">{org.interview_count}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${org.active_token_count > 0 ? 'text-green-400' : 'text-muted'}`}>
                      {org.active_token_count} / {org.tokens.length}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">{formatDate(org.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/clients/${org.id}`}
                      className="text-xs text-muted hover:text-foreground transition-colors"
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
