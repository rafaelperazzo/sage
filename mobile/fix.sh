# mobile/fix-native.sh
#!/bin/bash
npx expo prebuild --clean
set -e

# fix build.gradle
sed -i 's/def projectRoot = .*/&\ndef nodeExecutable = System.getenv("NODE_BINARY") ?: "node"/' android/app/build.gradle
# ... etc
