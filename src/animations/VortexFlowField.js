import BaseAnimation from './BaseAnimation.js';

export default class VortexFlowField extends BaseAnimation {
  constructor() {
    super();
    this.particles = [];
    this.mouse = { x: null, y: null, active: false, radius: 250 };
    // Neon lime green and vibrant indigos/purples
    this.colors = ['#39FF14', '#00FF66', '#7B00FF', '#BD00FF', '#4B0082', '#9D00FF'];
    this.vortices = [];
  }

  setup() {
    // Define 3 static orbital gravity wells
    // Each has its own coordinates, orbital spin speed, strength, and radius
    this.vortices = [
      { x: this.width * 0.25, y: this.height * 0.35, strength: 0.8, spin: 1.2, radius: 260 },
      { x: this.width * 0.75, y: this.height * 0.40, strength: 0.9, spin: -1.0, radius: 280 },
      { x: this.width * 0.50, y: this.height * 0.75, strength: 0.75, spin: 1.5, radius: 240 }
    ];

    this.particles = [];
    // Dense particle count scaling with viewport size
    const densityFactor = 3200;
    const count = Math.min(
      550,
      Math.max(120, Math.floor((this.width * this.height) / densityFactor))
    );

    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        size: Math.random() * 1.8 + 0.6,
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        alpha: Math.random() * 0.4 + 0.5,
        decay: 0.96 + Math.random() * 0.02
      });
    }
  }

  resize(width, height) {
    super.resize(width, height);
    
    // Redistribute static gravity wells relative to new dimensions
    if (this.vortices.length >= 3) {
      this.vortices[0].x = width * 0.25;
      this.vortices[0].y = height * 0.35;
      this.vortices[1].x = width * 0.75;
      this.vortices[1].y = height * 0.40;
      this.vortices[2].x = width * 0.50;
      this.vortices[2].y = height * 0.75;
    }
  }

  draw(ctx, time) {
    // Satisfying Trails effect: clear with slight opacity to create smooth glowing motion sweeps
    ctx.fillStyle = 'rgba(4, 3, 10, 0.082)'; // extremely dark indigo space dust base
    ctx.fillRect(0, 0, this.width, this.height);

    const timeSec = time * 0.001;

    // 1. Gently animate the position of the static vortices to keep the flow organic and alive
    this.vortices[0].x = this.width * 0.25 + Math.sin(timeSec * 0.4) * 80;
    this.vortices[0].y = this.height * 0.35 + Math.cos(timeSec * 0.3) * 60;

    this.vortices[1].x = this.width * 0.75 + Math.cos(timeSec * 0.5) * 70;
    this.vortices[1].y = this.height * 0.40 + Math.sin(timeSec * 0.4) * 80;

    this.vortices[2].x = this.width * 0.50 + Math.sin(timeSec * 0.3) * 100;
    this.vortices[2].y = this.height * 0.75 + Math.cos(timeSec * 0.6) * 50;

    // 2. Physics updates for particles
    this.particles.forEach(p => {
      let fx = 0;
      let fy = 0;

      // Sum velocity forces from static gravity wells
      this.vortices.forEach(v => {
        const dx = v.x - p.x;
        const dy = v.y - p.y;
        const dist = Math.hypot(dx, dy);

        if (dist < v.radius) {
          const force = (v.radius - dist) / v.radius; // 0 to 1 scaling linearly
          const pullAngle = Math.atan2(dy, dx);
          
          // Force vectors: 1) Attraction pull, 2) Perpendicular vortex spin
          const attractionForce = force * v.strength * 0.28;
          const spinForce = force * v.spin * 0.42;

          fx += Math.cos(pullAngle) * attractionForce + Math.cos(pullAngle + Math.PI / 2) * spinForce;
          fy += Math.sin(pullAngle) * attractionForce + Math.sin(pullAngle + Math.PI / 2) * spinForce;
        }
      });

      // Sum force from cursor gravity well
      if (this.mouse.active && this.mouse.x !== null) {
        const dx = this.mouse.x - p.x;
        const dy = this.mouse.y - p.y;
        const dist = Math.hypot(dx, dy);

        if (dist < this.mouse.radius) {
          const force = (this.mouse.radius - dist) / this.mouse.radius;
          const pullAngle = Math.atan2(dy, dx);
          
          // Powerful cursor vortex: pulls strongly, spins quickly
          const attractionForce = force * 1.5;
          const spinForce = force * 2.2;

          fx += Math.cos(pullAngle) * attractionForce + Math.cos(pullAngle + Math.PI / 2) * spinForce;
          fy += Math.sin(pullAngle) * attractionForce + Math.sin(pullAngle + Math.PI / 2) * spinForce;
        }
      }

      // Add forces to velocity
      p.vx += fx;
      p.vy += fy;

      // Apply natural damping friction to avoid speed runaway
      p.vx *= p.decay;
      p.vy *= p.decay;

      // Keep velocity within bounds
      const speed = Math.hypot(p.vx, p.vy);
      const maxSpeed = 4.5;
      if (speed > maxSpeed) {
        p.vx = (p.vx / speed) * maxSpeed;
        p.vy = (p.vy / speed) * maxSpeed;
      }

      // Move particle
      p.x += p.vx;
      p.y += p.vy;

      // Soft bounce / respawn at boundaries
      const pad = 10;
      if (p.x < -pad || p.x > this.width + pad || p.y < -pad || p.y > this.height + pad) {
        p.x = Math.random() * this.width;
        p.y = Math.random() * this.height;
        p.vx = (Math.random() - 0.5) * 1.0;
        p.vy = (Math.random() - 0.5) * 1.0;
      }

      // 3. Render Particle with speed-based elongation (Streak particles)
      ctx.beginPath();
      // Draw a line segment representing velocity stretching
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 1.5, p.y - p.vy * 1.5);
      
      ctx.strokeStyle = p.color;
      ctx.lineWidth = p.size;
      ctx.globalAlpha = p.alpha;
      ctx.stroke();
    });

    // Draw Subtle gravity well hubs to show structural origin
    ctx.globalCompositeOperation = 'screen';
    this.vortices.forEach(v => {
      ctx.beginPath();
      ctx.arc(v.x, v.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.globalAlpha = 0.25;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(v.x, v.y, 16, 0, Math.PI * 2);
      ctx.strokeStyle = '#39FF14';
      ctx.globalAlpha = 0.05;
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    if (this.mouse.active && this.mouse.x !== null) {
      // Draw glowing magnetic well under mouse
      ctx.beginPath();
      ctx.arc(this.mouse.x, this.mouse.y, 30, 0, Math.PI * 2);
      ctx.strokeStyle = '#BD00FF';
      ctx.globalAlpha = 0.08;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1.0;
  }

  destroy() {
    this.particles = [];
    this.vortices = [];
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
    return 'Vortex Flow Field';
  }

  static get description() {
    return 'Satisfying streams of neon lime and deep indigo particles swirling around three central gravity wells. Orbit paths bend and warp instantly under the attraction of your cursor.';
  }

  static get vibe() {
    return 'Satisfying';
  }

  static get sourceCode() {
    return `class VortexFlowField {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.mouse = { x: null, y: null, active: false, radius: 250 };
    this.colors = ['#39FF14', '#00FF66', '#7B00FF', '#BD00FF', '#4B0082', '#9D00FF'];
    this.vortices = [];

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
    this.vortices = [
      { x: this.width * 0.25, y: this.height * 0.35, strength: 0.8, spin: 1.2, radius: 260 },
      { x: this.width * 0.75, y: this.height * 0.40, strength: 0.9, spin: -1.0, radius: 280 },
      { x: this.width * 0.50, y: this.height * 0.75, strength: 0.75, spin: 1.5, radius: 240 }
    ];

    this.particles = [];
    const count = Math.min(550, Math.max(120, Math.floor((this.width * this.height) / 3200)));

    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        size: Math.random() * 1.8 + 0.6,
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        alpha: Math.random() * 0.4 + 0.5,
        decay: 0.96 + Math.random() * 0.02
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
    this.ctx.fillStyle = 'rgba(4, 3, 10, 0.082)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    const timeSec = time * 0.001;

    this.vortices[0].x = this.width * 0.25 + Math.sin(timeSec * 0.4) * 80;
    this.vortices[0].y = this.height * 0.35 + Math.cos(timeSec * 0.3) * 60;

    this.vortices[1].x = this.width * 0.75 + Math.cos(timeSec * 0.5) * 70;
    this.vortices[1].y = this.height * 0.40 + Math.sin(timeSec * 0.4) * 80;

    this.vortices[2].x = this.width * 0.50 + Math.sin(timeSec * 0.3) * 100;
    this.vortices[2].y = this.height * 0.75 + Math.cos(timeSec * 0.6) * 50;

    this.particles.forEach(p => {
      let fx = 0, fy = 0;

      this.vortices.forEach(v => {
        const dx = v.x - p.x;
        const dy = v.y - p.y;
        const dist = Math.hypot(dx, dy);

        if (dist < v.radius) {
          const force = (v.radius - dist) / v.radius;
          const pullAngle = Math.atan2(dy, dx);
          
          const attractionForce = force * v.strength * 0.28;
          const spinForce = force * v.spin * 0.42;

          fx += Math.cos(pullAngle) * attractionForce + Math.cos(pullAngle + Math.PI / 2) * spinForce;
          fy += Math.sin(pullAngle) * attractionForce + Math.sin(pullAngle + Math.PI / 2) * spinForce;
        }
      });

      if (this.mouse.active && this.mouse.x !== null) {
        const dx = this.mouse.x - p.x;
        const dy = this.mouse.y - p.y;
        const dist = Math.hypot(dx, dy);

        if (dist < this.mouse.radius) {
          const force = (this.mouse.radius - dist) / this.mouse.radius;
          const pullAngle = Math.atan2(dy, dx);
          
          const attractionForce = force * 1.5;
          const spinForce = force * 2.2;

          fx += Math.cos(pullAngle) * attractionForce + Math.cos(pullAngle + Math.PI / 2) * spinForce;
          fy += Math.sin(pullAngle) * attractionForce + Math.sin(pullAngle + Math.PI / 2) * spinForce;
        }
      }

      p.vx += fx;
      p.vy += fy;
      p.vx *= p.decay;
      p.vy *= p.decay;

      const speed = Math.hypot(p.vx, p.vy);
      if (speed > 4.5) {
        p.vx = (p.vx / speed) * 4.5;
        p.vy = (p.vy / speed) * 4.5;
      }

      p.x += p.vx;
      p.y += p.vy;

      const pad = 10;
      if (p.x < -pad || p.x > this.width + pad || p.y < -pad || p.y > this.height + pad) {
        p.x = Math.random() * this.width;
        p.y = Math.random() * this.height;
        p.vx = (Math.random() - 0.5) * 1.0;
        p.vy = (Math.random() - 0.5) * 1.0;
      }

      this.ctx.beginPath();
      this.ctx.moveTo(p.x, p.y);
      this.ctx.lineTo(p.x - p.vx * 1.5, p.y - p.vy * 1.5);
      this.ctx.strokeStyle = p.color;
      this.ctx.lineWidth = p.size;
      this.ctx.globalAlpha = p.alpha;
      this.ctx.stroke();
    });

    this.ctx.globalCompositeOperation = 'screen';
    this.vortices.forEach(v => {
      this.ctx.beginPath();
      this.ctx.arc(v.x, v.y, 4, 0, Math.PI * 2);
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.globalAlpha = 0.25;
      this.ctx.fill();

      this.ctx.beginPath();
      this.ctx.arc(v.x, v.y, 16, 0, Math.PI * 2);
      this.ctx.strokeStyle = '#39FF14';
      this.ctx.globalAlpha = 0.05;
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
    });

    if (this.mouse.active && this.mouse.x !== null) {
      this.ctx.beginPath();
      this.ctx.arc(this.mouse.x, this.mouse.y, 30, 0, Math.PI * 2);
      this.ctx.strokeStyle = '#BD00FF';
      this.ctx.globalAlpha = 0.08;
      this.ctx.lineWidth = 1.5;
      this.ctx.stroke();
    }

    this.ctx.globalCompositeOperation = 'source-over';
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
