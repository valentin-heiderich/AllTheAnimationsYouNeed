import BaseAnimation from './BaseAnimation.js';

export default class NeonParticleWeb extends BaseAnimation {
  constructor() {
    super();
    this.particles = [];
    this.mouse = { x: null, y: null, active: false, radius: 180 };
    this.colors = ['#FF007F', '#00F0FF', '#BD00FF', '#00FF66']; // Hot pink, neon cyan, purple, lime
    this.maxConnections = 100;
  }

  setup() {
    this.particles = [];
    // Adjust density based on screen dimensions
    const densityFactor = 12000; 
    const count = Math.min(
      150, 
      Math.max(40, Math.floor((this.width * this.height) / densityFactor))
    );

    for (let i = 0; i < count; i++) {
      const radius = Math.random() * 2 + 1.5;
      const x = Math.random() * this.width;
      const y = Math.random() * this.height;
      const vx = (Math.random() - 0.5) * 0.6;
      const vy = (Math.random() - 0.5) * 0.6;
      const color = this.colors[Math.floor(Math.random() * this.colors.length)];

      this.particles.push({
        x, y, radius, color,
        vx, vy,
        originalVx: vx,
        originalVy: vy,
        glowAlpha: Math.random() * 0.2 + 0.1
      });
    }
  }

  resize(width, height) {
    super.resize(width, height);
    
    // Adjust particles boundary fits
    this.particles.forEach(p => {
      if (p.x > width) p.x = Math.random() * width;
      if (p.y > height) p.y = Math.random() * height;
    });
  }

  draw(ctx, time) {
    // 1. Sleek deep background fill
    ctx.fillStyle = '#080A10';
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Physics & Draw Particles
    this.particles.forEach(p => {
      // Natural Drift
      p.x += p.x + p.vx < 0 || p.x + p.vx > this.width ? p.vx = -p.vx : p.vx;
      p.y += p.y + p.vy < 0 || p.y + p.vy > this.height ? p.vy = -p.vy : p.vy;

      p.x += p.vx;
      p.y += p.vy;

      // Mouse Interaction
      if (this.mouse.active && this.mouse.x !== null) {
        const dx = this.mouse.x - p.x;
        const dy = this.mouse.y - p.y;
        const dist = Math.hypot(dx, dy);

        if (dist < this.mouse.radius) {
          const force = (this.mouse.radius - dist) / this.mouse.radius; // 0 to 1
          
          // Gentle pull toward cursor
          p.vx += (dx / dist) * force * 0.12;
          p.vy += (dy / dist) * force * 0.12;

          // Orbit vector offset (adds beautiful organic circular flow)
          p.vx += (-dy / dist) * force * 0.05;
          p.vy += (dx / dist) * force * 0.05;
        }
      }

      // Return velocity gradually to original drift (Friction/Damping)
      p.vx = p.vx * 0.95 + p.originalVx * 0.05;
      p.vy = p.vy * 0.95 + p.originalVy * 0.05;

      // Cap maximum speeds
      const speed = Math.hypot(p.vx, p.vy);
      const maxSpeed = 2.2;
      if (speed > maxSpeed) {
        p.vx = (p.vx / speed) * maxSpeed;
        p.vy = (p.vy / speed) * maxSpeed;
      }

      // Draw glowing particle aureole (Performant glow!)
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * 3.5, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.glowAlpha * (1 + Math.sin(time * 0.005 + p.x) * 0.3); // Subtle shine pulse
      ctx.fill();

      // Core Particle
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.globalAlpha = 0.9;
      ctx.fill();
    });

    // 3. Draw Connecting Web Segments
    ctx.globalAlpha = 1.0;
    for (let i = 0; i < this.particles.length; i++) {
      const p1 = this.particles[i];

      // Draw lines to mouse
      if (this.mouse.active && this.mouse.x !== null) {
        const dx = this.mouse.x - p1.x;
        const dy = this.mouse.y - p1.y;
        const dist = Math.hypot(dx, dy);

        if (dist < this.mouse.radius) {
          const alpha = (1 - dist / this.mouse.radius) * 0.35;
          
          // Glowing gradient line pointing to mouse
          const grad = ctx.createLinearGradient(p1.x, p1.y, this.mouse.x, this.mouse.y);
          grad.addColorStop(0, p1.color);
          grad.addColorStop(1, 'rgba(255, 255, 255, 0.4)');

          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(this.mouse.x, this.mouse.y);
          ctx.strokeStyle = grad;
          ctx.lineWidth = (1 - dist / this.mouse.radius) * 1.5;
          ctx.globalAlpha = alpha;
          ctx.stroke();
        }
      }

      // Draw lines between particles
      for (let j = i + 1; j < this.particles.length; j++) {
        const p2 = this.particles[j];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.hypot(dx, dy);

        if (dist < this.maxConnections) {
          const alpha = (1 - dist / this.maxConnections) * 0.18;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);

          // Beautiful mixed color gradients for bridges
          const grad = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
          grad.addColorStop(0, p1.color);
          grad.addColorStop(1, p2.color);

          ctx.strokeStyle = grad;
          ctx.lineWidth = (1 - dist / this.maxConnections) * 0.8;
          ctx.globalAlpha = alpha;
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1.0;
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
    return 'Neon Particle Web';
  }

  static get description() {
    return 'A constellation-like network of drifting neon particles. Move your cursor over the canvas to draw them into a orbital magnetic web with glowing, shifting connection filaments.';
  }

  static get vibe() {
    return 'Interactive';
  }

  static get sourceCode() {
    return `class NeonParticleWeb {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.mouse = { x: null, y: null, active: false, radius: 180 };
    this.colors = ['#FF007F', '#00F0FF', '#BD00FF', '#00FF66'];
    this.maxConnections = 100;
    
    this.init();
  }

  init() {
    this.resize();
    this.setup();
    
    // Bind Event Listeners
    window.addEventListener('resize', () => this.resize());
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseleave', () => this.handleMouseLeave());
    
    // Start Animation Loop
    this.animate();
  }

  setup() {
    this.particles = [];
    const count = Math.min(150, Math.max(40, Math.floor((this.width * this.height) / 12000)));

    for (let i = 0; i < count; i++) {
      const radius = Math.random() * 2 + 1.5;
      const vx = (Math.random() - 0.5) * 0.6;
      const vy = (Math.random() - 0.5) * 0.6;
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        radius,
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        vx, vy,
        originalVx: vx,
        originalVy: vy,
        glowAlpha: Math.random() * 0.2 + 0.1
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
    this.ctx.fillStyle = '#080A10';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Physics & Draw Particles
    this.particles.forEach(p => {
      // Drift & Boundaries bounce
      if (p.x + p.vx < 0 || p.x + p.vx > this.width) p.vx = -p.vx;
      if (p.y + p.vy < 0 || p.y + p.vy > this.height) p.vy = -p.vy;
      p.x += p.vx;
      p.y += p.vy;

      // Mouse pull logic
      if (this.mouse.active && this.mouse.x !== null) {
        const dx = this.mouse.x - p.x;
        const dy = this.mouse.y - p.y;
        const dist = Math.hypot(dx, dy);

        if (dist < this.mouse.radius) {
          const force = (this.mouse.radius - dist) / this.mouse.radius;
          p.vx += (dx / dist) * force * 0.12;
          p.vy += (dy / dist) * force * 0.12;
          p.vx += (-dy / dist) * force * 0.05; // Circular drift
          p.vy += (dx / dist) * force * 0.05;
        }
      }

      // Return velocity gradually to original drift (Damping)
      p.vx = p.vx * 0.95 + p.originalVx * 0.05;
      p.vy = p.vy * 0.95 + p.originalVy * 0.05;

      const speed = Math.hypot(p.vx, p.vy);
      if (speed > 2.2) {
        p.vx = (p.vx / speed) * 2.2;
        p.vy = (p.vy / speed) * 2.2;
      }

      // Glowing outer ring
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius * 3.5, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.glowAlpha * (1 + Math.sin(time * 0.005 + p.x) * 0.3);
      this.ctx.fill();

      // White Core
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.globalAlpha = 0.9;
      this.ctx.fill();
    });

    // Draw bridges
    this.ctx.globalAlpha = 1.0;
    for (let i = 0; i < this.particles.length; i++) {
      const p1 = this.particles[i];

      // Lines to mouse
      if (this.mouse.active && this.mouse.x !== null) {
        const dx = this.mouse.x - p1.x;
        const dy = this.mouse.y - p1.y;
        const dist = Math.hypot(dx, dy);

        if (dist < this.mouse.radius) {
          const grad = this.ctx.createLinearGradient(p1.x, p1.y, this.mouse.x, this.mouse.y);
          grad.addColorStop(0, p1.color);
          grad.addColorStop(1, 'rgba(255, 255, 255, 0.4)');

          this.ctx.beginPath();
          this.ctx.moveTo(p1.x, p1.y);
          this.ctx.lineTo(this.mouse.x, this.mouse.y);
          this.ctx.strokeStyle = grad;
          this.ctx.lineWidth = (1 - dist / this.mouse.radius) * 1.5;
          this.ctx.globalAlpha = (1 - dist / this.mouse.radius) * 0.35;
          this.ctx.stroke();
        }
      }

      // Particle to Particle lines
      for (let j = i + 1; j < this.particles.length; j++) {
        const p2 = this.particles[j];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.hypot(dx, dy);

        if (dist < this.maxConnections) {
          const alpha = (1 - dist / this.maxConnections) * 0.18;
          this.ctx.beginPath();
          this.ctx.moveTo(p1.x, p1.y);
          this.ctx.lineTo(p2.x, p2.y);

          const grad = this.ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
          grad.addColorStop(0, p1.color);
          grad.addColorStop(1, p2.color);

          this.ctx.strokeStyle = grad;
          this.ctx.lineWidth = (1 - dist / this.maxConnections) * 0.8;
          this.ctx.globalAlpha = alpha;
          this.ctx.stroke();
        }
      }
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
