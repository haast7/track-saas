"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Globe,
  MousePointerClick,
  Radio,
  GitBranch,
  CreditCard,
  Webhook,
} from "lucide-react"
import { UserMenu } from "./user-menu"

const menuItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Domínios",
    href: "/dashboard/dominios",
    icon: Globe,
  },
  {
    title: "Pixels",
    href: "/dashboard/pixels",
    icon: MousePointerClick,
  },
  {
    title: "Canal",
    href: "/dashboard/canal",
    icon: Radio,
  },
  {
    title: "Funis",
    href: "/dashboard/funis",
    icon: GitBranch,
  },
  {
    title: "Postbacks",
    href: "/dashboard/postbacks",
    icon: Webhook,
  },
  {
    title: "Assinatura",
    href: "/dashboard/subscription",
    icon: CreditCard,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-screen w-64 flex-col border-r border-border bg-card fixed left-0 top-0 z-50">
      <div className="flex h-16 items-center border-b border-border px-6">
        <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Track SaaS
        </h1>
      </div>
      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-fast relative group",
                isActive
                  ? "bg-primary/20 text-primary neon-glow-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              <Icon className={cn(
                "h-5 w-5 transition-fast",
                isActive ? "text-primary" : "group-hover:text-secondary"
              )} />
              <span>{item.title}</span>
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full neon-glow-primary" />
              )}
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-border p-4">
        <UserMenu />
      </div>
    </div>
  )
}

