#!/usr/bin/env bash
# Publishes the ../react-native checkout as com.facebook.react:react-android:1000.0.0 into
# /tmp/maven-local, which is where both Gradle projects in this repo look for React Native.
#
# Why an artifact instead of a composite build:
#
#   The brownfield Gradle plugin builds the fat AAR by physically unzipping the AARs of the
#   autolinked libraries and merging their classes, resources and .so files. A
#   `dependencySubstitution` into ../react-native's ReactAndroid project gives Gradle a task
#   graph but nothing to explode, so the merge has nothing to work with.
#
#   The cost is that React Native has to be published again whenever you change its Java or
#   C++. That is the trade this demo makes, and it is why `yarn rn:publish` is a script.
#
# First run builds ReactAndroid from scratch and takes ~15 minutes. Incremental runs are
# usually under two.
#
# Version notes:
#   - 1000.0.0 is VERSION_NAME in ../react-native/packages/react-native/ReactAndroid.
#   - The React Native Gradle Plugin refuses to ask remote repositories for that version
#     (it is the repo's "unpublished" marker), so /tmp/maven-local is the only source.
#   - react.internal.useHermesStable=true swaps the hermes-engine project for the published
#     com.facebook.hermes:hermes-android artifact, so Hermes is not rebuilt from source.
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RN_REPO="${RN_REPO:-$REPO/../react-native}"

if [ ! -f "$RN_REPO/settings.gradle.kts" ]; then
  echo "Not found: $RN_REPO"
  echo "Point RN_REPO at your react-native checkout."
  exit 1
fi

echo "==> Publishing ReactAndroid from $(cd "$RN_REPO" && pwd)"
(cd "$RN_REPO" && ./gradlew \
  :packages:react-native:ReactAndroid:publishReleasePublicationToMavenTempLocalRepository \
  -PreactNativeArchitectures=arm64-v8a \
  -Preact.internal.useHermesStable=true \
  --console=plain)

echo
echo "==> Installed under /tmp/maven-local/com/facebook/react/react-android/1000.0.0/"
echo "    If /tmp is cleared by a reboot, re-run this script."
