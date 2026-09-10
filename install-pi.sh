#!/usr/bin/env bash
# ==============================================================================
# Cyber Threat Simulation Map - Raspberry Pi Dependency Installer
# Supports Raspberry Pi OS (Debian Bullseye, Bookworm, 32-bit and 64-bit)
# ==============================================================================

set -e

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}====================================================${NC}"
echo -e "${CYAN}  Cyber Threat Simulation Map - Pi Installer${NC}"
echo -e "${CYAN}====================================================${NC}"

# 1. Check Root / Sudo
if [ "$EUID" -ne 0 ]; then
  SUDO="sudo"
else
  SUDO=""
fi

# 2. Update Package Index
echo -e "\n${YELLOW}[1/5] Updating APT package repositories...${NC}"
$SUDO apt-get update -y

# 3. Detect and Install Node.js & NPM
echo -e "\n${YELLOW}[2/5] Checking Node.js and NPM...${NC}"
if ! command -v node &> /dev/null || ! command -v npm &> /dev/null; then
  echo -e "${CYAN}Installing Node.js and NPM...${NC}"
  # Check system architecture
  ARCH=$(uname -m)
  if [[ "$ARCH" == "armv7l" || "$ARCH" == "aarch64" || "$ARCH" == "x86_64" ]]; then
    echo -e "Installing official NodeSource Node.js LTS..."
    $SUDO apt-get install -y ca-certificates curl gnupg
    $SUDO mkdir -p /etc/apt/keyrings
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | $SUDO gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg --yes 2>/dev/null || true
    NODE_MAJOR=20
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | $SUDO tee /etc/apt/sources.list.d/nodesource.list
    $SUDO apt-get update -y
    $SUDO apt-get install -y nodejs || $SUDO apt-get install -y nodejs npm
  else
    $SUDO apt-get install -y nodejs npm
  fi
else
  NODE_VER=$(node -v)
  echo -e "${GREEN}Node.js is already installed (${NODE_VER})${NC}"
fi

# 4. Install Kiosk & Audio Utilities
echo -e "\n${YELLOW}[3/5] Installing Kiosk browser, audio, and display utilities...${NC}"

# Find available Chromium package (chromium-browser on Bullseye, chromium on Bookworm)
CHROMIUM_PKG="chromium-browser"
if ! apt-cache show chromium-browser &> /dev/null; then
  CHROMIUM_PKG="chromium"
fi

$SUDO apt-get install -y \
  $CHROMIUM_PKG \
  unclutter \
  xdotool \
  curl \
  alsa-utils \
  pulseaudio || true

# 5. Configure Audio Defaults
echo -e "\n${YELLOW}[4/5] Unmuting and configuring audio output...${NC}"
# Attempt unmuting Master or PCM for ALSA
amixer sset 'Master' 80% unmute 2>/dev/null || true
amixer sset 'PCM' 80% unmute 2>/dev/null || true
amixer sset 'Headphone' 80% unmute 2>/dev/null || true
amixer sset 'HDMI' 80% unmute 2>/dev/null || true

# 6. Make Project Scripts Executable & Test Files
echo -e "\n${YELLOW}[5/5] Finalizing project permissions...${NC}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

chmod +x install-pi.sh 2>/dev/null || true
chmod +x start-pi.sh 2>/dev/null || true

# Install npm dependencies if package.json exists
if [ -f "package.json" ]; then
  npm install --omit=dev 2>/dev/null || true
fi

echo -e "\n${GREEN}====================================================${NC}"
echo -e "${GREEN}  Installation Complete!${NC}"
echo -e "${GREEN}====================================================${NC}"
echo -e "You can now start the simulation map using:"
echo -e "  ${CYAN}./start-pi.sh${NC}          (Interactive menu)"
echo -e "  ${CYAN}./start-pi.sh kiosk${NC}    (Full-screen standalone display)"
echo -e "  ${CYAN}./start-pi.sh 2d${NC}       (2D Tactical mode for Pi 2/3)"
echo -e "  ${CYAN}./start-pi.sh headless${NC} (Server only on port 3000)"
echo -e "\nTo launch automatically on boot, run:"
echo -e "  ${CYAN}./start-pi.sh autostart${NC}\n"
