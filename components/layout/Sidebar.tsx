'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Inbox, Columns2, Briefcase, BarChart2, Settings, LogOut, List, Package } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Review', icon: Inbox, exact: true },
  { href: '/dashboard/interviews', label: 'Interviews', icon: List },
  { href: '/dashboard/pipeline', label: 'Pipeline', icon: Columns2 },
  { href: '/dashboard/roles', label: 'Roles', icon: Briefcase },
  { href: '/dashboard/proof', label: 'Analytics', icon: BarChart2 },
  { href: '/dashboard/billing', label: 'Products', icon: Package },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

function LogoMark() {
  const [imgFailed, setImgFailed] = useState(false)

  if (!imgFailed) {
    return (
      <img
        src="/logo.png"
        alt="Voxaris AI"
        className="w-full h-auto object-contain object-left max-h-[100px]"
        onError={() => setImgFailed(true)}
      />
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <p className="text-xl font-bold tracking-tight text-foreground leading-none">Voxaris AI</p>
      <p className="text-xs text-muted">Hiring Intelligence</p>
    </div>
  )
}

interface SidebarProps {
  userName?: string | null
  orgName?: string | null
}

export function Sidebar({ userName, orgName }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    await fetch('/api/auth/signout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="fixed left-0 top-0 z-30 h-screen w-64 border-r border-border bg-white flex flex-col shadow-sm">
      {/* Logo */}
      <div className="flex h-36 items-center px-5 border-b border-border">
        <LogoMark />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex items-center gap-3 rounded-lg px-3 h-10 text-sm transition-colors',
                isActive
                  ? 'bg-accent-bg text-accent font-semibold'
                  : 'text-muted hover:bg-[#f5f3ff] hover:text-foreground'
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r bg-accent" />
              )}
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="border-t border-border px-4 py-3 flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 text-white flex items-center justify-center text-xs font-semibold shrink-0">
          {userName ? userName.charAt(0).toUpperCase() : 'V'}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-foreground truncate">{userName ?? 'User'}</p>
          <p className="text-xs text-muted truncate">{orgName ?? ''}</p>
        </div>
        <button
          onClick={handleSignOut}
          title="Sign out"
          className="shrink-0 text-muted hover:text-foreground transition-colors p-1"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  )
}
