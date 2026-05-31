import BaseAnimation from './BaseAnimation.js';

export default class FractalTreeGrowth extends BaseAnimation {
  constructor() {
    super();
    this.mouse = { x: null, y: null, active: false, rx: 0, ry: 0 };
    this.wind = 0;
    this.targetWind = 0;
    this.growth = 0; // Growth animation factor
    this.pollen = []; // Ambient floating particles
  }

  setup() {
    this.pollen = [];
    this.growth = 0;
    this.mouse.rx = this.width / 2;
    this.mouse.ry = this.height / 2;

    // Create pollen particles
    const particleCount = Math.min(80, Math.floor((this.width * this.height) / 12000));
    for (let i = 0; i < particleCount; i++) {
      this.pollen.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: Math.random() * 0.6 - 0.3,
        vy: -Math.random() * 0.8 - 0.2,
        size: Math.random() * 2 + 1,
        color: Math.random() > 0.6 ? 'hsla(45, 95%, 60%, 0.6)' : 'hsla(170, 90%, 50%, 0.5)',
        phase: Math.random() * Math.PI * 2
      });
    }

    this.ctx.fillStyle = '#060a08';
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  resize(width, height) {
    super.resize(width, height);
    this.setup();
  }

  draw(ctx, time) {
    // Elegant organic background clear with slight alpha decay for smooth trails
    ctx.fillStyle = 'rgba(6, 10, 8, 0.12)';
    ctx.fillRect(0, 0, this.width, this.height);

    // Smooth growth transition
    if (this.growth < 1.0) {
      this.growth += 0.008;
      if (this.growth > 1.0) this.growth = 1.0;
    }

    // Determine wind velocity
    const timeScale = time * 0.0012;
    const baseWind = Math.sin(timeScale) * 0.04 + Math.sin(timeScale * 2.3) * 0.02;

    if (this.mouse.active && this.mouse.x !== null) {
      this.mouse.rx = this.mouse.rx * 0.95 + this.mouse.x * 0.05;
      this.mouse.ry = this.mouse.ry * 0.95 + this.mouse.y * 0.05;
      // Mouse position controls target wind direction and strength
      const dx = (this.mouse.rx - this.width / 2) / (this.width / 2);
      this.targetWind = dx * 0.35; // Cap mouse wind factor
    } else {
      this.mouse.rx = this.mouse.rx * 0.98 + (this.width / 2) * 0.02;
      this.mouse.ry = this.mouse.ry * 0.98 + (this.height / 2) * 0.02;
      this.targetWind = 0;
    }

    this.wind = this.wind * 0.95 + (baseWind + this.targetWind) * 0.05;

    // Draw Floating Amber/Teal Pollen in Background
    ctx.shadowBlur = 0;
    this.pollen.forEach(p => {
      p.x += p.vx + this.wind * 5;
      p.y += p.vy + Math.sin(timeScale + p.phase) * 0.3;

      // Wrap around boundaries
      if (p.x < 0) p.x = this.width;
      if (p.x > this.width) p.x = 0;
      if (p.y < 0) {
        p.y = this.height;
        p.x = Math.random() * this.width;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    });

    // Render tree from bottom center
    const startX = this.width / 2;
    const startY = this.height * 0.92;
    const initialLen = Math.min(this.width, this.height) * 0.22 * this.growth;
    const baseAngle = -Math.PI / 2; // Pointing straight up

    // Call recursive branch generation
    this.drawBranch(ctx, startX, startY, initialLen, baseAngle, 9, 20, timeScale);
  }

  drawBranch(ctx, x, y, len, angle, depth, baseWidth, timeScale) {
    if (depth === 0) return;

    // Calculate end point with winding swaying forces
    // Swaying force scales with depth (outer branches sway more)
    const swayFactor = (10 - depth) * 0.015;
    const currentAngle = angle + this.wind * swayFactor * Math.sin(timeScale * 2 + depth);

    const xEnd = x + Math.cos(currentAngle) * len;
    const yEnd = y + Math.sin(currentAngle) * len;

    // Premium Organic color transitions: forest green -> teal -> amber (for leaves/blossoms)
    let color;
    if (depth > 6) {
      // Trunk and thick lower branches: Forest Green/Deep Teal
      const ratio = (depth - 6) / 3;
      color = `hsla(${120 + (1 - ratio) * 40}, 35%, ${20 + (1 - ratio) * 10}%, 0.85)`;
    } else if (depth > 3) {
      // Medium branches: Forest Green/Teal
      const ratio = (depth - 3) / 3;
      color = `hsla(${140 + (1 - ratio) * 35}, 55%, 35%, 0.9)`;
    } else {
      // Soft outer branches and leaves: Luminous Amber/Teal
      const ratio = depth / 3;
      const hue = ratio > 0.5 ? 175 : 42; // Alternating teal/amber accent leaves
      color = `hsla(${hue}, 95%, 62%, ${1.0 - (0.1 * depth)})`;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(xEnd, yEnd);
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1, baseWidth * depth * 0.12 * (this.growth * 0.5 + 0.5));
    ctx.lineCap = 'round';
    ctx.stroke();

    // Spawn nested branches
    const nextLen = len * (0.75 + Math.sin(timeScale * 0.5 + depth) * 0.03);
    const spread = 0.42 + Math.cos(timeScale * 0.8 + depth) * 0.03;

    // Left branch
    this.drawBranch(ctx, xEnd, yEnd, nextLen, currentAngle - spread, depth - 1, baseWidth, timeScale);
    // Right branch
    this.drawBranch(ctx, xEnd, yEnd, nextLen, currentAngle + spread, depth - 1, baseWidth, timeScale);

    // Occasional third central growing branch
    if (depth > 5 && Math.random() > 0.7) {
      this.drawBranch(ctx, xEnd, yEnd, len * 0.55, currentAngle + (Math.random() - 0.5) * 0.15, depth - 1, baseWidth, timeScale);
    }
  }

  destroy() {
    super.destroy();
    this.pollen = [];
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
    return 'Fractal Tree Growth';
  }

  static get description() {
    return 'Elegant organic fractal branching system simulation growing dynamically from the ground. Branches sway in harmonic resonance under organic wind waves. Move your cursor laterally to shift the wind direction and speed, while bright glowing amber and teal pollen particles drift in the breeze.';
  }

  static get vibe() {
    return 'Organic';
  }

  static get sourceCode() {
    return `class FractalTreeGrowth {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.mouse = { x: null, y: null, active: false, rx: 0, ry: 0 };
    this.wind = 0;
    this.targetWind = 0;
    this.growth = 0;
    this.pollen = [];

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
    this.pollen = [];
    this.growth = 0;
    this.mouse.rx = this.width / 2;
    this.mouse.ry = this.height / 2;

    const particleCount = Math.min(80, Math.floor((this.width * this.height) / 12000));
    for (let i = 0; i < particleCount; i++) {
      this.pollen.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: Math.random() * 0.6 - 0.3,
        vy: -Math.random() * 0.8 - 0.2,
        size: Math.random() * 2 + 1,
        color: Math.random() > 0.6 ? 'hsla(45, 95%, 60%, 0.6)' : 'hsla(170, 90%, 50%, 0.5)',
        phase: Math.random() * Math.PI * 2
      });
    }

    this.ctx.fillStyle = '#060a08';
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

  animate(time = 0) {
    this.ctx.fillStyle = 'rgba(6, 10, 8, 0.12)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    if (this.growth < 1.0) {
      this.growth += 0.008;
    }

    const timeScale = time * 0.0012;
    const baseWind = Math.sin(timeScale) * 0.04 + Math.sin(timeScale * 2.3) * 0.02;

    if (this.mouse.active && this.mouse.x !== null) {
      this.mouse.rx = this.mouse.rx * 0.95 + this.mouse.x * 0.05;
      this.mouse.ry = this.mouse.ry * 0.95 + this.mouse.y * 0.05;
      const dx = (this.mouse.rx - this.width / 2) / (this.width / 2);
      this.targetWind = dx * 0.35;
    } else {
      this.mouse.rx = this.mouse.rx * 0.98 + (this.width / 2) * 0.02;
      this.mouse.ry = this.mouse.ry * 0.98 + (this.height / 2) * 0.02;
      this.targetWind = 0;
    }

    this.wind = this.wind * 0.95 + (baseWind + this.targetWind) * 0.05;

    this.pollen.forEach(p => {
      p.x += p.vx + this.wind * 5;
      p.y += p.vy + Math.sin(timeScale + p.phase) * 0.3;

      if (p.x < 0) p.x = this.width;
      if (p.x > this.width) p.x = 0;
      if (p.y < 0) {
        p.y = this.height;
        p.x = Math.random() * this.width;
      }

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color;
      this.ctx.fill();
    });

    const startX = this.width / 2;
    const startY = this.height * 0.92;
    const initialLen = Math.min(this.width, this.height) * 0.22 * this.growth;
    const baseAngle = -Math.PI / 2;

    this.drawBranch(this.ctx, startX, startY, initialLen, baseAngle, 9, 20, timeScale);

    requestAnimationFrame((t) => this.animate(t));
  }

  drawBranch(ctx, x, y, len, angle, depth, baseWidth, timeScale) {
    if (depth === 0) return;

    const swayFactor = (10 - depth) * 0.015;
    const currentAngle = angle + this.wind * swayFactor * Math.sin(timeScale * 2 + depth);

    const xEnd = x + Math.cos(currentAngle) * len;
    const yEnd = y + Math.sin(currentAngle) * len;

    let color;
    if (depth > 6) {
      const ratio = (depth - 6) / 3;
      color = \`hsla(\${120 + (1 - ratio) * 40}, 35%, \${20 + (1 - ratio) * 10}%, 0.85)\`;
    } else if (depth > 3) {
      const ratio = (depth - 3) / 3;
      color = \`hsla(\${140 + (1 - ratio) * 35}, 55%, 35%, 0.9)\`;
    } else {
      const ratio = depth / 3;
      const hue = ratio > 0.5 ? 175 : 42;
      color = \`hsla(\${hue}, 95%, 62%, \${1.0 - (0.1 * depth)})\`;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(xEnd, yEnd);
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1, baseWidth * depth * 0.12 * (this.growth * 0.5 + 0.5));
    ctx.lineCap = 'round';
    ctx.stroke();

    const nextLen = len * (0.75 + Math.sin(timeScale * 0.5 + depth) * 0.03);
    const spread = 0.42 + Math.cos(timeScale * 0.8 + depth) * 0.03;

    this.drawBranch(ctx, xEnd, yEnd, nextLen, currentAngle - spread, depth - 1, baseWidth, timeScale);
    this.drawBranch(ctx, xEnd, yEnd, nextLen, currentAngle + spread, depth - 1, baseWidth, timeScale);

    if (depth > 5 && Math.random() > 0.7) {
      this.drawBranch(ctx, xEnd, yEnd, len * 0.55, currentAngle + (Math.random() - 0.5) * 0.15, depth - 1, baseWidth, timeScale);
    }
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
