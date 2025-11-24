"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { PostbackModal } from "@/components/dashboard/postback-modal"

export function PostbackModalTrigger() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-primary text-primary-foreground hover:bg-primary/90 neon-glow-primary hover:shadow-[0_0_15px_#A855F755] transition-all duration-200"
      >
        <Plus className="h-4 w-4 mr-2" />
        Adicionar Postback
      </Button>
      <PostbackModal open={open} onOpenChange={setOpen} />
    </>
  )
}




