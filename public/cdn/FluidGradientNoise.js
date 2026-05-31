import BaseAnimation from './BaseAnimation.js';

export default class FluidGradientNoise extends BaseAnimation {
  constructor() {
    super();
    this.blobs = [];
    this.mouse = { x: null, y: null, active: false, targetX: 0, targetY: 0 };
    
    // Sleek color palette (deep indigo, vibrant pink, neon purple, cyan, royal blue, amber/gold)
    this.palette = [
      { r: 99, g: 102, b: 241 },   // Indigo
      { r: 236, g: 72, b: 153 },  // Pink
      { r: 168, g: 85, b: 247 },  // Purple
      { r: 6, g: 182, b: 212 },   // Cyan
      { r: 59, g: 130, b: 246 },  // Blue
      { r: 245, g: 158, b: 11 }   // Amber
    ];
  }

  setup() {
    this.blobs = [];
    const count = 5;

    for (let i = 0; i < count; i++) {
      const color = this.palette[i % this.palette.length];
      this.blobs.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        // Large radii for smooth blending overlay
        radius: Math.min(this.width, this.height) * (Math.random() * 0.4 + 0.45),
        color: `rgba(${color.r}, ${color.g}, ${color.b}, 0.35)`,
        colorRaw: color,
        // Harmonic frequencies for non-repeating movements
        freqX: 0.0003 + Math.random() * 0.0004,
        freqY: 0.0003 + Math.random() * 0.0004,
        ampX: this.width * (Math.random() * 0.15 + 0.1),
        ampY: this.height * (Math.random() * 0.15 + 0.1),
        startX: Math.random() * this.width,
        startY: Math.random() * this.height,
        phase: Math.random() * Math.PI * 2
      });
    }

    // Interactivity: Smooth cursor spring
    this.mouse.targetX = this.width / 2;
    this.mouse.targetY = this.height / 2;
  }

  resize(width, height) {
    super.resize(width, height);
    
    // Scale starts and radii accordingly
    this.blobs.forEach(b => {
      b.startX = Math.random() * width;
      b.startY = Math.random() * height;
      b.radius = Math.min(width, height) * (Math.random() * 0.4 + 0.45);
      b.ampX = width * 0.15;
      b.ampY = height * 0.15;
    });
  }

  draw(ctx, time) {
    // 1. Core deep space background fill
    ctx.fillStyle = '#06070C';
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Enable screen blend mode for neon blending glow
    ctx.globalCompositeOperation = 'screen';

    // 3. Update & Draw Dynamic Blobs
    this.blobs.forEach((b, index) => {
      // Harmonic wave coordination
      let targetX = b.startX + Math.sin(time * b.freqX + b.phase) * b.ampX;
      let targetY = b.startY + Math.cos(time * b.freqY + b.phase) * b.ampY;

      // Mouse interactive push/pull on nearest blobs
      if (this.mouse.active && this.mouse.x !== null) {
        const dx = this.mouse.x - b.x;
        const dy = this.mouse.y - b.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 400) {
          const force = (400 - dist) / 400; // 0 to 1
          
          // Draw/pull the fluid gently towards cursor
          targetX += (dx / dist) * force * 150;
          targetY += (dy / dist) * force * 150;
        }
      }

      // Smooth interpolation
      b.x = b.x * 0.96 + targetX * 0.04;
      b.y = b.y * 0.96 + targetY * 0.04;

      // Render large radial neon gradient
      const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.radius);
      grad.addColorStop(0, b.color);
      grad.addColorStop(0.3, `rgba(${b.colorRaw.r}, ${b.colorRaw.g}, ${b.colorRaw.b}, 0.18)`);
      grad.addColorStop(0.65, `rgba(${b.colorRaw.r}, ${b.colorRaw.g}, ${b.colorRaw.b}, 0.05)`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    });

    // 4. Cursor Shimmer Fluid Blob
    if (this.mouse.active && this.mouse.x !== null) {
      // Spring interpolation for smooth cursor follow
      this.mouse.targetX = this.mouse.targetX * 0.9 + this.mouse.x * 0.1;
      this.mouse.targetY = this.mouse.targetY * 0.9 + this.mouse.y * 0.1;

      const cursorRadius = Math.min(this.width, this.height) * 0.35;
      const cursorGrad = ctx.createRadialGradient(
        this.mouse.targetX, this.mouse.targetY, 0,
        this.mouse.targetX, this.mouse.targetY, cursorRadius
      );
      
      // Indigo-purple shimmering interaction
      cursorGrad.addColorStop(0, 'rgba(129, 140, 248, 0.25)'); // Light indigo
      cursorGrad.addColorStop(0.4, 'rgba(168, 85, 247, 0.08)'); // Purple
      cursorGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.beginPath();
      ctx.arc(this.mouse.targetX, this.mouse.targetY, cursorRadius, 0, Math.PI * 2);
      ctx.fillStyle = cursorGrad;
      ctx.fill();
    }

    // 5. Restore default composite mode
    ctx.globalCompositeOperation = 'source-over';

    // 6. Superimpose micro-grain texture for premium aesthetic (AI/film grain vibe!)
    // We can draw a highly performant static noise pattern overlaid at 0.02 opacity.
    // To make it run at 60 FPS, we don't generate grain dynamically. We just draw subtle lines
    // or let the gradients speak for themselves. The colors are so rich that grain isn't even needed,
    // but the smooth gradients themselves look breathtaking!
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
    return 'Fluid Gradient Noise';
  }

  static get description() {
    return 'A slow-moving wave field of blending, silk-like colors. Large mathematical radial color nodes drift along multi-octave harmonic sine paths, blending seamlessly in hardware-accelerated "screen" overlay. Drag your cursor to warp the color gravity fields dynamically.';
  }

  static get vibe() {
    return 'Mesmerizing';
  }

  static get sourceCode() {
    return `class FluidGradientNoise {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.blobs = [];
    this.mouse = { x: null, y: null, active: false, targetX: 0, targetY: 0 };
    this.palette = [
      { r: 99, g: 102, b: 241 },   // Indigo
      { r: 236, g: 72, b: 153 },  // Pink
      { r: 168, g: 85, b: 247 },  // Purple
      { r: 6, g: 182, b: 212 },   // Cyan
      { r: 59, g: 130, b: 246 }   // Blue
    ];

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
    this.mouse.targetX = this.width / 2;
    this.mouse.targetY = this.height / 2;

    for (let i = 0; i < 5; i++) {
      const color = this.palette[i % this.palette.length];
      this.blobs.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        radius: Math.min(this.width, this.height) * (Math.random() * 0.4 + 0.45),
        color: \`rgba(\${color.r}, \${color.g}, \${color.b}, 0.35)\`,
        colorRaw: color,
        freqX: 0.0003 + Math.random() * 0.0004,
        freqY: 0.0003 + Math.random() * 0.0004,
        ampX: this.width * (Math.random() * 0.15 + 0.1),
        ampY: this.height * (Math.random() * 0.15 + 0.1),
        startX: Math.random() * this.width,
        startY: Math.random() * this.height,
        phase: Math.random() * Math.PI * 2
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
    // Solid background
    this.ctx.fillStyle = '#06070C';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Screen blend mode for glowing overlays
    this.ctx.globalCompositeOperation = 'screen';

    // Draw Shifting Blobs
    this.blobs.forEach(b => {
      let targetX = b.startX + Math.sin(time * b.freqX + b.phase) * b.ampX;
      let targetY = b.startY + Math.cos(time * b.freqY + b.phase) * b.ampY;

      // Mouse reaction
      if (this.mouse.active && this.mouse.x !== null) {
        const dx = this.mouse.x - b.x;
        const dy = this.mouse.y - b.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 400) {
          const force = (400 - dist) / 400;
          targetX += (dx / dist) * force * 150;
          targetY += (dy / dist) * force * 150;
        }
      }

      b.x = b.x * 0.96 + targetX * 0.04;
      b.y = b.y * 0.96 + targetY * 0.04;

      const grad = this.ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.radius);
      grad.addColorStop(0, b.color);
      grad.addColorStop(0.3, \`rgba(\${b.colorRaw.r}, \${b.colorRaw.g}, \${b.colorRaw.b}, 0.18)\`);
      grad.addColorStop(0.65, \`rgba(\${b.colorRaw.r}, \${b.colorRaw.g}, \${b.colorRaw.b}, 0.05)\`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      this.ctx.beginPath();
      this.ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = grad;
      this.ctx.fill();
    });

    // Draw Mouse Shimmer
    if (this.mouse.active && this.mouse.x !== null) {
      this.mouse.targetX = this.mouse.targetX * 0.9 + this.mouse.x * 0.1;
      this.mouse.targetY = this.mouse.targetY * 0.9 + this.mouse.y * 0.1;

      const cursorRadius = Math.min(this.width, this.height) * 0.35;
      const cursorGrad = this.ctx.createRadialGradient(
        this.mouse.targetX, this.mouse.targetY, 0,
        this.mouse.targetX, this.mouse.targetY, cursorRadius
      );
      cursorGrad.addColorStop(0, 'rgba(129, 140, 248, 0.25)');
      cursorGrad.addColorStop(0.4, 'rgba(168, 85, 247, 0.08)');
      cursorGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      this.ctx.beginPath();
      this.ctx.arc(this.mouse.targetX, this.mouse.targetY, cursorRadius, 0, Math.PI * 2);
      this.ctx.fillStyle = cursorGrad;
      this.ctx.fill();
    }

    this.ctx.globalCompositeOperation = 'source-over';
    
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
