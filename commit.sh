#!/usr/bin/env bash

# --- Verificar dependência ---
if ! command -v whiptail &> /dev/null; then
  echo "Erro: whiptail não encontrado. Instale com: sudo apt install whiptail"
  exit 1
fi

TITLE="SAGE — Commit"

# --- Verificar alterações pendentes ---
GIT_STATUS=$(git status --short)
if [[ -z "$GIT_STATUS" ]]; then
  whiptail --title "$TITLE" \
    --msgbox "Nenhuma alteração pendente.\n\nNão há arquivos modificados para enviar." \
    10 55 --ok-button "Sair"
  clear
  exit 0
fi

whiptail --title "$TITLE — Alterações Pendentes" \
  --scrolltext \
  --msgbox "$(git status)" \
  22 70 --ok-button "Prosseguir"

STEP=1

while true; do
  case $STEP in

    # --- Passo 1: Tipo de commit ---
    1)
      TIPO=$(whiptail --title "$TITLE" \
        --menu "Escolha o tipo de commit:" 20 65 8 \
        "feat"     "Nova funcionalidade" \
        "fix"      "Correção de bug" \
        "docs"     "Documentação" \
        "style"    "Formatação / estilo" \
        "refactor" "Refatoração de código" \
        "test"     "Testes" \
        "chore"    "Tarefas de manutenção" \
        "perf"     "Melhoria de desempenho" \
        3>&1 1>&2 2>&3) || { clear; echo "Operação cancelada."; exit 0; }
      STEP=2
      ;;

    # --- Passo 2: Mensagem do commit ---
    2)
      MSG=$(whiptail --title "$TITLE" \
        --inputbox "Mensagem do commit:" 10 65 "${MSG:-}" \
        3>&1 1>&2 2>&3) || { STEP=1; continue; }

      if [[ -z "$MSG" ]]; then
        whiptail --title "Atenção" --msgbox "A mensagem não pode estar vazia." 8 45
        continue
      fi

      COMMIT_MSG="${TIPO}: ${MSG}"
      STEP=3
      ;;

    # --- Passo 3: Confirmação ---
    3)
      whiptail --title "$TITLE" \
        --yesno "Confirmar e fazer push?\n\nCommit: $COMMIT_MSG" 10 65 \
        3>&1 1>&2 2>&3 || { STEP=2; continue; }
      STEP=4
      ;;

    # --- Passo 4: Execução com barra de progresso ---
    4)
      ERR_FILE=$(mktemp)

      (
        echo "10"; echo "# Adicionando arquivos..."
        git add . 2>"$ERR_FILE" || exit 1

        echo "40"; echo "# Criando commit..."
        git commit -m "$COMMIT_MSG" 2>"$ERR_FILE" || exit 1

        echo "75"; echo "# Enviando para o repositório..."
        git push origin master 2>"$ERR_FILE" || exit 1

        echo "100"; echo "# Concluído!"
      ) | whiptail --title "$TITLE" --gauge "Aguarde..." 8 65 0

      if [ "${PIPESTATUS[0]}" -ne 0 ]; then
        ERR_MSG=$(cat "$ERR_FILE")
        rm -f "$ERR_FILE"
        whiptail --title "Erro" --msgbox "Falha ao executar git:\n\n$ERR_MSG" 15 65
        exit 1
      fi

      rm -f "$ERR_FILE"
      whiptail --title "$TITLE" \
        --msgbox "Operações concluídas com sucesso!\n\n  ✔ git add .\n  ✔ git commit\n  ✔ git push origin master" \
        12 65 \
        --ok-button "Sair"
      clear
      echo -e "\033[0;32m✔ Commit concluído: $COMMIT_MSG\033[0m"
      exit 0
      ;;
  esac
done
