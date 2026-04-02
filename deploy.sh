#!/usr/bin/env bash

# --- Verificar dependência ---
if ! command -v whiptail &> /dev/null; then
  echo "Erro: whiptail não encontrado. Instale com: sudo apt install whiptail"
  exit 1
fi

TITLE="SAGE — Deploy"

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

    # --- Passo 3: Tipo de versão ---
    3)
      BUMP=$(whiptail --title "$TITLE" \
        --menu "Tipo de versão (versionamento semântico):" 15 65 3 \
        "patch" "Correção retrocompatível     — v0.0.X" \
        "minor" "Nova funcionalidade          — v0.X.0" \
        "major" "Quebra de compatibilidade    — vX.0.0" \
        3>&1 1>&2 2>&3) || { STEP=2; continue; }

      # Calcular próxima tag
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
      STEP=4
      ;;

    # --- Passo 4: Confirmação ---
    4)
      whiptail --title "$TITLE" \
        --yesno "Confirmar e fazer push?\n\nCommit : $COMMIT_MSG\nTag    : $NEW_TAG" 11 65 \
        3>&1 1>&2 2>&3 || { STEP=3; continue; }
      STEP=5
      ;;

    # --- Passo 5: Execução com barra de progresso ---
    5)
      ERR_FILE=$(mktemp)

      (
        echo "10"; echo "# Adicionando arquivos..."
        git add . 2>"$ERR_FILE" || exit 1

        echo "30"; echo "# Criando commit..."
        git commit -m "$COMMIT_MSG" 2>"$ERR_FILE" || exit 1

        echo "55"; echo "# Criando tag $NEW_TAG..."
        git tag -a "$NEW_TAG" -m "$NEW_TAG" 2>"$ERR_FILE" || exit 1

        echo "80"; echo "# Enviando para o repositório..."
        git push origin master --tags 2>"$ERR_FILE" || exit 1

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
        --msgbox "Operações concluídas com sucesso!\n\n  ✔ git add .\n  ✔ git commit\n  ✔ git tag $NEW_TAG\n  ✔ git push origin master --tags" \
        14 65 \
        --ok-button "Sair"
      clear
      echo -e "\033[0;32m✔ Deploy concluído — tag $NEW_TAG publicada.\033[0m"
      exit 0
      ;;
  esac
done
