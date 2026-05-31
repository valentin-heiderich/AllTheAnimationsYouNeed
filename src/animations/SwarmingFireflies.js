import BaseAnimation from './BaseAnimation.js';

export default class SwarmingFireflies extends BaseAnimation {
  constructor() {
    super();
    this.fireflies = [];
    this.branches = [];
    this.mouse = { x: null, y: null, active: false, radius: 250 };
  }

  setup() {
    this.fireflies = [];
    this.branches = [];

    // Define 4 virtual tree branch nodes spread across the canvas coordinates
    const branchPositions = [
      { xPct: 0.25, yPct: 0.35, phase: 0 },
      { xPct: 0.5, yPct: 0.65, phase: Math.PI / 2 },
      { xPct: 0.75, yPct: 0.4, phase: Math.PI },
      { xPct: 0.45, yPct: 0.25, phase: Math.PI * 1.5 }
    ];

    branchPositions.forEach(pos => {
      this.branches.push({
        x: this.width * pos.xPct,
        y: this.height * pos.yPct,
        baseX: this.width * pos.xPct,
        baseY: this.height * pos.yPct,
        phase: pos.phase,
        wobbleRadius: 40 + Math.random() * 30
      });
    });

    // Scale firefly count with canvas area
    const count = Math.floor((this.width * this.height) / 10000) + 40;
    for (let i = 0; i < count; i++) {
      this.fireflies.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 2.5 + 1.5,
        branchIndex: Math.floor(Math.random() * this.branches.length),
        hue: 35 + Math.random() * 15, // Golden amber (35 to 50)
        pulseRate: 0.002 + Math.random() * 0.003,
        pulsePhase: Math.random() * Math.PI * 2,
        maxSpeed: Math.random() * 1.5 + 2.0,
        separationRadius: 20,
        attractionFactor: 0.015 + Math.random() * 0.02
      });
    }
  }

  resize(width, height) {
    super.resize(width, height);
    this.setup();
  }

  draw(ctx, time) {
    // Cozy deep midnight black/navy fill
    ctx.fillStyle = 'rgba(5, 7, 10, 0.22)';
    ctx.fillRect(0, 0, this.width, this.height);

    // Update branch coordinate wobbles (virtual branches swaying in wind)
    this.branches.forEach(branch => {
      branch.x = branch.baseX + Math.sin(time * 0.0008 + branch.phase) * branch.wobbleRadius;
      branch.y = branch.baseY + Math.cos(time * 0.0006 + branch.phase) * (branch.wobbleRadius * 0.7);
    });

    // Update and draw fireflies
    this.fireflies.forEach((ff, idx) => {
      let targetX = this.branches[ff.branchIndex].x;
      let targetY = this.branches[ff.branchIndex].y;
      let isAttractedToMouse = false;

      // Mouse acts as a super-attractant in a large radius
      if (this.mouse.active && this.mouse.x !== null) {
        const dx = this.mouse.x - ff.x;
        const dy = this.mouse.y - ff.y;
        const dist = Math.hypot(dx, dy);

        if (dist < this.mouse.radius) {
          targetX = this.mouse.x;
          targetY = this.mouse.y;
          isAttractedToMouse = true;
        }
      }

      // Gravitational attraction force vector
      const ax = (targetX - ff.x) * (isAttractedToMouse ? 0.065 : ff.attractionFactor);
      const ay = (targetY - ff.y) * (isAttractedToMouse ? 0.065 : ff.attractionFactor);
      ff.vx += ax;
      ff.vy += ay;

      // Add a slight noise turbulence to make flight path look biological/organic
      ff.vx += Math.sin(time * 0.005 + ff.pulsePhase) * 0.12;
      ff.vy += Math.cos(time * 0.004 + ff.pulsePhase) * 0.12;

      // Separation flocking constraint: avoid colliding into each other too densely
      for (let j = 0; j < this.fireflies.length; j++) {
        if (idx === j) continue;
        const other = this.fireflies[j];
        const dx = other.x - ff.x;
        const dy = other.y - ff.y;
        const dist = Math.hypot(dx, dy);

        if (dist < ff.separationRadius) {
          // Push away from neighbor
          const force = (ff.separationRadius - dist) / ff.separationRadius;
          ff.vx -= (dx / (dist || 1)) * force * 0.45;
          ff.vy -= (dy / (dist || 1)) * force * 0.45;
        }
      }

      // Speed governor limit
      const currentSpeed = Math.hypot(ff.vx, ff.vy);
      const limit = isAttractedToMouse ? ff.maxSpeed * 1.6 : ff.maxSpeed;
      if (currentSpeed > limit) {
        ff.vx = (ff.vx / currentSpeed) * limit;
        ff.vy = (ff.vy / currentSpeed) * limit;
      }

      // Apply positions
      ff.x += ff.vx;
      ff.y += ff.vy;

      // Wrap canvas boundaries gently
      if (ff.x < -20) ff.x = this.width + 20;
      if (ff.x > this.width + 20) ff.x = -20;
      if (ff.y < -20) ff.y = this.height + 20;
      if (ff.y > this.height + 20) ff.y = -20;

      // Glowing pulse logic (firefly flashing rhythm)
      const pulse = Math.sin(time * ff.pulseRate + ff.pulsePhase);
      const brightness = Math.max(0.1, (pulse + 1) / 2); // 0.1 to 1.0
      const size = ff.size * (0.85 + pulse * 0.15);

      // Render firefly glow spot
      ctx.beginPath();
      ctx.fillStyle = `hsla(${ff.hue}, 100%, 65%, ${brightness})`;
      ctx.shadowBlur = size * 3.5;
      ctx.shadowColor = `hsla(${ff.hue}, 100%, 55%, ${brightness})`;
      ctx.arc(ff.x, ff.y, size, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.shadowBlur = 0;
  }

  destroy() {
    super.destroy();
    this.fireflies = [];
    this.branches = [];
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
    return 'Swarming Fireflies';
  }

  static get description() {
    return 'A simulated golden-amber flock of swarming fireflies circling virtual tree branches. Blinking in rhythmic unison, they aggregate organically around your cursor when close.';
  }

  static get vibe() {
    return 'Simulated';
  }

  static get sourceCode() {
    return `class SwarmingFireflies {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.fireflies = [];
    this.branches = [];
    this.mouse = { x: null, y: null, active: false, radius: 250 };
    
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
    this.branches = [];

    const branchPositions = [
      { xPct: 0.25, yPct: 0.35, phase: 0 },
      { xPct: 0.5, yPct: 0.65, phase: Math.PI / 2 },
      { xPct: 0.75, yPct: 0.4, phase: Math.PI },
      { xPct: 0.45, yPct: 0.25, phase: Math.PI * 1.5 }
    ];

    branchPositions.forEach(pos => {
      this.branches.push({
        x: this.width * pos.xPct,
        y: this.height * pos.yPct,
        baseX: this.width * pos.xPct,
        baseY: this.height * pos.yPct,
        phase: pos.phase,
        wobbleRadius: 40 + Math.random() * 30
      });
    });

    const count = Math.floor((this.width * this.height) / 10000) + 40;
    for (let i = 0; i < count; i++) {
      this.fireflies.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 2.5 + 1.5,
        branchIndex: Math.floor(Math.random() * this.branches.length),
        hue: 35 + Math.random() * 15,
        pulseRate: 0.002 + Math.random() * 0.003,
        pulsePhase: Math.random() * Math.PI * 2,
        maxSpeed: Math.random() * 1.5 + 2.0,
        separationRadius: 20,
        attractionFactor: 0.015 + Math.random() * 0.02
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
    this.ctx.fillStyle = 'rgba(5, 7, 10, 0.22)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.branches.forEach(branch => {
      branch.x = branch.baseX + Math.sin(time * 0.0008 + branch.phase) * branch.wobbleRadius;
      branch.y = branch.baseY + Math.cos(time * 0.0006 + branch.phase) * (branch.wobbleRadius * 0.7);
    });

    this.fireflies.forEach((ff, idx) => {
      let targetX = this.branches[ff.branchIndex].x;
      let targetY = this.branches[ff.branchIndex].y;
      let isAttractedToMouse = false;

      if (this.mouse.active && this.mouse.x !== null) {
        const dx = this.mouse.x - ff.x;
        const dy = this.mouse.y - ff.y;
        const dist = Math.hypot(dx, dy);

        if (dist < this.mouse.radius) {
          targetX = this.mouse.x;
          targetY = this.mouse.y;
          isAttractedToMouse = true;
        }
      }

      const ax = (targetX - ff.x) * (isAttractedToMouse ? 0.065 : ff.attractionFactor);
      const ay = (targetY - ff.y) * (isAttractedToMouse ? 0.065 : ff.attractionFactor);
      ff.vx += ax;
      ff.vy += ay;

      ff.vx += Math.sin(time * 0.005 + ff.pulsePhase) * 0.12;
      ff.vy += Math.cos(time * 0.004 + ff.pulsePhase) * 0.12;

      for (let j = 0; j < this.fireflies.length; j++) {
        if (idx === j) continue;
        const other = this.fireflies[j];
        const dx = other.x - ff.x;
        const dy = other.y - ff.y;
        const dist = Math.hypot(dx, dy);

        if (dist < ff.separationRadius) {
          const force = (ff.separationRadius - dist) / ff.separationRadius;
          ff.vx -= (dx / (dist || 1)) * force * 0.45;
          ff.vy -= (dy / (dist || 1)) * force * 0.45;
        }
      }

      const currentSpeed = Math.hypot(ff.vx, ff.vy);
      const limit = isAttractedToMouse ? ff.maxSpeed * 1.6 : ff.maxSpeed;
      if (currentSpeed > limit) {
        ff.vx = (ff.vx / currentSpeed) * limit;
        ff.vy = (ff.vy / currentSpeed) * limit;
      }

      ff.x += ff.vx;
      ff.y += ff.vy;

      if (ff.x < -20) ff.x = this.width + 20;
      if (ff.x > this.width + 20) ff.x = -20;
      if (ff.y < -20) ff.y = this.height + 20;
      if (ff.y > this.height + 20) ff.y = -20;

      const pulse = Math.sin(time * ff.pulseRate + ff.pulsePhase);
      const brightness = Math.max(0.1, (pulse + 1) / 2);
      const size = ff.size * (0.85 + pulse * 0.15);

      this.ctx.beginPath();
      this.ctx.fillStyle = \`hsla(\${ff.hue}, 100%, 65%, \${brightness})\`;
      this.ctx.shadowBlur = size * 3.5;
      this.ctx.shadowColor = \`hsla(\${ff.hue}, 100%, 55%, \${brightness})\`;
      this.ctx.arc(ff.x, ff.y, size, 0, Math.PI * 2);
      this.ctx.fill();
    });

    this.ctx.shadowBlur = 0;
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
