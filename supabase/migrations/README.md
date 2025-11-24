# Migrations do Sistema de Assinaturas

Este diretório contém as migrations SQL para o sistema de assinaturas do Track SaaS.

## Arquivos

1. **20240101000000_create_subscription_tables.sql** - Cria as tabelas principais do sistema de assinaturas
2. **20240101000001_seed_plans.sql** - Insere os planos iniciais (Basic, Pro, Premium)

## Como Aplicar

### Opção 1: Via Supabase Dashboard (SQL Editor)

1. Acesse o Supabase Dashboard: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Execute primeiro o arquivo `20240101000000_create_subscription_tables.sql`
5. Depois execute o arquivo `20240101000001_seed_plans.sql`

### Opção 2: Via Supabase CLI

Se você estiver usando o Supabase CLI localmente:

```bash
# Aplicar todas as migrations
supabase db push

# Ou aplicar migration específica
supabase migration up
```

## Estrutura Criada

### Tabela: `plans`
Armazena os planos disponíveis:
- **Basic**: Gratuito, 1 funil, 1 pixel, pageviews ilimitados
- **Pro**: R$ 99,00/mês, 5 funis, 5 pixels, pageviews ilimitados
- **Premium**: R$ 199,00/mês, recursos ilimitados

### Tabela: `subscriptions`
Armazena as assinaturas dos usuários com integração ao Stripe.

### Tabela: `usage`
Armazena o uso atual de recursos por usuário (contadores de funis, pixels e pageviews).

## Segurança

Todas as tabelas têm Row Level Security (RLS) habilitado:
- **plans**: Público para leitura
- **subscriptions**: Usuários só veem suas próprias assinaturas
- **usage**: Usuários só veem seu próprio uso

## Observações

- Os preços estão em **centavos** (ex: 9900 = R$ 99,00)
- Os limites são armazenados em formato JSONB
- Um usuário pode ter apenas **uma assinatura ativa** por vez
- O campo `updated_at` é atualizado automaticamente via triggers



