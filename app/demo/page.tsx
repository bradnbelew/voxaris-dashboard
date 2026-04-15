import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function DemoPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  // If already authenticated, go straight to dashboard
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  const loginFailed = searchParams.error === 'login_failed'
  const demoConfigured = !!(process.env.DEMO_EMAIL && process.env.DEMO_PASSWORD)

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Top bar */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-500">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 11L7 3L12 11" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4 8H10" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="text-sm font-semibold tracking-tight text-white">Voxaris</span>
        </div>
        <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
          Live Demo
        </span>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-2xl">
          {/* Industry badge */}
          <div className="mb-6 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-indigo-300">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
              Automotive Dealership Demo
            </span>
          </div>

          {/* Dealership name */}
          <h1 className="mb-3 text-center text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Prestige Auto Group
          </h1>
          <p className="mb-10 text-center text-lg text-slate-400 leading-relaxed">
            See how Voxaris AI pre-screens Sales Consultants, Service Advisors,
            and F&I Managers — so your team only talks to candidates worth their time.
          </p>

          {/* Stats */}
          <div className="mb-10 grid grid-cols-3 gap-4">
            {[
              { value: '10', label: 'Interviews completed' },
              { value: '5', label: 'Roles hiring' },
              { value: '82%', label: 'Avg AI fit score' },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-white/10 bg-white/5 p-5 text-center"
              >
                <p className="text-3xl font-bold text-white">{s.value}</p>
                <p className="mt-1 text-xs text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Feature list */}
          <ul className="mb-10 space-y-2.5">
            {[
              'AI-scored candidate profiles with fit scores, strengths, and concerns',
              'Resume analysis included in every AI evaluation',
              'Tavus video recording ready — will appear here once enabled',
              'Full transcript of every AI interview conversation',
              'Pipeline board: Pending → Reviewed → Shortlisted → Hired',
              'Multiple roles: Sales, Service Advisor, F&I, Parts, BDC',
              'Team notes and recruiter collaboration tools',
            ].map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm text-slate-300">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" fill="none" viewBox="0 0 16 16">
                  <path d="M3 8l4 4 6-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {f}
              </li>
            ))}
          </ul>

          {/* CTA */}
          {loginFailed && (
            <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-center text-sm text-red-400">
              Demo login failed. Please contact support.
            </p>
          )}

          {demoConfigured ? (
            <form action="/api/demo/login" method="POST">
              <button
                type="submit"
                className="w-full rounded-xl bg-indigo-600 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-500 active:bg-indigo-700"
              >
                Open Live Demo Dashboard →
              </button>
            </form>
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/5 px-6 py-5 text-center">
              <p className="text-sm text-slate-400">
                Demo not yet configured. Set{' '}
                <code className="rounded bg-white/10 px-1 py-0.5 text-xs text-slate-300">DEMO_EMAIL</code>,{' '}
                <code className="rounded bg-white/10 px-1 py-0.5 text-xs text-slate-300">DEMO_PASSWORD</code>, and{' '}
                <code className="rounded bg-white/10 px-1 py-0.5 text-xs text-slate-300">DEMO_SETUP_SECRET</code>{' '}
                in environment variables, then run the setup endpoint.
              </p>
            </div>
          )}

          {/* Candidate preview cards */}
          <div className="mt-12">
            <p className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-slate-500">
              Preview — Candidates in this demo
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {PREVIEW_CANDIDATES.map((c) => (
                <div
                  key={c.name}
                  className="rounded-lg border border-white/10 bg-white/5 p-3"
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-medium text-white">{c.name}</span>
                    <span
                      className={`text-xs font-bold ${
                        c.score >= 85 ? 'text-emerald-400' : c.score >= 65 ? 'text-amber-400' : 'text-slate-500'
                      }`}
                    >
                      {c.score > 0 ? `${c.score}/100` : '—'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{c.role}</p>
                  <span
                    className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      c.status === 'Hired'
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : c.status === 'Shortlisted'
                        ? 'bg-indigo-500/15 text-indigo-400'
                        : c.status === 'Reviewed'
                        ? 'bg-slate-500/20 text-slate-400'
                        : c.status === 'Rejected'
                        ? 'bg-red-500/15 text-red-400'
                        : 'bg-yellow-500/15 text-yellow-400'
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-8 text-center text-xs text-slate-600">
            All candidate data is simulated for demonstration purposes.
          </p>
        </div>
      </main>
    </div>
  )
}

const PREVIEW_CANDIDATES = [
  { name: 'Sandra M.', role: 'F&I Manager', score: 94, status: 'Hired' },
  { name: 'Rachel T.', role: 'Service Advisor', score: 91, status: 'Shortlisted' },
  { name: 'Marcus W.', role: 'Sales Consultant', score: 87, status: 'Shortlisted' },
  { name: 'Kevin P.', role: 'F&I Manager', score: 79, status: 'Reviewed' },
  { name: 'Tyler J.', role: 'Parts Counter', score: 76, status: 'Reviewed' },
  { name: 'Brittany C.', role: 'Sales Consultant', score: 74, status: 'Reviewed' },
  { name: 'Derek O.', role: 'Service Advisor', score: 71, status: 'Reviewed' },
  { name: 'Ashley R.', role: 'BDC Rep', score: 62, status: 'Pending' },
  { name: 'Jordan M.', role: 'Sales Consultant', score: 58, status: 'Pending' },
  { name: 'Brandon L.', role: 'Sales Consultant', score: 0, status: 'Rejected' },
]
