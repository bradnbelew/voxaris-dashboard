'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Settings,
  UserPlus,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/interviews', label: 'Interviews', icon: Users },
  { href: '/dashboard/team', label: 'Team', icon: UserPlus },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 z-30 h-screen w-60 border-r border-border bg-background flex flex-col">
      <div className="flex h-14 items-center px-4 border-b border-border">
        <Link href="/dashboard" className="text-base font-semibold tracking-tight">
          Voxaris
        </Link>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-sm px-3 h-8 text-sm transition-colors',
                isActive
                  ? 'bg-card-hover text-foreground'
                  : 'text-muted hover:bg-card-hover hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-border px-4 py-3">
        <p className="text-xs text-muted-foreground font-mono">v0.1.0</p>
      </div>
    </aside>
  )
}
