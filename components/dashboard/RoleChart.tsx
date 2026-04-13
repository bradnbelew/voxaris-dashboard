'use client'

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts'

interface RoleChartProps {
  data: { role: string; count: number }[]
}

export function RoleChart({ data }: RoleChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-muted">
        No data available
      </div>
    )
  }

  return (
    <div className="border border-border rounded bg-card p-4">
      <h3 className="text-sm font-semibold mb-4">Interviews by Role</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16 }}>
            <XAxis
              type="number"
              tick={{ fill: '#666666', fontSize: 11, fontFamily: 'var(--font-mono)' }}
              axisLine={{ stroke: '#222222' }}
              tickLine={false}
            />
            <YAxis
              dataKey="role"
              type="category"
              tick={{ fill: '#a1a1a1', fontSize: 12, fontFamily: 'var(--font-mono)' }}
              axisLine={false}
              tickLine={false}
              width={100}
            />
            <Bar dataKey="count" radius={[0, 2, 2, 0]} maxBarSize={20}>
              {data.map((_, idx) => (
                <Cell key={idx} fill="#0070f3" fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
