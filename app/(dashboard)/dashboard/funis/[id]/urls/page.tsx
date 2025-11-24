import { Suspense } from "react"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { FunnelUrlsContent } from "@/components/dashboard/funnel-urls-content"
import { FunnelUrlsLoading } from "@/components/dashboard/funnel-urls-loading"

async function FunnelUrlsPageContent({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Buscar funil e verificar se pertence ao usuário
  const { data: funnel, error } = await supabase
    .from("funnels")
    .select("id, name, user_id")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single()

  if (error || !funnel) {
    notFound()
  }

  return <FunnelUrlsContent funnelId={params.id} funnelName={funnel.name} />
}

export default function FunnelUrlsPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<FunnelUrlsLoading />}>
      <FunnelUrlsPageContent params={params} />
    </Suspense>
  )
}




