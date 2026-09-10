#!/usr/bin/env bash
# ==============================================================================
# Cyber Threat Simulation Map - Raspberry Pi Multi-Mode Launcher
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PORT=3000
MODE="$1"

# Find Chromium binary
CHROMIUM_BIN=""
for bin in chromium-browser chromium google-chrome; do
  if command -v "$bin" &> /dev/null; then
    CHROMIUM_BIN="$bin"
    break
  fi
done

# Function: Setup autostart on Pi desktop boot
setup_autostart() {
  AUTOSTART_DIR="$HOME/.config/autostart"
  mkdir -p "$AUTOSTART_DIR"
  DESKTOP_FILE="$AUTOSTART_DIR/threatsim.desktop"

  cat <<EOF > "$DESKTOP_FILE"
[Desktop Entry]
Type=Application
Name=Cyber Threat Sim Map
Comment=Full Screen Cyber Threat Simulation Map
Exec=bash "$SCRIPT_DIR/start-pi.sh" kiosk
Terminal=false
Hidden=false
X-GNOME-Autostart-enabled=true
EOF

  chmod +x "$DESKTOP_FILE"
  echo -e "${GREEN}[OK] Configured autostart at: $DESKTOP_FILE${NC}"
  echo -e "The Threat Simulation Map will now launch automatically whenever the Raspberry Pi boots to desktop."
  exit 0
}

# Function: Start local Node.js server
start_server() {
  echo -e "${CYAN}Starting local static server on port $PORT...${NC}"
  node server.js &
  SERVER_PID=$!

  # Clean up background server on script exit
  trap "kill $SERVER_PID 2>/dev/null" EXIT SIGINT SIGTERM

  # Wait for server to be responsive
  echo -e "${YELLOW}Waiting for server to become ready...${NC}"
  for i in {1..30}; do
    if curl --noproxy '*' -fsS "http://127.0.0.1:$PORT" &> /dev/null; then
      echo -e "${GREEN}[OK] Server is active at http://localhost:$PORT${NC}"
      return 0
    fi
    sleep 0.5
  done

  echo -e "${RED}[ERROR] Server did not start within 15 seconds.${NC}"
  exit 1
}

# Function: Setup systemd service for background server
setup_service() {
  if [ "$EUID" -ne 0 ]; then
    SUDO="sudo"
  else
    SUDO=""
  fi
  SERVICE_FILE="/etc/systemd/system/threatsim.service"
  NODE_BIN=$(command -v node || echo "/usr/bin/node")

  echo -e "${CYAN}Installing systemd service for user: $USER in $SCRIPT_DIR...${NC}"
  $SUDO tee "$SERVICE_FILE" > /dev/null <<EOF
[Unit]
Description=Middle Georgia State University - Cyber Threat Simulator
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$SCRIPT_DIR
ExecStart=$NODE_BIN $SCRIPT_DIR/server.js
Restart=on-failure
RestartSec=5
Environment=PORT=$PORT

[Install]
WantedBy=multi-user.target
EOF

  $SUDO systemctl daemon-reload
  $SUDO systemctl enable threatsim.service
  $SUDO systemctl restart threatsim.service
  echo -e "${GREEN}[OK] threatsim service installed and active at http://localhost:$PORT!${NC}"
  echo -e "Check status: sudo systemctl status threatsim"
  exit 0
}

# Handle flag options
if [ "$MODE" == "autostart" ]; then
  setup_autostart
fi
if [ "$MODE" == "service" ]; then
  setup_service
fi

# Interactive Menu if no mode supplied
if [ -z "$MODE" ]; then
  echo -e "${CYAN}====================================================${NC}"
  echo -e "${CYAN}  Cyber Threat Simulation Map - Launcher${NC}"
  echo -e "${CYAN}====================================================${NC}"
  echo -e "Choose startup mode:"
  echo -e "  ${GREEN}1)${NC} Kiosk Mode (Full Screen 3D Globe - Pi 4/5)"
  echo -e "  ${GREEN}2)${NC} Kiosk Mode - 2D Tactical (Fast, recommended for Pi 2/3)"
  echo -e "  ${GREEN}3)${NC} Desktop Window (Standard Browser)"
  echo -e "  ${GREEN}4)${NC} Headless Server (Run in terminal on port 3000)"
  echo -e "  ${GREEN}5)${NC} Setup Desktop Autostart on Boot (Kiosk display)"
  echo -e "  ${GREEN}6)${NC} Install as Systemd Background Service"
  echo -e "  ${GREEN}7)${NC} Exit"
  echo -ne "${YELLOW}Enter choice [1-7]: ${NC}"
  read -r choice

  case "$choice" in
    1) MODE="kiosk" ;;
    2) MODE="2d" ;;
    3) MODE="desktop" ;;
    4) MODE="headless" ;;
    5) setup_autostart ;;
    6) setup_service ;;
    *) exit 0 ;;
  esac
fi

# No user/network namespace privileges are required. For guaranteed offline
# operation, disconnect Ethernet and disable Wi-Fi before starting.
for dependency in node curl; do
  if ! command -v "$dependency" &> /dev/null; then
    echo "[ERROR] Launch requires '$dependency' to be installed locally." >&2
    exit 1
  fi
done
echo "For strictly offline operation, disable Wi-Fi and unplug Ethernet."

# Start the server
start_server

# Verify Chromium is available for GUI modes
if [[ "$MODE" != "headless" && -z "$CHROMIUM_BIN" ]]; then
  echo -e "${YELLOW}Warning: Chromium browser not found. Running in headless mode.${NC}"
  echo -e "Open http://localhost:$PORT in a browser on this Pi."
  wait $SERVER_PID
  exit 0
fi

# Launch Chromium flags for Raspberry Pi
CHROME_FLAGS=(
  "--user-data-dir=${XDG_CONFIG_HOME:-$HOME/.config}/threatsim-chromium"
  "--no-first-run"
  "--disable-background-networking"
  "--disable-component-update"
  "--disable-sync"
  "--disable-extensions"
  "--no-proxy-server"
  "--noerrdialogs"
  "--disable-infobars"
  "--check-for-update-interval=31536000"
  "--disable-pinch"
  "--overscroll-history-navigation=0"
  "--autoplay-policy=no-user-gesture-required" # Enables sound automatically on kiosk boot!
  "--enable-features=OverlayScrollbar"
  "--disable-translate"
  "--fast"
  "--fast-start"
  "--password-store=basic"
)

# Launch based on mode
case "$MODE" in
  kiosk)
    echo -e "${CYAN}Launching Full-Screen 3D Kiosk Mode...${NC}"
    # Hide mouse cursor when idle
    command -v unclutter &> /dev/null && unclutter -idle 2 &
    "$CHROMIUM_BIN" "${CHROME_FLAGS[@]}" --kiosk "http://localhost:$PORT?mode=pi"
    ;;

  2d)
    echo -e "${CYAN}Launching Full-Screen 2D Tactical Kiosk Mode...${NC}"
    command -v unclutter &> /dev/null && unclutter -idle 2 &
    "$CHROMIUM_BIN" "${CHROME_FLAGS[@]}" --kiosk "http://localhost:$PORT?mode=2d"
    ;;

  desktop)
    echo -e "${CYAN}Launching in standard browser window...${NC}"
    "$CHROMIUM_BIN" "${CHROME_FLAGS[@]}" --app="http://localhost:$PORT"
    ;;

  headless)
    echo -e "${GREEN}Running headless. Server available at http://localhost:$PORT${NC}"
    echo "This address is accessible only on this Pi."
    echo -e "Press Ctrl+C to stop."
    wait $SERVER_PID
    ;;

  *)
    echo -e "${RED}Unknown mode: $MODE${NC}"
    exit 1
    ;;
esac
