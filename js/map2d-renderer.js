/**
 * Cyber Threat Simulation - 2D Tactical Map Renderer (HTML5 Canvas)
 * High-performance equirectangular projection with pre-rendered offscreen background caching.
 */

class Map2DRenderer {
  constructor(container, worldData, audioSynth) {
    this.container = container;
    this.worldData = worldData;
    this.audio = audioSynth;

    this.activeArcs = [];
    this.impacts = [];
    this.beacons = [];
    this.maxActiveArcs = 35;

    this.onCountryClick = null;
    this.selectedCountry = null;

    this.cacheCanvas = document.createElement('canvas');
    this.cacheCtx = this.cacheCanvas.getContext('2d');

    this.initCanvas();
    this.setupInteractivity();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initCanvas() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.container.appendChild(this.canvas);

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.width = this.container.clientWidth || window.innerWidth;
    this.height = this.container.clientHeight || window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.cacheCanvas.width = this.width;
    this.cacheCanvas.height = this.height;

    this.renderStaticBackground();
  }

  latLonToXY(lat, lon) {
    const x = ((lon + 180) / 360) * this.width;
    const y = ((90 - lat) / 180) * this.height;
    return { x, y };
  }

  xyToLatLon(x, y) {
    const lon = (x / this.width) * 360 - 180;
    const lat = 90 - (y / this.height) * 180;
    return { lat, lon };
  }

  setupInteractivity() {
    this.canvas.addEventListener('click', e => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const clickCoords = this.xyToLatLon(x, y);
      const nearest = this.findNearestCountry(clickCoords.lat, clickCoords.lon);
      if (nearest) {
        this.selectedCountry = nearest;
        if (this.onCountryClick) {
          this.onCountryClick(nearest);
        }
      }
    });
  }

  findNearestCountry(lat, lon) {
    let closest = null;
    let minDist = Infinity;
    this.worldData.countries.forEach(c => {
      const dLat = c.lat - lat;
      const dLon = c.lon - lon;
      const dist = Math.sqrt(dLat * dLat + dLon * dLon);
      if (dist < minDist) {
        minDist = dist;
        closest = c;
      }
    });
    return closest;
  }

  renderStaticBackground() {
    const ctx = this.cacheCtx;
    ctx.clearRect(0, 0, this.width, this.height);

    // Deep MGA purple sci-fi backdrop
    const grad = ctx.createRadialGradient(
      this.width / 2, this.height / 2, 50,
      this.width / 2, this.height / 2, this.width * 0.7
    );
    grad.addColorStop(0, '#120d26');
    grad.addColorStop(1, '#06050c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Coordinate Grid
    ctx.strokeStyle = 'rgba(132, 66, 196, 0.08)';
    ctx.lineWidth = 1;

    for (let lon = -180; lon <= 180; lon += 30) {
      const x = ((lon + 180) / 360) * this.width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }

    for (let lat = -90; lat <= 90; lat += 30) {
      const y = ((90 - lat) / 180) * this.height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }

    // World Landmasses & Vector Borders (rendered once to offscreen cache!)
    if (this.worldData && this.worldData.countries) {
      ctx.strokeStyle = 'rgba(99, 51, 147, 0.8)';
      ctx.fillStyle = 'rgba(18, 13, 32, 0.65)';
      ctx.lineWidth = 1.0;

      this.worldData.countries.forEach(country => {
        const geomType = country.geomType;
        const coords = country.coordinates;

        const renderRing = ring => {
          if (!ring || ring.length === 0) return;
          ctx.beginPath();
          const start = this.latLonToXY(ring[0][1], ring[0][0]);
          ctx.moveTo(start.x, start.y);
          for (let i = 1; i < ring.length; i++) {
            const pt = this.latLonToXY(ring[i][1], ring[i][0]);
            ctx.lineTo(pt.x, pt.y);
          }
          ctx.fill();
          ctx.stroke();
        };

        if (geomType === 'Polygon') {
          coords.forEach(ring => renderRing(ring));
        } else if (geomType === 'MultiPolygon') {
          coords.forEach(poly => {
            poly.forEach(ring => renderRing(ring));
          });
        }
      });

      // City hubs
      ctx.fillStyle = 'rgba(196, 153, 243, 0.85)';
      this.worldData.countries.forEach(c => {
        const pt = this.latLonToXY(c.lat, c.lon);
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 1.8, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }

  launchAttack(attack) {
    if (this.activeArcs.length >= this.maxActiveArcs) {
      this.activeArcs.shift();
    }

    const p0 = this.latLonToXY(attack.source.lat, attack.source.lon);
    const p2 = this.latLonToXY(attack.target.lat, attack.target.lon);

    const midX = (p0.x + p2.x) / 2;
    const dist = Math.hypot(p2.x - p0.x, p2.y - p0.y);
    const curveHeight = Math.min(160, dist * 0.32 + 20);
    const midY = Math.min(p0.y, p2.y) - curveHeight;

    const p1 = { x: midX, y: midY };

    this.beacons.push({
      x: p0.x,
      y: p0.y,
      radius: 2,
      opacity: 0.9,
      color: attack.threat.color
    });

    if (this.audio) {
      this.audio.playLaserLaunch(attack.threat.category);
    }

    this.activeArcs.push({
      attack,
      p0,
      p1,
      p2,
      progress: 0,
      speed: 1.0 / (attack.duration * 60),
      color: attack.threat.color,
      colorHex: attack.threat.colorHex
    });
  }

  createImpact(x, y, color, severity) {
    this.impacts.push({
      x,
      y,
      color,
      radius: 3,
      maxRadius: severity === 'critical' ? 30 : 20,
      opacity: 1.0
    });

    if (this.audio) {
      this.audio.playImpactBoom(severity);
    }
  }

  getBezierPoint(t, p0, p1, p2) {
    const inv = 1 - t;
    const x = inv * inv * p0.x + 2 * inv * t * p1.x + t * t * p2.x;
    const y = inv * inv * p0.y + 2 * inv * t * p1.y + t * t * p2.y;
    return { x, y };
  }

  animate() {
    requestAnimationFrame(this.animate);

    const ctx = this.ctx;
    // Fast blit from pre-rendered static background canvas (near-zero CPU)
    ctx.drawImage(this.cacheCanvas, 0, 0);

    // Draw Beacons
    for (let i = this.beacons.length - 1; i >= 0; i--) {
      const b = this.beacons[i];
      b.radius += 0.8;
      b.opacity -= 0.03;

      ctx.save();
      ctx.strokeStyle = b.color;
      ctx.globalAlpha = Math.max(0, b.opacity);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      if (b.opacity <= 0) {
        this.beacons.splice(i, 1);
      }
    }

    // Draw Arcs & Tracers
    for (let i = this.activeArcs.length - 1; i >= 0; i--) {
      const arc = this.activeArcs[i];
      arc.progress += arc.speed;

      ctx.save();
      ctx.strokeStyle = arc.color;
      ctx.globalAlpha = 0.22;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(arc.p0.x, arc.p0.y);
      ctx.quadraticCurveTo(arc.p1.x, arc.p1.y, arc.p2.x, arc.p2.y);
      ctx.stroke();

      if (arc.progress < 1.0) {
        const pt = this.getBezierPoint(arc.progress, arc.p0, arc.p1, arc.p2);

        ctx.globalAlpha = 0.85;
        ctx.fillStyle = arc.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 3.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 1.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else {
        ctx.restore();
        this.createImpact(arc.p2.x, arc.p2.y, arc.color, arc.attack.threat.severity);
        this.activeArcs.splice(i, 1);
      }
    }

    // Draw Impacts
    for (let i = this.impacts.length - 1; i >= 0; i--) {
      const imp = this.impacts[i];
      imp.radius += 1.2;
      imp.opacity -= 0.045;

      ctx.save();
      ctx.strokeStyle = imp.color;
      ctx.globalAlpha = Math.max(0, imp.opacity);
      ctx.lineWidth = 1.8;

      ctx.beginPath();
      ctx.arc(imp.x, imp.y, imp.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      if (imp.opacity <= 0) {
        this.impacts.splice(i, 1);
      }
    }
  }

  destroy() {
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }
}

window.Map2DRenderer = Map2DRenderer;
