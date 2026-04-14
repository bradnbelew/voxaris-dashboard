import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { randomBytes } from 'crypto'

async function isSuperAdmin(): Promise<boolean> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  return profile?.role === 'super_admin'
}

export async function POST(request: NextRequest) {
  if (!(await isSuperAdmin())) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: { company_name?: string; contact_email?: string; contact_name?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.company_name?.trim()) return Response.json({ error: 'company_name is required' }, { status: 400 })
  if (!body.contact_email?.trim()) return Response.json({ error: 'contact_email is required' }, { status: 400 })

  const admin = createAdminClient()
  const slug = body.company_name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  // 1. Create organization
  const { data: org, error: orgError } = await admin
    .from('organizations')
    .insert({ name: body.company_name.trim(), slug })
    .select()
    .single()

  if (orgError) {
    return Response.json({ error: `Failed to create organization: ${orgError.message}` }, { status: 500 })
  }

  // 2. Generate client token
  const token = 'tk_' + randomBytes(16).toString('hex')
  const { error: tokenError } = await admin
    .from('client_tokens')
    .insert({ token, organization_id: org.id, active: true })

  if (tokenError) {
    return Response.json({ error: `Failed to create token: ${tokenError.message}` }, { status: 500 })
  }

  // 3. Send invite email
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://voxaris-dashboard.vercel.app'
  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(
    body.contact_email.trim(),
    {
      redirectTo: `${appUrl}/auth/confirm`,
      data: {
        organization_id: org.id,
        full_name: body.contact_name?.trim() || '',
        role: 'admin',
      },
    }
  )

  const agentUrl = process.env.NEXT_PUBLIC_VIDEO_AGENT_URL || 'https://your-agent-url.vercel.app'
  const interviewLink = `${agentUrl}/staffing?client=${token}`

  return Response.json({
    ok: true,
    org,
    token,
    interview_link: interviewLink,
    invite_sent: !inviteError,
    invite_error: inviteError?.message || null,
  }, { status: 201 })
}
