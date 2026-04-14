'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Inbox, Columns2, Briefcase, TrendingUp, Settings } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Review', icon: Inbox, exact: true },
  { href: '/dashboard/pipeline', label: 'Pipeline', icon: Columns2 },
  { href: '/dashboard/roles', label: 'Roles', icon: Briefcase },
  { href: '/dashboard/proof', label: 'Proof', icon: TrendingUp },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

interface SidebarProps {
  userName?: string | null
  orgName?: string | null
}

export function Sidebar({ userName, orgName }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 z-30 h-screen w-60 border-r border-border bg-card flex flex-col">
      {/* Logo */}
      <div className="flex h-14 flex-col justify-center px-5 border-b border-border">
        <span className="text-sm font-bold tracking-tight text-foreground">Voxaris</span>
        <span className="text-xs text-muted">Hiring Intelligence</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex items-center gap-3 rounded-md px-3 h-9 text-sm transition-colors',
                isActive
                  ? 'bg-accent-bg text-accent font-medium'
                  : 'text-muted hover:bg-card-hover hover:text-foreground'
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-accent" />
              )}
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="border-t border-border px-4 py-3 flex items-center gap-3">
        <div className="h-7 w-7 rounded-full bg-accent text-white flex items-center justify-center text-xs font-semibold shrink-0">
          {userName ? userName.charAt(0).toUpperCase() : 'V'}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-foreground truncate">{userName ?? 'User'}</p>
          <p className="text-xs text-muted truncate">{orgName ?? ''}</p>
        </div>
      </div>
    </aside>
  )
}
