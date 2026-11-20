#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")/.."

if [ -z "${ANDROID_HOME:-}" ] && [ -d "$HOME/Android/Sdk" ]; then
  export ANDROID_HOME="$HOME/Android/Sdk"
fi
if [ -z "${JAVA_HOME:-}" ] && [ -d "$HOME/Android/jdk" ]; then
  export JAVA_HOME="$HOME/Android/jdk"
fi
if [ -n "${JAVA_HOME:-}" ]; then
  export PATH="$JAVA_HOME/bin:$PATH"
fi
export NODE_ENV=production

npx expo prebuild --platform android --no-install

set -- android/gradlew -p android :app:assembleRelease \
  --init-script "$PWD/scripts/native-build.gradle" \
  -PreactNativeArchitectures=arm64-v8a \
  -Pkotlin.compiler.execution.strategy=in-process \
  --max-workers=2 --no-daemon \
  '-Dorg.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m'

if command -v systemd-run >/dev/null 2>&1; then
  set -- systemd-run --user --scope --quiet \
    -p MemoryHigh=7G -p MemoryMax=8G -p MemorySwapMax=1G -p CPUWeight=30 \
    "$@"
fi
"$@"

mkdir -p artifacts
cp android/app/build/outputs/apk/release/app-release.apk artifacts/nfc-attendance-prototype.apk
