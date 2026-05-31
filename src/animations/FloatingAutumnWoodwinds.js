import BaseAnimation from './BaseAnimation.js';

export default class FloatingAutumnWoodwinds extends BaseAnimation {
  constructor() {
    super();
    this.leaves = [];
    this.mouse = { x: null, y: null, active: false, radius: 140 };
    this.bg = '#0e0805'; // Cozy deep forest earthy brown-black
    this.colors = ['#c84626', '#e07f35', '#ebd258', '#b27f2c']; // fiery orange, red, yellow, amber
  }

  setup() {
    this.leaves = [];
    const count = 35 + Math.floor(this.width / 35);
    for (let i = 0; i < count; i++) {
      this.leaves.push(this.createLeaf(true));
    }
  }

  createLeaf(randomY = false) {
    const y = randomY ? Math.random() * this.height : -50;
    return {
      x: Math.random() * this.width,
      y: y,
      vy: 0.8 + Math.random() * 1.0,
      vx: (Math.random() - 0.5) * 0.4,
      scale: 0.45 + Math.random() * 0.45,
      angle: Math.random() * Math.PI * 2,
      spinSpeed: 0.01 + Math.random() * 0.02,
      xOffset: Math.random() * 100,
      color: this.colors[Math.floor(Math.random() * this.colors.length)],
      pitchPhase: Math.random() * Math.PI,
      spinTorque: 0,
      lastWhistle: 0
    };
  }

  resize(width, height) {
    super.resize(width, height);
    this.setup();
  }

  draw(ctx, time) {
    // Rich earthy background shading
    ctx.fillStyle = 'rgba(14, 8, 5, 0.12)';
    ctx.fillRect(0, 0, this.width, this.height);

    for (let i = 0; i < this.leaves.length; i++) {
      const leaf = this.leaves[i];

      // Physical drifting and horizontal sway
      leaf.y += leaf.vy;
      const swayForce = Math.sin(time * 0.0025 + leaf.xOffset) * 0.28;
      leaf.x += leaf.vx + swayForce;
      
      // Decay active torque slowly
      leaf.spinTorque *= 0.95;
      leaf.angle += leaf.spinSpeed + leaf.spinTorque;

      // Mouse drag vortex check
      if (this.mouse.active && this.mouse.x !== null) {
        const dx = leaf.x - this.mouse.x;
        const dy = leaf.y - this.mouse.y;
        const dist = Math.hypot(dx, dy);

        if (dist < this.mouse.radius) {
          const force = (this.mouse.radius - dist) / this.mouse.radius;
          leaf.vx += (dx / (dist || 1)) * force * 0.45;
          leaf.spinTorque += force * 0.35; // excite spin

          // Trigger whistle sounds in quick spins
          leaf.lastWhistle++;
          if (leaf.spinTorque > 0.18 && leaf.lastWhistle > 120) {
            leaf.lastWhistle = 0;
            this.playWhistleSound(leaf.y, leaf.spinTorque);
          }
        }
      }

      // Recycle leaf at bottom
      if (leaf.y > this.height + 40 || leaf.x < -40 || leaf.x > this.width + 40) {
        this.leaves[i] = this.createLeaf(false);
      }

      // Render drifting leaf in 3D perspective
      ctx.save();
      ctx.translate(leaf.x, leaf.y);
      ctx.rotate(leaf.angle);
      
      // 3D perspective scaling transform
      ctx.scale(leaf.scale, leaf.scale * Math.cos(leaf.angle * 1.5));

      ctx.beginPath();
      ctx.moveTo(0, -16);
      ctx.quadraticCurveTo(12, -8, 4, 16);
      ctx.quadraticCurveTo(0, 24, -4, 16);
      ctx.quadraticCurveTo(-12, -8, 0, -16);
      ctx.closePath();

      ctx.fillStyle = leaf.color;
      ctx.fill();

      // Leaf stem
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(0, -16);
      ctx.lineTo(0, 24);
      ctx.stroke();

      ctx.restore();
    }
  }

  destroy() {
    super.destroy();
    this.leaves = [];
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

  playWhistleSound(y, torque) {
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

      // Hollow woodwind/whistle scales
      const pentatonic = [349.23, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00];
      const scalePct = 1 - Math.max(0, Math.min(1, y / this.height));
      const noteIdx = Math.floor(scalePct * (pentatonic.length - 1));
      const baseFreq = pentatonic[noteIdx];

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);

      const lofiVolSetting = localStorage.getItem('aetherflow_lofi_vol');
      const masterVolumeMultiplier = lofiVolSetting !== null ? parseFloat(lofiVolSetting) : 0.5;
      
      // Whistle loudness scales with torque speed
      const vol = Math.min(0.09, torque * 0.22) * masterVolumeMultiplier;

      // Soft swelling woodwind attack
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.15);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.8);

      // Hollow bandpass whistle filter
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(baseFreq * 2.0, ctx.currentTime);
      filter.Q.setValueAtTime(4.0, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, ctx.currentTime + 0.8);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 2.0);
    } catch (e) {}
  }

  static get title() {
    return 'Floating Autumn Woodwinds';
  }

  static get description() {
    return 'Autumn leaves drifting in three-dimensional yaw and pitch space. Creating wind vortexes with your mouse accelerates leaf rotation, synthesizing airy woodwind hollow whistle sounds.';
  }

  static get vibe() {
    return 'Natural';
  }

  static get sourceCode() {
    return `class FloatingAutumnWoodwinds {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.leaves = [];
    this.mouse = { x: null, y: null, active: false, radius: 140 };
    this.colors = ['#c84626', '#e07f35', '#ebd258', '#b27f2c'];
    
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
    this.leaves = [];
    const count = 35 + Math.floor(this.width / 35);
    for (let i = 0; i < count; i++) {
      this.leaves.push(this.createLeaf(true));
    }
  }

  createLeaf(randomY = false) {
    const y = randomY ? Math.random() * this.height : -50;
    return {
      x: Math.random() * this.width,
      y: y,
      vy: 0.8 + Math.random() * 1.0,
      vx: (Math.random() - 0.5) * 0.4,
      scale: 0.45 + Math.random() * 0.45,
      angle: Math.random() * Math.PI * 2,
      spinSpeed: 0.01 + Math.random() * 0.02,
      xOffset: Math.random() * 100,
      color: this.colors[Math.floor(Math.random() * this.colors.length)],
      spinTorque: 0,
      lastWhistle: 0
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
    this.ctx.fillStyle = 'rgba(14, 8, 5, 0.12)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    for (let i = 0; i < this.leaves.length; i++) {
      const leaf = this.leaves[i];
      leaf.y += leaf.vy;
      const swayForce = Math.sin(time * 0.0025 + leaf.xOffset) * 0.28;
      leaf.x += leaf.vx + swayForce;
      
      leaf.spinTorque *= 0.95;
      leaf.angle += leaf.spinSpeed + leaf.spinTorque;

      if (this.mouse.active && this.mouse.x !== null) {
        const dx = leaf.x - this.mouse.x;
        const dy = leaf.y - this.mouse.y;
        const dist = Math.hypot(dx, dy);

        if (dist < this.mouse.radius) {
          const force = (this.mouse.radius - dist) / this.mouse.radius;
          leaf.vx += (dx / (dist || 1)) * force * 0.45;
          leaf.spinTorque += force * 0.35;

          leaf.lastWhistle++;
          if (leaf.spinTorque > 0.18 && leaf.lastWhistle > 120) {
            leaf.lastWhistle = 0;
            this.playWhistleSound(leaf.y, leaf.spinTorque);
          }
        }
      }

      if (leaf.y > this.height + 40 || leaf.x < -40 || leaf.x > this.width + 40) {
        this.leaves[i] = this.createLeaf(false);
      }

      this.ctx.save();
      this.ctx.translate(leaf.x, leaf.y);
      this.ctx.rotate(leaf.angle);
      this.ctx.scale(leaf.scale, leaf.scale * Math.cos(leaf.angle * 1.5));

      this.ctx.beginPath();
      this.ctx.moveTo(0, -16);
      this.ctx.quadraticCurveTo(12, -8, 4, 16);
      this.ctx.quadraticCurveTo(0, 24, -4, 16);
      this.ctx.quadraticCurveTo(-12, -8, 0, -16);
      this.ctx.closePath();

      this.ctx.fillStyle = leaf.color;
      this.ctx.fill();

      this.ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      this.ctx.lineWidth = 1.0;
      this.ctx.beginPath();
      this.ctx.moveTo(0, -16);
      this.ctx.lineTo(0, 24);
      this.ctx.stroke();

      this.ctx.restore();
    }

    requestAnimationFrame((t) => this.animate(t));
  }

  playWhistleSound(y, torque) {
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

      const pentatonic = [349.23, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00];
      const scalePct = 1 - Math.max(0, Math.min(1, y / this.height));
      const noteIdx = Math.floor(scalePct * (pentatonic.length - 1));
      const baseFreq = pentatonic[noteIdx];

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);

      const lofiVolSetting = localStorage.getItem('aetherflow_lofi_vol');
      const masterVolumeMultiplier = lofiVolSetting !== null ? parseFloat(lofiVolSetting) : 0.5;
      const vol = Math.min(0.09, torque * 0.22) * masterVolumeMultiplier;

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.15);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.8);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(baseFreq * 2.0, ctx.currentTime);
      filter.Q.setValueAtTime(4.0, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, ctx.currentTime + 0.8);

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
