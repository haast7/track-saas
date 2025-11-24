-- Migration: Criar tabelas do sistema de tracking
-- Data: 2024-01-01
-- Descrição: Cria todas as tabelas necessárias para o sistema de tracking

-- Tabela: domains
-- Armazena domínios customizados dos usuários
CREATE TABLE IF NOT EXISTS public.domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    domain TEXT NOT NULL, -- Domínio puro (ex: exemplo.com)
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_domain UNIQUE (user_id, domain)
);

CREATE INDEX IF NOT EXISTS idx_domains_user_id ON public.domains(user_id);
CREATE INDEX IF NOT EXISTS idx_domains_is_active ON public.domains(is_active);

-- Tabela: pixels
-- Armazena configurações de pixels do Meta
CREATE TABLE IF NOT EXISTS public.pixels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    pixel_id TEXT NOT NULL, -- ID do pixel do Meta
    token TEXT NOT NULL, -- Token CAPI do Meta
    platform TEXT NOT NULL DEFAULT 'facebook', -- facebook, tiktok, etc
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pixels_user_id ON public.pixels(user_id);
CREATE INDEX IF NOT EXISTS idx_pixels_is_active ON public.pixels(is_active);

-- Tabela: telegram_channels
-- Armazena configurações de canais do Telegram
CREATE TABLE IF NOT EXISTS public.telegram_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    channel_name TEXT NOT NULL,
    bot_name TEXT NOT NULL,
    bot_token TEXT NOT NULL,
    webhook_url TEXT,
    webhook_connected BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telegram_channels_user_id ON public.telegram_channels(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_channels_is_active ON public.telegram_channels(is_active);

-- Tabela: funnels
-- Armazena funis de vendas/configurações
CREATE TABLE IF NOT EXISTS public.funnels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    domain_id UUID REFERENCES public.domains(id) ON DELETE SET NULL,
    pixel_id UUID REFERENCES public.pixels(id) ON DELETE SET NULL,
    request_entry BOOLEAN NOT NULL DEFAULT false, -- Solicitar entrada no canal
    urls JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array de URLs monitoradas (1 a 5)
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_funnels_user_id ON public.funnels(user_id);
CREATE INDEX IF NOT EXISTS idx_funnels_domain_id ON public.funnels(domain_id);
CREATE INDEX IF NOT EXISTS idx_funnels_pixel_id ON public.funnels(pixel_id);
CREATE INDEX IF NOT EXISTS idx_funnels_is_active ON public.funnels(is_active);

-- Tabela: sessions
-- Armazena sessões de usuários
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    funnel_id UUID NOT NULL REFERENCES public.funnels(id) ON DELETE CASCADE,
    fingerprint TEXT, -- Fingerprint do visitante
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_funnel_id ON public.sessions(funnel_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON public.sessions(created_at);

-- Tabela: pageviews
-- Armazena visualizações de páginas
CREATE TABLE IF NOT EXISTS public.pageviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    funnel_id UUID NOT NULL REFERENCES public.funnels(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
    url TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pageviews_funnel_id ON public.pageviews(funnel_id);
CREATE INDEX IF NOT EXISTS idx_pageviews_session_id ON public.pageviews(session_id);
CREATE INDEX IF NOT EXISTS idx_pageviews_created_at ON public.pageviews(created_at);

-- Tabela: clicks
-- Armazena cliques registrados
CREATE TABLE IF NOT EXISTS public.clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    funnel_id UUID NOT NULL REFERENCES public.funnels(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
    button_id TEXT NOT NULL, -- ID do botão clicado
    url TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clicks_funnel_id ON public.clicks(funnel_id);
CREATE INDEX IF NOT EXISTS idx_clicks_session_id ON public.clicks(session_id);
CREATE INDEX IF NOT EXISTS idx_clicks_button_id ON public.clicks(button_id);
CREATE INDEX IF NOT EXISTS idx_clicks_created_at ON public.clicks(created_at);

-- Tabela: telegram_events
-- Armazena eventos do Telegram (entrada/saída)
CREATE TABLE IF NOT EXISTS public.telegram_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    funnel_id UUID NOT NULL REFERENCES public.funnels(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('ENTER', 'EXIT')),
    telegram_user_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telegram_events_funnel_id ON public.telegram_events(funnel_id);
CREATE INDEX IF NOT EXISTS idx_telegram_events_session_id ON public.telegram_events(session_id);
CREATE INDEX IF NOT EXISTS idx_telegram_events_event_type ON public.telegram_events(event_type);
CREATE INDEX IF NOT EXISTS idx_telegram_events_created_at ON public.telegram_events(created_at);

-- Tabela: postbacks
-- Armazena configurações de postbacks HTTP
CREATE TABLE IF NOT EXISTS public.postbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    destination_url TEXT NOT NULL,
    event TEXT NOT NULL CHECK (event IN ('ViewPage', 'Clique', 'Entrada no Canal', 'Saída do Canal')),
    method TEXT NOT NULL DEFAULT 'POST' CHECK (method IN ('POST', 'GET', 'PUT')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_postbacks_user_id ON public.postbacks(user_id);
CREATE INDEX IF NOT EXISTS idx_postbacks_event ON public.postbacks(event);
CREATE INDEX IF NOT EXISTS idx_postbacks_is_active ON public.postbacks(is_active);

-- Adicionar coluna domains_count na tabela usage
ALTER TABLE public.usage 
ADD COLUMN IF NOT EXISTS domains_count INTEGER NOT NULL DEFAULT 0 CHECK (domains_count >= 0);

-- Triggers para atualizar updated_at
CREATE TRIGGER update_domains_updated_at
    BEFORE UPDATE ON public.domains
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pixels_updated_at
    BEFORE UPDATE ON public.pixels
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_telegram_channels_updated_at
    BEFORE UPDATE ON public.telegram_channels
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_funnels_updated_at
    BEFORE UPDATE ON public.funnels
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at
    BEFORE UPDATE ON public.sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_postbacks_updated_at
    BEFORE UPDATE ON public.postbacks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pixels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pageviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.postbacks ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para domains
CREATE POLICY "Usuários podem ver seus próprios domínios"
    ON public.domains FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus próprios domínios"
    ON public.domains FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios domínios"
    ON public.domains FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios domínios"
    ON public.domains FOR DELETE
    USING (auth.uid() = user_id);

-- Políticas RLS para pixels
CREATE POLICY "Usuários podem ver seus próprios pixels"
    ON public.pixels FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus próprios pixels"
    ON public.pixels FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios pixels"
    ON public.pixels FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios pixels"
    ON public.pixels FOR DELETE
    USING (auth.uid() = user_id);

-- Políticas RLS para telegram_channels
CREATE POLICY "Usuários podem ver seus próprios canais"
    ON public.telegram_channels FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus próprios canais"
    ON public.telegram_channels FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios canais"
    ON public.telegram_channels FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios canais"
    ON public.telegram_channels FOR DELETE
    USING (auth.uid() = user_id);

-- Políticas RLS para funnels
CREATE POLICY "Usuários podem ver seus próprios funis"
    ON public.funnels FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus próprios funis"
    ON public.funnels FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios funis"
    ON public.funnels FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios funis"
    ON public.funnels FOR DELETE
    USING (auth.uid() = user_id);

-- Políticas RLS para sessions (usuários veem apenas sessões de seus funis)
CREATE POLICY "Usuários podem ver sessões de seus funis"
    ON public.sessions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.funnels
            WHERE funnels.id = sessions.funnel_id
            AND funnels.user_id = auth.uid()
        )
    );

CREATE POLICY "Sistema pode inserir sessões"
    ON public.sessions FOR INSERT
    WITH CHECK (true); -- Permitir inserção pública (tracking)

-- Políticas RLS para pageviews (usuários veem apenas pageviews de seus funis)
CREATE POLICY "Usuários podem ver pageviews de seus funis"
    ON public.pageviews FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.funnels
            WHERE funnels.id = pageviews.funnel_id
            AND funnels.user_id = auth.uid()
        )
    );

CREATE POLICY "Sistema pode inserir pageviews"
    ON public.pageviews FOR INSERT
    WITH CHECK (true); -- Permitir inserção pública (tracking)

-- Políticas RLS para clicks (usuários veem apenas clicks de seus funis)
CREATE POLICY "Usuários podem ver clicks de seus funis"
    ON public.clicks FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.funnels
            WHERE funnels.id = clicks.funnel_id
            AND funnels.user_id = auth.uid()
        )
    );

CREATE POLICY "Sistema pode inserir clicks"
    ON public.clicks FOR INSERT
    WITH CHECK (true); -- Permitir inserção pública (tracking)

-- Políticas RLS para telegram_events (usuários veem apenas eventos de seus funis)
CREATE POLICY "Usuários podem ver eventos de seus funis"
    ON public.telegram_events FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.funnels
            WHERE funnels.id = telegram_events.funnel_id
            AND funnels.user_id = auth.uid()
        )
    );

CREATE POLICY "Sistema pode inserir eventos"
    ON public.telegram_events FOR INSERT
    WITH CHECK (true); -- Permitir inserção pública (webhook)

-- Políticas RLS para postbacks
CREATE POLICY "Usuários podem ver seus próprios postbacks"
    ON public.postbacks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus próprios postbacks"
    ON public.postbacks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios postbacks"
    ON public.postbacks FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios postbacks"
    ON public.postbacks FOR DELETE
    USING (auth.uid() = user_id);

-- Função para criar registros default quando usuário é criado
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    basic_plan_id UUID;
BEGIN
    -- Buscar ID do plano Basic
    SELECT id INTO basic_plan_id
    FROM public.plans
    WHERE name = 'Basic'
    LIMIT 1;

    -- Criar registro de usage
    INSERT INTO public.usage (user_id, funnels_count, pixels_count, pageviews_count, domains_count)
    VALUES (NEW.id, 0, 0, 0, 0);

    -- Criar subscription com plano Basic (gratuito)
    IF basic_plan_id IS NOT NULL THEN
        INSERT INTO public.subscriptions (
            user_id,
            plan_id,
            status,
            current_period_start,
            current_period_end
        )
        VALUES (
            NEW.id,
            basic_plan_id,
            'active',
            NOW(),
            NOW() + INTERVAL '1 month'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar registros default quando usuário é criado
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Comentários
COMMENT ON TABLE public.domains IS 'Domínios customizados dos usuários';
COMMENT ON TABLE public.pixels IS 'Configurações de pixels do Meta/Facebook';
COMMENT ON TABLE public.telegram_channels IS 'Configurações de canais do Telegram';
COMMENT ON TABLE public.funnels IS 'Funis de vendas/configurações';
COMMENT ON TABLE public.sessions IS 'Sessões de usuários/visitantes';
COMMENT ON TABLE public.pageviews IS 'Visualizações de páginas';
COMMENT ON TABLE public.clicks IS 'Cliques registrados';
COMMENT ON TABLE public.telegram_events IS 'Eventos do Telegram (entrada/saída)';
COMMENT ON TABLE public.postbacks IS 'Configurações de postbacks HTTP';


