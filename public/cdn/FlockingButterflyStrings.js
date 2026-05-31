import BaseAnimation from './BaseAnimation.js';

export default class FlockingButterflyStrings extends BaseAnimation {
  constructor() {
    super();
    this.butterflies = [];
    this.mouse = { x: null, y: null, active: false, radius: 150 };
    this.bg = '#07050a'; // Dark purple night meadow backdrop
  }

  setup() {
    this.butterflies = [];
    const count = 25 + Math.floor(this.width / 50);

    for (let i = 0; i < count; i++) {
      this.butterflies.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: 8 + Math.random() * 6,
        hue: 280 + Math.random() * 80, // bright pinks, purples, violets
        maxSpeed: 2.2 + Math.random() * 0.8,
        flapSpeed: 0.08 + Math.random() * 0.08,
        flapPhase: Math.random() * Math.PI * 2,
        lastFlapPluck: 0
      });
    }
  }

  resize(width, height) {
    super.resize(width, height);
    this.setup();
  }

  draw(ctx, time) {
    // Midnight violet mist trails
    ctx.fillStyle = 'rgba(7, 5, 10, 0.14)';
    ctx.fillRect(0, 0, this.width, this.height);

    this.butterflies.forEach(b => {
      // Flap wings
      const prevFlap = Math.sin(b.flapPhase);
      b.flapPhase += b.flapSpeed;
      const currentFlap = Math.sin(b.flapPhase);

      // Simple physics: move boid
      b.x += b.vx;
      b.y += b.vy;

      // Mouse attraction
      if (this.mouse.active && this.mouse.x !== null) {
        const dx = this.mouse.x - b.x;
        const dy = this.mouse.y - b.y;
        const dist = Math.hypot(dx, dy);

        if (dist < this.mouse.radius) {
          const force = (this.mouse.radius - dist) / this.mouse.radius;
          b.vx += (dx / (dist || 1)) * force * 0.08;
          b.vy += (dy / (dist || 1)) * force * 0.08;

          // Excite flap speed near cursor
          b.flapPhase += b.flapSpeed * force * 1.5;
        }
      }

      // Natural drag & cruise velocity steering
      const speed = Math.hypot(b.vx, b.vy);
      if (speed > b.maxSpeed) {
        b.vx = (b.vx / speed) * b.maxSpeed;
        b.vy = (b.vy / speed) * b.maxSpeed;
      }
      // Add slight chaotic drifting noise
      b.vx += (Math.random() - 0.5) * 0.12;
      b.vy += (Math.random() - 0.5) * 0.12;

      // Boundaries wrap
      if (b.x < -20) b.x = this.width + 20;
      if (b.x > this.width + 20) b.x = -20;
      if (b.y < -20) b.y = this.height + 20;
      if (b.y > this.height + 20) b.y = -20;

      // Sonify wing flaps: trigger mandolin pluck on downward peak of wing flap
      if (prevFlap > 0.0 && currentFlap <= 0.0) {
        b.lastFlapPluck++;
        // Throttled sound triggers
        if (Math.random() < 0.045 && b.lastFlapPluck > 12) {
          b.lastFlapPluck = 0;
          this.playMandolinPluck(b.y, b.size);
        }
      }

      // Draw butterfly
      ctx.save();
      ctx.translate(b.x, b.y);
      // Align visual angle with velocity direction
      const heading = Math.atan2(b.vy, b.vx);
      ctx.rotate(heading + Math.PI * 0.5);

      // Animated wings (scale width based on flap sine wave)
      const wingScale = Math.abs(currentFlap);

      ctx.fillStyle = `hsla(${b.hue}, 95%, 68%, 0.72)`;
      ctx.strokeStyle = `hsla(${b.hue + 20}, 100%, 75%, 0.95)`;
      ctx.lineWidth = 1.0;

      // Left wing pair
      ctx.save();
      ctx.scale(-wingScale, 1.0);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-b.size * 1.5, -b.size * 1.2, -b.size * 1.8, -b.size * 0.4);
      ctx.quadraticCurveTo(-b.size * 1.2, b.size * 0.8, 0, 0);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Right wing pair
      ctx.save();
      ctx.scale(wingScale, 1.0);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(b.size * 1.5, -b.size * 1.2, b.size * 1.8, -b.size * 0.4);
      ctx.quadraticCurveTo(b.size * 1.2, b.size * 0.8, 0, 0);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Antennae
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(0, -b.size * 0.4);
      ctx.quadraticCurveTo(-b.size * 0.4, -b.size * 1.2, -b.size * 0.6, -b.size * 1.4);
      ctx.moveTo(0, -b.size * 0.4);
      ctx.quadraticCurveTo(b.size * 0.4, -b.size * 1.2, b.size * 0.6, -b.size * 1.4);
      ctx.stroke();

      ctx.restore();
    });
  }

  destroy() {
    super.destroy();
    this.butterflies = [];
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

  playMandolinPluck(y, size) {
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
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // Connections
      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      // High crisp mandolin scales
      const pentatonic = [440.00, 493.88, 554.37, 659.25, 739.99, 880.00, 987.77, 1109.73, 1318.51];
      const scalePct = 1 - Math.max(0, Math.min(1, y / this.height));
      const noteIdx = Math.floor(scalePct * (pentatonic.length - 1));
      const freq = pentatonic[noteIdx];

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(freq, ctx.currentTime);
      
      // detuned secondary oscillator for double-string tremolo feel
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 1.008, ctx.currentTime);

      const lofiVolSetting = localStorage.getItem('aetherflow_lofi_vol');
      const masterVolumeMultiplier = lofiVolSetting !== null ? parseFloat(lofiVolSetting) : 0.5;
      const vol = 0.05 * masterVolumeMultiplier;

      // Extremely fast plucking decay envelope
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.003);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);

      // Crispy bandpass filter
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(freq * 2.5, ctx.currentTime);
      filter.Q.setValueAtTime(4.0, ctx.currentTime);

      osc1.start(ctx.currentTime);
      osc2.start(ctx.currentTime);
      
      osc1.stop(ctx.currentTime + 0.3);
      osc2.stop(ctx.currentTime + 0.3);
    } catch (e) {}
  }

  static get title() {
    return 'Flocking Butterfly Strings';
  }

  static get description() {
    return 'Colorful boid butterflies flocking and steering towards your cursor coordinates. Wing flaps are procedurally sonified as fast, quiet mandolin plucks, forming a self-organizing acoustic meadow.';
  }

  static get vibe() {
    return 'Simulated';
  }

  static get sourceCode() {
    return `class FlockingButterflyStrings {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.butterflies = [];
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
    this.butterflies = [];
    const count = 25 + Math.floor(this.width / 50);

    for (let i = 0; i < count; i++) {
      this.butterflies.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: 8 + Math.random() * 6,
        hue: 280 + Math.random() * 80,
        maxSpeed: 2.2 + Math.random() * 0.8,
        flapSpeed: 0.08 + Math.random() * 0.08,
        flapPhase: Math.random() * Math.PI * 2,
        lastFlapPluck: 0
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
    this.ctx.fillStyle = 'rgba(7, 5, 10, 0.14)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.butterflies.forEach(b => {
      const prevFlap = Math.sin(b.flapPhase);
      b.flapPhase += b.flapSpeed;
      const currentFlap = Math.sin(b.flapPhase);

      b.x += b.vx;
      b.y += b.vy;

      if (this.mouse.active && this.mouse.x !== null) {
        const dx = this.mouse.x - b.x;
        const dy = this.mouse.y - b.y;
        const dist = Math.hypot(dx, dy);

        if (dist < this.mouse.radius) {
          const force = (this.mouse.radius - dist) / this.mouse.radius;
          b.vx += (dx / (dist || 1)) * force * 0.08;
          b.vy += (dy / (dist || 1)) * force * 0.08;
          b.flapPhase += b.flapSpeed * force * 1.5;
        }
      }

      const speed = Math.hypot(b.vx, b.vy);
      if (speed > b.maxSpeed) {
        b.vx = (b.vx / speed) * b.maxSpeed;
        b.vy = (b.vy / speed) * b.maxSpeed;
      }
      b.vx += (Math.random() - 0.5) * 0.12;
      b.vy += (Math.random() - 0.5) * 0.12;

      if (b.x < -20) b.x = this.width + 20;
      if (b.x > this.width + 20) b.x = -20;
      if (b.y < -20) b.y = this.height + 20;
      if (b.y > this.height + 20) b.y = -20;

      if (prevFlap > 0.0 && currentFlap <= 0.0) {
        b.lastFlapPluck++;
        if (Math.random() < 0.045 && b.lastFlapPluck > 12) {
          b.lastFlapPluck = 0;
          this.playMandolinPluck(b.y, b.size);
        }
      }

      this.ctx.save();
      this.ctx.translate(b.x, b.y);
      const heading = Math.atan2(b.vy, b.vx);
      this.ctx.rotate(heading + Math.PI * 0.5);

      const wingScale = Math.abs(currentFlap);

      this.ctx.fillStyle = \`hsla(\${b.hue}, 95%, 68%, 0.72)\`;
      this.ctx.strokeStyle = \`hsla(\${b.hue + 20}, 100%, 75%, 0.95)\`;
      this.ctx.lineWidth = 1.0;

      this.ctx.save();
      this.ctx.scale(-wingScale, 1.0);
      this.ctx.beginPath();
      this.ctx.moveTo(0, 0);
      this.ctx.quadraticCurveTo(-b.size * 1.5, -b.size * 1.2, -b.size * 1.8, -b.size * 0.4);
      this.ctx.quadraticCurveTo(-b.size * 1.2, b.size * 0.8, 0, 0);
      this.ctx.fill();
      this.ctx.stroke();
      this.ctx.restore();

      this.ctx.save();
      this.ctx.scale(wingScale, 1.0);
      this.ctx.beginPath();
      this.ctx.moveTo(0, 0);
      this.ctx.quadraticCurveTo(b.size * 1.5, b.size * 1.2, b.size * 1.8, -b.size * 0.4);
      this.ctx.quadraticCurveTo(b.size * 1.2, b.size * 0.8, 0, 0);
      this.ctx.fill();
      this.ctx.stroke();
      this.ctx.restore();

      this.ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      this.ctx.lineWidth = 0.8;
      this.ctx.beginPath();
      this.ctx.moveTo(0, -b.size * 0.4);
      this.ctx.quadraticCurveTo(-b.size * 0.4, -b.size * 1.2, -b.size * 0.6, -b.size * 1.4);
      this.ctx.moveTo(0, -b.size * 0.4);
      this.ctx.quadraticCurveTo(b.size * 0.4, -b.size * 1.2, b.size * 0.6, -b.size * 1.4);
      this.ctx.stroke();

      this.ctx.restore();
    });

    requestAnimationFrame((t) => this.animate(t));
  }

  playMandolinPluck(y, size) {
    if (this.canvas && this.canvas.getAttribute('data-audio-muted') === 'true') return;
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
      
      const ctx = this.audioCtx;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      const pentatonic = [440.00, 493.88, 554.37, 659.25, 739.99, 880.00, 987.77, 1109.73, 1318.51];
      const scalePct = 1 - Math.max(0, Math.min(1, y / this.height));
      const noteIdx = Math.floor(scalePct * (pentatonic.length - 1));
      const freq = pentatonic[noteIdx];

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(freq, ctx.currentTime);
      
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 1.008, ctx.currentTime);

      const lofiVolSetting = localStorage.getItem('aetherflow_lofi_vol');
      const masterVolumeMultiplier = lofiVolSetting !== null ? parseFloat(lofiVolSetting) : 0.5;
      const vol = 0.05 * masterVolumeMultiplier;

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.003);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(freq * 2.5, ctx.currentTime);
      filter.Q.setValueAtTime(4.0, ctx.currentTime);

      osc1.start(ctx.currentTime);
      osc2.start(ctx.currentTime);
      
      osc1.stop(ctx.currentTime + 0.3);
      osc2.stop(ctx.currentTime + 0.3);
    } catch (e) {}
  }
}`;
  }
}
