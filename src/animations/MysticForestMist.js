import BaseAnimation from './BaseAnimation.js';

export default class MysticForestMist extends BaseAnimation {
  constructor() {
    super();
    this.layers = [];
    this.spores = [];
    this.mouse = { x: null, y: null, active: false, radius: 150 };
  }

  setup() {
    this.layers = [
      {
        baseHeightPercent: 0.65,
        speed: 0.0003,
        amplitude: 45,
        frequency: 0.003,
        colorStart: 'hsla(160, 40%, 15%, 0.0)',
        colorEnd: 'hsla(160, 50%, 8%, 0.35)',
        pointsCount: Math.ceil(this.width / 15) + 1
      },
      {
        baseHeightPercent: 0.72,
        speed: 0.0005,
        amplitude: 35,
        frequency: 0.005,
        colorStart: 'hsla(170, 35%, 18%, 0.0)',
        colorEnd: 'hsla(175, 45%, 12%, 0.45)',
        pointsCount: Math.ceil(this.width / 12) + 1
      },
      {
        baseHeightPercent: 0.8,
        speed: 0.0007,
        amplitude: 25,
        frequency: 0.008,
        colorStart: 'hsla(185, 30%, 25%, 0.0)',
        colorEnd: 'hsla(190, 40%, 15%, 0.55)',
        pointsCount: Math.ceil(this.width / 10) + 1
      }
    ];

    // Initialize forest spores (floating light specs)
    this.spores = [];
    const sporeCount = Math.floor((this.width * this.height) / 25000) + 15;
    for (let i = 0; i < sporeCount; i++) {
      this.spores.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: Math.random() * 0.4 + 0.1,
        vy: Math.random() * 0.2 - 0.1,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.6 + 0.2,
        phase: Math.random() * Math.PI * 2,
        hue: 140 + Math.random() * 60 // Sage green to blue-green
      });
    }
  }

  resize(width, height) {
    super.resize(width, height);
    this.setup();
  }

  draw(ctx, time) {
    // Premium deep forest nocturnal gradient background
    const bgGradient = ctx.createLinearGradient(0, 0, 0, this.height);
    bgGradient.addColorStop(0, '#04070a');
    bgGradient.addColorStop(0.5, '#060b10');
    bgGradient.addColorStop(1, '#020508');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, this.width, this.height);

    // Draw background spores (behind closest mist layers)
    this.drawSpores(ctx, time, 0.4);

    // Draw overlapping mist layers
    this.layers.forEach((layer, layerIndex) => {
      ctx.beginPath();
      
      const step = this.width / (layer.pointsCount - 1);
      const points = [];

      for (let i = 0; i < layer.pointsCount; i++) {
        const x = i * step;
        
        // Base trigonometric noise fog
        const baseHeight = this.height * layer.baseHeightPercent;
        const wave1 = Math.sin(x * layer.frequency + time * layer.speed) * layer.amplitude;
        const wave2 = Math.cos(x * (layer.frequency * 1.7) - time * (layer.speed * 1.3)) * (layer.amplitude * 0.5);
        let y = baseHeight + wave1 + wave2;

        // Interactive mouse repellent clearing force (pushes mist down/away)
        if (this.mouse.active && this.mouse.x !== null) {
          const dx = x - this.mouse.x;
          const dist = Math.abs(dx);
          
          if (dist < this.mouse.radius) {
            const force = (this.mouse.radius - dist) / this.mouse.radius;
            const dy = this.mouse.y - y;
            
            // Push mist downwards dynamically when mouse is near
            if (dy > -100 && dy < 150) {
              const pushForce = Math.max(0, 150 - dy) * force * 0.75;
              y += pushForce;
            }
          }
        }

        points.push({ x, y });
      }

      // Draw vector path with smooth bezier curves
      ctx.moveTo(0, this.height);
      ctx.lineTo(points[0].x, points[0].y);

      for (let i = 0; i < points.length - 1; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
      }

      ctx.lineTo(this.width, this.height);
      ctx.closePath();

      // Create vertical mist fading gradient
      const mistGradient = ctx.createLinearGradient(0, this.height * layer.baseHeightPercent - layer.amplitude * 2, 0, this.height);
      mistGradient.addColorStop(0, layer.colorStart);
      mistGradient.addColorStop(1, layer.colorEnd);

      ctx.fillStyle = mistGradient;
      ctx.fill();
    });

    // Draw foreground spores (in front of mist layers)
    this.drawSpores(ctx, time, 1.0);
  }

  drawSpores(ctx, time, minOpacity) {
    this.spores.forEach(spore => {
      // Drift movement
      spore.x += spore.vx;
      spore.y += spore.vy + Math.sin(time * 0.001 + spore.phase) * 0.15;

      // Mouse clearance for floating spores
      if (this.mouse.active && this.mouse.x !== null) {
        const dx = spore.x - this.mouse.x;
        const dy = spore.y - this.mouse.y;
        const dist = Math.hypot(dx, dy);
        const repelRadius = 80;

        if (dist < repelRadius) {
          const force = (repelRadius - dist) / repelRadius;
          spore.x += (dx / (dist || 1)) * force * 3;
          spore.y += (dy / (dist || 1)) * force * 3;
        }
      }

      // Wrap boundaries
      if (spore.x > this.width + 10) spore.x = -10;
      if (spore.y < -10) spore.y = this.height + 10;
      if (spore.y > this.height + 10) spore.y = -10;

      // Pulse opacity
      const opacity = spore.opacity * (0.6 + Math.sin(time * 0.002 + spore.phase) * 0.4);

      if (opacity > minOpacity) {
        ctx.beginPath();
        ctx.fillStyle = `hsla(${spore.hue}, 100%, 75%, ${opacity})`;
        ctx.shadowBlur = 6;
        ctx.shadowColor = `hsla(${spore.hue}, 100%, 75%, 0.8)`;
        ctx.arc(spore.x, spore.y, spore.size, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.shadowBlur = 0;
  }

  destroy() {
    super.destroy();
    this.layers = [];
    this.spores = [];
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
    return 'Mystic Forest Mist';
  }

  static get description() {
    return 'Overlapping vector mist layers moving slowly across screen depths. High-performance trigonometric noise creates shifting layers, which parting dynamically around your cursor cursor.';
  }

  static get vibe() {
    return 'Atmospheric';
  }

  static get sourceCode() {
    return `class MysticForestMist {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.layers = [];
    this.spores = [];
    this.mouse = { x: null, y: null, active: false, radius: 150 };
    
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
    this.layers = [
      {
        baseHeightPercent: 0.65,
        speed: 0.0003,
        amplitude: 45,
        frequency: 0.003,
        colorStart: 'hsla(160, 40%, 15%, 0.0)',
        colorEnd: 'hsla(160, 50%, 8%, 0.35)',
        pointsCount: Math.ceil(this.width / 15) + 1
      },
      {
        baseHeightPercent: 0.72,
        speed: 0.0005,
        amplitude: 35,
        frequency: 0.005,
        colorStart: 'hsla(170, 35%, 18%, 0.0)',
        colorEnd: 'hsla(175, 45%, 12%, 0.45)',
        pointsCount: Math.ceil(this.width / 12) + 1
      },
      {
        baseHeightPercent: 0.8,
        speed: 0.0007,
        amplitude: 25,
        frequency: 0.008,
        colorStart: 'hsla(185, 30%, 25%, 0.0)',
        colorEnd: 'hsla(190, 40%, 15%, 0.55)',
        pointsCount: Math.ceil(this.width / 10) + 1
      }
    ];

    this.spores = [];
    const sporeCount = Math.floor((this.width * this.height) / 25000) + 15;
    for (let i = 0; i < sporeCount; i++) {
      this.spores.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: Math.random() * 0.4 + 0.1,
        vy: Math.random() * 0.2 - 0.1,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.6 + 0.2,
        phase: Math.random() * Math.PI * 2,
        hue: 140 + Math.random() * 60
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
    const bgGradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
    bgGradient.addColorStop(0, '#04070a');
    bgGradient.addColorStop(0.5, '#060b10');
    bgGradient.addColorStop(1, '#020508');
    this.ctx.fillStyle = bgGradient;
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.drawSpores(time, 0.4);

    this.layers.forEach((layer) => {
      this.ctx.beginPath();
      const step = this.width / (layer.pointsCount - 1);
      const points = [];

      for (let i = 0; i < layer.pointsCount; i++) {
        const x = i * step;
        const baseHeight = this.height * layer.baseHeightPercent;
        const wave1 = Math.sin(x * layer.frequency + time * layer.speed) * layer.amplitude;
        const wave2 = Math.cos(x * (layer.frequency * 1.7) - time * (layer.speed * 1.3)) * (layer.amplitude * 0.5);
        let y = baseHeight + wave1 + wave2;

        if (this.mouse.active && this.mouse.x !== null) {
          const dx = x - this.mouse.x;
          const dist = Math.abs(dx);
          
          if (dist < this.mouse.radius) {
            const force = (this.mouse.radius - dist) / this.mouse.radius;
            const dy = this.mouse.y - y;
            if (dy > -100 && dy < 150) {
              const pushForce = Math.max(0, 150 - dy) * force * 0.75;
              y += pushForce;
            }
          }
        }
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

      const mistGradient = this.ctx.createLinearGradient(0, this.height * layer.baseHeightPercent - layer.amplitude * 2, 0, this.height);
      mistGradient.addColorStop(0, layer.colorStart);
      mistGradient.addColorStop(1, layer.colorEnd);

      this.ctx.fillStyle = mistGradient;
      this.ctx.fill();
    });

    this.drawSpores(time, 1.0);

    requestAnimationFrame((t) => this.animate(t));
  }

  drawSpores(time, minOpacity) {
    this.spores.forEach(spore => {
      spore.x += spore.vx;
      spore.y += spore.vy + Math.sin(time * 0.001 + spore.phase) * 0.15;

      if (this.mouse.active && this.mouse.x !== null) {
        const dx = spore.x - this.mouse.x;
        const dy = spore.y - this.mouse.y;
        const dist = Math.hypot(dx, dy);
        const repelRadius = 80;

        if (dist < repelRadius) {
          const force = (repelRadius - dist) / repelRadius;
          spore.x += (dx / (dist || 1)) * force * 3;
          spore.y += (dy / (dist || 1)) * force * 3;
        }
      }

      if (spore.x > this.width + 10) spore.x = -10;
      if (spore.y < -10) spore.y = this.height + 10;
      if (spore.y > this.height + 10) spore.y = -10;

      const opacity = spore.opacity * (0.6 + Math.sin(time * 0.002 + spore.phase) * 0.4);

      if (opacity > minOpacity) {
        this.ctx.beginPath();
        this.ctx.fillStyle = \`hsla(\${spore.hue}, 100%, 75%, \${opacity})\`;
        this.ctx.shadowBlur = 6;
        this.ctx.shadowColor = \`hsla(\${spore.hue}, 100%, 75%, 0.8)\`;
        this.ctx.arc(spore.x, spore.y, spore.size, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });
    this.ctx.shadowBlur = 0;
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
