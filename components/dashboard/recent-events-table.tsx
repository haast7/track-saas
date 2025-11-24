"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface RecentEvent {
  id: string
  type: "pageview" | "click" | "enter" | "exit"
  date: string
  url: string | null
  button: string | null
  session: string | null
}

interface RecentEventsTableProps {
  events: RecentEvent[]
}

const eventBadges = {
  pageview: {
    label: "PV",
    bgColor: "rgba(59, 130, 246, 0.2)", // azul
    borderColor: "rgba(59, 130, 246, 0.5)",
    textColor: "#3B82F6",
    glow: "0 0 10px rgba(59, 130, 246, 0.4)",
  },
  click: {
    label: "CLICK",
    bgColor: "rgba(168, 85, 247, 0.2)", // roxo
    borderColor: "rgba(168, 85, 247, 0.5)",
    textColor: "#A855F7",
    glow: "0 0 10px rgba(168, 85, 247, 0.4)",
  },
  enter: {
    label: "ENTER",
    bgColor: "rgba(34, 197, 94, 0.2)", // verde
    borderColor: "rgba(34, 197, 94, 0.5)",
    textColor: "#22C55E",
    glow: "0 0 10px rgba(34, 197, 94, 0.4)",
  },
  exit: {
    label: "EXIT",
    bgColor: "rgba(239, 68, 68, 0.2)", // vermelho
    borderColor: "rgba(239, 68, 68, 0.5)",
    textColor: "#EF4444",
    glow: "0 0 10px rgba(239, 68, 68, 0.4)",
  },
}

export function RecentEventsTable({ events }: RecentEventsTableProps) {
  if (events.length === 0) {
    return (
      <Card className="border-[#1F1F29] bg-[#13131A]">
        <CardHeader>
          <CardTitle className="text-[#F1F5F9]">Eventos Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-[#94A3B8]">
            Nenhum evento encontrado
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-[#1F1F29] bg-[#13131A]">
      <CardHeader>
        <CardTitle className="text-[#F1F5F9]">Eventos Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1F1F29]">
                <th className="text-left py-3 px-4 text-sm font-medium text-[#94A3B8]">
                  Tipo
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#94A3B8]">
                  Data
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#94A3B8]">
                  URL ou Botão
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#94A3B8]">
                  Sessão
                </th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => {
                const badge = eventBadges[event.type]
                const urlOrButton = event.url || event.button || null

                return (
                  <tr
                    key={event.id}
                    className={cn(
                      "border-b border-[#1F1F29]/50",
                      "hover:bg-[#1F1F29]/30",
                      "transition-all duration-200",
                      "hover:shadow-[0_0_8px_rgba(168,85,247,0.2)]"
                    )}
                  >
                    <td className="py-3 px-4">
                      <span
                        className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold"
                        style={{
                          backgroundColor: badge.bgColor,
                          border: `1px solid ${badge.borderColor}`,
                          color: badge.textColor,
                          boxShadow: badge.glow,
                        }}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-[#F1F5F9]">
                      {new Date(event.date).toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3 px-4 text-sm text-[#F1F5F9]">
                      {urlOrButton ? (
                        <span
                          className="truncate max-w-xs block"
                          title={urlOrButton}
                        >
                          {urlOrButton}
                        </span>
                      ) : (
                        <span className="text-[#94A3B8]/50">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-[#F1F5F9]">
                      {event.session ? (
                        <span
                          className="font-mono text-xs truncate max-w-xs block text-[#94A3B8]"
                          title={event.session}
                        >
                          {event.session.slice(0, 8)}...
                        </span>
                      ) : (
                        <span className="text-[#94A3B8]/50">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
