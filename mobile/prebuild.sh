#!/bin/bash
set -e

cd "$(dirname "$0")"

ANDROID="$(pwd)/android"

echo "==> Executando prebuild --clean..."
npx expo prebuild --clean

echo ""
echo "==> [1/3] Criando local.properties..."
cat > "$ANDROID/local.properties" <<EOF
sdk.dir=/home/perazzo/Android/Sdk
EOF

echo "==> [2/3] Removendo hermesCommand quebrado do build.gradle..."
sed -i '/hermesCommand.*hermes-compiler/d' "$ANDROID/app/build.gradle"

echo "==> [3/4] Removendo atributos depreciados de edge-to-edge do styles.xml..."
STYLES="$ANDROID/app/src/main/res/values/styles.xml"
sed -i '/android:statusBarColor/d' "$STYLES"
sed -i '/android:navigationBarColor/d' "$STYLES"

echo "==> [4/4] Corrigindo MainApplication.kt (reactNativeHost ausente)..."
MAIN="$ANDROID/app/src/main/java/com/rafaelperazzo/appdc/MainApplication.kt"

if ! grep -q "import com.facebook.react.ReactNativeHost" "$MAIN"; then
  sed -i 's/import com.facebook.react.ReactHost/import com.facebook.react.ReactNativeHost\nimport com.facebook.react.ReactHost/' "$MAIN"
fi

if ! grep -q "override val reactNativeHost" "$MAIN"; then
  sed -i 's/override val reactHost: ReactHost by lazy {/@Deprecated("Replaced by ReactHost in New Architecture")\n  override val reactNativeHost: ReactNativeHost\n    get() = throw UnsupportedOperationException("New Architecture does not use ReactNativeHost")\n\n  override val reactHost: ReactHost by lazy {/' "$MAIN"
fi

echo ""
echo "Correções aplicadas. Execute: npx expo run:android"
