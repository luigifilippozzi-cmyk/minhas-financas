#!/bin/bash
# =============================================================
# SCRIPT DE LIMPEZA DO BANCO DE PRODUÇÃO
# Projeto: minhas-financas-285da
# O QUE DELETA : despesas (transações + projeções + lançamentos)
# O QUE MANTÉM : usuarios, grupos, categorias, orcamentos, parcelamentos
# =============================================================

PROJECT="minhas-financas-285da"

echo ""
echo "=============================================="
echo "  LIMPEZA DO FIRESTORE — $PROJECT"
echo "=============================================="
echo ""
echo "  Coleção a DELETAR:"
echo "    ✗ despesas  (transações + projeções + lançamentos)"
echo ""
echo "  Coleções PRESERVADAS:"
echo "    ✓ usuarios"
echo "    ✓ grupos"
echo "    ✓ categorias"
echo "    ✓ orcamentos"
echo "    ✓ parcelamentos"
echo ""
echo "  ⚠️  ATENÇÃO: ação IRREVERSÍVEL em PRODUÇÃO"
echo "=============================================="
echo ""
read -p "  Digite 'CONFIRMO' para prosseguir: " resposta

if [ "$resposta" != "CONFIRMO" ]; then
  echo ""
  echo "  Operação cancelada."
  exit 0
fi

echo ""
echo "▶ Deletando coleção: despesas..."
firebase firestore:delete despesas \
  --project "$PROJECT" \
  --recursive \
  --force

echo ""
echo "=============================================="
echo "  ✅ despesas deletada com sucesso."
echo "  Banco pronto para os testes de aceitação."
echo "=============================================="
echo ""
