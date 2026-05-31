import BaseAnimation from './BaseAnimation.js';

export default class LavaLampBlobs extends BaseAnimation {
  constructor() {
    super();
    this.blobs = [];
    this.mouse = { x: null, y: null, active: false, rx: 0, ry: 0, radius: 100 };
    this.baseBg = '#0c0307';
  }

  setup() {
    this.blobs = [];
    // Scale count of blobs with screen dimensions
    const area = this.width * this.height;
    const count = Math.max(6, Math.floor(area / 90000));

    // Colors: vibrant hot lava pinks, warm corals, and rich oranges
    const colors = [
      '#FF2E93', // Hot Pink
      '#FF5E3A', // Lava Orange-Red
      '#FF8A00', // Deep Orange
      '#FF4B72', // Coral Pink
      '#FFAC1C'  // Bright Amber
    ];

    for (let i = 0; i < count; i++) {
      const radius = Math.min(this.width, this.height) * (0.08 + Math.random() * 0.08);
      this.blobs.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        radius: radius,
        baseRadius: radius,
        color: colors[i % colors.length],
        // Speed/wobble phase
        phase: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.001 + Math.random() * 0.002
      });
    }

    this.mouse.rx = this.width / 2;
    this.mouse.ry = this.height / 2;
    this.mouse.radius = Math.min(this.width, this.height) * 0.16;
  }

  resize(width, height) {
    super.resize(width, height);
    this.mouse.radius = Math.min(width, height) * 0.16;
    
    // Scale the base radii of blobs
    this.blobs.forEach(b => {
      b.radius = Math.min(width, height) * (0.08 + Math.random() * 0.08);
      b.baseRadius = b.radius;
      // Clamp position inside new boundaries
      b.x = Math.max(b.radius, Math.min(width - b.radius, b.x));
      b.y = Math.max(b.radius, Math.min(height - b.radius, b.y));
    });
  }

  draw(ctx, time) {
    // 1. Draw solid, rich dark lava-cave background
    ctx.fillStyle = this.baseBg;
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Setup high-performance hardware-accelerated metaball filter
    ctx.save();
    
    // Standard high-contrast and blur combination for beautiful vector fluid merging
    // To make sure it doesn't get alpha-cut on some screens, we combine blur and contrast
    ctx.filter = 'blur(28px) contrast(28) brightness(1.05)';

    // 3. Update and draw blobs
    this.blobs.forEach(b => {
      // Gentle harmonic pulsing of individual blob sizes
      b.radius = b.baseRadius * (1.0 + Math.sin(time * b.wobbleSpeed + b.phase) * 0.08);

      // Smooth slow physical drift
      b.x += b.vx;
      b.y += b.vy;

      // Handle boundaries smoothly with gentle reversal bounce
      if (b.x - b.radius < -20) {
        b.x = -20 + b.radius;
        b.vx *= -1;
      } else if (b.x + b.radius > this.width + 20) {
        b.x = this.width + 20 - b.radius;
        b.vx *= -1;
      }

      if (b.y - b.radius < -20) {
        b.y = -20 + b.radius;
        b.vy *= -1;
      } else if (b.y + b.radius > this.height + 20) {
        b.y = this.height + 20 - b.radius;
        b.vy *= -1;
      }

      // Draw blob
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fillStyle = b.color;
      ctx.fill();
    });

    // 4. Draw interactive cursor blob to merge seamlessly with drifting blobs
    if (this.mouse.active && this.mouse.x !== null) {
      // Spring cursor to smooth out jitter
      this.mouse.rx = this.mouse.rx * 0.88 + this.mouse.x * 0.12;
      this.mouse.ry = this.mouse.ry * 0.88 + this.mouse.y * 0.12;

      ctx.beginPath();
      // Pulsating cursor size based on time
      const cursorSize = this.mouse.radius * (1.0 + Math.sin(time * 0.003) * 0.05);
      ctx.arc(this.mouse.rx, this.mouse.ry, cursorSize, 0, Math.PI * 2);
      ctx.fillStyle = '#FF2E93'; // Magenta/pink center for mouse
      ctx.fill();
    }

    // Restore to clear filters
    ctx.restore();

    // 5. Add a very subtle gradient vignette overlay for premium depth
    const vignette = ctx.createRadialGradient(
      this.width / 2, this.height / 2, Math.min(this.width, this.height) * 0.3,
      this.width / 2, this.height / 2, Math.max(this.width, this.height) * 0.8
    );
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, 'rgba(8, 0, 4, 0.45)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, this.width, this.height);
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

  destroy() {
    super.destroy();
    this.blobs = [];
  }

  static get title() {
    return 'Lava Lamp Blobs';
  }

  static get description() {
    return 'Beautiful viscous liquid metaballs merging and dividing smoothly. Utilizes high-performance radial blend filters to create realistic lava-lamp fluidics. Move your cursor to introduce a massive custom blob that fuses with others.';
  }

  static get vibe() {
    return 'Fluidic';
  }

  static get sourceCode() {
    return `class LavaLampBlobs {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.blobs = [];
    this.mouse = { x: null, y: null, active: false, rx: 0, ry: 0, radius: 100 };
    this.baseBg = '#0c0307';

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
    this.blobs = [];
    const area = this.width * this.height;
    const count = Math.max(6, Math.floor(area / 90000));

    const colors = [
      '#FF2E93', // Hot Pink
      '#FF5E3A', // Lava Orange-Red
      '#FF8A00', // Deep Orange
      '#FF4B72', // Coral Pink
      '#FFAC1C'  // Bright Amber
    ];

    for (let i = 0; i < count; i++) {
      const radius = Math.min(this.width, this.height) * (0.08 + Math.random() * 0.08);
      this.blobs.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        radius: radius,
        baseRadius: radius,
        color: colors[i % colors.length],
        phase: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.001 + Math.random() * 0.002
      });
    }

    this.mouse.rx = this.width / 2;
    this.mouse.ry = this.height / 2;
    this.mouse.radius = Math.min(this.width, this.height) * 0.16;
  }

  resize() {
    this.dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;

    this.canvas.width = rect.width * this.dpr;
    this.canvas.height = rect.height * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);

    this.mouse.radius = Math.min(this.width, this.height) * 0.16;
    this.blobs.forEach(b => {
      b.radius = Math.min(this.width, this.height) * (0.08 + Math.random() * 0.08);
      b.baseRadius = b.radius;
      b.x = Math.max(b.radius, Math.min(this.width - b.radius, b.x));
      b.y = Math.max(b.radius, Math.min(this.height - b.radius, b.y));
    });
  }

  animate(time = 0) {
    this.ctx.fillStyle = this.baseBg;
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.save();
    this.ctx.filter = 'blur(28px) contrast(28) brightness(1.05)';

    this.blobs.forEach(b => {
      b.radius = b.baseRadius * (1.0 + Math.sin(time * b.wobbleSpeed + b.phase) * 0.08);

      b.x += b.vx;
      b.y += b.vy;

      if (b.x - b.radius < -20) {
        b.x = -20 + b.radius;
        b.vx *= -1;
      } else if (b.x + b.radius > this.width + 20) {
        b.x = this.width + 20 - b.radius;
        b.vx *= -1;
      }

      if (b.y - b.radius < -20) {
        b.y = -20 + b.radius;
        b.vy *= -1;
      } else if (b.y + b.radius > this.height + 20) {
        b.y = this.height + 20 - b.radius;
        b.vy *= -1;
      }

      this.ctx.beginPath();
      this.ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = b.color;
      this.ctx.fill();
    });

    if (this.mouse.active && this.mouse.x !== null) {
      this.mouse.rx = this.mouse.rx * 0.88 + this.mouse.x * 0.12;
      this.mouse.ry = this.mouse.ry * 0.88 + this.mouse.y * 0.12;

      this.ctx.beginPath();
      const cursorSize = this.mouse.radius * (1.0 + Math.sin(time * 0.003) * 0.05);
      this.ctx.arc(this.mouse.rx, this.mouse.ry, cursorSize, 0, Math.PI * 2);
      this.ctx.fillStyle = '#FF2E93';
      this.ctx.fill();
    }

    this.ctx.restore();

    const vignette = this.ctx.createRadialGradient(
      this.width / 2, this.height / 2, Math.min(this.width, this.height) * 0.3,
      this.width / 2, this.height / 2, Math.max(this.width, this.height) * 0.8
    );
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, 'rgba(8, 0, 4, 0.45)');
    this.ctx.fillStyle = vignette;
    this.ctx.fillRect(0, 0, this.width, this.height);

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
