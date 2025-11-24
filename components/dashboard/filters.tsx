"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface FilterOptions {
  startDate?: string
  endDate?: string
  funnelId?: string
  domainId?: string
  pixelId?: string
}

interface FiltersProps {
  funnels: Array<{ id: string; name: string }>
  domains: Array<{ id: string; name: string; url: string }>
  pixels: Array<{ id: string; name: string; pixel_id: string; platform: string }>
  filters: FilterOptions
  onFiltersChange: (filters: FilterOptions) => void
}

export function DashboardFilters({
  funnels,
  domains,
  pixels,
  filters,
  onFiltersChange,
}: FiltersProps) {
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters)

  const handleChange = (key: keyof FilterOptions, value: string) => {
    const newFilters = { ...localFilters, [key]: value || undefined }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  // Definir datas padrão (últimos 30 dias)
  const defaultStartDate = new Date()
  defaultStartDate.setDate(defaultStartDate.getDate() - 30)
  const defaultEndDate = new Date()

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
      <div className="space-y-2">
        <Label htmlFor="start-date">Data Inicial</Label>
        <Input
          id="start-date"
          type="date"
          value={localFilters.startDate || defaultStartDate.toISOString().split('T')[0]}
          onChange={(e) => handleChange('startDate', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="end-date">Data Final</Label>
        <Input
          id="end-date"
          type="date"
          value={localFilters.endDate || defaultEndDate.toISOString().split('T')[0]}
          onChange={(e) => handleChange('endDate', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="funnel">Funil</Label>
        <Select
          value={localFilters.funnelId || 'all'}
          onValueChange={(value) => handleChange('funnelId', value === 'all' ? '' : value)}
        >
          <SelectTrigger id="funnel">
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

      <div className="space-y-2">
        <Label htmlFor="domain">Domínio</Label>
        <Select
          value={localFilters.domainId || 'all'}
          onValueChange={(value) => handleChange('domainId', value === 'all' ? '' : value)}
        >
          <SelectTrigger id="domain">
            <SelectValue placeholder="Todos os domínios" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os domínios</SelectItem>
            {domains.map((domain) => (
              <SelectItem key={domain.id} value={domain.id}>
                {domain.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="pixel">Pixel</Label>
        <Select
          value={localFilters.pixelId || 'all'}
          onValueChange={(value) => handleChange('pixelId', value === 'all' ? '' : value)}
        >
          <SelectTrigger id="pixel">
            <SelectValue placeholder="Todos os pixels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os pixels</SelectItem>
            {pixels.map((pixel) => (
              <SelectItem key={pixel.id} value={pixel.id}>
                {pixel.name} ({pixel.platform})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}




