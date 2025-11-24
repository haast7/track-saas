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
}

interface DashboardChartProps {
  data: ChartDataPoint[]
}

// Tooltip customizado com glassmorphism
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="rounded-lg p-3 border shadow-lg"
        style={{
          background: "rgba(19, 19, 26, 0.85)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderColor: "rgba(31, 31, 41, 0.6)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 15px rgba(168, 85, 247, 0.2)",
        }}
      >
        <p className="text-sm font-medium text-[#94A3B8] mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p
            key={index}
            className="text-sm mb-1"
            style={{ color: entry.color }}
          >
            {entry.name}:{" "}
            <span className="font-bold text-[#F1F5F9]">
              {entry.value.toLocaleString("pt-BR")}
            </span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function DashboardChart({ data }: DashboardChartProps) {
  // Formatar datas para exibição
  const formattedData = data.map((item) => ({
    ...item,
    date: new Date(item.date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    }),
  }))

  return (
    <Card className="border-[#1F1F29] bg-[#13131A] hover:border-primary/50 transition-fast">
      <CardHeader>
        <CardTitle className="text-secondary">Evolução Temporal</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={formattedData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#1F1F29"
              opacity={0.5}
            />
            <XAxis
              dataKey="date"
              stroke="#94A3B8"
              tick={{ fill: "#94A3B8", fontSize: 12 }}
              axisLine={{ stroke: "#1F1F29" }}
            />
            <YAxis
              stroke="#94A3B8"
              tick={{ fill: "#94A3B8", fontSize: 12 }}
              axisLine={{ stroke: "#1F1F29" }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ color: "#94A3B8" }}
              iconType="line"
            />
            <Line
              type="monotone"
              dataKey="pageviews"
              stroke="#A855F7"
              strokeWidth={2}
              dot={{
                fill: "#0B0B0E",
                stroke: "#22D3EE",
                strokeWidth: 2,
                r: 4,
              }}
              activeDot={{
                r: 6,
                fill: "#0B0B0E",
                stroke: "#22D3EE",
                strokeWidth: 2,
              }}
              name="Pageviews"
            />
            <Line
              type="monotone"
              dataKey="clicks"
              stroke="#A855F7"
              strokeWidth={2}
              dot={{
                fill: "#0B0B0E",
                stroke: "#22D3EE",
                strokeWidth: 2,
                r: 4,
              }}
              activeDot={{
                r: 6,
                fill: "#0B0B0E",
                stroke: "#22D3EE",
                strokeWidth: 2,
              }}
              name="Clicks"
            />
            <Line
              type="monotone"
              dataKey="entradas"
              stroke="#A855F7"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{
                fill: "#0B0B0E",
                stroke: "#22D3EE",
                strokeWidth: 2,
                r: 4,
              }}
              activeDot={{
                r: 6,
                fill: "#0B0B0E",
                stroke: "#22D3EE",
                strokeWidth: 2,
              }}
              name="Entradas"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
