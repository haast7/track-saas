"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function LogoutPage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function handleLogout() {
      await supabase.auth.signOut()
      router.push("/auth/login")
      router.refresh()
    }

    handleLogout()
  }, [supabase, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-muted-foreground">Saindo...</p>
    </div>
  )
}




