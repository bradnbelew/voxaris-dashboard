'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface InterviewTrendChartProps {
  data: { week: string; count: number }[]
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-border rounded-xl px-4 py-2.5 shadow-lg text-xs">
      <p className="font-semibold text-foreground mb-0.5">{label}</p>
      <p className="text-muted">{payload[0].value} interview{payload[0].value !== 1 ? 's' : ''}</p>
    </div>
  )
}

export function InterviewTrendChart({ data }: InterviewTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }} barCategoryGap="35%">
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity={1} />
            <stop offset="100%" stopColor="#6366f1" stopOpacity={0.8} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e8e3f5" vertical={false} />
        <XAxis
          dataKey="week"
          tick={{ fontSize: 11, fill: '#7c6fa0' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#7c6fa0' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f5f3ff' }} />
        <Bar dataKey="count" fill="url(#barGradient)" radius={[6, 6, 0, 0]} name="Interviews" />
      </BarChart>
    </ResponsiveContainer>
  )
}
