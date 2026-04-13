'use client'

import { cn } from '@/lib/utils'
import { AreaChart, Area, ResponsiveContainer } from 'recharts'

interface MetricCardProps {
  label: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  sparkData?: { value: number }[]
  className?: string
}

export function MetricCard({
  label,
  value,
  change,
  changeType = 'neutral',
  sparkData,
  className,
}: MetricCardProps) {
  return (
    <div className={cn('border border-border bg-card rounded p-4', className)}>
      <p className="text-xs text-muted font-medium uppercase tracking-wider">{label}</p>
      <div className="mt-2 flex items-end justify-between">
        <div>
          <p className="text-2xl font-semibold font-mono tracking-tight">{value}</p>
          {change && (
            <p
              className={cn('mt-1 text-xs', {
                'text-success': changeType === 'positive',
                'text-destructive': changeType === 'negative',
                'text-muted': changeType === 'neutral',
              })}
            >
              {change}
            </p>
          )}
        </div>
        {sparkData && sparkData.length > 1 && (
          <div className="h-8 w-20">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData}>
                <defs>
                  <linearGradient id="sparkGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0070f3" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#0070f3" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#0070f3"
                  strokeWidth={1.5}
                  fill="url(#sparkGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
