# Track SaaS

Sistema de tracking e gestão construído com Next.js 14, TypeScript, TailwindCSS, Shadcn/UI e Supabase.

## Tecnologias

- **Next.js 14** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **TailwindCSS** - Estilização utilitária
- **Shadcn/UI** - Componentes UI
- **Supabase** - Backend e autenticação

## Configuração

1. Instale as dependências:
```bash
npm install
```

2. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

Edite o arquivo `.env` e adicione suas credenciais do Supabase:
- `NEXT_PUBLIC_SUPABASE_URL` - URL do seu projeto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Chave anônima do Supabase

3. Execute o servidor de desenvolvimento:
```bash
npm run dev
```

## Estrutura do Projeto

```
/app
  /(auth)          # Rotas de autenticação (login, cadastro)
  /(dashboard)     # Rotas protegidas do dashboard
    /dashboard     # Páginas do dashboard
      /dominios
      /pixels
      /canal
      /funis
      /mensagens
      /assinatura
      /postbacks
/components
  /ui              # Componentes Shadcn/UI
  sidebar.tsx      # Componente de sidebar
  user-menu.tsx    # Menu do usuário com logout
/lib
  supabase.ts      # Cliente Supabase centralizado (client, server, middleware)
  auth.ts          # Helpers de autenticação
  utils.ts         # Utilitários
/middleware.ts     # Middleware de proteção de rotas
```

## Autenticação

O sistema utiliza Supabase Auth para autenticação. A configuração está centralizada em `lib/supabase.ts`:

### Clientes Supabase

- **`createClient()`** - Cliente para uso no browser (componentes 'use client')
- **`createServerSupabaseClient()`** - Cliente para uso no servidor (Server Components, Server Actions)
- **`createMiddlewareClient()`** - Cliente para uso no middleware

### Proteção de Rotas

- **Middleware**: Protege automaticamente todas as rotas `/dashboard` e subpáginas
- **Layout do Dashboard**: Verificação adicional de autenticação no layout
- **Helpers**: Use `requireAuth()` ou `getCurrentUser()` de `lib/auth.ts` para verificar autenticação

### Páginas de Autenticação

- **Login** (`/login`): Autenticação com email e senha
- **Cadastro** (`/cadastro`): Criação de nova conta

As rotas protegidas são automaticamente redirecionadas para `/login` se o usuário não estiver autenticado. Usuários autenticados são redirecionados para `/dashboard` ao tentar acessar páginas de autenticação.

## Tema

O projeto utiliza tema dark por padrão, configurado no `globals.css` e no `layout.tsx`.

## Sistema de Tracking

O projeto inclui um sistema completo de tracking com Edge Functions do Supabase:

### Tabelas do Banco de Dados

- **funnels** - Funis de vendas/configurações
- **sessions** - Sessões de usuários
- **pageviews** - Visualizações de páginas
- **clicks** - Cliques registrados
- **session_mappings** - Mapeamento de sessões com Telegram
- **telegram_events** - Eventos do Telegram

### Edge Functions

#### 1. trackPageview
Rota: `https://[seu-projeto].supabase.co/functions/v1/trackPageview`

**Request:**
```json
{
  "funnelId": "uuid",
  "sessionId": "uuid (opcional)",
  "url": "string",
  "ip": "string (opcional)",
  "userAgent": "string (opcional)"
}
```

**Funcionalidades:**
- Valida se o funnel existe e está ativo
- Cria nova sessão se `sessionId` não for fornecido
- Registra pageview na tabela `pageviews`

#### 2. trackClick
Rota: `https://[seu-projeto].supabase.co/functions/v1/trackClick`

**Request:**
```json
{
  "sessionId": "uuid",
  "funnelId": "uuid (opcional)",
  "elementType": "string (opcional)",
  "elementId": "string (opcional)",
  "elementText": "string (opcional)",
  "url": "string (opcional)",
  "ip": "string (opcional)",
  "userAgent": "string (opcional)"
}
```

**Funcionalidades:**
- Registra cliques na tabela `clicks`
- Busca `funnelId` da sessão se não fornecido

#### 3. telegram-webhook
Rota: `https://[seu-projeto].supabase.co/functions/v1/telegram-webhook`

**Request:** (Webhook padrão do Telegram)
```json
{
  "message": {
    "new_chat_member": { ... },
    "left_chat_member": { ... },
    "chat": { "id": 123 }
  }
}
```

**Funcionalidades:**
- Recebe eventos `new_chat_member` e `left_chat_member`
- Busca mapping da sessão na tabela `session_mappings`
- Registra eventos na tabela `telegram_events`

### Facebook Conversion API

Funções helper para enviar eventos para Facebook Conversion API:

**Uso no código:**
```typescript
import { sendEnterChannelEvent } from '@/lib/facebook-conversion-api'

await sendEnterChannelEvent({
  pixelId: 'seu-pixel-id',
  accessToken: 'seu-access-token',
  sessionId: 'uuid',
  url: 'https://exemplo.com',
  ip: '192.168.1.1',
  userAgent: 'Mozilla/5.0...'
})
```

**Variáveis de ambiente necessárias:**
- `FACEBOOK_PIXEL_ID` - ID do seu Pixel do Facebook
- `FACEBOOK_ACCESS_TOKEN` - Token de acesso da API do Facebook

### Configuração do Webhook do Telegram

1. Configure o webhook do Telegram apontando para sua Edge Function:
```bash
curl -X POST "https://api.telegram.org/bot<SEU_BOT_TOKEN>/setWebhook" \
  -d "url=https://[seu-projeto].supabase.co/functions/v1/telegram-webhook"
```

2. Certifique-se de que a Edge Function tenha as variáveis de ambiente necessárias configuradas no Supabase Dashboard.

### Script de Tracking (tracking.js)

O projeto inclui um script standalone de tracking (`public/tracking.js`) que pode ser incluído em qualquer página HTML.

**Instalação:**
```html
<script>
  window.TrackSaaSConfig = {
    supabaseUrl: 'https://seu-projeto.supabase.co',
    funnelId: 'uuid-do-funnel',
    anonKey: 'sua-chave-anon' // Opcional
  };
</script>
<script src="https://seu-dominio.com/tracking.js"></script>
```

**Funcionalidades:**
- ✅ Gera `sessionId` automaticamente e salva no `localStorage`
- ✅ Envia POST `/trackPageview` quando a página carrega
- ✅ Envia POST `/trackClick` quando botões configurados são clicados
- ✅ Salva eventos no `localStorage` para retry automático
- ✅ Funciona como script externo (`<script src>`)

**Documentação completa:** Veja [docs/TRACKING_SCRIPT.md](docs/TRACKING_SCRIPT.md)

**Exemplo de teste:** Acesse `/example.html` após iniciar o servidor para ver um exemplo funcional.

