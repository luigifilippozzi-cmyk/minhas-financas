# =============================================================
# Minhas Finanças — Script de Testes
# Contexto: Validação pós-modificação em importar.js
# Modificação: RF-063/064 — seletor de tipo de transação no preview
# =============================================================

$ErrorActionPreference = "Stop"
$ProjectDir = "C:\Dev\minhas-financas"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Minhas Finanças — Suite de Testes" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Navega até o diretório do projeto
Set-Location $ProjectDir
Write-Host "📁 Diretório: $ProjectDir" -ForegroundColor Gray
Write-Host ""

# ── 1. Testes unitários (obrigatório antes de qualquer commit) ──
Write-Host "▶ Rodando testes unitários (509 testes)..." -ForegroundColor Yellow
Write-Host "   Cobertura: utils/, models/, pages/pipelineCartao" -ForegroundColor Gray
Write-Host ""

npm test

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ FALHA nos testes unitários. Verifique os erros acima." -ForegroundColor Red
    Write-Host "   NÃO faça commit até todos os testes passarem." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Testes unitários: PASSOU" -ForegroundColor Green
Write-Host ""

# ── 2. Validação de build (garante que não há erro de sintaxe em importar.js) ──
Write-Host "▶ Verificando build de produção (valida sintaxe de importar.js)..." -ForegroundColor Yellow
Write-Host ""

npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ FALHA no build. Erro de sintaxe em algum arquivo JS/CSS." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Build: PASSOU" -ForegroundColor Green
Write-Host ""

# ── Resumo ──────────────────────────────────────────────────────
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Resumo — Modificação Validada" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Arquivo modificado:" -ForegroundColor White
Write-Host "  src/js/pages/importar.js" -ForegroundColor Gray
Write-Host ""
Write-Host "O que foi adicionado (RF-063/064):" -ForegroundColor White
Write-Host "  • Seletor de categoria agora inclui grupo 'Tipo de transação'" -ForegroundColor Gray
Write-Host "    apenas em modo banco (extrato bancário)" -ForegroundColor Gray
Write-Host "  • Opção '💳 Pagamento de Fatura' → tipo: pagamento_fatura" -ForegroundColor Gray
Write-Host "  • Opção '🔁 Transferência Interna' → tipo: transferencia_interna" -ForegroundColor Gray
Write-Host "  • Pré-seleção automática se auto-detecção já identificou o tipo" -ForegroundColor Gray
Write-Host "  • Badge de status atualizado dinamicamente ao trocar o tipo" -ForegroundColor Gray
Write-Host "  • Indicador '✎' no badge para seleções manuais" -ForegroundColor Gray
Write-Host "  • Função _atualizarBadgeLinha() adicionada" -ForegroundColor Gray
Write-Host ""
Write-Host "Próximo passo sugerido:" -ForegroundColor White
Write-Host "  git add src/js/pages/importar.js" -ForegroundColor DarkGray
Write-Host "  git commit -m `"feat(importar): tipo de transação no seletor de categoria (RF-063/064)`"" -ForegroundColor DarkGray
Write-Host ""
