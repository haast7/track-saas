"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface RetentionData {
  date: string
  day0: number
  day1: number
  day2: number
  day3: number
  day4: number
  day5: number
  day6: number
  day7: number
}

interface RetentionTableProps {
  data: RetentionData[]
}

export function RetentionTable({ data }: RetentionTableProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Retenção Diária</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Nenhum dado disponível</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Retenção Diária</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-2 font-medium">Data</th>
                <th className="text-right p-2 font-medium">Dia 0</th>
                <th className="text-right p-2 font-medium">Dia 1</th>
                <th className="text-right p-2 font-medium">Dia 2</th>
                <th className="text-right p-2 font-medium">Dia 3</th>
                <th className="text-right p-2 font-medium">Dia 4</th>
                <th className="text-right p-2 font-medium">Dia 5</th>
                <th className="text-right p-2 font-medium">Dia 6</th>
                <th className="text-right p-2 font-medium">Dia 7</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.date} className="border-b border-border hover:bg-accent/50">
                  <td className="p-2">
                    {new Date(row.date).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="text-right p-2">{row.day0}</td>
                  <td className="text-right p-2">{row.day1}</td>
                  <td className="text-right p-2">{row.day2}</td>
                  <td className="text-right p-2">{row.day3}</td>
                  <td className="text-right p-2">{row.day4}</td>
                  <td className="text-right p-2">{row.day5}</td>
                  <td className="text-right p-2">{row.day6}</td>
                  <td className="text-right p-2">{row.day7}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}




