import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null

  if (token_hash && type) {
    const supabase = createClient()
    const { data, error } = await supabase.auth.verifyOtp({ type, token_hash })

    if (!error && data.user) {
      if (type === 'invite') {
        const meta = data.user.user_metadata || {}
        const orgId = meta.organization_id
        if (orgId) {
          const admin = createAdminClient()
          await admin.from('profiles').upsert({
            id: data.user.id,
            organization_id: orgId,
            full_name: meta.full_name || data.user.email?.split('@')[0] || null,
            role: meta.role || 'admin',
          }, { onConflict: 'id' })
        }
        return NextResponse.redirect(new URL('/auth/set-password', request.url))
      }
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.redirect(new URL('/login?error=invalid_token', request.url))
}
