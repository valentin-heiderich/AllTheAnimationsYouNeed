import BaseAnimation from './BaseAnimation.js';

export default class ChimingVinesIvy extends BaseAnimation {
  constructor() {
    super();
    this.vines = [];
    this.mouse = { x: null, y: null, active: false };
    this.bg = '#070a09'; // Deep earthy night-green backdrop
    this.maxVines = 12;
  }

  setup() {
    this.vines = [];
    // Start with 3 base climbing roots at bottom
    const startCount = 3;
    for (let i = 0; i < startCount; i++) {
      this.spawnVine(
        (this.width / (startCount + 1)) * (i + 1),
        this.height + 10,
        -Math.PI * 0.5 // growth heading straight up
      );
    }
  }

  spawnVine(x, y, angle) {
    if (this.vines.length >= this.maxVines) return;
    this.vines.push({
      points: [{ x, y }],
      angle: angle,
      speed: 1.8 + Math.random() * 1.2,
      thickness: 3.5 + Math.random() * 2.0,
      leaves: [],
      hue: 95 + Math.random() * 35, // organic leafy greens
      active: true,
      lastBranch: 0
    });
  }

  resize(width, height) {
    super.resize(width, height);
    this.setup();
  }

  draw(ctx, time) {
    // Soft fade trail background
    ctx.fillStyle = 'rgba(7, 10, 9, 0.08)';
    ctx.fillRect(0, 0, this.width, this.height);

    this.vines.forEach(vine => {
      if (!vine.active) return;

      const lastPt = vine.points[vine.points.length - 1];

      // Heliotropism: grow vine towards cursor
      let targetAngle = vine.angle;
      if (this.mouse.active && this.mouse.x !== null) {
        const dx = this.mouse.x - lastPt.x;
        const dy = this.mouse.y - lastPt.y;
        targetAngle = Math.atan2(dy, dx);
      }

      // Smoothly steer angle towards target
      let diff = targetAngle - vine.angle;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      
      vine.angle += diff * 0.08 + (Math.random() - 0.5) * 0.22; // include branch sway noise
      
      // Calculate next growth step coordinate
      const nextPt = {
        x: lastPt.x + Math.cos(vine.angle) * vine.speed,
        y: lastPt.y + Math.sin(vine.angle) * vine.speed
      };

      // Boundary limits: deactivate if offscreen
      if (nextPt.x < -20 || nextPt.x > this.width + 20 || nextPt.y < -20 || nextPt.y > this.height + 20) {
        vine.active = false;
        return;
      }

      vine.points.push(nextPt);
      if (vine.points.length > 300) {
        vine.points.shift();
      }

      // Sprout leaf buds at intervals
      if (vine.points.length % 15 === 0) {
        const leftSide = Math.random() < 0.5;
        const leafAngle = vine.angle + (leftSide ? -Math.PI * 0.5 : Math.PI * 0.5) + (Math.random() - 0.5) * 0.3;
        vine.leaves.push({
          x: nextPt.x,
          y: nextPt.y,
          angle: leafAngle,
          size: 0,
          maxSize: 6 + Math.random() * 8
        });

        // Trigger warm acoustic guitar pluck sound on sprout
        this.playGuitarSound(nextPt.y);
      }

      // Dynamic branching solver
      vine.lastBranch++;
      if (vine.lastBranch > 120 && Math.random() < 0.015 && this.vines.length < this.maxVines) {
        vine.lastBranch = 0;
        this.spawnVine(nextPt.x, nextPt.y, vine.angle + (Math.random() - 0.5) * 1.5);
      }
    });

    // Draw main vines
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    this.vines.forEach(vine => {
      if (vine.points.length < 2) return;
      
      ctx.beginPath();
      ctx.moveTo(vine.points[0].x, vine.points[0].y);
      for (let i = 1; i < vine.points.length; i++) {
        ctx.lineTo(vine.points[i].x, vine.points[i].y);
      }
      ctx.strokeStyle = `hsla(${vine.hue}, 40%, 35%, 0.4)`;
      ctx.lineWidth = vine.thickness;
      ctx.stroke();

      // Render vine leaves
      vine.leaves.forEach(leaf => {
        if (leaf.size < leaf.maxSize) {
          leaf.size += 0.25; // grow leaf
        }

        ctx.save();
        ctx.translate(leaf.x, leaf.y);
        ctx.rotate(leaf.angle);

        // Render leaf coordinates
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(leaf.size * 0.8, -leaf.size * 0.5, leaf.size * 1.2, 0);
        ctx.quadraticCurveTo(leaf.size * 0.8, leaf.size * 0.5, 0, 0);
        ctx.closePath();
        
        ctx.fillStyle = `hsla(${vine.hue}, 52%, 58%, 0.65)`;
        ctx.fill();
        ctx.strokeStyle = `hsla(${vine.hue + 10}, 60%, 42%, 0.8)`;
        ctx.lineWidth = 0.8;
        ctx.stroke();

        ctx.restore();
      });
    });

    // Recycle inactive/extinct branches periodically
    if (this.vines.filter(v => v.active).length === 0) {
      this.setup();
    }
  }

  destroy() {
    super.destroy();
    this.vines = [];
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

  playGuitarSound(y) {
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

      // Low pentatonic scales to synthesize deep acoustic strings
      const pentatonic = [146.83, 164.81, 196.00, 220.00, 293.66, 329.63, 392.00, 440.00, 587.33, 659.25];
      const scalePct = 1 - Math.max(0, Math.min(1, y / this.height));
      const noteIdx = Math.floor(scalePct * (pentatonic.length - 1));
      const freq = pentatonic[noteIdx];

      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(freq, ctx.currentTime);
      
      // detuned secondary oscillator for nylon warmth
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2.01, ctx.currentTime);

      const lofiVolSetting = localStorage.getItem('aetherflow_lofi_vol');
      const masterVolumeMultiplier = lofiVolSetting !== null ? parseFloat(lofiVolSetting) : 0.5;
      const vol = 0.12 * masterVolumeMultiplier;

      // Acoustic guitar decay envelope
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.008);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.6);

      // Resonant Lowpass string filter
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.55);
      filter.Q.setValueAtTime(3.0, ctx.currentTime);

      osc1.start(ctx.currentTime);
      osc2.start(ctx.currentTime);
      
      osc1.stop(ctx.currentTime + 1.85);
      osc2.stop(ctx.currentTime + 1.85);
    } catch (err) {
      console.warn('Acoustic guitar synthesis failed: ', err);
    }
  }

  static get title() {
    return 'Chiming Vines Ivy';
  }

  static get description() {
    return 'Generative ivy vines climbing heliotropically towards your mouse coordinate space. Fresh leaf buds sprout along the vines to synthesize warm pentatonic acoustic-guitar notes.';
  }

  static get vibe() {
    return 'Organic';
  }

  static get sourceCode() {
    return `class ChimingVinesIvy {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.vines = [];
    this.mouse = { x: null, y: null, active: false };
    this.maxVines = 12;
    
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
    this.vines = [];
    const startCount = 3;
    for (let i = 0; i < startCount; i++) {
      this.spawnVine(
        (this.width / (startCount + 1)) * (i + 1),
        this.height + 10,
        -Math.PI * 0.5
      );
    }
  }

  spawnVine(x, y, angle) {
    if (this.vines.length >= this.maxVines) return;
    this.vines.push({
      points: [{ x, y }],
      angle: angle,
      speed: 1.8 + Math.random() * 1.2,
      thickness: 3.5 + Math.random() * 2.0,
      leaves: [],
      hue: 95 + Math.random() * 35,
      active: true,
      lastBranch: 0
    });
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
    this.ctx.fillStyle = 'rgba(7, 10, 9, 0.08)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.vines.forEach(vine => {
      if (!vine.active) return;

      const lastPt = vine.points[vine.points.length - 1];
      let targetAngle = vine.angle;
      if (this.mouse.active && this.mouse.x !== null) {
        const dx = this.mouse.x - lastPt.x;
        const dy = this.mouse.y - lastPt.y;
        targetAngle = Math.atan2(dy, dx);
      }

      let diff = targetAngle - vine.angle;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      
      vine.angle += diff * 0.08 + (Math.random() - 0.5) * 0.22;
      
      const nextPt = {
        x: lastPt.x + Math.cos(vine.angle) * vine.speed,
        y: lastPt.y + Math.sin(vine.angle) * vine.speed
      };

      if (nextPt.x < -20 || nextPt.x > this.width + 20 || nextPt.y < -20 || nextPt.y > this.height + 20) {
        vine.active = false;
        return;
      }

      vine.points.push(nextPt);
      if (vine.points.length > 300) vine.points.shift();

      if (vine.points.length % 15 === 0) {
        const leftSide = Math.random() < 0.5;
        const leafAngle = vine.angle + (leftSide ? -Math.PI * 0.5 : Math.PI * 0.5) + (Math.random() - 0.5) * 0.3;
        vine.leaves.push({
          x: nextPt.x,
          y: nextPt.y,
          angle: leafAngle,
          size: 0,
          maxSize: 6 + Math.random() * 8
        });

        this.playGuitarSound(nextPt.y);
      }

      vine.lastBranch++;
      if (vine.lastBranch > 120 && Math.random() < 0.015 && this.vines.length < this.maxVines) {
        vine.lastBranch = 0;
        this.spawnVine(nextPt.x, nextPt.y, vine.angle + (Math.random() - 0.5) * 1.5);
      }
    });

    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    this.vines.forEach(vine => {
      if (vine.points.length < 2) return;
      
      this.ctx.beginPath();
      this.ctx.moveTo(vine.points[0].x, vine.points[0].y);
      for (let i = 1; i < vine.points.length; i++) {
        this.ctx.lineTo(vine.points[i].x, vine.points[i].y);
      }
      this.ctx.strokeStyle = \`hsla(\${vine.hue}, 40%, 35%, 0.4)\`;
      this.ctx.lineWidth = vine.thickness;
      this.ctx.stroke();

      vine.leaves.forEach(leaf => {
        if (leaf.size < leaf.maxSize) leaf.size += 0.25;

        this.ctx.save();
        this.ctx.translate(leaf.x, leaf.y);
        this.ctx.rotate(leaf.angle);

        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.quadraticCurveTo(leaf.size * 0.8, -leaf.size * 0.5, leaf.size * 1.2, 0);
        this.ctx.quadraticCurveTo(leaf.size * 0.8, leaf.size * 0.5, 0, 0);
        this.ctx.closePath();
        
        this.ctx.fillStyle = \`hsla(\${vine.hue}, 52%, 58%, 0.65)\`;
        this.ctx.fill();
        this.ctx.strokeStyle = \`hsla(\${vine.hue + 10}, 60%, 42%, 0.8)\`;
        this.ctx.lineWidth = 0.8;
        this.ctx.stroke();

        this.ctx.restore();
      });
    });

    if (this.vines.filter(v => v.active).length === 0) {
      this.setup();
    }

    requestAnimationFrame((t) => this.animate(t));
  }

  playGuitarSound(y) {
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

      const pentatonic = [146.83, 164.81, 196.00, 220.00, 293.66, 329.63, 392.00, 440.00, 587.33, 659.25];
      const scalePct = 1 - Math.max(0, Math.min(1, y / this.height));
      const noteIdx = Math.floor(scalePct * (pentatonic.length - 1));
      const freq = pentatonic[noteIdx];

      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(freq, ctx.currentTime);
      
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2.01, ctx.currentTime);

      const lofiVolSetting = localStorage.getItem('aetherflow_lofi_vol');
      const masterVolumeMultiplier = lofiVolSetting !== null ? parseFloat(lofiVolSetting) : 0.5;
      const vol = 0.12 * masterVolumeMultiplier;

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.008);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.6);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.55);
      filter.Q.setValueAtTime(3.0, ctx.currentTime);

      osc1.start(ctx.currentTime);
      osc2.start(ctx.currentTime);
      
      osc1.stop(ctx.currentTime + 1.85);
      osc2.stop(ctx.currentTime + 1.85);
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
