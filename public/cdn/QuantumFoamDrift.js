import BaseAnimation from './BaseAnimation.js';

export default class QuantumFoamDrift extends BaseAnimation {
  constructor() {
    super();
    this.particles = [];
    this.mouse = { x: null, y: null, active: false, radius: 180 };
    // Gorgeous glowing blue/violet neon palette
    this.colors = ['#00F0FF', '#7F00FF', '#BD00FF', '#3F00FF', '#0072FF', '#A000FF'];
  }

  setup() {
    this.particles = [];
    // Scale count relative to viewport area
    const densityFactor = 8000;
    const count = Math.min(
      280,
      Math.max(60, Math.floor((this.width * this.height) / densityFactor))
    );

    for (let i = 0; i < count; i++) {
      const baseRadius = Math.random() * 2.2 + 0.6;
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        baseRadius,
        radius: baseRadius,
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        phase: Math.random() * Math.PI * 2,
        phaseSpeed: 0.015 + Math.random() * 0.03,
        driftSpeed: 0.15 + Math.random() * 0.35,
        angleOffset: Math.random() * Math.PI * 2,
        glowFactor: Math.random() * 0.25 + 0.15
      });
    }
  }

  resize(width, height) {
    super.resize(width, height);
    
    // Fit particles inside new dimensions
    this.particles.forEach(p => {
      if (p.x > width) p.x = Math.random() * width;
      if (p.y > height) p.y = Math.random() * height;
    });
  }

  draw(ctx, time) {
    // Sleek deep space backdrop with a hint of dark violet
    ctx.fillStyle = '#04020a';
    ctx.fillRect(0, 0, this.width, this.height);

    // Render quantum foam particles
    this.particles.forEach(p => {
      // 1. Advance flicker/pulse phase
      p.phase += p.phaseSpeed;
      const sizePulse = Math.sin(p.phase);
      const alphaPulse = 0.5 + 0.5 * Math.sin(p.phase * 1.5);

      // 2. Mathematical flow field vector (Planck-scale flow grid)
      const flowAngle = Math.sin(p.x * 0.005 + time * 0.0003) * 
                        Math.cos(p.y * 0.005 - time * 0.00025) * Math.PI * 2.5 + p.angleOffset;

      const vx = Math.cos(flowAngle) * p.driftSpeed;
      const vy = Math.sin(flowAngle) * p.driftSpeed;

      // 3. Mouse Interaction (Singularity attraction and energy excitement)
      let mouseExcitement = 0;
      let targetX = p.x + vx;
      let targetY = p.y + vy;

      if (this.mouse.active && this.mouse.x !== null) {
        const dx = this.mouse.x - p.x;
        const dy = this.mouse.y - p.y;
        const dist = Math.hypot(dx, dy);

        if (dist < this.mouse.radius) {
          const force = (this.mouse.radius - dist) / this.mouse.radius;
          const pullAngle = Math.atan2(dy, dx);
          const orbitAngle = pullAngle + Math.PI / 2; // perpendicular
          
          targetX += Math.cos(pullAngle) * force * 1.6 + Math.cos(orbitAngle) * force * 0.6;
          targetY += Math.sin(pullAngle) * force * 1.6 + Math.sin(orbitAngle) * force * 0.6;
          mouseExcitement = force * 2.5;
        }
      }

      p.x = targetX;
      p.y = targetY;

      // 4. Boundary Wrap-around with margins
      const margin = 20;
      if (p.x < -margin) p.x = this.width + margin;
      if (p.x > this.width + margin) p.x = -margin;
      if (p.y < -margin) p.y = this.height + margin;
      if (p.y > this.height + margin) p.y = -margin;

      // 5. Draw Glowing quantum aura (Outer halo)
      const currentRadius = p.baseRadius * (1.0 + sizePulse * 0.3) + mouseExcitement * 1.2;
      const outerGlowRadius = currentRadius * (3.5 + mouseExcitement * 1.5);

      ctx.beginPath();
      ctx.arc(p.x, p.y, outerGlowRadius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.glowFactor * alphaPulse * (0.35 + mouseExcitement * 0.25);
      ctx.fill();

      // Mid glow ring
      ctx.beginPath();
      ctx.arc(p.x, p.y, currentRadius * 2.0, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = (p.glowFactor + 0.1) * (0.6 + mouseExcitement * 0.15);
      ctx.fill();

      // 6. Draw Solid Quantum Core
      ctx.beginPath();
      ctx.arc(p.x, p.y, currentRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.globalAlpha = 0.9;
      ctx.fill();
    });

    ctx.globalAlpha = 1.0;
  }

  destroy() {
    this.particles = [];
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
    return 'Quantum Foam Drift';
  }

  static get description() {
    return 'Planck-scale glowing spheres bubbling, flickering, and drifting along a mathematical vector flow grid. Cursor creates quantum excitement, drawing particles in with high-energy orbital halos.';
  }

  static get vibe() {
    return 'Quantum';
  }

  static get sourceCode() {
    return `class QuantumFoamDrift {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.mouse = { x: null, y: null, active: false, radius: 180 };
    this.colors = ['#00F0FF', '#7F00FF', '#BD00FF', '#3F00FF', '#0072FF', '#A000FF'];
    
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
    const count = Math.min(280, Math.max(60, Math.floor((this.width * this.height) / 8000)));

    for (let i = 0; i < count; i++) {
      const baseRadius = Math.random() * 2.2 + 0.6;
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        baseRadius,
        radius: baseRadius,
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        phase: Math.random() * Math.PI * 2,
        phaseSpeed: 0.015 + Math.random() * 0.03,
        driftSpeed: 0.15 + Math.random() * 0.35,
        angleOffset: Math.random() * Math.PI * 2,
        glowFactor: Math.random() * 0.25 + 0.15
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

  animate(time = 0) {
    this.ctx.fillStyle = '#04020a';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.particles.forEach(p => {
      p.phase += p.phaseSpeed;
      const sizePulse = Math.sin(p.phase);
      const alphaPulse = 0.5 + 0.5 * Math.sin(p.phase * 1.5);

      const flowAngle = Math.sin(p.x * 0.005 + time * 0.0003) * 
                        Math.cos(p.y * 0.005 - time * 0.00025) * Math.PI * 2.5 + p.angleOffset;

      const vx = Math.cos(flowAngle) * p.driftSpeed;
      const vy = Math.sin(flowAngle) * p.driftSpeed;

      let mouseExcitement = 0;
      let targetX = p.x + vx;
      let targetY = p.y + vy;

      if (this.mouse.active && this.mouse.x !== null) {
        const dx = this.mouse.x - p.x;
        const dy = this.mouse.y - p.y;
        const dist = Math.hypot(dx, dy);

        if (dist < this.mouse.radius) {
          const force = (this.mouse.radius - dist) / this.mouse.radius;
          const pullAngle = Math.atan2(dy, dx);
          const orbitAngle = pullAngle + Math.PI / 2;
          
          targetX += Math.cos(pullAngle) * force * 1.6 + Math.cos(orbitAngle) * force * 0.6;
          targetY += Math.sin(pullAngle) * force * 1.6 + Math.sin(orbitAngle) * force * 0.6;
          mouseExcitement = force * 2.5;
        }
      }

      p.x = targetX;
      p.y = targetY;

      const margin = 20;
      if (p.x < -margin) p.x = this.width + margin;
      if (p.x > this.width + margin) p.x = -margin;
      if (p.y < -margin) p.y = this.height + margin;
      if (p.y > this.height + margin) p.y = -margin;

      const currentRadius = p.baseRadius * (1.0 + sizePulse * 0.3) + mouseExcitement * 1.2;
      
      // Outer Glow
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, currentRadius * (3.5 + mouseExcitement * 1.5), 0, Math.PI * 2);
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.glowFactor * alphaPulse * (0.35 + mouseExcitement * 0.25);
      this.ctx.fill();

      // Mid Glow
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, currentRadius * 2.0, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = (p.glowFactor + 0.1) * (0.6 + mouseExcitement * 0.15);
      this.ctx.fill();

      // Solid Core
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, currentRadius, 0, Math.PI * 2);
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.globalAlpha = 0.9;
      this.ctx.fill();
    });

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
