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

START_TIME=$(date +%s)

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

# ── 3. Sincronizar versionName no build.gradle ───────────────────────────────
step "Sincronizando versionName com app.json..."

cd "$MOBILE_DIR"

VERSION=$(node -e "console.log(require('./app.json').expo.version)")
BUILD_GRADLE="$MOBILE_DIR/android/app/build.gradle"

sed -i "s/versionName \".*\"/versionName \"$VERSION\"/" "$BUILD_GRADLE"

ok "versionName atualizado para $VERSION"

# ── 4. Build local ────────────────────────────────────────────────────────────
step "Gerando build de produção localmente..."

if ! eas build --platform android --profile production --local; then
  fail "Build local falhou. Corrija os erros antes de submeter."
fi

# Encontra o .aab mais recente gerado
AAB_FILE=$(ls -t "$MOBILE_DIR"/build-*.aab 2>/dev/null | head -1)

if [ -z "$AAB_FILE" ]; then
  fail "Nenhum arquivo .aab encontrado em $MOBILE_DIR"
fi

ok "Build concluído: $(basename "$AAB_FILE")"

# ── 4. Submit direto com o .aab local ────────────────────────────────────────
step "Submetendo à Play Store..."

eas submit --platform android --profile production --path "$AAB_FILE"

ok "Submit concluído com sucesso!"

ELAPSED=$(( $(date +%s) - START_TIME ))
echo -e "\n${CYAN}Tempo total: $(printf '%02d:%02d:%02d' $((ELAPSED/3600)) $((ELAPSED%3600/60)) $((ELAPSED%60)))${NC}"
