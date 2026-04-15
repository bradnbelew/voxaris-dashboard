'use client'
import { useState } from 'react'
import { Briefcase, Plus, Copy, Check, Pencil, X, ChevronDown } from 'lucide-react'
import type { Role } from '@/lib/types'

interface RolesClientProps {
  initialRoles: Role[]
  activeToken: string | null
  videoAgentUrl: string
}

interface RoleFormData {
  title: string
  pay_range: string
  shift: string
  venue_type: string
  must_haves: string
  behavioral_questions: string
  certifications_preferred: string
}

const EMPTY_FORM: RoleFormData = {
  title: '',
  pay_range: '',
  shift: '',
  venue_type: '',
  must_haves: '',
  behavioral_questions: '',
  certifications_preferred: '',
}

function roleToForm(role: Role): RoleFormData {
  return {
    title: role.title,
    pay_range: role.pay_range ?? '',
    shift: role.shift ?? '',
    venue_type: role.venue_type ?? '',
    must_haves: role.must_haves.join('\n'),
    behavioral_questions: role.behavioral_questions.join('\n'),
    certifications_preferred: role.certifications_preferred.join('\n'),
  }
}

function parseLines(val: string): string[] {
  return val.split('\n').map(s => s.trim()).filter(Boolean)
}

export function RolesClient({ initialRoles, activeToken, videoAgentUrl }: RolesClientProps) {
  const [roles, setRoles] = useState<Role[]>(initialRoles)
  const [showModal, setShowModal] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [form, setForm] = useState<RoleFormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  function openCreate() {
    setEditingRole(null)
    setForm(EMPTY_FORM)
    setError(null)
    setShowModal(true)
  }

  function openEdit(role: Role) {
    setEditingRole(role)
    setForm(roleToForm(role))
    setError(null)
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditingRole(null)
    setForm(EMPTY_FORM)
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!form.title.trim()) { setError('Role title is required.'); return }
    const bqs = parseLines(form.behavioral_questions)
    if (bqs.length > 0 && bqs.length < 2) {
      setError('Please provide at least 2 behavioral questions, or leave the field empty.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        title: form.title.trim(),
        pay_range: form.pay_range.trim() || null,
        shift: form.shift.trim() || null,
        venue_type: form.venue_type.trim() || null,
        must_haves: parseLines(form.must_haves),
        behavioral_questions: bqs,
        certifications_preferred: parseLines(form.certifications_preferred),
      }

      if (editingRole) {
        const res = await fetch(`/api/roles/${editingRole.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to update role')
        setRoles(prev => prev.map(r => r.id === editingRole.id ? data.role : r))
      } else {
        const res = await fetch('/api/roles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to create role')
        setRoles(prev => [data.role, ...prev])
      }
      closeModal()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeactivate(role: Role) {
    try {
      const res = await fetch(`/api/roles/${role.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: false }),
      })
      if (!res.ok) return
      setRoles(prev => prev.map(r => r.id === role.id ? { ...r, active: false } : r))
    } catch {}
  }

  function buildInterviewLink(role: Role): string | null {
    if (!activeToken || !videoAgentUrl) return null
    return `${videoAgentUrl}/apply?client=${activeToken}&role=${role.id}`
  }

  function copyLink(role: Role) {
    const url = buildInterviewLink(role)
    if (!url) return
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(role.id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  const activeRoles = roles.filter(r => r.active)
  const inactiveRoles = roles.filter(r => !r.active)

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Roles</h1>
          <p className="text-sm text-muted mt-1">Create and manage job roles for AI screening interviews.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Role
        </button>
      </div>

      {roles.length === 0 ? (
        <div className="text-center py-20">
          <Briefcase className="h-12 w-12 text-muted mx-auto mb-4" />
          <p className="text-foreground font-medium">No roles yet</p>
          <p className="text-sm text-muted mt-1">Create a role to generate interview links for candidates.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {activeRoles.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">Active</h2>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {activeRoles.map(role => (
                  <RoleCard
                    key={role.id}
                    role={role}
                    interviewLink={buildInterviewLink(role)}
                    copied={copiedId === role.id}
                    onCopy={() => copyLink(role)}
                    onEdit={() => openEdit(role)}
                    onDeactivate={() => handleDeactivate(role)}
                  />
                ))}
              </div>
            </div>
          )}

          {inactiveRoles.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">Inactive</h2>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {inactiveRoles.map(role => (
                  <RoleCard
                    key={role.id}
                    role={role}
                    interviewLink={null}
                    copied={false}
                    onCopy={() => {}}
                    onEdit={() => openEdit(role)}
                    onDeactivate={() => {}}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative z-10 w-full max-w-xl bg-card rounded-xl border border-border shadow-xl max-h-[90vh] flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <h2 className="text-sm font-semibold text-foreground">
                {editingRole ? 'Edit Role' : 'Create Role'}
              </h2>
              <button onClick={closeModal} className="text-muted hover:text-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal body */}
            <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">
                  Role Title <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
                  placeholder="e.g. Hotel Banquet Server"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">Pay Range</label>
                  <input
                    type="text"
                    value={form.pay_range}
                    onChange={e => setForm(f => ({ ...f, pay_range: e.target.value }))}
                    className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
                    placeholder="e.g. $18–$22/hr"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">Shift / Schedule</label>
                  <input
                    type="text"
                    value={form.shift}
                    onChange={e => setForm(f => ({ ...f, shift: e.target.value }))}
                    className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
                    placeholder="e.g. Evenings & weekends"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">Venue / Location Type</label>
                <input
                  type="text"
                  value={form.venue_type}
                  onChange={e => setForm(f => ({ ...f, venue_type: e.target.value }))}
                  className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
                  placeholder="e.g. Hotel / event venues"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">Must-Have Qualifications</label>
                <textarea
                  rows={3}
                  value={form.must_haves}
                  onChange={e => setForm(f => ({ ...f, must_haves: e.target.value }))}
                  className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent resize-none"
                  placeholder="One per line&#10;e.g. Valid US work authorization&#10;Ability to lift 30 lbs"
                />
                <p className="text-xs text-muted mt-1">One item per line</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">Behavioral Interview Questions</label>
                <textarea
                  rows={4}
                  value={form.behavioral_questions}
                  onChange={e => setForm(f => ({ ...f, behavioral_questions: e.target.value }))}
                  className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent resize-none"
                  placeholder="One per line (min 2 if provided)&#10;e.g. Tell me about a time you handled a difficult guest."
                />
                <p className="text-xs text-muted mt-1">One question per line · min 2 if provided</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">Certifications Preferred</label>
                <textarea
                  rows={2}
                  value={form.certifications_preferred}
                  onChange={e => setForm(f => ({ ...f, certifications_preferred: e.target.value }))}
                  className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent resize-none"
                  placeholder="One per line&#10;e.g. TIPS, ServSafe"
                />
                <p className="text-xs text-muted mt-1">One per line</p>
              </div>

              {error && (
                <p className="text-xs text-destructive bg-destructive-bg rounded px-3 py-2 border border-destructive/20">{error}</p>
              )}
            </form>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border shrink-0">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 text-sm text-muted hover:text-foreground border border-border rounded hover:bg-card-hover transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                onClick={handleSubmit}
                className="px-4 py-2 text-sm font-medium bg-accent text-white rounded hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving…' : editingRole ? 'Save Changes' : 'Create Role'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function RoleCard({
  role,
  interviewLink,
  copied,
  onCopy,
  onEdit,
  onDeactivate,
}: {
  role: Role
  interviewLink: string | null
  copied: boolean
  onCopy: () => void
  onEdit: () => void
  onDeactivate: () => void
}) {
  return (
    <div className={`rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md ${role.active ? 'border-border' : 'border-border opacity-60'}`}>
      {/* Title row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-lg bg-accent-bg flex items-center justify-center shrink-0 mt-0.5">
            <Briefcase className="h-4 w-4 text-accent" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground leading-tight">{role.title}</h2>
            {(role.pay_range || role.shift) && (
              <p className="text-xs text-muted mt-0.5 line-clamp-1">
                {[role.pay_range, role.shift].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
        </div>
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0 ${role.active ? 'bg-success-bg text-success' : 'bg-warning-bg text-warning'}`}>
          {role.active ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-muted mb-4">
        <span>{role.behavioral_questions.length} behavioral question{role.behavioral_questions.length !== 1 ? 's' : ''}</span>
        <span>·</span>
        <span>{role.interview_count} interview{role.interview_count !== 1 ? 's' : ''}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {interviewLink && (
          <button
            onClick={onCopy}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border border-border bg-background text-muted hover:text-foreground hover:border-border-strong transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        )}
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border border-border bg-background text-muted hover:text-foreground hover:border-border-strong transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </button>
        {role.active && (
          <button
            onClick={onDeactivate}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border border-border bg-background text-muted hover:text-destructive hover:border-destructive/30 transition-colors ml-auto"
          >
            Deactivate
          </button>
        )}
      </div>
    </div>
  )
}
