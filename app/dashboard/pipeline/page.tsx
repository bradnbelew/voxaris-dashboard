import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOrgId } from '@/lib/supabase/get-org-id'
import { KanbanBoard } from '@/components/dashboard/KanbanBoard'

export const dynamic = 'force-dynamic'

export default async function PipelinePage() {
  const orgId = await getOrgId()
  if (!orgId) redirect('/login')

  const supabase = createClient()
  const { data: interviewsRaw } = await supabase
    .from('interviews')
    .select('*, candidate:candidates(full_name, email, phone)')
    .eq('organization_id', orgId)
    .order('started_at', { ascending: false })

  const interviews = interviewsRaw ?? []

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pipeline</h1>
        <p className="text-sm text-muted mt-1">Every active candidate, where they stand right now.</p>
      </div>
      <KanbanBoard interviews={interviews} />
    </div>
  )
}
