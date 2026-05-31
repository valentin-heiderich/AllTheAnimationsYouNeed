import BaseAnimation from './BaseAnimation.js';

export default class BloomingLSystemForest extends BaseAnimation {
  constructor() {
    super();
    this.trees = [];
    this.petals = [];
    this.mouse = { x: null, y: null, active: false, radius: 120 };
    this.bg = '#07090b'; // Deep twilight mossy background
    this.maxTrees = 6;
  }

  setup() {
    this.trees = [];
    this.petals = [];
    
    // Spawn 5 organic trees across the width
    const forestCount = 5;
    for (let i = 0; i < forestCount; i++) {
      const x = (this.width / (forestCount + 1)) * (i + 1) + (Math.random() - 0.5) * 40;
      this.trees.push(this.createTree(x));
    }
  }

  createTree(x) {
    return {
      x,
      y: this.height,
      height: 60 + Math.random() * 40,
      growth: 0.1, // gradual growth
      maxGrowth: 1.0,
      swayOffset: Math.random() * Math.PI * 2,
      buds: [],
      branches: [] // caches computed points for drawing
    };
  }

  resize(width, height) {
    super.resize(width, height);
    this.setup();
  }

  draw(ctx, time) {
    // Elegant deep forest shading
    ctx.fillStyle = 'rgba(7, 9, 11, 0.1)';
    ctx.fillRect(0, 0, this.width, this.height);

    // Update and draw trees
    this.trees.forEach(tree => {
      if (tree.growth < tree.maxGrowth) {
        tree.growth += 0.002;
      }
      
      const windSway = Math.sin(time * 0.0012 + tree.swayOffset) * 0.04;
      ctx.strokeStyle = 'rgba(110, 140, 120, 0.28)';
      ctx.lineCap = 'round';
      
      // Compute and draw branches recursively
      ctx.beginPath();
      this.drawBranch(ctx, tree.x, tree.y, tree.height * tree.growth, -Math.PI * 0.5, 4, 0, windSway, tree);
      ctx.stroke();
    });

    // Update and draw falling pink petals
    for (let i = this.petals.length - 1; i >= 0; i--) {
      const p = this.petals[i];
      p.y += p.vy;
      p.x += Math.sin(time * 0.003 + p.xOffset) * 0.5 + p.vx;
      p.angle += p.rotSpeed;

      // Floor collision check
      if (p.y >= this.height - 8) {
        this.playFloorSound(p.x);
        this.petals.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = 'rgba(255, 185, 200, 0.7)';
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size, p.size * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  drawBranch(ctx, x, y, len, angle, depth, gen, windSway, tree) {
    if (len < 6 || depth === 0) return;

    // Adjust length and angle
    const targetAngle = angle + windSway * (gen + 1);
    const endX = x + Math.cos(targetAngle) * len;
    const endY = y + Math.sin(targetAngle) * len;

    ctx.moveTo(x, y);
    ctx.lineTo(endX, endY);

    if (depth > 1) {
      // Branch bifurcations
      const rightAngle = targetAngle + 0.35 + Math.random() * 0.15;
      const leftAngle = targetAngle - 0.35 - Math.random() * 0.15;
      const newLen = len * 0.72;

      // Occasional piano chime pluck at bifurcations during growth stage
      if (Math.random() < 0.0006 && tree.growth < 0.98) {
        this.playPianoSound(endY);
      }

      this.drawBranch(ctx, endX, endY, newLen, rightAngle, depth - 1, gen + 1, windSway, tree);
      this.drawBranch(ctx, endX, endY, newLen, leftAngle, depth - 1, gen + 1, windSway, tree);
    } else {
      // Draw delicate pink flower bud at leaf tip
      ctx.fillStyle = 'rgba(255, 175, 195, 0.75)';
      ctx.beginPath();
      ctx.arc(endX, endY, 3, 0, Math.PI * 2);
      ctx.fill();

      // Mouse proximity: shed blooming leaf petals
      if (this.mouse.active && this.mouse.x !== null) {
        const dx = endX - this.mouse.x;
        const dy = endY - this.mouse.y;
        if (Math.hypot(dx, dy) < this.mouse.radius && Math.random() < 0.015 && this.petals.length < 50) {
          this.petals.push({
            x: endX,
            y: endY,
            vx: (Math.random() - 0.5) * 0.6,
            vy: 0.8 + Math.random() * 1.0,
            size: 3 + Math.random() * 2,
            rotSpeed: (Math.random() - 0.5) * 0.05,
            angle: Math.random() * Math.PI,
            xOffset: Math.random() * 100
          });
        }
      }
    }
  }

  destroy() {
    super.destroy();
    this.trees = [];
    this.petals = [];
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

  playPianoSound(y) {
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

      // Warm organic major keys for felt piano feel
      const scale = [196.00, 220.00, 261.63, 293.66, 329.63, 392.00, 440.00, 523.25];
      const scalePct = 1 - Math.max(0, Math.min(1, y / this.height));
      const freq = scale[Math.floor(scalePct * (scale.length - 1))];

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      const lofiVolSetting = localStorage.getItem('aetherflow_lofi_vol');
      const masterVolumeMultiplier = lofiVolSetting !== null ? parseFloat(lofiVolSetting) : 0.5;
      const vol = 0.08 * masterVolumeMultiplier;

      // Soft dynamic felt attack
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.012);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);

      // Soft damping filter
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(350, ctx.currentTime + 0.45);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 1.3);
    } catch (e) {}
  }

  playFloorSound(x) {
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

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Soft flute keys for petal landings
      const scale = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50];
      const scalePct = Math.max(0, Math.min(1, x / this.width));
      const freq = scale[Math.floor(scalePct * (scale.length - 1))];

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      const lofiVolSetting = localStorage.getItem('aetherflow_lofi_vol');
      const masterVolumeMultiplier = lofiVolSetting !== null ? parseFloat(lofiVolSetting) : 0.5;
      const vol = 0.05 * masterVolumeMultiplier;

      // Airy woodwind dynamic envelope
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.06);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.85);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.9);
    } catch (e) {}
  }

  static get title() {
    return 'Blooming L-System Forest';
  }

  static get description() {
    return 'Generative organic fractal trees climbing and swaying slowly in local breeze fields. Sprouted pink petals shed when excited by mouse movements, synthesizing felt piano plucks and soft woodwind land tones.';
  }

  static get vibe() {
    return 'Organic';
  }

  static get sourceCode() {
    return `class BloomingLSystemForest {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.trees = [];
    this.petals = [];
    this.mouse = { x: null, y: null, active: false, radius: 120 };
    this.maxTrees = 6;
    
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
    this.trees = [];
    this.petals = [];
    const forestCount = 5;
    for (let i = 0; i < forestCount; i++) {
      const x = (this.width / (forestCount + 1)) * (i + 1) + (Math.random() - 0.5) * 40;
      this.trees.push(this.createTree(x));
    }
  }

  createTree(x) {
    return {
      x,
      y: this.height,
      height: 60 + Math.random() * 40,
      growth: 0.1,
      maxGrowth: 1.0,
      swayOffset: Math.random() * Math.PI * 2,
      buds: [],
      branches: []
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
    this.ctx.fillStyle = 'rgba(7, 9, 11, 0.1)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.trees.forEach(tree => {
      if (tree.growth < tree.maxGrowth) tree.growth += 0.002;
      
      const windSway = Math.sin(time * 0.0012 + tree.swayOffset) * 0.04;
      this.ctx.strokeStyle = 'rgba(110, 140, 120, 0.28)';
      this.ctx.lineCap = 'round';
      
      this.ctx.beginPath();
      this.drawBranch(this.ctx, tree.x, tree.y, tree.height * tree.growth, -Math.PI * 0.5, 4, 0, windSway, tree);
      this.ctx.stroke();
    });

    for (let i = this.petals.length - 1; i >= 0; i--) {
      const p = this.petals[i];
      p.y += p.vy;
      p.x += Math.sin(time * 0.003 + p.xOffset) * 0.5 + p.vx;
      p.angle += p.rotSpeed;

      if (p.y >= this.height - 8) {
        this.playFloorSound(p.x);
        this.petals.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.angle);
      this.ctx.fillStyle = 'rgba(255, 185, 200, 0.7)';
      this.ctx.beginPath();
      this.ctx.ellipse(0, 0, p.size, p.size * 0.5, 0, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    requestAnimationFrame((t) => this.animate(t));
  }

  drawBranch(ctx, x, y, len, angle, depth, gen, windSway, tree) {
    if (len < 6 || depth === 0) return;

    const targetAngle = angle + windSway * (gen + 1);
    const endX = x + Math.cos(targetAngle) * len;
    const endY = y + Math.sin(targetAngle) * len;

    ctx.moveTo(x, y);
    ctx.lineTo(endX, endY);

    if (depth > 1) {
      const rightAngle = targetAngle + 0.35 + Math.random() * 0.15;
      const leftAngle = targetAngle - 0.35 - Math.random() * 0.15;
      const newLen = len * 0.72;

      if (Math.random() < 0.0006 && tree.growth < 0.98) {
        this.playPianoSound(endY);
      }

      this.drawBranch(ctx, endX, endY, newLen, rightAngle, depth - 1, gen + 1, windSway, tree);
      this.drawBranch(ctx, endX, endY, newLen, leftAngle, depth - 1, gen + 1, windSway, tree);
    } else {
      ctx.fillStyle = 'rgba(255, 175, 195, 0.75)';
      ctx.beginPath();
      ctx.arc(endX, endY, 3, 0, Math.PI * 2);
      ctx.fill();

      if (this.mouse.active && this.mouse.x !== null) {
        const dx = endX - this.mouse.x;
        const dy = endY - this.mouse.y;
        if (Math.hypot(dx, dy) < this.mouse.radius && Math.random() < 0.015 && this.petals.length < 50) {
          this.petals.push({
            x: endX,
            y: endY,
            vx: (Math.random() - 0.5) * 0.6,
            vy: 0.8 + Math.random() * 1.0,
            size: 3 + Math.random() * 2,
            rotSpeed: (Math.random() - 0.5) * 0.05,
            angle: Math.random() * Math.PI,
            xOffset: Math.random() * 100
          });
        }
      }
    }
  }

  playPianoSound(y) {
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

      const scale = [196.00, 220.00, 261.63, 293.66, 329.63, 392.00, 440.00, 523.25];
      const scalePct = 1 - Math.max(0, Math.min(1, y / this.height));
      const freq = scale[Math.floor(scalePct * (scale.length - 1))];

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      const lofiVolSetting = localStorage.getItem('aetherflow_lofi_vol');
      const masterVolumeMultiplier = lofiVolSetting !== null ? parseFloat(lofiVolSetting) : 0.5;
      const vol = 0.08 * masterVolumeMultiplier;

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.012);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(350, ctx.currentTime + 0.45);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 1.3);
    } catch (e) {}
  }

  playFloorSound(x) {
    if (this.canvas && this.canvas.getAttribute('data-audio-muted') === 'true') return;
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
      
      const ctx = this.audioCtx;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      const scale = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50];
      const scalePct = Math.max(0, Math.min(1, x / this.width));
      const freq = scale[Math.floor(scalePct * (scale.length - 1))];

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      const lofiVolSetting = localStorage.getItem('aetherflow_lofi_vol');
      const masterVolumeMultiplier = lofiVolSetting !== null ? parseFloat(lofiVolSetting) : 0.5;
      const vol = 0.05 * masterVolumeMultiplier;

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.06);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.85);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.9);
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
