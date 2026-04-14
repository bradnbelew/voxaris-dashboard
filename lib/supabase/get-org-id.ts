import { createClient } from '@/lib/supabase/server'

/**
 * Returns the organization_id for the currently authenticated user.
 * Uses the profiles table to look up org membership.
 * Returns null if user is not logged in or has no profile.
 */
export async function getOrgId(): Promise<string | null> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  return profile?.organization_id ?? null
}
