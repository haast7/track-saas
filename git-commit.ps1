# Script para fazer commit e push do projeto track-saas
$ErrorActionPreference = "Stop"

# Caminho do projeto
$projectPath = "D:\CÓDIGOS\André Mendes\track-saas"

# Navegar para o diretório do projeto
Set-Location $projectPath

# Verificar se estamos no diretório correto
if (-not (Test-Path "package.json")) {
    Write-Host "Erro: Não encontrado package.json. Verifique o caminho do projeto."
    exit 1
}

Write-Host "Diretório do projeto: $(Get-Location)"
Write-Host ""

# Verificar se já existe repositório git
if (-not (Test-Path ".git")) {
    Write-Host "Inicializando repositório git..."
    git init
}

# Configurar remote
Write-Host "Configurando remote..."
git remote remove origin -ErrorAction SilentlyContinue
git remote add origin https://github.com/haast7/track-saas.git

# Adicionar todos os arquivos (respeitando .gitignore)
Write-Host "Adicionando arquivos..."
git add .

# Verificar status
Write-Host "Status do repositório:"
git status --short

# Fazer commit
Write-Host ""
Write-Host "Fazendo commit..."
git commit -m "feat: Sistema completo de tracking SaaS com todas as funcionalidades implementadas

- Sistema de autenticação com Supabase Auth
- Dashboard completo com métricas e gráficos
- CRUD de funis, pixels, domínios e canais Telegram
- Sistema de tracking de pageviews e clicks
- Integração com Meta Conversion API (CAPI)
- Sistema de postbacks HTTP
- Webhook do Telegram para entrada/saída de canal
- Sistema de assinatura com Stripe (Basic/Pro/Premium)
- Limites de recursos baseados no plano
- CRON para verificação de assinaturas
- Migrations SQL completas
- Correções de loops infinitos no dashboard
- Tratamento de erros robusto"

# Push para o repositório
Write-Host ""
Write-Host "Fazendo push para o repositório..."
git push -u origin master --force

Write-Host ""
Write-Host "✅ Commit e push concluídos com sucesso!"

