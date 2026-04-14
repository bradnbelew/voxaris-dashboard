'use client'

import { useState } from 'react'
import { getPipelineLabel } from '@/lib/utils'
import type { PipelineStatus } from '@/lib/types'
import { ChevronDown } from 'lucide-react'

interface PipelineActionsProps {
  interviewId: string
  currentStatus: PipelineStatus
  userRole: string
}

const PIPELINE_OPTIONS: PipelineStatus[] = [
  'pending_review',
  'reviewed',
  'shortlisted',
  'rejected',
  'hired',
]

const STATUS_COLORS: Record<PipelineStatus, string> = {
  pending_review: 'text-warning',
  reviewed: 'text-accent',
  shortlisted: 'text-success',
  rejected: 'text-destructive',
  hired: 'text-success',
}

export function PipelineActions({ interviewId, currentStatus, userRole }: PipelineActionsProps) {
  const [status, setStatus] = useState<PipelineStatus>(currentStatus)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const canEdit = userRole === 'admin' || userRole === 'recruiter'

  async function handleSelect(newStatus: PipelineStatus) {
    if (newStatus === status || loading) return
    setOpen(false)
    setLoading(true)

    try {
      const res = await fetch(`/api/interviews/${interviewId}/pipeline`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipeline_status: newStatus }),
      })
      if (res.ok) {
        setStatus(newStatus)
      }
    } finally {
      setLoading(false)
    }
  }

  if (!canEdit) {
    return (
      <span className={`text-sm font-medium ${STATUS_COLORS[status]}`}>
        {getPipelineLabel(status)}
      </span>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        className={`flex items-center gap-2 rounded border border-border bg-card px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted/10 ${STATUS_COLORS[status]}`}
      >
        {loading ? 'Saving...' : getPipelineLabel(status)}
        <ChevronDown className="h-3.5 w-3.5" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 w-44 rounded border border-border bg-card shadow-lg overflow-hidden">
            {PIPELINE_OPTIONS.map((option) => (
              <button
                key={option}
                onClick={() => handleSelect(option)}
                className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/10 ${
                  option === status ? 'bg-muted/10' : ''
                } ${STATUS_COLORS[option]}`}
              >
                {getPipelineLabel(option)}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
