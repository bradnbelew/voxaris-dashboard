'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { X } from 'lucide-react'

interface InviteModalProps {
  open: boolean
  onClose: () => void
  organizationId: string
}

export function InviteModal({ open, onClose, organizationId }: InviteModalProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('recruiter')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  if (!open) return null

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role, organization_id: organizationId }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to send invite')
      }

      setSuccess(true)
      setEmail('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invite')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md border border-border bg-card rounded p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-semibold">Invite Team Member</h2>
          <button onClick={onClose} className="text-muted hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleInvite} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="invite-email" className="text-sm text-muted">
              Email address
            </label>
            <Input
              id="invite-email"
              type="email"
              placeholder="colleague@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="invite-role" className="text-sm text-muted">
              Role
            </label>
            <Select
              id="invite-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="recruiter">Recruiter</option>
              <option value="viewer">Viewer</option>
            </Select>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-success">Invite sent successfully</p>}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send Invite'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
