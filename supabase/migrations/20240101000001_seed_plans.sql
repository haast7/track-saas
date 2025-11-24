-- Seed: Inserir planos iniciais (Basic, Pro, Premium)
-- Data: 2024-01-01
-- Descrição: Insere os 3 planos padrão com seus limites e preços

-- Inserir plano Basic
INSERT INTO public.plans (name, price, limits)
VALUES (
    'Basic',
    0, -- Gratuito (R$ 0,00)
    '{
        "funnels": 1,
        "pixels": 1,
        "pageviews": null
    }'::jsonb
)
ON CONFLICT (name) DO NOTHING;

-- Inserir plano Pro
INSERT INTO public.plans (name, price, limits)
VALUES (
    'Pro',
    9900, -- R$ 99,00 em centavos
    '{
        "funnels": 5,
        "pixels": 5,
        "pageviews": null
    }'::jsonb
)
ON CONFLICT (name) DO NOTHING;

-- Inserir plano Premium
INSERT INTO public.plans (name, price, limits)
VALUES (
    'Premium',
    19900, -- R$ 199,00 em centavos
    '{
        "funnels": null,
        "pixels": null,
        "pageviews": null
    }'::jsonb
)
ON CONFLICT (name) DO NOTHING;

-- Comentário explicativo
COMMENT ON TABLE public.plans IS 'Planos disponíveis:
- Basic: Gratuito, 1 funil, 1 pixel, pageviews ilimitados
- Pro: R$ 99,00/mês, 5 funis, 5 pixels, pageviews ilimitados  
- Premium: R$ 199,00/mês, recursos ilimitados';



