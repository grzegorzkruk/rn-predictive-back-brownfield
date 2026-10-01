#!/usr/bin/env bash
# Publishes the brownfield Gradle plugin to ~/.m2, which is where
# android/build.gradle looks for it.
#
# The published artifact on Maven Central is not used here: this repo works against the
# ../react-native-brownfield checkout, and its plugin version is a local SNAPSHOT.
#
# Safe to re-run. Takes well under a minute after the first Gradle warm-up.
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BROWNFIELD="${BROWNFIELD_REPO:-$REPO/../react-native-brownfield}"
PLUGIN_DIR="$BROWNFIELD/gradle-plugins/react/brownfield"

if [ ! -d "$PLUGIN_DIR" ]; then
  echo "Not found: $PLUGIN_DIR"
  echo "Clone https://github.com/callstack/react-native-brownfield next to this app,"
  echo "or set BROWNFIELD_REPO to its path."
  exit 1
fi

echo "==> Publishing the brownfield Gradle plugin from $PLUGIN_DIR"
# SkipSigning keeps this local: the release script signs with a Callstack PGP key.
# IS_SNAPSHOT matches the version android/build.gradle asks for (2.0.0-alpha10-SNAPSHOT).
(cd "$PLUGIN_DIR" && ./gradlew publishMavenLocalPublicationToMavenLocalRepository \
  -PSkipSigning=true -PIS_SNAPSHOT=true --console=plain)

echo "==> Done. com.callstack.react:brownfield-gradle-plugin:2.0.0-alpha10-SNAPSHOT is in ~/.m2"
