import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function ChannelLoading() {
  return (
    <div className="p-8 bg-background min-h-screen">
      {/* Header Skeleton */}
      <div className="mb-8">
        <div className="h-9 w-64 bg-[#1F1F29] rounded animate-pulse mb-2" />
        <div className="h-5 w-96 bg-[#1F1F29] rounded animate-pulse" />
      </div>

      {/* Card Skeleton */}
      <Card className="border-[#1F1F29] bg-[#13131A]">
        <CardHeader>
          <div className="h-6 w-48 bg-[#1F1F29] rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-32 bg-[#1F1F29] rounded animate-pulse" />
                <div className="h-10 w-full bg-[#1F1F29]/50 rounded animate-pulse" />
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-6 pt-4 border-t border-[#1F1F29]">
            <div className="h-10 w-32 bg-[#1F1F29] rounded animate-pulse" />
            <div className="h-10 w-40 bg-[#1F1F29] rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}




