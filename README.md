# Middle Georgia State University - Cyber Threat Simulator

A high-tech cyber threat simulation map branded for **Middle Georgia State University (MGA)** and inspired by the [Bitdefender Threat Map](https://threatmap.bitdefender.com/). Built using standard web technologies (**HTML5, CSS3, JavaScript, WebGL / Three.js, Canvas 2D, and Web Audio API**) styled in MGA's signature purple (`#633393`).

> **100% Offline & Simulated:** Designed purely as visual "eye candy" for MGA cyber labs, NOC/SOC displays, classroom presentations, or events. It does not connect to real networks or external APIs. All country geometries, vendor scripts, and assets are bundled locally.

---

## 🚀 Quick Start

### Option 1: One-Click Launch (Windows)
Double-click `start.bat` in the project folder. It will launch the local static server and automatically open your default web browser to `http://localhost:3000`.

### Option 2: Raspberry Pi (SOC / NOC Kiosk Display)
1. Run the dependency installer on your Raspberry Pi:
   ```bash
   chmod +x install-pi.sh start-pi.sh
   ./install-pi.sh
   ```
2. Start the threat map:
   ```bash
   ./start-pi.sh          # Interactive menu
   ./start-pi.sh kiosk    # Full-screen 3D Globe Kiosk with auto sound
   ./start-pi.sh 2d       # Full-screen 2D Tactical Map (ideal for Pi 2 / 3)
   ./start-pi.sh headless # Server-only on port 3000
   ```
3. To automatically launch into full-screen Kiosk mode on boot:
   ```bash
   ./start-pi.sh autostart
   ```

### Option 3: Command Line (Node.js)
```bash
npm start
# or
node server.js
```
Then open `http://localhost:3000` in any modern web browser (Chrome, Firefox, Edge, Safari).

### Option 4: Direct File
You can also open `index.html` directly in your browser.

---

## ⚡ Key Features

1. **Dual Visual Projections**:
   - **3D Holographic Globe**: Powered by Three.js with vector country borders, atmospheric Fresnel glow, starry space backdrop, and smooth orbit controls (pan, zoom, auto-rotate).
   - **2D Tactical Map**: High-performance Canvas 2D projection with coordinate grid, neon coastlines, and radar sweep. Switchable with a single click.

2. **Ballistic Attack Arcs & Particle FX**:
   - Dynamic 3D & 2D Bézier ballistic curves with altitudes proportional to distance.
   - Animated photon tracer bullets trailing behind each missile.
   - Concentric origin beacons.
   - Impact detonations with expanding shockwaves, radial spark bursts, and flashes.

3. **Color-Coded Threat Classification**:
   - 🔴 **Active Attacks / Exploits** (`#ff0055`): Zero-days, RCEs, SSL-VPN exploits, brute force.
   - 🔵 **Malware / Trojans** (`#00f0ff`): Infostealers, loaders, C2 beacons, botnet stagers.
   - 🟠 **Spam / Phishing** (`#ffaa00`): Credential harvesting, fake invoices, scam blasts.
   - 🟣 **Ransomware** (`#b026ff`): Encryptors, data exfiltration, lateral movement.
   - 🟢 **DDoS Floods** (`#00ff66`): SYN floods, HTTP/2 Rapid Reset, DNS reflection bursts.

4. **Procedural Threat Engine**:
   - Realistic threat categories and CVE names (`CVE-2024-21762`, `Log4Shell`, `LockBit 3.0`, `Emotet`, `Mirai`, etc.).
   - Realistic IP addresses and port/protocol mappings (HTTPS: 443, SSH: 22, RDP: 3389, SMB: 445, etc.).
   - Weighted target and attacker distribution across 177 nations with realistic tech/economic hubs.

5. **Procedural Web Audio Synthesizer**:
   - 100% offline audio synthesis via the HTML5 Web Audio API (zero audio files needed).
   - Dynamic laser swoop frequencies for launches.
   - Sub-bass punch and filtered noise explosions for impacts.
   - Emergency two-tone siren klaxon for Cyber War mode.
   - Crisp UI blips for interactions.

6. **Interactive Telemetry Dashboard (HUD)**:
   - **Real-Time Counters**: Total Attacks Detected, Attacks Per Second (APS) meter, UTC military clock, and session uptime.
   - **Leaderboards**: Top 5 Attacking Sources and Top 5 Targeted Nations with flags and counts.
   - **Target Nation Intelligence**: Click any country or leaderboard entry to inspect inbound vs. outbound metrics, dominant vector, targeted ports, and defensive shield integrity.
   - **Target Swarm Trigger**: Click "SWARM TARGET" to launch a multi-source DDoS attack converging on that nation.
   - **Live Attack Telemetry Stream**: Real-time scrolling terminal log with category filters (`ALL`, `ATTACKS`, `MALWARE`, `SPAM`, `RANSOMWARE`, `DDOS`). Clicking any log row flies the camera directly to the victim country.
   - **Simulation Speed Controls**: `PAUSE`, `1X`, `2X`, `5X`, and `CYBER WAR` (instant chaos storm).

---

## 📁 Project Structure

```
threat-sim/
├── index.html                     # Main application entry point & HUD layout
├── server.js                      # Zero-dependency local static HTTP server
├── start.bat                      # One-click Windows launch script
├── package.json                   # Project metadata & npm start script
├── README.md                      # Documentation
├── css/
│   └── style.css                  # Dark cyber command center theme & styling
├── js/
│   ├── world-data.js              # 177 country geometries, hubs, coordinates, and flags
│   ├── simulation.js              # Procedural threat generator & metrics tracker
│   ├── audio.js                   # Web Audio API procedural sound synthesizer
│   ├── globe-renderer.js          # 3D Three.js Earth globe with arcs & particles
│   ├── map2d-renderer.js          # 2D Canvas tactical map projection
│   └── app.js                     # Main coordinator connecting UI and simulation
└── assets/
    └── vendor/
        └── three.bundle.js        # Bundled Three.js + OrbitControls (offline)
```
