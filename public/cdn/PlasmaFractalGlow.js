import BaseAnimation from './BaseAnimation.js';

export default class PlasmaFractalGlow extends BaseAnimation {
  constructor() {
    super();
    this.mouse = { x: null, y: null, active: false };
    this.gridSize = 22; // High-performance cell size for smooth blur blending
  }

  setup() {
    // Local states initialized
  }

  resize(width, height) {
    super.resize(width, height);
  }

  draw(ctx, time) {
    // Deep dark indigo space fill
    ctx.fillStyle = '#030207';
    ctx.fillRect(0, 0, this.width, this.height);

    // Apply high-performance canvas blurring to blend cells into a fluidic liquid plasma
    ctx.save();
    ctx.filter = 'blur(45px)';

    const cols = Math.ceil(this.width / this.gridSize);
    const rows = Math.ceil(this.height / this.gridSize);

    // Slow base wave variables
    const t = time * 0.0012;

    for (let r = 0; r < rows; r++) {
      const y = r * this.gridSize;
      const cy = y / this.height - 0.5;

      for (let c = 0; c < cols; c++) {
        const x = c * this.gridSize;
        const cx = x / this.width - 0.5;

        // Wave Equation 1: Linear horizontal sine wave
        const w1 = Math.sin(cx * 4.5 + t);

        // Wave Equation 2: Shifting diagonal multi-frequency cosine wave
        const w2 = Math.cos(7.0 * (cx * Math.sin(t * 0.3) + cy * Math.cos(t * 0.4)) + t);

        // Wave Equation 3: Center distance circular wave
        const cx2 = cx + 0.3 * Math.sin(t * 0.5);
        const cy2 = cy + 0.3 * Math.cos(t * 0.3);
        const w3 = Math.sin(Math.sqrt(75 * (cx2 * cx2 + cy2 * cy2) + 1.0) - t * 1.5);

        // Standardized composite wave value (-1.0 to 1.0)
        let total = (w1 + w2 + w3) / 3.0;

        // Interactive mouse splash wave ripples
        if (this.mouse.active && this.mouse.x !== null) {
          const mdx = (x - this.mouse.x) / this.width;
          const mdy = (y - this.mouse.y) / this.height;
          const mdist = Math.hypot(mdx, mdy);
          // Ripple propagation from cursor
          const mouseRipple = Math.sin(mdist * 28.0 - t * 3.5) * 0.75;
          const attraction = Math.max(0, 1.0 - mdist * 4.0); // Concentrated near cursor
          total += mouseRipple * attraction;
        }

        // Beautiful deep purple (hue 270), cyan (hue 180), and pink (hue 325) mapping
        // Value ranges from -1.75 to 1.75 with mouse influence. Map beautifully:
        const normalized = (total + 1.75) / 3.5; // 0 to 1
        
        let hue;
        if (normalized < 0.35) {
          // Deep Purple / Violet region
          hue = 260 + normalized * 80;
        } else if (normalized < 0.7) {
          // Shifting to Pink / Magenta
          hue = 300 + (normalized - 0.35) * 80;
        } else {
          // Highlights transitioning to Neon Cyan
          hue = 180 + (normalized - 0.7) * 60;
        }

        const lightness = 28 + normalized * 32; // Glow highlights scale with wave intensity
        ctx.fillStyle = `hsla(${hue % 360}, 100%, ${lightness}%, 0.75)`;

        // Draw overlapping color squares
        ctx.fillRect(x - 2, y - 2, this.gridSize + 4, this.gridSize + 4);
      }
    }

    ctx.restore();
  }

  destroy() {
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
    return 'Plasma Fractal Glow';
  }

  static get description() {
    return 'Shifting fluidic mathematical plasma liquid. Move your cursor over the screen to trigger glowing ripples and splash wave echoes that scatter across the neon cyan, violet, and pink fields.';
  }

  static get vibe() {
    return 'Fluidic';
  }

  static get sourceCode() {
    return `class PlasmaFractalGlow {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.mouse = { x: null, y: null, active: false };
    this.gridSize = 22;
    
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

  setup() {}

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
    this.ctx.fillStyle = '#030207';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.save();
    this.ctx.filter = 'blur(45px)';

    const cols = Math.ceil(this.width / this.gridSize);
    const rows = Math.ceil(this.height / this.gridSize);
    const t = time * 0.0012;

    for (let r = 0; r < rows; r++) {
      const y = r * this.gridSize;
      const cy = y / this.height - 0.5;

      for (let c = 0; c < cols; c++) {
        const x = c * this.gridSize;
        const cx = x / this.width - 0.5;

        const w1 = Math.sin(cx * 4.5 + t);
        const w2 = Math.cos(7.0 * (cx * Math.sin(t * 0.3) + cy * Math.cos(t * 0.4)) + t);

        const cx2 = cx + 0.3 * Math.sin(t * 0.5);
        const cy2 = cy + 0.3 * Math.cos(t * 0.3);
        const w3 = Math.sin(Math.sqrt(75 * (cx2 * cx2 + cy2 * cy2) + 1.0) - t * 1.5);

        let total = (w1 + w2 + w3) / 3.0;

        if (this.mouse.active && this.mouse.x !== null) {
          const mdx = (x - this.mouse.x) / this.width;
          const mdy = (y - this.mouse.y) / this.height;
          const mdist = Math.hypot(mdx, mdy);
          const mouseRipple = Math.sin(mdist * 28.0 - t * 3.5) * 0.75;
          const attraction = Math.max(0, 1.0 - mdist * 4.0);
          total += mouseRipple * attraction;
        }

        const normalized = (total + 1.75) / 3.5;
        
        let hue;
        if (normalized < 0.35) {
          hue = 260 + normalized * 80;
        } else if (normalized < 0.7) {
          hue = 300 + (normalized - 0.35) * 80;
        } else {
          hue = 180 + (normalized - 0.7) * 60;
        }

        const lightness = 28 + normalized * 32;
        this.ctx.fillStyle = \`hsla(\${hue % 360}, 100%, \${lightness}%, 0.75)\`;
        this.ctx.fillRect(x - 2, y - 2, this.gridSize + 4, this.gridSize + 4);
      }
    }

    this.ctx.restore();
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
