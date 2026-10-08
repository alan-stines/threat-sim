/* Fictional, deterministic teaching exercise. No network or file operations. */
const CAMPUS_SERVICES = ['Campus email', 'Identity & access', 'Student portal', 'Research files', 'Campus Wi-Fi', 'Backup vault'];
const CAMPUS_STAGES = [
  { title: 'Campus ready', states: ['Online', 'Online', 'Online', 'Online', 'Online', 'Protected'], route: [],
    story: 'A normal teaching day. Six fictional services support the MGA campus. Run the 90-second exercise or advance one stage at a time.',
    action: 'Watch how one compromised account affects connected services, and how isolation limits the damage.' },
  { title: '01 / Phishing arrives', states: ['Alert', 'Online', 'Online', 'Online', 'Online', 'Protected'], route: [0],
    story: 'A simulated scholarship message reaches a campus mailbox. Its sign-in link leads to a fictional credential collection page.',
    action: 'Report the message and remove matching emails. Discuss: what would make this message convincing?' },
  { title: '02 / Account compromised', states: ['Compromised', 'Compromised', 'Online', 'Online', 'Online', 'Protected'], route: [0, 1],
    story: 'The scenario assumes a user submits credentials and approves an unexpected sign-in prompt. The attacker obtains a session.',
    action: 'Revoke active sessions and reset the affected account. Phishing-resistant authentication can reduce this risk.' },
  { title: '03 / Lateral movement', states: ['Compromised', 'Compromised', 'At risk', 'At risk', 'Online', 'Protected'], route: [1, 2, 3],
    story: 'Excessive account permissions expose the student portal and shared research storage. Campus Wi-Fi remains in a separate segment.',
    action: 'Investigate unusual access and restrict the account. Least privilege and segmentation reduce the reach of a compromise.' },
  { title: '04 / Ransomware impact', states: ['Compromised', 'Compromised', 'Offline', 'Encrypted', 'Online', 'Protected'], route: [2, 3],
    story: 'Fictional research files are encrypted and the student portal is taken offline. The isolated backup vault remains protected.',
    action: 'Declare an incident, preserve evidence, and prioritize critical services. No real files are touched by this demonstration.' },
  { title: '05 / Containment', states: ['Isolated', 'Secured', 'Isolated', 'Isolated', 'Online', 'Protected'], route: [],
    story: 'Defenders revoke the compromised sessions and isolate affected systems. The simulated spread stops at the segment boundaries.',
    action: 'Verify containment and identify the initial access path before reconnecting systems. Isolation may temporarily interrupt service.' },
  { title: '06 / Recovery', states: ['Restored', 'Secured', 'Restored', 'Restored', 'Online', 'Protected'], route: [5, 3, 2],
    story: 'Clean systems and verified backups restore campus services. The compromised account is secured before access is reopened.',
    action: 'Review the lesson: report phishing early, limit permissions, segment services, and test isolated backups. Recovery is compressed for this exercise.' }
];

class CampusScenario {
  constructor(onChange = () => {}) { this.onChange = onChange; this.reset(); }
  reset() { this.stage = 0; this.elapsed = 0; this.running = false; this.onChange(this); }
  toggle() {
    if (this.stage === 6) this.reset();
    if (this.stage === 0) this.stage = 1;
    this.running = !this.running;
    this.onChange(this);
  }
  next() {
    if (this.stage >= 6) return;
    this.stage += 1;
    this.elapsed = (this.stage - 1) * 18;
    if (this.stage === 6) this.running = false;
    this.onChange(this);
  }
  tick(seconds) {
    if (!this.running) return;
    this.elapsed = Math.min(90, this.elapsed + Math.max(0, seconds));
    this.stage = Math.min(6, 1 + Math.floor(this.elapsed / 18));
    if (this.stage === 6) this.running = false;
    this.onChange(this);
  }
}

class CampusDefenseMode {
  constructor({ onEnter, onExit }) {
    this.onEnter = onEnter;
    this.onExit = onExit;
    this.panel = document.createElement('section');
    this.panel.className = 'campus-mode';
    this.panel.hidden = true;
    this.panel.setAttribute('aria-label', 'MGA campus defense exercise');
    this.panel.innerHTML = `
      <header class="campus-header"><div><div class="campus-eyebrow">MGA / CYBER THREAT SIMULATION CENTER</div><h1>Campus defense</h1><p>Fictional training network · Fully offline · No live campus data</p></div><button class="btn-tech" id="campus-exit">BACK TO GLOBAL MAP</button></header>
      <div class="campus-toolbar"><div><strong>SCENARIO 01</strong><span> A ransomware incident / 90 seconds</span></div><div class="campus-controls"><button class="btn-tech active" id="campus-run">RUN SCENARIO</button><button class="btn-tech" id="campus-next">NEXT STAGE</button><button class="btn-tech" id="campus-reset">RESET</button></div></div>
      <progress id="campus-progress" max="90" value="0" aria-label="Scenario progress"></progress>
      <div class="campus-layout"><div class="campus-network"><div class="campus-network-heading"><h2>Campus service network</h2><span id="campus-clock">READY / 00:00</span></div><p class="campus-caption">Illustrative service relationships, not MGA's actual infrastructure.</p>
      <div class="campus-topology"><svg viewBox="0 0 600 360" preserveAspectRatio="none" aria-hidden="true"><path d="M100 90 H300 H500 M100 90 V270 M300 90 V270 M500 90 V270 M100 270 H300 H500" /></svg>${CAMPUS_SERVICES.map((name, i) => `<article class="campus-node" data-node="${i}"><span class="campus-node-icon">${['MAIL', 'SSO', 'WEB', 'DATA', 'NET', 'BACKUP'][i]}</span><h3>${name}</h3><span class="campus-node-status">Online</span></article>`).join('')}</div>
      <div class="campus-legend">Service states show exposure, disruption, and recovery as the exercise unfolds.</div></div>
      <aside class="campus-briefing"><div class="campus-eyebrow">INCIDENT BRIEFING</div><div id="campus-narrative" aria-live="polite"><h2 id="campus-stage"></h2><p id="campus-story"></p><h3>Defender response / discussion</h3><p id="campus-action"></p></div><ol class="campus-timeline">${CAMPUS_STAGES.slice(1).map(s => `<li>${s.title.slice(5)}</li>`).join('')}</ol></aside></div>
      <footer class="campus-note">Instructor controls: pause for discussion or use Next stage to walk through the incident. Global simulation resumes when you leave.</footer>`;
    document.body.appendChild(this.panel);
    this.find = id => this.panel.querySelector(`#campus-${id}`);
    this.scenario = new CampusScenario(() => this.render());
    this.find('run').onclick = () => { this.lastTick = performance.now(); this.scenario.toggle(); };
    this.find('next').onclick = () => { this.lastTick = performance.now(); this.scenario.next(); };
    this.find('reset').onclick = () => this.scenario.reset();
    this.find('exit').onclick = () => this.close();
  }
  open() {
    if (!this.panel.hidden) return;
    this.onEnter();
    document.querySelector('.hud-layer').inert = true;
    this.panel.hidden = false;
    this.lastTick = performance.now();
    this.timer = setInterval(() => {
      const now = performance.now();
      this.scenario.tick((now - this.lastTick) / 1000);
      this.lastTick = now;
    }, 200);
    this.find('run').focus();
  }
  close() {
    this.scenario.running = false;
    this.render();
    clearInterval(this.timer);
    this.panel.hidden = true;
    document.querySelector('.hud-layer').inert = false;
    this.onExit();
    document.getElementById('btn-campus').focus();
  }
  render() {
    // Constructor's reset callback fires before the scenario assignment.
    const state = this.scenario || { stage: 0, elapsed: 0, running: false };
    const stage = CAMPUS_STAGES[state.stage];
    this.find('run').textContent = state.running ? 'PAUSE' : state.stage === 6 ? 'REPLAY SCENARIO' : state.stage ? 'RESUME' : 'RUN SCENARIO';
    this.find('next').disabled = state.stage === 6;
    this.find('progress').value = state.elapsed;
    this.find('clock').textContent = `${state.stage === 6 ? 'COMPLETE' : state.running ? 'RUNNING' : state.stage ? 'PAUSED' : 'READY'} / ${String(Math.floor(state.elapsed / 60)).padStart(2, '0')}:${String(Math.floor(state.elapsed % 60)).padStart(2, '0')}`;
    if (this.renderedStage === state.stage) return;
    this.renderedStage = state.stage;
    this.find('stage').textContent = stage.title;
    this.find('story').textContent = stage.story;
    this.find('action').textContent = stage.action;
    this.panel.querySelectorAll('.campus-node').forEach((node, i) => {
      node.dataset.state = stage.states[i].toLowerCase().replace(' ', '-');
      node.classList.toggle('campus-highlight', stage.route.includes(i));
      node.querySelector('.campus-node-status').textContent = stage.states[i];
    });
    this.panel.querySelectorAll('.campus-timeline li').forEach((item, i) => {
      item.classList.toggle('done', i + 1 < state.stage);
      item.classList.toggle('current', i + 1 === state.stage);
      if (i + 1 === state.stage) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
    });
  }
}
