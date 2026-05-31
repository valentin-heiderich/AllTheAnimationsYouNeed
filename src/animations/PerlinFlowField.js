import BaseAnimation from './BaseAnimation.js';

export default class PerlinFlowField extends BaseAnimation {
  constructor() {
    super();
    this.particles = [];
    this.mouse = { x: null, y: null, active: false };
    this.baseSpeed = 1.2;
    this.noiseScale = 0.004;
  }

  setup() {
    this.particles = [];
    // Scale count with resolution: high-density for premium silk trail aesthetics
    const densityFactor = 3000;
    const count = Math.min(600, Math.max(150, Math.floor((this.width * this.height) / densityFactor)));

    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: 0,
        vy: 0,
        age: Math.random() * 200,
        maxAge: Math.random() * 200 + 100,
        speed: Math.random() * 0.8 + 0.8,
        hueOffset: Math.random() * 40 - 20
      });
    }
  }

  resize(width, height) {
    super.resize(width, height);
    this.setup();
  }

  draw(ctx, time) {
    // Transparent clear creates long-lasting glowing silk filaments (trails)
    ctx.fillStyle = 'rgba(8, 4, 14, 0.05)';
    ctx.fillRect(0, 0, this.width, this.height);

    this.particles.forEach(p => {
      // Continuous trigonometric field (pseudo-Perlin)
      let angle = Math.sin(p.x * this.noiseScale + time * 0.0001) * Math.cos(p.y * this.noiseScale - time * 0.00015) * Math.PI * 2.5;
      angle += Math.sin((p.x + p.y) * 0.002) * Math.PI;

      // Mouse drag force vector
      if (this.mouse.active && this.mouse.x !== null) {
        const dx = this.mouse.x - p.x;
        const dy = this.mouse.y - p.y;
        const dist = Math.hypot(dx, dy);
        const radius = 220;

        if (dist < radius) {
          const force = (radius - dist) / radius;
          // Calculate orbital swirl angle
          const swirlAngle = Math.atan2(dy, dx) + Math.PI / 2;
          // Smooth blend noise angle and mouse drag vector
          angle = angle * (1 - force * 0.85) + swirlAngle * (force * 0.85);
        }
      }

      // Physics acceleration along calculated angle
      const targetVx = Math.cos(angle) * p.speed;
      const targetVy = Math.sin(angle) * p.speed;

      // Inertial easing
      p.vx = p.vx * 0.9 + targetVx * 0.1;
      p.vy = p.vy * 0.9 + targetVy * 0.1;

      // Move particle
      const prevX = p.x;
      const prevY = p.y;
      p.x += p.vx;
      p.y += p.vy;
      p.age++;

      // Wrap boundaries or reset aged particles
      if (p.x < 0 || p.x > this.width || p.y < 0 || p.y > this.height || p.age > p.maxAge) {
        p.x = Math.random() * this.width;
        p.y = Math.random() * this.height;
        p.vx = 0;
        p.vy = 0;
        p.age = 0;
        p.maxAge = Math.random() * 200 + 100;
        return;
      }

      // Draw beautiful continuous glow lines
      const progress = p.age / p.maxAge;
      const alpha = progress < 0.2 ? progress / 0.2 * 0.35 : (1 - progress) * 0.35;

      const hue = (290 + p.hueOffset + Math.sin(time * 0.0002) * 25) % 360; // Deep Violet to Magenta
      ctx.beginPath();
      ctx.moveTo(prevX, prevY);
      ctx.lineTo(p.x, p.y);
      ctx.strokeStyle = `hsla(${hue}, 100%, 65%, ${alpha})`;
      ctx.lineWidth = 1.2 + (1 - progress) * 0.8;
      ctx.stroke();
    });
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

  static get title() {
    return 'Perlin Flow Field';
  }

  static get description() {
    return 'Glowing silk filaments flowing along organic trigonometric noise streamlines. Guide the flow lines to construct interactive, high-density magnetic storm swirls with your cursor.';
  }

  static get vibe() {
    return 'Mesmerizing';
  }

  static get sourceCode() {
    return `class PerlinFlowField {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.mouse = { x: null, y: null, active: false };
    this.noiseScale = 0.004;
    
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
    const count = Math.min(600, Math.max(150, Math.floor((this.width * this.height) / 3000)));

    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: 0,
        vy: 0,
        age: Math.random() * 200,
        maxAge: Math.random() * 200 + 100,
        speed: Math.random() * 0.8 + 0.8,
        hueOffset: Math.random() * 40 - 20
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
    this.ctx.fillStyle = 'rgba(8, 4, 14, 0.05)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.particles.forEach(p => {
      let angle = Math.sin(p.x * this.noiseScale + time * 0.0001) * Math.cos(p.y * this.noiseScale - time * 0.00015) * Math.PI * 2.5;
      angle += Math.sin((p.x + p.y) * 0.002) * Math.PI;

      if (this.mouse.active && this.mouse.x !== null) {
        const dx = this.mouse.x - p.x;
        const dy = this.mouse.y - p.y;
        const dist = Math.hypot(dx, dy);
        const radius = 220;

        if (dist < radius) {
          const force = (radius - dist) / radius;
          const swirlAngle = Math.atan2(dy, dx) + Math.PI / 2;
          angle = angle * (1 - force * 0.85) + swirlAngle * (force * 0.85);
        }
      }

      const targetVx = Math.cos(angle) * p.speed;
      const targetVy = Math.sin(angle) * p.speed;

      p.vx = p.vx * 0.9 + targetVx * 0.1;
      p.vy = p.vy * 0.9 + targetVy * 0.1;

      const prevX = p.x;
      const prevY = p.y;
      p.x += p.vx;
      p.y += p.vy;
      p.age++;

      if (p.x < 0 || p.x > this.width || p.y < 0 || p.y > this.height || p.age > p.maxAge) {
        p.x = Math.random() * this.width;
        p.y = Math.random() * this.height;
        p.vx = 0;
        p.vy = 0;
        p.age = 0;
        p.maxAge = Math.random() * 200 + 100;
        return;
      }

      const progress = p.age / p.maxAge;
      const alpha = progress < 0.2 ? progress / 0.2 * 0.35 : (1 - progress) * 0.35;
      const hue = (290 + p.hueOffset + Math.sin(time * 0.0002) * 25) % 360;

      this.ctx.beginPath();
      this.ctx.moveTo(prevX, prevY);
      this.ctx.lineTo(p.x, p.y);
      this.ctx.strokeStyle = \`hsla(\${hue}, 100%, 65%, \${alpha})\`;
      this.ctx.lineWidth = 1.2 + (1 - progress) * 0.8;
      this.ctx.stroke();
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
