import BaseAnimation from './BaseAnimation.js';

export default class WindyGrassField extends BaseAnimation {
  constructor() {
    super();
    this.blades = [];
    this.particles = [];
    this.mouse = { x: null, y: null, active: false, rx: 0, ry: 0 };
    this.bg = '#050B14'; // Premium deep forest night background
  }

  setup() {
    this.blades = [];
    this.particles = [];

    // Scale count of grass blades and floating fireflies with dimensions
    const count = Math.max(120, Math.floor(this.width * 0.65));
    const particleCount = Math.max(15, Math.floor(this.width * 0.03));

    // Emerald, gold, and neon blue/turquoise gradient palette
    const tipColors = ['#00FF9D', '#FFD700', '#00E1FF', '#8DFF66'];
    const midColors = ['#00A896', '#E29578', '#028090', '#2E8B57'];
    const baseColor = '#021C1E'; // Extremely dark blue-green base for contrast

    for (let i = 0; i < count; i++) {
      // Grass starting points layered horizontally across bottom
      const x = Math.random() * this.width;
      // Distribute heights to form a rolling perspective (shorter in background, taller in front)
      const depth = Math.random(); // 0 = back (bluer/darker), 1 = front (bright gold/emerald)
      const height = (Math.random() * 100 + 80) * (0.6 + depth * 0.6);
      
      this.blades.push({
        x: x,
        baseY: this.height + 5,
        height: height,
        depth: depth,
        phase: Math.random() * Math.PI * 2,
        swaySpeed: 0.001 + Math.random() * 0.0015,
        stiffness: 0.8 + Math.random() * 0.5,
        tipColor: tipColors[Math.floor(Math.random() * tipColors.length)],
        midColor: midColors[Math.floor(Math.random() * midColors.length)],
        baseColor: baseColor,
        thickness: (1.5 + depth * 2.5)
      });
    }

    // Sort blades by depth so we draw back-to-front to maintain depth buffer feel!
    this.blades.sort((a, b) => a.depth - b.depth);

    // Setup glowing fireflies/pollen
    for (let i = 0; i < particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 1.0,
        vy: -0.3 - Math.random() * 0.6,
        size: Math.random() * 2 + 1,
        color: Math.random() > 0.5 ? '#FFD700' : '#00FF9D',
        phase: Math.random() * Math.PI * 2,
        freq: 0.001 + Math.random() * 0.002
      });
    }

    this.mouse.rx = this.width / 2;
    this.mouse.ry = this.height / 2;
  }

  resize(width, height) {
    super.resize(width, height);
    
    // Readjust all grass base lines
    this.blades.forEach(b => {
      b.baseY = height + 5;
      b.x = Math.random() * width;
    });
  }

  draw(ctx, time) {
    // 1. Solid deep twilight background
    ctx.fillStyle = this.bg;
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Draw a beautiful cosmic background ambient gradient glow
    const ambientGrad = ctx.createRadialGradient(
      this.width / 2, this.height * 0.8, 10,
      this.width / 2, this.height, this.width * 0.9
    );
    ambientGrad.addColorStop(0, 'rgba(0, 168, 150, 0.12)'); // Soft turquoise
    ambientGrad.addColorStop(0.6, 'rgba(5, 11, 20, 0)');
    ctx.fillStyle = ambientGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // 3. Render Grass Blades (layered back-to-front)
    this.blades.forEach(b => {
      // Wind oscillation waves: traveling sine field across x-coordinate
      const windGust = Math.sin(b.x * 0.005 + time * 0.0018 + b.phase) * 16 * (1.2 - b.depth * 0.4);
      const windBase = Math.cos(time * 0.0006 + b.phase) * 6;
      let totalSway = windGust + windBase;

      // Cursor interactive bending force
      let bendOffset = 0;
      if (this.mouse.active && this.mouse.x !== null) {
        // Calculate distance from blade mid/tip region
        const bladeMidY = b.baseY - b.height * 0.6;
        const dx = this.mouse.x - b.x;
        const dy = this.mouse.y - bladeMidY;
        const dist = Math.hypot(dx, dy);
        const influenceRadius = 180;

        if (dist < influenceRadius) {
          const force = (influenceRadius - dist) / influenceRadius; // 0 to 1
          // Bend away from cursor, scale with depth
          bendOffset = (dx > 0 ? -1 : 1) * force * 52 * b.stiffness;
        }
      }

      // Final dynamic sway angle
      const finalSway = totalSway + bendOffset;

      // Determine curvature control and tip points
      const ctrlX = b.x + finalSway * 0.55;
      const ctrlY = b.baseY - b.height * 0.45;
      
      const tipX = b.x + finalSway;
      const tipY = b.baseY - b.height;

      // Create a gorgeous visual blade gradient spanning depth color values
      const grad = ctx.createLinearGradient(b.x, b.baseY, tipX, tipY);
      grad.addColorStop(0, b.baseColor);
      grad.addColorStop(0.5, b.midColor);
      grad.addColorStop(1, b.tipColor);

      // Draw single elegant blade as custom stroke
      ctx.beginPath();
      ctx.moveTo(b.x, b.baseY);
      ctx.quadraticCurveTo(ctrlX, ctrlY, tipX, tipY);

      ctx.strokeStyle = grad;
      ctx.lineWidth = b.thickness;
      ctx.lineCap = 'round';
      ctx.stroke();
    });

    // 4. Update and render glowing pollen/firefly particles
    ctx.save();
    this.particles.forEach(p => {
      // Float drift + sinusoidal sway
      p.x += p.vx + Math.sin(time * p.freq + p.phase) * 0.4;
      p.y += p.vy;

      // Wrap boundaries smoothly
      if (p.x < 0) p.x = this.width;
      if (p.x > this.width) p.x = 0;
      if (p.y < -20) {
        p.y = this.height + 10;
        p.x = Math.random() * this.width;
      }

      // Draw pollen as soft circular glow
      const particleGlow = ctx.createRadialGradient(
        p.x, p.y, 0,
        p.x, p.y, p.size * 3.5
      );
      particleGlow.addColorStop(0, p.color);
      particleGlow.addColorStop(0.3, p.color + '66'); // 40% opacity
      particleGlow.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 3.5, 0, Math.PI * 2);
      ctx.fillStyle = particleGlow;
      ctx.fill();
    });
    ctx.restore();
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
    this.blades = [];
    this.particles = [];
  }

  static get title() {
    return 'Windy Grass Field';
  }

  static get description() {
    return 'A glowing, bioluminescent grass field swaying harmonically in coordinated wave gusts. Tall blades of emerald, gold, and neon blue are drawn in back-to-front visual depth layers. Hovering your cursor bends the fibers locally and displaces floating golden pollen.';
  }

  static get vibe() {
    return 'Natural';
  }

  static get sourceCode() {
    return `class WindyGrassField {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.blades = [];
    this.particles = [];
    this.mouse = { x: null, y: null, active: false, rx: 0, ry: 0 };
    this.bg = '#050B14';

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
    this.blades = [];
    this.particles = [];

    const count = Math.max(120, Math.floor(this.width * 0.65));
    const particleCount = Math.max(15, Math.floor(this.width * 0.03));

    const tipColors = ['#00FF9D', '#FFD700', '#00E1FF', '#8DFF66'];
    const midColors = ['#00A896', '#E29578', '#028090', '#2E8B57'];
    const baseColor = '#021C1E';

    for (let i = 0; i < count; i++) {
      const x = Math.random() * this.width;
      const depth = Math.random();
      const height = (Math.random() * 100 + 80) * (0.6 + depth * 0.6);
      
      this.blades.push({
        x: x,
        baseY: this.height + 5,
        height: height,
        depth: depth,
        phase: Math.random() * Math.PI * 2,
        swaySpeed: 0.001 + Math.random() * 0.0015,
        stiffness: 0.8 + Math.random() * 0.5,
        tipColor: tipColors[Math.floor(Math.random() * tipColors.length)],
        midColor: midColors[Math.floor(Math.random() * midColors.length)],
        baseColor: baseColor,
        thickness: (1.5 + depth * 2.5)
      });
    }

    this.blades.sort((a, b) => a.depth - b.depth);

    for (let i = 0; i < particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 1.0,
        vy: -0.3 - Math.random() * 0.6,
        size: Math.random() * 2 + 1,
        color: Math.random() > 0.5 ? '#FFD700' : '#00FF9D',
        phase: Math.random() * Math.PI * 2,
        freq: 0.001 + Math.random() * 0.002
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

    this.blades.forEach(b => {
      b.baseY = this.height + 5;
      b.x = Math.random() * this.width;
    });
  }

  animate(time = 0) {
    this.ctx.fillStyle = this.bg;
    this.ctx.fillRect(0, 0, this.width, this.height);

    const ambientGrad = this.ctx.createRadialGradient(
      this.width / 2, this.height * 0.8, 10,
      this.width / 2, this.height, this.width * 0.9
    );
    ambientGrad.addColorStop(0, 'rgba(0, 168, 150, 0.12)');
    ambientGrad.addColorStop(0.6, 'rgba(5, 11, 20, 0)');
    this.ctx.fillStyle = ambientGrad;
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.blades.forEach(b => {
      const windGust = Math.sin(b.x * 0.005 + time * 0.0018 + b.phase) * 16 * (1.2 - b.depth * 0.4);
      const windBase = Math.cos(time * 0.0006 + b.phase) * 6;
      let totalSway = windGust + windBase;

      let bendOffset = 0;
      if (this.mouse.active && this.mouse.x !== null) {
        const bladeMidY = b.baseY - b.height * 0.6;
        const dx = this.mouse.x - b.x;
        const dy = this.mouse.y - bladeMidY;
        const dist = Math.hypot(dx, dy);
        const influenceRadius = 180;

        if (dist < influenceRadius) {
          const force = (influenceRadius - dist) / influenceRadius;
          bendOffset = (dx > 0 ? -1 : 1) * force * 52 * b.stiffness;
        }
      }

      const finalSway = totalSway + bendOffset;
      const ctrlX = b.x + finalSway * 0.55;
      const ctrlY = b.baseY - b.height * 0.45;
      const tipX = b.x + finalSway;
      const tipY = b.baseY - b.height;

      const grad = this.ctx.createLinearGradient(b.x, b.baseY, tipX, tipY);
      grad.addColorStop(0, b.baseColor);
      grad.addColorStop(0.5, b.midColor);
      grad.addColorStop(1, b.tipColor);

      this.ctx.beginPath();
      this.ctx.moveTo(b.x, b.baseY);
      this.ctx.quadraticCurveTo(ctrlX, ctrlY, tipX, tipY);

      this.ctx.strokeStyle = grad;
      this.ctx.lineWidth = b.thickness;
      this.ctx.lineCap = 'round';
      this.ctx.stroke();
    });

    this.ctx.save();
    this.particles.forEach(p => {
      p.x += p.vx + Math.sin(time * p.freq + p.phase) * 0.4;
      p.y += p.vy;

      if (p.x < 0) p.x = this.width;
      if (p.x > this.width) p.x = 0;
      if (p.y < -20) {
        p.y = this.height + 10;
        p.x = Math.random() * this.width;
      }

      const particleGlow = this.ctx.createRadialGradient(
        p.x, p.y, 0,
        p.x, p.y, p.size * 3.5
      );
      particleGlow.addColorStop(0, p.color);
      particleGlow.addColorStop(0.3, p.color + '66');
      particleGlow.addColorStop(1, 'rgba(0,0,0,0)');

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size * 3.5, 0, Math.PI * 2);
      this.ctx.fillStyle = particleGlow;
      this.ctx.fill();
    });
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
