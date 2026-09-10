/**
 * Cyber Threat Simulation - Application Coordinator
 * Links Geodata, Audio Synthesizer, Simulation Engine, 3D Globe, 2D Map, and HUD UI.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Check required data
  if (!window.WORLD_DATA || !window.WORLD_DATA.countries) {
    console.error('WORLD_DATA failed to load.');
    return;
  }

  // 1. Initialize Audio Synthesizer
  const audio = new CyberAudioSynthesizer();

  // 2. Initialize Viewport Renderers
  const globeContainer = document.getElementById('globe-viewport');
  const map2dContainer = document.getElementById('map2d-viewport');

  const globe = new GlobeRenderer(globeContainer, window.WORLD_DATA, audio);
  const map2d = new Map2DRenderer(map2dContainer, window.WORLD_DATA, audio);

  let currentView = '3d'; // '3d' or '2d'

  // 3. Initialize Simulation Engine
  const simulation = new ThreatSimulationEngine(window.WORLD_DATA.countries);

  // Selected Country Intel state
  let selectedCountry = window.WORLD_DATA.countries.find(c => c.id === 'US') || window.WORLD_DATA.countries[0];

  // 4. UI Elements Cache
  const elTotalAttacks = document.getElementById('metric-total-attacks');
  const elApsVal = document.getElementById('metric-aps');
  const elClockUtc = document.getElementById('clock-utc');
  const elClockUptime = document.getElementById('clock-uptime');

  const elCatBars = {
    attack: { bar: document.getElementById('bar-attack'), count: document.getElementById('count-attack') },
    malware: { bar: document.getElementById('bar-malware'), count: document.getElementById('count-malware') },
    spam: { bar: document.getElementById('bar-spam'), count: document.getElementById('count-spam') },
    ransomware: { bar: document.getElementById('bar-ransomware'), count: document.getElementById('count-ransomware') },
    ddos: { bar: document.getElementById('bar-ddos'), count: document.getElementById('count-ddos') }
  };

  const elTopAttackers = document.getElementById('list-top-attackers');
  const elTopVictims = document.getElementById('list-top-victims');
  const elStreamTableBody = document.getElementById('stream-table-body');

  // Country Intel UI Elements
  const elIntelFlag = document.getElementById('intel-flag');
  const elIntelName = document.getElementById('intel-name');
  const elIntelCity = document.getElementById('intel-city');
  const elIntelInbound = document.getElementById('intel-inbound');
  const elIntelOutbound = document.getElementById('intel-outbound');
  const elIntelThreat = document.getElementById('intel-threat');
  const elIntelPort = document.getElementById('intel-port');
  const elIntelShieldVal = document.getElementById('intel-shield-val');
  const elIntelShieldFill = document.getElementById('intel-shield-fill');

  // Active filter
  let activeFilter = 'all';

  // 5. Connect Simulation Callbacks
  simulation.onAttack = attack => {
    // Launch on active visual renderer
    if (currentView === '3d') {
      globe.launchAttack(attack);
    } else {
      map2d.launchAttack(attack);
    }

    // Add to Live Stream Table
    addAttackToStream(attack);

    // Update selected country panel if involved
    if (selectedCountry && (attack.target.id === selectedCountry.id || attack.source.id === selectedCountry.id)) {
      updateCountryIntel(selectedCountry);
    }
  };

  simulation.onMetrics = metrics => {
    // Total attacks & APS
    elTotalAttacks.innerText = metrics.totalAttacks.toLocaleString();
    elApsVal.innerText = metrics.attacksPerSecond.toFixed(1);

    // Threat distribution bars
    const total = Math.max(1, metrics.totalAttacks);
    Object.keys(elCatBars).forEach(cat => {
      const count = metrics.categories[cat] || 0;
      const pct = Math.round((count / total) * 100);
      if (elCatBars[cat].bar) elCatBars[cat].bar.style.width = `${pct}%`;
      if (elCatBars[cat].count) elCatBars[cat].count.innerText = `${count} (${pct}%)`;
    });

    // Render Top Attackers
    renderRankList(elTopAttackers, metrics.topAttackers, 'outbound');

    // Render Top Victims
    renderRankList(elTopVictims, metrics.topVictims, 'inbound');

    // Update current selected country stats
    if (selectedCountry) {
      updateCountryIntel(selectedCountry);
    }
  };

  function renderRankList(container, list, type) {
    if (!container) return;
    container.innerHTML = '';
    list.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = 'rank-item';
      row.innerHTML = `
        <div class="rank-left">
          <span class="rank-num">${index + 1}</span>
          <span>${item.flag}</span>
          <span class="rank-name">${item.name}</span>
        </div>
        <span class="rank-count">${item.count}</span>
      `;
      row.addEventListener('click', () => {
        const country = window.WORLD_DATA.countries.find(c => c.id === item.id);
        if (country) {
          selectCountry(country);
          audio.playBlip();
        }
      });
      container.appendChild(row);
    });
  }

  function updateCountryIntel(country) {
    if (!country) return;
    elIntelFlag.innerText = country.flag || '🌐';
    elIntelName.innerText = country.name;
    elIntelCity.innerText = country.city || country.name;
    elIntelInbound.innerText = country.stats.inbound.toLocaleString();
    elIntelOutbound.innerText = country.stats.outbound.toLocaleString();
    elIntelThreat.innerText = country.stats.dominantThreat || 'None';
    elIntelPort.innerText = country.stats.topPort ? `${country.stats.topPort}` : '443';

    const shieldPct = Math.round(country.stats.shieldHealth);
    elIntelShieldVal.innerText = `${shieldPct}%`;
    elIntelShieldFill.style.width = `${shieldPct}%`;
    if (shieldPct < 40) {
      elIntelShieldFill.style.background = '#ff0055';
    } else if (shieldPct < 70) {
      elIntelShieldFill.style.background = '#ffaa00';
    } else {
      elIntelShieldFill.style.background = 'linear-gradient(90deg, #ff0055, #ffaa00, #00ff66)';
    }
  }

  function selectCountry(country) {
    selectedCountry = country;
    updateCountryIntel(country);
    if (currentView === '3d') {
      globe.flyToCountry(country);
    }
  }

  // Connect globe country clicks
  globe.onCountryClick = country => selectCountry(country);
  map2d.onCountryClick = country => selectCountry(country);

  // 6. Live Stream Console
  function addAttackToStream(attack) {
    const isVisible = (activeFilter === 'all' || activeFilter === attack.threat.category);

    const row = document.createElement('tr');
    row.className = 'stream-row';
    row.dataset.category = attack.threat.category;
    if (!isVisible) {
      row.style.display = 'none';
    }

    row.style.borderLeft = `3px solid ${attack.threat.color}`;

    row.innerHTML = `
      <td>${attack.timeStr}</td>
      <td>${attack.source.flag} ${attack.source.name} <span class="ip-text">(${attack.source.ip})</span></td>
      <td>${attack.target.flag} ${attack.target.name} <span class="ip-text">(${attack.target.ip})</span></td>
      <td style="color:${attack.threat.color}">${attack.threat.name}</td>
      <td><span style="color:var(--text-secondary)">${attack.threat.port}</span> (${attack.threat.service})</td>
      <td><span class="badge-sev badge-${attack.threat.severity}">${attack.threat.severity}</span></td>
    `;

    row.addEventListener('click', () => {
      audio.playBlip();
      const targetCountry = window.WORLD_DATA.countries.find(c => c.id === attack.target.id);
      if (targetCountry) {
        selectCountry(targetCountry);
      }
    });

    elStreamTableBody.insertBefore(row, elStreamTableBody.firstChild);

    // Keep max 30 rows in DOM for performance
    while (elStreamTableBody.children.length > 30) {
      elStreamTableBody.removeChild(elStreamTableBody.lastChild);
    }
  }

  // Filter Buttons
  document.querySelectorAll('.btn-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      audio.playBlip();

      const rows = elStreamTableBody.querySelectorAll('.stream-row');
      rows.forEach(r => {
        if (activeFilter === 'all' || r.dataset.category === activeFilter) {
          r.style.display = '';
        } else {
          r.style.display = 'none';
        }
      });
    });
  });

  // 7. Navigation & Controls
  // View Switch (3D vs 2D)
  const btnView3d = document.getElementById('btn-view-3d');
  const btnView2d = document.getElementById('btn-view-2d');

  btnView3d.addEventListener('click', () => {
    if (currentView === '3d') return;
    currentView = '3d';
    btnView3d.classList.add('active');
    btnView2d.classList.remove('active');
    globeContainer.classList.remove('hidden');
    map2dContainer.classList.add('hidden');
    audio.playBlip();
  });

  btnView2d.addEventListener('click', () => {
    if (currentView === '2d') return;
    currentView = '2d';
    btnView2d.classList.add('active');
    btnView3d.classList.remove('active');
    globeContainer.classList.add('hidden');
    map2dContainer.classList.remove('hidden');
    map2d.resize();
    audio.playBlip();
  });

  // Auto-Rotate Toggle
  const btnAutoRotate = document.getElementById('btn-auto-rotate');
  let autoRotateState = true;
  btnAutoRotate.addEventListener('click', () => {
    autoRotateState = !autoRotateState;
    globe.setAutoRotate(autoRotateState);
    btnAutoRotate.classList.toggle('active', autoRotateState);
    audio.playBlip();
  });

  // Audio Toggle
  const btnAudio = document.getElementById('btn-audio');

  function updateAudioUI(state) {
    if (state === 'active') {
      btnAudio.className = 'btn-tech active';
      btnAudio.innerText = '🔊 AUDIO: ON';
      btnAudio.title = 'Sound active. Click to disable for performance';
    } else {
      btnAudio.className = 'btn-tech';
      btnAudio.innerText = '🔇 AUDIO: OFF';
      btnAudio.title = 'Sound disabled. Click to enable';
    }
  }

  audio.onStateChange = state => {
    updateAudioUI(state);
  };
  updateAudioUI(audio.getState());

  btnAudio.addEventListener('click', () => {
    audio.toggleMute();
  });

  // Speed Controls
  const speedBtns = {
    pause: document.getElementById('speed-pause'),
    x1: document.getElementById('speed-1x'),
    x2: document.getElementById('speed-2x'),
    x5: document.getElementById('speed-5x'),
    war: document.getElementById('speed-war')
  };

  function setSpeedActive(activeBtn, speedVal) {
    Object.values(speedBtns).forEach(b => b.classList.remove('active'));
    activeBtn.classList.add('active');
    simulation.setSpeed(speedVal);
    audio.playBlip();
  }

  speedBtns.pause.addEventListener('click', () => setSpeedActive(speedBtns.pause, 0));
  speedBtns.x1.addEventListener('click', () => setSpeedActive(speedBtns.x1, 1.0));
  speedBtns.x2.addEventListener('click', () => setSpeedActive(speedBtns.x2, 2.2));
  speedBtns.x5.addEventListener('click', () => setSpeedActive(speedBtns.x5, 5.0));

  speedBtns.war.addEventListener('click', () => {
    setSpeedActive(speedBtns.war, 7.5);
    audio.playAlarm();
    simulation.triggerCyberWar();
  });

  // Country Intel Action Buttons
  const btnFocusCountry = document.getElementById('btn-focus-country');
  const btnDdosCountry = document.getElementById('btn-ddos-country');

  btnFocusCountry.addEventListener('click', () => {
    if (selectedCountry) {
      selectCountry(selectedCountry);
      audio.playBlip();
    }
  });

  btnDdosCountry.addEventListener('click', () => {
    if (selectedCountry) {
      simulation.triggerDdosStorm(selectedCountry.id);
      audio.playAlarm();
    }
  });

  // Fullscreen Button
  const btnFullscreen = document.getElementById('btn-fullscreen');
  btnFullscreen.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      btnFullscreen.innerText = '⛶ EXIT FULLSCREEN';
    } else {
      document.exitFullscreen().catch(() => {});
      btnFullscreen.innerText = '⛶ FULLSCREEN';
    }
  });

  // 8. Clocks & Timers
  const startTime = Date.now();
  function updateClocks() {
    const now = new Date();
    // Military UTC Clock
    const utcHours = String(now.getUTCHours()).padStart(2, '0');
    const utcMins = String(now.getUTCMinutes()).padStart(2, '0');
    const utcSecs = String(now.getUTCSeconds()).padStart(2, '0');
    elClockUtc.innerText = `${utcHours}:${utcMins}:${utcSecs} UTC`;

    // Simulation Uptime
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const upHrs = String(Math.floor(elapsed / 3600)).padStart(2, '0');
    const upMins = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
    const upSecs = String(elapsed % 60).padStart(2, '0');
    elClockUptime.innerText = `${upHrs}:${upMins}:${upSecs}`;
  }
  setInterval(updateClocks, 1000);
  updateClocks();

  // Initial Country Card Display
  updateCountryIntel(selectedCountry);

  // 9. URL Parameters (e.g. ?mode=2d, ?mode=pi, ?speed=2x, ?speed=war)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('mode') === '2d') {
    btnView2d.click();
  }
  if (urlParams.get('speed') === '2x') {
    speedBtns.x2.click();
  } else if (urlParams.get('speed') === '5x') {
    speedBtns.x5.click();
  } else if (urlParams.get('speed') === 'war') {
    speedBtns.war.click();
  }

  // 10. Start Simulation
  simulation.start();
});
