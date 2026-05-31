import BaseAnimation from './BaseAnimation.js';

export default class DandelionWindSeeds extends BaseAnimation {
  constructor() {
    super();
    this.seeds = [];
    this.dandelionCenter = { x: 0, y: 0 };
    this.baseCenter = { x: 0, y: 0 };
    this.stemLength = 0;
    this.swayAngle = 0;
    this.mouse = { x: null, y: null, active: false, radius: 100 };
    this.seedColors = ['rgba(255, 255, 255, 0.85)', 'rgba(245, 245, 235, 0.8)', 'rgba(235, 245, 245, 0.75)'];
  }

  setup() {
    this.seeds = [];
    this.baseCenter = { x: this.width * 0.35, y: this.height };
    this.stemLength = this.height * 0.35;
    this.dandelionCenter = { x: this.baseCenter.x, y: this.height - this.stemLength };
    this.swayAngle = 0;

    // Scale seed counts relative to viewport area
    const densityFactor = 9000;
    const maxSeeds = Math.min(180, Math.max(50, Math.floor((this.width * this.height) / densityFactor)));

    // Create seeds (some start attached, some start drifting)
    for (let i = 0; i < maxSeeds; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 22 + 4; // radial offset from dandelion center
      this.seeds.push({
        attached: true,
        relX: Math.cos(angle) * dist,
        relY: Math.sin(angle) * dist,
        angle: angle,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        scale: Math.random() * 0.5 + 0.5,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.05,
        color: this.seedColors[Math.floor(Math.random() * this.seedColors.length)],
        life: 1.0,
        decay: Math.random() * 0.002 + 0.001,
        floatFreq: Math.random() * 0.03 + 0.01,
        floatAmp: Math.random() * 0.4 + 0.1
      });
    }
  }

  resize(width, height) {
    super.resize(width, height);
    this.baseCenter = { x: width * 0.35, y: height };
    this.stemLength = height * 0.35;
    this.dandelionCenter = { x: this.baseCenter.x, y: height - this.stemLength };
    
    // Fit loose seeds within canvas
    this.seeds.forEach(s => {
      if (!s.attached) {
        if (s.x > width) s.x = Math.random() * width;
        if (s.y > height) s.y = Math.random() * height;
      }
    });
  }

  draw(ctx, time) {
    // Elegant deep forest organic gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, this.height);
    bgGrad.addColorStop(0, '#040d06');
    bgGrad.addColorStop(1, '#091c0e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // 1. Calculate Stem Swaying (wind-driven physical pendulum)
    const windForce = Math.sin(time * 0.0008) * 0.08 + Math.cos(time * 0.0017) * 0.03;
    this.swayAngle = windForce;

    // Update coordinates of the dandelion head
    this.dandelionCenter.x = this.baseCenter.x + Math.sin(this.swayAngle) * this.stemLength;
    this.dandelionCenter.y = this.baseCenter.y - Math.cos(this.swayAngle) * this.stemLength;

    // 2. Draw stem curve
    ctx.beginPath();
    ctx.moveTo(this.baseCenter.x, this.baseCenter.y);
    // Draw using quadratic curve for organic flexibility
    const cpX = this.baseCenter.x + Math.sin(this.swayAngle * 0.5) * (this.stemLength * 0.5);
    const cpY = this.baseCenter.y - Math.cos(this.swayAngle * 0.5) * (this.stemLength * 0.5);
    ctx.quadraticCurveTo(cpX, cpY, this.dandelionCenter.x, this.dandelionCenter.y);
    
    ctx.strokeStyle = 'rgba(74, 117, 85, 0.45)';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Stem inner highlight
    ctx.strokeStyle = 'rgba(115, 173, 131, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Draw central receptacle
    ctx.beginPath();
    ctx.arc(this.dandelionCenter.x, this.dandelionCenter.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#42684B';
    ctx.fill();

    // 3. Update and render seeds
    this.seeds.forEach(s => {
      if (s.attached) {
        // Calculate absolute position based on relative position to swaying head
        // Rotate relative offsets with stem sway for realistic structural alignment
        const cos = Math.cos(this.swayAngle);
        const sin = Math.sin(this.swayAngle);
        const rotatedRelX = s.relX * cos - s.relY * sin;
        const rotatedRelY = s.relX * sin + s.relY * cos;

        s.x = this.dandelionCenter.x + rotatedRelX;
        s.y = this.dandelionCenter.y + rotatedRelY;

        // Hover or click detaches seeds
        if (this.mouse.active && this.mouse.x !== null) {
          const dx = this.mouse.x - s.x;
          const dy = this.mouse.y - s.y;
          const dist = Math.hypot(dx, dy);

          if (dist < this.mouse.radius) {
            // Blow off!
            s.attached = false;
            // Launch vector: combination of outward mouse blast and wind
            const launchAngle = Math.atan2(-dy, -dx) + (Math.random() - 0.5) * 0.5;
            const pushForce = ((this.mouse.radius - dist) / this.mouse.radius) * 4.0 + 1.0;
            s.vx = Math.cos(launchAngle) * pushForce + 0.5;
            s.vy = Math.sin(launchAngle) * pushForce - 0.4;
          }
        }
      } else {
        // Detached physics: floating seed behavior
        s.life -= s.decay;

        // Apply wind, slow air resistance, and tiny gravity float
        const seedWind = Math.sin(time * 0.0004 + s.x * 0.002) * 0.2 + 0.65; // drifting rightwards
        s.vx += (seedWind - s.vx) * 0.04;
        s.vy += (0.012 - s.vy) * 0.03; // extremely low terminal float gravity

        // Interactive mouse aerodynamic currents for detached floating seeds
        if (this.mouse.active && this.mouse.x !== null) {
          const mdx = s.x - this.mouse.x;
          const mdy = s.y - this.mouse.y;
          const mdist = Math.hypot(mdx, mdy);
          if (mdist < this.mouse.radius * 1.5) {
            const mforce = (this.mouse.radius * 1.5 - mdist) / (this.mouse.radius * 1.5);
            s.vx += (mdx / mdist) * mforce * 0.5;
            s.vy += (mdy / mdist) * mforce * 0.3;
          }
        }

        // Float noise sways
        s.vy += Math.sin(time * s.floatFreq) * s.floatAmp * 0.05;

        s.x += s.vx;
        s.y += s.vy;
        s.rotation += s.rotSpeed;

        // Reset if seed dies or drifts fully out of bounds
        if (s.life <= 0 || s.x > this.width + 50 || s.y > this.height + 50 || s.x < -50 || s.y < -50) {
          const resetSeed = this.createRespawnSeed();
          Object.assign(s, resetSeed);
        }
      }

      // Draw the seed (Dandelion fluff starlet)
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rotation);
      ctx.scale(s.scale, s.scale);

      ctx.strokeStyle = s.color;
      ctx.globalAlpha = s.attached ? 0.85 : s.life * 0.8;
      ctx.lineWidth = 1;

      // Draw stem of the seed
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -18);
      ctx.stroke();

      // Draw seed core dot
      ctx.beginPath();
      ctx.arc(0, 0, 1.2, 0, Math.PI * 2);
      ctx.fillStyle = '#CBD8CE';
      ctx.fill();

      // Draw radiating fluffy umbrella head (pappus starlet)
      ctx.beginPath();
      for (let j = 0; j < 7; j++) {
        const starletAngle = -Math.PI / 2 + (j - 3) * 0.22;
        const length = 7 + Math.random() * 2;
        ctx.moveTo(0, -18);
        ctx.lineTo(Math.cos(starletAngle) * length, -18 + Math.sin(starletAngle) * length);
      }
      ctx.stroke();

      ctx.restore();
    });

    ctx.globalAlpha = 1.0;
  }

  createRespawnSeed() {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * 20 + 2;
    return {
      attached: true,
      relX: Math.cos(angle) * dist,
      relY: Math.sin(angle) * dist,
      angle: angle,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      scale: Math.random() * 0.5 + 0.5,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.05,
      color: this.seedColors[Math.floor(Math.random() * this.seedColors.length)],
      life: 1.0,
      decay: Math.random() * 0.002 + 0.001,
      floatFreq: Math.random() * 0.03 + 0.01,
      floatAmp: Math.random() * 0.4 + 0.1
    };
  }

  destroy() {
    this.seeds = [];
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
    return 'Dandelion Wind Seeds';
  }

  static get description() {
    return 'An organic, wind-swayed dandelion head resting gracefully in a deep natural forest field. Move the cursor near the head or hover/click to blow delicate fluffy seeds into flight, watching them spin and float according to thermal wind, micro-gravity, and interactive eddies.';
  }

  static get vibe() {
    return 'Natural';
  }

  static get sourceCode() {
    return `class DandelionWindSeeds {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.seeds = [];
    this.dandelionCenter = { x: 0, y: 0 };
    this.baseCenter = { x: 0, y: 0 };
    this.stemLength = 0;
    this.swayAngle = 0;
    this.mouse = { x: null, y: null, active: false, radius: 100 };
    this.seedColors = ['rgba(255, 255, 255, 0.85)', 'rgba(245, 245, 235, 0.8)', 'rgba(235, 245, 245, 0.75)'];

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
    this.seeds = [];
    this.baseCenter = { x: this.width * 0.35, y: this.height };
    this.stemLength = this.height * 0.35;
    this.dandelionCenter = { x: this.baseCenter.x, y: this.height - this.stemLength };
    this.swayAngle = 0;

    const count = Math.min(180, Math.max(50, Math.floor((this.width * this.height) / 9000)));

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 22 + 4;
      this.seeds.push({
        attached: true,
        relX: Math.cos(angle) * dist,
        relY: Math.sin(angle) * dist,
        angle: angle,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        scale: Math.random() * 0.5 + 0.5,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.05,
        color: this.seedColors[Math.floor(Math.random() * this.seedColors.length)],
        life: 1.0,
        decay: Math.random() * 0.002 + 0.001,
        floatFreq: Math.random() * 0.03 + 0.01,
        floatAmp: Math.random() * 0.4 + 0.1
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

    this.baseCenter = { x: this.width * 0.35, y: this.height };
    this.stemLength = this.height * 0.35;
    this.dandelionCenter = { x: this.baseCenter.x, y: this.height - this.stemLength };

    this.seeds.forEach(s => {
      if (!s.attached) {
        if (s.x > this.width) s.x = Math.random() * this.width;
        if (s.y > this.height) s.y = Math.random() * this.height;
      }
    });
  }

  animate(time = 0) {
    const bgGrad = this.ctx.createLinearGradient(0, 0, 0, this.height);
    bgGrad.addColorStop(0, '#040d06');
    bgGrad.addColorStop(1, '#091c0e');
    this.ctx.fillStyle = bgGrad;
    this.ctx.fillRect(0, 0, this.width, this.height);

    const windForce = Math.sin(time * 0.0008) * 0.08 + Math.cos(time * 0.0017) * 0.03;
    this.swayAngle = windForce;

    this.dandelionCenter.x = this.baseCenter.x + Math.sin(this.swayAngle) * this.stemLength;
    this.dandelionCenter.y = this.baseCenter.y - Math.cos(this.swayAngle) * this.stemLength;

    this.ctx.beginPath();
    this.ctx.moveTo(this.baseCenter.x, this.baseCenter.y);
    const cpX = this.baseCenter.x + Math.sin(this.swayAngle * 0.5) * (this.stemLength * 0.5);
    const cpY = this.baseCenter.y - Math.cos(this.swayAngle * 0.5) * (this.stemLength * 0.5);
    this.ctx.quadraticCurveTo(cpX, cpY, this.dandelionCenter.x, this.dandelionCenter.y);
    this.ctx.strokeStyle = 'rgba(74, 117, 85, 0.45)';
    this.ctx.lineWidth = 4;
    this.ctx.stroke();

    this.ctx.strokeStyle = 'rgba(115, 173, 131, 0.25)';
    this.ctx.lineWidth = 1.5;
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.arc(this.dandelionCenter.x, this.dandelionCenter.y, 6, 0, Math.PI * 2);
    this.ctx.fillStyle = '#42684B';
    this.ctx.fill();

    this.seeds.forEach(s => {
      if (s.attached) {
        const cos = Math.cos(this.swayAngle);
        const sin = Math.sin(this.swayAngle);
        const rotatedRelX = s.relX * cos - s.relY * sin;
        const rotatedRelY = s.relX * sin + s.relY * cos;

        s.x = this.dandelionCenter.x + rotatedRelX;
        s.y = this.dandelionCenter.y + rotatedRelY;

        if (this.mouse.active && this.mouse.x !== null) {
          const dx = this.mouse.x - s.x;
          const dy = this.mouse.y - s.y;
          const dist = Math.hypot(dx, dy);

          if (dist < this.mouse.radius) {
            s.attached = false;
            const launchAngle = Math.atan2(-dy, -dx) + (Math.random() - 0.5) * 0.5;
            const pushForce = ((this.mouse.radius - dist) / this.mouse.radius) * 4.0 + 1.0;
            s.vx = Math.cos(launchAngle) * pushForce + 0.5;
            s.vy = Math.sin(launchAngle) * pushForce - 0.4;
          }
        }
      } else {
        s.life -= s.decay;
        const seedWind = Math.sin(time * 0.0004 + s.x * 0.002) * 0.2 + 0.65;
        s.vx += (seedWind - s.vx) * 0.04;
        s.vy += (0.012 - s.vy) * 0.03;

        if (this.mouse.active && this.mouse.x !== null) {
          const mdx = s.x - this.mouse.x;
          const mdy = s.y - this.mouse.y;
          const mdist = Math.hypot(mdx, mdy);
          if (mdist < this.mouse.radius * 1.5) {
            const mforce = (this.mouse.radius * 1.5 - mdist) / (this.mouse.radius * 1.5);
            s.vx += (mdx / mdist) * mforce * 0.5;
            s.vy += (mdy / mdist) * mforce * 0.3;
          }
        }

        s.vy += Math.sin(time * s.floatFreq) * s.floatAmp * 0.05;
        s.x += s.vx;
        s.y += s.vy;
        s.rotation += s.rotSpeed;

        if (s.life <= 0 || s.x > this.width + 50 || s.y > this.height + 50 || s.x < -50 || s.y < -50) {
          const resetSeed = this.createRespawnSeed();
          Object.assign(s, resetSeed);
        }
      }

      this.ctx.save();
      this.ctx.translate(s.x, s.y);
      this.ctx.rotate(s.rotation);
      this.ctx.scale(s.scale, s.scale);

      this.ctx.strokeStyle = s.color;
      this.ctx.globalAlpha = s.attached ? 0.85 : s.life * 0.8;
      this.ctx.lineWidth = 1;

      this.ctx.beginPath();
      this.ctx.moveTo(0, 0);
      this.ctx.lineTo(0, -18);
      this.ctx.stroke();

      this.ctx.beginPath();
      this.ctx.arc(0, 0, 1.2, 0, Math.PI * 2);
      this.ctx.fillStyle = '#CBD8CE';
      this.ctx.fill();

      this.ctx.beginPath();
      for (let j = 0; j < 7; j++) {
        const starletAngle = -Math.PI / 2 + (j - 3) * 0.22;
        const length = 7 + Math.random() * 2;
        this.ctx.moveTo(0, -18);
        this.ctx.lineTo(Math.cos(starletAngle) * length, -18 + Math.sin(starletAngle) * length);
      }
      this.ctx.stroke();

      this.ctx.restore();
    });

    this.ctx.globalAlpha = 1.0;
    requestAnimationFrame((t) => this.animate(t));
  }

  createRespawnSeed() {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * 20 + 2;
    return {
      attached: true,
      relX: Math.cos(angle) * dist,
      relY: Math.sin(angle) * dist,
      angle: angle,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      scale: Math.random() * 0.5 + 0.5,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.05,
      color: this.seedColors[Math.floor(Math.random() * this.seedColors.length)],
      life: 1.0,
      decay: Math.random() * 0.002 + 0.001,
      floatFreq: Math.random() * 0.03 + 0.01,
      floatAmp: Math.random() * 0.4 + 0.1
    };
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
