import BaseAnimation from './BaseAnimation.js';

export default class BioluminescentRain extends BaseAnimation {
  constructor() {
    super();
    this.drops = [];
    this.ripples = [];
    this.mouse = { x: null, y: null, active: false, radius: 120 };
  }

  setup() {
    this.drops = [];
    this.ripples = [];
    // Scale droplet count dynamically with canvas area
    const count = Math.floor((this.width * this.height) / 12000) + 60;
    for (let i = 0; i < count; i++) {
      this.drops.push(this.createDrop(true));
    }
  }

  createDrop(randomY = false) {
    const y = randomY ? Math.random() * this.height : -50;
    return {
      x: Math.random() * this.width,
      y: y,
      vy: Math.random() * 4 + 5,
      vx: Math.random() * 0.4 - 0.2,
      length: Math.random() * 18 + 12,
      opacity: Math.random() * 0.6 + 0.3,
      targetY: this.height - Math.random() * 40, // splash zone near bottom
      hue: 160 + Math.random() * 50 // bioluminescent cyan to teal
    };
  }

  createRipple(x, y, hue) {
    this.ripples.push({
      x,
      y,
      radius: 1,
      maxRadius: Math.random() * 18 + 12,
      opacity: 0.9,
      speed: Math.random() * 0.4 + 0.4,
      hue: hue || 180
    });
  }

  resize(width, height) {
    super.resize(width, height);
    this.setup();
  }

  draw(ctx, time) {
    // Deep organic dark forest green/indigo canvas fill
    ctx.fillStyle = 'rgba(6, 12, 15, 0.16)';
    ctx.fillRect(0, 0, this.width, this.height);

    // Update and draw raindrops
    for (let i = 0; i < this.drops.length; i++) {
      const drop = this.drops[i];

      // Update position
      drop.y += drop.vy;
      drop.x += drop.vx;

      // Mouse pressure force field (repellence)
      if (this.mouse.active && this.mouse.x !== null) {
        const dx = drop.x - this.mouse.x;
        const dy = drop.y - this.mouse.y;
        const dist = Math.hypot(dx, dy);

        if (dist < this.mouse.radius) {
          const force = (this.mouse.radius - dist) / this.mouse.radius;
          
          // Repel raindrop away from cursor horizontally
          drop.x += (dx / (dist || 1)) * force * 10;

          // Proximity splash: vaporize/splash raindrop on contact with energy bubble
          if (dist < 45 && Math.random() < 0.08) {
            this.createRipple(drop.x, drop.y, drop.hue);
            this.drops[i] = this.createDrop(false);
            continue;
          }
        }
      }

      // Check boundary / floor collision
      if (drop.y >= drop.targetY) {
        this.createRipple(drop.x, drop.targetY, drop.hue);
        this.drops[i] = this.createDrop(false);
        continue;
      }

      // Render glowing rain line
      ctx.beginPath();
      ctx.strokeStyle = `hsla(${drop.hue}, 100%, 65%, ${drop.opacity})`;
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x + drop.vx * 2, drop.y + drop.length);
      ctx.stroke();
    }

    // Update and draw splash ripples
    ctx.lineWidth = 1.2;
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const rip = this.ripples[i];
      rip.radius += rip.speed;
      rip.opacity -= 0.015;

      if (rip.opacity <= 0 || rip.radius >= rip.maxRadius) {
        this.ripples.splice(i, 1);
        continue;
      }

      // Perspective flattened circular ripple (ellipse)
      ctx.beginPath();
      ctx.strokeStyle = `hsla(${rip.hue}, 100%, 75%, ${rip.opacity})`;
      
      // High-performance canvas ellipse draw
      ctx.ellipse(rip.x, rip.y, rip.radius, rip.radius * 0.35, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  destroy() {
    super.destroy();
    this.drops = [];
    this.ripples = [];
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
    return 'Bioluminescent Rain';
  }

  static get description() {
    return 'Cozy glowing vertical neon raindrops falling down at organic speeds. Raindrops dissolve into fading, expanding rings on contact with the screen floor or your cursor\'s repellent energy field.';
  }

  static get vibe() {
    return 'Natural';
  }

  static get sourceCode() {
    return `class BioluminescentRain {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.drops = [];
    this.ripples = [];
    this.mouse = { x: null, y: null, active: false, radius: 120 };
    
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
    this.drops = [];
    this.ripples = [];
    const count = Math.floor((this.width * this.height) / 12000) + 60;
    for (let i = 0; i < count; i++) {
      this.drops.push(this.createDrop(true));
    }
  }

  createDrop(randomY = false) {
    const y = randomY ? Math.random() * this.height : -50;
    return {
      x: Math.random() * this.width,
      y: y,
      vy: Math.random() * 4 + 5,
      vx: Math.random() * 0.4 - 0.2,
      length: Math.random() * 18 + 12,
      opacity: Math.random() * 0.6 + 0.3,
      targetY: this.height - Math.random() * 40,
      hue: 160 + Math.random() * 50
    };
  }

  createRipple(x, y, hue) {
    this.ripples.push({
      x,
      y,
      radius: 1,
      maxRadius: Math.random() * 18 + 12,
      opacity: 0.9,
      speed: Math.random() * 0.4 + 0.4,
      hue: hue || 180
    });
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
    this.ctx.fillStyle = 'rgba(6, 12, 15, 0.16)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    for (let i = 0; i < this.drops.length; i++) {
      const drop = this.drops[i];
      drop.y += drop.vy;
      drop.x += drop.vx;

      if (this.mouse.active && this.mouse.x !== null) {
        const dx = drop.x - this.mouse.x;
        const dy = drop.y - this.mouse.y;
        const dist = Math.hypot(dx, dy);

        if (dist < this.mouse.radius) {
          const force = (this.mouse.radius - dist) / this.mouse.radius;
          drop.x += (dx / (dist || 1)) * force * 10;

          if (dist < 45 && Math.random() < 0.08) {
            this.createRipple(drop.x, drop.y, drop.hue);
            this.drops[i] = this.createDrop(false);
            continue;
          }
        }
      }

      if (drop.y >= drop.targetY) {
        this.createRipple(drop.x, drop.targetY, drop.hue);
        this.drops[i] = this.createDrop(false);
        continue;
      }

      this.ctx.beginPath();
      this.ctx.strokeStyle = \`hsla(\${drop.hue}, 100%, 65%, \${drop.opacity})\`;
      this.ctx.lineWidth = 1.5;
      this.ctx.lineCap = 'round';
      this.ctx.moveTo(drop.x, drop.y);
      this.ctx.lineTo(drop.x + drop.vx * 2, drop.y + drop.length);
      this.ctx.stroke();
    }

    this.ctx.lineWidth = 1.2;
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const rip = this.ripples[i];
      rip.radius += rip.speed;
      rip.opacity -= 0.015;

      if (rip.opacity <= 0 || rip.radius >= rip.maxRadius) {
        this.ripples.splice(i, 1);
        continue;
      }

      this.ctx.beginPath();
      this.ctx.strokeStyle = \`hsla(\${rip.hue}, 100%, 75%, \${rip.opacity})\`;
      this.ctx.ellipse(rip.x, rip.y, rip.radius, rip.radius * 0.35, 0, 0, Math.PI * 2);
      this.ctx.stroke();
    }

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
