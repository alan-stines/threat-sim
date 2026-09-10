/**
 * Cyber Threat Simulation - Audio Synthesizer (Web Audio API)
 * Disabled by default to maximize rendering performance.
 * Only initializes AudioContext if explicitly turned on by the user.
 */
class CyberAudioSynthesizer {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.enabled = false; // Disabled by default for maximum performance
    this.muted = true;    // Muted by default
    this.volume = 0.5;
    this.initialized = false;
    this.lastSoundTime = 0;
    this.minInterval = 0.05;
    this.onStateChange = null;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.muted ? 0.0001 : this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      this.initialized = true;

      this.ctx.onstatechange = () => {
        if (this.onStateChange) {
          this.onStateChange(this.getState());
        }
      };
    } catch (e) {
      console.warn('AudioContext init skipped/blocked:', e);
    }
  }

  getState() {
    if (!this.enabled || this.muted) return 'muted';
    if (!this.ctx || this.ctx.state === 'suspended') return 'suspended';
    return 'active';
  }

  enableAudio() {
    this.enabled = true;
    this.muted = false;
    if (!this.initialized) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.02);
    }
    if (this.onStateChange) this.onStateChange(this.getState());
    this.playBlip();
  }

  disableAudio() {
    this.enabled = false;
    this.muted = true;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.02);
    }
    if (this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend().catch(() => {});
    }
    if (this.onStateChange) this.onStateChange(this.getState());
  }

  toggleMute() {
    if (!this.enabled || this.muted) {
      this.enableAudio();
      return false; // not muted
    } else {
      this.disableAudio();
      return true; // muted
    }
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx && this.enabled && !this.muted) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.02);
    }
  }

  /**
   * High-tech laser sweep when an attack missile launches
   */
  playLaserLaunch(category = 'attack') {
    // Immediate early return when disabled - zero overhead
    if (!this.enabled || this.muted || !this.ctx || this.ctx.state !== 'running') return;

    const now = Math.max(this.ctx.currentTime, 0.001);
    if (now - this.lastSoundTime < this.minInterval) return;
    this.lastSoundTime = now;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      let startFreq = 900;
      let endFreq = 260;
      let type = 'sawtooth';

      switch (category) {
        case 'ddos':
          startFreq = 480;
          endFreq = 120;
          type = 'triangle';
          break;
        case 'ransomware':
          startFreq = 700;
          endFreq = 180;
          type = 'square';
          break;
        case 'malware':
          startFreq = 1050;
          endFreq = 360;
          type = 'sine';
          break;
        case 'spam':
          startFreq = 540;
          endFreq = 280;
          type = 'sine';
          break;
        default:
          startFreq = 950;
          endFreq = 260;
          type = 'sawtooth';
      }

      osc.type = type;
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.1);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3000, now);
      filter.frequency.exponentialRampToValueAtTime(450, now + 0.1);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch (e) {
      // Ignore
    }
  }

  /**
   * Filtered sub-bass punch & spark noise when an attack strikes
   */
  playImpactBoom(severity = 'high') {
    if (!this.enabled || this.muted || !this.ctx || this.ctx.state !== 'running') return;

    const now = Math.max(this.ctx.currentTime, 0.001);

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      const startFreq = severity === 'critical' ? 130 : 100;
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(28, now + 0.16);

      const amp = severity === 'critical' ? 0.5 : 0.35;
      gain.gain.setValueAtTime(amp, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.19);
    } catch (e) {
      // Ignore
    }
  }

  /**
   * Two-tone emergency alert siren for CYBER WAR chaos mode
   */
  playAlarm() {
    if (!this.enabled || this.muted || !this.ctx || this.ctx.state !== 'running') return;

    const now = Math.max(this.ctx.currentTime, 0.001);
    try {
      for (let i = 0; i < 2; i++) {
        const t = now + i * 0.25;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, t);
        osc.frequency.setValueAtTime(580, t + 0.12);

        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.23);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        osc.stop(t + 0.24);
      }
    } catch (e) {
      // Ignore
    }
  }

  /**
   * Crisp UI telemetry chirp
   */
  playBlip() {
    if (!this.enabled || this.muted || !this.ctx || this.ctx.state !== 'running') return;

    const now = Math.max(this.ctx.currentTime, 0.001);
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(1800, now + 0.03);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.045);
    } catch (e) {
      // Ignore
    }
  }
}

window.CyberAudioSynthesizer = CyberAudioSynthesizer;
