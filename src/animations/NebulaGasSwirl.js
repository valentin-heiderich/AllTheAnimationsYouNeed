import BaseAnimation from './BaseAnimation.js';

export default class NebulaGasSwirl extends BaseAnimation {
  constructor() {
    super();
    this.gasClouds = [];
    this.starDust = [];
    this.mouse = { x: null, y: null, active: false, radius: 250 };
    
    // Offscreen canvases for ultra-fast gas rendering
    this.gasCanvases = {};
    this.colors = {
      violet: 'rgba(127, 0, 255, 0.04)',
      pink: 'rgba(255, 0, 127, 0.035)',
      amber: 'rgba(255, 140, 0, 0.03)'
    };
  }

  setup() {
    this.gasClouds = [];
    this.starDust = [];

    // Initialize offscreen canvases
    this.initOffscreenCanvases();

    // Scale counts based on screen size
    const densityFactor = 12000;
    const gasCount = Math.min(120, Math.max(40, Math.floor((this.width * this.height) / densityFactor)));
    const starCount = Math.min(300, Math.max(100, Math.floor((this.width * this.height) / 3000)));

    // Create gaseous clouds
    const colorsList = ['violet', 'pink', 'amber'];
    for (let i = 0; i < gasCount; i++) {
      const type = colorsList[Math.floor(Math.random() * colorsList.length)];
      const size = Math.random() * 160 + 100; // Large soft gas blobs
      this.gasClouds.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: size,
        type: type,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.005,
        pulseSpeed: 0.005 + Math.random() * 0.01,
        pulsePhase: Math.random() * Math.PI * 2,
        baseOpacity: Math.random() * 0.4 + 0.6
      });
    }

    // Create fine bright star dust particles
    const starColors = ['#FFFFFF', '#FFB7FF', '#C7E2FF', '#FFECA2'];
    for (let i = 0; i < starCount; i++) {
      this.starDust.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        radius: Math.random() * 1.5 + 0.4,
        color: starColors[Math.floor(Math.random() * starColors.length)],
        opacity: Math.random() * 0.7 + 0.3,
        orbitSpeed: 0.02 + Math.random() * 0.04,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  initOffscreenCanvases() {
    const types = ['violet', 'pink', 'amber'];
    types.forEach(type => {
      const size = 256;
      const offscreen = document.createElement('canvas');
      offscreen.width = size;
      offscreen.height = size;
      const octx = offscreen.getContext('2d');

      // Create radial gradient for realistic soft gaseous glow
      const grad = octx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
      
      if (type === 'violet') {
        grad.addColorStop(0, 'rgba(127, 0, 255, 0.4)');
        grad.addColorStop(0.3, 'rgba(145, 40, 255, 0.15)');
        grad.addColorStop(0.7, 'rgba(160, 80, 255, 0.04)');
        grad.addColorStop(1, 'rgba(160, 80, 255, 0)');
      } else if (type === 'pink') {
        grad.addColorStop(0, 'rgba(255, 0, 160, 0.35)');
        grad.addColorStop(0.3, 'rgba(255, 50, 180, 0.12)');
        grad.addColorStop(0.7, 'rgba(255, 80, 200, 0.035)');
        grad.addColorStop(1, 'rgba(255, 80, 200, 0)');
      } else if (type === 'amber') {
        grad.addColorStop(0, 'rgba(255, 140, 0, 0.32)');
        grad.addColorStop(0.3, 'rgba(255, 165, 30, 0.11)');
        grad.addColorStop(0.7, 'rgba(255, 180, 60, 0.03)');
        grad.addColorStop(1, 'rgba(255, 180, 60, 0)');
      }

      octx.fillStyle = grad;
      octx.fillRect(0, 0, size, size);
      this.gasCanvases[type] = offscreen;
    });
  }

  resize(width, height) {
    super.resize(width, height);
    
    // Fit clouds and dust in new boundary
    this.gasClouds.forEach(g => {
      if (g.x > width) g.x = Math.random() * width;
      if (g.y > height) g.y = Math.random() * height;
    });

    this.starDust.forEach(s => {
      if (s.x > width) s.x = Math.random() * width;
      if (s.y > height) s.y = Math.random() * height;
    });
  }

  draw(ctx, time) {
    // Elegant space background (deep cosmos purple/black)
    ctx.fillStyle = '#020108';
    ctx.fillRect(0, 0, this.width, this.height);

    // Screen composition blend for vibrant glowing overlays
    ctx.globalCompositeOperation = 'screen';

    // 1. Update and Render Gaseous Cosmic Clouds
    this.gasClouds.forEach(g => {
      g.angle += g.spin;
      g.pulsePhase += g.pulseSpeed;

      // Slow organic curling movement
      const noiseAngle = Math.sin(g.x * 0.003 + time * 0.0001) * Math.cos(g.y * 0.003 - time * 0.0001) * Math.PI * 1.5;
      let dx = Math.cos(noiseAngle) * 0.28 + g.vx;
      let dy = Math.sin(noiseAngle) * 0.28 + g.vy;

      // Mouse Cosmic Hurricane Gravity Vacuum
      if (this.mouse.active && this.mouse.x !== null) {
        const pdx = this.mouse.x - g.x;
        const pdy = this.mouse.y - g.y;
        const dist = Math.hypot(pdx, pdy);

        if (dist < this.mouse.radius) {
          const force = (this.mouse.radius - dist) / this.mouse.radius;
          const pullAngle = Math.atan2(pdy, pdx);
          const orbitAngle = pullAngle + Math.PI / 2; // spiraling inward

          // Pull inwards AND swirl circularly (vortex)
          dx += Math.cos(pullAngle) * force * 1.2 + Math.cos(orbitAngle) * force * 0.8;
          dy += Math.sin(pullAngle) * force * 1.2 + Math.sin(orbitAngle) * force * 0.8;
        }
      }

      g.x += dx;
      g.y += dy;

      // Boundary buffer wrapping
      const padding = g.size;
      if (g.x < -padding) g.x = this.width + padding;
      if (g.x > this.width + padding) g.x = -padding;
      if (g.y < -padding) g.y = this.height + padding;
      if (g.y > this.height + padding) g.y = -padding;

      // Pulsing scale for breathing effect
      const currentScale = (1.0 + Math.sin(g.pulsePhase) * 0.1) * (g.size / 256);
      const currentOpacity = g.baseOpacity * (0.8 + Math.sin(g.pulsePhase * 0.5) * 0.15);

      ctx.save();
      ctx.translate(g.x, g.y);
      ctx.rotate(g.angle);
      ctx.scale(currentScale, currentScale);
      
      ctx.globalAlpha = currentOpacity;
      ctx.drawImage(this.gasCanvases[g.type], -128, -128);
      ctx.restore();
    });

    // 2. Update and Render Bright Star Dust
    this.starDust.forEach(s => {
      // Swirling organic curls
      const starNoise = Math.cos(s.x * 0.004 - time * 0.00008) * Math.sin(s.y * 0.004 + time * 0.00008) * Math.PI * 2.0;
      let sx = Math.cos(starNoise) * 0.45 + s.vx;
      let sy = Math.sin(starNoise) * 0.45 + s.vy;

      // Vacuum gravitation
      if (this.mouse.active && this.mouse.x !== null) {
        const sdx = this.mouse.x - s.x;
        const sdy = this.mouse.y - s.y;
        const sdist = Math.hypot(sdx, sdy);

        if (sdist < this.mouse.radius) {
          const sforce = (this.mouse.radius - sdist) / this.mouse.radius;
          const pullAngle = Math.atan2(sdy, sdx);
          const swirlAngle = pullAngle + Math.PI / 2 + 0.15; // tighter spiral

          sx += Math.cos(swirlAngle) * sforce * 2.4;
          sy += Math.sin(swirlAngle) * sforce * 2.4;
        }
      }

      s.x += sx;
      s.y += sy;

      // Wrap boundaries
      const starMargin = 20;
      if (s.x < -starMargin) s.x = this.width + starMargin;
      if (s.x > this.width + starMargin) s.x = -starMargin;
      if (s.y < -starMargin) s.y = this.height + starMargin;
      if (s.y > this.height + starMargin) s.y = -starMargin;

      // Flickering stars
      s.phase += s.orbitSpeed;
      const flicker = 0.6 + 0.4 * Math.sin(s.phase);

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fillStyle = s.color;
      ctx.globalAlpha = s.opacity * flicker;
      ctx.fill();
    });

    // Reset composite operation to default
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1.0;
  }

  destroy() {
    this.gasClouds = [];
    this.starDust = [];
    this.gasCanvases = {};
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
    return 'Nebula Gas Swirl';
  }

  static get description() {
    return 'Drifting organic cosmic clouds glowing in vibrant violet, pink, and amber hues. Moving the cursor acts as a gravity vacuum, spiraling gas clouds and sparkling stardust into spinning cosmic hurricanes.';
  }

  static get vibe() {
    return 'Cosmic';
  }

  static get sourceCode() {
    return `class NebulaGasSwirl {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.gasClouds = [];
    this.starDust = [];
    this.mouse = { x: null, y: null, active: false, radius: 250 };
    
    this.gasCanvases = {};
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
    this.gasClouds = [];
    this.starDust = [];

    this.initOffscreenCanvases();

    const densityFactor = 12000;
    const gasCount = Math.min(120, Math.max(40, Math.floor((this.width * this.height) / densityFactor)));
    const starCount = Math.min(300, Math.max(100, Math.floor((this.width * this.height) / 3000)));

    const colorsList = ['violet', 'pink', 'amber'];
    for (let i = 0; i < gasCount; i++) {
      const type = colorsList[Math.floor(Math.random() * colorsList.length)];
      const size = Math.random() * 160 + 100;
      this.gasClouds.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: size,
        type: type,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.005,
        pulseSpeed: 0.005 + Math.random() * 0.01,
        pulsePhase: Math.random() * Math.PI * 2,
        baseOpacity: Math.random() * 0.4 + 0.6
      });
    }

    const starColors = ['#FFFFFF', '#FFB7FF', '#C7E2FF', '#FFECA2'];
    for (let i = 0; i < starCount; i++) {
      this.starDust.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        radius: Math.random() * 1.5 + 0.4,
        color: starColors[Math.floor(Math.random() * starColors.length)],
        opacity: Math.random() * 0.7 + 0.3,
        orbitSpeed: 0.02 + Math.random() * 0.04,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  initOffscreenCanvases() {
    const types = ['violet', 'pink', 'amber'];
    types.forEach(type => {
      const size = 256;
      const offscreen = document.createElement('canvas');
      offscreen.width = size;
      offscreen.height = size;
      const octx = offscreen.getContext('2d');
      const grad = octx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
      
      if (type === 'violet') {
        grad.addColorStop(0, 'rgba(127, 0, 255, 0.4)');
        grad.addColorStop(0.3, 'rgba(145, 40, 255, 0.15)');
        grad.addColorStop(0.7, 'rgba(160, 80, 255, 0.04)');
        grad.addColorStop(1, 'rgba(160, 80, 255, 0)');
      } else if (type === 'pink') {
        grad.addColorStop(0, 'rgba(255, 0, 160, 0.35)');
        grad.addColorStop(0.3, 'rgba(255, 50, 180, 0.12)');
        grad.addColorStop(0.7, 'rgba(255, 80, 200, 0.035)');
        grad.addColorStop(1, 'rgba(255, 80, 200, 0)');
      } else if (type === 'amber') {
        grad.addColorStop(0, 'rgba(255, 140, 0, 0.32)');
        grad.addColorStop(0.3, 'rgba(255, 165, 30, 0.11)');
        grad.addColorStop(0.7, 'rgba(255, 180, 60, 0.03)');
        grad.addColorStop(1, 'rgba(255, 180, 60, 0)');
      }

      octx.fillStyle = grad;
      octx.fillRect(0, 0, size, size);
      this.gasCanvases[type] = offscreen;
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

    this.gasClouds.forEach(g => {
      if (g.x > this.width) g.x = Math.random() * this.width;
      if (g.y > this.height) g.y = Math.random() * this.height;
    });

    this.starDust.forEach(s => {
      if (s.x > this.width) s.x = Math.random() * this.width;
      if (s.y > this.height) s.y = Math.random() * this.height;
    });
  }

  animate(time = 0) {
    this.ctx.fillStyle = '#020108';
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.globalCompositeOperation = 'screen';

    this.gasClouds.forEach(g => {
      g.angle += g.spin;
      g.pulsePhase += g.pulseSpeed;

      const noiseAngle = Math.sin(g.x * 0.003 + time * 0.0001) * Math.cos(g.y * 0.003 - time * 0.0001) * Math.PI * 1.5;
      let dx = Math.cos(noiseAngle) * 0.28 + g.vx;
      let dy = Math.sin(noiseAngle) * 0.28 + g.vy;

      if (this.mouse.active && this.mouse.x !== null) {
        const pdx = this.mouse.x - g.x;
        const pdy = this.mouse.y - g.y;
        const dist = Math.hypot(pdx, pdy);

        if (dist < this.mouse.radius) {
          const force = (this.mouse.radius - dist) / this.mouse.radius;
          const pullAngle = Math.atan2(pdy, pdx);
          const orbitAngle = pullAngle + Math.PI / 2;
          dx += Math.cos(pullAngle) * force * 1.2 + Math.cos(orbitAngle) * force * 0.8;
          dy += Math.sin(pullAngle) * force * 1.2 + Math.sin(orbitAngle) * force * 0.8;
        }
      }

      g.x += dx;
      g.y += dy;

      const padding = g.size;
      if (g.x < -padding) g.x = this.width + padding;
      if (g.x > this.width + padding) g.x = -padding;
      if (g.y < -padding) g.y = this.height + padding;
      if (g.y > this.height + padding) g.y = -padding;

      const currentScale = (1.0 + Math.sin(g.pulsePhase) * 0.1) * (g.size / 256);
      const currentOpacity = g.baseOpacity * (0.8 + Math.sin(g.pulsePhase * 0.5) * 0.15);

      this.ctx.save();
      this.ctx.translate(g.x, g.y);
      this.ctx.rotate(g.angle);
      this.ctx.scale(currentScale, currentScale);
      this.ctx.globalAlpha = currentOpacity;
      this.ctx.drawImage(this.gasCanvases[g.type], -128, -128);
      this.ctx.restore();
    });

    this.starDust.forEach(s => {
      const starNoise = Math.cos(s.x * 0.004 - time * 0.00008) * Math.sin(s.y * 0.004 + time * 0.00008) * Math.PI * 2.0;
      let sx = Math.cos(starNoise) * 0.45 + s.vx;
      let sy = Math.sin(starNoise) * 0.45 + s.vy;

      if (this.mouse.active && this.mouse.x !== null) {
        const sdx = this.mouse.x - s.x;
        const sdy = this.mouse.y - s.y;
        const sdist = Math.hypot(sdx, sdy);

        if (sdist < this.mouse.radius) {
          const sforce = (this.mouse.radius - sdist) / this.mouse.radius;
          const pullAngle = Math.atan2(sdy, sdx);
          const swirlAngle = pullAngle + Math.PI / 2 + 0.15;
          sx += Math.cos(swirlAngle) * sforce * 2.4;
          sy += Math.sin(swirlAngle) * sforce * 2.4;
        }
      }

      s.x += sx;
      s.y += sy;

      const starMargin = 20;
      if (s.x < -starMargin) s.x = this.width + starMargin;
      if (s.x > this.width + starMargin) s.x = -starMargin;
      if (s.y < -starMargin) s.y = this.height + starMargin;
      if (s.y > this.height + starMargin) s.y = -starMargin;

      s.phase += s.orbitSpeed;
      const flicker = 0.6 + 0.4 * Math.sin(s.phase);

      this.ctx.beginPath();
      this.ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = s.color;
      this.ctx.globalAlpha = s.opacity * flicker;
      this.ctx.fill();
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
