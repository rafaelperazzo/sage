#!/usr/bin/env bash
set -e

# --- Verificar dependência ---
if ! command -v fzf &> /dev/null; then
  echo "Erro: fzf não encontrado. Instale com: sudo apt install fzf"
  exit 1
fi

FZF_OPTS=(--height=40% --layout=reverse --border --prompt="> " --pointer="▶")

echo "==============================="
echo "       SAGE — Deploy"
echo "==============================="
echo ""

# --- 1. Tipo de commit semântico ---
TIPO=$(printf \
  "feat     — nova funcionalidade\nfix      — correção de bug\ndocs     — documentação\nstyle    — formatação / estilo\nrefactor — refatoração de código\ntest     — testes\nchore    — tarefas de manutenção\nperf     — melhoria de desempenho" \
  | fzf "${FZF_OPTS[@]}" --header="Tipo de commit:" \
  | awk '{print $1}')

if [ -z "$TIPO" ]; then
  echo "Operação cancelada."
  exit 0
fi

echo ""

# --- 2. Mensagem do commit ---
read -rp "Mensagem do commit: " MSG

if [ -z "$MSG" ]; then
  echo "Erro: a mensagem não pode estar vazia."
  exit 1
fi

COMMIT_MSG="${TIPO}: ${MSG}"
echo ""
echo "Commit: \"$COMMIT_MSG\""
echo ""

# --- 3. Tipo de versão ---
BUMP=$(printf \
  "patch  — correção retrocompatível      (v0.0.X)\nminor  — nova funcionalidade            (v0.X.0)\nmajor  — quebra de compatibilidade       (vX.0.0)" \
  | fzf "${FZF_OPTS[@]}" --header="Tipo de versão:" \
  | awk '{print $1}')

if [ -z "$BUMP" ]; then
  echo "Operação cancelada."
  exit 0
fi

echo ""

# --- 4. Calcular próxima tag ---
LAST_TAG=$(git tag --sort=-v:refname | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' | head -n1)

if [ -z "$LAST_TAG" ]; then
  MAJOR=0; MINOR=0; PATCH=0
else
  VERSION="${LAST_TAG#v}"
  IFS='.' read -r MAJOR MINOR PATCH <<< "$VERSION"
fi

case "$BUMP" in
  major) MAJOR=$((MAJOR + 1)); MINOR=0; PATCH=0 ;;
  minor) MINOR=$((MINOR + 1)); PATCH=0 ;;
  patch) PATCH=$((PATCH + 1)) ;;
esac

NEW_TAG="v${MAJOR}.${MINOR}.${PATCH}"

# --- 5. Confirmação ---
echo "Resumo:"
echo "  Commit : $COMMIT_MSG"
echo "  Tag    : $NEW_TAG"
echo ""
read -rp "Confirmar e fazer push? [s/N] " CONFIRMA

if [[ "$CONFIRMA" != "s" && "$CONFIRMA" != "S" ]]; then
  echo "Operação cancelada."
  exit 0
fi

echo ""

# --- 6. Git ---
echo "→ git add ."
git add .

echo "→ git commit: \"$COMMIT_MSG\""
git commit -m "$COMMIT_MSG"

echo "→ criando tag $NEW_TAG"
git tag -a "$NEW_TAG" -m "$NEW_TAG"

echo "→ git push origin master --tags"
git push origin master --tags

echo ""
echo "✔ Deploy concluído — tag $NEW_TAG publicada."
