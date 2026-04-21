#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MOBILE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ANDROID="$MOBILE_DIR/android"

echo "[prebuild] Executando expo prebuild --clean..."
cd "$MOBILE_DIR"
npx expo prebuild --clean "$@"

echo "[prebuild] Criando local.properties..."
cat > "$ANDROID/local.properties" <<EOF
sdk.dir=/home/perazzo/Android/Sdk
EOF

echo "[prebuild] Configurando 8 threads para o Gradle..."
echo "org.gradle.workers.max=8" >> "$ANDROID/gradle.properties"

echo "[prebuild] Removendo hermesCommand quebrado do build.gradle..."
sed -i '/hermesCommand.*hermes-compiler/d' "$ANDROID/app/build.gradle"

echo "[prebuild] Removendo atributos depreciados de edge-to-edge do styles.xml..."
sed -i '/android:statusBarColor/d' "$ANDROID/app/src/main/res/values/styles.xml"
sed -i '/android:navigationBarColor/d' "$ANDROID/app/src/main/res/values/styles.xml"

echo "[prebuild] Corrigindo MainApplication.kt (reactNativeHost ausente)..."
MAIN="$ANDROID/app/src/main/java/com/rafaelperazzo/appdc/MainApplication.kt"

if ! grep -q "import com.facebook.react.ReactNativeHost" "$MAIN"; then
  sed -i 's/import com.facebook.react.ReactHost/import com.facebook.react.ReactNativeHost\nimport com.facebook.react.ReactHost/' "$MAIN"
fi

if ! grep -q "override val reactNativeHost" "$MAIN"; then
  sed -i 's/override val reactHost: ReactHost by lazy {/@Deprecated("Replaced by ReactHost in New Architecture")\n  override val reactNativeHost: ReactNativeHost\n    get() = throw UnsupportedOperationException("New Architecture does not use ReactNativeHost")\n\n  override val reactHost: ReactHost by lazy {/' "$MAIN"
fi

echo "[prebuild] Concluído."
