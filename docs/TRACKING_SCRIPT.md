# Script de Tracking - tracking.js

O script `tracking.js` é um script standalone que pode ser incluído em qualquer página HTML para rastrear pageviews e cliques.

## Instalação

### Método 1: Via Configuração Global

```html
<!DOCTYPE html>
<html>
<head>
  <title>Minha Página</title>
</head>
<body>
  <!-- Configuração antes do script -->
  <script>
    window.TrackSaaSConfig = {
      supabaseUrl: 'https://seu-projeto.supabase.co',
      funnelId: '550e8400-e29b-41d4-a716-446655440000',
      trackButtons: true, // Rastrear cliques em botões
      trackSelector: 'button, a[href], [data-track]', // Seletor CSS para elementos a rastrear
      autoTrack: true, // Rastrear automaticamente ao carregar
      anonKey: 'sua-chave-anon-opcional' // Opcional, mas recomendado
    };
  </script>
  
  <!-- Script de tracking -->
  <script src="https://seu-dominio.com/tracking.js"></script>
</body>
</html>
```

### Método 2: Via Atributos Data

```html
<script src="https://seu-dominio.com/tracking.js" 
        data-funnel-id="550e8400-e29b-41d4-a716-446655440000"
        data-supabase-url="https://seu-projeto.supabase.co"
        data-track-buttons="true"
        data-track-selector="button, a[href]"
        data-anon-key="sua-chave-anon"></script>
```

## Configuração

### Parâmetros Obrigatórios

- **supabaseUrl** (ou `data-supabase-url`): URL do seu projeto Supabase
- **funnelId** (ou `data-funnel-id`): UUID do funil que você quer rastrear

### Parâmetros Opcionais

- **trackButtons** (ou `data-track-buttons`): `true` para rastrear cliques automaticamente (padrão: `true`)
- **trackSelector** (ou `data-track-selector`): Seletor CSS para elementos a rastrear (padrão: `'button, a[href], [data-track]'`)
- **autoTrack** (ou `data-auto-track`): `true` para rastrear pageview automaticamente (padrão: `true`)
- **anonKey** (ou `data-anon-key`): Chave anônima do Supabase (opcional, mas recomendado para segurança)

## Funcionalidades

### 1. Gerenciamento de Sessão

O script gera automaticamente um `sessionId` único e o armazena no `localStorage`. A sessão expira após 24 horas.

```javascript
// Obtém o sessionId atual
const sessionId = window.TrackSaaS.sessionId;
```

### 2. Tracking Automático de Pageviews

Quando a página carrega, o script automaticamente:
- Obtém ou cria um `sessionId`
- Envia um POST para `/trackPageview` com:
  - `funnelId`
  - `sessionId`
  - `url` (URL atual)
  - `ip` (tentativa de obter via API)
  - `userAgent`

### 3. Tracking Automático de Cliques

O script rastreia automaticamente cliques em:
- Botões (`<button>`)
- Links (`<a href>`)
- Elementos com atributo `data-track`

Você pode customizar quais elementos rastrear usando `trackSelector`:

```html
<script>
  window.TrackSaaSConfig = {
    supabaseUrl: 'https://seu-projeto.supabase.co',
    funnelId: 'uuid-do-funnel',
    trackSelector: '.cta-button, [data-conversion]' // Apenas estes elementos
  };
</script>
```

### 4. Persistência no localStorage

Todos os eventos são salvos no `localStorage` para:
- **Retry automático**: Se uma requisição falhar, o script tenta reenviar posteriormente
- **Offline support**: Eventos são salvos mesmo se o usuário estiver offline

### 5. Tracking Manual

Você também pode rastrear eventos manualmente:

```javascript
// Rastrear pageview manualmente
window.TrackSaaS.track('pageview');

// Rastrear clique em um elemento específico
const button = document.querySelector('#meu-botao');
window.TrackSaaS.track('click', { element: button });
```

## Exemplos de Uso

### Exemplo 1: Tracking Básico

```html
<!DOCTYPE html>
<html>
<head>
  <title>Landing Page</title>
</head>
<body>
  <h1>Bem-vindo!</h1>
  <button id="cta">Comprar Agora</button>
  
  <script>
    window.TrackSaaSConfig = {
      supabaseUrl: 'https://abc123.supabase.co',
      funnelId: '550e8400-e29b-41d4-a716-446655440000'
    };
  </script>
  <script src="https://meusite.com/tracking.js"></script>
</body>
</html>
```

### Exemplo 2: Tracking Customizado

```html
<!DOCTYPE html>
<html>
<head>
  <title>Página de Vendas</title>
</head>
<body>
  <h1>Produto Incrível</h1>
  <button class="cta-primary">Comprar</button>
  <a href="/contato" data-track="contact">Fale Conosco</a>
  
  <script>
    window.TrackSaaSConfig = {
      supabaseUrl: 'https://abc123.supabase.co',
      funnelId: '550e8400-e29b-41d4-a716-446655440000',
      trackSelector: '.cta-primary, [data-track]', // Apenas estes elementos
      anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' // Para segurança
    };
  </script>
  <script src="https://meusite.com/tracking.js"></script>
</body>
</html>
```

### Exemplo 3: Tracking Condicional

```html
<!DOCTYPE html>
<html>
<head>
  <title>Página com Tracking Condicional</title>
</head>
<body>
  <button id="important-button">Ação Importante</button>
  
  <script>
    window.TrackSaaSConfig = {
      supabaseUrl: 'https://abc123.supabase.co',
      funnelId: '550e8400-e29b-41d4-a716-446655440000',
      trackButtons: false, // Desabilita tracking automático
      autoTrack: true // Mas ainda rastreia pageviews
    };
  </script>
  <script src="https://meusite.com/tracking.js"></script>
  
  <script>
    // Rastreia apenas o botão importante
    document.getElementById('important-button').addEventListener('click', function() {
      window.TrackSaaS.track('click', { element: this });
    });
  </script>
</body>
</html>
```

## API Pública

O script expõe `window.TrackSaaS` com os seguintes métodos:

### `TrackSaaS.init(config)`
Inicializa o tracking manualmente (geralmente não necessário, pois é auto-inicializado).

### `TrackSaaS.track(type, data)`
Rastreia um evento manualmente.
- `type`: `'pageview'` ou `'click'`
- `data`: Para `'click'`, deve conter `{ element: HTMLElement }`

### `TrackSaaS.sessionId`
Obtém o `sessionId` atual.

### `TrackSaaS.config`
Acessa a configuração atual.

## Armazenamento Local

O script usa `localStorage` com as seguintes chaves:

- `tracksaas_session`: Armazena dados da sessão (sessionId, createdAt, expiresAt)
- `tracksaas_events`: Armazena eventos pendentes para retry

## Tratamento de Erros

O script é resiliente a erros:
- Se uma requisição falhar, o evento é salvo no `localStorage` para retry
- Se o `localStorage` não estiver disponível, o script continua funcionando (sem persistência)
- Erros são logados no console, mas não quebram a página

## Performance

- Usa **event delegation** para rastrear cliques (melhor performance)
- Requisições usam `keepalive: true` para não bloquear navegação
- IP é obtido de forma assíncrona e não bloqueia o tracking
- Reenvio de eventos pendentes é feito em background

## Segurança

- Recomenda-se usar `anonKey` para autenticação nas requisições
- O script não expõe informações sensíveis
- Todas as requisições são feitas via HTTPS

## Compatibilidade

- Funciona em todos os navegadores modernos (Chrome, Firefox, Safari, Edge)
- Requer suporte a:
  - `localStorage`
  - `fetch` API
  - `addEventListener`

## Troubleshooting

### O tracking não está funcionando

1. Verifique o console do navegador para erros
2. Confirme que `supabaseUrl` e `funnelId` estão corretos
3. Verifique se a Edge Function está ativa no Supabase
4. Teste a requisição manualmente no console:

```javascript
fetch('https://seu-projeto.supabase.co/functions/v1/trackPageview', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    funnelId: 'seu-funnel-id',
    url: window.location.href
  })
});
```

### Eventos não estão sendo salvos

- Verifique se o `localStorage` está habilitado no navegador
- Verifique se não há bloqueadores de cookies/privacidade ativos

### SessionId não persiste

- O `sessionId` expira após 24 horas
- Verifique se o `localStorage` não está sendo limpo




