#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FLUTTER_BIN="${FLUTTER_BIN:-flutter}"
ANDROID_DIR="$APP_DIR/android"
KEYSTORE_NAME="asaforvtu-release.jks"
KEYSTORE_PATH="$ANDROID_DIR/$KEYSTORE_NAME"
KEY_PROPERTIES_PATH="$ANDROID_DIR/key.properties"

cd "$APP_DIR"

if [[ ! -f "$KEY_PROPERTIES_PATH" ]]; then
  if [[ ! -f "$KEYSTORE_PATH" ]]; then
    keytool -genkeypair \
      -alias asaforvtu \
      -keyalg RSA \
      -keysize 2048 \
      -validity 10000 \
      -keystore "$KEYSTORE_PATH" \
      -storepass asaforvtu-local-release \
      -keypass asaforvtu-local-release \
      -dname "CN=AsaforVTU, OU=Mobile, O=Ferixas, L=Unknown, ST=Unknown, C=NG" \
      -noprompt
  fi
  cat > "$KEY_PROPERTIES_PATH" <<EOF
storePassword=asaforvtu-local-release
keyPassword=asaforvtu-local-release
keyAlias=asaforvtu
storeFile=$KEYSTORE_NAME
EOF
fi

"$FLUTTER_BIN" pub get
"$FLUTTER_BIN" build apk --release --split-per-abi --tree-shake-icons

OUTPUT_DIR="$APP_DIR/build/app/outputs/flutter-apk"
ARM64_APK="$OUTPUT_DIR/app-arm64-v8a-release.apk"
if [[ ! -s "$ARM64_APK" ]]; then
  echo "arm64 APK was not produced at $ARM64_APK" >&2
  exit 1
fi

for apk in "$OUTPUT_DIR"/app-*-release.apk; do
  [[ -s "$apk" ]] && echo "Built: $apk"
done
