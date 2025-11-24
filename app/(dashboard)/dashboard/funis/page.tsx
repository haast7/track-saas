import { Suspense } from "react"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Edit, Trash2, Link2 } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { FunnelModalTrigger } from "@/components/dashboard/funnel-modal-trigger"

async function FunnelsContent() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Buscar funis do usuário com JOIN para domains e pixels
  const { data: funnels, error } = await supabase
    .from("funnels")
    .select(`
      *,
      domains:domain_id (
        domain,
        name
      ),
      pixels:pixel_id (
        pixel_id,
        name
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching funnels:", error)
  }

  return (
    <div className="p-8 space-y-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
            Funis
          </h1>
          <p className="text-muted-foreground">
            Gerencie seus funis de conversão
          </p>
        </div>
        <FunnelModalTrigger />
      </div>

      {/* Tabela de Funis */}
      <Card className="border-[#1F1F29] bg-[#13131A]">
        <CardHeader>
          <CardTitle className="text-[#F1F5F9]">Lista de Funis</CardTitle>
        </CardHeader>
        <CardContent>
          {!funnels || funnels.length === 0 ? (
            <div className="text-center py-12 text-[#94A3B8]">
              <p className="mb-4">Nenhum funil cadastrado</p>
              <Button
                variant="outline"
                size="sm"
                className="border-[#1F1F29] text-[#F1F5F9] hover:bg-[#1F1F29]"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Funil
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1F1F29]">
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#94A3B8]">
                      Nome
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#94A3B8]">
                      Domínio
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#94A3B8]">
                      Pixel
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#94A3B8]">
                      URLs
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#94A3B8]">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {funnels.map((funnel: any) => {
                    // Formatar URLs (jsonb array)
                    const urls = Array.isArray(funnel.urls) 
                      ? funnel.urls 
                      : funnel.urls 
                        ? [funnel.urls] 
                        : []
                    
                    const domainName = funnel.domains?.domain || funnel.domains?.name || "—"
                    const pixelId = funnel.pixels?.pixel_id || "—"

                    return (
                      <tr
                        key={funnel.id}
                        className="border-b border-[#1F1F29]/50 hover:bg-[#1F1F29]/30 transition-all duration-200 hover:shadow-[0_0_8px_rgba(168,85,247,0.2)]"
                      >
                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-[#F1F5F9]">
                              {funnel.name || "Sem nome"}
                            </span>
                            {funnel.request_entry && (
                              <span className="text-xs text-primary mt-1">
                                Requer entrada
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-[#F1F5F9]">
                            {domainName}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-[#F1F5F9] font-mono">
                            {pixelId}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1 max-w-md">
                            {urls.length > 0 ? (
                              urls.slice(0, 2).map((url: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="text-xs text-[#94A3B8] truncate"
                                  title={url}
                                >
                                  {url}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-[#94A3B8]">—</span>
                            )}
                            {urls.length > 2 && (
                              <span className="text-xs text-primary">
                                +{urls.length - 2} mais
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Link href={`/dashboard/funis/${funnel.id}/urls`}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10 hover:shadow-[0_0_8px_rgba(168,85,247,0.3)]"
                                title="Editar URLs"
                              >
                                <Link2 className="h-4 w-4" />
                              </Button>
                            </Link>
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
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function FunnelsLoading() {
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

export default function FunnelsPage() {
  return (
    <Suspense fallback={<FunnelsLoading />}>
      <FunnelsContent />
    </Suspense>
  )
}
