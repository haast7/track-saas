# 🚀 MELHORIAS FUTURAS - Track SaaS

Este documento descreve melhorias adicionais recomendadas para tornar o sistema ainda mais robusto e profissional.

---

## 1. 🔒 Rate Limiting nas APIs Públicas

### Problema
APIs de tracking (`/api/track/*`) são públicas (sem autenticação) e podem ser abusadas por bots ou ataques DDoS.

### Solução Recomendada: Upstash Redis

```bash
npm install @upstash/ratelimit @upstash/redis
```

### Implementação

**1. Configurar Upstash Redis:**
- Criar conta em https://upstash.com
- Criar database Redis
- Adicionar variáveis ao `.env`:

```env
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here
```

**2. Criar helper de rate limiting:**

Criar arquivo `lib/rate-limit.ts`:

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Criar instância do Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Rate limit: 100 requests por minuto por IP
export const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 m"),
  analytics: true,
  prefix: "@track-saas/ratelimit",
});

// Rate limit mais agressivo para proteção DDoS: 10 req/s
export const ratelimitStrict = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(10, "1 s"),
  analytics: true,
  prefix: "@track-saas/ratelimit-strict",
});
```

**3. Aplicar nas APIs de tracking:**

```typescript
// Em app/api/track/pageview/route.ts
import { ratelimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  // Obter identificador (IP do cliente)
  const identifier = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'anonymous'

  // Verificar rate limit
  const { success, limit, remaining, reset } = await ratelimit.limit(identifier)

  if (!success) {
    return NextResponse.json(
      {
        error: 'rate_limit_exceeded',
        message: 'Muitas requisições. Tente novamente em alguns segundos.',
        limit,
        remaining,
        reset,
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        },
      }
    )
  }

  // Continue com a lógica normal...
}
```

### Custo
Upstash tem plano gratuito com:
- 10.000 comandos/dia
- Suficiente para ~100k pageviews/mês

---

## 2. 🔐 Criptografia de Tokens com Supabase Vault

### Problema
Tokens do Meta CAPI e Telegram são armazenados em plain text no banco de dados.

### Solução: Supabase Vault

Supabase Vault é um recurso nativo que criptografa secrets usando encryption keys gerenciadas.

### Implementação

**1. Criar secrets no Vault:**

```sql
-- Criar secret para token do pixel
SELECT vault.create_secret(
  'TOKEN_PIXEL_123',  -- Nome do secret
  'actual_token_value',  -- Valor do token
  'Meta CAPI Token para Pixel 123'  -- Descrição (opcional)
);

-- Retorna o ID do secret (UUID)
-- Exemplo: '550e8400-e29b-41d4-a716-446655440000'
```

**2. Modificar schema para usar Vault:**

```sql
-- Adicionar coluna para armazenar secret_id ao invés do token
ALTER TABLE pixels
ADD COLUMN token_secret_id UUID REFERENCES vault.secrets(id);

-- Migrar tokens existentes para o Vault
DO $$
DECLARE
  pixel_record RECORD;
  new_secret_id UUID;
BEGIN
  FOR pixel_record IN SELECT id, token FROM pixels WHERE token IS NOT NULL LOOP
    -- Criar secret no Vault
    SELECT vault.create_secret(
      pixel_record.token,
      'Meta CAPI Token migrado'
    ) INTO new_secret_id;

    -- Atualizar pixel com secret_id
    UPDATE pixels
    SET token_secret_id = new_secret_id,
        token = NULL  -- Limpar token em plain text
    WHERE id = pixel_record.id;
  END LOOP;
END $$;

-- Após migração, remover coluna token (opcional)
-- ALTER TABLE pixels DROP COLUMN token;
```

**3. Buscar token descriptografado quando necessário:**

```typescript
// Em app/api/track/pageview/route.ts
// Buscar pixel com token descriptografado
const { data: pixel } = await supabase
  .from('pixels')
  .select(`
    *,
    decrypted_token:vault.decrypted_secrets!token_secret_id(decrypted_secret)
  `)
  .eq('id', funnel.pixel_id)
  .single()

// Usar token descriptografado
const token = pixel.decrypted_token?.decrypted_secret

if (pixel && pixel.pixel_id && token) {
  await sendFacebookConversionEvent('PageView', {
    pixelId: pixel.pixel_id,
    accessToken: token,  // Token descriptografado do Vault
    // ...
  })
}
```

**4. Função helper para criar pixels com Vault:**

```typescript
// lib/vault.ts
export async function createPixelWithVault(
  supabase: SupabaseClient,
  userId: string,
  pixelData: { name: string; pixel_id: string; token: string }
) {
  // Criar secret no Vault
  const { data: secret } = await supabase.rpc('vault_create_secret', {
    p_secret: pixelData.token,
    p_description: `Meta CAPI Token for ${pixelData.name}`,
  })

  // Criar pixel com secret_id
  const { data: pixel, error } = await supabase
    .from('pixels')
    .insert({
      name: pixelData.name,
      pixel_id: pixelData.pixel_id,
      token_secret_id: secret.id,
      user_id: userId,
    })
    .select()
    .single()

  return { pixel, error }
}
```

### Benefícios
- ✅ Tokens criptografados em repouso
- ✅ Acesso auditável (logs de quem acessou)
- ✅ Rotation de secrets facilitada
- ✅ Compliance com LGPD/GDPR

---

## 3. 📊 Dashboard com Realtime

### Problema
Especificação menciona "Dashboard atualiza em tempo real", mas não há listeners implementados.

### Solução: Supabase Realtime

```typescript
// Em app/(dashboard)/dashboard/page.tsx
import { useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function DashboardPage() {
  const supabase = createClientComponentClient()

  useEffect(() => {
    // Criar canal de realtime
    const channel = supabase
      .channel('dashboard-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pageviews',
          // Filtrar por funis do usuário (requer função RLS)
        },
        (payload) => {
          console.log('Novo pageview:', payload.new)
          // Atualizar contador em tempo real
          setPageviewsCount((prev) => prev + 1)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'clicks',
        },
        (payload) => {
          console.log('Novo click:', payload.new)
          setClicksCount((prev) => prev + 1)
        }
      )
      .subscribe()

    // Cleanup ao desmontar
    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  return (
    // JSX do dashboard...
  )
}
```

### Configuração Necessária

**1. Habilitar Realtime no Supabase:**
- Dashboard > Settings > API > Realtime
- Enable realtime for `pageviews`, `clicks`, `telegram_events`

**2. Criar função RLS para filtrar eventos do usuário:**

```sql
-- Função para verificar se evento pertence aos funis do usuário
CREATE OR REPLACE FUNCTION user_owns_event_funnel(funnel_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM funnels
    WHERE id = funnel_id_param
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Política de Realtime para pageviews
ALTER PUBLICATION supabase_realtime ADD TABLE pageviews;

-- Habilitar broadcasting apenas para funis do usuário
ALTER TABLE pageviews REPLICA IDENTITY FULL;
```

---

## 4. 🎯 Obter IP do Header

### Problema Atual
Tracking script faz chamada externa para `ipify.org` (lento, dependência externa).

### Solução

**1. Remover chamada ao ipify.org do tracking script:**

```javascript
// Em public/tracking.js
// REMOVER:
async function getVisitorIP() {
  const response = await fetch('https://api.ipify.org?format=json')
  const data = await response.json()
  return data.ip || null
}

// Não enviar IP no payload (será capturado no servidor)
const payload = {
  funnel_id: FUNNEL_ID,
  session_id: sessionId,
  url: visitorData.url,
  userAgent: visitorData.userAgent,
  // ip: ip  // REMOVER
}
```

**2. Capturar IP no servidor:**

```typescript
// Em app/api/track/pageview/route.ts
export async function POST(request: NextRequest) {
  // Capturar IP dos headers
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') || // Cloudflare
    'unknown'

  // Usar IP capturado
  const { data: pageview } = await supabase
    .from('pageviews')
    .insert({
      funnel_id,
      session_id,
      url,
      ip_address: ip,  // IP do servidor
      user_agent: request.headers.get('user-agent'),
    })

  // ...
}
```

### Benefícios
- ✅ Mais rápido (1 request a menos)
- ✅ Sem dependência externa
- ✅ IP mais confiável (não pode ser falsificado pelo cliente)

---

## 5. ✉️ Email Real no CRON

### Problema
CRON usa email mock: `user-${id}@example.com`

### Solução

```typescript
// Em app/api/cron/subscriptions-check/route.ts
import { createClient } from '@supabase/supabase-js'

// Buscar email real do usuário
const supabase = createSupabaseAdminClient()

// Usar Admin API para buscar email
const { data: { user: userData }, error: userError } =
  await supabase.auth.admin.getUserById(subscription.user_id)

if (userData?.email) {
  await sendExpirationEmail(userData.email, planName)
} else {
  console.error(`User ${subscription.user_id} has no email`)
}
```

### Implementar serviço de email real

**Opção 1: Resend (Recomendado)**

```bash
npm install resend
```

```typescript
// lib/email.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendExpirationEmail(email: string, planName: string) {
  const { data, error } = await resend.emails.send({
    from: 'Track SaaS <noreply@track-saas.com>',
    to: email,
    subject: `Sua assinatura do plano ${planName} expirou`,
    html: `
      <h1>Assinatura Expirada</h1>
      <p>Sua assinatura do plano <strong>${planName}</strong> expirou.</p>
      <p>Faça upgrade para continuar usando o Track SaaS.</p>
      <a href="https://track-saas.com/dashboard/assinatura">Renovar Assinatura</a>
    `,
  })

  if (error) {
    console.error('Error sending email:', error)
    throw error
  }

  return data
}
```

**Opção 2: SendGrid**
**Opção 3: AWS SES**

---

## 6. 📝 Logging Estruturado

### Problema
Logs atuais são simples `console.log()` sem contexto.

### Solução: Winston ou Pino

```bash
npm install winston
```

```typescript
// lib/logger.ts
import winston from 'winston'

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'track-saas' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    // Em produção, enviar para serviço de logs
    // new winston.transports.File({ filename: 'error.log', level: 'error' }),
  ],
})

// Uso:
logger.info('Pageview created', {
  userId,
  funnelId,
  sessionId,
  timestamp: new Date().toISOString()
})

logger.error('Error creating pageview', {
  error: error.message,
  stack: error.stack,
  context: { userId, funnelId }
})
```

---

## 📌 RESUMO DE PRIORIDADES

### Implementar AGORA (Alta prioridade)
1. ✅ Rate Limiting - Protege contra abuso
2. ✅ IP do Header - Remove dependência externa

### Implementar em 1-2 semanas
3. ✅ Supabase Vault - Segurança de tokens
4. ✅ Dashboard Realtime - UX melhorada
5. ✅ Email Real - Comunicação funcional

### Implementar quando escalar
6. ✅ Logging Estruturado - Debugging em produção
7. ✅ Monitoramento (Sentry, DataDog)
8. ✅ Testes automatizados

---

**Próximos passos:** Consulte `ANALISE_E_CORRECOES.md` para lista completa de melhorias.
