import BaseAnimation from './BaseAnimation.js';

export default class BioluminescentRainPianos extends BaseAnimation {
  constructor() {
    super();
    this.drops = [];
    this.splashes = [];
    this.mouse = { x: null, y: null, active: false, radius: 110 };
    this.bg = '#050709'; // Inky velvet rainy night background
  }

  setup() {
    this.drops = [];
    this.splashes = [];
    
    // Create moderate droplet density
    const count = 35 + Math.floor(this.width / 40);
    for (let i = 0; i < count; i++) {
      this.drops.push(this.createDrop(true));
    }
  }

  createDrop(randomY = false) {
    const y = randomY ? Math.random() * this.height : -30;
    return {
      x: Math.random() * this.width,
      y: y,
      vy: 4.5 + Math.random() * 3.5,
      length: 12 + Math.random() * 15,
      hue: 200 + Math.random() * 45, // neon cyan to violet
      opacity: 0.15 + Math.random() * 0.45,
      targetY: this.height - Math.random() * 25
    };
  }

  resize(width, height) {
    super.resize(width, height);
    this.setup();
  }

  draw(ctx, time) {
    // Wet ink canvas paint trails
    ctx.fillStyle = 'rgba(5, 7, 9, 0.16)';
    ctx.fillRect(0, 0, this.width, this.height);

    // Update and draw raindrops
    for (let i = 0; i < this.drops.length; i++) {
      const drop = this.drops[i];
      drop.y += drop.vy;

      // Mouse collision deflect bubble
      if (this.mouse.active && this.mouse.x !== null) {
        const dx = drop.x - this.mouse.x;
        const dy = drop.y - this.mouse.y;
        const d = Math.hypot(dx, dy);

        if (d < this.mouse.radius) {
          const force = (this.mouse.radius - d) / this.mouse.radius;
          drop.x += (dx / (d || 1)) * force * 5;

          // Splashing mid-air on interaction bubble
          if (d < 35 && Math.random() < 0.1) {
            this.triggerSplash(drop.x, drop.y, drop.hue);
            this.drops[i] = this.createDrop(false);
            continue;
          }
        }
      }

      // Ground floor collision
      if (drop.y >= drop.targetY) {
        this.triggerSplash(drop.x, drop.targetY, drop.hue);
        this.drops[i] = this.createDrop(false);
        continue;
      }

      ctx.beginPath();
      ctx.strokeStyle = `hsla(${drop.hue}, 88%, 68%, ${drop.opacity})`;
      ctx.lineWidth = 1.2;
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x, drop.y + drop.length);
      ctx.stroke();
    }

    // Draw splashes
    ctx.lineWidth = 1.0;
    for (let i = this.splashes.length - 1; i >= 0; i--) {
      const s = this.splashes[i];
      s.radius += s.speed;
      s.opacity -= 0.015;

      if (s.opacity <= 0) {
        this.splashes.splice(i, 1);
        continue;
      }

      ctx.beginPath();
      ctx.ellipse(s.x, s.y, s.radius, s.radius * 0.3, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(${s.hue}, 90%, 75%, ${s.opacity})`;
      ctx.stroke();
    }
  }

  triggerSplash(x, y, hue) {
    this.splashes.push({
      x,
      y,
      radius: 1.0,
      maxRadius: 10 + Math.random() * 12,
      opacity: 0.8,
      speed: 0.35 + Math.random() * 0.3,
      hue
    });

    // Play soothing felt piano notes on splash coordinates
    this.playPianoSound(x, y);
  }

  destroy() {
    super.destroy();
    this.drops = [];
    this.splashes = [];
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

  playPianoSound(x, y) {
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

      // C-Minor cozy felt pentatonic scale
      const pentatonic = [130.81, 146.83, 155.56, 174.61, 196.00, 233.08, 261.63, 293.66, 311.13, 349.23, 392.00, 466.16, 523.25];
      const scalePct = Math.max(0, Math.min(1, x / this.width));
      const noteIdx = Math.floor(scalePct * (pentatonic.length - 1));
      const baseFreq = pentatonic[noteIdx];

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);

      const lofiVolSetting = localStorage.getItem('aetherflow_lofi_vol');
      const masterVolumeMultiplier = lofiVolSetting !== null ? parseFloat(lofiVolSetting) : 0.5;
      
      // Softer rain droplet impact plucks
      const vol = (0.05 + Math.random() * 0.05) * masterVolumeMultiplier;

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.015);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.8);

      // Warm lowpass filter to make it sound like a felt dampener
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(280, ctx.currentTime + 0.6);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 2.0);
    } catch (e) {}
  }

  static get title() {
    return 'Bioluminescent Rain Pianos';
  }

  static get description() {
    return 'Glowing bioluminescent raindrops drifting down. Droplets hitting the screen floor trigger soft, felt-piano chords and notes from a melancholic pentatonic scale, synthesizing a self-playing rainy symphony.';
  }

  static get vibe() {
    return 'Natural';
  }

  static get sourceCode() {
    return `class BioluminescentRainPianos {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.drops = [];
    this.splashes = [];
    this.mouse = { x: null, y: null, active: false, radius: 110 };
    
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
    this.drops = [];
    this.splashes = [];
    const count = 35 + Math.floor(this.width / 40);
    for (let i = 0; i < count; i++) {
      this.drops.push(this.createDrop(true));
    }
  }

  createDrop(randomY = false) {
    const y = randomY ? Math.random() * this.height : -30;
    return {
      x: Math.random() * this.width,
      y: y,
      vy: 4.5 + Math.random() * 3.5,
      length: 12 + Math.random() * 15,
      hue: 200 + Math.random() * 45,
      opacity: 0.15 + Math.random() * 0.45,
      targetY: this.height - Math.random() * 25
    };
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
    this.ctx.fillStyle = 'rgba(5, 7, 9, 0.16)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    for (let i = 0; i < this.drops.length; i++) {
      const drop = this.drops[i];
      drop.y += drop.vy;

      if (this.mouse.active && this.mouse.x !== null) {
        const dx = drop.x - this.mouse.x;
        const dy = drop.y - this.mouse.y;
        const d = Math.hypot(dx, dy);

        if (d < this.mouse.radius) {
          const force = (this.mouse.radius - d) / this.mouse.radius;
          drop.x += (dx / (d || 1)) * force * 5;

          if (d < 35 && Math.random() < 0.1) {
            this.triggerSplash(drop.x, drop.y, drop.hue);
            this.drops[i] = this.createDrop(false);
            continue;
          }
        }
      }

      if (drop.y >= drop.targetY) {
        this.triggerSplash(drop.x, drop.targetY, drop.hue);
        this.drops[i] = this.createDrop(false);
        continue;
      }

      this.ctx.beginPath();
      this.ctx.strokeStyle = \`hsla(\${drop.hue}, 88%, 68%, \${drop.opacity})\`;
      this.ctx.lineWidth = 1.2;
      this.ctx.moveTo(drop.x, drop.y);
      this.ctx.lineTo(drop.x, drop.y + drop.length);
      this.ctx.stroke();
    }

    this.ctx.lineWidth = 1.0;
    for (let i = this.splashes.length - 1; i >= 0; i--) {
      const s = this.splashes[i];
      s.radius += s.speed;
      s.opacity -= 0.015;

      if (s.opacity <= 0) {
        this.splashes.splice(i, 1);
        continue;
      }

      this.ctx.beginPath();
      this.ctx.ellipse(s.x, s.y, s.radius, s.radius * 0.3, 0, 0, Math.PI * 2);
      this.ctx.strokeStyle = \`hsla(\${s.hue}, 90%, 75%, \${s.opacity})\`;
      this.ctx.stroke();
    }

    requestAnimationFrame((t) => this.animate(t));
  }

  triggerSplash(x, y, hue) {
    this.splashes.push({
      x,
      y,
      radius: 1.0,
      maxRadius: 10 + Math.random() * 12,
      opacity: 0.8,
      speed: 0.35 + Math.random() * 0.3,
      hue
    });
    this.playPianoSound(x, y);
  }

  playPianoSound(x, y) {
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

      const pentatonic = [130.81, 146.83, 155.56, 174.61, 196.00, 233.08, 261.63, 293.66, 311.13, 349.23, 392.00, 466.16, 523.25];
      const scalePct = Math.max(0, Math.min(1, x / this.width));
      const noteIdx = Math.floor(scalePct * (pentatonic.length - 1));
      const baseFreq = pentatonic[noteIdx];

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);

      const lofiVolSetting = localStorage.getItem('aetherflow_lofi_vol');
      const masterVolumeMultiplier = lofiVolSetting !== null ? parseFloat(lofiVolSetting) : 0.5;
      const vol = (0.05 + Math.random() * 0.05) * masterVolumeMultiplier;

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.015);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.8);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(280, ctx.currentTime + 0.6);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 2.0);
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
