#!/usr/bin/env bash
# Offline prerequisite check: never downloads packages or runs npm.
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
missing=0
for dependency in node curl; do
  if ! command -v "$dependency" >/dev/null 2>&1; then
    echo "[MISSING] $dependency"
    missing=1
  fi
done
if ! command -v chromium >/dev/null 2>&1 && ! command -v chromium-browser >/dev/null 2>&1 && ! command -v google-chrome >/dev/null 2>&1; then
  echo "[MISSING] Chromium browser"
  missing=1
fi
if [ "$missing" -ne 0 ]; then
  echo "Supply the missing OS packages from offline media (including their dependencies)."
  echo "Node.js, Chromium, and curl are required."
  exit 1
fi
node --version
echo "[OK] Offline prerequisites available. No packages were downloaded."
echo "Disable Wi-Fi and unplug Ethernet for strictly offline operation."
echo "Run bash start-pi.sh 2d or bash start-pi.sh desktop. Use Alt+F4 to close kiosk mode."
