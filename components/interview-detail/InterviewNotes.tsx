'use client'

import { useState } from 'react'
import { formatRelativeDate } from '@/lib/utils'
import { MessageCircle, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface Note {
  id: string
  content: string
  created_at: string
  author?: { full_name: string | null; role: string } | null
}

interface InterviewNotesProps {
  interviewId: string
  organizationId: string
  authorId: string
  notes: Note[]
}

export function InterviewNotes({ interviewId, organizationId, authorId, notes: initialNotes }: InterviewNotesProps) {
  const [notes, setNotes] = useState(initialNotes)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/interviews/${interviewId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim(), organization_id: organizationId }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save note')
      }

      const newNote = await res.json()
      setNotes((prev) => [...prev, newNote])
      setContent('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save note')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded border border-border bg-card p-4 space-y-4">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-4 w-4 text-muted" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
          Recruiter Notes {notes.length > 0 && `(${notes.length})`}
        </h2>
      </div>

      {notes.length === 0 && (
        <p className="text-sm text-muted italic">No notes yet.</p>
      )}

      {notes.length > 0 && (
        <div className="space-y-3">
          {notes.map((note) => (
            <div key={note.id} className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-muted">
                <span className="font-medium text-foreground">
                  {note.author?.full_name ?? 'Unknown'}
                </span>
                <span>·</span>
                <span>{formatRelativeDate(note.created_at)}</span>
              </div>
              <p className="text-sm leading-relaxed">{note.content}</p>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-2 pt-2 border-t border-border">
        <Textarea
          placeholder="Add a note..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          className="resize-none"
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex justify-end">
          <Button type="submit" disabled={loading || !content.trim()}>
            <Send className="h-3 w-3 mr-1" />
            {loading ? 'Saving...' : 'Add Note'}
          </Button>
        </div>
      </form>
    </div>
  )
}
