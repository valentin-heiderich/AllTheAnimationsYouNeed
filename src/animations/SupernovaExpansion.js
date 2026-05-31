import BaseAnimation from './BaseAnimation.js';

export default class SupernovaExpansion extends BaseAnimation {
  constructor() {
    super();
    this.cores = [];
    this.particles = [];
    this.mouse = { x: null, y: null, active: false, radius: 80 };
    this.colors = {
      orange: '#FF4500', // Vibrant orange
      gold: '#FFD700',   // Rich gold
      magenta: '#FF007F',// Glowing magenta
      white: '#FFFFFF',
      bg: '#040206'      // Cosmic violet-black
    };
  }

  setup() {
    this.cores = [];
    this.particles = [];
    
    // Scale count of supernova star cores with viewport size
    const count = Math.min(
      8,
      Math.max(3, Math.floor((this.width * this.height) / 160000))
    );

    for (let i = 0; i < count; i++) {
      this.cores.push(this.createCore(
        Math.random() * this.width,
        Math.random() * this.height
      ));
    }
  }

  createCore(x, y) {
    return {
      x, y,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      baseRadius: Math.random() * 12 + 10,
      radius: 0,
      state: 'pulse', // 'pulse' | 'collapse' | 'explode' | 'regenerating'
      stateTime: 0,
      pulseSpeed: Math.random() * 0.003 + 0.002,
      maxPulseSize: Math.random() * 6 + 4,
      collapseDuration: 120, // Frames of warning vibration
      regenerationTime: 300, // Frames to reborn
      wobbleOffset: Math.random() * 100
    };
  }

  resize(width, height) {
    super.resize(width, height);
    this.cores.forEach(c => {
      if (c.x > width) c.x = Math.random() * width;
      if (c.y > height) c.y = Math.random() * height;
    });
  }

  draw(ctx, time) {
    // Elegant cosmic nebula void background
    ctx.fillStyle = this.colors.bg;
    ctx.fillRect(0, 0, this.width, this.height);

    // Update and draw expanding gas shockwave particles
    ctx.globalCompositeOperation = 'screen';
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.97; // Drag/friction slowing down gas expansion
      p.vy *= 0.97;
      p.life -= p.decay;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (1.0 + (1 - p.life) * 2), 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life * p.alpha;
      ctx.fill();
    }

    // Update and draw star cores
    this.cores.forEach((c) => {
      c.stateTime++;

      // Drift in cosmic space
      c.x += c.vx;
      c.y += c.vy;

      // Soft bounce boundaries
      if (c.x < 50 || c.x > this.width - 50) c.vx = -c.vx;
      if (c.y < 50 || c.y > this.height - 50) c.vy = -c.vy;

      // 1. Mouse trigger: Proximity accelerates collapse warning state
      if (this.mouse.active && this.mouse.x !== null && c.state === 'pulse') {
        const dMouse = Math.hypot(this.mouse.x - c.x, this.mouse.y - c.y);
        if (dMouse < this.mouse.radius + c.baseRadius) {
          c.state = 'collapse';
          c.stateTime = 0;
        }
      }

      // 2. Cosmic core state machine
      if (c.state === 'pulse') {
        // Natural glowing rhythm
        const wave = Math.sin(time * c.pulseSpeed + c.wobbleOffset);
        c.radius = c.baseRadius + wave * c.maxPulseSize;

        // Render pulsing glassmorphic layered aura
        const grad = ctx.createRadialGradient(c.x, c.y, 2, c.x, c.y, c.radius * 2.8);
        grad.addColorStop(0, '#FFFFFF');
        grad.addColorStop(0.15, this.colors.gold);
        grad.addColorStop(0.45, this.colors.orange);
        grad.addColorStop(0.8, 'rgba(255, 0, 127, 0.05)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.beginPath();
        ctx.arc(c.x, c.y, c.radius * 2.8, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.globalAlpha = 0.55 + wave * 0.15;
        ctx.fill();

        // Core central spark
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.radius * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.globalAlpha = 0.9;
        ctx.fill();

        // Natural random trigger to explode
        if (Math.random() < 0.0006) {
          c.state = 'collapse';
          c.stateTime = 0;
        }

      } else if (c.state === 'collapse') {
        // Star draws all energy inward - warning vibration
        const progress = c.stateTime / c.collapseDuration;
        const shrinkFactor = 1.0 - progress;

        // Severe high-frequency collapse shake
        const shakeX = (Math.random() - 0.5) * 4.5 * progress;
        const shakeY = (Math.random() - 0.5) * 4.5 * progress;

        c.radius = Math.max(2, c.baseRadius * shrinkFactor);

        // Render collapse core (glowing warning gold/magenta transitions)
        const grad = ctx.createRadialGradient(c.x + shakeX, c.y + shakeY, 0.5, c.x + shakeX, c.y + shakeY, c.baseRadius * 3.5 * shrinkFactor + 5);
        grad.addColorStop(0, '#FFFFFF');
        grad.addColorStop(0.3, this.colors.gold);
        grad.addColorStop(0.7, this.colors.magenta);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.beginPath();
        ctx.arc(c.x + shakeX, c.y + shakeY, c.baseRadius * 3.5 * shrinkFactor + 5, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.globalAlpha = 0.8;
        ctx.fill();

        // White warning filament
        ctx.beginPath();
        ctx.arc(c.x + shakeX, c.y + shakeY, c.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.globalAlpha = 1.0;
        ctx.fill();

        if (c.stateTime >= c.collapseDuration) {
          c.state = 'explode';
          c.stateTime = 0;
        }

      } else if (c.state === 'explode') {
        // SUPERNOVA BURST! Eject expanding stellar gas shell
        const pCount = 70 + Math.floor(Math.random() * 40);
        const palette = [this.colors.orange, this.colors.gold, this.colors.magenta, '#FFFFFF'];

        for (let k = 0; k < pCount; k++) {
          const angle = Math.random() * Math.PI * 2;
          const force = Math.random() * 6.5 + 2.5;
          const size = Math.random() * 3.5 + 1.5;
          const decay = Math.random() * 0.015 + 0.008;

          this.particles.push({
            x: c.x,
            y: c.y,
            vx: Math.cos(angle) * force,
            vy: Math.sin(angle) * force,
            color: palette[Math.floor(Math.random() * palette.length)],
            size,
            decay,
            life: 1.0,
            alpha: Math.random() * 0.6 + 0.4
          });
        }

        // Star core is blown away - enters dark regeneration black hole phase
        c.state = 'regenerating';
        c.stateTime = 0;

      } else if (c.state === 'regenerating') {
        // Faint residual singularity black hole core shrinking/vortexing
        const progress = c.stateTime / c.regenerationTime;

        if (progress < 0.25) {
          // Gravitational ring vortex drawing residual dust
          ctx.beginPath();
          ctx.arc(c.x, c.y, 40 * (1.0 - progress * 4.0), 0, Math.PI * 2);
          ctx.strokeStyle = this.colors.magenta;
          ctx.lineWidth = 1;
          ctx.globalAlpha = 0.3 * (1.0 - progress * 4.0);
          ctx.stroke();
        }

        if (c.stateTime >= c.regenerationTime) {
          // Relocate star and rebirth pulsing star core!
          c.x = Math.random() * this.width;
          c.y = Math.random() * this.height;
          c.state = 'pulse';
          c.stateTime = 0;
        }
      }
    });

    // Reset composite operation to standard source-over
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1.0;
  }

  destroy() {
    super.destroy();
    this.cores = [];
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
    return 'Supernova Stellar Expansion';
  }

  static get description() {
    return 'Cosmic system of floating star cores. Watch star cores collapse into white-hot singularities, then explode into gigantic, radial expanding gas shockwaves. Hover near cores to manually trigger nuclear fusion collapse.';
  }

  static get vibe() {
    return 'Cosmic';
  }

  static get sourceCode() {
    return `class SupernovaExpansion {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.cores = [];
    this.particles = [];
    this.mouse = { x: null, y: null, active: false, radius: 80 };
    this.colors = {
      orange: '#FF4500',
      gold: '#FFD700',
      magenta: '#FF007F',
      white: '#FFFFFF',
      bg: '#040206'
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
    this.cores = [];
    this.particles = [];
    const count = Math.min(8, Math.max(3, Math.floor((this.width * this.height) / 160000)));

    for (let i = 0; i < count; i++) {
      this.cores.push(this.createCore(Math.random() * this.width, Math.random() * this.height));
    }
  }

  createCore(x, y) {
    return {
      x, y,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      baseRadius: Math.random() * 12 + 10,
      radius: 0,
      state: 'pulse',
      stateTime: 0,
      pulseSpeed: Math.random() * 0.003 + 0.002,
      maxPulseSize: Math.random() * 6 + 4,
      collapseDuration: 120,
      regenerationTime: 300,
      wobbleOffset: Math.random() * 100
    };
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
    this.ctx.fillStyle = this.colors.bg;
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.globalCompositeOperation = 'screen';
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.97;
      p.vy *= 0.97;
      p.life -= p.decay;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size * (1.0 + (1 - p.life) * 2), 0, Math.PI * 2);
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.life * p.alpha;
      this.ctx.fill();
    }

    this.cores.forEach((c) => {
      c.stateTime++;
      c.x += c.vx;
      c.y += c.vy;

      if (c.x < 50 || c.x > this.width - 50) c.vx = -c.vx;
      if (c.y < 50 || c.y > this.height - 50) c.vy = -c.vy;

      if (this.mouse.active && this.mouse.x !== null && c.state === 'pulse') {
        const dMouse = Math.hypot(this.mouse.x - c.x, this.mouse.y - c.y);
        if (dMouse < this.mouse.radius + c.baseRadius) {
          c.state = 'collapse';
          c.stateTime = 0;
        }
      }

      if (c.state === 'pulse') {
        const wave = Math.sin(time * c.pulseSpeed + c.wobbleOffset);
        c.radius = c.baseRadius + wave * c.maxPulseSize;

        const grad = this.ctx.createRadialGradient(c.x, c.y, 2, c.x, c.y, c.radius * 2.8);
        grad.addColorStop(0, '#FFFFFF');
        grad.addColorStop(0.15, this.colors.gold);
        grad.addColorStop(0.45, this.colors.orange);
        grad.addColorStop(0.8, 'rgba(255, 0, 127, 0.05)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        this.ctx.beginPath();
        this.ctx.arc(c.x, c.y, c.radius * 2.8, 0, Math.PI * 2);
        this.ctx.fillStyle = grad;
        this.ctx.globalAlpha = 0.55 + wave * 0.15;
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.arc(c.x, c.y, c.radius * 0.35, 0, Math.PI * 2);
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.globalAlpha = 0.9;
        this.ctx.fill();

        if (Math.random() < 0.0006) {
          c.state = 'collapse';
          c.stateTime = 0;
        }

      } else if (c.state === 'collapse') {
        const progress = c.stateTime / c.collapseDuration;
        const shrinkFactor = 1.0 - progress;
        const shakeX = (Math.random() - 0.5) * 4.5 * progress;
        const shakeY = (Math.random() - 0.5) * 4.5 * progress;

        c.radius = Math.max(2, c.baseRadius * shrinkFactor);

        const grad = this.ctx.createRadialGradient(c.x + shakeX, c.y + shakeY, 0.5, c.x + shakeX, c.y + shakeY, c.baseRadius * 3.5 * shrinkFactor + 5);
        grad.addColorStop(0, '#FFFFFF');
        grad.addColorStop(0.3, this.colors.gold);
        grad.addColorStop(0.7, this.colors.magenta);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        this.ctx.beginPath();
        this.ctx.arc(c.x + shakeX, c.y + shakeY, c.baseRadius * 3.5 * shrinkFactor + 5, 0, Math.PI * 2);
        this.ctx.fillStyle = grad;
        this.ctx.globalAlpha = 0.8;
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.arc(c.x + shakeX, c.y + shakeY, c.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.globalAlpha = 1.0;
        this.ctx.fill();

        if (c.stateTime >= c.collapseDuration) {
          c.state = 'explode';
          c.stateTime = 0;
        }

      } else if (c.state === 'explode') {
        const pCount = 70 + Math.floor(Math.random() * 40);
        const palette = [this.colors.orange, this.colors.gold, this.colors.magenta, '#FFFFFF'];

        for (let k = 0; k < pCount; k++) {
          const angle = Math.random() * Math.PI * 2;
          const force = Math.random() * 6.5 + 2.5;
          this.particles.push({
            x: c.x,
            y: c.y,
            vx: Math.cos(angle) * force,
            vy: Math.sin(angle) * force,
            color: palette[Math.floor(Math.random() * palette.length)],
            size: Math.random() * 3.5 + 1.5,
            decay: Math.random() * 0.015 + 0.008,
            life: 1.0,
            alpha: Math.random() * 0.6 + 0.4
          });
        }

        c.state = 'regenerating';
        c.stateTime = 0;

      } else if (c.state === 'regenerating') {
        const progress = c.stateTime / c.regenerationTime;
        if (progress < 0.25) {
          this.ctx.beginPath();
          this.ctx.arc(c.x, c.y, 40 * (1.0 - progress * 4.0), 0, Math.PI * 2);
          this.ctx.strokeStyle = this.colors.magenta;
          this.ctx.lineWidth = 1;
          this.ctx.globalAlpha = 0.3 * (1.0 - progress * 4.0);
          this.ctx.stroke();
        }

        if (c.stateTime >= c.regenerationTime) {
          c.x = Math.random() * this.width;
          c.y = Math.random() * this.height;
          c.state = 'pulse';
          c.stateTime = 0;
        }
      }
    });

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
