'use client'

import { useState } from 'react'
import { Plus, RefreshCw } from 'lucide-react'

interface GenerateTokenButtonProps {
  orgId: string
}

export function GenerateTokenButton({ orgId }: GenerateTokenButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch('/api/admin/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organization_id: orgId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate token')
      setSuccess(true)
      // Reload the page to show the new token
      setTimeout(() => window.location.reload(), 800)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate token')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      {error && <span className="text-xs text-destructive">{error}</span>}
      {success && <span className="text-xs text-success">Token generated!</span>}
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-card-hover transition-colors disabled:opacity-50"
      >
        {loading ? (
          <>
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Plus className="h-3.5 w-3.5" />
            Generate New Token
          </>
        )}
      </button>
    </div>
  )
}
