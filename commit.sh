#!/usr/bin/env bash
set -e

# --- Verificar dependência ---
if ! command -v fzf &> /dev/null; then
  echo "Erro: fzf não encontrado. Instale com: sudo apt install fzf"
  exit 1
fi

FZF_OPTS=(--height=40% --layout=reverse --border --prompt="> " --pointer="▶")

echo "==============================="
echo "       SAGE — Commit"
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

# --- 3. Confirmação ---
read -rp "Confirmar e fazer push? [s/N] " CONFIRMA

if [[ "$CONFIRMA" != "s" && "$CONFIRMA" != "S" ]]; then
  echo "Operação cancelada."
  exit 0
fi

echo ""

# --- 4. Git ---
echo "→ git add ."
git add .

echo "→ git commit: \"$COMMIT_MSG\""
git commit -m "$COMMIT_MSG"

echo "→ git push origin master"
git push origin master

echo ""
echo "✔ Commit concluído."
