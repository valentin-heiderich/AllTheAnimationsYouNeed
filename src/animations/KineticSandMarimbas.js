import BaseAnimation from './BaseAnimation.js';

export default class KineticSandMarimbas extends BaseAnimation {
  constructor() {
    super();
    this.points = [];
    this.mouse = { x: null, y: null, active: false, radius: 90 };
    this.bg = '#0e0b06'; // Cozy dark desert sand background
    this.cols = 0;
    this.spacing = 15;
  }

  setup() {
    this.points = [];
    this.cols = Math.ceil(this.width / this.spacing) + 1;
    const rows = Math.ceil(this.height / 30) + 1;

    for (let r = 0; r < rows; r++) {
      const rowY = r * 30;
      const rowPoints = [];
      for (let c = 0; c < this.cols; c++) {
        const x = c * this.spacing;
        // Natural sine-modulated dune ripples
        const baseHeight = Math.sin(c * 0.4 + r * 0.5) * 8;
        rowPoints.push({
          x: x,
          y: rowY + baseHeight,
          baseY: rowY,
          heightOffset: baseHeight,
          vy: 0,
          elasticity: 0.08,
          damping: 0.9,
          brushed: false
        });
      }
      this.points.push(rowPoints);
    }
  }

  resize(width, height) {
    super.resize(width, height);
    this.setup();
  }

  draw(ctx, time) {
    // Elegant warm sand trail shader
    ctx.fillStyle = 'rgba(14, 11, 6, 0.12)';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.strokeStyle = 'rgba(235, 190, 140, 0.16)';
    ctx.lineWidth = 1.6;

    for (let r = 0; r < this.points.length; r++) {
      const row = this.points[r];
      
      ctx.beginPath();
      ctx.moveTo(row[0].x, row[0].y);

      for (let c = 0; c < row.length; c++) {
        const pt = row[c];

        // Restoring spring physics
        const accel = (pt.baseY + pt.heightOffset - pt.y) * pt.elasticity;
        pt.vy += accel;
        pt.vy *= pt.damping;
        pt.y += pt.vy;

        // Mouse rake collision
        if (this.mouse.active && this.mouse.x !== null) {
          const dx = pt.x - this.mouse.x;
          const dy = pt.y - this.mouse.y;
          const dist = Math.hypot(dx, dy);

          if (dist < this.mouse.radius) {
            const force = (this.mouse.radius - dist) / this.mouse.radius;
            pt.vy += force * 4.5; // press sand downwards
            
            if (dist < 25 && !pt.brushed) {
              pt.brushed = true;
              this.playMarimbaRollSound(pt.y, Math.abs(pt.vy));
            }
          } else {
            pt.brushed = false;
          }
        } else {
          pt.brushed = false;
        }

        if (c > 0) {
          ctx.lineTo(pt.x, pt.y);
        }
      }
      ctx.stroke();

      // Render glowing grains/ridges
      row.forEach((pt, idx) => {
        if (idx % 6 === 0 && Math.abs(pt.vy) > 0.6) {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 1.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(245, 215, 170, ${Math.min(1.0, Math.abs(pt.vy) * 0.35)})`;
          ctx.fill();
        }
      });
    }
  }

  destroy() {
    super.destroy();
    this.points = [];
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

  playMarimbaRollSound(y, force) {
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

      // Low-mid warm marimba scale
      const pentatonic = [220.00, 246.94, 277.18, 329.63, 369.99, 440.00, 493.88, 554.37, 659.25, 739.99];
      const scalePct = 1 - Math.max(0, Math.min(1, y / this.height));
      const noteIdx = Math.floor(scalePct * (pentatonic.length - 1));
      const baseFreq = pentatonic[noteIdx];

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);

      const lofiVolSetting = localStorage.getItem('aetherflow_lofi_vol');
      const masterVolumeMultiplier = lofiVolSetting !== null ? parseFloat(lofiVolSetting) : 0.5;
      
      // Fast, delicate marimba rolls
      const vol = Math.min(0.12, force * 0.012) * masterVolumeMultiplier;

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.002);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);

      // Resonant bandpass filter
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(baseFreq * 1.4, ctx.currentTime);
      filter.Q.setValueAtTime(5.0, ctx.currentTime);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {}
  }

  static get title() {
    return 'Kinetic Sand Marimbas';
  }

  static get description() {
    return 'Cozy desert dunes forming natural wave ridges. Raking the sand with your mouse dynamically deforms the heightfields, triggering rapid wooden marimba rolls mapped to dune elevation curves.';
  }

  static get vibe() {
    return 'Satisfying';
  }

  static get sourceCode() {
    return `class KineticSandMarimbas {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.points = [];
    this.mouse = { x: null, y: null, active: false, radius: 90 };
    this.spacing = 15;
    
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
    this.points = [];
    this.cols = Math.ceil(this.width / this.spacing) + 1;
    const rows = Math.ceil(this.height / 30) + 1;

    for (let r = 0; r < rows; r++) {
      const rowY = r * 30;
      const rowPoints = [];
      for (let c = 0; c < this.cols; c++) {
        const x = c * this.spacing;
        const baseHeight = Math.sin(c * 0.4 + r * 0.5) * 8;
        rowPoints.push({
          x: x,
          y: rowY + baseHeight,
          baseY: rowY,
          heightOffset: baseHeight,
          vy: 0,
          elasticity: 0.08,
          damping: 0.9,
          brushed: false
        });
      }
      this.points.push(rowPoints);
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
    this.ctx.fillStyle = 'rgba(14, 11, 6, 0.12)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.strokeStyle = 'rgba(235, 190, 140, 0.16)';
    this.ctx.lineWidth = 1.6;

    for (let r = 0; r < this.points.length; r++) {
      const row = this.points[r];
      
      this.ctx.beginPath();
      this.ctx.moveTo(row[0].x, row[0].y);

      for (let c = 0; c < row.length; c++) {
        const pt = row[c];

        const accel = (pt.baseY + pt.heightOffset - pt.y) * pt.elasticity;
        pt.vy += accel;
        pt.vy *= pt.damping;
        pt.y += pt.vy;

        if (this.mouse.active && this.mouse.x !== null) {
          const dx = pt.x - this.mouse.x;
          const dy = pt.y - this.mouse.y;
          const dist = Math.hypot(dx, dy);

          if (dist < this.mouse.radius) {
            const force = (this.mouse.radius - dist) / this.mouse.radius;
            pt.vy += force * 4.5;
            
            if (dist < 25 && !pt.brushed) {
              pt.brushed = true;
              this.playMarimbaRollSound(pt.y, Math.abs(pt.vy));
            }
          } else {
            pt.brushed = false;
          }
        } else {
          pt.brushed = false;
        }

        if (c > 0) this.ctx.lineTo(pt.x, pt.y);
      }
      this.ctx.stroke();

      row.forEach((pt, idx) => {
        if (idx % 6 === 0 && Math.abs(pt.vy) > 0.6) {
          this.ctx.beginPath();
          this.ctx.arc(pt.x, pt.y, 1.2, 0, Math.PI * 2);
          this.ctx.fillStyle = \`rgba(245, 215, 170, \${Math.min(1.0, Math.abs(pt.vy) * 0.35)})\`;
          this.ctx.fill();
        }
      });
    }

    requestAnimationFrame((t) => this.animate(t));
  }

  playMarimbaRollSound(y, force) {
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

      const pentatonic = [220.00, 246.94, 277.18, 329.63, 369.99, 440.00, 493.88, 554.37, 659.25, 739.99];
      const scalePct = 1 - Math.max(0, Math.min(1, y / this.height));
      const noteIdx = Math.floor(scalePct * (pentatonic.length - 1));
      const baseFreq = pentatonic[noteIdx];

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);

      const lofiVolSetting = localStorage.getItem('aetherflow_lofi_vol');
      const masterVolumeMultiplier = lofiVolSetting !== null ? parseFloat(lofiVolSetting) : 0.5;
      const vol = Math.min(0.12, force * 0.012) * masterVolumeMultiplier;

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.002);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(baseFreq * 1.4, ctx.currentTime);
      filter.Q.setValueAtTime(5.0, ctx.currentTime);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
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
