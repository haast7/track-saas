"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ChartDataPoint {
  date: string
  pageviews: number
  clicks: number
  entradas: number
  saidas: number
}

interface ChartProps {
  data: ChartDataPoint[]
}

export function DashboardChart({ data }: ChartProps) {
  // Formatar datas para exibição
  const formattedData = data.map(item => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolução Temporal</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="pageviews" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              name="Pageviews"
            />
            <Line 
              type="monotone" 
              dataKey="clicks" 
              stroke="#22c55e" 
              strokeWidth={2}
              name="Clicks"
            />
            <Line 
              type="monotone" 
              dataKey="entradas" 
              stroke="#3b82f6" 
              strokeWidth={2}
              name="Entradas"
            />
            <Line 
              type="monotone" 
              dataKey="saidas" 
              stroke="#ef4444" 
              strokeWidth={2}
              name="Saídas"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}




