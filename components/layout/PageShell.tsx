import { DashboardShell } from './DashboardShell'

interface PageShellProps {
  children: React.ReactNode
  userName?: string | null
  orgName?: string | null
}

export function PageShell({ children, userName, orgName }: PageShellProps) {
  return (
    <DashboardShell userName={userName} orgName={orgName}>
      {children}
    </DashboardShell>
  )
}
