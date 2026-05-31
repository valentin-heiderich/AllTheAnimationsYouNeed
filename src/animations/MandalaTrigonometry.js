import BaseAnimation from './BaseAnimation.js';

export default class MandalaTrigonometry extends BaseAnimation {
  constructor() {
    super();
    this.mouse = { x: null, y: null, active: false, rx: 0, ry: 0 };
    this.layers = [];
    this.sparkles = [];
  }

  setup() {
    this.layers = [];
    this.sparkles = [];
    this.mouse.rx = this.width / 2;
    this.mouse.ry = this.height / 2;

    const maxRadius = Math.min(this.width, this.height) * 0.44;

    // Define 6 concentric geometric mandala layers
    const layerCount = 6;
    for (let i = 0; i < layerCount; i++) {
      const radiusRatio = (i + 1) / layerCount;
      this.layers.push({
        baseRadius: maxRadius * radiusRatio * 0.95,
        amplitude: maxRadius * 0.12, // Depth of petals
        petals: 4 + i * 2, // Harmonic petal frequency multiplier
        rotationSpeed: 0.0003 * (i % 2 === 0 ? 1 : -1) * (layerCount - i),
        phaseOffset: i * (Math.PI / 4),
        color: i % 2 === 0 ? 'hsla(325, 100%, 60%, 0.45)' : 'hsla(55, 100%, 55%, 0.5)'
      });
    }

    // Interactive orbiting background particles
    const particleCount = Math.min(120, Math.floor((this.width * this.height) / 10000));
    for (let i = 0; i < particleCount; i++) {
      this.sparkles.push({
        angle: Math.random() * Math.PI * 2,
        distance: Math.random() * maxRadius * 1.3,
        speed: (Math.random() * 0.001 + 0.0005) * (Math.random() > 0.5 ? 1 : -1),
        size: Math.random() * 1.5 + 0.5,
        color: Math.random() > 0.5 ? '#ff007f' : '#ffd700'
      });
    }

    this.ctx.fillStyle = '#0a030d';
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  resize(width, height) {
    super.resize(width, height);
    this.setup();
  }

  draw(ctx, time) {
    // 1. Transparent dark violet background sweep to generate soft geometric trails
    ctx.fillStyle = 'rgba(10, 3, 13, 0.15)';
    ctx.fillRect(0, 0, this.width, this.height);

    const cx = this.width / 2;
    const cy = this.height / 2;

    // Track spring mouse coordinates
    let mouseParamX = 0.5;
    let mouseParamY = 0.5;

    if (this.mouse.active && this.mouse.x !== null) {
      this.mouse.rx = this.mouse.rx * 0.9 + this.mouse.x * 0.1;
      this.mouse.ry = this.mouse.ry * 0.9 + this.mouse.y * 0.1;
      mouseParamX = this.mouse.rx / this.width;
      mouseParamY = this.mouse.ry / this.height;
    } else {
      // Natural idle breathing pattern
      this.mouse.rx = this.mouse.rx * 0.98 + (this.width / 2) * 0.02;
      this.mouse.ry = this.mouse.ry * 0.98 + (this.height / 2) * 0.02;
      mouseParamX = 0.5 + Math.sin(time * 0.0003) * 0.2;
      mouseParamY = 0.5 + Math.cos(time * 0.0004) * 0.2;
    }

    // 2. Draw Orbiting Sparkle Dust
    this.sparkles.forEach(s => {
      s.angle += s.speed * (1.0 + mouseParamX * 1.5);
      
      const px = cx + Math.cos(s.angle) * s.distance;
      const py = cy + Math.sin(s.angle) * s.distance;

      ctx.beginPath();
      ctx.arc(px, py, s.size, 0, Math.PI * 2);
      ctx.fillStyle = s.color;
      ctx.fill();
    });

    // 3. Draw Paramount Mandala Curves
    ctx.lineCap = 'round';

    this.layers.forEach((layer, index) => {
      const currentPhase = time * layer.rotationSpeed + layer.phaseOffset;
      
      // Dynamic mathematical shifts based on mouse parameters
      const petalsMultiplier = Math.floor(4 + mouseParamX * 10);
      const dynamicPetals = index % 2 === 0 ? layer.petals : petalsMultiplier + index;
      
      const dynamicAmp = layer.amplitude * (0.4 + mouseParamY * 1.6);

      ctx.beginPath();

      // Trace the polar floral path
      const steps = 240; // Precision nodes
      for (let s = 0; s <= steps; s++) {
        const theta = (s / steps) * Math.PI * 2;
        
        // Polar rose equation: r = baseRadius + amplitude * cos(k * theta + phase)
        const radialLobe = Math.cos(dynamicPetals * theta + currentPhase);
        const radius = layer.baseRadius + dynamicAmp * radialLobe;

        const x = cx + Math.cos(theta) * radius;
        const y = cy + Math.sin(theta) * radius;

        if (s === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.closePath();

      // Elegant double stroke + glow
      ctx.strokeStyle = layer.color;
      ctx.lineWidth = 1.6 + (index * 0.45);
      ctx.stroke();

      // Subtle glow rings on high-order layers
      if (index === 3 || index === 5) {
        ctx.beginPath();
        ctx.arc(cx, cy, layer.baseRadius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 0, 127, 0.08)';
        ctx.lineWidth = 1.0;
        ctx.stroke();
      }
    });

    // 4. Center Core Concentric Sacred Geometry Bindings
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#ff007f';
    ctx.fill();
  }

  destroy() {
    super.destroy();
    this.layers = [];
    this.sparkles = [];
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
    return 'Mandala Trigonometry';
  }

  static get description() {
    return 'Mesmerizing geometric kaleidoscope composed of rotating concentric floral patterns. Shapes are generated via parametric polar rose equations. Moving the cursor alters the number of petals, rotation velocity, and geometric amplitude phases, blending vivid magenta and golden yellow lines.';
  }

  static get vibe() {
    return 'Geometric';
  }

  static get sourceCode() {
    return `class MandalaTrigonometry {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.mouse = { x: null, y: null, active: false, rx: 0, ry: 0 };
    this.layers = [];
    this.sparkles = [];

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
    this.layers = [];
    this.sparkles = [];
    this.mouse.rx = this.width / 2;
    this.mouse.ry = this.height / 2;

    const maxRadius = Math.min(this.width, this.height) * 0.44;
    const layerCount = 6;

    for (let i = 0; i < layerCount; i++) {
      const radiusRatio = (i + 1) / layerCount;
      this.layers.push({
        baseRadius: maxRadius * radiusRatio * 0.95,
        amplitude: maxRadius * 0.12,
        petals: 4 + i * 2,
        rotationSpeed: 0.0003 * (i % 2 === 0 ? 1 : -1) * (layerCount - i),
        phaseOffset: i * (Math.PI / 4),
        color: i % 2 === 0 ? 'hsla(325, 100%, 60%, 0.45)' : 'hsla(55, 100%, 55%, 0.5)'
      });
    }

    const particleCount = Math.min(120, Math.floor((this.width * this.height) / 10000));
    for (let i = 0; i < particleCount; i++) {
      this.sparkles.push({
        angle: Math.random() * Math.PI * 2,
        distance: Math.random() * maxRadius * 1.3,
        speed: (Math.random() * 0.001 + 0.0005) * (Math.random() > 0.5 ? 1 : -1),
        size: Math.random() * 1.5 + 0.5,
        color: Math.random() > 0.5 ? '#ff007f' : '#ffd700'
      });
    }

    this.ctx.fillStyle = '#0a030d';
    this.ctx.fillRect(0, 0, this.width, this.height);
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
    this.ctx.fillStyle = 'rgba(10, 3, 13, 0.15)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    const cx = this.width / 2;
    const cy = this.height / 2;

    let mouseParamX = 0.5;
    let mouseParamY = 0.5;

    if (this.mouse.active && this.mouse.x !== null) {
      this.mouse.rx = this.mouse.rx * 0.9 + this.mouse.x * 0.1;
      this.mouse.ry = this.mouse.ry * 0.9 + this.mouse.y * 0.1;
      mouseParamX = this.mouse.rx / this.width;
      mouseParamY = this.mouse.ry / this.height;
    } else {
      this.mouse.rx = this.mouse.rx * 0.98 + (this.width / 2) * 0.02;
      this.mouse.ry = this.mouse.ry * 0.98 + (this.height / 2) * 0.02;
      mouseParamX = 0.5 + Math.sin(time * 0.0003) * 0.2;
      mouseParamY = 0.5 + Math.cos(time * 0.0004) * 0.2;
    }

    this.sparkles.forEach(s => {
      s.angle += s.speed * (1.0 + mouseParamX * 1.5);
      const px = cx + Math.cos(s.angle) * s.distance;
      const py = cy + Math.sin(s.angle) * s.distance;

      this.ctx.beginPath();
      this.ctx.arc(px, py, s.size, 0, Math.PI * 2);
      this.ctx.fillStyle = s.color;
      this.ctx.fill();
    });

    this.ctx.lineCap = 'round';

    this.layers.forEach((layer, index) => {
      const currentPhase = time * layer.rotationSpeed + layer.phaseOffset;
      const petalsMultiplier = Math.floor(4 + mouseParamX * 10);
      const dynamicPetals = index % 2 === 0 ? layer.petals : petalsMultiplier + index;
      const dynamicAmp = layer.amplitude * (0.4 + mouseParamY * 1.6);

      this.ctx.beginPath();

      const steps = 240;
      for (let s = 0; s <= steps; s++) {
        const theta = (s / steps) * Math.PI * 2;
        const radialLobe = Math.cos(dynamicPetals * theta + currentPhase);
        const radius = layer.baseRadius + dynamicAmp * radialLobe;

        const x = cx + Math.cos(theta) * radius;
        const y = cy + Math.sin(theta) * radius;

        if (s === 0) {
          this.ctx.moveTo(x, y);
        } else {
          this.ctx.lineTo(x, y);
        }
      }

      this.ctx.closePath();

      this.ctx.strokeStyle = layer.color;
      this.ctx.lineWidth = 1.6 + (index * 0.45);
      this.ctx.stroke();

      if (index === 3 || index === 5) {
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, layer.baseRadius, 0, Math.PI * 2);
        this.ctx.strokeStyle = 'rgba(255, 0, 127, 0.08)';
        this.ctx.lineWidth = 1.0;
        this.ctx.stroke();
      }
    });

    this.ctx.beginPath();
    this.ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    this.ctx.strokeStyle = '#ffd700';
    this.ctx.lineWidth = 1.5;
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    this.ctx.fillStyle = '#ff007f';
    this.ctx.fill();

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
