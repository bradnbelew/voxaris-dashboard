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
    <div className="min-h-screen">
      <div className="relative overflow-hidden bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 px-8 py-8">
        <div className="pointer-events-none absolute -top-10 -right-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-6 left-1/3 h-32 w-32 rounded-full bg-indigo-300/20 blur-2xl" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-widest text-violet-200 mb-1">Hiring Pipeline</p>
          <h1 className="text-2xl font-bold text-white">Pipeline Board</h1>
          <p className="mt-1 text-sm text-violet-200">Every active candidate, where they stand right now.</p>
        </div>
      </div>
      <div className="p-8">
        <KanbanBoard interviews={interviews} />
      </div>
    </div>
  )
}
