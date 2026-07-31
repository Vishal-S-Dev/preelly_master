#!/usr/bin/env bash
# Clean leftover Google Sign-In native pods after package removal.
# Run from anywhere:
#   bash /Users/apple/Documents/PreellyWorkspace/Preelly/scripts/clean-google-signin-ios.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Ensuring JS package is removed..."
if npm ls @react-native-google-signin/google-signin >/dev/null 2>&1; then
  npm uninstall @react-native-google-signin/google-signin
fi
rm -rf node_modules/@react-native-google-signin

echo "==> Cleaning iOS Pods / DerivedData..."
cd ios
rm -rf build \
  Pods/GoogleSignIn \
  Pods/RNGoogleSignin \
  Pods/AppCheckCore \
  Pods/GTMAppAuth \
  Pods/GTMSessionFetcher \
  Pods/RecaptchaInterop \
  Pods/PromisesObjC \
  Pods/PromisesSwift \
  "Pods/Target Support Files/GoogleSignIn" \
  "Pods/Target Support Files/RNGoogleSignin" \
  "Pods/Target Support Files/AppCheckCore" \
  "Pods/Target Support Files/GTMAppAuth" \
  "Pods/Target Support Files/GTMSessionFetcher" \
  "Pods/Target Support Files/RecaptchaInterop" \
  "Pods/Target Support Files/PromisesObjC" \
  "Pods/Target Support Files/PromisesSwift" \
  "Pods/Target Support Files/GoogleUtilities"

rm -rf "${HOME}/Library/Developer/Xcode/DerivedData/Preelly-"*

echo "==> Running pod install..."
pod install

echo "==> Done. Now run: npm run ios"
