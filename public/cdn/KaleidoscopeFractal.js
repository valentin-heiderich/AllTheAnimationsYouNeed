import BaseAnimation from './BaseAnimation.js';

export default class KaleidoscopeFractal extends BaseAnimation {
  constructor() {
    super();
    this.mouse = { x: null, y: null, active: false };
    this.shapes = [];
    this.slices = 12; // 12-fold symmetry
  }

  setup() {
    this.shapes = [];
    // Number of elements scales with viewport area
    const count = Math.min(25, Math.max(10, Math.floor((this.width * this.height) / 45000)));

    for (let i = 0; i < count; i++) {
      this.shapes.push({
        angle: Math.random() * Math.PI * 2,
        radius: Math.random() * 200 + 50,
        speed: (Math.random() - 0.5) * 0.015,
        size: Math.random() * 40 + 10,
        colorHue: Math.random() * 360,
        hueSpeed: Math.random() * 0.2 + 0.1,
        type: Math.random() > 0.5 ? 'triangle' : 'line',
        rotSpeed: (Math.random() - 0.5) * 0.03
      });
    }
  }

  resize(width, height) {
    super.resize(width, height);
    this.setup();
  }

  draw(ctx, time) {
    // Deep black-indigo background with slight trail fade
    ctx.fillStyle = 'rgba(5, 5, 10, 0.08)';
    ctx.fillRect(0, 0, this.width, this.height);

    const centerX = this.width / 2;
    const centerY = this.height / 2;

    // Interactive mouse scaling and rotation factors
    let scaleFactor = 1.0;
    let rotationOffset = 0;
    let foldFactor = 0;

    if (this.mouse.active && this.mouse.x !== null) {
      const dx = this.mouse.x - centerX;
      const dy = this.mouse.y - centerY;
      const dist = Math.hypot(dx, dy);
      const maxDist = Math.hypot(centerX, centerY);

      // Mouse distance scales shapes, mouse angle rotates mirror plane, offset creates folding
      scaleFactor = 0.5 + (dist / maxDist) * 1.5;
      rotationOffset = Math.atan2(dy, dx);
      foldFactor = (this.mouse.x / this.width) * 50;
    }

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(time * 0.0001); // Slow base canvas spin

    // 12 reflection slices
    for (let s = 0; s < this.slices; s++) {
      ctx.save();
      // Rotate for each slice
      ctx.rotate((s * Math.PI * 2) / this.slices + rotationOffset);

      // Reflect alternate slices to create flawless mirror symmetry
      if (s % 2 === 0) {
        ctx.scale(1, -1);
      }

      // Draw the base fractal shapes inside this slice
      this.shapes.forEach((shape, index) => {
        // Shifting coordinates
        shape.angle += shape.speed;
        shape.colorHue = (shape.colorHue + shape.hueSpeed) % 360;

        // Dynamic base positions adjusted by mouse foldFactor
        const shapeX = Math.cos(shape.angle) * shape.radius * scaleFactor + foldFactor;
        const shapeY = Math.sin(shape.angle) * shape.radius * scaleFactor;
        const curSize = shape.size * (1.0 + Math.sin(time * 0.002 + index) * 0.2);

        // Rainbow prism glow
        ctx.strokeStyle = `hsla(${(shape.colorHue + time * 0.05) % 360}, 100%, 65%, 0.45)`;
        ctx.fillStyle = `hsla(${(shape.colorHue + time * 0.05) % 360}, 100%, 65%, 0.03)`;
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 6;
        ctx.shadowColor = `hsla(${(shape.colorHue + time * 0.05) % 360}, 100%, 65%, 0.5)`;

        ctx.save();
        ctx.translate(shapeX, shapeY);
        ctx.rotate(time * 0.001 + index);

        ctx.beginPath();
        if (shape.type === 'triangle') {
          // Draw perfect triangular mirror cell
          ctx.moveTo(0, -curSize);
          ctx.lineTo(curSize * 0.86, curSize * 0.5);
          ctx.lineTo(-curSize * 0.86, curSize * 0.5);
          ctx.closePath();
        } else {
          // Cross-beams representing geometric glass facets
          ctx.moveTo(-curSize, 0);
          ctx.lineTo(curSize, 0);
          ctx.moveTo(0, -curSize * 0.5);
          ctx.lineTo(0, curSize * 0.5);
        }
        ctx.stroke();
        ctx.fill();
        ctx.restore();
      });

      ctx.restore();
    }

    ctx.restore();
    ctx.shadowBlur = 0; // Reset shadow for performance
  }

  destroy() {
    super.destroy();
    this.shapes = [];
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
    return 'Kaleidoscope Fractal';
  }

  static get description() {
    return 'A mathematical kaleidoscope of repeating, symmetrical mirrors. Your cursor interacts as a spatial lens, scaling, rotating, and folding the underlying prism structures.';
  }

  static get vibe() {
    return 'Geometric';
  }

  static get sourceCode() {
    return `class KaleidoscopeFractal {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.mouse = { x: null, y: null, active: false };
    this.shapes = [];
    this.slices = 12;
    
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
    this.shapes = [];
    const count = Math.min(25, Math.max(10, Math.floor((this.width * this.height) / 45000)));

    for (let i = 0; i < count; i++) {
      this.shapes.push({
        angle: Math.random() * Math.PI * 2,
        radius: Math.random() * 200 + 50,
        speed: (Math.random() - 0.5) * 0.015,
        size: Math.random() * 40 + 10,
        colorHue: Math.random() * 360,
        hueSpeed: Math.random() * 0.2 + 0.1,
        type: Math.random() > 0.5 ? 'triangle' : 'line'
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
    this.ctx.fillStyle = 'rgba(5, 5, 10, 0.08)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    const centerX = this.width / 2;
    const centerY = this.height / 2;

    let scaleFactor = 1.0;
    let rotationOffset = 0;
    let foldFactor = 0;

    if (this.mouse.active && this.mouse.x !== null) {
      const dx = this.mouse.x - centerX;
      const dy = this.mouse.y - centerY;
      const dist = Math.hypot(dx, dy);
      const maxDist = Math.hypot(centerX, centerY);

      scaleFactor = 0.5 + (dist / maxDist) * 1.5;
      rotationOffset = Math.atan2(dy, dx);
      foldFactor = (this.mouse.x / this.width) * 50;
    }

    this.ctx.save();
    this.ctx.translate(centerX, centerY);
    this.ctx.rotate(time * 0.0001);

    for (let s = 0; s < this.slices; s++) {
      this.ctx.save();
      this.ctx.rotate((s * Math.PI * 2) / this.slices + rotationOffset);

      if (s % 2 === 0) {
        this.ctx.scale(1, -1);
      }

      this.shapes.forEach((shape, index) => {
        shape.angle += shape.speed;
        shape.colorHue = (shape.colorHue + shape.hueSpeed) % 360;

        const shapeX = Math.cos(shape.angle) * shape.radius * scaleFactor + foldFactor;
        const shapeY = Math.sin(shape.angle) * shape.radius * scaleFactor;
        const curSize = shape.size * (1.0 + Math.sin(time * 0.002 + index) * 0.2);

        this.ctx.strokeStyle = \`hsla(\${(shape.colorHue + time * 0.05) % 360}, 100%, 65%, 0.45)\`;
        this.ctx.fillStyle = \`hsla(\${(shape.colorHue + time * 0.05) % 360}, 100%, 65%, 0.03)\`;
        this.ctx.lineWidth = 1.5;
        this.ctx.shadowBlur = 6;
        this.ctx.shadowColor = \`hsla(\${(shape.colorHue + time * 0.05) % 360}, 100%, 65%, 0.5)\`;

        this.ctx.save();
        this.ctx.translate(shapeX, shapeY);
        this.ctx.rotate(time * 0.001 + index);

        this.ctx.beginPath();
        if (shape.type === 'triangle') {
          this.ctx.moveTo(0, -curSize);
          this.ctx.lineTo(curSize * 0.86, curSize * 0.5);
          this.ctx.lineTo(-curSize * 0.86, curSize * 0.5);
          this.ctx.closePath();
        } else {
          this.ctx.moveTo(-curSize, 0);
          this.ctx.lineTo(curSize, 0);
          this.ctx.moveTo(0, -curSize * 0.5);
          this.ctx.lineTo(0, curSize * 0.5);
        }
        this.ctx.stroke();
        this.ctx.fill();
        this.ctx.restore();
      });

      this.ctx.restore();
    }

    this.ctx.restore();
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
