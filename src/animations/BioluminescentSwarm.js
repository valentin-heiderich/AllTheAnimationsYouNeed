import BaseAnimation from './BaseAnimation.js';

export default class BioluminescentSwarm extends BaseAnimation {
  constructor() {
    super();
    this.mouse = { x: null, y: null, active: false, rx: 0, ry: 0 };
    this.fireflies = [];
    this.ambientPollen = [];
  }

  setup() {
    this.fireflies = [];
    this.ambientPollen = [];
    this.mouse.rx = this.width / 2;
    this.mouse.ry = this.height / 2;

    const area = this.width * this.height;
    const flyCount = Math.min(140, Math.floor(area / 9000));
    const pollenCount = Math.min(80, Math.floor(area / 15000));

    // Populate Boids (Fireflies)
    for (let i = 0; i < flyCount; i++) {
      // Alternating amber and emerald
      const isAmber = Math.random() > 0.45;
      const hue = isAmber ? 42 + Math.random() * 12 : 142 + Math.random() * 20;

      this.fireflies.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 2.0,
        vy: (Math.random() - 0.5) * 2.0,
        speedLimit: Math.random() * 1.2 + 1.8,
        size: Math.random() * 2.0 + 1.2,
        hue: hue,
        glowRadius: Math.random() * 14 + 10,
        pulseOffset: Math.random() * Math.PI * 2,
        pulseSpeed: 0.04 + Math.random() * 0.05
      });
    }

    // Populate slow ambient drifting pollen background
    for (let i = 0; i < pollenCount; i++) {
      this.ambientPollen.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: -Math.random() * 0.3 - 0.1,
        size: Math.random() * 1.2 + 0.5,
        opacity: Math.random() * 0.35 + 0.1,
        hue: Math.random() > 0.5 ? 45 : 140
      });
    }

    this.ctx.fillStyle = '#030705';
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  resize(width, height) {
    super.resize(width, height);
    this.setup();
  }

  draw(ctx, time) {
    // 1. Dark enchanted forest background decay trails
    ctx.fillStyle = 'rgba(3, 7, 5, 0.18)';
    ctx.fillRect(0, 0, this.width, this.height);

    // Track spring mouse coordinates
    if (this.mouse.active && this.mouse.x !== null) {
      this.mouse.rx = this.mouse.rx * 0.9 + this.mouse.x * 0.1;
      this.mouse.ry = this.mouse.ry * 0.9 + this.mouse.y * 0.1;

      // Draw soft cursor light attractant
      const mouseGlow = ctx.createRadialGradient(this.mouse.rx, this.mouse.ry, 0, this.mouse.rx, this.mouse.ry, 70);
      mouseGlow.addColorStop(0, 'rgba(255, 230, 150, 0.18)');
      mouseGlow.addColorStop(0.5, 'rgba(100, 255, 180, 0.06)');
      mouseGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.beginPath();
      ctx.arc(this.mouse.rx, this.mouse.ry, 70, 0, Math.PI * 2);
      ctx.fillStyle = mouseGlow;
      ctx.fill();
    } else {
      // Natural floating drift of cursor center when inactive
      this.mouse.rx = this.mouse.rx * 0.98 + (this.width / 2 + Math.sin(time * 0.0006) * (this.width * 0.2)) * 0.02;
      this.mouse.ry = this.mouse.ry * 0.98 + (this.height / 2 + Math.cos(time * 0.0005) * (this.height * 0.2)) * 0.02;
    }

    // 2. Update and Draw Ambient Pollen
    this.ambientPollen.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = this.width;
      if (p.x > this.width) p.x = 0;
      if (p.y < 0) {
        p.y = this.height;
        p.x = Math.random() * this.width;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 85%, 60%, ${p.opacity * (0.6 + Math.sin(time * 0.002 + p.size) * 0.4)})`;
      ctx.fill();
    });

    // Boids Flocking Parameters
    const visualRange = 46.0;
    const minDistance = 18.0;
    const cohesionFactor = 0.007;
    const alignmentFactor = 0.04;
    const separationFactor = 0.06;
    const cursorAttractFactor = 0.035;

    // 3. Update Fireflies Flocking Vectors
    this.fireflies.forEach(f => {
      let centerX = 0;
      let centerY = 0;
      let avgVx = 0;
      let avgVy = 0;
      let closeDx = 0;
      let closeDy = 0;
      let neighbors = 0;

      this.fireflies.forEach(other => {
        if (f === other) return;

        const dx = other.x - f.x;
        const dy = other.y - f.y;
        const dist = Math.hypot(dx, dy);

        if (dist < visualRange) {
          centerX += other.x;
          centerY += other.y;
          avgVx += other.vx;
          avgVy += other.vy;
          neighbors++;

          if (dist < minDistance) {
            // Separation force
            closeDx += f.x - other.x;
            closeDy += f.y - other.y;
          }
        }
      });

      // Apply behaviors
      if (neighbors > 0) {
        centerX /= neighbors;
        centerY /= neighbors;
        avgVx /= neighbors;
        avgVy /= neighbors;

        // Cohesion: steer to average center
        f.vx += (centerX - f.x) * cohesionFactor;
        f.vy += (centerY - f.y) * cohesionFactor;

        // Alignment: align heading to neighbors
        f.vx += (avgVx - f.vx) * alignmentFactor;
        f.vy += (avgVy - f.vy) * alignmentFactor;
      }

      // Separation: keep distance
      f.vx += closeDx * separationFactor;
      f.vy += closeDy * separationFactor;

      // Cursor Attraction Force (attracts swarm to active light)
      if (this.mouse.active) {
        const dx = this.mouse.rx - f.x;
        const dy = this.mouse.ry - f.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 10) {
          f.vx += (dx / dist) * cursorAttractFactor;
          f.vy += (dy / dist) * cursorAttractFactor;
        }
      } else {
        // Slow lazy sway drift toward spring center
        const dx = this.mouse.rx - f.x;
        const dy = this.mouse.ry - f.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 10) {
          f.vx += (dx / dist) * (cursorAttractFactor * 0.15);
          f.vy += (dy / dist) * (cursorAttractFactor * 0.15);
        }
      }

      // Bound steering speed
      const speed = Math.hypot(f.vx, f.vy);
      if (speed > f.speedLimit) {
        f.vx = (f.vx / speed) * f.speedLimit;
        f.vy = (f.vy / speed) * f.speedLimit;
      }

      // Update positions
      f.x += f.vx;
      f.y += f.vy;

      // Handle screen wrap boundaries smoothly
      const padding = 15;
      if (f.x < -padding) f.x = this.width + padding;
      if (f.x > this.width + padding) f.x = -padding;
      if (f.y < -padding) f.y = this.height + padding;
      if (f.y > this.height + padding) f.y = -padding;

      // 4. Draw Bioluminescent Firefly (Golden/Emerald Core + Soft Glow Outer Rings)
      const pulse = Math.sin(time * f.pulseSpeed + f.pulseOffset);
      const intensity = 0.55 + pulse * 0.45; // Pulsing opacity ratio

      // Bioluminescent Outer Aura Layer 1 (Glowing wide ring)
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.glowRadius * (0.8 + pulse * 0.2), 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${f.hue}, 100%, 65%, ${intensity * 0.08})`;
      ctx.fill();

      // Bioluminescent Mid Aura Layer 2
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.glowRadius * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${f.hue}, 100%, 75%, ${intensity * 0.22})`;
      ctx.fill();

      // Sharp Core Starlet
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${intensity * 0.95})`;
      ctx.fill();
    });
  }

  destroy() {
    super.destroy();
    this.fireflies = [];
    this.ambientPollen = [];
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
    return 'Bioluminescent Swarm';
  }

  static get description() {
    return 'Mystical glowing fireflies swarm using a high-performance custom boids flocking algorithm (cohesion, alignment, separation). The cursor acts as a soft bright attractant beacon that guides the swarm organically. Fireflies pulse in independent wave phases, casting rich emerald green and amber bioluminescent auras.';
  }

  static get vibe() {
    return 'Natural';
  }

  static get sourceCode() {
    return `class BioluminescentSwarm {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.mouse = { x: null, y: null, active: false, rx: 0, ry: 0 };
    this.fireflies = [];
    this.ambientPollen = [];

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
    this.fireflies = [];
    this.ambientPollen = [];
    this.mouse.rx = this.width / 2;
    this.mouse.ry = this.height / 2;

    const area = this.width * this.height;
    const flyCount = Math.min(140, Math.floor(area / 9000));
    const pollenCount = Math.min(80, Math.floor(area / 15000));

    for (let i = 0; i < flyCount; i++) {
      const isAmber = Math.random() > 0.45;
      const hue = isAmber ? 42 + Math.random() * 12 : 142 + Math.random() * 20;

      this.fireflies.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 2.0,
        vy: (Math.random() - 0.5) * 2.0,
        speedLimit: Math.random() * 1.2 + 1.8,
        size: Math.random() * 2.0 + 1.2,
        hue: hue,
        glowRadius: Math.random() * 14 + 10,
        pulseOffset: Math.random() * Math.PI * 2,
        pulseSpeed: 0.04 + Math.random() * 0.05
      });
    }

    for (let i = 0; i < pollenCount; i++) {
      this.ambientPollen.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: -Math.random() * 0.3 - 0.1,
        size: Math.random() * 1.2 + 0.5,
        opacity: Math.random() * 0.35 + 0.1,
        hue: Math.random() > 0.5 ? 45 : 140
      });
    }

    this.ctx.fillStyle = '#030705';
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
    this.ctx.fillStyle = 'rgba(3, 7, 5, 0.18)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    if (this.mouse.active && this.mouse.x !== null) {
      this.mouse.rx = this.mouse.rx * 0.9 + this.mouse.x * 0.1;
      this.mouse.ry = this.mouse.ry * 0.9 + this.mouse.y * 0.1;

      const mouseGlow = this.ctx.createRadialGradient(this.mouse.rx, this.mouse.ry, 0, this.mouse.rx, this.mouse.ry, 70);
      mouseGlow.addColorStop(0, 'rgba(255, 230, 150, 0.18)');
      mouseGlow.addColorStop(0.5, 'rgba(100, 255, 180, 0.06)');
      mouseGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      this.ctx.beginPath();
      this.ctx.arc(this.mouse.rx, this.mouse.ry, 70, 0, Math.PI * 2);
      this.ctx.fillStyle = mouseGlow;
      this.ctx.fill();
    } else {
      this.mouse.rx = this.mouse.rx * 0.98 + (this.width / 2 + Math.sin(time * 0.0006) * (this.width * 0.2)) * 0.02;
      this.mouse.ry = this.mouse.ry * 0.98 + (this.height / 2 + Math.cos(time * 0.0005) * (this.height * 0.2)) * 0.02;
    }

    this.ambientPollen.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = this.width;
      if (p.x > this.width) p.x = 0;
      if (p.y < 0) {
        p.y = this.height;
        p.x = Math.random() * this.width;
      }

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = \`hsla(\${p.hue}, 85%, 60%, \${p.opacity * (0.6 + Math.sin(time * 0.002 + p.size) * 0.4)})\`;
      this.ctx.fill();
    });

    const visualRange = 46.0;
    const minDistance = 18.0;
    const cohesionFactor = 0.007;
    const alignmentFactor = 0.04;
    const separationFactor = 0.06;
    const cursorAttractFactor = 0.035;

    this.fireflies.forEach(f => {
      let centerX = 0;
      let centerY = 0;
      let avgVx = 0;
      let avgVy = 0;
      let closeDx = 0;
      let closeDy = 0;
      let neighbors = 0;

      this.fireflies.forEach(other => {
        if (f === other) return;

        const dx = other.x - f.x;
        const dy = other.y - f.y;
        const dist = Math.hypot(dx, dy);

        if (dist < visualRange) {
          centerX += other.x;
          centerY += other.y;
          avgVx += other.vx;
          avgVy += other.vy;
          neighbors++;

          if (dist < minDistance) {
            closeDx += f.x - other.x;
            closeDy += f.y - other.y;
          }
        }
      });

      if (neighbors > 0) {
        centerX /= neighbors;
        centerY /= neighbors;
        avgVx /= neighbors;
        avgVy /= neighbors;

        f.vx += (centerX - f.x) * cohesionFactor;
        f.vy += (centerY - f.y) * cohesionFactor;
        f.vx += (avgVx - f.vx) * alignmentFactor;
        f.vy += (avgVy - f.vy) * alignmentFactor;
      }

      f.vx += closeDx * separationFactor;
      f.vy += closeDy * separationFactor;

      if (this.mouse.active) {
        const dx = this.mouse.rx - f.x;
        const dy = this.mouse.ry - f.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 10) {
          f.vx += (dx / dist) * cursorAttractFactor;
          f.vy += (dy / dist) * cursorAttractFactor;
        }
      } else {
        const dx = this.mouse.rx - f.x;
        const dy = this.mouse.ry - f.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 10) {
          f.vx += (dx / dist) * (cursorAttractFactor * 0.15);
          f.vy += (dy / dist) * (cursorAttractFactor * 0.15);
        }
      }

      const speed = Math.hypot(f.vx, f.vy);
      if (speed > f.speedLimit) {
        f.vx = (f.vx / speed) * f.speedLimit;
        f.vy = (f.vy / speed) * f.speedLimit;
      }

      f.x += f.vx;
      f.y += f.vy;

      const padding = 15;
      if (f.x < -padding) f.x = this.width + padding;
      if (f.x > this.width + padding) f.x = -padding;
      if (f.y < -padding) f.y = this.height + padding;
      if (f.y > this.height + padding) f.y = -padding;

      const pulse = Math.sin(time * f.pulseSpeed + f.pulseOffset);
      const intensity = 0.55 + pulse * 0.45;

      this.ctx.beginPath();
      this.ctx.arc(f.x, f.y, f.glowRadius * (0.8 + pulse * 0.2), 0, Math.PI * 2);
      this.ctx.fillStyle = \`hsla(\${f.hue}, 100%, 65%, \${intensity * 0.08})\`;
      this.ctx.fill();

      this.ctx.beginPath();
      this.ctx.arc(f.x, f.y, f.glowRadius * 0.4, 0, Math.PI * 2);
      this.ctx.fillStyle = \`hsla(\${f.hue}, 100%, 75%, \${intensity * 0.22})\`;
      this.ctx.fill();

      this.ctx.beginPath();
      this.ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
      this.ctx.fillStyle = \`rgba(255, 255, 255, \${intensity * 0.95})\`;
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
