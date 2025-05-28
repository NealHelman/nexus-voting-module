# build_and_link_dev.sh

#!/bin/bash

# === CONFIGURE THESE PATHS ===
MODULE_NAME="nexus-voting-module"
BUILD_DIR="dist"
NXS_DEV_MODULES="$APPDATA/Nexus Wallet/modules/_dev_${MODULE_NAME}"

# Detect full path (cross-platform safe)
SCRIPT_DIR=$(cd -- "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P)
DIST_HTML="${SCRIPT_DIR}/${BUILD_DIR}/dev.html"

# === STEP 1: Build the production bundle ===
echo "✨ Building module..."
npm run build || { echo "❌ Build failed."; exit 1; }

# === STEP 2: Update nxs_package.dev.json with file:/// entry ===
if [ -f "nxs_package.dev.json" ]; then
  echo "✏️ Updating nxs_package.dev.json..."
  sed -i.bak -E "s|\"entry\":\s*\".*\"|\"entry\": \"file:///${DIST_HTML//\\/\/}\"|" nxs_package.dev.json
  echo "✅ Updated entry to: file:///${DIST_HTML//\\/\/}"
else
  echo "❌ nxs_package.dev.json not found."
  exit 1
fi

# === STEP 3: Copy updated build into wallet dev modules ===
echo "↪ Copying files to Nexus Wallet dev module folder..."
mkdir -p "$NXS_DEV_MODULES"
cp -r $BUILD_DIR/* "$NXS_DEV_MODULES/"
cp nxs_package.dev.json "$NXS_DEV_MODULES/"

# === DONE ===
echo "✨ Dev module ready to open in Nexus wallet. Restart the wallet and open: $MODULE_NAME (Dev)"
