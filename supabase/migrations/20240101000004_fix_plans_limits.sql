-- Migration: Corrigir limites de pageviews nos planos
-- Data: 2024-01-01
-- Descrição: Atualiza os limites de pageviews conforme especificação
-- Basic: 10k pageviews | Pro: 50k pageviews | Premium: ilimitado

-- Atualizar plano Basic
UPDATE public.plans
SET limits = '{
  "funnels": 1,
  "pixels": 1,
  "pageviews": 10000
}'::jsonb
WHERE name = 'Basic';

-- Atualizar plano Pro
UPDATE public.plans
SET limits = '{
  "funnels": 5,
  "pixels": 5,
  "pageviews": 50000
}'::jsonb
WHERE name = 'Pro';

-- Atualizar plano Premium (ilimitado = null)
UPDATE public.plans
SET limits = '{
  "funnels": null,
  "pixels": null,
  "pageviews": null
}'::jsonb
WHERE name = 'Premium';

-- Comentário atualizado
COMMENT ON TABLE public.plans IS 'Planos disponíveis:
- Basic: Gratuito, 1 funil, 1 pixel, 10.000 pageviews/mês
- Pro: R$ 99,00/mês, 5 funis, 5 pixels, 50.000 pageviews/mês
- Premium: R$ 199,00/mês, recursos ilimitados';
