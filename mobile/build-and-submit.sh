#!/bin/bash
set -e

MOBILE_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(cd "$MOBILE_DIR/.." && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

step() { echo -e "\n${CYAN}▶ $1${NC}"; }
ok()   { echo -e "${GREEN}✓ $1${NC}"; }
fail() { echo -e "${RED}✗ $1${NC}"; exit 1; }
warn() { echo -e "${YELLOW}⚠ $1${NC}"; }

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}   SAGE — Build & Submit Android        ${NC}"
echo -e "${CYAN}========================================${NC}"

# ── 1. Alterações não commitadas ──────────────────────────────────────────────
step "Verificando status do repositório..."

cd "$REPO_DIR"

if ! git diff --quiet || ! git diff --cached --quiet; then
  fail "Há alterações não commitadas. Faça commit antes de continuar."
fi
ok "Sem alterações pendentes"

# ── 2. Sincronização com o remoto ─────────────────────────────────────────────
step "Sincronizando com o remoto..."

git fetch origin 2>/dev/null

UPSTREAM=$(git rev-parse "@{u}" 2>/dev/null || echo "")

if [ -z "$UPSTREAM" ]; then
  warn "Branch sem upstream configurado. Pulando verificação de sincronização."
else
  AHEAD=$(git rev-list "@{u}"..HEAD --count)
  BEHIND=$(git rev-list HEAD.."@{u}" --count)

  if [ "$BEHIND" -gt 0 ]; then
    fail "O repositório está $BEHIND commit(s) atrás do remoto. Rode 'git pull' antes de continuar."
  fi

  if [ "$AHEAD" -gt 0 ]; then
    fail "O repositório tem $AHEAD commit(s) não enviados ao remoto. Rode 'git push' antes de continuar."
  fi

  ok "Repositório sincronizado com o remoto"
fi

# ── 3. Teste de build local (EAS local) ──────────────────────────────────────
step "Testando build de produção localmente (EAS local)..."

cd "$MOBILE_DIR"

if ! eas build --platform android --profile production --local; then
  fail "Build local falhou. Corrija os erros antes de submeter."
fi

ok "Build local concluído com sucesso"

# ── 4. EAS Build + Auto-submit (produção) ────────────────────────────────────
step "Iniciando EAS build + submit (perfil production)..."

eas build --platform android --profile production --auto-submit

ok "EAS build e submit iniciados com sucesso!"
