'use client'

import { useState } from 'react'
import Link from 'next/link'

interface OnboardResult {
  ok: boolean
  org: { id: string; name: string; slug: string }
  token: string
  interview_link: string
  invite_sent: boolean
  invite_error: string | null
}

export default function NewClientPage() {
  const [companyName, setCompanyName] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<OnboardResult | null>(null)
  const [copied, setCopied] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/admin/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: companyName,
          contact_name: contactName,
          contact_email: contactEmail,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong')
        setLoading(false)
        return
      }

      setResult(data)
    } catch {
      setError('Network error — please try again')
    }

    setLoading(false)
  }

  function handleReset() {
    setCompanyName('')
    setContactName('')
    setContactEmail('')
    setError(null)
    setResult(null)
    setCopied(false)
  }

  async function handleCopy() {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result.interview_link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: select input
    }
  }

  if (result) {
    return (
      <div className="max-w-lg space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Client onboarded successfully</h1>
          <p className="text-sm text-muted mt-1">
            {result.org.name} has been created.{' '}
            {result.invite_sent
              ? `An invite email was sent to ${contactEmail}.`
              : `Invite email failed: ${result.invite_error ?? 'unknown error'}`}
          </p>
        </div>

        <div className="rounded border border-border bg-card p-6 space-y-4">
          <div>
            <p className="text-xs font-medium text-muted uppercase tracking-wider mb-2">Interview Link</p>
            <p className="text-xs text-muted mb-2">Share this link with the client to use in their job postings.</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded border border-border bg-background px-3 py-2 text-xs font-mono text-foreground break-all">
                {result.interview_link}
              </code>
              <button
                onClick={handleCopy}
                className="shrink-0 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-card-hover transition-colors"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="border-t border-border pt-4 space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Organization ID</span>
              <span className="font-mono text-xs">{result.org.id}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Slug</span>
              <span className="font-mono text-xs">{result.org.slug}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Token</span>
              <span className="font-mono text-xs">{result.token}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleReset}
            className="rounded-lg bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent/90 transition-colors"
          >
            Onboard Another
          </button>
          <Link
            href="/admin/clients"
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            View All Clients →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Onboard Client</h1>
        <p className="text-sm text-muted mt-1">Create a new organization and send an invite to the admin contact.</p>
      </div>

      <div className="rounded border border-border bg-card p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">
              Company Name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              placeholder="Acme Staffing Inc."
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Contact Name</label>
            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Jane Smith"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">
              Contact Email <span className="text-destructive">*</span>
            </label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              required
              placeholder="jane@acmestaffing.com"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex items-center gap-4 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Onboard Client'}
            </button>
            <Link href="/admin/clients" className="text-sm text-muted hover:text-foreground transition-colors">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
