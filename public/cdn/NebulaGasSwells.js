import BaseAnimation from './BaseAnimation.js';

export default class NebulaGasSwells extends BaseAnimation {
  constructor() {
    super();
    this.particles = [];
    this.mouse = { x: null, y: null, active: false, radius: 200 };
    this.bg = '#040308'; // Dark cosmic vacuum purple-black
  }

  setup() {
    this.particles = [];
    const count = 40 + Math.floor(this.width / 30);
    
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        radius: 40 + Math.random() * 80,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        hue: 260 + Math.random() * 60, // cosmic violet, pink, and indigo
        alphaMax: 0.08 + Math.random() * 0.08,
        pulseSpeed: 0.002 + Math.random() * 0.003,
        pulsePhase: Math.random() * Math.PI
      });
    }
  }

  resize(width, height) {
    super.resize(width, height);
    this.setup();
  }

  draw(ctx, time) {
    // Liquid ink cosmic overlay
    ctx.fillStyle = 'rgba(4, 3, 8, 0.12)';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.globalCompositeOperation = 'screen';

    this.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;

      // Slow drift boundaries wrap
      if (p.x < -p.radius) p.x = this.width + p.radius;
      if (p.x > this.width + p.radius) p.x = -p.radius;
      if (p.y < -p.radius) p.y = this.height + p.radius;
      if (p.y > this.height + p.radius) p.y = -p.radius;

      // Oscillating gas densities
      p.pulsePhase += p.pulseSpeed;
      const opacity = p.alphaMax * (0.6 + Math.sin(p.pulsePhase) * 0.4);

      // Mouse vector distortion
      let radialOffset = 0;
      if (this.mouse.active && this.mouse.x !== null) {
        const dx = p.x - this.mouse.x;
        const dy = p.y - this.mouse.y;
        const dist = Math.hypot(dx, dy);

        if (dist < this.mouse.radius) {
          const force = (this.mouse.radius - dist) / this.mouse.radius;
          p.x += (dx / (dist || 1)) * force * 1.8;
          p.y += (dy / (dist || 1)) * force * 1.8;
          radialOffset = force * 24;

          if (Math.random() < 0.004) {
            this.playAnalogSwell(p.y, force);
          }
        }
      }

      // Draw gas cloud radial gradient
      const grad = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, p.radius + radialOffset);
      grad.addColorStop(0, `hsla(${p.hue}, 90%, 65%, ${opacity})`);
      grad.addColorStop(0.5, `hsla(${p.hue + 15}, 80%, 55%, ${opacity * 0.4})`);
      grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius + radialOffset, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    });

    ctx.globalCompositeOperation = 'source-over'; // reset
  }

  destroy() {
    super.destroy();
    this.particles = [];
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

  playAnalogSwell(y, force) {
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

      // Low cosmic hum/swell frequencies
      const scale = [65.41, 73.42, 82.41, 98.00, 110.00, 130.81, 146.83, 164.81];
      const scalePct = 1 - Math.max(0, Math.min(1, y / this.height));
      const freq = scale[Math.floor(scalePct * (scale.length - 1))];

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(freq, ctx.currentTime);
      
      // Detune second oscillator for analog chorus thick swell
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 1.015, ctx.currentTime);

      const lofiVolSetting = localStorage.getItem('aetherflow_lofi_vol');
      const masterVolumeMultiplier = lofiVolSetting !== null ? parseFloat(lofiVolSetting) : 0.5;
      const vol = 0.08 * masterVolumeMultiplier;

      // Soft analog pad sweep envelope
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.4);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.8);

      // Deep sweep lowpass filter
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(120, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(1400 * force, ctx.currentTime + 0.8);
      filter.Q.setValueAtTime(2.5, ctx.currentTime);

      osc1.start(ctx.currentTime);
      osc2.start(ctx.currentTime);
      
      osc1.stop(ctx.currentTime + 3.0);
      osc2.stop(ctx.currentTime + 3.0);
    } catch (e) {}
  }

  static get title() {
    return 'Nebula Gas Swells';
  }

  static get description() {
    return 'Swirling cosmic gaseous cloud coordinates shifting continuously. Mouse interactions warp the cosmic gas layers, synthesizing lush, detuned analog synthesizer pad swells.';
  }

  static get vibe() {
    return 'Cosmic';
  }

  static get sourceCode() {
    return `class NebulaGasSwells {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.mouse = { x: null, y: null, active: false, radius: 200 };
    
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
    this.particles = [];
    const count = 40 + Math.floor(this.width / 30);
    
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        radius: 40 + Math.random() * 80,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        hue: 260 + Math.random() * 60,
        alphaMax: 0.08 + Math.random() * 0.08,
        pulseSpeed: 0.002 + Math.random() * 0.003,
        pulsePhase: Math.random() * Math.PI
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
    this.ctx.fillStyle = 'rgba(4, 3, 8, 0.12)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.globalCompositeOperation = 'screen';

    this.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < -p.radius) p.x = this.width + p.radius;
      if (p.x > this.width + p.radius) p.x = -p.radius;
      if (p.y < -p.radius) p.y = this.height + p.radius;
      if (p.y > this.height + p.radius) p.y = -p.radius;

      p.pulsePhase += p.pulseSpeed;
      const opacity = p.alphaMax * (0.6 + Math.sin(p.pulsePhase) * 0.4);

      let radialOffset = 0;
      if (this.mouse.active && this.mouse.x !== null) {
        const dx = p.x - this.mouse.x;
        const dy = p.y - this.mouse.y;
        const dist = Math.hypot(dx, dy);

        if (dist < this.mouse.radius) {
          const force = (this.mouse.radius - dist) / this.mouse.radius;
          p.x += (dx / (dist || 1)) * force * 1.8;
          p.y += (dy / (dist || 1)) * force * 1.8;
          radialOffset = force * 24;

          if (Math.random() < 0.004) {
            this.playAnalogSwell(p.y, force);
          }
        }
      }

      const grad = this.ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, p.radius + radialOffset);
      grad.addColorStop(0, \`hsla(\${p.hue}, 90%, 65%, \${opacity})\`);
      grad.addColorStop(0.5, \`hsla(\${p.hue + 15}, 80%, 55%, \${opacity * 0.4})\`);
      grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius + radialOffset, 0, Math.PI * 2);
      this.ctx.fillStyle = grad;
      this.ctx.fill();
    });

    this.ctx.globalCompositeOperation = 'source-over';
    requestAnimationFrame((t) => this.animate(t));
  }

  playAnalogSwell(y, force) {
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

      const scale = [65.41, 73.42, 82.41, 98.00, 110.00, 130.81, 146.83, 164.81];
      const scalePct = 1 - Math.max(0, Math.min(1, y / this.height));
      const freq = scale[Math.floor(scalePct * (scale.length - 1))];

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(freq, ctx.currentTime);
      
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 1.015, ctx.currentTime);

      const lofiVolSetting = localStorage.getItem('aetherflow_lofi_vol');
      const masterVolumeMultiplier = lofiVolSetting !== null ? parseFloat(lofiVolSetting) : 0.5;
      const vol = 0.08 * masterVolumeMultiplier;

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.4);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.8);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(120, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(1400 * force, ctx.currentTime + 0.8);
      filter.Q.setValueAtTime(2.5, ctx.currentTime);

      osc1.start(ctx.currentTime);
      osc2.start(ctx.currentTime);
      
      osc1.stop(ctx.currentTime + 3.0);
      osc2.stop(ctx.currentTime + 3.0);
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
