import BaseAnimation from './BaseAnimation.js';

export default class BoidsFlockingSwarm extends BaseAnimation {
  constructor() {
    super();
    this.boids = [];
    this.mouse = { x: null, y: null, active: false, radius: 180 };
    this.colors = ['#00F0FF', '#8A2BE2', '#00D2FF', '#BD00FF']; // Neon sky-blue / purple
    // Tuning parameters for Reynolds Flocking
    this.maxSpeed = 2.5;
    this.maxForce = 0.05;
    this.visualRange = 80;
    this.separationDistance = 30;
  }

  setup() {
    this.boids = [];
    const densityFactor = 12000;
    const count = Math.min(
      160,
      Math.max(40, Math.floor((this.width * this.height) / densityFactor))
    );

    for (let i = 0; i < count; i++) {
      this.boids.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * this.maxSpeed,
        vy: (Math.random() - 0.5) * this.maxSpeed,
        size: Math.random() * 4 + 4,
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        glowAlpha: Math.random() * 0.15 + 0.1,
        trail: []
      });
    }
  }

  resize(width, height) {
    super.resize(width, height);
    this.boids.forEach(b => {
      if (b.x > width) b.x = Math.random() * width;
      if (b.y > height) b.y = Math.random() * height;
    });
  }

  draw(ctx, time) {
    // Elegant deep cosmic canvas base
    ctx.fillStyle = '#060713';
    ctx.fillRect(0, 0, this.width, this.height);

    // Render subtle atmospheric grid background
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.03)';
    ctx.lineWidth = 1;
    const gridSize = 80;
    for (let x = 0; x < this.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }
    for (let y = 0; y < this.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }

    // Boids Sim loop
    const numBoids = this.boids.length;

    for (let i = 0; i < numBoids; i++) {
      const b = this.boids[i];

      // Reynolds Forces Accumulators
      let sepX = 0, sepY = 0, sepCount = 0;
      let alignX = 0, alignY = 0, alignCount = 0;
      let cohX = 0, cohY = 0, cohCount = 0;

      for (let j = 0; j < numBoids; j++) {
        if (i === j) continue;
        const other = this.boids[j];
        const dx = other.x - b.x;
        const dy = other.y - b.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < this.visualRange * this.visualRange) {
          const dist = Math.sqrt(distSq);

          // 1. Separation
          if (dist < this.separationDistance && dist > 0) {
            sepX -= dx / dist;
            sepY -= dy / dist;
            sepCount++;
          }

          // 2. Alignment
          alignX += other.vx;
          alignY += other.vy;
          alignCount++;

          // 3. Cohesion
          cohX += other.x;
          cohY += other.y;
          cohCount++;
        }
      }

      // Apply Forces
      let steerX = 0;
      let steerY = 0;

      if (sepCount > 0) {
        sepX /= sepCount;
        sepY /= sepCount;
        // Normalize separation vector
        const d = Math.hypot(sepX, sepY);
        if (d > 0) {
          sepX = (sepX / d) * this.maxSpeed - b.vx;
          sepY = (sepY / d) * this.maxSpeed - b.vy;
          // Apply weight
          steerX += sepX * 1.5;
          steerY += sepY * 1.5;
        }
      }

      if (alignCount > 0) {
        alignX /= alignCount;
        alignY /= alignCount;
        const d = Math.hypot(alignX, alignY);
        if (d > 0) {
          alignX = (alignX / d) * this.maxSpeed - b.vx;
          alignY = (alignY / d) * this.maxSpeed - b.vy;
          steerX += alignX * 1.0;
          steerY += alignY * 1.0;
        }
      }

      if (cohCount > 0) {
        cohX /= cohCount;
        cohY /= cohCount;
        let targetX = cohX - b.x;
        let targetY = cohY - b.y;
        const d = Math.hypot(targetX, targetY);
        if (d > 0) {
          targetX = (targetX / d) * this.maxSpeed - b.vx;
          targetY = (targetY / d) * this.maxSpeed - b.vy;
          steerX += targetX * 1.0;
          steerY += targetY * 1.0;
        }
      }

      // Mouse Predator/Food Influence
      if (this.mouse.active && this.mouse.x !== null) {
        const mDx = b.x - this.mouse.x;
        const mDy = b.y - this.mouse.y;
        const mDist = Math.hypot(mDx, mDy);

        if (mDist < this.mouse.radius && mDist > 0) {
          // Predator Mode (repel strongly)
          const strength = (this.mouse.radius - mDist) / this.mouse.radius;
          const forceX = (mDx / mDist) * strength * 3.5;
          const forceY = (mDy / mDist) * strength * 3.5;
          steerX += forceX;
          steerY += forceY;
        } else if (mDist < 400) {
          // Food attraction from afar
          const strength = (400 - mDist) / 400;
          const forceX = (-mDx / mDist) * strength * 0.4;
          const forceY = (-mDy / mDist) * strength * 0.4;
          steerX += forceX;
          steerY += forceY;
        }
      }

      // Limit steer force
      const forceMag = Math.hypot(steerX, steerY);
      if (forceMag > this.maxForce) {
        steerX = (steerX / forceMag) * this.maxForce;
        steerY = (steerY / forceMag) * this.maxForce;
      }

      // Update acceleration & velocity
      b.vx += steerX;
      b.vy += steerY;

      // Limit speed
      const speed = Math.hypot(b.vx, b.vy);
      if (speed > this.maxSpeed) {
        b.vx = (b.vx / speed) * this.maxSpeed;
        b.vy = (b.vy / speed) * this.maxSpeed;
      }

      // Advance coordinates
      b.x += b.vx;
      b.y += b.vy;

      // Soft Screen Boundaries (wrap around beautifully with margin offset)
      const margin = 20;
      if (b.x < -margin) b.x = this.width + margin;
      if (b.x > this.width + margin) b.x = -margin;
      if (b.y < -margin) b.y = this.height + margin;
      if (b.y > this.height + margin) b.y = -margin;

      // Maintain trails
      b.trail.push({ x: b.x, y: b.y });
      if (b.trail.length > 8) b.trail.shift();

      // Render flocking trajectories (glowing stream)
      if (b.trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(b.trail[0].x, b.trail[0].y);
        for (let t = 1; t < b.trail.length; t++) {
          ctx.lineTo(b.trail[t].x, b.trail[t].y);
        }
        ctx.strokeStyle = b.color;
        ctx.globalAlpha = 0.15;
        ctx.lineWidth = b.size * 0.4;
        ctx.stroke();
      }

      // Render boid structure
      const angle = Math.atan2(b.vy, b.vx);
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(angle);

      // outer pulsing neon aura
      ctx.beginPath();
      ctx.moveTo(b.size * 1.5, 0);
      ctx.lineTo(-b.size, -b.size * 0.7);
      ctx.lineTo(-b.size * 0.4, 0);
      ctx.lineTo(-b.size, b.size * 0.7);
      ctx.closePath();
      ctx.fillStyle = b.color;
      ctx.globalAlpha = b.glowAlpha * (1 + Math.sin(time * 0.007 + i) * 0.4);
      ctx.fill();

      // Sharp sleek dynamic interior structure
      ctx.beginPath();
      ctx.moveTo(b.size, 0);
      ctx.lineTo(-b.size * 0.7, -b.size * 0.4);
      ctx.lineTo(-b.size * 0.3, 0);
      ctx.lineTo(-b.size * 0.7, b.size * 0.4);
      ctx.closePath();
      ctx.fillStyle = '#FFFFFF';
      ctx.globalAlpha = 0.95;
      ctx.fill();

      ctx.restore();
    }
    ctx.globalAlpha = 1.0;
  }

  destroy() {
    super.destroy();
    this.boids = [];
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
    return 'Autonomous Flocking Swarm';
  }

  static get description() {
    return 'Flocking simulation of autonomous boids utilizing Reynolds algorithms. Hover your mouse to act as a dynamic repellent hawk that creates beautiful avoidance splits and sweeping group movements.';
  }

  static get vibe() {
    return 'Simulated';
  }

  static get sourceCode() {
    return `class BoidsFlockingSwarm {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.boids = [];
    this.mouse = { x: null, y: null, active: false, radius: 180 };
    this.colors = ['#00F0FF', '#8A2BE2', '#00D2FF', '#BD00FF'];
    this.maxSpeed = 2.5;
    this.maxForce = 0.05;
    this.visualRange = 80;
    this.separationDistance = 30;

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
    this.boids = [];
    const count = Math.min(160, Math.max(40, Math.floor((this.width * this.height) / 12000)));

    for (let i = 0; i < count; i++) {
      this.boids.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * this.maxSpeed,
        vy: (Math.random() - 0.5) * this.maxSpeed,
        size: Math.random() * 4 + 4,
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        glowAlpha: Math.random() * 0.15 + 0.1,
        trail: []
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
    this.ctx.fillStyle = '#060713';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Subtle atmospheric grid
    this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.03)';
    this.ctx.lineWidth = 1;
    const gridSize = 80;
    for (let x = 0; x < this.width; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.height);
      this.ctx.stroke();
    }
    for (let y = 0; y < this.height; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
      this.ctx.stroke();
    }

    const numBoids = this.boids.length;

    for (let i = 0; i < numBoids; i++) {
      const b = this.boids[i];
      let sepX = 0, sepY = 0, sepCount = 0;
      let alignX = 0, alignY = 0, alignCount = 0;
      let cohX = 0, cohY = 0, cohCount = 0;

      for (let j = 0; j < numBoids; j++) {
        if (i === j) continue;
        const other = this.boids[j];
        const dx = other.x - b.x;
        const dy = other.y - b.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < this.visualRange * this.visualRange) {
          const dist = Math.sqrt(distSq);

          if (dist < this.separationDistance && dist > 0) {
            sepX -= dx / dist;
            sepY -= dy / dist;
            sepCount++;
          }

          alignX += other.vx;
          alignY += other.vy;
          alignCount++;

          cohX += other.x;
          cohY += other.y;
          cohCount++;
        }
      }

      let steerX = 0;
      let steerY = 0;

      if (sepCount > 0) {
        sepX /= sepCount;
        sepY /= sepCount;
        const d = Math.hypot(sepX, sepY);
        if (d > 0) {
          sepX = (sepX / d) * this.maxSpeed - b.vx;
          sepY = (sepY / d) * this.maxSpeed - b.vy;
          steerX += sepX * 1.5;
          steerY += sepY * 1.5;
        }
      }

      if (alignCount > 0) {
        alignX /= alignCount;
        alignY /= alignCount;
        const d = Math.hypot(alignX, alignY);
        if (d > 0) {
          alignX = (alignX / d) * this.maxSpeed - b.vx;
          alignY = (alignY / d) * this.maxSpeed - b.vy;
          steerX += alignX * 1.0;
          steerY += alignY * 1.0;
        }
      }

      if (cohCount > 0) {
        cohX /= cohCount;
        cohY /= cohCount;
        let targetX = cohX - b.x;
        let targetY = cohY - b.y;
        const d = Math.hypot(targetX, targetY);
        if (d > 0) {
          targetX = (targetX / d) * this.maxSpeed - b.vx;
          targetY = (targetY / d) * this.maxSpeed - b.vy;
          steerX += targetX * 1.0;
          steerY += targetY * 1.0;
        }
      }

      if (this.mouse.active && this.mouse.x !== null) {
        const mDx = b.x - this.mouse.x;
        const mDy = b.y - this.mouse.y;
        const mDist = Math.hypot(mDx, mDy);

        if (mDist < this.mouse.radius && mDist > 0) {
          const strength = (this.mouse.radius - mDist) / this.mouse.radius;
          steerX += (mDx / mDist) * strength * 3.5;
          steerY += (mDy / mDist) * strength * 3.5;
        } else if (mDist < 400) {
          const strength = (400 - mDist) / 400;
          steerX += (-mDx / mDist) * strength * 0.4;
          steerY += (-mDy / mDist) * strength * 0.4;
        }
      }

      const forceMag = Math.hypot(steerX, steerY);
      if (forceMag > this.maxForce) {
        steerX = (steerX / forceMag) * this.maxForce;
        steerY = (steerY / forceMag) * this.maxForce;
      }

      b.vx += steerX;
      b.vy += steerY;

      const speed = Math.hypot(b.vx, b.vy);
      if (speed > this.maxSpeed) {
        b.vx = (b.vx / speed) * this.maxSpeed;
        b.vy = (b.vy / speed) * this.maxSpeed;
      }

      b.x += b.vx;
      b.y += b.vy;

      const margin = 20;
      if (b.x < -margin) b.x = this.width + margin;
      if (b.x > this.width + margin) b.x = -margin;
      if (b.y < -margin) b.y = this.height + margin;
      if (b.y > this.height + margin) b.y = -margin;

      b.trail.push({ x: b.x, y: b.y });
      if (b.trail.length > 8) b.trail.shift();

      if (b.trail.length > 1) {
        this.ctx.beginPath();
        this.ctx.moveTo(b.trail[0].x, b.trail[0].y);
        for (let t = 1; t < b.trail.length; t++) {
          this.ctx.lineTo(b.trail[t].x, b.trail[t].y);
        }
        this.ctx.strokeStyle = b.color;
        this.ctx.globalAlpha = 0.15;
        this.ctx.lineWidth = b.size * 0.4;
        this.ctx.stroke();
      }

      const angle = Math.atan2(b.vy, b.vx);
      this.ctx.save();
      this.ctx.translate(b.x, b.y);
      this.ctx.rotate(angle);

      this.ctx.beginPath();
      this.ctx.moveTo(b.size * 1.5, 0);
      this.ctx.lineTo(-b.size, -b.size * 0.7);
      this.ctx.lineTo(-b.size * 0.4, 0);
      this.ctx.lineTo(-b.size, b.size * 0.7);
      this.ctx.closePath();
      this.ctx.fillStyle = b.color;
      this.ctx.globalAlpha = b.glowAlpha * (1 + Math.sin(time * 0.007 + i) * 0.4);
      this.ctx.fill();

      this.ctx.beginPath();
      this.ctx.moveTo(b.size, 0);
      this.ctx.lineTo(-b.size * 0.7, -b.size * 0.4);
      this.ctx.lineTo(-b.size * 0.3, 0);
      this.ctx.lineTo(-b.size * 0.7, b.size * 0.4);
      this.ctx.closePath();
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.globalAlpha = 0.95;
      this.ctx.fill();

      this.ctx.restore();
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
