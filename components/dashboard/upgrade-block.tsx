'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { AlertCircle, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export function UpgradeBlock() {
  const router = useRouter()

  const handleUpgrade = () => {
    router.push('/dashboard/subscription')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop com blur */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-md"
        style={{
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      />

      {/* Card principal com efeito neon */}
      <div
        className={cn(
          'relative z-10 w-full max-w-md',
          'glass border-[#1F1F29] bg-gradient-to-br from-primary/10 via-background to-secondary/10',
          'backdrop-blur-md rounded-lg p-8 space-y-6',
          'shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_60px_rgba(168,85,247,0.4)]'
        )}
        style={{
          background: 'rgba(19, 19, 26, 0.98)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '2px solid rgba(168, 85, 247, 0.5)',
          boxShadow:
            '0 8px 32px rgba(0, 0, 0, 0.6), 0 0 60px rgba(168, 85, 247, 0.4), inset 0 0 30px rgba(168, 85, 247, 0.1)',
        }}
      >
        {/* Efeito de brilho animado */}
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/20 via-transparent to-secondary/20 opacity-50 animate-pulse" />

        <div className="relative z-10 space-y-4 text-center">
          {/* Ícone */}
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-primary/20 border-2 border-primary/50 neon-glow-primary">
              <AlertCircle className="w-12 h-12 text-primary" />
            </div>
          </div>

          {/* Título */}
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
            Limite Atingido
          </h2>

          {/* Mensagem */}
          <p className="text-muted-foreground text-lg leading-relaxed">
            Seu plano atingiu o limite. Faça upgrade para continuar usando o Track SaaS.
          </p>

          {/* Botão */}
          <Button
            onClick={handleUpgrade}
            size="lg"
            className={cn(
              'w-full mt-6',
              'bg-gradient-to-r from-primary to-secondary',
              'hover:from-primary/90 hover:to-secondary/90',
              'neon-glow-primary hover:shadow-[0_0_30px_rgba(168,85,247,0.6)]',
              'transition-all duration-300',
              'text-white font-semibold'
            )}
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Fazer Upgrade
          </Button>
        </div>

        {/* Efeitos de brilho nos cantos */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      </div>
    </div>
  )
}



