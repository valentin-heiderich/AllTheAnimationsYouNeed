import BaseAnimation from './BaseAnimation.js';

export default class OceanWaveRipple extends BaseAnimation {
  constructor() {
    super();
    this.layers = [];
    this.ripples = [];
    this.mouse = { x: null, y: null, active: false, radius: 150 };
    this.lastMouseX = null;
    this.lastMouseY = null;
  }

  setup() {
    this.ripples = [];
    this.lastMouseX = null;
    this.lastMouseY = null;

    // Define 4 depth layers from back to front with perspective styling
    this.layers = [
      {
        baseYPct: 0.55,
        amplitude: 15,
        wavelength: 220,
        speed: 0.0012,
        color: '#081626',
        highlightColor: 'rgba(30, 80, 140, 0.4)',
        pointsCount: Math.ceil(this.width / 8) + 1
      },
      {
        baseYPct: 0.68,
        amplitude: 25,
        wavelength: 170,
        speed: 0.0018,
        color: '#0d253f',
        highlightColor: 'rgba(0, 150, 200, 0.5)',
        pointsCount: Math.ceil(this.width / 6) + 1
      },
      {
        baseYPct: 0.80,
        amplitude: 35,
        wavelength: 120,
        speed: 0.0024,
        color: '#13395c',
        highlightColor: 'rgba(0, 210, 230, 0.6)',
        pointsCount: Math.ceil(this.width / 5) + 1
      },
      {
        baseYPct: 0.92,
        amplitude: 45,
        wavelength: 90,
        speed: 0.003,
        color: '#184f7d',
        highlightColor: 'rgba(50, 255, 220, 0.75)',
        pointsCount: Math.ceil(this.width / 4) + 1
      }
    ];
  }

  resize(width, height) {
    super.resize(width, height);
    this.setup();
  }

  draw(ctx, time) {
    // Beautiful deep sea gradient background
    const bgGradient = ctx.createLinearGradient(0, 0, 0, this.height);
    bgGradient.addColorStop(0, '#02070f');
    bgGradient.addColorStop(0.5, '#051122');
    bgGradient.addColorStop(1, '#081830');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, this.width, this.height);

    // Update propagating mouse ripples
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const rip = this.ripples[i];
      rip.x += rip.direction * rip.speed;
      rip.life -= rip.decay;

      if (rip.life <= 0) {
        this.ripples.splice(i, 1);
      }
    }

    // Dynamic wave height swell based on cursor Y height (higher y is higher swell)
    let mouseSwell = 1.0;
    if (this.mouse.active && this.mouse.y !== null) {
      const yRatio = 1.0 - this.mouse.y / this.height; // 0 (bottom) to 1 (top)
      mouseSwell = 0.5 + yRatio * 1.8;
    }

    // Draw overlapping wave layers
    this.layers.forEach((layer, layerIdx) => {
      ctx.beginPath();
      const step = this.width / (layer.pointsCount - 1);
      const points = [];

      for (let i = 0; i < layer.pointsCount; i++) {
        const x = i * step;
        
        // Base sine wave motion
        const angle = (x / layer.wavelength) + (time * layer.speed);
        let y = (this.height * layer.baseYPct) + Math.sin(angle) * layer.amplitude * mouseSwell;

        // Apply interactive propagating wave ripples
        this.ripples.forEach(rip => {
          const dist = Math.abs(x - rip.x);
          const ripRadius = 180;
          if (dist < ripRadius) {
            const ripForce = Math.sin((dist / 15) - (time * 0.015)) * rip.amplitude * rip.life * (1 - dist / ripRadius);
            // Ripple layer scaling (closer layer gets stronger ripples)
            y += ripForce * (0.4 + (layerIdx * 0.2));
          }
        });

        points.push({ x, y });
      }

      // Draw vector wave body filled down to canvas bottom
      ctx.moveTo(0, this.height);
      ctx.lineTo(points[0].x, points[0].y);

      for (let i = 0; i < points.length - 1; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
      }

      ctx.lineTo(this.width, this.height);
      ctx.closePath();

      // Create vertical depth wave fill gradient
      const waveGrad = ctx.createLinearGradient(0, this.height * layer.baseYPct - layer.amplitude * 2, 0, this.height);
      waveGrad.addColorStop(0, layer.color);
      // Front layers fade slightly into neon tones
      waveGrad.addColorStop(1, '#020a14');
      ctx.fillStyle = waveGrad;
      ctx.fill();

      // Draw glowing crest line (premium aesthetic)
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 0; i < points.length - 1; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
      }
      ctx.strokeStyle = layer.highlightColor;
      ctx.lineWidth = 2.5 + (layerIdx * 0.5);
      
      // Add subtle glow to front-most wave crests
      if (layerIdx >= 2) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = layer.highlightColor;
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    });
  }

  destroy() {
    super.destroy();
    this.layers = [];
    this.ripples = [];
  }

  handleMouseMove(x, y) {
    this.mouse.x = x;
    this.mouse.y = y;
    this.mouse.active = true;

    // Spawn propagating wave ripples on rapid cursor horizontal movement
    if (this.lastMouseX !== null) {
      const dx = x - this.lastMouseX;
      const dy = y - this.lastMouseY;
      const speed = Math.hypot(dx, dy);

      if (speed > 15 && this.ripples.length < 8) {
        const dir = dx > 0 ? 1 : -1;
        this.ripples.push({
          x: x,
          direction: dir,
          speed: 4.5 + Math.random() * 2,
          amplitude: Math.min(30, speed * 0.6),
          life: 1.0,
          decay: 0.015 + Math.random() * 0.01
        });
        
        // Spawn symmetric opposing ripple for fluid impact feel
        this.ripples.push({
          x: x,
          direction: -dir,
          speed: 4.5 + Math.random() * 2,
          amplitude: Math.min(20, speed * 0.4),
          life: 0.8,
          decay: 0.02 + Math.random() * 0.01
        });
      }
    }

    this.lastMouseX = x;
    this.lastMouseY = y;
  }

  handleMouseLeave() {
    this.mouse.active = false;
    this.mouse.x = null;
    this.mouse.y = null;
    this.lastMouseX = null;
    this.lastMouseY = null;
  }

  static get title() {
    return 'Ocean Wave Ripple';
  }

  static get description() {
    return 'Overlapping ocean wave ripples shifting horizontally in layered perspective. Vertically scrolling your cursor swells the tide, and horizontal sweeps trigger ripples that traverse the water.';
  }

  static get vibe() {
    return 'Satisfying';
  }

  static get sourceCode() {
    return `class OceanWaveRipple {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.layers = [];
    this.ripples = [];
    this.mouse = { x: null, y: null, active: false, radius: 150 };
    this.lastMouseX = null;
    this.lastMouseY = null;
    
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
    this.ripples = [];
    this.lastMouseX = null;
    this.lastMouseY = null;

    this.layers = [
      {
        baseYPct: 0.55,
        amplitude: 15,
        wavelength: 220,
        speed: 0.0012,
        color: '#081626',
        highlightColor: 'rgba(30, 80, 140, 0.4)',
        pointsCount: Math.ceil(this.width / 8) + 1
      },
      {
        baseYPct: 0.68,
        amplitude: 25,
        wavelength: 170,
        speed: 0.0018,
        color: '#0d253f',
        highlightColor: 'rgba(0, 150, 200, 0.5)',
        pointsCount: Math.ceil(this.width / 6) + 1
      },
      {
        baseYPct: 0.80,
        amplitude: 35,
        wavelength: 120,
        speed: 0.0024,
        color: '#13395c',
        highlightColor: 'rgba(0, 210, 230, 0.6)',
        pointsCount: Math.ceil(this.width / 5) + 1
      },
      {
        baseYPct: 0.92,
        amplitude: 45,
        wavelength: 90,
        speed: 0.003,
        color: '#184f7d',
        highlightColor: 'rgba(50, 255, 220, 0.75)',
        pointsCount: Math.ceil(this.width / 4) + 1
      }
    ];
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
    const bgGradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
    bgGradient.addColorStop(0, '#02070f');
    bgGradient.addColorStop(0.5, '#051122');
    bgGradient.addColorStop(1, '#081830');
    this.ctx.fillStyle = bgGradient;
    this.ctx.fillRect(0, 0, this.width, this.height);

    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const rip = this.ripples[i];
      rip.x += rip.direction * rip.speed;
      rip.life -= rip.decay;

      if (rip.life <= 0) {
        this.ripples.splice(i, 1);
      }
    }

    let mouseSwell = 1.0;
    if (this.mouse.active && this.mouse.y !== null) {
      const yRatio = 1.0 - this.mouse.y / this.height;
      mouseSwell = 0.5 + yRatio * 1.8;
    }

    this.layers.forEach((layer, layerIdx) => {
      this.ctx.beginPath();
      const step = this.width / (layer.pointsCount - 1);
      const points = [];

      for (let i = 0; i < layer.pointsCount; i++) {
        const x = i * step;
        const angle = (x / layer.wavelength) + (time * layer.speed);
        let y = (this.height * layer.baseYPct) + Math.sin(angle) * layer.amplitude * mouseSwell;

        this.ripples.forEach(rip => {
          const dist = Math.abs(x - rip.x);
          const ripRadius = 180;
          if (dist < ripRadius) {
            const ripForce = Math.sin((dist / 15) - (time * 0.015)) * rip.amplitude * rip.life * (1 - dist / ripRadius);
            y += ripForce * (0.4 + (layerIdx * 0.2));
          }
        });

        points.push({ x, y });
      }

      this.ctx.moveTo(0, this.height);
      this.ctx.lineTo(points[0].x, points[0].y);

      for (let i = 0; i < points.length - 1; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        this.ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
      }

      this.ctx.lineTo(this.width, this.height);
      this.ctx.closePath();

      const waveGrad = this.ctx.createLinearGradient(0, this.height * layer.baseYPct - layer.amplitude * 2, 0, this.height);
      waveGrad.addColorStop(0, layer.color);
      waveGrad.addColorStop(1, '#020a14');
      this.ctx.fillStyle = waveGrad;
      this.ctx.fill();

      this.ctx.beginPath();
      this.ctx.moveTo(points[0].x, points[0].y);
      for (let i = 0; i < points.length - 1; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        this.ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
      }
      this.ctx.strokeStyle = layer.highlightColor;
      this.ctx.lineWidth = 2.5 + (layerIdx * 0.5);
      
      if (layerIdx >= 2) {
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = layer.highlightColor;
      }
      this.ctx.stroke();
      this.ctx.shadowBlur = 0;
    });

    requestAnimationFrame((t) => this.animate(t));
  }

  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    this.mouse.x = x;
    this.mouse.y = y;
    this.mouse.active = true;

    if (this.lastMouseX !== null) {
      const dx = x - this.lastMouseX;
      const dy = y - this.lastMouseY;
      const speed = Math.hypot(dx, dy);

      if (speed > 15 && this.ripples.length < 8) {
        const dir = dx > 0 ? 1 : -1;
        this.ripples.push({
          x: x,
          direction: dir,
          speed: 4.5 + Math.random() * 2,
          amplitude: Math.min(30, speed * 0.6),
          life: 1.0,
          decay: 0.015 + Math.random() * 0.01
        });
        
        this.ripples.push({
          x: x,
          direction: -dir,
          speed: 4.5 + Math.random() * 2,
          amplitude: Math.min(20, speed * 0.4),
          life: 0.8,
          decay: 0.02 + Math.random() * 0.01
        });
      }
    }

    this.lastMouseX = x;
    this.lastMouseY = y;
  }

  handleMouseLeave() {
    this.mouse.active = false;
    this.mouse.x = null;
    this.mouse.y = null;
    this.lastMouseX = null;
    this.lastMouseY = null;
  }
}`;
  }
}
