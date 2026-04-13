'use client'

import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'

interface VolumeChartProps {
  data: { date: string; count: number }[]
}

export function VolumeChart({ data }: VolumeChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-muted">
        No data available
      </div>
    )
  }

  return (
    <div className="border border-border rounded bg-card p-4">
      <h3 className="text-sm font-semibold mb-4">Daily Interview Volume</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0070f3" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#0070f3" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tick={{ fill: '#666666', fontSize: 10, fontFamily: 'var(--font-mono)' }}
              axisLine={{ stroke: '#222222' }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: '#666666', fontSize: 10, fontFamily: 'var(--font-mono)' }}
              axisLine={false}
              tickLine={false}
              width={30}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#111111',
                border: '1px solid #222222',
                borderRadius: '4px',
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
                color: '#ededed',
              }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#0070f3"
              strokeWidth={1.5}
              fill="url(#volumeGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
