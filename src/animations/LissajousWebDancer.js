import BaseAnimation from './BaseAnimation.js';

export default class LissajousWebDancer extends BaseAnimation {
  constructor() {
    super();
    this.nodes = [];
    this.mouse = { x: null, y: null, active: false, radius: 200 };
    this.maxConnections = 150;
  }

  setup() {
    this.nodes = [];
    // Adjust node count to fit viewport
    const count = Math.min(45, Math.max(15, Math.floor((this.width * this.height) / 25000)));

    for (let i = 0; i < count; i++) {
      this.nodes.push({
        // Amplitude parameters
        ampX: Math.random() * (this.width * 0.4) + 50,
        ampY: Math.random() * (this.height * 0.4) + 50,
        // Harmonic integer frequencies for stable Lissajous orbits
        freqX: (Math.floor(Math.random() * 4) + 1) * 0.0007,
        freqY: (Math.floor(Math.random() * 4) + 1) * 0.0007,
        // Phase offsets
        phaseX: Math.random() * Math.PI * 2,
        phaseY: Math.random() * Math.PI * 2,
        // Drift speeds
        driftSpeedX: (Math.random() - 0.5) * 0.001,
        driftSpeedY: (Math.random() - 0.5) * 0.001,
        // Particle cosmetics
        size: Math.random() * 2 + 1.5,
        baseHue: Math.random() > 0.5 ? 200 : 270 // Blue or Violet
      });
    }
  }

  resize(width, height) {
    super.resize(width, height);
    this.setup();
  }

  draw(ctx, time) {
    // Sleek space backfill
    ctx.fillStyle = '#050611';
    ctx.fillRect(0, 0, this.width, this.height);

    const centerX = this.width / 2;
    const centerY = this.height / 2;

    const computedPositions = [];

    // 1. Compute dynamic Lissajous coordinates
    this.nodes.forEach((node, index) => {
      // Drift phases over time
      node.phaseX += node.driftSpeedX;
      node.phaseY += node.driftSpeedY;

      // Mouse influence on phase and coordinates
      let phaseShift = 0;
      let ampMult = 1.0;

      if (this.mouse.active && this.mouse.x !== null) {
        const distToMouse = Math.hypot(this.mouse.x - centerX, this.mouse.y - centerY);
        // Mouse coordinate modulates phase globally
        phaseShift = (this.mouse.x / this.width) * Math.PI * 0.5;
        ampMult = 0.8 + (this.mouse.y / this.height) * 0.4;
      }

      // Calculate classic Lissajous trajectory
      const rawX = centerX + Math.sin(time * node.freqX + node.phaseX + phaseShift) * node.ampX * ampMult;
      const rawY = centerY + Math.cos(time * node.freqY + node.phaseY) * node.ampY * ampMult;

      // Smooth coordinate clamp
      const x = Math.max(10, Math.min(this.width - 10, rawX));
      const y = Math.max(10, Math.min(this.height - 10, rawY));

      computedPositions.push({ x, y, size: node.size, baseHue: node.baseHue, index });
    });

    // 2. Draw Connections (Bridges)
    for (let i = 0; i < computedPositions.length; i++) {
      const p1 = computedPositions[i];

      // Draw bridges to mouse
      if (this.mouse.active && this.mouse.x !== null) {
        const dx = this.mouse.x - p1.x;
        const dy = this.mouse.y - p1.y;
        const dist = Math.hypot(dx, dy);

        if (dist < this.mouse.radius) {
          const alpha = (1 - dist / this.mouse.radius) * 0.45;
          const hue = (p1.baseHue + time * 0.02) % 360;

          const grad = ctx.createLinearGradient(p1.x, p1.y, this.mouse.x, this.mouse.y);
          grad.addColorStop(0, `hsla(${hue}, 100%, 65%, 0.8)`);
          grad.addColorStop(1, 'rgba(255, 255, 255, 0.4)');

          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(this.mouse.x, this.mouse.y);
          ctx.strokeStyle = grad;
          ctx.lineWidth = (1 - dist / this.mouse.radius) * 1.8;
          ctx.globalAlpha = alpha;
          ctx.stroke();
        }
      }

      // Draw bridges to other points
      for (let j = i + 1; j < computedPositions.length; j++) {
        const p2 = computedPositions[j];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.hypot(dx, dy);

        if (dist < this.maxConnections) {
          const alpha = (1 - dist / this.maxConnections) * 0.22;
          const hue1 = (p1.baseHue + time * 0.01) % 360;
          const hue2 = (p2.baseHue + time * 0.01) % 360;

          const grad = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
          grad.addColorStop(0, `hsla(${hue1}, 100%, 65%, 0.7)`);
          grad.addColorStop(1, `hsla(${hue2}, 100%, 65%, 0.7)`);

          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = grad;
          ctx.lineWidth = (1 - dist / this.maxConnections) * 0.9;
          ctx.globalAlpha = alpha;
          ctx.stroke();
        }
      }
    }

    ctx.globalAlpha = 1.0;

    // 3. Draw Nodes with Glow
    computedPositions.forEach(p => {
      const hue = (p.baseHue + time * 0.02) % 360;
      const pulseSize = p.size * (1 + Math.sin(time * 0.004 + p.index) * 0.35);

      // Aureole glow ring
      ctx.beginPath();
      ctx.arc(p.x, p.y, pulseSize * 4, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${hue}, 100%, 65%, 0.15)`;
      ctx.fill();

      // Core particle
      ctx.beginPath();
      ctx.arc(p.x, p.y, pulseSize, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
    });
  }

  destroy() {
    super.destroy();
    this.nodes = [];
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
    return 'Lissajous Web Dancer';
  }

  static get description() {
    return 'Pulsing mathematical streams executing harmonic orbital trajectories. Move your cursor to alter the orbital phase coordinates and bridge glowing nodes directly to your mouse pointer.';
  }

  static get vibe() {
    return 'Mathematical';
  }

  static get sourceCode() {
    return `class LissajousWebDancer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.nodes = [];
    this.mouse = { x: null, y: null, active: false, radius: 200 };
    this.maxConnections = 150;
    
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
    this.nodes = [];
    const count = Math.min(45, Math.max(15, Math.floor((this.width * this.height) / 25000)));

    for (let i = 0; i < count; i++) {
      this.nodes.push({
        ampX: Math.random() * (this.width * 0.4) + 50,
        ampY: Math.random() * (this.height * 0.4) + 50,
        freqX: (Math.floor(Math.random() * 4) + 1) * 0.0007,
        freqY: (Math.floor(Math.random() * 4) + 1) * 0.0007,
        phaseX: Math.random() * Math.PI * 2,
        phaseY: Math.random() * Math.PI * 2,
        driftSpeedX: (Math.random() - 0.5) * 0.001,
        driftSpeedY: (Math.random() - 0.5) * 0.001,
        size: Math.random() * 2 + 1.5,
        baseHue: Math.random() > 0.5 ? 200 : 270
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
    this.ctx.fillStyle = '#050611';
    this.ctx.fillRect(0, 0, this.width, this.height);

    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const computedPositions = [];

    this.nodes.forEach((node, index) => {
      node.phaseX += node.driftSpeedX;
      node.phaseY += node.driftSpeedY;

      let phaseShift = 0;
      let ampMult = 1.0;

      if (this.mouse.active && this.mouse.x !== null) {
        phaseShift = (this.mouse.x / this.width) * Math.PI * 0.5;
        ampMult = 0.8 + (this.mouse.y / this.height) * 0.4;
      }

      const rawX = centerX + Math.sin(time * node.freqX + node.phaseX + phaseShift) * node.ampX * ampMult;
      const rawY = centerY + Math.cos(time * node.freqY + node.phaseY) * node.ampY * ampMult;

      const x = Math.max(10, Math.min(this.width - 10, rawX));
      const y = Math.max(10, Math.min(this.height - 10, rawY));

      computedPositions.push({ x, y, size: node.size, baseHue: node.baseHue, index });
    });

    for (let i = 0; i < computedPositions.length; i++) {
      const p1 = computedPositions[i];

      if (this.mouse.active && this.mouse.x !== null) {
        const dx = this.mouse.x - p1.x;
        const dy = this.mouse.y - p1.y;
        const dist = Math.hypot(dx, dy);

        if (dist < this.mouse.radius) {
          const alpha = (1 - dist / this.mouse.radius) * 0.45;
          const hue = (p1.baseHue + time * 0.02) % 360;

          const grad = this.ctx.createLinearGradient(p1.x, p1.y, this.mouse.x, this.mouse.y);
          grad.addColorStop(0, \`hsla(\${hue}, 100%, 65%, 0.8)\`);
          grad.addColorStop(1, 'rgba(255, 255, 255, 0.4)');

          this.ctx.beginPath();
          this.ctx.moveTo(p1.x, p1.y);
          this.ctx.lineTo(this.mouse.x, this.mouse.y);
          this.ctx.strokeStyle = grad;
          this.ctx.lineWidth = (1 - dist / this.mouse.radius) * 1.8;
          this.ctx.globalAlpha = alpha;
          this.ctx.stroke();
        }
      }

      for (let j = i + 1; j < computedPositions.length; j++) {
        const p2 = computedPositions[j];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.hypot(dx, dy);

        if (dist < this.maxConnections) {
          const alpha = (1 - dist / this.maxConnections) * 0.22;
          const hue1 = (p1.baseHue + time * 0.01) % 360;
          const hue2 = (p2.baseHue + time * 0.01) % 360;

          const grad = this.ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
          grad.addColorStop(0, \`hsla(\${hue1}, 100%, 65%, 0.7)\`);
          grad.addColorStop(1, \`hsla(\${hue2}, 100%, 65%, 0.7)\`);

          this.ctx.beginPath();
          this.ctx.moveTo(p1.x, p1.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.strokeStyle = grad;
          this.ctx.lineWidth = (1 - dist / this.maxConnections) * 0.9;
          this.ctx.globalAlpha = alpha;
          this.ctx.stroke();
        }
      }
    }

    this.ctx.globalAlpha = 1.0;

    computedPositions.forEach(p => {
      const hue = (p.baseHue + time * 0.02) % 360;
      const pulseSize = p.size * (1 + Math.sin(time * 0.004 + p.index) * 0.35);

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, pulseSize * 4, 0, Math.PI * 2);
      this.ctx.fillStyle = \`hsla(\${hue}, 100%, 65%, 0.15)\`;
      this.ctx.fill();

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, pulseSize, 0, Math.PI * 2);
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.fill();
    });

    requestAnimationFrame((t) => this.animate(t));
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
