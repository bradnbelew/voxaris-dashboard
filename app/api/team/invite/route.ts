import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getOrgId } from '@/lib/supabase/get-org-id'

export async function POST(request: Request) {
  const supabase = createClient()

  // Must be authenticated
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Must belong to an org
  const orgId = await getOrgId()
  if (!orgId) {
    return Response.json({ error: 'No organization found for user' }, { status: 403 })
  }

  // Must be admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return Response.json({ error: 'Only admins can invite team members' }, { status: 403 })
  }

  let body: { email?: string; role?: string; organization_id?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { email, role } = body

  if (!email) {
    return Response.json({ error: 'Email is required' }, { status: 400 })
  }

  const validRoles = ['admin', 'recruiter', 'viewer']
  const inviteRole = validRoles.includes(role ?? '') ? role! : 'recruiter'

  // Use admin client to invite user via Supabase Auth
  const supabaseAdmin = createAdminClient()

  const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
    email,
    {
      data: {
        organization_id: orgId,
        role: inviteRole,
      },
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm`,
    }
  )

  if (inviteError) {
    console.error('[invite] Supabase invite error:', inviteError.message)
    return Response.json({ error: inviteError.message }, { status: 500 })
  }

  // Create their profile row immediately so they're linked to the org
  // (Supabase invite creates the auth user; we create their profile)
  if (inviteData?.user) {
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: inviteData.user.id,
        organization_id: orgId,
        full_name: email.split('@')[0], // placeholder until they update it
        role: inviteRole,
      }, { onConflict: 'id' })

    if (profileError) {
      console.error('[invite] Profile creation error:', profileError.message)
      // Don't fail — the auth invite was sent, profile can be created on first login
    }
  }

  return Response.json({ ok: true, email })
}
