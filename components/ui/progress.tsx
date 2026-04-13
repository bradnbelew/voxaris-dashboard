import { cn } from '@/lib/utils'

interface ProgressProps {
  value: number
  max?: number
  className?: string
  barClassName?: string
}

export function Progress({ value, max = 100, className, barClassName }: ProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div className={cn('h-1.5 w-full rounded-full bg-border', className)}>
      <div
        className={cn('h-full rounded-full bg-accent transition-all', barClassName)}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
