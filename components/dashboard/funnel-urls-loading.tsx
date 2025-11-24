import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function FunnelUrlsLoading() {
  return (
    <div className="p-8 space-y-6 bg-background min-h-screen">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-[#1F1F29] rounded animate-pulse" />
          <div>
            <div className="h-9 w-64 bg-[#1F1F29] rounded animate-pulse mb-2" />
            <div className="h-5 w-48 bg-[#1F1F29] rounded animate-pulse" />
          </div>
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
            {Array.from({ length: 3 }).map((_, i) => (
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




