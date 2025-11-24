-- Migration: Compatível com estrutura existente do usuário
-- Esta migration adapta as tabelas existentes e adiciona as que faltam

-- Habilita UUID (se ainda não estiver habilitado)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- NOTA: Removido tentativa de adicionar colunas em tabela 'users' pois não existe
-- O sistema usa auth.users do Supabase Auth

-- Adicionar colunas faltantes na tabela domains
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'domains' AND column_name = 'name') THEN
    ALTER TABLE domains ADD COLUMN name text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'domains' AND column_name = 'is_active') THEN
    ALTER TABLE domains ADD COLUMN is_active boolean DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'domains' AND column_name = 'updated_at') THEN
    ALTER TABLE domains ADD COLUMN updated_at timestamp DEFAULT now();
  END IF;
END $$;

-- Adicionar colunas faltantes na tabela pixels
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pixels' AND column_name = 'name') THEN
    ALTER TABLE pixels ADD COLUMN name text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pixels' AND column_name = 'token') THEN
    ALTER TABLE pixels ADD COLUMN token text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pixels' AND column_name = 'platform') THEN
    ALTER TABLE pixels ADD COLUMN platform text DEFAULT 'facebook';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pixels' AND column_name = 'is_active') THEN
    ALTER TABLE pixels ADD COLUMN is_active boolean DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pixels' AND column_name = 'updated_at') THEN
    ALTER TABLE pixels ADD COLUMN updated_at timestamp DEFAULT now();
  END IF;
END $$;

-- Renomear coluna access_token para token (se necessário)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pixels' AND column_name = 'access_token') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pixels' AND column_name = 'token') THEN
      ALTER TABLE pixels RENAME COLUMN access_token TO token;
    END IF;
  END IF;
END $$;

-- Renomear coluna pixel_name para name (se necessário)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pixels' AND column_name = 'pixel_name') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pixels' AND column_name = 'name') THEN
      ALTER TABLE pixels RENAME COLUMN pixel_name TO name;
    END IF;
  END IF;
END $$;

-- Adicionar colunas faltantes na tabela funnels
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'funnels' AND column_name = 'request_entry') THEN
    ALTER TABLE funnels ADD COLUMN request_entry boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'funnels' AND column_name = 'urls') THEN
    ALTER TABLE funnels ADD COLUMN urls jsonb DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'funnels' AND column_name = 'is_active') THEN
    ALTER TABLE funnels ADD COLUMN is_active boolean DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'funnels' AND column_name = 'updated_at') THEN
    ALTER TABLE funnels ADD COLUMN updated_at timestamp DEFAULT now();
  END IF;
END $$;

-- Renomear coluna entry_request_enabled para request_entry (se necessário)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'funnels' AND column_name = 'entry_request_enabled') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'funnels' AND column_name = 'request_entry') THEN
      ALTER TABLE funnels RENAME COLUMN entry_request_enabled TO request_entry;
    END IF;
  END IF;
END $$;

-- Adicionar colunas faltantes na tabela tracking_sessions
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tracking_sessions' AND column_name = 'fingerprint') THEN
    ALTER TABLE tracking_sessions ADD COLUMN fingerprint text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tracking_sessions' AND column_name = 'updated_at') THEN
    ALTER TABLE tracking_sessions ADD COLUMN updated_at timestamp DEFAULT now();
  END IF;
END $$;

-- Renomear tracking_sessions para sessions (se necessário, ou criar alias)
-- Vamos manter tracking_sessions mas criar uma view sessions para compatibilidade
CREATE OR REPLACE VIEW sessions AS SELECT * FROM tracking_sessions;

-- Adicionar colunas faltantes na tabela pageviews
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pageviews' AND column_name = 'ip_address') THEN
    ALTER TABLE pageviews ADD COLUMN ip_address text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pageviews' AND column_name = 'user_agent') THEN
    ALTER TABLE pageviews ADD COLUMN user_agent text;
  END IF;
END $$;

-- Adicionar colunas faltantes na tabela clicks
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clicks' AND column_name = 'ip_address') THEN
    ALTER TABLE clicks ADD COLUMN ip_address text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clicks' AND column_name = 'user_agent') THEN
    ALTER TABLE clicks ADD COLUMN user_agent text;
  END IF;
END $$;

-- Adicionar colunas faltantes na tabela telegram_channels
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'telegram_channels' AND column_name = 'bot_name') THEN
    ALTER TABLE telegram_channels ADD COLUMN bot_name text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'telegram_channels' AND column_name = 'webhook_url') THEN
    ALTER TABLE telegram_channels ADD COLUMN webhook_url text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'telegram_channels' AND column_name = 'webhook_connected') THEN
    ALTER TABLE telegram_channels ADD COLUMN webhook_connected boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'telegram_channels' AND column_name = 'is_active') THEN
    ALTER TABLE telegram_channels ADD COLUMN is_active boolean DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'telegram_channels' AND column_name = 'updated_at') THEN
    ALTER TABLE telegram_channels ADD COLUMN updated_at timestamp DEFAULT now();
  END IF;
END $$;

-- Adicionar colunas faltantes na tabela telegram_events
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'telegram_events' AND column_name = 'telegram_username') THEN
    ALTER TABLE telegram_events ADD COLUMN telegram_username text;
  END IF;
END $$;

-- Criar tabela postbacks (se não existir)
CREATE TABLE IF NOT EXISTS postbacks (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    name text NOT NULL,
    destination_url text NOT NULL,
    event text NOT NULL CHECK (event IN ('ViewPage', 'Clique', 'Entrada no Canal', 'Saída do Canal')),
    method text NOT NULL DEFAULT 'POST' CHECK (method IN ('POST', 'GET', 'PUT')),
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);

-- Criar tabela plans (se não existir)
CREATE TABLE IF NOT EXISTS plans (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL UNIQUE,
    price integer NOT NULL,
    limits jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);

-- Criar tabela subscriptions (se não existir)
CREATE TABLE IF NOT EXISTS subscriptions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    plan_id uuid REFERENCES plans(id) ON DELETE RESTRICT,
    status text NOT NULL DEFAULT 'incomplete' CHECK (status IN ('active', 'canceled', 'expired', 'incomplete')),
    current_period_start timestamp NOT NULL,
    current_period_end timestamp NOT NULL,
    stripe_customer_id text,
    stripe_subscription_id text,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);

-- Criar tabela usage (se não existir)
CREATE TABLE IF NOT EXISTS usage (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    funnels_count integer NOT NULL DEFAULT 0 CHECK (funnels_count >= 0),
    pixels_count integer NOT NULL DEFAULT 0 CHECK (pixels_count >= 0),
    pageviews_count integer NOT NULL DEFAULT 0 CHECK (pageviews_count >= 0),
    domains_count integer NOT NULL DEFAULT 0 CHECK (domains_count >= 0),
    updated_at timestamp DEFAULT now()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_domains_user_id ON domains(user_id);
CREATE INDEX IF NOT EXISTS idx_pixels_user_id ON pixels(user_id);
CREATE INDEX IF NOT EXISTS idx_funnels_user_id ON funnels(user_id);
CREATE INDEX IF NOT EXISTS idx_tracking_sessions_funnel_id ON tracking_sessions(funnel_id);
CREATE INDEX IF NOT EXISTS idx_pageviews_funnel_id ON pageviews(funnel_id);
CREATE INDEX IF NOT EXISTS idx_pageviews_session_id ON pageviews(session_id);
CREATE INDEX IF NOT EXISTS idx_clicks_funnel_id ON clicks(funnel_id);
CREATE INDEX IF NOT EXISTS idx_clicks_session_id ON clicks(session_id);
CREATE INDEX IF NOT EXISTS idx_telegram_events_funnel_id ON telegram_events(funnel_id);
CREATE INDEX IF NOT EXISTS idx_telegram_events_event_type ON telegram_events(event_type);
CREATE INDEX IF NOT EXISTS idx_postbacks_user_id ON postbacks(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_user_id ON usage(user_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
DROP TRIGGER IF EXISTS update_domains_updated_at ON domains;
CREATE TRIGGER update_domains_updated_at
    BEFORE UPDATE ON domains
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pixels_updated_at ON pixels;
CREATE TRIGGER update_pixels_updated_at
    BEFORE UPDATE ON pixels
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_funnels_updated_at ON funnels;
CREATE TRIGGER update_funnels_updated_at
    BEFORE UPDATE ON funnels
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tracking_sessions_updated_at ON tracking_sessions;
CREATE TRIGGER update_tracking_sessions_updated_at
    BEFORE UPDATE ON tracking_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_telegram_channels_updated_at ON telegram_channels;
CREATE TRIGGER update_telegram_channels_updated_at
    BEFORE UPDATE ON telegram_channels
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_postbacks_updated_at ON postbacks;
CREATE TRIGGER update_postbacks_updated_at
    BEFORE UPDATE ON postbacks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_plans_updated_at ON plans;
CREATE TRIGGER update_plans_updated_at
    BEFORE UPDATE ON plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_usage_updated_at ON usage;
CREATE TRIGGER update_usage_updated_at
    BEFORE UPDATE ON usage
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Inserir planos padrão (se não existirem)
INSERT INTO plans (name, price, limits)
VALUES 
    ('Basic', 0, '{"funnels": 1, "pixels": 1, "pageviews": null}'::jsonb),
    ('Pro', 9900, '{"funnels": 5, "pixels": 5, "pageviews": null}'::jsonb),
    ('Premium', 19900, '{"funnels": null, "pixels": null, "pageviews": null}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Função para criar registros default quando usuário é criado
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    basic_plan_id uuid;
BEGIN
    -- Buscar ID do plano Basic
    SELECT id INTO basic_plan_id
    FROM plans
    WHERE name = 'Basic'
    LIMIT 1;

    -- Criar registro de usage
    INSERT INTO usage (user_id, funnels_count, pixels_count, pageviews_count, domains_count)
    VALUES (NEW.id, 0, 0, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;

    -- Criar subscription com plano Basic (gratuito)
    IF basic_plan_id IS NOT NULL THEN
        INSERT INTO subscriptions (
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
            now(),
            now() + INTERVAL '1 month'
        )
        ON CONFLICT DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar registros default quando usuário é criado
-- CORRIGIDO: Usar auth.users ao invés de users (que não existe)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Comentários
COMMENT ON TABLE domains IS 'Domínios customizados dos usuários';
COMMENT ON TABLE pixels IS 'Configurações de pixels do Meta/Facebook';
COMMENT ON TABLE telegram_channels IS 'Configurações de canais do Telegram';
COMMENT ON TABLE funnels IS 'Funis de vendas/configurações';
COMMENT ON TABLE tracking_sessions IS 'Sessões de usuários/visitantes';
COMMENT ON TABLE pageviews IS 'Visualizações de páginas';
COMMENT ON TABLE clicks IS 'Cliques registrados';
COMMENT ON TABLE telegram_events IS 'Eventos do Telegram (entrada/saída)';
COMMENT ON TABLE postbacks IS 'Configurações de postbacks HTTP';


