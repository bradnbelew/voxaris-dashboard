'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut } from 'lucide-react'

interface HeaderProps {
  userName: string | null
  orgName: string | null
}

export function Header({ userName, orgName }: HeaderProps) {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background/80 backdrop-blur-none px-6">
      <div>
        {orgName && (
          <span className="text-sm text-muted">{orgName}</span>
        )}
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted">{userName}</span>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </header>
  )
}
