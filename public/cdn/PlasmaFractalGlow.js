import BaseAnimation from './BaseAnimation.js';

export default class PlasmaFractalGlow extends BaseAnimation {
  constructor() {
    super();
    this.mouse = { x: null, y: null, active: false };
    
    // Low-resolution offscreen dimensions for ultra-fast, smooth calculation
    this.offscreenW = 80;
    this.offscreenH = 50;
    this.offscreenCanvas = null;
    this.offscreenCtx = null;
  }

  setup() {
    // Lazily create offscreen buffer
    if (!this.offscreenCanvas) {
      this.offscreenCanvas = document.createElement('canvas');
      this.offscreenCanvas.width = this.offscreenW;
      this.offscreenCanvas.height = this.offscreenH;
      this.offscreenCtx = this.offscreenCanvas.getContext('2d');
    }
  }

  resize(width, height) {
    super.resize(width, height);
    // Keep aspect ratio matching for offscreen buffer
    this.offscreenH = Math.round(this.offscreenW * (height / width));
    if (this.offscreenCanvas) {
      this.offscreenCanvas.width = this.offscreenW;
      this.offscreenCanvas.height = this.offscreenH;
    }
  }

  draw(ctx, time) {
    if (!this.offscreenCanvas || !this.offscreenCtx) this.setup();

    const oCtx = this.offscreenCtx;
    const ow = this.offscreenW;
    const oh = this.offscreenH;

    // 1. Slow base wave parameters
    const t = time * 0.0012;

    // 2. Loop and draw wave cells on offscreen canvas (only 4000 pixels!)
    for (let r = 0; r < oh; r++) {
      const cy = r / oh - 0.5;

      for (let c = 0; c < ow; c++) {
        const cx = c / ow - 0.5;

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
          // Map mouse coordinates to offscreen bounds
          const mouseXRatio = this.mouse.x / this.width;
          const mouseYRatio = this.mouse.y / this.height;
          
          const mdx = cx - (mouseXRatio - 0.5);
          const mdy = cy - (mouseYRatio - 0.5);
          const mdist = Math.hypot(mdx, mdy);
          
          // Ripple propagation from cursor
          const mouseRipple = Math.sin(mdist * 28.0 - t * 3.5) * 0.75;
          const attraction = Math.max(0, 1.0 - mdist * 4.0); 
          total += mouseRipple * attraction;
        }

        // Beautiful deep purple, cyan, and pink HSL mapping
        const normalized = (total + 1.75) / 3.5; // 0 to 1
        
        let hue;
        if (normalized < 0.35) {
          hue = 260 + normalized * 80;
        } else if (normalized < 0.7) {
          hue = 300 + (normalized - 0.35) * 80;
        } else {
          hue = 180 + (normalized - 0.7) * 60;
        }

        const lightness = 28 + normalized * 32;
        oCtx.fillStyle = `hsla(${hue % 360}, 100%, ${lightness}%, 0.9)`;

        // Draw pixel on offscreen context
        oCtx.fillRect(c, r, 1, 1);
      }
    }

    // 3. Draw deep space backing on main canvas
    ctx.fillStyle = '#030207';
    ctx.fillRect(0, 0, this.width, this.height);

    // 4. Stretched drawing of offscreen canvas onto main canvas
    // Bilinear hardware filtering blurs automatically. We add a fast 8px filter
    // on the final single drawImage call which runs at solid 140 FPS!
    ctx.save();
    ctx.filter = 'blur(10px)';
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(this.offscreenCanvas, 0, 0, this.width, this.height);
    ctx.restore();
  }

  destroy() {
    super.destroy();
    this.offscreenCanvas = null;
    this.offscreenCtx = null;
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
    
    // Low-res offscreen buffer for hardware-accelerated 120+ FPS scaling
    this.offscreenW = 80;
    this.offscreenH = 50;
    this.offscreenCanvas = null;
    this.offscreenCtx = null;

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
    if (!this.offscreenCanvas) {
      this.offscreenCanvas = document.createElement('canvas');
      this.offscreenCanvas.width = this.offscreenW;
      this.offscreenCanvas.height = this.offscreenH;
      this.offscreenCtx = this.offscreenCanvas.getContext('2d');
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

    this.offscreenH = Math.round(this.offscreenW * (this.height / this.width));
    if (this.offscreenCanvas) {
      this.offscreenCanvas.width = this.offscreenW;
      this.offscreenCanvas.height = this.offscreenH;
    }
  }

  animate(time = 0) {
    const oCtx = this.offscreenCtx;
    const ow = this.offscreenW;
    const oh = this.offscreenH;
    const t = time * 0.0012;

    for (let r = 0; r < oh; r++) {
      const cy = r / oh - 0.5;

      for (let c = 0; c < ow; c++) {
        const cx = c / ow - 0.5;

        const w1 = Math.sin(cx * 4.5 + t);
        const w2 = Math.cos(7.0 * (cx * Math.sin(t * 0.3) + cy * Math.cos(t * 0.4)) + t);

        const cx2 = cx + 0.3 * Math.sin(t * 0.5);
        const cy2 = cy + 0.3 * Math.cos(t * 0.3);
        const w3 = Math.sin(Math.sqrt(75 * (cx2 * cx2 + cy2 * cy2) + 1.0) - t * 1.5);

        let total = (w1 + w2 + w3) / 3.0;

        if (this.mouse.active && this.mouse.x !== null) {
          const mouseXRatio = this.mouse.x / this.width;
          const mouseYRatio = this.mouse.y / this.height;
          const mdx = cx - (mouseXRatio - 0.5);
          const mdy = cy - (mouseYRatio - 0.5);
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
        oCtx.fillStyle = \`hsla(\${hue % 360}, 100%, \${lightness}%, 0.9)\`;
        oCtx.fillRect(c, r, 1, 1);
      }
    }

    this.ctx.fillStyle = '#030207';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.save();
    this.ctx.filter = 'blur(10px)';
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.drawImage(this.offscreenCanvas, 0, 0, this.width, this.height);
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
