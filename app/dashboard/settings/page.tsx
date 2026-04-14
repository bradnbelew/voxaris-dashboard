import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOrgId } from '@/lib/supabase/get-org-id'
import { TeamSettings } from '@/components/dashboard/TeamSettings'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const orgId = await getOrgId()
  if (!orgId) redirect('/login')

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', user!.id).single()
  const { data: teamRaw } = await supabase.from('profiles').select('id, full_name, role').eq('organization_id', orgId)
  const team = teamRaw ?? []

  const agentUrl = process.env.NEXT_PUBLIC_VIDEO_AGENT_URL || 'https://voxaris-video-agent.vercel.app'

  return (
    <div className="p-8 space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted mt-1">Configure your hiring intelligence platform.</p>
      </div>

      {/* AI Agent Config */}
      <section className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-foreground">AI Interview Agent</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-border">
            <div>
              <p className="text-sm font-medium text-foreground">Agent Name</p>
              <p className="text-xs text-muted">The AI interviewer your candidates speak with</p>
            </div>
            <span className="text-sm font-semibold text-foreground">Jordan</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border">
            <div>
              <p className="text-sm font-medium text-foreground">Tone</p>
              <p className="text-xs text-muted">Interview conversation style</p>
            </div>
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-accent-bg text-accent">Professional + Friendly</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-foreground">Test Interview</p>
              <p className="text-xs text-muted">Run a live demo interview right now</p>
            </div>
            <a
              href={agentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent/90 transition-colors"
            >
              Launch Demo →
            </a>
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Integrations</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-border">
            <div>
              <p className="text-sm font-medium text-foreground">GoHighLevel (GHL)</p>
              <p className="text-xs text-muted">CRM sync for candidates</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-warning-bg text-warning">
              <span className="h-1.5 w-1.5 rounded-full bg-warning" />
              Not Connected
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border">
            <div>
              <p className="text-sm font-medium text-foreground">SMS Notifications</p>
              <p className="text-xs text-muted">Alert on interview completion</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-warning-bg text-warning">
              <span className="h-1.5 w-1.5 rounded-full bg-warning" />
              Not Configured
            </span>
          </div>
          <div className="py-2">
            <p className="text-sm font-medium text-foreground mb-2">Webhook Log</p>
            <p className="text-xs text-muted italic">No recent webhook events.</p>
          </div>
        </div>
      </section>

      {/* Team */}
      <TeamSettings team={team as any} userRole={profile?.role ?? 'viewer'} orgId={orgId} />
    </div>
  )
}
