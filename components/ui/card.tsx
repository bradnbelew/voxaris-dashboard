import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={cn('border border-border bg-card rounded p-4', className)}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: CardProps) {
  return (
    <div className={cn('mb-3', className)}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={cn('text-base font-semibold text-foreground', className)}>
      {children}
    </h3>
  )
}

export function CardContent({ children, className }: CardProps) {
  return (
    <div className={cn('', className)}>
      {children}
    </div>
  )
}
