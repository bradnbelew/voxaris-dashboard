'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { Menu, X } from 'lucide-react'

function MobileLogo() {
  const [imgFailed, setImgFailed] = useState(false)
  if (!imgFailed) {
    return (
      <img
        src="/logo.png"
        alt="Voxaris AI"
        className="h-8 w-auto object-contain"
        onError={() => setImgFailed(true)}
      />
    )
  }
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-violet-600 to-indigo-600 shrink-0">
        <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
          <path d="M2 11L7 3L12 11" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M4 8H10" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      </div>
      <span className="text-sm font-bold tracking-tight text-foreground">Voxaris AI</span>
    </div>
  )
}

interface DashboardShellProps {
  children: React.ReactNode
  userName?: string | null
  orgName?: string | null
}

export function DashboardShell({ children, userName, orgName }: DashboardShellProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Close drawer on navigation
  useEffect(() => { setOpen(false) }, [pathname])

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <div className="flex min-h-screen bg-background">

      {/* ── Desktop sidebar ─────────────────────────────────── */}
      <div className="hidden lg:block">
        <Sidebar userName={userName} orgName={orgName} />
      </div>

      {/* ── Mobile sidebar overlay ───────────────────────────── */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          {/* Drawer */}
          <div className="relative z-10 w-64 h-full shadow-2xl">
            <Sidebar userName={userName} orgName={orgName} />
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-3 h-8 w-8 flex items-center justify-center rounded-lg text-muted hover:text-foreground hover:bg-background transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Mobile top bar ────────────────────────────────────── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-white border-b border-border flex items-center px-4 gap-3 shadow-sm">
        <button
          onClick={() => setOpen(true)}
          className="h-9 w-9 flex items-center justify-center rounded-lg text-muted hover:text-foreground hover:bg-background transition-colors shrink-0"
        >
          <Menu className="h-5 w-5" />
        </button>
        <MobileLogo />
      </header>

      {/* ── Main content ─────────────────────────────────────── */}
      <main className="flex-1 lg:ml-60 min-h-screen pt-14 lg:pt-0">
        {children}
      </main>

    </div>
  )
}
