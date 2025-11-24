# Script para fazer commit e push do projeto Track SaaS
$projectPath = "D:\CÓDIGOS\André Mendes\track-saas"

# Navegar para o diretório do projeto
Set-Location $projectPath

# Verificar se é um repositório git
if (-not (Test-Path .git)) {
    Write-Host "Inicializando repositório Git..."
    git init
}

# Adicionar todos os arquivos do projeto (respeitando .gitignore)
Write-Host "Adicionando arquivos..."
git add .

# Fazer commit
Write-Host "Fazendo commit..."
git commit -m "feat: análise completa e correções críticas do sistema Track SaaS

- Criada migration completa para todas as tabelas do sistema
- Implementado sistema de postbacks para eventos HTTP
- Corrigida integração CAPI (Facebook Conversion API) em todos os eventos
- Corrigida autenticação no tracking (rotas públicas com validação de funnel)
- Atualizado tracking script para usar API Routes
- Implementada detecção de saída do canal Telegram
- Adicionada estrutura de limites de domínios
- Corrigido CRON para zerar usage na renovação
- Criado trigger para registros default na primeira autenticação
- Corrigidos loops infinitos no dashboard
- Corrigidas queries para usar telegram_events ao invés de sessions
- Melhorado tratamento de erros em todas as queries"

# Configurar remote
Write-Host "Configurando remote..."
git remote remove origin 2>$null
git remote add origin https://github.com/haast7/track-saas.git

# Renomear branch para main
Write-Host "Renomeando branch para main..."
git branch -M main

# Push
Write-Host "Fazendo push..."
git push -u origin main --force

Write-Host "Concluído!"


