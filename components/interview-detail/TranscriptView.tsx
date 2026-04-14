'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, MessageSquare } from 'lucide-react'
import type { TranscriptMessage } from '@/lib/types'

interface TranscriptViewProps {
  transcript: TranscriptMessage[] | null
}

export function TranscriptView({ transcript }: TranscriptViewProps) {
  const [expanded, setExpanded] = useState(false)

  const messages = transcript?.filter((m) => m.role !== 'system') ?? []

  return (
    <div className="rounded border border-border bg-card p-4 space-y-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full"
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
            Transcript {messages.length > 0 && `(${messages.length} messages)`}
          </h2>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted" />
        )}
      </button>

      {!expanded && (
        <p className="text-xs text-muted">Click to expand full transcript</p>
      )}

      {expanded && (
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
          {messages.length === 0 ? (
            <p className="text-sm text-muted italic">No transcript available yet.</p>
          ) : (
            messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${msg.role === 'assistant' ? '' : 'flex-row-reverse'}`}
              >
                <div
                  className={`text-xs font-medium shrink-0 w-16 pt-1 ${
                    msg.role === 'assistant' ? 'text-muted text-left' : 'text-muted text-right'
                  }`}
                >
                  {msg.role === 'assistant' ? 'Jordan' : 'Candidate'}
                </div>
                <div
                  className={`rounded px-3 py-2 text-sm max-w-[80%] ${
                    msg.role === 'assistant'
                      ? 'bg-muted/10 text-foreground'
                      : 'bg-accent/10 text-foreground'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
