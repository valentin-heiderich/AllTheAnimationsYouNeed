import BaseAnimation from './BaseAnimation.js';

export default class HexagonalHiveGrid extends BaseAnimation {
  constructor() {
    super();
    this.hexagons = [];
    this.hexSize = 42; // Perfect visual size for the grid cells
    this.mouse = { x: null, y: null, active: false, rx: 0, ry: 0 };
    this.bg = '#04060A'; // Ultra-deep cybernetic dark blue
  }

  setup() {
    this.hexagons = [];
    
    // Grid alignment parameters for pointy-topped hexagons
    const wSpacing = this.hexSize * Math.sqrt(3);
    const hSpacing = this.hexSize * 1.5;

    // Buffer padding around boundaries
    const cols = Math.ceil(this.width / wSpacing) + 2;
    const rows = Math.ceil(this.height / hSpacing) + 2;

    for (let r = -1; r < rows; r++) {
      for (let c = -1; c < cols; c++) {
        let x = c * wSpacing;
        if (r % 2 === 1) {
          x += wSpacing / 2; // Offset alternate rows
        }
        let y = r * hSpacing;

        this.hexagons.push({
          x: x,
          y: y,
          size: this.hexSize,
          active: 0, // Trail intensity (0 to 1)
          pulsePhase: Math.random() * Math.PI * 2,
          colorType: Math.random() > 0.5 ? 'cyan' : 'amber',
          speed: 0.002 + Math.random() * 0.003
        });
      }
    }

    this.mouse.rx = this.width / 2;
    this.mouse.ry = this.height / 2;
  }

  resize(width, height) {
    super.resize(width, height);
    this.setup(); // Recalculate honeycomb grid coordinate matrix for perfect fitting
  }

  draw(ctx, time) {
    // 1. Core cyber dark background
    ctx.fillStyle = this.bg;
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. High-DPI mouse spring follower
    if (this.mouse.active && this.mouse.x !== null) {
      this.mouse.rx = this.mouse.rx * 0.9 + this.mouse.x * 0.1;
      this.mouse.ry = this.mouse.ry * 0.9 + this.mouse.y * 0.1;
    } else {
      // Gentle automatic float centering
      this.mouse.rx = this.mouse.rx * 0.98 + (this.width / 2 + Math.sin(time * 0.0006) * (this.width * 0.18)) * 0.02;
      this.mouse.ry = this.mouse.ry * 0.98 + (this.height / 2 + Math.cos(time * 0.0004) * (this.height * 0.18)) * 0.02;
    }

    // 3. Cybernetic spotlight (illuminates background lines near mouse)
    const spotlight = ctx.createRadialGradient(
      this.mouse.rx, this.mouse.ry, 20,
      this.mouse.rx, this.mouse.ry, 240
    );
    spotlight.addColorStop(0, 'rgba(0, 240, 255, 0.09)');
    spotlight.addColorStop(0.5, 'rgba(255, 159, 28, 0.03)');
    spotlight.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = spotlight;
    ctx.fillRect(0, 0, this.width, this.height);

    // 4. Slow diagnostic scan wave traveling across cells diagonally
    const scanWaveX = (time * 0.18) % (this.width + this.height);

    // 5. Draw Honeycomb mesh in two passes: base background wireframe & highlighted overlay
    // Pass 1: Draw global dormant background grid (low opacity neon lines)
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.035)';
    ctx.lineWidth = 1.0;
    
    this.hexagons.forEach(hex => {
      this.drawHexagonPath(ctx, hex.x, hex.y, hex.size);
      ctx.stroke();
    });

    // Pass 2: Draw illuminated glowing cells
    this.hexagons.forEach(hex => {
      // Calculate local mouse proximity
      const dx = this.mouse.rx - hex.x;
      const dy = this.mouse.ry - hex.y;
      const dist = Math.hypot(dx, dy);

      // Light up nodes that the mouse gets near
      const hoverRadius = 140;
      if (dist < hoverRadius) {
        const intensity = (hoverRadius - dist) / hoverRadius;
        hex.active = Math.max(hex.active, Math.pow(intensity, 1.8)); // Squared for snappy rise, smooth fall
      }

      // Diagonal cyber scan wave illumination pulse
      const diagPos = hex.x + hex.y;
      const scanDist = Math.abs(scanWaveX - diagPos);
      if (scanDist < 120) {
        const scanIntensity = (120 - scanDist) / 120 * 0.28;
        hex.active = Math.max(hex.active, scanIntensity);
      }

      // Linear trail decay
      hex.active = hex.active * 0.95 - 0.002;
      if (hex.active < 0) hex.active = 0;

      if (hex.active > 0.001) {
        ctx.save();
        
        // Define color blending based on type
        // Cyan color: #00F0FF (light sky neon)
        // Amber color: #FF9F1C (warm orange neon)
        const primaryColor = hex.colorType === 'cyan' ? '0, 240, 255' : '255, 159, 28';
        
        // Draw hexagon inner cell fill glow
        ctx.beginPath();
        this.drawHexagonPath(ctx, hex.x, hex.y, hex.size - 1);
        ctx.fillStyle = `rgba(${primaryColor}, ${hex.active * 0.065})`;
        ctx.fill();

        // Draw glowing neon border stroke
        ctx.strokeStyle = `rgba(${primaryColor}, ${hex.active * 0.85})`;
        ctx.lineWidth = 1.5 + hex.active * 1.5;
        // Soft bloom aura utilizing canvas shadow
        ctx.shadowColor = hex.colorType === 'cyan' ? '#00F0FF' : '#FF9F1C';
        ctx.shadowBlur = hex.active * 12;

        ctx.stroke();
        ctx.restore();
      }
    });
  }

  // Draw Pointy-topped hexagon path
  drawHexagonPath(ctx, x, y, size) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 6) + (Math.PI / 3) * i;
      const px = x + size * Math.cos(angle);
      const py = y + size * Math.sin(angle);
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
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
    this.hexagons = [];
  }

  static get title() {
    return 'Hexagonal Hive Grid';
  }

  static get description() {
    return 'A honeycomb hive grid that lights up in neon trails as the cursor passes over them. Combining slow diagnostic wave grids, amber and cyan cybernetic border glowing shadows, and soft ambient spotlight masks.';
  }

  static get vibe() {
    return 'Cybernetic';
  }

  static get sourceCode() {
    return `class HexagonalHiveGrid {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.hexagons = [];
    this.hexSize = 42;
    this.mouse = { x: null, y: null, active: false, rx: 0, ry: 0 };
    this.bg = '#04060A';

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
    this.hexagons = [];
    const wSpacing = this.hexSize * Math.sqrt(3);
    const hSpacing = this.hexSize * 1.5;

    const cols = Math.ceil(this.width / wSpacing) + 2;
    const rows = Math.ceil(this.height / hSpacing) + 2;

    for (let r = -1; r < rows; r++) {
      for (let c = -1; c < cols; c++) {
        let x = c * wSpacing;
        if (r % 2 === 1) {
          x += wSpacing / 2;
        }
        let y = r * hSpacing;

        this.hexagons.push({
          x: x,
          y: y,
          size: this.hexSize,
          active: 0,
          pulsePhase: Math.random() * Math.PI * 2,
          colorType: Math.random() > 0.5 ? 'cyan' : 'amber',
          speed: 0.002 + Math.random() * 0.003
        });
      }
    }

    this.mouse.rx = this.width / 2;
    this.mouse.ry = this.height / 2;
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
    this.ctx.fillStyle = this.bg;
    this.ctx.fillRect(0, 0, this.width, this.height);

    if (this.mouse.active && this.mouse.x !== null) {
      this.mouse.rx = this.mouse.rx * 0.9 + this.mouse.x * 0.1;
      this.mouse.ry = this.mouse.ry * 0.9 + this.mouse.y * 0.1;
    } else {
      this.mouse.rx = this.mouse.rx * 0.98 + (this.width / 2 + Math.sin(time * 0.0006) * (this.width * 0.18)) * 0.02;
      this.mouse.ry = this.mouse.ry * 0.98 + (this.height / 2 + Math.cos(time * 0.0004) * (this.height * 0.18)) * 0.02;
    }

    const spotlight = this.ctx.createRadialGradient(
      this.mouse.rx, this.mouse.ry, 20,
      this.mouse.rx, this.mouse.ry, 240
    );
    spotlight.addColorStop(0, 'rgba(0, 240, 255, 0.09)');
    spotlight.addColorStop(0.5, 'rgba(255, 159, 28, 0.03)');
    spotlight.addColorStop(1, 'rgba(0, 0, 0, 0)');
    this.ctx.fillStyle = spotlight;
    this.ctx.fillRect(0, 0, this.width, this.height);

    const scanWaveX = (time * 0.18) % (this.width + this.height);

    this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.035)';
    this.ctx.lineWidth = 1.0;
    this.hexagons.forEach(hex => {
      this.drawHexagonPath(hex.x, hex.y, hex.size);
      this.ctx.stroke();
    });

    this.hexagons.forEach(hex => {
      const dx = this.mouse.rx - hex.x;
      const dy = this.mouse.ry - hex.y;
      const dist = Math.hypot(dx, dy);

      const hoverRadius = 140;
      if (dist < hoverRadius) {
        const intensity = (hoverRadius - dist) / hoverRadius;
        hex.active = Math.max(hex.active, Math.pow(intensity, 1.8));
      }

      const diagPos = hex.x + hex.y;
      const scanDist = Math.abs(scanWaveX - diagPos);
      if (scanDist < 120) {
        const scanIntensity = (120 - scanDist) / 120 * 0.28;
        hex.active = Math.max(hex.active, scanIntensity);
      }

      hex.active = hex.active * 0.95 - 0.002;
      if (hex.active < 0) hex.active = 0;

      if (hex.active > 0.001) {
        this.ctx.save();
        const primaryColor = hex.colorType === 'cyan' ? '0, 240, 255' : '255, 159, 28';
        
        this.ctx.beginPath();
        this.drawHexagonPath(hex.x, hex.y, hex.size - 1);
        this.ctx.fillStyle = \`rgba(\${primaryColor}, \${hex.active * 0.065})\`;
        this.ctx.fill();

        this.ctx.strokeStyle = \`rgba(\${primaryColor}, \${hex.active * 0.85})\`;
        this.ctx.lineWidth = 1.5 + hex.active * 1.5;
        this.ctx.shadowColor = hex.colorType === 'cyan' ? '#00F0FF' : '#FF9F1C';
        this.ctx.shadowBlur = hex.active * 12;

        this.ctx.stroke();
        this.ctx.restore();
      }
    });

    requestAnimationFrame((t) => this.animate(t));
  }

  drawHexagonPath(x, y, size) {
    this.ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 6) + (Math.PI / 3) * i;
      const px = x + size * Math.cos(angle);
      const py = y + size * Math.sin(angle);
      if (i === 0) {
        this.ctx.moveTo(px, py);
      } else {
        this.ctx.lineTo(px, py);
      }
    }
    this.ctx.closePath();
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
