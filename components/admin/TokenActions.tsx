'use client'

import { useState } from 'react'

interface TokenActionsProps {
  tokenId: string
  initialActive: boolean
}

export function TokenActions({ tokenId, initialActive }: TokenActionsProps) {
  const [active, setActive] = useState(initialActive)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function toggleActive() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/admin/tokens/${tokenId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !active }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to update token')
        setLoading(false)
        return
      }

      setActive(data.active)
    } catch {
      setError('Network error')
    }

    setLoading(false)
  }

  return (
    <div className="flex items-center gap-3">
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
          active
            ? 'bg-success-bg text-success'
            : 'bg-card-hover text-muted'
        }`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-success' : 'bg-muted'}`} />
        {active ? 'Active' : 'Inactive'}
      </span>
      <button
        onClick={toggleActive}
        disabled={loading}
        className="text-xs text-muted hover:text-foreground transition-colors disabled:opacity-50"
      >
        {loading ? 'Updating...' : active ? 'Deactivate' : 'Activate'}
      </button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  )
}
