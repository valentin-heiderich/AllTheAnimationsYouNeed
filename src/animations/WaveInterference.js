import BaseAnimation from './BaseAnimation.js';

export default class WaveInterference extends BaseAnimation {
  constructor() {
    super();
    this.mouse = { x: null, y: null, active: false, rx: 0, ry: 0 };
    this.ripples = [];
    this.lastSpawnTime = 0;
    this.gridSpacing = 24; // Spacing between mesh nodes
    this.nodes = [];
  }

  setup() {
    this.ripples = [];
    this.nodes = [];
    this.mouse.rx = this.width / 2;
    this.mouse.ry = this.height / 2;

    // Build the grid nodes
    const cols = Math.ceil(this.width / this.gridSpacing) + 1;
    const rows = Math.ceil(this.height / this.gridSpacing) + 1;

    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        this.nodes.push({
          x: c * this.gridSpacing,
          y: r * this.gridSpacing,
          baseSize: 1.5,
          baseHue: 200
        });
      }
    }

    // Spawn initial seed ripples
    for (let i = 0; i < 3; i++) {
      this.spawnRipple(
        Math.random() * this.width,
        Math.random() * this.height,
        Math.random() * 360
      );
    }

    this.ctx.fillStyle = '#05070f';
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  resize(width, height) {
    super.resize(width, height);
    this.setup();
  }

  spawnRipple(x, y, hue) {
    this.ripples.push({
      x,
      y,
      radius: 0,
      maxRadius: Math.max(this.width, this.height) * 0.95,
      speed: 4.5,
      hue: hue || Math.random() * 360,
      amplitude: 24.0,
      wavelength: 42.0,
      age: 0,
      lifeSpan: 240 // Frames
    });
  }

  draw(ctx, time) {
    // 1. Sleek trailing fade background
    ctx.fillStyle = 'rgba(5, 7, 15, 0.16)';
    ctx.fillRect(0, 0, this.width, this.height);

    // Periodic automatic ripple spawner (every 1.5s if ripples are low)
    if (time - this.lastSpawnTime > 1600 && this.ripples.length < 5) {
      this.spawnRipple(Math.random() * this.width, Math.random() * this.height, (time * 0.05) % 360);
      this.lastSpawnTime = time;
    }

    // Dynamic mouse-triggered ripples
    if (this.mouse.active && this.mouse.x !== null) {
      this.mouse.rx = this.mouse.rx * 0.9 + this.mouse.x * 0.1;
      this.mouse.ry = this.mouse.ry * 0.9 + this.mouse.y * 0.1;

      // Spawn a ripple on movement if random triggers allow it (throttled)
      if (Math.random() > 0.93) {
        this.spawnRipple(this.mouse.rx, this.mouse.ry, (time * 0.05 + 120) % 360);
      }
    }

    // Update active ripples
    this.ripples.forEach((r, idx) => {
      r.radius += r.speed;
      r.age++;
      
      // Decay amplitude as ripple expands and ages
      const lifeRatio = r.age / r.lifeSpan;
      r.currentAmp = r.amplitude * (1 - lifeRatio) * Math.min(1.0, r.radius / 100);
    });

    // Filter out dead ripples
    this.ripples = this.ripples.filter(r => r.age < r.lifeSpan && r.radius < r.maxRadius);

    // 2. Render ripples circular outlines (subtle backdrop glow rings)
    this.ripples.forEach(r => {
      const opacity = (1 - (r.age / r.lifeSpan)) * 0.18;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(${r.hue}, 95%, 70%, ${opacity})`;
      ctx.lineWidth = 2.0;
      ctx.stroke();
    });

    // 3. Render Grid Node Interference Pattern (Dynamic glowing mesh)
    this.nodes.forEach(node => {
      let totalDisplacement = 0;
      let dominantHue = 200;
      let maxDisplacement = 0;

      // Calculate combined height displacement from all ripples
      this.ripples.forEach(r => {
        const dx = node.x - r.x;
        const dy = node.y - r.y;
        const dist = Math.hypot(dx, dy);

        // Check if the wave front has reached the node
        if (dist < r.radius) {
          const waveAgeDist = r.radius - dist;
          // Sine displacement with decay over distance from wave front
          const wavePhase = waveAgeDist / r.wavelength;
          const factor = Math.max(0, 1 - (waveAgeDist / 250)); // Fade ripple trailing end
          const displacement = Math.sin(wavePhase * Math.PI * 2) * r.currentAmp * factor;

          totalDisplacement += displacement;

          // Track the dominant ripple hue
          const absDisp = Math.abs(displacement);
          if (absDisp > maxDisplacement) {
            maxDisplacement = absDisp;
            dominantHue = r.hue;
          }
        }
      });

      // Mouse local displacement overlay (creates a local liquid warp under the cursor)
      if (this.mouse.active && this.mouse.x !== null) {
        const dx = node.x - this.mouse.rx;
        const dy = node.y - this.mouse.ry;
        const dist = Math.hypot(dx, dy);
        const mouseWarpRadius = 140;

        if (dist < mouseWarpRadius) {
          const force = Math.pow((mouseWarpRadius - dist) / mouseWarpRadius, 2);
          totalDisplacement += Math.sin(time * 0.005 - dist * 0.06) * 12.0 * force;
          if (Math.abs(totalDisplacement) > maxDisplacement) {
            dominantHue = (time * 0.02) % 360;
          }
        }
      }

      // Map absolute displacement to node visual states
      const displacementMagnitude = Math.abs(totalDisplacement);
      const intensity = Math.min(1.0, displacementMagnitude / 22);

      // Node styling
      const size = node.baseSize + intensity * 4.2;
      const lightness = 42 + intensity * 40;
      const saturation = 40 + intensity * 60;
      const opacity = 0.25 + intensity * 0.75;

      ctx.beginPath();
      ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${dominantHue}, ${saturation}%, ${lightness}%, ${opacity})`;
      ctx.fill();

      // Add a subtle cross-hair line mesh between strongly active neighboring nodes
      if (intensity > 0.65 && Math.random() > 0.985) {
        ctx.beginPath();
        ctx.moveTo(node.x - 10, node.y);
        ctx.lineTo(node.x + 10, node.y);
        ctx.moveTo(node.x, node.y - 10);
        ctx.lineTo(node.x, node.y + 10);
        ctx.strokeStyle = `hsla(${dominantHue}, 100%, 75%, ${intensity * 0.35})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    });
  }

  destroy() {
    super.destroy();
    this.ripples = [];
    this.nodes = [];
  }

  handleMouseMove(x, y) {
    this.mouse.x = x;
    this.mouse.y = y;
    this.mouse.active = true;
  }

  handleMouseLeave() {
    this.mouse.active = false;
    this.mouse.x = null;
    this.mouse.y = null;
  }

  static get title() {
    return 'Wave Interference';
  }

  static get description() {
    return 'Interactive circular ripple fluid simulator. Waves expand, collide, and create beautiful interference height fields. A dense coordinate grid of glowing mesh nodes shifts in size and color brightness dynamically to map local wave peaks and valleys using advanced HSL blend modes.';
  }

  static get vibe() {
    return 'Satisfying';
  }

  static get sourceCode() {
    return `class WaveInterference {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.mouse = { x: null, y: null, active: false, rx: 0, ry: 0 };
    this.ripples = [];
    this.lastSpawnTime = 0;
    this.gridSpacing = 24;
    this.nodes = [];

    this.init();
  }

  init() {
    this.resize();
    this.setup();

    window.addEventListener('resize', () => this.resize());
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseleave', () => this.handleMouseLeave());

    this.animate();
  }

  setup() {
    this.ripples = [];
    this.nodes = [];
    this.mouse.rx = this.width / 2;
    this.mouse.ry = this.height / 2;

    const cols = Math.ceil(this.width / this.gridSpacing) + 1;
    const rows = Math.ceil(this.height / this.gridSpacing) + 1;

    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        this.nodes.push({
          x: c * this.gridSpacing,
          y: r * this.gridSpacing,
          baseSize: 1.5,
          baseHue: 200
        });
      }
    }

    for (let i = 0; i < 3; i++) {
      this.spawnRipple(
        Math.random() * this.width,
        Math.random() * this.height,
        Math.random() * 360
      );
    }

    this.ctx.fillStyle = '#05070f';
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  resize() {
    this.dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;

    this.canvas.width = rect.width * this.dpr;
    this.canvas.height = rect.height * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);

    this.setup();
  }

  spawnRipple(x, y, hue) {
    this.ripples.push({
      x,
      y,
      radius: 0,
      maxRadius: Math.max(this.width, this.height) * 0.95,
      speed: 4.5,
      hue: hue || Math.random() * 360,
      amplitude: 24.0,
      wavelength: 42.0,
      age: 0,
      lifeSpan: 240
    });
  }

  animate(time = 0) {
    this.ctx.fillStyle = 'rgba(5, 7, 15, 0.16)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    if (time - this.lastSpawnTime > 1600 && this.ripples.length < 5) {
      this.spawnRipple(Math.random() * this.width, Math.random() * this.height, (time * 0.05) % 360);
      this.lastSpawnTime = time;
    }

    if (this.mouse.active && this.mouse.x !== null) {
      this.mouse.rx = this.mouse.rx * 0.9 + this.mouse.x * 0.1;
      this.mouse.ry = this.mouse.ry * 0.9 + this.mouse.y * 0.1;

      if (Math.random() > 0.93) {
        this.spawnRipple(this.mouse.rx, this.mouse.ry, (time * 0.05 + 120) % 360);
      }
    }

    this.ripples.forEach((r) => {
      r.radius += r.speed;
      r.age++;
      const lifeRatio = r.age / r.lifeSpan;
      r.currentAmp = r.amplitude * (1 - lifeRatio) * Math.min(1.0, r.radius / 100);
    });

    this.ripples = this.ripples.filter(r => r.age < r.lifeSpan && r.radius < r.maxRadius);

    this.ripples.forEach(r => {
      const opacity = (1 - (r.age / r.lifeSpan)) * 0.18;
      this.ctx.beginPath();
      this.ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      this.ctx.strokeStyle = \`hsla(\${r.hue}, 95%, 70%, \${opacity})\`;
      this.ctx.lineWidth = 2.0;
      this.ctx.stroke();
    });

    this.nodes.forEach(node => {
      let totalDisplacement = 0;
      let dominantHue = 200;
      let maxDisplacement = 0;

      this.ripples.forEach(r => {
        const dx = node.x - r.x;
        const dy = node.y - r.y;
        const dist = Math.hypot(dx, dy);

        if (dist < r.radius) {
          const waveAgeDist = r.radius - dist;
          const wavePhase = waveAgeDist / r.wavelength;
          const factor = Math.max(0, 1 - (waveAgeDist / 250));
          const displacement = Math.sin(wavePhase * Math.PI * 2) * r.currentAmp * factor;

          totalDisplacement += displacement;

          const absDisp = Math.abs(displacement);
          if (absDisp > maxDisplacement) {
            maxDisplacement = absDisp;
            dominantHue = r.hue;
          }
        }
      });

      if (this.mouse.active && this.mouse.x !== null) {
        const dx = node.x - this.mouse.rx;
        const dy = node.y - this.mouse.ry;
        const dist = Math.hypot(dx, dy);
        const mouseWarpRadius = 140;

        if (dist < mouseWarpRadius) {
          const force = Math.pow((mouseWarpRadius - dist) / mouseWarpRadius, 2);
          totalDisplacement += Math.sin(time * 0.005 - dist * 0.06) * 12.0 * force;
          if (Math.abs(totalDisplacement) > maxDisplacement) {
            dominantHue = (time * 0.02) % 360;
          }
        }
      }

      const displacementMagnitude = Math.abs(totalDisplacement);
      const intensity = Math.min(1.0, displacementMagnitude / 22);

      const size = node.baseSize + intensity * 4.2;
      const lightness = 42 + intensity * 40;
      const saturation = 40 + intensity * 60;
      const opacity = 0.25 + intensity * 0.75;

      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
      this.ctx.fillStyle = \`hsla(\${dominantHue}, \${saturation}%, \${lightness}%, \${opacity})\`;
      this.ctx.fill();

      if (intensity > 0.65 && Math.random() > 0.985) {
        this.ctx.beginPath();
        this.ctx.moveTo(node.x - 10, node.y);
        this.ctx.lineTo(node.x + 10, node.y);
        this.ctx.moveTo(node.x, node.y - 10);
        this.ctx.lineTo(node.x, node.y + 10);
        this.ctx.strokeStyle = \`hsla(\${dominantHue}, 100%, 75%, \${intensity * 0.35})\`;
        this.ctx.lineWidth = 0.5;
        this.ctx.stroke();
      }
    });

    requestAnimationFrame((t) => this.animate(t));
  }

  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = e.clientX - rect.left;
    this.mouse.y = e.clientY - rect.top;
    this.mouse.active = true;
  }

  handleMouseLeave() {
    this.mouse.active = false;
    this.mouse.x = null;
    this.mouse.y = null;
  }
}`;
  }
}
