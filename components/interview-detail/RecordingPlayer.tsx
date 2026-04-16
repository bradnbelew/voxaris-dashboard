'use client'

import { useState } from 'react'
import { Video, Play, AlertCircle, Loader2 } from 'lucide-react'

interface RecordingPlayerProps {
  interviewId: string
  hasRecording: boolean
}

export function RecordingPlayer({ interviewId, hasRecording }: RecordingPlayerProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  if (!hasRecording) {
    return (
      <div className="rounded border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Video className="h-4 w-4 text-muted" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Recording</h2>
        </div>
        <p className="text-sm text-muted">No recording available yet. It will appear here once the interview is processed.</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Video className="h-4 w-4 text-muted" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Recording</h2>
        </div>
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Recording unavailable. The link may have expired.</span>
        </div>
      </div>
    )
  }

  async function loadRecording() {
    setLoading(true)
    try {
      const res = await fetch(`/api/interviews/${interviewId}/recording-url`)
      if (!res.ok) {
        setError(true)
        return
      }
      const { url } = await res.json()
      if (!url) {
        setError(true)
        return
      }
      setSignedUrl(url)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Video className="h-4 w-4 text-muted" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Interview Recording</h2>
      </div>

      {!signedUrl ? (
        <div
          className="relative flex items-center justify-center rounded-lg overflow-hidden bg-muted/30 cursor-pointer group"
          style={{ aspectRatio: '16/9' }}
          onClick={!loading ? loadRecording : undefined}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900" />
          <div className="relative z-10 flex flex-col items-center gap-3">
            {loading ? (
              <>
                <Loader2 className="h-8 w-8 text-white/80 animate-spin" />
                <p className="text-sm font-medium text-white/80">Loading recording…</p>
              </>
            ) : (
              <>
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 ring-2 ring-white/20 group-hover:bg-white/20 transition-colors">
                  <Play className="h-6 w-6 text-white fill-white ml-0.5" />
                </div>
                <p className="text-sm font-medium text-white/80">Click to load recording</p>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-lg overflow-hidden bg-black" style={{ aspectRatio: '16/9' }}>
          <video
            src={signedUrl}
            controls
            autoPlay={false}
            className="w-full h-full"
            onError={() => setError(true)}
          >
            <p className="text-sm text-muted p-4">
              Your browser does not support this video format.{' '}
              <a href={signedUrl} className="underline text-foreground" target="_blank" rel="noopener noreferrer">
                Download recording
              </a>
            </p>
          </video>
        </div>
      )}

      {signedUrl && (
        <p className="text-xs text-muted">
          <a
            href={signedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground transition-colors"
          >
            Open in new tab
          </a>
          {' · '}
          <span>Link valid for 1 hour</span>
        </p>
      )}
    </div>
  )
}
