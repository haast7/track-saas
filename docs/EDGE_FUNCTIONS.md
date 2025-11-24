# Documentação das Edge Functions

## trackPageview

### Endpoint
```
POST https://[seu-projeto].supabase.co/functions/v1/trackPageview
```

### Headers
```
Content-Type: application/json
Authorization: Bearer [SUPABASE_ANON_KEY] (opcional, mas recomendado)
```

### Request Body
```json
{
  "funnelId": "550e8400-e29b-41d4-a716-446655440000",
  "sessionId": "550e8400-e29b-41d4-a716-446655440001", // Opcional
  "url": "https://exemplo.com/pagina",
  "ip": "192.168.1.1", // Opcional
  "userAgent": "Mozilla/5.0..." // Opcional
}
```

### Response (Sucesso)
```json
{
  "success": true,
  "sessionId": "550e8400-e29b-41d4-a716-446655440001",
  "pageviewId": "550e8400-e29b-41d4-a716-446655440002"
}
```

### Response (Erro)
```json
{
  "error": "Funnel not found or inactive"
}
```

### Exemplo de Uso (JavaScript)
```javascript
async function trackPageview(funnelId, url, sessionId = null) {
  const response = await fetch(
    'https://[seu-projeto].supabase.co/functions/v1/trackPageview',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        funnelId,
        sessionId,
        url: window.location.href,
        ip: await getClientIP(), // Implementar função para obter IP
        userAgent: navigator.userAgent,
      }),
    }
  );

  const data = await response.json();
  return data;
}
```

---

## trackClick

### Endpoint
```
POST https://[seu-projeto].supabase.co/functions/v1/trackClick
```

### Headers
```
Content-Type: application/json
Authorization: Bearer [SUPABASE_ANON_KEY] (opcional)
```

### Request Body
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440001",
  "funnelId": "550e8400-e29b-41d4-a716-446655440000", // Opcional (busca da sessão)
  "elementType": "button",
  "elementId": "cta-button",
  "elementText": "Comprar Agora",
  "url": "https://exemplo.com/pagina", // Opcional
  "ip": "192.168.1.1", // Opcional
  "userAgent": "Mozilla/5.0..." // Opcional
}
```

### Response (Sucesso)
```json
{
  "success": true,
  "clickId": "550e8400-e29b-41d4-a716-446655440003"
}
```

### Exemplo de Uso (JavaScript)
```javascript
async function trackClick(sessionId, element) {
  const response = await fetch(
    'https://[seu-projeto].supabase.co/functions/v1/trackClick',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        elementType: element.tagName.toLowerCase(),
        elementId: element.id,
        elementText: element.textContent,
        url: window.location.href,
        userAgent: navigator.userAgent,
      }),
    }
  );

  const data = await response.json();
  return data;
}

// Uso
document.querySelector('#cta-button').addEventListener('click', (e) => {
  trackClick(sessionId, e.target);
});
```

---

## telegram-webhook

### Endpoint
```
POST https://[seu-projeto].supabase.co/functions/v1/telegram-webhook
```

### Configuração

1. Obtenha o token do seu bot do Telegram através do [@BotFather](https://t.me/botfather)

2. Configure o webhook:
```bash
curl -X POST "https://api.telegram.org/bot<SEU_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://[seu-projeto].supabase.co/functions/v1/telegram-webhook"
  }'
```

3. Verifique o webhook:
```bash
curl "https://api.telegram.org/bot<SEU_BOT_TOKEN>/getWebhookInfo"
```

### Request Body (Telegram)
O Telegram envia automaticamente updates no formato:
```json
{
  "message": {
    "new_chat_member": {
      "id": 123456789,
      "is_bot": false,
      "first_name": "João",
      "last_name": "Silva",
      "username": "joaosilva"
    },
    "chat": {
      "id": -1001234567890,
      "type": "supergroup"
    }
  }
}
```

### Response
```json
{
  "success": true,
  "eventId": "550e8400-e29b-41d4-a716-446655440004",
  "sessionId": "550e8400-e29b-41d4-a716-446655440001" // ou null se não encontrado
}
```

### Mapeamento de Sessões

Para vincular eventos do Telegram a sessões, você precisa criar registros na tabela `session_mappings`:

```sql
INSERT INTO session_mappings (session_id, telegram_chat_id, telegram_user_id)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  1234567890,
  987654321
);
```

---

## Facebook Conversion API

### Função: sendEnterChannelEvent

Envia evento 'enter_channel' para Facebook Conversion API.

### Uso no Código

```typescript
import { sendEnterChannelEvent } from '@/lib/facebook-conversion-api'

try {
  const response = await sendEnterChannelEvent({
    pixelId: process.env.FACEBOOK_PIXEL_ID!,
    accessToken: process.env.FACEBOOK_ACCESS_TOKEN!,
    sessionId: '550e8400-e29b-41d4-a716-446655440001',
    url: 'https://exemplo.com',
    ip: '192.168.1.1',
    userAgent: 'Mozilla/5.0...',
    eventId: 'unique-event-id', // Opcional
    testEventCode: 'TEST12345', // Opcional, para testar
  });

  console.log('Evento enviado:', response);
} catch (error) {
  console.error('Erro ao enviar evento:', error);
}
```

### Variáveis de Ambiente

Adicione ao seu arquivo `.env`:
```
FACEBOOK_PIXEL_ID=seu-pixel-id
FACEBOOK_ACCESS_TOKEN=seu-access-token
```

### Obter Access Token

1. Acesse o [Facebook Business Manager](https://business.facebook.com/)
2. Vá em **Configurações** > **Pixels**
3. Selecione seu Pixel
4. Vá em **Configurações** > **Acesso à API**
5. Gere um token de acesso

### Testar Eventos

Use o `testEventCode` para testar eventos sem que sejam contabilizados:

```typescript
await sendEnterChannelEvent({
  pixelId: process.env.FACEBOOK_PIXEL_ID!,
  accessToken: process.env.FACEBOOK_ACCESS_TOKEN!,
  sessionId: 'test-session',
  url: 'https://exemplo.com',
  testEventCode: 'TEST12345', // Código de teste do Facebook
});
```

Verifique os eventos de teste no [Facebook Events Manager](https://business.facebook.com/events_manager2).

---

## Exemplo Completo de Integração

```typescript
// lib/tracking.ts
import { createClient } from '@/lib/supabase'
import { sendEnterChannelEvent } from '@/lib/facebook-conversion-api'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function trackPageview(
  funnelId: string,
  sessionId: string | null,
  url: string
) {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/trackPageview`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        funnelId,
        sessionId,
        url,
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
      }),
    }
  );

  const data = await response.json();
  
  // Enviar para Facebook se necessário
  if (data.success && process.env.FACEBOOK_PIXEL_ID) {
    try {
      await sendEnterChannelEvent({
        pixelId: process.env.FACEBOOK_PIXEL_ID!,
        accessToken: process.env.FACEBOOK_ACCESS_TOKEN!,
        sessionId: data.sessionId,
        url,
      });
    } catch (error) {
      console.error('Erro ao enviar para Facebook:', error);
    }
  }

  return data;
}

export async function trackClick(
  sessionId: string,
  element: HTMLElement
) {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/trackClick`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        sessionId,
        elementType: element.tagName.toLowerCase(),
        elementId: element.id,
        elementText: element.textContent?.trim(),
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
      }),
    }
  );

  return await response.json();
}
```




