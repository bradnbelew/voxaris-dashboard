'use client'

import { useState } from 'react'
import { UserPlus } from 'lucide-react'

interface TeamMember { id: string; full_name: string | null; role: string }

interface TeamSettingsProps {
  team: TeamMember[]
  userRole: string
  orgId: string
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  recruiter: 'Recruiter',
  viewer: 'Viewer',
  super_admin: 'Super Admin',
}

export function TeamSettings({ team, userRole, orgId }: TeamSettingsProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('recruiter')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const canInvite = userRole === 'admin' || userRole === 'super_admin'

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send invite')
      setSuccess(`Invite sent to ${email}`)
      setEmail('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invite')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
      <h2 className="text-sm font-semibold text-foreground">Team</h2>

      {/* Team list */}
      <div className="divide-y divide-border rounded-lg border border-border">
        {team.map((member) => (
          <div key={member.id} className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="h-7 w-7 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-white">
                {(member.full_name ?? 'U').charAt(0).toUpperCase()}
              </div>
              <span className="text-sm text-foreground">{member.full_name ?? 'Unnamed'}</span>
            </div>
            <span className="text-xs text-muted">{ROLE_LABELS[member.role] ?? member.role}</span>
          </div>
        ))}
        {team.length === 0 && (
          <div className="px-4 py-6 text-center">
            <p className="text-sm text-muted italic">No team members yet.</p>
          </div>
        )}
      </div>

      {/* Invite form */}
      {canInvite && (
        <form onSubmit={handleInvite} className="flex items-end gap-3 pt-2">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-muted">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="colleague@company.com"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted">Role</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              <option value="recruiter">Recruiter</option>
              <option value="admin">Admin</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            <UserPlus className="h-4 w-4" />
            {loading ? 'Sending...' : 'Invite'}
          </button>
        </form>
      )}

      {success && <p className="text-sm text-success">{success}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </section>
  )
}
