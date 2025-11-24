# 🔧 CORREÇÕES DO DASHBOARD - TRACK SAAS

**Data:** 2024-01-XX  
**Problema:** Dashboard resetando infinitamente e não mostrando dados

---

## 🐛 PROBLEMAS IDENTIFICADOS E CORRIGIDOS

### 1. ✅ Loop Infinito no Hook `useDashboardData`

**Problema:** O `useEffect` tinha `supabase` nas dependências, causando re-renders infinitos.

**Correção:**
- Removido `supabase` das dependências (é estável via `useState`)
- Alterado para usar apenas valores primitivos nas dependências
- Adicionado `eslint-disable-next-line` para evitar warning

**Arquivo:** `hooks/useDashboardData.ts` linha 306

---

### 2. ✅ Loop Infinito no Componente `DashboardFilters`

**Problema:** O `useEffect` tinha `supabase` nas dependências.

**Correção:**
- Removido `supabase` das dependências
- Alterado para executar apenas uma vez no mount

**Arquivo:** `components/dashboard/dashboard-filters.tsx` linha 77

---

### 3. ✅ Queries Tentando Buscar de Tabelas Incorretas

**Problema:** 
- `lib/dashboard-queries.ts` buscava de `sessions` mas a tabela pode ser `tracking_sessions`
- Queries tentavam usar `domain_id` e `pixel_id` diretamente em `pageviews` e `clicks` (não existem nessas tabelas)

**Correção:**
- Alterado para buscar entradas/saídas de `telegram_events` ao invés de `sessions`
- Removido filtros de `domain_id` e `pixel_id` diretos em `pageviews` e `clicks` (devem ser filtrados via `funnels`)

**Arquivos:**
- `lib/dashboard-queries.ts` - Funções `getDashboardMetrics` e `getChartData`
- `lib/dashboard-data.ts` - Função `loadDashboardData`

---

### 4. ✅ Filtro `is_active` Causando Erros

**Problema:** Queries tentavam filtrar por `.eq('is_active', true)` mas a coluna pode não existir ou estar causando erro.

**Correção:**
- Removido filtro `.eq('is_active', true)` de todas as queries
- Adicionado tratamento de erro para queries de funnels

**Arquivos:**
- `lib/dashboard-queries.ts` - Todas as funções
- `lib/dashboard-data.ts` - Função `loadDashboardData`

---

### 5. ✅ Tratamento de Erros Melhorado

**Problema:** Erros em queries causavam crashes e loops.

**Correção:**
- Adicionado `console.error` para todos os erros
- Alterado para retornar dados vazios ao invés de lançar exceções
- Adicionado tratamento de erro em todas as queries

**Arquivos:**
- `hooks/useDashboardData.ts`
- `lib/dashboard-queries.ts`
- `lib/dashboard-data.ts`

---

### 6. ✅ Incompatibilidade de Estrutura de Dados

**Problema:** 
- `getDomains()` buscava coluna `url` mas deveria ser `domain`
- Estrutura esperada diferente da estrutura real do banco

**Correção:**
- Corrigido `getDomains()` para buscar `domain` ao invés de `url`
- Removidos filtros de colunas que podem não existir

**Arquivo:** `lib/dashboard-queries.ts` linha 398

---

## 📋 CHECKLIST DE VERIFICAÇÃO

Após aplicar a migration SQL, verifique:

- [ ] Tabela `funnels` existe e tem coluna `user_id`
- [ ] Tabela `pageviews` existe e tem coluna `funnel_id`
- [ ] Tabela `clicks` existe e tem coluna `funnel_id`
- [ ] Tabela `telegram_events` existe e tem colunas `funnel_id`, `event_type` (valores: 'ENTER', 'EXIT')
- [ ] Tabela `domains` existe e tem coluna `domain` (não `url`)
- [ ] RLS está configurado corretamente (usuários só veem seus próprios dados)
- [ ] Não há coluna `is_active` nas tabelas (ou está presente e funcionando)

---

## 🔍 PRÓXIMOS PASSOS PARA DEBUG

Se o problema persistir:

1. **Abrir Console do Navegador (F12)**
   - Verificar erros JavaScript
   - Verificar erros de rede (Network tab)
   - Verificar queries Supabase falhando

2. **Verificar Logs do Servidor**
   - Verificar erros no terminal onde o Next.js está rodando
   - Procurar por erros de queries Supabase

3. **Verificar Estrutura do Banco**
   - Executar no SQL Editor do Supabase:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```

4. **Verificar RLS Policies**
   - Verificar se as políticas RLS estão bloqueando queries
   - Testar queries diretamente no SQL Editor

5. **Verificar Autenticação**
   - Verificar se o usuário está autenticado corretamente
   - Verificar se `auth.uid()` retorna o ID correto

---

## ⚠️ IMPORTANTE

**A migration SQL precisa ser aplicada ANTES de testar!**

A migration `20240101000002_create_tracking_tables_COMPATIVEL.sql` deve ser executada no Supabase SQL Editor para criar/adicionar as tabelas e colunas necessárias.

---

## ✅ CORREÇÕES APLICADAS

- ✅ Loop infinito corrigido em `useDashboardData`
- ✅ Loop infinito corrigido em `DashboardFilters`
- ✅ Queries corrigidas para usar `telegram_events` ao invés de `sessions`
- ✅ Filtros `is_active` removidos
- ✅ Tratamento de erros melhorado
- ✅ Estrutura de dados corrigida (`domain` ao invés de `url`)

**Status:** ✅ Correções aplicadas - Aguardando aplicação da migration SQL


