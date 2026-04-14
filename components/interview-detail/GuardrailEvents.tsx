import { ShieldAlert } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import type { GuardrailEvent } from '@/lib/types'

interface GuardrailEventsProps {
  events: GuardrailEvent[]
}

export function GuardrailEvents({ events }: GuardrailEventsProps) {
  return (
    <div className="rounded border border-destructive/30 bg-destructive/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 text-destructive" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-destructive">
          Compliance Flags ({events.length})
        </h2>
      </div>
      <div className="space-y-2">
        {events.map((event, i) => (
          <div key={i} className="rounded border border-destructive/20 bg-card p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-destructive">
                {formatGuardrailName(event.guardrail)}
              </span>
              <span className="text-xs text-muted font-mono">
                {formatDateTime(event.triggered_at)}
              </span>
            </div>
            {event.details && (
              <p className="text-xs text-muted">{event.details}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function formatGuardrailName(name: string): string {
  return name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
