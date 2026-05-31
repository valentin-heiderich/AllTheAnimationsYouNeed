import BaseAnimation from './BaseAnimation.js';

export default class ResonantDandelionSeeds extends BaseAnimation {
  constructor() {
    super();
    this.seeds = [];
    this.mouse = { x: null, y: null, active: false, radius: 80 };
    this.dandelionCenter = { x: 0, y: 0 };
    this.baseCenter = { x: 0, y: 0 };
    this.stemLength = 0;
    this.swayAngle = 0;
    this.swaySpeed = 0.001;
    this.seedColors = ['rgba(255, 255, 255, 0.85)', 'rgba(238, 250, 242, 0.78)', 'rgba(220, 245, 240, 0.72)'];
  }

  setup() {
    this.seeds = [];
    this.baseCenter = { x: this.width * 0.5, y: this.height };
    this.stemLength = this.height * 0.45;
    this.dandelionCenter = { x: this.baseCenter.x, y: this.height - this.stemLength };
    this.swayAngle = 0;

    // Populate seeds in radial distribution
    const count = 75;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 26 + 4; // tightly packed head
      this.seeds.push({
        attached: true,
        relX: Math.cos(angle) * distance,
        relY: Math.sin(angle) * distance,
        angle: angle,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        scale: 0.5 + Math.random() * 0.5,
        life: 1.0,
        decay: 0.001 + Math.random() * 0.001,
        color: this.seedColors[Math.floor(Math.random() * this.seedColors.length)]
      });
    }
  }

  resize(width, height) {
    super.resize(width, height);
    this.setup();
  }

  draw(ctx, time) {
    // Elegant deep misty grey/teal night background
    ctx.fillStyle = 'rgba(10, 15, 14, 0.12)';
    ctx.fillRect(0, 0, this.width, this.height);

    // Update stem sway via sine waves
    this.swayAngle = Math.sin(time * this.swaySpeed) * 0.08;
    this.dandelionCenter.x = this.baseCenter.x + Math.sin(this.swayAngle) * this.stemLength;
    this.dandelionCenter.y = this.baseCenter.y - Math.cos(this.swayAngle) * this.stemLength;

    // Draw swaying stem
    ctx.beginPath();
    ctx.moveTo(this.baseCenter.x, this.baseCenter.y);
    ctx.quadraticCurveTo(
      this.baseCenter.x + Math.sin(this.swayAngle * 0.5) * (this.stemLength * 0.5),
      this.baseCenter.y - this.stemLength * 0.5,
      this.dandelionCenter.x,
      this.dandelionCenter.y
    );
    ctx.strokeStyle = 'rgba(125, 155, 135, 0.28)';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Draw dandelion core
    ctx.beginPath();
    ctx.arc(this.dandelionCenter.x, this.dandelionCenter.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#cfebd6';
    ctx.fill();

    // Update and draw seeds
    this.seeds.forEach((seed, idx) => {
      if (seed.attached) {
        // Rotate local coordinate systems matching sway angle
        const cos = Math.cos(this.swayAngle);
        const sin = Math.sin(this.swayAngle);
        const rotX = seed.relX * cos - seed.relY * sin;
        const rotY = seed.relX * sin + seed.relY * cos;

        seed.x = this.dandelionCenter.x + rotX;
        seed.y = this.dandelionCenter.y + rotY;

        // Interaction sweep: check if cursor brushes seed
        if (this.mouse.active && this.mouse.x !== null) {
          const dx = seed.x - this.mouse.x;
          const dy = seed.y - this.mouse.y;
          const d = Math.hypot(dx, dy);

          if (d < this.mouse.radius && Math.random() < 0.15) {
            // Detach seed
            seed.attached = false;
            seed.vx = (dx / (d || 1)) * 2 + (Math.random() - 0.5) * 1.5;
            seed.vy = -1.5 - Math.random() * 2; // thermal lift upwards
            this.playHarpSound(seed.y);
          }
        }
      } else {
        // Drifting seed physics (gravity, drag, wind waves)
        const wind = Math.sin(time * 0.002 + seed.y * 0.01) * 0.35 + 0.6;
        seed.vx += (wind - seed.vx) * 0.02;
        seed.vy += 0.005; // tiny gravity drift
        seed.x += seed.vx;
        seed.y += seed.vy;
        seed.life -= seed.decay;

        // Respawn seed at dandelion head if expired or offscreen
        if (seed.life <= 0 || seed.x < 0 || seed.x > this.width || seed.y < -50 || seed.y > this.height) {
          this.respawnSeed(seed);
        }
      }

      // Draw seed
      ctx.save();
      ctx.translate(seed.x, seed.y);
      ctx.scale(seed.scale, seed.scale);
      
      // Draw filament stem
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -12);
      ctx.strokeStyle = seed.attached ? 'rgba(200, 230, 210, 0.45)' : `rgba(200, 230, 210, ${seed.life})`;
      ctx.lineWidth = 1.0;
      ctx.stroke();

      // Draw seed feather bristles
      ctx.beginPath();
      for (let j = 0; j < 5; j++) {
        const bristleAngle = -Math.PI / 2 + (j - 2) * 0.28;
        const len = 6 + Math.random() * 3;
        ctx.moveTo(0, -12);
        ctx.lineTo(Math.cos(bristleAngle) * len, -12 + Math.sin(bristleAngle) * len);
      }
      ctx.strokeStyle = seed.attached ? seed.color : seed.color.replace(/[\d.]+\)$/, `${seed.life * 0.8})`);
      ctx.lineWidth = 0.8;
      ctx.stroke();

      ctx.restore();
    });
  }

  respawnSeed(seed) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 26 + 4;
    seed.attached = true;
    seed.relX = Math.cos(angle) * distance;
    seed.relY = Math.sin(angle) * distance;
    seed.angle = angle;
    seed.vx = 0;
    seed.vy = 0;
    seed.scale = 0.5 + Math.random() * 0.5;
    seed.life = 1.0;
    seed.decay = 0.001 + Math.random() * 0.001;
    seed.color = this.seedColors[Math.floor(Math.random() * this.seedColors.length)];
  }

  destroy() {
    super.destroy();
    this.seeds = [];
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

  playHarpSound(y) {
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

      // Connections
      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      // High pentatonic scale mapped to harp plucks
      const pentatonic = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66, 1318.51, 1567.98, 1760.00];
      const scalePct = 1 - Math.max(0, Math.min(1, y / this.height));
      const noteIdx = Math.floor(scalePct * (pentatonic.length - 1));
      const baseFreq = pentatonic[noteIdx];

      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      // Sweeping frequency upward creates pluck/strum feel
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.05, ctx.currentTime + 0.08);

      const lofiVolSetting = localStorage.getItem('aetherflow_lofi_vol');
      const masterVolumeMultiplier = lofiVolSetting !== null ? parseFloat(lofiVolSetting) : 0.5;
      const vol = 0.08 * masterVolumeMultiplier;

      // Soft strum harp envelope
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.015);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.4);

      // Wind-like lowpass filter sweep
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(4000, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.6);
      filter.Q.setValueAtTime(2.0, ctx.currentTime);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 1.5);
    } catch (err) {
      console.warn('Harp synthesis failed: ', err);
    }
  }

  static get title() {
    return 'Resonant Dandelion Seeds';
  }

  static get description() {
    return 'An organic dandelion head swaying in sines. Sweeping your cursor across the head detaches fluffy seeds into thermal drift vectors, synthesizing a warm, high-pitched harp pluck that glides dynamically.';
  }

  static get vibe() {
    return 'Natural';
  }

  static get sourceCode() {
    return `class ResonantDandelionSeeds {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.seeds = [];
    this.mouse = { x: null, y: null, active: false, radius: 80 };
    this.dandelionCenter = { x: 0, y: 0 };
    this.baseCenter = { x: 0, y: 0 };
    this.stemLength = 0;
    this.swayAngle = 0;
    this.swaySpeed = 0.001;
    this.seedColors = ['rgba(255, 255, 255, 0.85)', 'rgba(238, 250, 242, 0.78)', 'rgba(220, 245, 240, 0.72)'];
    
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
    this.seeds = [];
    this.baseCenter = { x: this.width * 0.5, y: this.height };
    this.stemLength = this.height * 0.45;
    this.dandelionCenter = { x: this.baseCenter.x, y: this.height - this.stemLength };
    this.swayAngle = 0;

    const count = 75;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 26 + 4;
      this.seeds.push({
        attached: true,
        relX: Math.cos(angle) * distance,
        relY: Math.sin(angle) * distance,
        angle: angle,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        scale: 0.5 + Math.random() * 0.5,
        life: 1.0,
        decay: 0.001 + Math.random() * 0.001,
        color: this.seedColors[Math.floor(Math.random() * this.seedColors.length)]
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
    this.ctx.fillStyle = 'rgba(10, 15, 14, 0.12)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.swayAngle = Math.sin(time * this.swaySpeed) * 0.08;
    this.dandelionCenter.x = this.baseCenter.x + Math.sin(this.swayAngle) * this.stemLength;
    this.dandelionCenter.y = this.baseCenter.y - Math.cos(this.swayAngle) * this.stemLength;

    this.ctx.beginPath();
    this.ctx.moveTo(this.baseCenter.x, this.baseCenter.y);
    this.ctx.quadraticCurveTo(
      this.baseCenter.x + Math.sin(this.swayAngle * 0.5) * (this.stemLength * 0.5),
      this.baseCenter.y - this.stemLength * 0.5,
      this.dandelionCenter.x,
      this.dandelionCenter.y
    );
    this.ctx.strokeStyle = 'rgba(125, 155, 135, 0.28)';
    this.ctx.lineWidth = 4;
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.arc(this.dandelionCenter.x, this.dandelionCenter.y, 6, 0, Math.PI * 2);
    this.ctx.fillStyle = '#cfebd6';
    this.ctx.fill();

    this.seeds.forEach((seed) => {
      if (seed.attached) {
        const cos = Math.cos(this.swayAngle);
        const sin = Math.sin(this.swayAngle);
        const rotX = seed.relX * cos - seed.relY * sin;
        const rotY = seed.relX * sin + seed.relY * cos;

        seed.x = this.dandelionCenter.x + rotX;
        seed.y = this.dandelionCenter.y + rotY;

        if (this.mouse.active && this.mouse.x !== null) {
          const dx = seed.x - this.mouse.x;
          const dy = seed.y - this.mouse.y;
          const d = Math.hypot(dx, dy);

          if (d < this.mouse.radius && Math.random() < 0.15) {
            seed.attached = false;
            seed.vx = (dx / (d || 1)) * 2 + (Math.random() - 0.5) * 1.5;
            seed.vy = -1.5 - Math.random() * 2;
            this.playHarpSound(seed.y);
          }
        }
      } else {
        const wind = Math.sin(time * 0.002 + seed.y * 0.01) * 0.35 + 0.6;
        seed.vx += (wind - seed.vx) * 0.02;
        seed.vy += 0.005;
        seed.x += seed.vx;
        seed.y += seed.vy;
        seed.life -= seed.decay;

        if (seed.life <= 0 || seed.x < 0 || seed.x > this.width || seed.y < -50 || seed.y > this.height) {
          this.respawnSeed(seed);
        }
      }

      this.ctx.save();
      this.ctx.translate(seed.x, seed.y);
      this.ctx.scale(seed.scale, seed.scale);
      
      this.ctx.beginPath();
      this.ctx.moveTo(0, 0);
      this.ctx.lineTo(0, -12);
      this.ctx.strokeStyle = seed.attached ? 'rgba(200, 230, 210, 0.45)' : \`rgba(200, 230, 210, \${seed.life})\`;
      this.ctx.lineWidth = 1.0;
      this.ctx.stroke();

      this.ctx.beginPath();
      for (let j = 0; j < 5; j++) {
        const bristleAngle = -Math.PI / 2 + (j - 2) * 0.28;
        const len = 6 + Math.random() * 3;
        this.ctx.moveTo(0, -12);
        this.ctx.lineTo(Math.cos(bristleAngle) * len, -12 + Math.sin(bristleAngle) * len);
      }
      this.ctx.strokeStyle = seed.attached ? seed.color : seed.color.replace(/[\\d.]+\\)$/, \`\${seed.life * 0.8})\`);
      this.ctx.lineWidth = 0.8;
      this.ctx.stroke();

      this.ctx.restore();
    });

    requestAnimationFrame((t) => this.animate(t));
  }

  respawnSeed(seed) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 26 + 4;
    seed.attached = true;
    seed.relX = Math.cos(angle) * distance;
    seed.relY = Math.sin(angle) * distance;
    seed.angle = angle;
    seed.vx = 0;
    seed.vy = 0;
    seed.scale = 0.5 + Math.random() * 0.5;
    seed.life = 1.0;
    seed.decay = 0.001 + Math.random() * 0.001;
    seed.color = this.seedColors[Math.floor(Math.random() * this.seedColors.length)];
  }

  playHarpSound(y) {
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

      const pentatonic = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66, 1318.51, 1567.98, 1760.00];
      const scalePct = 1 - Math.max(0, Math.min(1, y / this.height));
      const noteIdx = Math.floor(scalePct * (pentatonic.length - 1));
      const baseFreq = pentatonic[noteIdx];

      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.05, ctx.currentTime + 0.08);

      const lofiVolSetting = localStorage.getItem('aetherflow_lofi_vol');
      const masterVolumeMultiplier = lofiVolSetting !== null ? parseFloat(lofiVolSetting) : 0.5;
      const vol = 0.08 * masterVolumeMultiplier;

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.015);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.4);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(4000, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.6);
      filter.Q.setValueAtTime(2.0, ctx.currentTime);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 1.5);
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
