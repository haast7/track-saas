import { Suspense } from "react"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus } from "lucide-react"
import { PixelModalTrigger } from "@/components/dashboard/pixel-modal-trigger"
import { PixelRow } from "@/components/dashboard/pixel-row"

async function PixelsContent() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Buscar pixels do usuário
  const { data: pixels, error } = await supabase
    .from("pixels")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching pixels:", error)
  }

  return (
    <div className="p-8 space-y-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
            Pixels
          </h1>
          <p className="text-muted-foreground">
            Gerencie seus pixels de rastreamento
          </p>
        </div>
        <PixelModalTrigger />
      </div>

      {/* Tabela de Pixels */}
      <Card className="border-[#1F1F29] bg-[#13131A]">
        <CardHeader>
          <CardTitle className="text-[#F1F5F9]">Lista de Pixels</CardTitle>
        </CardHeader>
        <CardContent>
          {!pixels || pixels.length === 0 ? (
            <div className="text-center py-12 text-[#94A3B8]">
              <p className="mb-4">Nenhum pixel cadastrado</p>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeiro Pixel
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
                      Pixel ID
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#94A3B8]">
                      Token
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
                  {pixels.map((pixel) => (
                    <PixelRow key={pixel.id} pixel={pixel} />
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

function PixelsLoading() {
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

export default function PixelsPage() {
  return (
    <Suspense fallback={<PixelsLoading />}>
      <PixelsContent />
    </Suspense>
  )
}
