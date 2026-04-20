#!/bin/bash
set -e

cd "$(dirname "$0")"

if [ -z "$1" ]; then
  echo "Uso: ./update.sh \"descrição da mudança\""
  exit 1
fi

eas update --branch production --message "$1" --platform android --environment production
