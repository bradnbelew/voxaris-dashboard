import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

/**
 * POST /api/demo/login
 * Signs in as the demo user and redirects to the dashboard.
 * Requires DEMO_EMAIL and DEMO_PASSWORD environment variables.
 */
export async function POST(request: Request) {
  const email = process.env.DEMO_EMAIL
  const password = process.env.DEMO_PASSWORD

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Demo is not configured. Contact the site administrator.' },
      { status: 503 }
    )
  }

  const cookieStore = cookies()
  const cookiesToSet: { name: string; value: string; options: CookieOptions }[] = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(toSet) {
          // Capture cookies to apply to the redirect response
          cookiesToSet.push(...toSet)
        },
      },
    }
  )

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    console.error('[demo/login] Sign-in failed:', error.message)
    const failUrl = new URL('/demo', request.url)
    failUrl.searchParams.set('error', 'login_failed')
    return NextResponse.redirect(failUrl)
  }

  const response = NextResponse.redirect(new URL('/dashboard', request.url))

  // Apply auth cookies to the redirect response
  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options)
  })

  return response
}
