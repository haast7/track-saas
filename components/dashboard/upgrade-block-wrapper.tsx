'use client'

import { usePathname } from 'next/navigation'
import { UpgradeBlock } from './upgrade-block'

interface UpgradeBlockWrapperProps {
  blocked: boolean
}

export function UpgradeBlockWrapper({ blocked }: UpgradeBlockWrapperProps) {
  const pathname = usePathname()
  
  // Permitir acesso à página de subscription mesmo se bloqueado
  const isSubscriptionPage = pathname === '/dashboard/subscription'
  
  if (!blocked || isSubscriptionPage) {
    return null
  }
  
  return <UpgradeBlock />
}



