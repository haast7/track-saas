# 🔧 Configuração do Supabase para Desenvolvimento Local

## ⚠️ IMPORTANTE: Você PRECISA fazer isso para funcionar localmente!

O Supabase bloqueia redirecionamentos para URLs não autorizadas por segurança. Por isso você precisa configurar as URLs permitidas no painel do Supabase.

## 📋 Passo a Passo:

### 1. Acesse o Supabase Dashboard
- Vá para: https://supabase.com/dashboard
- Selecione seu projeto

### 2. Configure as URLs de Redirecionamento
- No menu lateral, clique em **"Authentication"**
- Depois clique em **"URL Configuration"** (ou "Configuração de URL")

### 3. Adicione as URLs Permitidas

Na seção **"Redirect URLs"**, adicione as seguintes URLs (uma por linha):

```
http://localhost:3000/dashboard
http://localhost:3000/auth/callback
http://localhost:3000
```

### 4. Configure a Site URL

Na seção **"Site URL"**, coloque:

```
http://localhost:3000
```

### 5. Salve as Alterações

Clique em **"Save"** ou **"Salvar"** para aplicar as mudanças.

## ✅ Depois de Configurar:

1. **Reinicie o servidor Next.js** (se estiver rodando)
2. **Limpe os cookies do navegador** (opcional, mas recomendado)
3. **Tente fazer login novamente**

## 🎯 O que isso faz?

Essas configurações dizem ao Supabase:
- "Permita redirecionamentos para `http://localhost:3000/dashboard`"
- "Permita redirecionamentos para `http://localhost:3000/auth/callback`"
- "A URL base do site é `http://localhost:3000`"

Sem isso, o Supabase bloqueia o redirecionamento por segurança, mesmo que o login funcione!

## 🚀 Para Produção:

Quando for fazer deploy, você precisará adicionar também as URLs de produção:
- `https://seudominio.com/dashboard`
- `https://seudominio.com/auth/callback`
- E mudar a Site URL para `https://seudominio.com`

---

**Isso é tudo! Depois de configurar, o redirecionamento deve funcionar perfeitamente localmente.**




