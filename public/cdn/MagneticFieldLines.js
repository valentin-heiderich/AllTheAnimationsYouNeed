import BaseAnimation from './BaseAnimation.js';

export default class MagneticFieldLines extends BaseAnimation {
  constructor() {
    super();
    this.mouse = { x: null, y: null, active: false, charge: 2.2 };
    this.poles = [];
    this.lineCount = 28; // Number of field lines traced from each source
    this.maxSteps = 120; // Number of integration steps per field line
    this.stepSize = 10;  // Length of each step along the field
    this.flowParticles = [];
    this.colors = {
      positive: '#00F0FF', // Neon Cyan
      negative: '#BD00FF', // Neon Purple
      mouse: '#00FF66'     // Neon Lime green (interactive highlight)
    };
  }

  setup() {
    // Initialize two virtual magnetic poles
    this.poles = [
      { x: this.width * 0.3, y: this.height * 0.5, charge: 1.5, type: 'positive' },
      { x: this.width * 0.7, y: this.height * 0.5, charge: -1.5, type: 'negative' }
    ];

    // Seed flow particles that travel along magnetic field lines
    this.flowParticles = [];
    const particleCount = 40;
    for (let i = 0; i < particleCount; i++) {
      this.flowParticles.push({
        poleIndex: Math.floor(Math.random() * 2), // start near a pole
        progress: Math.random(), // 0 to 1 along the line
        angleOffset: Math.random() * Math.PI * 2,
        speed: 0.003 + Math.random() * 0.005,
        size: Math.random() * 2 + 1
      });
    }
  }

  resize(width, height) {
    super.resize(width, height);
    
    // Reposition poles relative to new dimensions
    if (this.poles.length >= 2) {
      this.poles[0].x = width * 0.3;
      this.poles[0].y = height * 0.5;
      this.poles[1].x = width * 0.7;
      this.poles[1].y = height * 0.5;
    }
  }

  // Calculate the magnetic field vector at point (x, y)
  getFieldVector(x, y) {
    let fx = 0;
    let fy = 0;

    // Sum influence from static poles
    this.poles.forEach(p => {
      const dx = x - p.x;
      const dy = y - p.y;
      const distSq = dx * dx + dy * dy + 100; // damping factor to avoid division by zero
      const dist = Math.sqrt(distSq);
      
      // Force falls off with distance square (inverse square law)
      const force = p.charge / (distSq * dist);
      fx += dx * force;
      fy += dy * force;
    });

    // Sum influence from cursor pole
    if (this.mouse.active && this.mouse.x !== null) {
      const dx = x - this.mouse.x;
      const dy = y - this.mouse.y;
      const distSq = dx * dx + dy * dy + 100;
      const dist = Math.sqrt(distSq);
      
      // Cursor pole is negative/pulling force to bend lines towards it
      const force = -this.mouse.charge / (distSq * dist);
      fx += dx * force;
      fy += dy * force;
    }

    return { x: fx, y: fy };
  }

  draw(ctx, time) {
    // Sleek deep space backfill
    ctx.fillStyle = '#06050b';
    ctx.fillRect(0, 0, this.width, this.height);

    const timeSec = time * 0.001;

    // 1. Dynamic poles movement: make them orbit/bob gently over time
    const orbitRadius = Math.min(this.width, this.height) * 0.12;
    this.poles[0].x = this.width * 0.5 + Math.cos(timeSec * 0.4) * orbitRadius * 1.5;
    this.poles[0].y = this.height * 0.5 + Math.sin(timeSec * 0.6) * orbitRadius;

    this.poles[1].x = this.width * 0.5 - Math.cos(timeSec * 0.4) * orbitRadius * 1.5;
    this.poles[1].y = this.height * 0.5 - Math.sin(timeSec * 0.6) * orbitRadius;

    // 2. Draw Magnetic Field Lines
    // Trace paths starting from the positive pole in a circle
    const pSource = this.poles[0]; // Tracing starts at positive pole
    const pSink = this.poles[1];
    
    ctx.lineWidth = 1.0;
    
    for (let i = 0; i < this.lineCount; i++) {
      const angle = (i / this.lineCount) * Math.PI * 2 + timeSec * 0.05;
      
      // Start tracing slightly offset from the pole center
      let px = pSource.x + Math.cos(angle) * 12;
      let py = pSource.y + Math.sin(angle) * 12;
      
      ctx.beginPath();
      ctx.moveTo(px, py);

      let reachedSink = false;
      const points = [{ x: px, y: py }];

      for (let step = 0; step < this.maxSteps; step++) {
        const field = this.getFieldVector(px, py);
        const magnitude = Math.hypot(field.x, field.y);

        if (magnitude < 0.00001) break;

        // Normalize & step
        px += (field.x / magnitude) * this.stepSize;
        py += (field.y / magnitude) * this.stepSize;

        points.push({ x: px, y: py });
        ctx.lineTo(px, py);

        // Check if we've reached near the negative pole
        const distToSink = Math.hypot(px - pSink.x, py - pSink.y);
        if (distToSink < 15) {
          reachedSink = true;
          break;
        }

        // Offscreen boundary break
        if (px < -100 || px > this.width + 100 || py < -100 || py > this.height + 100) {
          break;
        }
      }

      // Draw gradient line
      // Gradient from positive pole color (neon cyan) to negative pole color (neon purple)
      const grad = ctx.createLinearGradient(pSource.x, pSource.y, pSink.x, pSink.y);
      grad.addColorStop(0, this.colors.positive);
      if (this.mouse.active) {
        grad.addColorStop(0.5, this.colors.mouse);
      }
      grad.addColorStop(1, this.colors.negative);

      ctx.strokeStyle = grad;
      // Lines near the mouse are drawn brighter and thicker
      let lineAlpha = 0.12;
      if (this.mouse.active && this.mouse.x !== null) {
        // Find closest point to mouse
        let minDist = Infinity;
        points.forEach(pt => {
          const d = Math.hypot(pt.x - this.mouse.x, pt.y - this.mouse.y);
          if (d < minDist) minDist = d;
        });
        if (minDist < 150) {
          const factor = (150 - minDist) / 150;
          lineAlpha += factor * 0.18;
          ctx.lineWidth = 1.0 + factor * 1.5;
        } else {
          ctx.lineWidth = 1.0;
        }
      } else {
        ctx.lineWidth = 1.0;
      }

      ctx.globalAlpha = lineAlpha;
      ctx.stroke();
    }

    // 3. Draw flowing energy particles on top of lines
    this.flowParticles.forEach(fp => {
      fp.progress += fp.speed;
      if (fp.progress > 1.0) {
        fp.progress = 0;
        fp.angleOffset = Math.random() * Math.PI * 2;
      }

      // Trace a single path dynamically to get the particle coordinate
      const angle = fp.angleOffset;
      let px = pSource.x + Math.cos(angle) * 12;
      let py = pSource.y + Math.sin(angle) * 12;
      const targetStep = Math.floor(fp.progress * this.maxSteps);

      for (let step = 0; step < targetStep; step++) {
        const field = this.getFieldVector(px, py);
        const magnitude = Math.hypot(field.x, field.y);
        if (magnitude < 0.00001) break;
        px += (field.x / magnitude) * this.stepSize;
        py += (field.y / magnitude) * this.stepSize;

        const distToSink = Math.hypot(px - pSink.x, py - pSink.y);
        if (distToSink < 15) break;
      }

      // Draw glowing particle core
      ctx.beginPath();
      ctx.arc(px, py, fp.size * 3.5, 0, Math.PI * 2);
      ctx.fillStyle = this.colors.positive;
      ctx.globalAlpha = 0.15;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(px, py, fp.size, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.globalAlpha = 0.85;
      ctx.fill();
    });

    // 4. Draw Glowing Pole Cores
    this.poles.forEach(p => {
      const pulseSize = 1 + Math.sin(timeSec * 3 + (p.type === 'positive' ? 0 : Math.PI)) * 0.15;
      const radius = 10 * pulseSize;
      
      // Outer glow
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius * 4.5, 0, Math.PI * 2);
      ctx.fillStyle = p.type === 'positive' ? this.colors.positive : this.colors.negative;
      ctx.globalAlpha = 0.25;
      ctx.fill();

      // Core
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = p.type === 'positive' ? this.colors.positive : this.colors.negative;
      ctx.globalAlpha = 0.7;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(p.x, p.y, radius * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.globalAlpha = 0.95;
      ctx.fill();
    });

    // 5. Draw Mouse Pole (Interactive magnetic node)
    if (this.mouse.active && this.mouse.x !== null) {
      const pulse = 1 + Math.sin(timeSec * 5) * 0.1;
      const r = 8 * pulse;

      // Glow halo
      ctx.beginPath();
      ctx.arc(this.mouse.x, this.mouse.y, r * 5, 0, Math.PI * 2);
      ctx.fillStyle = this.colors.mouse;
      ctx.globalAlpha = 0.3;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(this.mouse.x, this.mouse.y, r, 0, Math.PI * 2);
      ctx.fillStyle = this.colors.mouse;
      ctx.globalAlpha = 0.8;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(this.mouse.x, this.mouse.y, r * 0.45, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.globalAlpha = 0.95;
      ctx.fill();
    }

    ctx.globalAlpha = 1.0;
  }

  destroy() {
    this.poles = [];
    this.flowParticles = [];
    super.destroy();
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
    return 'Magnetic Field Lines';
  }

  static get description() {
    return 'A simulation of physical magnetic field equations mapping curves between revolving positive and negative poles. Hover your cursor over the canvas to introduce a third bending pole that pulls and warps the field lines dynamically.';
  }

  static get vibe() {
    return 'Interactive';
  }

  static get sourceCode() {
    return `class MagneticFieldLines {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.mouse = { x: null, y: null, active: false, charge: 2.2 };
    this.poles = [];
    this.lineCount = 28;
    this.maxSteps = 120;
    this.stepSize = 10;
    this.flowParticles = [];
    this.colors = {
      positive: '#00F0FF',
      negative: '#BD00FF',
      mouse: '#00FF66'
    };

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
    this.poles = [
      { x: this.width * 0.3, y: this.height * 0.5, charge: 1.5, type: 'positive' },
      { x: this.width * 0.7, y: this.height * 0.5, charge: -1.5, type: 'negative' }
    ];

    this.flowParticles = [];
    for (let i = 0; i < 40; i++) {
      this.flowParticles.push({
        poleIndex: 0,
        progress: Math.random(),
        angleOffset: Math.random() * Math.PI * 2,
        speed: 0.003 + Math.random() * 0.005,
        size: Math.random() * 2 + 1
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
  }

  getFieldVector(x, y) {
    let fx = 0, fy = 0;

    this.poles.forEach(p => {
      const dx = x - p.x;
      const dy = y - p.y;
      const distSq = dx * dx + dy * dy + 100;
      const force = p.charge / (distSq * Math.sqrt(distSq));
      fx += dx * force;
      fy += dy * force;
    });

    if (this.mouse.active && this.mouse.x !== null) {
      const dx = x - this.mouse.x;
      const dy = y - this.mouse.y;
      const distSq = dx * dx + dy * dy + 100;
      const force = -this.mouse.charge / (distSq * Math.sqrt(distSq));
      fx += dx * force;
      fy += dy * force;
    }

    return { x: fx, y: fy };
  }

  animate(time = 0) {
    this.ctx.fillStyle = '#06050b';
    this.ctx.fillRect(0, 0, this.width, this.height);

    const timeSec = time * 0.001;
    const orbitRadius = Math.min(this.width, this.height) * 0.12;
    
    this.poles[0].x = this.width * 0.5 + Math.cos(timeSec * 0.4) * orbitRadius * 1.5;
    this.poles[0].y = this.height * 0.5 + Math.sin(timeSec * 0.6) * orbitRadius;

    this.poles[1].x = this.width * 0.5 - Math.cos(timeSec * 0.4) * orbitRadius * 1.5;
    this.poles[1].y = this.height * 0.5 - Math.sin(timeSec * 0.6) * orbitRadius;

    const pSource = this.poles[0];
    const pSink = this.poles[1];

    this.ctx.lineWidth = 1.0;

    for (let i = 0; i < this.lineCount; i++) {
      const angle = (i / this.lineCount) * Math.PI * 2 + timeSec * 0.05;
      let px = pSource.x + Math.cos(angle) * 12;
      let py = pSource.y + Math.sin(angle) * 12;

      this.ctx.beginPath();
      this.ctx.moveTo(px, py);

      const points = [{ x: px, y: py }];

      for (let step = 0; step < this.maxSteps; step++) {
        const field = this.getFieldVector(px, py);
        const magnitude = Math.hypot(field.x, field.y);

        if (magnitude < 0.00001) break;

        px += (field.x / magnitude) * this.stepSize;
        py += (field.y / magnitude) * this.stepSize;

        points.push({ x: px, y: py });
        this.ctx.lineTo(px, py);

        const distToSink = Math.hypot(px - pSink.x, py - pSink.y);
        if (distToSink < 15) break;

        if (px < -100 || px > this.width + 100 || py < -100 || py > this.height + 100) break;
      }

      const grad = this.ctx.createLinearGradient(pSource.x, pSource.y, pSink.x, pSink.y);
      grad.addColorStop(0, this.colors.positive);
      if (this.mouse.active) grad.addColorStop(0.5, this.colors.mouse);
      grad.addColorStop(1, this.colors.negative);

      this.ctx.strokeStyle = grad;
      let lineAlpha = 0.12;

      if (this.mouse.active && this.mouse.x !== null) {
        let minDist = Infinity;
        points.forEach(pt => {
          const d = Math.hypot(pt.x - this.mouse.x, pt.y - this.mouse.y);
          if (d < minDist) minDist = d;
        });
        if (minDist < 150) {
          const factor = (150 - minDist) / 150;
          lineAlpha += factor * 0.18;
          this.ctx.lineWidth = 1.0 + factor * 1.5;
        } else {
          this.ctx.lineWidth = 1.0;
        }
      } else {
        this.ctx.lineWidth = 1.0;
      }

      this.ctx.globalAlpha = lineAlpha;
      this.ctx.stroke();
    }

    // Energy flow
    this.flowParticles.forEach(fp => {
      fp.progress += fp.speed;
      if (fp.progress > 1.0) {
        fp.progress = 0;
        fp.angleOffset = Math.random() * Math.PI * 2;
      }

      const angle = fp.angleOffset;
      let px = pSource.x + Math.cos(angle) * 12;
      let py = pSource.y + Math.sin(angle) * 12;
      const targetStep = Math.floor(fp.progress * this.maxSteps);

      for (let step = 0; step < targetStep; step++) {
        const field = this.getFieldVector(px, py);
        const magnitude = Math.hypot(field.x, field.y);
        if (magnitude < 0.00001) break;
        px += (field.x / magnitude) * this.stepSize;
        py += (field.y / magnitude) * this.stepSize;

        const distToSink = Math.hypot(px - pSink.x, py - pSink.y);
        if (distToSink < 15) break;
      }

      this.ctx.beginPath();
      this.ctx.arc(px, py, fp.size * 3.5, 0, Math.PI * 2);
      this.ctx.fillStyle = this.colors.positive;
      this.ctx.globalAlpha = 0.15;
      this.ctx.fill();

      this.ctx.beginPath();
      this.ctx.arc(px, py, fp.size, 0, Math.PI * 2);
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.globalAlpha = 0.85;
      this.ctx.fill();
    });

    // Poles
    this.poles.forEach(p => {
      const pulseSize = 1 + Math.sin(timeSec * 3 + (p.type === 'positive' ? 0 : Math.PI)) * 0.15;
      const radius = 10 * pulseSize;
      
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, radius * 4.5, 0, Math.PI * 2);
      this.ctx.fillStyle = p.type === 'positive' ? this.colors.positive : this.colors.negative;
      this.ctx.globalAlpha = 0.25;
      this.ctx.fill();

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      this.ctx.fillStyle = p.type === 'positive' ? this.colors.positive : this.colors.negative;
      this.ctx.globalAlpha = 0.7;
      this.ctx.fill();

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, radius * 0.4, 0, Math.PI * 2);
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.globalAlpha = 0.95;
      this.ctx.fill();
    });

    if (this.mouse.active && this.mouse.x !== null) {
      const r = 8 * (1 + Math.sin(timeSec * 5) * 0.1);

      this.ctx.beginPath();
      this.ctx.arc(this.mouse.x, this.mouse.y, r * 5, 0, Math.PI * 2);
      this.ctx.fillStyle = this.colors.mouse;
      this.ctx.globalAlpha = 0.3;
      this.ctx.fill();

      this.ctx.beginPath();
      this.ctx.arc(this.mouse.x, this.mouse.y, r, 0, Math.PI * 2);
      this.ctx.fillStyle = this.colors.mouse;
      this.ctx.globalAlpha = 0.8;
      this.ctx.fill();

      this.ctx.beginPath();
      this.ctx.arc(this.mouse.x, this.mouse.y, r * 0.45, 0, Math.PI * 2);
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.globalAlpha = 0.95;
      this.ctx.fill();
    }

    this.ctx.globalAlpha = 1.0;
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
