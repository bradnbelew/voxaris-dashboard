import { Sidebar } from './Sidebar'

interface PageShellProps {
  children: React.ReactNode
  userName?: string | null
  orgName?: string | null
}

export function PageShell({ children, userName, orgName }: PageShellProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar userName={userName} orgName={orgName} />
      <main className="flex-1 ml-60 min-h-screen">
        {children}
      </main>
    </div>
  )
}
