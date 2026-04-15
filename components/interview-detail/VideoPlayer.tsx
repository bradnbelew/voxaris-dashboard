'use client'
import { useRef, useState } from 'react'
import { Video, Download } from 'lucide-react'

interface VideoPlayerProps {
  recordingUrl: string | null
  candidateName: string
}

export function VideoPlayer({ recordingUrl, candidateName }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)

  if (!recordingUrl) {
    return (
      <div className="rounded border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-2">
          <Video className="h-4 w-4 text-muted" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Interview Recording</h2>
        </div>
        <p className="text-sm text-muted italic">Recording will appear here once processing is complete.</p>
      </div>
    )
  }

  return (
    <div className="rounded border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Video className="h-4 w-4 text-muted" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Interview Recording</h2>
        </div>
        <a
          href={recordingUrl}
          download={`${candidateName.replace(/\s+/g, '-')}-interview.mp4`}
          className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          Download
        </a>
      </div>
      <div className="relative bg-black aspect-video">
        <video
          ref={videoRef}
          src={recordingUrl}
          className="w-full h-full object-contain"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          controls
          playsInline
        />
      </div>
    </div>
  )
}
