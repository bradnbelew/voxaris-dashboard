import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { Plus, Building2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { CopyLinkButton } from '@/components/admin/CopyLinkButton'

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
        admin.from('client_tokens').select('id, token, active, created_at').eq('organization_id', org.id).order('created_at', { ascending: false }),
      ])
      const activeToken = (tokens ?? []).find(t => t.active)
      return {
        ...org,
        interview_count: interviewCount ?? 0,
        tokens: tokens ?? [],
        active_token_count: (tokens ?? []).filter((t) => t.active).length,
        primary_token: activeToken?.token ?? null,
      }
    })
  )

  const agentBaseUrl = process.env.NEXT_PUBLIC_VIDEO_AGENT_URL || 'https://voxaris-video-agent.vercel.app'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clients</h1>
          <p className="text-sm text-muted mt-1">{enriched.length} organization{enriched.length !== 1 ? 's' : ''} total</p>
        </div>
        <Link
          href="/admin/clients/new"
          className="flex items-center gap-2 rounded-lg bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Client
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {enriched.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="h-12 w-12 text-muted mx-auto mb-4" />
            <p className="text-foreground font-medium">No clients yet</p>
            <p className="text-sm text-muted mt-1 mb-6">Onboard your first client to get started.</p>
            <Link
              href="/admin/clients/new"
              className="inline-flex items-center gap-2 rounded-lg bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Onboard your first client
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-background">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Slug</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Interviews</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Token Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {enriched.map((org) => (
                <tr key={org.id} className="hover:bg-background transition-colors">
                  <td className="px-6 py-4 font-medium text-foreground">{org.name}</td>
                  <td className="px-6 py-4 text-muted font-mono text-xs">{org.slug}</td>
                  <td className="px-6 py-4 text-foreground">{org.interview_count}</td>
                  <td className="px-6 py-4">
                    {org.active_token_count > 0 ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success">
                        <span className="h-1.5 w-1.5 rounded-full bg-success" />
                        {org.active_token_count} active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted">
                        <span className="h-1.5 w-1.5 rounded-full bg-border-strong" />
                        No active tokens
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-muted">{formatDate(org.created_at)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {org.primary_token && (
                        <CopyLinkButton
                          url={`${agentBaseUrl}?token=${org.primary_token}`}
                          label="Copy Link"
                        />
                      )}
                      <Link
                        href={`/admin/clients/${org.id}`}
                        className="text-xs font-medium text-accent hover:underline"
                      >
                        Manage →
                      </Link>
                    </div>
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
