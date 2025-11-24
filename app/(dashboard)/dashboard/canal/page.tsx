import { Suspense } from "react"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ChannelForm } from "@/components/dashboard/channel-form"
import { ChannelLoading } from "@/components/dashboard/channel-loading"

async function ChannelContent() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Buscar canal existente do usuário
  const { data: channel } = await supabase
    .from("telegram_channels")
    .select("*")
    .eq("user_id", user.id)
    .limit(1)
    .single()

  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
          Canal do Telegram
        </h1>
        <p className="text-muted-foreground">
          Configure seu canal e conecte o webhook do Telegram
        </p>
      </div>

      <ChannelForm initialData={channel || null} />
    </div>
  )
}

export default function CanalPage() {
  return (
    <Suspense fallback={<ChannelLoading />}>
      <ChannelContent />
    </Suspense>
  )
}
