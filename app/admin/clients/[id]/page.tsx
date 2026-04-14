import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { TokenActions } from '@/components/admin/TokenActions'
import { formatDate, formatDateTime } from '@/lib/utils'

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

  const [{ data: org }, { data: tokens }, { count: interviewCount }] = await Promise.all([
    admin.from('organizations').select('*').eq('id', params.id).single(),
    admin.from('client_tokens').select('id, token, active, created_at').eq('organization_id', params.id).order('created_at', { ascending: false }),
    admin.from('interviews').select('*', { count: 'exact', head: true }).eq('organization_id', params.id),
  ])

  if (!org) notFound()

  const tokenList = tokens ?? []

  // Mask token: show first 8 chars + ...
  function maskToken(token: string): string {
    return token.slice(0, 12) + '...' + token.slice(-4)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted mb-1">
            <Link href="/admin/clients" className="hover:text-foreground transition-colors">
              ← Clients
            </Link>
          </div>
          <h1 className="text-2xl font-semibold">{org.name}</h1>
          <p className="text-sm text-muted mt-1 font-mono">{org.slug}</p>
        </div>
        <div className="text-right text-sm text-muted">
          <p>Created {formatDate(org.created_at)}</p>
          <p className="mt-0.5">{interviewCount ?? 0} interview{interviewCount !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Organization details */}
      <div className="rounded border border-border bg-card p-6">
        <h2 className="text-sm font-semibold mb-4">Organization Details</h2>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-muted text-xs uppercase tracking-wider mb-1">Organization ID</dt>
            <dd className="font-mono text-xs text-foreground">{org.id}</dd>
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
            <dd className="text-foreground font-mono">{interviewCount ?? 0}</dd>
          </div>
        </dl>
      </div>

      {/* Client tokens */}
      <div className="rounded border border-border bg-card">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-sm font-semibold">Client Tokens</h2>
          <span className="text-xs text-muted">
            {tokenList.filter((t) => t.active).length} active / {tokenList.length} total
          </span>
        </div>

        {tokenList.length === 0 ? (
          <p className="p-4 text-sm text-muted italic">No tokens found for this organization.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/5">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted uppercase tracking-wider">Token</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted uppercase tracking-wider">Created</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tokenList.map((token) => (
                <tr key={token.id} className="hover:bg-muted/5 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-muted">{maskToken(token.token)}</td>
                  <td className="px-4 py-3 text-muted text-xs">{formatDate(token.created_at)}</td>
                  <td className="px-4 py-3">
                    <TokenActions tokenId={token.id} initialActive={token.active} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Back link */}
      <div>
        <Link href="/admin/clients" className="text-sm text-muted hover:text-foreground transition-colors">
          ← Back to all clients
        </Link>
      </div>
    </div>
  )
}
