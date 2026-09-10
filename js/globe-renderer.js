/**
 * Cyber Threat Simulation - 3D Globe Renderer (Three.js)
 * High-performance holographic Earth with geometry pooling,
 * single-draw-call city markers, ballistic Bézier attack arcs, and particle effects.
 */

class GlobeRenderer {
  constructor(container, worldData, audioSynth) {
    this.container = container;
    this.worldData = worldData;
    this.audio = audioSynth;

    this.radius = 100;
    this.activeArcs = [];
    this.impacts = [];
    this.beacons = [];
    this.maxActiveArcs = 35; // Prevent GPU congestion during heavy bursts
    this.autoRotate = true;
    this.autoRotateSpeed = 0.4;
    this.targetCameraPos = null;
    this.targetControlsTarget = null;
    this.isFlying = false;

    this.onCountryClick = null;
    this.selectedCountry = null;

    this.initSharedResources();
    this.initThree();
    this.createStarfield();
    this.createEarthSphere();
    this.createAtmosphere();
    this.createCountryBorders();
    this.createCityMarkers();
    this.setupInteractivity();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initSharedResources() {
    if (!GlobeRenderer.initialized) {
      GlobeRenderer.tracerGeo = new THREE.SphereGeometry(1.1, 6, 6);
      GlobeRenderer.glowGeo = new THREE.SphereGeometry(2.0, 6, 6);
      GlobeRenderer.tracerWhiteMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        blending: THREE.AdditiveBlending
      });
      GlobeRenderer.beaconRingGeo = new THREE.RingGeometry(0.5, 1.2, 16);
      GlobeRenderer.impactRingGeo = new THREE.RingGeometry(0.8, 1.8, 20);
      GlobeRenderer.colorMats = new Map();
      GlobeRenderer.initialized = true;
    }
  }

  getSharedMaterial(colorHex) {
    if (!GlobeRenderer.colorMats.has(colorHex)) {
      const mat = new THREE.MeshBasicMaterial({
        color: colorHex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending
      });
      GlobeRenderer.colorMats.set(colorHex, mat);
    }
    return GlobeRenderer.colorMats.get(colorHex);
  }

  initThree() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(45, width / height, 1, 3000);
    this.camera.position.set(0, 50, 310);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);

    // Performance: Cap pixelRatio to 1.0 on Pi or 1.25 on high-DPI screens
    const isPiMode = window.location && (window.location.search.includes('mode=pi') || window.location.search.includes('lowpower=1'));
    this.renderer.setPixelRatio(isPiMode ? 1.0 : Math.min(window.devicePixelRatio, 1.25));

    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.container.appendChild(this.renderer.domElement);

    // Orbit Controls
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.minDistance = 125;
    this.controls.maxDistance = 550;
    this.controls.rotateSpeed = 0.8;
    this.controls.zoomSpeed = 1.0;
    this.controls.autoRotate = this.autoRotate;
    this.controls.autoRotateSpeed = this.autoRotateSpeed;

    // Lights
    const ambientLight = new THREE.AmbientLight(0x334466, 1.2);
    this.scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x88bbff, 1.4);
    dirLight1.position.set(250, 150, 200);
    this.scene.add(dirLight1);

    // Root globe group
    this.globeGroup = new THREE.Group();
    this.scene.add(this.globeGroup);

    window.addEventListener('resize', () => this.onWindowResize());
  }

  onWindowResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  createStarfield() {
    const starCount = 800; // Optimized count
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const r = 800 + Math.random() * 1000;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const tint = 0.7 + Math.random() * 0.3;
      colors[i * 3] = tint * 0.8;
      colors[i * 3 + 1] = tint * 0.9;
      colors[i * 3 + 2] = tint;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 1.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.75
    });

    const starPoints = new THREE.Points(geometry, material);
    this.scene.add(starPoints);
  }

  createEarthSphere() {
    const sphereGeo = new THREE.SphereGeometry(this.radius, 48, 48); // Optimized from 64
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0x080d1a,
      roughness: 0.85,
      metalness: 0.25,
      emissive: 0x02050d,
      emissiveIntensity: 0.5
    });

    this.earthMesh = new THREE.Mesh(sphereGeo, sphereMat);
    this.globeGroup.add(this.earthMesh);

    // Latitude rings
    const gridMat = new THREE.LineBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.07
    });

    const latitudes = [-60, -30, 0, 30, 60];
    latitudes.forEach(lat => {
      const phi = (90 - lat) * (Math.PI / 180);
      const ringRadius = this.radius * Math.sin(phi);
      const y = this.radius * Math.cos(phi);

      const circleGeo = new THREE.BufferGeometry();
      const pts = [];
      const segments = 60; // Optimized from 90
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        pts.push(ringRadius * Math.cos(theta), y, ringRadius * Math.sin(theta));
      }
      circleGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      const line = new THREE.Line(circleGeo, gridMat);
      this.globeGroup.add(line);
    });
  }

  createAtmosphere() {
    const atmosphereGeo = new THREE.SphereGeometry(this.radius * 1.04, 48, 48);
    const atmosphereMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.8);
          // Middle Georgia State University Purple Atmospheric Halo (#633393)
          gl_FragColor = vec4(0.45, 0.22, 0.75, 1.0) * intensity * 0.95;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false
    });

    const atmosphereMesh = new THREE.Mesh(atmosphereGeo, atmosphereMat);
    this.scene.add(atmosphereMesh);
  }

  latLonToVector3(lat, lon, radius = this.radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);

    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);

    return new THREE.Vector3(x, y, z);
  }

  createCountryBorders() {
    if (!this.worldData || !this.worldData.countries) return;

    const linePoints = [];
    const r = this.radius * 1.002;

    this.worldData.countries.forEach(country => {
      const geomType = country.geomType;
      const coords = country.coordinates;

      const processRing = ring => {
        for (let i = 0; i < ring.length - 1; i++) {
          const p1 = this.latLonToVector3(ring[i][1], ring[i][0], r);
          const p2 = this.latLonToVector3(ring[i + 1][1], ring[i + 1][0], r);
          linePoints.push(p1.x, p1.y, p1.z);
          linePoints.push(p2.x, p2.y, p2.z);
        }
      };

      if (geomType === 'Polygon') {
        coords.forEach(ring => processRing(ring));
      } else if (geomType === 'MultiPolygon') {
        coords.forEach(poly => {
          poly.forEach(ring => processRing(ring));
        });
      }
    });

    const borderGeo = new THREE.BufferGeometry();
    borderGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePoints, 3));

    const borderMat = new THREE.LineBasicMaterial({
      color: 0x48326e, // MGA purple slate border lines
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });

    this.borderMesh = new THREE.LineSegments(borderGeo, borderMat);
    this.globeGroup.add(this.borderMesh);
  }

  createCityMarkers() {
    if (!this.worldData || !this.worldData.countries) return;

    // Single draw call for all 177 cities using THREE.Points
    const points = [];
    this.worldData.countries.forEach(c => {
      const pos = this.latLonToVector3(c.lat, c.lon, this.radius * 1.005);
      points.push(pos.x, pos.y, pos.z);
    });

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));

    const mat = new THREE.PointsMaterial({
      color: 0x00f0ff,
      size: 2.2,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });

    this.cityPointsMesh = new THREE.Points(geo, mat);
    this.globeGroup.add(this.cityPointsMesh);
  }

  setupInteractivity() {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.container.addEventListener('pointerdown', () => {
      this.controls.autoRotate = false;
    });

    this.container.addEventListener('click', e => {
      const rect = this.container.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObject(this.earthMesh);

      if (intersects.length > 0) {
        const hitPoint = intersects[0].point.clone().sub(this.globeGroup.position);
        const nearest = this.findNearestCountry(hitPoint);
        if (nearest) {
          this.selectCountry(nearest);
        }
      }
    });
  }

  findNearestCountry(pointOnSphere) {
    let closest = null;
    let minDist = Infinity;
    this.worldData.countries.forEach(c => {
      const cPos = this.latLonToVector3(c.lat, c.lon, this.radius);
      const dist = cPos.distanceTo(pointOnSphere);
      if (dist < minDist) {
        minDist = dist;
        closest = c;
      }
    });
    return closest;
  }

  selectCountry(country) {
    this.selectedCountry = country;
    this.flyToCountry(country);
    if (this.onCountryClick) {
      this.onCountryClick(country);
    }
  }

  flyToCountry(country) {
    const targetPos = this.latLonToVector3(country.lat, country.lon, this.radius * 2.3);
    this.targetCameraPos = targetPos;
    this.targetControlsTarget = new THREE.Vector3(0, 0, 0);
    this.isFlying = true;
    this.controls.autoRotate = false;
  }

  /**
   * Launch a 3D ballistic attack arc from source to target
   */
  launchAttack(attack) {
    // Prune oldest active arc if over threshold
    if (this.activeArcs.length >= this.maxActiveArcs) {
      const old = this.activeArcs.shift();
      this.globeGroup.remove(old.tracerMesh);
      this.globeGroup.remove(old.arcLine);
      old.arcLine.geometry.dispose();
      old.arcLine.material.dispose();
    }

    const p0 = this.latLonToVector3(attack.source.lat, attack.source.lon, this.radius * 1.002);
    const p2 = this.latLonToVector3(attack.target.lat, attack.target.lon, this.radius * 1.002);

    const dist = p0.distanceTo(p2);
    const altitude = Math.max(16, dist * 0.3);
    const midPoint = new THREE.Vector3().addVectors(p0, p2).multiplyScalar(0.5);
    const normal = midPoint.clone().normalize();
    const p1 = normal.multiplyScalar(this.radius + altitude);

    const curve = new THREE.QuadraticBezierCurve3(p0, p1, p2);
    const pointsCount = Math.max(20, Math.floor(dist * 0.3)); // Optimized segments
    const curvePoints = curve.getPoints(pointsCount);

    const lineGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);
    const lineMat = new THREE.LineBasicMaterial({
      color: attack.threat.colorHex,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending
    });
    const arcLine = new THREE.Line(lineGeo, lineMat);
    this.globeGroup.add(arcLine);

    // Reusable pooled geometries
    const tracerMesh = new THREE.Mesh(GlobeRenderer.tracerGeo, GlobeRenderer.tracerWhiteMat);
    tracerMesh.position.copy(p0);
    this.globeGroup.add(tracerMesh);

    const glowMat = this.getSharedMaterial(attack.threat.colorHex);
    const glowMesh = new THREE.Mesh(GlobeRenderer.glowGeo, glowMat);
    tracerMesh.add(glowMesh);

    this.createBeacon(p0, attack.threat.colorHex);

    if (this.audio) {
      this.audio.playLaserLaunch(attack.threat.category);
    }

    const arcObj = {
      attack,
      curve,
      arcLine,
      tracerMesh,
      p0,
      p2,
      progress: 0,
      speed: 1.0 / (attack.duration * 60),
      colorHex: attack.threat.colorHex,
      target: attack.target
    };

    this.activeArcs.push(arcObj);
  }

  createBeacon(position, colorHex) {
    const mat = this.getSharedMaterial(colorHex).clone();
    const beacon = new THREE.Mesh(GlobeRenderer.beaconRingGeo, mat);
    beacon.position.copy(position);
    beacon.lookAt(new THREE.Vector3(0, 0, 0));
    this.globeGroup.add(beacon);

    this.beacons.push({
      mesh: beacon,
      material: mat,
      scale: 1,
      opacity: 0.9,
      growth: 0.08
    });
  }

  createImpactExplosion(position, colorHex, severity) {
    const mat = this.getSharedMaterial(colorHex).clone();
    const shockwave = new THREE.Mesh(GlobeRenderer.impactRingGeo, mat);
    shockwave.position.copy(position);
    shockwave.lookAt(new THREE.Vector3(0, 0, 0));
    this.globeGroup.add(shockwave);

    // Spark particle burst
    const sparkCount = severity === 'critical' ? 12 : 8; // Optimized from 18
    const sparkGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(sparkCount * 3);
    const velocities = [];

    const normal = position.clone().normalize();
    for (let i = 0; i < sparkCount; i++) {
      positions[i * 3] = position.x;
      positions[i * 3 + 1] = position.y;
      positions[i * 3 + 2] = position.z;

      const randDir = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      ).normalize();
      const vel = normal.clone().multiplyScalar(0.7).add(randDir.multiplyScalar(0.8));
      velocities.push(vel);
    }

    sparkGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const sparkMat = new THREE.PointsMaterial({
      color: colorHex,
      size: 2.0,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending
    });

    const sparks = new THREE.Points(sparkGeo, sparkMat);
    this.globeGroup.add(sparks);

    if (this.audio) {
      this.audio.playImpactBoom(severity);
    }

    this.impacts.push({
      shockwave,
      material: mat,
      sparks,
      positions,
      velocities,
      scale: 1,
      opacity: 1.0,
      fadeSpeed: 0.04
    });
  }

  setAutoRotate(enabled) {
    this.autoRotate = enabled;
    this.controls.autoRotate = enabled;
  }

  animate() {
    requestAnimationFrame(this.animate);

    if (this.isFlying && this.targetCameraPos) {
      this.camera.position.lerp(this.targetCameraPos, 0.06);
      if (this.camera.position.distanceTo(this.targetCameraPos) < 2) {
        this.isFlying = false;
        this.targetCameraPos = null;
      }
    }

    this.controls.update();

    // Update active ballistic arcs
    for (let i = this.activeArcs.length - 1; i >= 0; i--) {
      const arc = this.activeArcs[i];
      arc.progress += arc.speed;

      if (arc.progress < 1.0) {
        const currentPos = arc.curve.getPoint(arc.progress);
        arc.tracerMesh.position.copy(currentPos);
      } else {
        this.createImpactExplosion(arc.p2, arc.colorHex, arc.attack.threat.severity);

        this.globeGroup.remove(arc.tracerMesh);
        this.globeGroup.remove(arc.arcLine);
        arc.arcLine.geometry.dispose();
        arc.arcLine.material.dispose();

        this.activeArcs.splice(i, 1);
      }
    }

    // Update origin beacons
    for (let i = this.beacons.length - 1; i >= 0; i--) {
      const b = this.beacons[i];
      b.scale += b.growth;
      b.opacity -= 0.03;
      b.mesh.scale.set(b.scale, b.scale, b.scale);
      b.material.opacity = Math.max(0, b.opacity);

      if (b.opacity <= 0) {
        this.globeGroup.remove(b.mesh);
        b.material.dispose();
        this.beacons.splice(i, 1);
      }
    }

    // Update impact explosions & sparks
    for (let i = this.impacts.length - 1; i >= 0; i--) {
      const imp = this.impacts[i];
      imp.scale += 0.2;
      imp.opacity -= imp.fadeSpeed;

      imp.shockwave.scale.set(imp.scale, imp.scale, imp.scale);
      imp.material.opacity = Math.max(0, imp.opacity);

      const posAttr = imp.sparks.geometry.attributes.position;
      for (let j = 0; j < imp.velocities.length; j++) {
        imp.positions[j * 3] += imp.velocities[j].x;
        imp.positions[j * 3 + 1] += imp.velocities[j].y;
        imp.positions[j * 3 + 2] += imp.velocities[j].z;
      }
      posAttr.needsUpdate = true;
      imp.sparks.material.opacity = Math.max(0, imp.opacity);

      if (imp.opacity <= 0) {
        this.globeGroup.remove(imp.shockwave);
        this.globeGroup.remove(imp.sparks);
        imp.material.dispose();
        imp.sparks.geometry.dispose();
        imp.sparks.material.dispose();
        this.impacts.splice(i, 1);
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    if (this.renderer && this.renderer.domElement) {
      this.container.removeChild(this.renderer.domElement);
      this.renderer.dispose();
    }
  }
}

window.GlobeRenderer = GlobeRenderer;
