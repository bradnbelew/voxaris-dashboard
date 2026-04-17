'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'

interface RerunAnalysisButtonProps {
  interviewId: string
}

export function RerunAnalysisButton({ interviewId }: RerunAnalysisButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleRerun() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/interviews/${interviewId}/analyze`, { method: 'POST' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.error || 'Analysis failed. Please try again.')
        return
      }
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleRerun}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium bg-muted/60 hover:bg-muted text-muted hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
        {loading ? 'Running…' : 'Re-run Analysis'}
      </button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
