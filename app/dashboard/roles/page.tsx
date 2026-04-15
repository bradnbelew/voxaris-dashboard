import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOrgId } from '@/lib/supabase/get-org-id'
import type { Role } from '@/lib/types'
import { RolesClient } from './RolesClient'

export const dynamic = 'force-dynamic'

export default async function RolesPage() {
  const orgId = await getOrgId()
  if (!orgId) redirect('/login')

  const supabase = createClient()

  const [{ data: rolesRaw }, { data: tokensRaw }] = await Promise.all([
    supabase
      .from('roles')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false }),
    supabase
      .from('client_tokens')
      .select('token')
      .eq('organization_id', orgId)
      .eq('active', true)
      .limit(1),
  ])

  const roles: Role[] = rolesRaw ?? []
  const activeToken = tokensRaw?.[0]?.token ?? null
  const videoAgentUrl = process.env.NEXT_PUBLIC_VIDEO_AGENT_URL ?? ''

  return (
    <RolesClient
      initialRoles={roles}
      activeToken={activeToken}
      videoAgentUrl={videoAgentUrl}
    />
  )
}
