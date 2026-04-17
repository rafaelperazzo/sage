#!/bin/bash
set -e

cd "$(dirname "$0")"

echo "==> Build e submit para produção..."
eas build --profile production --platform android --auto-submit
