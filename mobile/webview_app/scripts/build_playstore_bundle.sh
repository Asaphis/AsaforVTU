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
"$FLUTTER_BIN" build appbundle --release --tree-shake-icons

OUTPUT_DIR="$APP_DIR/build/app/outputs/bundle/release"
SRC_AAB="$OUTPUT_DIR/app-release.aab"
if [[ ! -s "$SRC_AAB" ]]; then
  echo "App Bundle was not produced at $SRC_AAB" >&2
  exit 1
fi

DEST_DIR="$APP_DIR/../../artifacts"
mkdir -p "$DEST_DIR"
cp -f "$SRC_AAB" "$DEST_DIR/Asafor VTU.aab"

echo "Built and copied: $DEST_DIR/Asafor VTU.aab"
