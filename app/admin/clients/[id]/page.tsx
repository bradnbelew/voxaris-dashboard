import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { TokenActions } from '@/components/admin/TokenActions'
import { GenerateTokenButton } from '@/components/admin/GenerateTokenButton'
import { CopyLinkButton } from '@/components/admin/CopyLinkButton'
import { formatDate, formatDateTime } from '@/lib/utils'
import { ArrowLeft, Users, CheckCircle2, Star, UserCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: { id: string }
}

export default async function ClientDetailPage({ params }: PageProps) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'super_admin') redirect('/dashboard')

  const admin = createAdminClient()

  const [
    { data: org },
    { data: tokens },
    { count: totalCount },
    { count: completedCount },
    { count: shortlistedCount },
    { count: hiredCount },
    { data: teamRaw },
  ] = await Promise.all([
    admin.from('organizations').select('*').eq('id', params.id).single(),
    admin.from('client_tokens').select('id, token, active, created_at').eq('organization_id', params.id).order('created_at', { ascending: false }),
    admin.from('interviews').select('*', { count: 'exact', head: true }).eq('organization_id', params.id),
    admin.from('interviews').select('*', { count: 'exact', head: true }).eq('organization_id', params.id).in('status', ['completed', 'ended']),
    admin.from('interviews').select('*', { count: 'exact', head: true }).eq('organization_id', params.id).eq('pipeline_status', 'shortlisted'),
    admin.from('interviews').select('*', { count: 'exact', head: true }).eq('organization_id', params.id).eq('pipeline_status', 'hired'),
    admin.from('profiles').select('id, full_name, role').eq('organization_id', params.id),
  ])

  if (!org) notFound()

  const tokenList = tokens ?? []
  const team = teamRaw ?? []
  const agentBaseUrl = process.env.NEXT_PUBLIC_VIDEO_AGENT_URL || 'https://voxaris-video-agent.vercel.app'

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted mb-2">
            <Link href="/admin/clients" className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" />
              Clients
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-foreground">{org.name}</h1>
          <p className="text-sm text-muted mt-1 font-mono">{org.slug}</p>
        </div>
        <div className="text-right text-sm text-muted">
          <p>Created {formatDate(org.created_at)}</p>
          <p className="mt-0.5 font-medium text-foreground">{totalCount ?? 0} interview{totalCount !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Interview stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total" value={String(totalCount ?? 0)} icon={<Users className="h-4 w-4 text-muted" />} />
        <StatCard label="Completed" value={String(completedCount ?? 0)} icon={<CheckCircle2 className="h-4 w-4 text-success" />} />
        <StatCard label="Shortlisted" value={String(shortlistedCount ?? 0)} icon={<Star className="h-4 w-4 text-accent" />} />
        <StatCard label="Hired" value={String(hiredCount ?? 0)} icon={<UserCheck className="h-4 w-4 text-success" />} />
      </div>

      {/* Org details */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground mb-4">Organization Details</h2>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-muted text-xs uppercase tracking-wider mb-1">Organization ID</dt>
            <dd className="font-mono text-xs text-foreground break-all">{org.id}</dd>
          </div>
          <div>
            <dt className="text-muted text-xs uppercase tracking-wider mb-1">Slug</dt>
            <dd className="font-mono text-xs text-foreground">{org.slug}</dd>
          </div>
          <div>
            <dt className="text-muted text-xs uppercase tracking-wider mb-1">Created</dt>
            <dd className="text-foreground">{formatDateTime(org.created_at)}</dd>
          </div>
          <div>
            <dt className="text-muted text-xs uppercase tracking-wider mb-1">Total Interviews</dt>
            <dd className="text-foreground font-mono">{totalCount ?? 0}</dd>
          </div>
        </dl>
      </div>

      {/* Client tokens */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Client Tokens</h2>
            <p className="text-xs text-muted mt-0.5">
              {tokenList.filter((t) => t.active).length} active / {tokenList.length} total
            </p>
          </div>
          <GenerateTokenButton orgId={params.id} />
        </div>

        {tokenList.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-sm text-muted italic">No tokens found for this organization.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-background">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Token</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted uppercase tracking-wider">Interview Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tokenList.map((token) => (
                <tr key={token.id} className="hover:bg-background transition-colors">
                  <td className="px-6 py-3 font-mono text-xs text-muted">
                    {token.token.slice(0, 12)}...{token.token.slice(-4)}
                  </td>
                  <td className="px-6 py-3 text-muted text-xs">{formatDate(token.created_at)}</td>
                  <td className="px-6 py-3">
                    <TokenActions tokenId={token.id} initialActive={token.active} />
                  </td>
                  <td className="px-6 py-3 text-right">
                    {token.active && (
                      <CopyLinkButton
                        url={`${agentBaseUrl}?token=${token.token}`}
                        label="Copy Interview Link"
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Team members */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Team Members</h2>
          <p className="text-xs text-muted mt-0.5">{team.length} member{team.length !== 1 ? 's' : ''}</p>
        </div>
        {team.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-sm text-muted italic">No team members yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {team.map((member) => (
              <div key={member.id} className="flex items-center justify-between px-6 py-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-white">
                    {(member.full_name ?? 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{member.full_name ?? 'Unnamed'}</p>
                    <p className="text-xs text-muted font-mono">{member.id.slice(0, 8)}...</p>
                  </div>
                </div>
                <span className="text-xs text-muted capitalize">{member.role}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Back link */}
      <div>
        <Link href="/admin/clients" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to all clients
        </Link>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted uppercase tracking-wider">{label}</span>
        {icon}
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  )
}
