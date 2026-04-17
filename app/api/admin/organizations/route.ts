import { createAdminClient } from '@/lib/supabase/admin'
import { isSuperAdmin } from '@/lib/supabase/is-super-admin'

export async function GET() {
  if (!(await isSuperAdmin())) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createAdminClient()

  const { data: orgs, error } = await admin
    .from('organizations')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })

  // For each org, get interview count and token info
  const enriched = await Promise.all(
    (orgs ?? []).map(async (org) => {
      const [{ count: interviewCount }, { data: tokens }] = await Promise.all([
        admin.from('interviews').select('*', { count: 'exact', head: true }).eq('organization_id', org.id),
        admin.from('client_tokens').select('token, active, created_at').eq('organization_id', org.id),
      ])
      return {
        ...org,
        interview_count: interviewCount ?? 0,
        tokens: tokens ?? [],
      }
    })
  )

  return Response.json(enriched)
}
