import { Sidebar } from "@/components/sidebar"
import { UpgradeBlockWrapper } from "@/components/dashboard/upgrade-block-wrapper"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { isUserBlocked } from "@/lib/billing"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Verificar se o usuário está bloqueado (sem plano ativo ou expirado/cancelado)
  let blocked = false
  if (user) {
    blocked = await isUserBlocked(user.id)
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-64 overflow-y-auto bg-background relative">
        {children}
        <UpgradeBlockWrapper blocked={blocked} />
      </main>
    </div>
  )
}

