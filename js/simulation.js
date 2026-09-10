/**
 * Cyber Threat Simulation - Threat Engine
 * Generates realistic procedural attacks, IP addresses, payloads, and statistics.
 * 100% offline, simulated data for eye-candy visualization.
 */

const THREAT_CATEGORIES = {
  attack: {
    id: 'attack',
    label: 'Active Attack',
    color: '#ff0055',
    colorHex: 0xff0055,
    glow: 'rgba(255, 0, 85, 0.7)'
  },
  malware: {
    id: 'malware',
    label: 'Malware / Trojan',
    color: '#00f0ff',
    colorHex: 0x00f0ff,
    glow: 'rgba(0, 240, 255, 0.7)'
  },
  spam: {
    id: 'spam',
    label: 'Spam / Phishing',
    color: '#ffaa00',
    colorHex: 0xffaa00,
    glow: 'rgba(255, 170, 0, 0.7)'
  },
  ransomware: {
    id: 'ransomware',
    label: 'Ransomware / Extortion',
    color: '#9055d4',
    colorHex: 0x9055d4,
    glow: 'rgba(144, 85, 212, 0.7)'
  },
  ddos: {
    id: 'ddos',
    label: 'DDoS Flood',
    color: '#00ff66',
    colorHex: 0x00ff66,
    glow: 'rgba(0, 255, 102, 0.7)'
  }
};

const THREAT_PAYLOADS = {
  attack: [
    { name: 'CVE-2024-21762 SSL-VPN RCE', port: 443, service: 'HTTPS / VPN', severity: 'critical' },
    { name: 'Log4Shell JNDI Injection', port: 8080, service: 'HTTP-Alt', severity: 'critical' },
    { name: 'Citrix Bleed Memory Disclosure', port: 443, service: 'HTTPS', severity: 'high' },
    { name: 'FortiOS Pre-Auth Bypass', port: 8443, service: 'HTTPS-Admin', severity: 'critical' },
    { name: 'OpenSSH RegreSSHion RCE', port: 22, service: 'SSH', severity: 'high' },
    { name: 'Apache Struts OGNL Injection', port: 80, service: 'HTTP', severity: 'high' },
    { name: 'Exchange Proxyshell SSRF', port: 443, service: 'MS-Exchange', severity: 'critical' },
    { name: 'Ivanti Connect Secure Auth Bypass', port: 443, service: 'VPN Gateway', severity: 'critical' },
    { name: 'SSH Automated Brute Force', port: 22, service: 'SSH', severity: 'medium' },
    { name: 'MS-SMB Remote Code Exec Probe', port: 445, service: 'SMB', severity: 'high' },
    { name: 'PostgreSQL SQLi Injection Probe', port: 5432, service: 'PostgreSQL', severity: 'medium' }
  ],
  malware: [
    { name: 'RedLine Infostealer Drop', port: 443, service: 'HTTPS', severity: 'high' },
    { name: 'Emotet Trojan Propagation', port: 445, service: 'SMB', severity: 'critical' },
    { name: 'Cobalt Strike Beacon Stager', port: 8443, service: 'Custom HTTPS', severity: 'critical' },
    { name: 'AgentTesla Credentials Exfil', port: 587, service: 'SMTP-TLS', severity: 'high' },
    { name: 'QakBot Malicious Payload Drop', port: 443, service: 'HTTPS', severity: 'high' },
    { name: 'Vidar Stealer Telegram C2', port: 443, service: 'Telegram API', severity: 'medium' },
    { name: 'Lumma Stealer Memory Injector', port: 80, service: 'HTTP', severity: 'high' },
    { name: 'DarkGate Loader Injection', port: 443, service: 'HTTPS', severity: 'high' },
    { name: 'AsyncRAT Remote Access Beacon', port: 6666, service: 'Raw TCP', severity: 'medium' },
    { name: 'XMRig Cryptominer Dropper', port: 3333, service: 'Stratum', severity: 'low' }
  ],
  spam: [
    { name: 'M365 Credential Harvest Phish', port: 443, service: 'HTTPS', severity: 'high' },
    { name: 'Fake Invoice PDF Malspam Blast', port: 25, service: 'SMTP', severity: 'medium' },
    { name: 'Spear Phishing - Exec Impersonation', port: 587, service: 'SMTP-TLS', severity: 'high' },
    { name: 'Tax Refund SMS / Smishing Campaign', port: 80, service: 'HTTP', severity: 'medium' },
    { name: 'Banking 2FA Intercept Lure', port: 443, service: 'HTTPS', severity: 'high' },
    { name: 'Cryptocurrency Giveaway Scam', port: 443, service: 'HTTPS', severity: 'low' },
    { name: 'DocuSign Signature Request Phish', port: 443, service: 'HTTPS', severity: 'medium' },
    { name: 'Fake Antivirus Renewal Invoice', port: 25, service: 'SMTP', severity: 'low' }
  ],
  ransomware: [
    { name: 'LockBit 3.0 Encryptor Staging', port: 445, service: 'SMB / Admin$', severity: 'critical' },
    { name: 'BlackCat (ALPHV) Data Exfil', port: 443, service: 'HTTPS / Cloud', severity: 'critical' },
    { name: 'Akira Ransomware Lateral Move', port: 3389, service: 'RDP', severity: 'critical' },
    { name: 'Play Ransomware VSS Wipe Command', port: 135, service: 'RPC / WMI', severity: 'critical' },
    { name: 'Rhysida Ransomware Beacon', port: 443, service: 'HTTPS', severity: 'critical' },
    { name: 'Medusa Ransomware Share Scan', port: 445, service: 'SMB', severity: 'critical' },
    { name: 'BlackSuit Active Directory Attack', port: 389, service: 'LDAP / Kerberos', severity: 'critical' }
  ],
  ddos: [
    { name: 'SYN Flood - 480 Gbps Surge', port: 443, service: 'TCP SYN', severity: 'critical' },
    { name: 'HTTP/2 Rapid Reset Flood', port: 443, service: 'HTTP/2 Stream', severity: 'critical' },
    { name: 'Mirai Botnet DNS Amplification', port: 53, service: 'DNS UDP', severity: 'high' },
    { name: 'NTP Reflection Volumetric Blast', port: 123, service: 'NTP UDP', severity: 'high' },
    { name: 'SSDP Reflection Flood', port: 1900, service: 'SSDP UDP', severity: 'medium' },
    { name: 'CLDAP Amplification Vector', port: 389, service: 'CLDAP', severity: 'high' },
    { name: 'Memcached Amplification Spike', port: 11211, service: 'Memcached', severity: 'high' },
    { name: 'Layer 7 HTTP POST Flood', port: 80, service: 'HTTP', severity: 'medium' }
  ]
};

class ThreatSimulationEngine {
  constructor(countriesData) {
    this.countries = countriesData || [];
    this.countryMap = new Map();
    this.totalWeight = 0;

    this.countries.forEach(c => {
      this.countryMap.set(c.id, c);
      this.totalWeight += (c.weight || 10);
      c.stats = {
        inbound: 0,
        outbound: 0,
        shieldHealth: 100, // 0 to 100%
        dominantThreat: 'None',
        topPort: 443
      };
    });

    // Running metrics
    this.totalAttacks = 0;
    this.categoryCounts = {
      attack: 0,
      malware: 0,
      spam: 0,
      ransomware: 0,
      ddos: 0
    };

    // Rolling APS tracking
    this.recentTimestamps = [];
    this.attacksPerSecond = 0;

    // Simulation timing
    this.speed = 1.0; // 0 = paused, 1 = normal, 2 = fast, 5 = intense, 10 = cyber war
    this.timer = null;
    this.baseIntervalMs = 280; // ~3.5 attacks/sec at 1x
    this.running = false;

    // Event listeners
    this.onAttack = null;
    this.onMetrics = null;

    // Attack history for feed
    this.history = [];
    this.maxHistory = 100;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.scheduleNextAttack();

    // Regular metrics ticker (every 500ms)
    this.metricsInterval = setInterval(() => {
      this.updateMetrics();
    }, 500);

    // Shield health slow regeneration (every 1000ms)
    this.regenInterval = setInterval(() => {
      this.regenerateShields();
    }, 1000);
  }

  stop() {
    this.running = false;
    if (this.timer) clearTimeout(this.timer);
    if (this.metricsInterval) clearInterval(this.metricsInterval);
    if (this.regenInterval) clearInterval(this.regenInterval);
  }

  setSpeed(factor) {
    this.speed = factor;
    if (this.timer) clearTimeout(this.timer);
    if (this.speed > 0 && this.running) {
      this.scheduleNextAttack();
    }
  }

  scheduleNextAttack() {
    if (!this.running || this.speed <= 0) return;
    const interval = Math.max(15, (this.baseIntervalMs / this.speed) * (0.6 + Math.random() * 0.8));
    this.timer = setTimeout(() => {
      this.spawnAttack();
      this.scheduleNextAttack();
    }, interval);
  }

  getRandomCountry(excludeId = null) {
    let rnd = Math.random() * this.totalWeight;
    for (let i = 0; i < this.countries.length; i++) {
      const c = this.countries[i];
      if (excludeId && c.id === excludeId) continue;
      const w = c.weight || 10;
      if (rnd < w) return c;
      rnd -= w;
    }
    return this.countries[Math.floor(Math.random() * this.countries.length)];
  }

  getRandomIP(countryId) {
    // Generate realistic looking IPv4
    const firstOctet = [
      45, 62, 77, 85, 91, 103, 109, 138, 142, 151, 168, 172, 176, 185, 194, 203, 212
    ][Math.floor(Math.random() * 17)];
    const b = Math.floor(Math.random() * 254) + 1;
    const c = Math.floor(Math.random() * 254) + 1;
    const d = Math.floor(Math.random() * 254) + 1;
    return `${firstOctet}.${b}.${c}.${d}`;
  }

  getRandomThreat() {
    const catKeys = Object.keys(THREAT_CATEGORIES);
    // Weighted selection of categories
    const weights = { attack: 35, malware: 25, ddos: 18, ransomware: 12, spam: 10 };
    let rnd = Math.random() * 100;
    let chosenCat = 'attack';
    for (const [cat, w] of Object.entries(weights)) {
      if (rnd < w) {
        chosenCat = cat;
        break;
      }
      rnd -= w;
    }

    const payloadList = THREAT_PAYLOADS[chosenCat];
    const payload = payloadList[Math.floor(Math.random() * payloadList.length)];
    const categoryInfo = THREAT_CATEGORIES[chosenCat];

    return {
      category: chosenCat,
      categoryLabel: categoryInfo.label,
      color: categoryInfo.color,
      colorHex: categoryInfo.colorHex,
      name: payload.name,
      port: payload.port,
      service: payload.service,
      severity: payload.severity
    };
  }

  spawnAttack(customSource = null, customTarget = null, customCategory = null) {
    if (this.countries.length < 2) return null;

    const source = customSource || this.getRandomCountry();
    const target = customTarget || this.getRandomCountry(source.id);
    const threat = customCategory
      ? this.getSpecificThreat(customCategory)
      : this.getRandomThreat();

    const attackId = 'att_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4);
    const timestamp = new Date();

    const attack = {
      id: attackId,
      timestamp: timestamp,
      timeStr: timestamp.toTimeString().split(' ')[0] + '.' + String(timestamp.getMilliseconds()).padStart(3, '0').slice(0, 2),
      source: {
        id: source.id,
        name: source.name,
        city: source.city,
        flag: source.flag,
        lat: source.lat,
        lon: source.lon,
        ip: this.getRandomIP(source.id)
      },
      target: {
        id: target.id,
        name: target.name,
        city: target.city,
        flag: target.flag,
        lat: target.lat,
        lon: target.lon,
        ip: this.getRandomIP(target.id)
      },
      threat: threat,
      duration: Math.max(1.2, Math.min(2.8, 1.8 + (Math.random() - 0.5) * 0.8)) // Flight time in seconds
    };

    // Update internal statistics
    this.totalAttacks++;
    this.categoryCounts[threat.category] = (this.categoryCounts[threat.category] || 0) + 1;
    source.stats.outbound++;
    target.stats.inbound++;
    target.stats.dominantThreat = threat.categoryLabel;
    target.stats.topPort = threat.port;

    // Drain target shield slightly (more for critical)
    const drain = threat.severity === 'critical' ? 4 : threat.severity === 'high' ? 2.5 : 1;
    target.stats.shieldHealth = Math.max(15, target.stats.shieldHealth - drain);

    // Track APS
    const now = Date.now();
    this.recentTimestamps.push(now);

    // Add to history
    this.history.unshift(attack);
    if (this.history.length > this.maxHistory) {
      this.history.pop();
    }

    if (this.onAttack) {
      this.onAttack(attack);
    }

    return attack;
  }

  getSpecificThreat(categoryKey) {
    const payloadList = THREAT_PAYLOADS[categoryKey] || THREAT_PAYLOADS.attack;
    const payload = payloadList[Math.floor(Math.random() * payloadList.length)];
    const categoryInfo = THREAT_CATEGORIES[categoryKey] || THREAT_CATEGORIES.attack;
    return {
      category: categoryKey,
      categoryLabel: categoryInfo.label,
      color: categoryInfo.color,
      colorHex: categoryInfo.colorHex,
      name: payload.name,
      port: payload.port,
      service: payload.service,
      severity: payload.severity
    };
  }

  /**
   * Triggers a massive DDoS swarm on a target nation
   */
  triggerDdosStorm(targetId = null) {
    const target = targetId ? this.countryMap.get(targetId) : this.getRandomCountry();
    if (!target) return;

    const count = 12;
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const source = this.getRandomCountry(target.id);
        this.spawnAttack(source, target, 'ddos');
      }, i * 60);
    }
  }

  /**
   * Triggers maximum visual eye-candy "CYBER WAR" chaos
   */
  triggerCyberWar() {
    const burstCount = 28;
    for (let i = 0; i < burstCount; i++) {
      setTimeout(() => {
        this.spawnAttack();
      }, i * 40);
    }
  }

  regenerateShields() {
    this.countries.forEach(c => {
      if (c.stats.shieldHealth < 100) {
        c.stats.shieldHealth = Math.min(100, c.stats.shieldHealth + 0.8);
      }
    });
  }

  updateMetrics() {
    const now = Date.now();
    // Keep timestamps from last 1.5 seconds
    this.recentTimestamps = this.recentTimestamps.filter(t => now - t <= 1500);
    this.attacksPerSecond = Math.round((this.recentTimestamps.length / 1.5) * 10) / 10;

    // Top 5 Attackers
    const topAttackers = [...this.countries]
      .sort((a, b) => b.stats.outbound - a.stats.outbound)
      .slice(0, 5)
      .map(c => ({
        id: c.id,
        name: c.name,
        flag: c.flag,
        count: c.stats.outbound
      }));

    // Top 5 Victims
    const topVictims = [...this.countries]
      .sort((a, b) => b.stats.inbound - a.stats.inbound)
      .slice(0, 5)
      .map(c => ({
        id: c.id,
        name: c.name,
        flag: c.flag,
        count: c.stats.inbound,
        shieldHealth: Math.round(c.stats.shieldHealth)
      }));

    const metricsData = {
      totalAttacks: this.totalAttacks,
      attacksPerSecond: this.attacksPerSecond,
      categories: { ...this.categoryCounts },
      topAttackers,
      topVictims
    };

    if (this.onMetrics) {
      this.onMetrics(metricsData);
    }
  }
}

window.THREAT_CATEGORIES = THREAT_CATEGORIES;
window.ThreatSimulationEngine = ThreatSimulationEngine;
