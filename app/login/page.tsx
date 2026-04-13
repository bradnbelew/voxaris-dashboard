import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-8 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Voxaris</h1>
          <p className="mt-2 text-sm text-muted">
            Sign in to your recruiter dashboard
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
