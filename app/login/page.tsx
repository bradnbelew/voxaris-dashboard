import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-border bg-card shadow-sm px-8 py-10 space-y-8">
          <div className="text-center">
            <h1 className="text-xl font-bold tracking-tight text-foreground">Voxaris</h1>
            <p className="mt-1 text-sm text-muted">Hiring Intelligence</p>
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground mb-6">Sign in to your account</h2>
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  )
}
