import { Suspense } from "react"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Edit, Trash2 } from "lucide-react"
import { PostbackModalTrigger } from "@/components/dashboard/postback-modal-trigger"

async function PostbacksContent() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Buscar postbacks do usuário
  const { data: postbacks, error } = await supabase
    .from("postbacks")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching postbacks:", error)
  }

  return (
    <div className="p-8 space-y-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
            Postbacks
          </h1>
          <p className="text-muted-foreground">
            Gerencie seus postbacks de rastreamento
          </p>
        </div>
        <PostbackModalTrigger />
      </div>

      {/* Tabela de Postbacks */}
      <Card className="border-[#1F1F29] bg-[#13131A]">
        <CardHeader>
          <CardTitle className="text-[#F1F5F9]">Lista de Postbacks</CardTitle>
        </CardHeader>
        <CardContent>
          {!postbacks || postbacks.length === 0 ? (
            <div className="text-center py-12 text-[#94A3B8]">
              <p className="mb-4">Nenhum postback cadastrado</p>
              <Button
                variant="outline"
                size="sm"
                className="border-[#1F1F29] text-[#F1F5F9] hover:bg-[#1F1F29]"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeiro Postback
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
                      URL destino
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#94A3B8]">
                      Evento
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#94A3B8]">
                      Método
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#94A3B8]">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {postbacks.map((postback: any) => {
                    // Badge de evento com cores diferentes
                    const getEventBadgeColor = (event: string) => {
                      switch (event) {
                        case "pageview":
                          return "bg-blue-500/20 text-blue-400 border-blue-500/50"
                        case "click":
                          return "bg-purple-500/20 text-purple-400 border-purple-500/50"
                        case "enter":
                          return "bg-green-500/20 text-green-400 border-green-500/50"
                        case "exit":
                          return "bg-red-500/20 text-red-400 border-red-500/50"
                        default:
                          return "bg-gray-500/20 text-gray-400 border-gray-500/50"
                      }
                    }

                    return (
                      <tr
                        key={postback.id}
                        className="border-b border-[#1F1F29]/50 hover:bg-[#1F1F29]/30 transition-all duration-200 hover:shadow-[0_0_8px_rgba(168,85,247,0.2)]"
                      >
                        <td className="py-3 px-4">
                          <span className="text-sm font-medium text-[#F1F5F9]">
                            {postback.name}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <a
                            href={postback.destination_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-[#94A3B8] hover:text-primary transition-colors break-all max-w-md truncate block"
                            title={postback.destination_url}
                          >
                            {postback.destination_url}
                          </a>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${getEventBadgeColor(
                              postback.event
                            )}`}
                          >
                            {postback.event}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-[#F1F5F9] font-mono">
                            {postback.method}
                          </span>
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

function PostbacksLoading() {
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

export default function PostbacksPage() {
  return (
    <Suspense fallback={<PostbacksLoading />}>
      <PostbacksContent />
    </Suspense>
  )
}
