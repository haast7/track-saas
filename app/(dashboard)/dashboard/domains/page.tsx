import { Suspense } from "react"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Edit, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { DomainModalTrigger } from "@/components/dashboard/domain-modal-trigger"

async function DomainsContent() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Buscar domínios do usuário
  const { data: domains, error } = await supabase
    .from("domains")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching domains:", error)
  }

  return (
    <div className="p-8 space-y-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
            Domínios
          </h1>
          <p className="text-muted-foreground">
            Gerencie seus domínios registrados
          </p>
        </div>
        <DomainModalTrigger />
      </div>

      {/* Tabela de Domínios */}
      <Card className="border-[#1F1F29] bg-[#13131A]">
        <CardHeader>
          <CardTitle className="text-[#F1F5F9]">Lista de Domínios</CardTitle>
        </CardHeader>
        <CardContent>
          {!domains || domains.length === 0 ? (
            <div className="text-center py-12 text-[#94A3B8]">
              <p className="mb-4">Nenhum domínio cadastrado</p>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeiro Domínio
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1F1F29]">
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#94A3B8]">
                      Domínio
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#94A3B8]">
                      Criado em
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#94A3B8]">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {domains.map((domain) => (
                    <tr
                      key={domain.id}
                      className="border-b border-[#1F1F29]/50 hover:bg-[#1F1F29]/30 transition-all duration-200 hover:shadow-[0_0_8px_rgba(168,85,247,0.2)]"
                    >
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-[#F1F5F9]">
                            {domain.domain || domain.name}
                          </span>
                          {domain.url && (
                            <span className="text-xs text-[#94A3B8] mt-1">
                              {domain.url}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-[#F1F5F9]">
                        {format(
                          new Date(domain.created_at),
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
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


function DomainsLoading() {
  return (
    <div className="p-8 space-y-6 bg-background min-h-screen">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-9 w-48 bg-[#1F1F29] rounded animate-pulse mb-2" />
          <div className="h-5 w-64 bg-[#1F1F29] rounded animate-pulse" />
        </div>
        <div className="h-10 w-48 bg-[#1F1F29] rounded animate-pulse" />
      </div>

      {/* Card Skeleton */}
      <Card className="border-[#1F1F29] bg-[#13131A]">
        <CardHeader>
          <div className="h-6 w-40 bg-[#1F1F29] rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-16 bg-[#1F1F29]/50 rounded border border-[#1F1F29] animate-pulse"
                style={{
                  animationDelay: `${i * 100}ms`,
                  boxShadow: `0 0 10px rgba(168, 85, 247, ${0.1 + i * 0.02})`,
                }}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function DomainsPage() {
  return (
    <Suspense fallback={<DomainsLoading />}>
      <DomainsContent />
    </Suspense>
  )
}

