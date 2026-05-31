import BaseAnimation from './BaseAnimation.js';

export default class SoftSnowStorm extends BaseAnimation {
  constructor() {
    super();
    this.particles = [];
    this.terrain = [];
    this.terrainStep = 6;
    this.mouse = { x: null, y: null, active: false, radius: 150 };
    this.snowColors = ['#FFFFFF', '#E8F5FF', '#D2EAFF', '#F0F8FF'];
  }

  setup() {
    this.particles = [];
    // Scale count relative to viewport area
    const densityFactor = 4000;
    const count = Math.min(
      350,
      Math.max(80, Math.floor((this.width * this.height) / densityFactor))
    );

    for (let i = 0; i < count; i++) {
      this.particles.push(this.createSnowflake(Math.random() * this.height));
    }

    // Initialize terrain
    const columns = Math.ceil(this.width / this.terrainStep);
    this.terrain = new Float32Array(columns);
  }

  createSnowflake(initialY = -10) {
    const size = Math.random() * 2.5 + 0.8;
    return {
      x: Math.random() * this.width,
      y: initialY,
      radius: size,
      speedY: Math.random() * 0.8 + 0.5 + (size * 0.2), // larger falls slightly faster
      speedX: (Math.random() - 0.5) * 0.3,
      swingPhase: Math.random() * Math.PI * 2,
      swingSpeed: Math.random() * 0.02 + 0.01,
      swingAmplitude: Math.random() * 0.5 + 0.2,
      opacity: Math.random() * 0.55 + 0.35,
      color: this.snowColors[Math.floor(Math.random() * this.snowColors.length)]
    };
  }

  resize(width, height) {
    const oldColumns = this.terrain ? this.terrain.length : 0;
    const oldTerrain = this.terrain;

    super.resize(width, height);

    // Re-initialize or map terrain
    const newColumns = Math.ceil(width / this.terrainStep);
    this.terrain = new Float32Array(newColumns);

    if (oldTerrain && oldColumns > 0) {
      for (let i = 0; i < newColumns; i++) {
        // Map new columns to old columns to retain accumulated snow
        const oldIndex = Math.floor((i / newColumns) * oldColumns);
        this.terrain[i] = oldTerrain[oldIndex] || 0;
      }
    }

    // Wrap particles to the new canvas boundaries
    this.particles.forEach(p => {
      if (p.x > width) p.x = Math.random() * width;
      if (p.y > height) p.y = Math.random() * height;
    });
  }

  draw(ctx, time) {
    // Beautiful deep midnight-blue sky with gradient hint
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.height);
    skyGrad.addColorStop(0, '#060a16');
    skyGrad.addColorStop(1, '#0e162d');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Global wind current
    const wind = Math.sin(time * 0.0003) * 0.4;

    // 1. Update and draw snowflakes
    this.particles.forEach(p => {
      p.swingPhase += p.swingSpeed;
      
      // Calculate wind drift & sine swinging
      let dx = wind + Math.sin(p.swingPhase) * p.swingAmplitude + p.speedX;
      let dy = p.speedY;

      // Mouse displacement: blow snow away
      if (this.mouse.active && this.mouse.x !== null) {
        const mx = this.mouse.x;
        const my = this.mouse.y;
        const distY = p.y - my;
        const distX = p.x - mx;
        const dist = Math.hypot(distX, distY);

        if (dist < this.mouse.radius) {
          const force = (this.mouse.radius - dist) / this.mouse.radius;
          const angle = Math.atan2(distY, distX);
          // Apply outward blast force
          dx += Math.cos(angle) * force * 4.5;
          dy += Math.sin(angle) * force * 2.0;
        }
      }

      p.x += dx;
      p.y += dy;

      // Get terrain height at current X
      const colIndex = Math.floor(p.x / this.terrainStep);
      let terrainHeight = 0;
      if (colIndex >= 0 && colIndex < this.terrain.length) {
        terrainHeight = this.terrain[colIndex];
      }

      // Check collision with bottom terrain
      const collisionY = this.height - terrainHeight;
      if (p.y >= collisionY) {
        // Accumulate in terrain if within bounds
        if (colIndex >= 0 && colIndex < this.terrain.length) {
          // Add snow volume (wider particles add slightly more)
          const addedSnow = p.radius * 0.35;
          this.terrain[colIndex] += addedSnow;
          
          // Smooth snow out to adjacent columns (diffusion)
          this.smoothTerrain(colIndex);
        }

        // Reset particle to top
        const resetP = this.createSnowflake(-10);
        Object.assign(p, resetP);
      }

      // Left/Right wrap-around
      if (p.x < -10) p.x = this.width + 10;
      if (p.x > this.width + 10) p.x = -10;

      // Draw snowflake
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity;
      ctx.fill();
    });

    // 2. Interactive terrain erosion (mouse blows away bottom snow)
    if (this.mouse.active && this.mouse.x !== null) {
      const mx = this.mouse.x;
      const my = this.mouse.y;
      
      // If mouse is near the bottom, it blows/melts accumulated snow
      if (my > this.height - this.mouse.radius) {
        const mouseCol = Math.floor(mx / this.terrainStep);
        const radiusInCols = Math.ceil(this.mouse.radius / this.terrainStep);
        
        for (let i = -radiusInCols; i <= radiusInCols; i++) {
          const col = mouseCol + i;
          if (col >= 0 && col < this.terrain.length) {
            const colX = col * this.terrainStep;
            const dist = Math.abs(mx - colX);
            if (dist < this.mouse.radius) {
              const meltForce = (this.mouse.radius - dist) / this.mouse.radius * 0.35;
              this.terrain[col] = Math.max(0, this.terrain[col] - meltForce);
            }
          }
        }
      }
    }

    // 3. Terrain slow decay (melting in warm air so it doesn't pile up forever)
    for (let i = 0; i < this.terrain.length; i++) {
      if (this.terrain[i] > 0) {
        this.terrain[i] -= 0.005; // tiny continuous melt rate
        if (this.terrain[i] < 0) this.terrain[i] = 0;
      }
    }

    // 4. Draw snow terrain path
    if (this.terrain.length > 0) {
      ctx.beginPath();
      ctx.moveTo(0, this.height);

      for (let i = 0; i < this.terrain.length; i++) {
        const x = i * this.terrainStep;
        const y = this.height - this.terrain[i];
        
        // Smooth line using quadratic curves to neighbors
        if (i === 0) {
          ctx.lineTo(x, y);
        } else {
          const prevX = (i - 1) * this.terrainStep;
          const prevY = this.height - this.terrain[i - 1];
          const midX = (prevX + x) / 2;
          const midY = (prevY + y) / 2;
          ctx.quadraticCurveTo(prevX, prevY, midX, midY);
        }
      }
      ctx.lineTo(this.width, this.height);
      ctx.closePath();

      // Soft snowy blue/white gradient for accumulated snow banks
      const snowGrad = ctx.createLinearGradient(0, this.height - 80, 0, this.height);
      snowGrad.addColorStop(0, 'rgba(240, 248, 255, 0.95)');
      snowGrad.addColorStop(0.3, 'rgba(218, 238, 255, 0.95)');
      snowGrad.addColorStop(1, 'rgba(180, 215, 245, 0.98)');
      
      ctx.fillStyle = snowGrad;
      ctx.fill();

      // Add a subtle glowing top line to the snow drifts
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    ctx.globalAlpha = 1.0;
  }

  // Smooth terrain heights to create realistic sand/snow piles (angle of repose)
  smoothTerrain(index) {
    const range = 4; // adjacent columns to distribute
    for (let r = 1; r <= range; r++) {
      const left = index - r;
      const right = index + r;

      if (left >= 0) {
        const diff = this.terrain[left + 1] - this.terrain[left];
        if (diff > 1.5) {
          const slide = diff * 0.35;
          this.terrain[left + 1] -= slide;
          this.terrain[left] += slide;
        }
      }
      if (right < this.terrain.length) {
        const diff = this.terrain[right - 1] - this.terrain[right];
        if (diff > 1.5) {
          const slide = diff * 0.35;
          this.terrain[right - 1] -= slide;
          this.terrain[right] += slide;
        }
      }
    }
  }

  destroy() {
    this.particles = [];
    this.terrain = [];
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
    return 'Soft Snow Storm';
  }

  static get description() {
    return 'Drifting snowflakes caught in shifting wind currents. Snow accumulates into soft physical terrain banks along the screen floor. Moving your cursor blows falling snowflakes away and melts the accumulated snowbanks.';
  }

  static get vibe() {
    return 'Atmospheric';
  }

  static get sourceCode() {
    return `class SoftSnowStorm {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.terrain = [];
    this.terrainStep = 6;
    this.mouse = { x: null, y: null, active: false, radius: 150 };
    this.snowColors = ['#FFFFFF', '#E8F5FF', '#D2EAFF', '#F0F8FF'];
    
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
    const densityFactor = 4000;
    const count = Math.min(350, Math.max(80, Math.floor((this.width * this.height) / densityFactor)));

    for (let i = 0; i < count; i++) {
      this.particles.push(this.createSnowflake(Math.random() * this.height));
    }

    const columns = Math.ceil(this.width / this.terrainStep);
    this.terrain = new Float32Array(columns);
  }

  createSnowflake(initialY = -10) {
    const size = Math.random() * 2.5 + 0.8;
    return {
      x: Math.random() * this.width,
      y: initialY,
      radius: size,
      speedY: Math.random() * 0.8 + 0.5 + (size * 0.2),
      speedX: (Math.random() - 0.5) * 0.3,
      swingPhase: Math.random() * Math.PI * 2,
      swingSpeed: Math.random() * 0.02 + 0.01,
      swingAmplitude: Math.random() * 0.5 + 0.2,
      opacity: Math.random() * 0.55 + 0.35,
      color: this.snowColors[Math.floor(Math.random() * this.snowColors.length)]
    };
  }

  resize() {
    this.dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    const oldColumns = this.terrain ? this.terrain.length : 0;
    const oldTerrain = this.terrain;

    this.width = rect.width;
    this.height = rect.height;
    
    this.canvas.width = rect.width * this.dpr;
    this.canvas.height = rect.height * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);

    const newColumns = Math.ceil(this.width / this.terrainStep);
    this.terrain = new Float32Array(newColumns);

    if (oldTerrain && oldColumns > 0) {
      for (let i = 0; i < newColumns; i++) {
        const oldIndex = Math.floor((i / newColumns) * oldColumns);
        this.terrain[i] = oldTerrain[oldIndex] || 0;
      }
    }

    this.particles.forEach(p => {
      if (p.x > this.width) p.x = Math.random() * this.width;
      if (p.y > this.height) p.y = Math.random() * this.height;
    });
  }

  animate(time = 0) {
    const skyGrad = this.ctx.createLinearGradient(0, 0, 0, this.height);
    skyGrad.addColorStop(0, '#060a16');
    skyGrad.addColorStop(1, '#0e162d');
    this.ctx.fillStyle = skyGrad;
    this.ctx.fillRect(0, 0, this.width, this.height);

    const wind = Math.sin(time * 0.0003) * 0.4;

    this.particles.forEach(p => {
      p.swingPhase += p.swingSpeed;
      let dx = wind + Math.sin(p.swingPhase) * p.swingAmplitude + p.speedX;
      let dy = p.speedY;

      if (this.mouse.active && this.mouse.x !== null) {
        const distY = p.y - this.mouse.y;
        const distX = p.x - this.mouse.x;
        const dist = Math.hypot(distX, distY);

        if (dist < this.mouse.radius) {
          const force = (this.mouse.radius - dist) / this.mouse.radius;
          const angle = Math.atan2(distY, distX);
          dx += Math.cos(angle) * force * 4.5;
          dy += Math.sin(angle) * force * 2.0;
        }
      }

      p.x += dx;
      p.y += dy;

      const colIndex = Math.floor(p.x / this.terrainStep);
      let terrainHeight = 0;
      if (colIndex >= 0 && colIndex < this.terrain.length) {
        terrainHeight = this.terrain[colIndex];
      }

      const collisionY = this.height - terrainHeight;
      if (p.y >= collisionY) {
        if (colIndex >= 0 && colIndex < this.terrain.length) {
          this.terrain[colIndex] += p.radius * 0.35;
          this.smoothTerrain(colIndex);
        }
        const resetP = this.createSnowflake(-10);
        Object.assign(p, resetP);
      }

      if (p.x < -10) p.x = this.width + 10;
      if (p.x > this.width + 10) p.x = -10;

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.opacity;
      this.ctx.fill();
    });

    if (this.mouse.active && this.mouse.x !== null) {
      if (this.mouse.y > this.height - this.mouse.radius) {
        const mouseCol = Math.floor(this.mouse.x / this.terrainStep);
        const radiusInCols = Math.ceil(this.mouse.radius / this.terrainStep);
        
        for (let i = -radiusInCols; i <= radiusInCols; i++) {
          const col = mouseCol + i;
          if (col >= 0 && col < this.terrain.length) {
            const colX = col * this.terrainStep;
            const dist = Math.abs(this.mouse.x - colX);
            if (dist < this.mouse.radius) {
              const meltForce = (this.mouse.radius - dist) / this.mouse.radius * 0.35;
              this.terrain[col] = Math.max(0, this.terrain[col] - meltForce);
            }
          }
        }
      }
    }

    for (let i = 0; i < this.terrain.length; i++) {
      if (this.terrain[i] > 0) {
        this.terrain[i] -= 0.005;
        if (this.terrain[i] < 0) this.terrain[i] = 0;
      }
    }

    if (this.terrain.length > 0) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, this.height);

      for (let i = 0; i < this.terrain.length; i++) {
        const x = i * this.terrainStep;
        const y = this.height - this.terrain[i];
        
        if (i === 0) {
          this.ctx.lineTo(x, y);
        } else {
          const prevX = (i - 1) * this.terrainStep;
          const prevY = this.height - this.terrain[i - 1];
          const midX = (prevX + x) / 2;
          const midY = (prevY + y) / 2;
          this.ctx.quadraticCurveTo(prevX, prevY, midX, midY);
        }
      }
      this.ctx.lineTo(this.width, this.height);
      this.ctx.closePath();

      const snowGrad = this.ctx.createLinearGradient(0, this.height - 80, 0, this.height);
      snowGrad.addColorStop(0, 'rgba(240, 248, 255, 0.95)');
      snowGrad.addColorStop(0.3, 'rgba(218, 238, 255, 0.95)');
      snowGrad.addColorStop(1, 'rgba(180, 215, 245, 0.98)');
      
      this.ctx.fillStyle = snowGrad;
      this.ctx.fill();

      this.ctx.strokeStyle = '#FFFFFF';
      this.ctx.lineWidth = 1.5;
      this.ctx.stroke();
    }

    this.ctx.globalAlpha = 1.0;
    requestAnimationFrame((t) => this.animate(t));
  }

  smoothTerrain(index) {
    const range = 4;
    for (let r = 1; r <= range; r++) {
      const left = index - r;
      const right = index + r;

      if (left >= 0) {
        const diff = this.terrain[left + 1] - this.terrain[left];
        if (diff > 1.5) {
          const slide = diff * 0.35;
          this.terrain[left + 1] -= slide;
          this.terrain[left] += slide;
        }
      }
      if (right < this.terrain.length) {
        const diff = this.terrain[right - 1] - this.terrain[right];
        if (diff > 1.5) {
          const slide = diff * 0.35;
          this.terrain[right - 1] -= slide;
          this.terrain[right] += slide;
        }
      }
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
