'use client'
import { useEffect, useRef, useState } from 'react'
import { Video, Download, Loader2 } from 'lucide-react'

interface VideoPlayerProps {
  interviewId: string
  candidateName: string
}

export function VideoPlayer({ interviewId, candidateName }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function fetchUrl() {
      try {
        const res = await fetch(`/api/interviews/${interviewId}/recording-url`)
        if (!res.ok) {
          if (!cancelled) setError(true)
          return
        }
        const data = await res.json()
        if (!cancelled) setUrl(data.url ?? null)
      } catch {
        if (!cancelled) setError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchUrl()
    return () => { cancelled = true }
  }, [interviewId])

  return (
    <div className="rounded border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Video className="h-4 w-4 text-muted" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Interview Recording</h2>
        </div>
        {url && (
          <a
            href={url}
            download={`${candidateName.replace(/\s+/g, '-')}-interview.mp4`}
            className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </a>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center aspect-video bg-black/5">
          <Loader2 className="h-6 w-6 animate-spin text-muted" />
        </div>
      )}

      {!loading && (error || !url) && (
        <div className="flex items-center justify-center aspect-video bg-black/5">
          <p className="text-sm text-muted italic">
            {error ? 'Recording unavailable.' : 'Recording will appear here once processing is complete.'}
          </p>
        </div>
      )}

      {!loading && url && (
        <div className="relative bg-black aspect-video">
          <video
            ref={videoRef}
            src={url}
            className="w-full h-full object-contain"
            controls
            playsInline
          />
        </div>
      )}
    </div>
  )
}
