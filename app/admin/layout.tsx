import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Building2, LayoutDashboard, ChevronRight } from 'lucide-react'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') redirect('/dashboard')

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <nav className="border-b border-border bg-card px-6 py-0 flex items-center justify-between h-14">
        <div className="flex items-center gap-1">
          <span className="text-sm font-bold text-foreground mr-4">Voxaris Admin</span>
          <Link
            href="/admin"
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted hover:text-foreground transition-colors rounded-md hover:bg-background"
          >
            <LayoutDashboard className="h-4 w-4" />
            Overview
          </Link>
          <Link
            href="/admin/clients"
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted hover:text-foreground transition-colors rounded-md hover:bg-background"
          >
            <Building2 className="h-4 w-4" />
            Clients
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-muted">{profile?.full_name ?? user.email}</span>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
          >
            Back to Dashboard
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </nav>
      <main className="mx-auto max-w-6xl px-6 py-8">
        {children}
      </main>
    </div>
  )
}
