import Image from 'next/image'
import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-border bg-card shadow-sm px-8 py-10 space-y-8">
          <div className="flex flex-col items-center">
            <Image
              src="/logo.png"
              alt="Voxaris AI"
              width={180}
              height={58}
              className="object-contain"
              priority
            />
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
