import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageShell } from '@/components/layout/PageShell'
import { Header } from '@/components/layout/Header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, organization_id')
    .eq('id', user.id)
    .single()

  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', profile?.organization_id)
    .single()

  return (
    <PageShell>
      <Header userName={profile?.full_name ?? user.email ?? null} orgName={org?.name ?? null} />
      <div className="p-6">
        {children}
      </div>
    </PageShell>
  )
}
