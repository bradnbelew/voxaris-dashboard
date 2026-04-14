'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

interface CopyLinkButtonProps {
  url: string
  label?: string
}

export function CopyLinkButton({ url, label = 'Copy' }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: do nothing silently
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-foreground transition-colors"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-success" />
          <span className="text-success">Copied!</span>
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          {label}
        </>
      )}
    </button>
  )
}
