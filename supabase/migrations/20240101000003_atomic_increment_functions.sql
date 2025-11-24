-- Migration: Atomic Increment Functions para Usage
-- Data: 2024-01-01
-- Descrição: Cria funções RPC para incremento atômico de contadores de uso
-- Resolve race conditions quando múltiplos eventos chegam simultaneamente

-- Função para incrementar contador de funis atomicamente
CREATE OR REPLACE FUNCTION public.increment_usage_funnels(p_user_id UUID)
RETURNS void AS $$
BEGIN
  -- Incrementa atomicamente o contador de funis
  UPDATE public.usage
  SET
    funnels_count = funnels_count + 1,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Se não existe registro de usage, criar
  IF NOT FOUND THEN
    INSERT INTO public.usage (user_id, funnels_count, pixels_count, pageviews_count, domains_count)
    VALUES (p_user_id, 1, 0, 0, 0);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para incrementar contador de pixels atomicamente
CREATE OR REPLACE FUNCTION public.increment_usage_pixels(p_user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.usage
  SET
    pixels_count = pixels_count + 1,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO public.usage (user_id, funnels_count, pixels_count, pageviews_count, domains_count)
    VALUES (p_user_id, 0, 1, 0, 0);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para incrementar contador de pageviews atomicamente
CREATE OR REPLACE FUNCTION public.increment_usage_pageviews(p_user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.usage
  SET
    pageviews_count = pageviews_count + 1,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO public.usage (user_id, funnels_count, pixels_count, pageviews_count, domains_count)
    VALUES (p_user_id, 0, 0, 1, 0);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para incrementar contador de domínios atomicamente
CREATE OR REPLACE FUNCTION public.increment_usage_domains(p_user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.usage
  SET
    domains_count = domains_count + 1,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO public.usage (user_id, funnels_count, pixels_count, pageviews_count, domains_count)
    VALUES (p_user_id, 0, 0, 0, 1);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para decrementar contador de funis atomicamente (quando deletar)
CREATE OR REPLACE FUNCTION public.decrement_usage_funnels(p_user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.usage
  SET
    funnels_count = GREATEST(0, funnels_count - 1),
    updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para decrementar contador de pixels atomicamente (quando deletar)
CREATE OR REPLACE FUNCTION public.decrement_usage_pixels(p_user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.usage
  SET
    pixels_count = GREATEST(0, pixels_count - 1),
    updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para decrementar contador de domínios atomicamente (quando deletar)
CREATE OR REPLACE FUNCTION public.decrement_usage_domains(p_user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.usage
  SET
    domains_count = GREATEST(0, domains_count - 1),
    updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentários
COMMENT ON FUNCTION public.increment_usage_funnels IS 'Incrementa atomicamente o contador de funis, evitando race conditions';
COMMENT ON FUNCTION public.increment_usage_pixels IS 'Incrementa atomicamente o contador de pixels, evitando race conditions';
COMMENT ON FUNCTION public.increment_usage_pageviews IS 'Incrementa atomicamente o contador de pageviews, evitando race conditions';
COMMENT ON FUNCTION public.increment_usage_domains IS 'Incrementa atomicamente o contador de domínios, evitando race conditions';
COMMENT ON FUNCTION public.decrement_usage_funnels IS 'Decrementa atomicamente o contador de funis (ao deletar)';
COMMENT ON FUNCTION public.decrement_usage_pixels IS 'Decrementa atomicamente o contador de pixels (ao deletar)';
COMMENT ON FUNCTION public.decrement_usage_domains IS 'Decrementa atomicamente o contador de domínios (ao deletar)';
