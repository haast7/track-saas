"use client"

import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface MetricCardProps {
  title: string
  value: string | number
  icon?: LucideIcon
  description?: string
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  description,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "group relative rounded-lg p-[1px]",
        "bg-gradient-to-br from-primary/0 via-primary/0 to-secondary/0",
        "transition-all duration-200",
        "hover:from-primary/30 hover:via-primary/20 hover:to-secondary/30",
        "hover:shadow-[0_0_15px_#A855F755]",
        "animate-in fade-in duration-300"
      )}
    >
      {/* Card interno com background */}
      <div className="relative rounded-lg bg-[#13131A] border border-[#1F1F29] h-full">
        {/* Conteúdo */}
        <div className="p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              {title}
            </h3>
            {Icon && (
              <Icon
                className={cn(
                  "h-5 w-5 text-primary transition-all duration-200",
                  "group-hover:scale-110 group-hover:text-secondary",
                  "drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]"
                )}
              />
            )}
          </div>
          <div className="pt-0">
            <div className="text-4xl font-extrabold mb-1 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {typeof value === "number"
                ? value.toLocaleString("pt-BR")
                : value}
            </div>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
