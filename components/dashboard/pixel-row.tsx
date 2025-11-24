"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Eye, EyeOff } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface PixelRowProps {
  pixel: {
    id: string
    name: string
    pixel_id: string
    token: string | null
    platform: string | null
    created_at: string
  }
}

export function PixelRow({ pixel }: PixelRowProps) {
  const [showToken, setShowToken] = useState(false)

  return (
    <tr className="border-b border-[#1F1F29]/50 hover:bg-[#1F1F29]/30 transition-all duration-200 hover:shadow-[0_0_8px_rgba(168,85,247,0.2)]">
      <td className="py-3 px-4">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-[#F1F5F9]">
            {pixel.name}
          </span>
          {pixel.platform && (
            <span className="text-xs text-[#94A3B8] mt-1">
              {pixel.platform}
            </span>
          )}
        </div>
      </td>
      <td className="py-3 px-4">
        <span className="text-sm text-[#F1F5F9] font-mono">
          {pixel.pixel_id}
        </span>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          {pixel.token ? (
            <>
              <span className="text-sm text-[#94A3B8] font-mono">
                {showToken ? pixel.token : `${pixel.token.slice(0, 8)}...`}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-[#94A3B8] hover:text-[#F1F5F9]"
                onClick={() => setShowToken(!showToken)}
              >
                {showToken ? (
                  <EyeOff className="h-3 w-3" />
                ) : (
                  <Eye className="h-3 w-3" />
                )}
              </Button>
            </>
          ) : (
            <span className="text-sm text-[#94A3B8]">—</span>
          )}
        </div>
      </td>
      <td className="py-3 px-4 text-sm text-[#F1F5F9]">
        {format(
          new Date(pixel.created_at),
          "dd 'de' MMMM 'de' yyyy",
          { locale: ptBR }
        )}
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-secondary hover:text-secondary hover:bg-secondary/10 hover:shadow-[0_0_8px_rgba(34,211,238,0.3)]"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 hover:shadow-[0_0_8px_rgba(239,68,68,0.3)]"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  )
}




