"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { createClient } from "@/lib/supabase"

interface Domain {
  id: string
  domain: string
}

interface Funnel {
  id: string
  name: string
}

export function DashboardFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [domains, setDomains] = useState<Domain[]>([])
  const [funnels, setFunnels] = useState<Funnel[]>([])
  const [selectedDomain, setSelectedDomain] = useState<string>(
    searchParams.get("domainId") || "all"
  )
  const [selectedFunnel, setSelectedFunnel] = useState<string>(
    searchParams.get("funnelId") || "all"
  )
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "custom">(
    (searchParams.get("dateRange") as "7d" | "30d" | "custom") || "7d"
  )
  const [loading, setLoading] = useState(true)
  const isInitialMount = useRef(true)

  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // Carregar domínios
      const { data: domainsData } = await supabase
        .from("domains")
        .select("id, domain")
        .eq("user_id", user.id)

      if (domainsData) {
        setDomains(domainsData)
      }

      // Carregar funis
      const { data: funnelsData } = await supabase
        .from("funnels")
        .select("id, name")
        .eq("user_id", user.id)

      if (funnelsData) {
        setFunnels(funnelsData)
      }

      setLoading(false)
    }

    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // Ignorar o primeiro render (quando os valores são inicializados dos searchParams)
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    // Só atualizar a URL se os valores mudaram
    const params = new URLSearchParams()
    
    if (selectedDomain !== "all") {
      params.set("domainId", selectedDomain)
    }
    
    if (selectedFunnel !== "all") {
      params.set("funnelId", selectedFunnel)
    }
    
    if (dateRange !== "7d") {
      params.set("dateRange", dateRange)
    }

    const newUrl = `/dashboard${params.toString() ? `?${params.toString()}` : ""}`
    // Usar replace em vez de push para evitar adicionar ao histórico
    router.replace(newUrl)
  }, [selectedDomain, selectedFunnel, dateRange, router])

  if (loading) {
    return (
      <Card className="p-4 border-border bg-card">
        <div className="flex gap-4">
          <div className="h-10 w-48 bg-muted rounded animate-pulse" />
          <div className="h-10 w-48 bg-muted rounded animate-pulse" />
          <div className="h-10 w-48 bg-muted rounded animate-pulse" />
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4 border-border bg-card">
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <Label htmlFor="domain" className="text-sm text-muted-foreground mb-2 block">
            Domínio
          </Label>
          <Select value={selectedDomain} onValueChange={setSelectedDomain}>
            <SelectTrigger
              id="domain"
              className="focus-visible:neon-border-secondary"
            >
              <SelectValue placeholder="Todos os domínios" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os domínios</SelectItem>
              {domains.map((domain) => (
                <SelectItem key={domain.id} value={domain.id}>
                  {domain.domain}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <Label htmlFor="funnel" className="text-sm text-muted-foreground mb-2 block">
            Funil
          </Label>
          <Select value={selectedFunnel} onValueChange={setSelectedFunnel}>
            <SelectTrigger
              id="funnel"
              className="focus-visible:neon-border-secondary"
            >
              <SelectValue placeholder="Todos os funis" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os funis</SelectItem>
              {funnels.map((funnel) => (
                <SelectItem key={funnel.id} value={funnel.id}>
                  {funnel.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <Label htmlFor="dateRange" className="text-sm text-muted-foreground mb-2 block">
            Período
          </Label>
          <Select
            value={dateRange}
            onValueChange={(value) => setDateRange(value as "7d" | "30d" | "custom")}
          >
            <SelectTrigger
              id="dateRange"
              className="focus-visible:neon-border-secondary"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  )
}

