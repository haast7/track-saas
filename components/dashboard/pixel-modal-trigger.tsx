"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { PixelModal } from "./pixel-modal"

export function PixelModalTrigger() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        className="group"
        onClick={() => setOpen(true)}
      >
        <Plus className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
        Adicionar Pixel
      </Button>
      <PixelModal open={open} onOpenChange={setOpen} />
    </>
  )
}




