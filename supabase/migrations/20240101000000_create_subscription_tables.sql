-- Migration: Criar tabelas do sistema de assinaturas
-- Data: 2024-01-01
-- Descrição: Cria as tabelas plans, subscriptions e usage para gerenciamento de assinaturas

-- Tabela: plans
-- Armazena os planos disponíveis (Basic, Pro, Premium)
CREATE TABLE IF NOT EXISTS public.plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    price INTEGER NOT NULL, -- Preço em centavos
    limits JSONB NOT NULL DEFAULT '{}'::jsonb, -- { funnels: int, pixels: int, pageviews: int }
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para busca rápida por nome do plano
CREATE INDEX IF NOT EXISTS idx_plans_name ON public.plans(name);

-- Comentários nas colunas da tabela plans
COMMENT ON TABLE public.plans IS 'Armazena os planos de assinatura disponíveis';
COMMENT ON COLUMN public.plans.price IS 'Preço do plano em centavos (ex: 9900 = R$ 99,00)';
COMMENT ON COLUMN public.plans.limits IS 'Limites do plano em formato JSON: { funnels: int, pixels: int, pageviews: int }';

-- Tabela: subscriptions
-- Armazena as assinaturas dos usuários
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'incomplete' CHECK (status IN ('active', 'canceled', 'expired', 'incomplete')),
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON public.subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON public.subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON public.subscriptions(stripe_subscription_id);

-- Índice único parcial: garante que um usuário tenha apenas uma assinatura ativa por vez
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_unique_active 
    ON public.subscriptions(user_id) 
    WHERE status = 'active';

-- Comentários nas colunas da tabela subscriptions
COMMENT ON TABLE public.subscriptions IS 'Armazena as assinaturas dos usuários';
COMMENT ON COLUMN public.subscriptions.status IS 'Status da assinatura: active, canceled, expired, incomplete';
COMMENT ON COLUMN public.subscriptions.stripe_customer_id IS 'ID do cliente no Stripe';
COMMENT ON COLUMN public.subscriptions.stripe_subscription_id IS 'ID da assinatura no Stripe';

-- Tabela: usage
-- Armazena o uso atual de recursos por usuário
CREATE TABLE IF NOT EXISTS public.usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    funnels_count INTEGER NOT NULL DEFAULT 0 CHECK (funnels_count >= 0),
    pixels_count INTEGER NOT NULL DEFAULT 0 CHECK (pixels_count >= 0),
    pageviews_count INTEGER NOT NULL DEFAULT 0 CHECK (pageviews_count >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para busca rápida por usuário
CREATE INDEX IF NOT EXISTS idx_usage_user_id ON public.usage(user_id);

-- Comentários nas colunas da tabela usage
COMMENT ON TABLE public.usage IS 'Armazena o uso atual de recursos por usuário';
COMMENT ON COLUMN public.usage.funnels_count IS 'Quantidade atual de funis criados pelo usuário';
COMMENT ON COLUMN public.usage.pixels_count IS 'Quantidade atual de pixels criados pelo usuário';
COMMENT ON COLUMN public.usage.pageviews_count IS 'Quantidade atual de pageviews do usuário';

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at automaticamente
CREATE TRIGGER update_plans_updated_at
    BEFORE UPDATE ON public.plans
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_usage_updated_at
    BEFORE UPDATE ON public.usage
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para plans (todos podem ler, apenas admins podem modificar)
CREATE POLICY "Plans são públicos para leitura"
    ON public.plans FOR SELECT
    USING (true);

-- Políticas RLS para subscriptions (usuários só veem suas próprias assinaturas)
CREATE POLICY "Usuários podem ver suas próprias assinaturas"
    ON public.subscriptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas próprias assinaturas"
    ON public.subscriptions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias assinaturas"
    ON public.subscriptions FOR UPDATE
    USING (auth.uid() = user_id);

-- Políticas RLS para usage (usuários só veem seu próprio uso)
CREATE POLICY "Usuários podem ver seu próprio uso"
    ON public.usage FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seu próprio uso"
    ON public.usage FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seu próprio uso"
    ON public.usage FOR UPDATE
    USING (auth.uid() = user_id);

