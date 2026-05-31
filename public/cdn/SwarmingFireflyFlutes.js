import BaseAnimation from './BaseAnimation.js';

export default class SwarmingFireflyFlutes extends BaseAnimation {
  constructor() {
    super();
    this.fireflies = [];
    this.mouse = { x: null, y: null, active: false, radius: 150 };
    this.bg = '#040705'; // Cozy deep forest twilight black-green
  }

  setup() {
    this.fireflies = [];
    const count = 35 + Math.floor(this.width / 45);

    for (let i = 0; i < count; i++) {
      this.fireflies.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        size: 1.5 + Math.random() * 2,
        pulseSpeed: 0.03 + Math.random() * 0.05,
        pulsePhase: Math.random() * Math.PI * 2,
        maxSpeed: 2.0 + Math.random() * 1.0,
        hue: 45 + Math.random() * 25, // cozy amber-gold
        lastSound: 0
      });
    }
  }

  resize(width, height) {
    super.resize(width, height);
    this.setup();
  }

  draw(ctx, time) {
    // Soft foliage darkness trail
    ctx.fillStyle = 'rgba(4, 7, 5, 0.14)';
    ctx.fillRect(0, 0, this.width, this.height);

    const boidsCount = this.fireflies.length;

    this.fireflies.forEach((boid, idx) => {
      // 1. Solve boids flocking simulation (cohesion & separation)
      let centerX = 0, centerY = 0;
      let closeX = 0, closeY = 0;
      let alignX = 0, alignY = 0;
      let neighbors = 0;

      for (let j = 0; j < boidsCount; j++) {
        if (idx === j) continue;
        const other = this.fireflies[j];
        const d = Math.hypot(other.x - boid.x, other.y - boid.y);

        if (d < 70) {
          centerX += other.x;
          centerY += other.y;
          alignX += other.vx;
          alignY += other.vy;
          neighbors++;

          if (d < 24) {
            closeX += boid.x - other.x;
            closeY += boid.y - other.y;
          }
        }
      }

      // Apply behaviors
      if (neighbors > 0) {
        centerX /= neighbors;
        centerY /= neighbors;
        alignX /= neighbors;
        alignY /= neighbors;

        // Cohesion
        boid.vx += (centerX - boid.x) * 0.005;
        boid.vy += (centerY - boid.y) * 0.005;

        // Alignment
        boid.vx += (alignX - boid.vx) * 0.015;
        boid.vy += (alignY - boid.vy) * 0.015;
      }

      // Separation
      boid.vx += closeX * 0.02;
      boid.vy += closeY * 0.02;

      // Mouse attraction
      if (this.mouse.active && this.mouse.x !== null) {
        const dx = this.mouse.x - boid.x;
        const dy = this.mouse.y - boid.y;
        const d = Math.hypot(dx, dy);

        if (d < this.mouse.radius) {
          boid.vx += (dx / (d || 1)) * 0.06;
          boid.vy += (dy / (d || 1)) * 0.06;

          // Sound triggers in clusters
          boid.lastSound++;
          if (d < 35 && boid.lastSound > 160 && Math.random() < 0.08) {
            boid.lastSound = 0;
            this.playFluteTone(boid.y);
          }
        }
      }

      // Speed limits
      const currentSpeed = Math.hypot(boid.vx, boid.vy);
      if (currentSpeed > boid.maxSpeed) {
        boid.vx = (boid.vx / currentSpeed) * boid.maxSpeed;
        boid.vy = (boid.vy / currentSpeed) * boid.maxSpeed;
      }

      boid.x += boid.vx;
      boid.y += boid.vy;

      // Boundary wraps
      if (boid.x < -10) boid.x = this.width + 10;
      if (boid.x > this.width + 10) boid.x = -10;
      if (boid.y < -10) boid.y = this.height + 10;
      if (boid.y > this.height + 10) boid.y = -10;

      // 2. Draw glowing firefly
      boid.pulsePhase += boid.pulseSpeed;
      const alpha = 0.45 + Math.sin(boid.pulsePhase) * 0.45;

      ctx.beginPath();
      ctx.arc(boid.x, boid.y, boid.size, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${boid.hue}, 100%, 75%, ${alpha})`;
      
      ctx.shadowBlur = boid.size * 5;
      ctx.shadowColor = `hsla(${boid.hue}, 100%, 65%, ${alpha})`;
      ctx.fill();
      ctx.shadowBlur = 0; // reset
    });
  }

  destroy() {
    super.destroy();
    this.fireflies = [];
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

  playFluteTone(y) {
    if (this.canvas && this.canvas.getAttribute('data-audio-muted') === 'true') {
      return;
    }

    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const ctx = this.audioCtx;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Warm wooden flute pentatonic scale
      const pentatonic = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00];
      const scalePct = 1 - Math.max(0, Math.min(1, y / this.height));
      const noteIdx = Math.floor(scalePct * (pentatonic.length - 1));
      const freq = pentatonic[noteIdx];

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      const lofiVolSetting = localStorage.getItem('aetherflow_lofi_vol');
      const masterVolumeMultiplier = lofiVolSetting !== null ? parseFloat(lofiVolSetting) : 0.5;
      const vol = 0.06 * masterVolumeMultiplier;

      // Soft wind flute sweep envelope
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.08);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.6);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.8);
      filter.Q.setValueAtTime(1.0, ctx.currentTime);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 1.8);
    } catch (e) {}
  }

  static get title() {
    return 'Swarming Firefly Flutes';
  }

  static get description() {
    return 'Golden boid fireflies flocking and swarming around dark forest boundaries. Hovering draws fireflies in dense clusters, producing soft harmonized wooden flute tones.';
  }

  static get vibe() {
    return 'Simulated';
  }

  static get sourceCode() {
    return `class SwarmingFireflyFlutes {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.fireflies = [];
    this.mouse = { x: null, y: null, active: false, radius: 150 };
    
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
    this.fireflies = [];
    const count = 35 + Math.floor(this.width / 45);

    for (let i = 0; i < count; i++) {
      this.fireflies.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        size: 1.5 + Math.random() * 2,
        pulseSpeed: 0.03 + Math.random() * 0.05,
        pulsePhase: Math.random() * Math.PI * 2,
        maxSpeed: 2.0 + Math.random() * 1.0,
        hue: 45 + Math.random() * 25,
        lastSound: 0
      });
    }
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

  animate(time = 0) {
    this.ctx.fillStyle = 'rgba(4, 7, 5, 0.14)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    const boidsCount = this.fireflies.length;

    this.fireflies.forEach((boid, idx) => {
      let centerX = 0, centerY = 0;
      let closeX = 0, closeY = 0;
      let alignX = 0, alignY = 0;
      let neighbors = 0;

      for (let j = 0; j < boidsCount; j++) {
        if (idx === j) continue;
        const other = this.fireflies[j];
        const d = Math.hypot(other.x - boid.x, other.y - boid.y);

        if (d < 70) {
          centerX += other.x;
          centerY += other.y;
          alignX += other.vx;
          alignY += other.vy;
          neighbors++;

          if (d < 24) {
            closeX += boid.x - other.x;
            closeY += boid.y - other.y;
          }
        }
      }

      if (neighbors > 0) {
        centerX /= neighbors;
        centerY /= neighbors;
        alignX /= neighbors;
        alignY /= neighbors;

        boid.vx += (centerX - boid.x) * 0.005;
        boid.vy += (centerY - boid.y) * 0.005;
        boid.vx += (alignX - boid.vx) * 0.015;
        boid.vy += (alignY - boid.vy) * 0.015;
      }

      boid.vx += closeX * 0.02;
      boid.vy += closeY * 0.02;

      if (this.mouse.active && this.mouse.x !== null) {
        const dx = this.mouse.x - boid.x;
        const dy = this.mouse.y - boid.y;
        const d = Math.hypot(dx, dy);

        if (d < this.mouse.radius) {
          boid.vx += (dx / (d || 1)) * 0.06;
          boid.vy += (dy / (d || 1)) * 0.06;

          boid.lastSound++;
          if (d < 35 && boid.lastSound > 160 && Math.random() < 0.08) {
            boid.lastSound = 0;
            this.playFluteTone(boid.y);
          }
        }
      }

      const currentSpeed = Math.hypot(boid.vx, boid.vy);
      if (currentSpeed > boid.maxSpeed) {
        boid.vx = (boid.vx / currentSpeed) * boid.maxSpeed;
        boid.vy = (boid.vy / currentSpeed) * boid.maxSpeed;
      }

      boid.x += boid.vx;
      boid.y += boid.vy;

      if (boid.x < -10) boid.x = this.width + 10;
      if (boid.x > this.width + 10) boid.x = -10;
      if (boid.y < -10) boid.y = this.height + 10;
      if (boid.y > this.height + 10) boid.y = -10;

      boid.pulsePhase += boid.pulseSpeed;
      const alpha = 0.45 + Math.sin(boid.pulsePhase) * 0.45;

      this.ctx.beginPath();
      this.ctx.arc(boid.x, boid.y, boid.size, 0, Math.PI * 2);
      this.ctx.fillStyle = \`hsla(\${boid.hue}, 100%, 75%, \${alpha})\`;
      this.ctx.fill();
    });

    requestAnimationFrame((t) => this.animate(t));
  }

  playFluteTone(y) {
    if (this.canvas && this.canvas.getAttribute('data-audio-muted') === 'true') return;
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
      
      const ctx = this.audioCtx;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      const pentatonic = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00];
      const scalePct = 1 - Math.max(0, Math.min(1, y / this.height));
      const noteIdx = Math.floor(scalePct * (pentatonic.length - 1));
      const freq = pentatonic[noteIdx];

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      const lofiVolSetting = localStorage.getItem('aetherflow_lofi_vol');
      const masterVolumeMultiplier = lofiVolSetting !== null ? parseFloat(lofiVolSetting) : 0.5;
      const vol = 0.06 * masterVolumeMultiplier;

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.08);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.6);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.8);
      filter.Q.setValueAtTime(1.0, ctx.currentTime);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 1.8);
    } catch (e) {}
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
