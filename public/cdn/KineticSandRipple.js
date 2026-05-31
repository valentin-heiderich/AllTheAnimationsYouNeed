import BaseAnimation from './BaseAnimation.js';

export default class KineticSandRipple extends BaseAnimation {
  constructor() {
    super();
    this.spacing = 18; // spacing between grid vertices
    this.cols = 0;
    this.rows = 0;
    this.sandGrid = []; // 2D array of sand heights
    this.windPhase = 0;
    this.mouse = { x: null, y: null, active: false, radius: 100 };
    
    // Warm desert sand palette
    this.colors = {
      bg: '#1c130c', // Dark warm backdrop
      sandBase: '#dfad56', // Warm sand gold
      sandLight: '#f6d899', // Highlight sand
      sandShadow: '#8e5b23', // Shadow sand
      grain: '#fdf3cd' // Shimmering grain
    };
    
    this.grains = []; // Twinkling sand grains
  }

  setup() {
    this.cols = Math.ceil(this.width / this.spacing) + 2;
    this.rows = Math.ceil(this.height / this.spacing) + 2;
    
    // Initialize 2D grid for sand displacement
    this.sandGrid = [];
    for (let x = 0; x < this.cols; x++) {
      this.sandGrid[x] = [];
      for (let y = 0; y < this.rows; y++) {
        // Base ripple pattern using sine waves
        const baseRipple = Math.sin(x * 0.3 + y * 0.15) * 4;
        this.sandGrid[x][y] = {
          height: baseRipple,
          rakeHeight: 0, // Persistent physical deformation from rake
          smoothHeight: baseRipple,
          shimmer: Math.random()
        };
      }
    }

    // Set up shimmering sand grains
    this.grains = [];
    const grainCount = Math.min(400, Math.floor((this.width * this.height) / 3000));
    for (let i = 0; i < grainCount; i++) {
      this.grains.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: Math.random() * 1.5 + 0.5,
        speed: 0.1 + Math.random() * 0.25,
        shimmerSpeed: 0.02 + Math.random() * 0.05,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  resize(width, height) {
    const oldCols = this.cols;
    const oldRows = this.rows;
    const oldGrid = this.sandGrid;

    super.resize(width, height);
    this.setup();

    // Map old height values to new grid where possible to preserve rake markings
    if (oldGrid && oldGrid.length > 0) {
      for (let x = 0; x < Math.min(this.cols, oldCols); x++) {
        for (let y = 0; y < Math.min(this.rows, oldRows); y++) {
          if (oldGrid[x] && oldGrid[x][y]) {
            this.sandGrid[x][y].rakeHeight = oldGrid[x][y].rakeHeight;
          }
        }
      }
    }
  }

  draw(ctx, time) {
    // 1. Draw warm dark backdrop
    ctx.fillStyle = this.colors.bg;
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Wind math: slow lateral drift
    this.windPhase = time * 0.0006;

    // 3. Update sand height values (wind movement & relaxation)
    for (let x = 0; x < this.cols; x++) {
      const colX = x * this.spacing;
      for (let y = 0; y < this.rows; y++) {
        const rowY = y * this.spacing;
        const cell = this.sandGrid[x][y];

        // Natural sand dunes wind equation
        const windWave = Math.sin(colX * 0.015 - this.windPhase + rowY * 0.005) * 5 +
                         Math.cos(colX * 0.04 + rowY * 0.02 - this.windPhase * 1.5) * 2;

        // Total target height is wind ripples + persistent rake grooves
        const target = windWave + cell.rakeHeight;
        
        // Satisfying fluid interpolation
        cell.height += (target - cell.height) * 0.08;
        cell.smoothHeight += (cell.height - cell.smoothHeight) * 0.15;
      }
    }

    // 4. Draw Sand Dunes (overlapping horizontal layers drawn back-to-front)
    for (let y = 1; y < this.rows - 1; y++) {
      const rowY = y * this.spacing;
      
      ctx.beginPath();
      const startX = -this.spacing;
      const startY = rowY + this.getGridHeight(startX, rowY);
      ctx.moveTo(startX, startY);

      // Draw curve across screen
      for (let x = 0; x < this.cols; x++) {
        const colX = x * this.spacing;
        const heightVal = this.sandGrid[x][y].smoothHeight;
        const pointX = colX;
        const pointY = rowY + heightVal;

        if (x === 0) {
          ctx.lineTo(pointX, pointY);
        } else {
          const prevX = (x - 1) * this.spacing;
          const prevY = rowY + this.sandGrid[x - 1][y].smoothHeight;
          const midX = (prevX + pointX) / 2;
          const midY = (prevY + pointY) / 2;
          ctx.quadraticCurveTo(prevX, prevY, midX, midY);
        }
      }

      ctx.lineTo(this.width + this.spacing, rowY + 100);
      ctx.lineTo(this.width + this.spacing, this.height + 50);
      ctx.lineTo(-this.spacing, this.height + 50);
      ctx.closePath();

      const verticalRatio = y / this.rows;
      
      // Calculate average rake slope for visual shading
      let avgSlope = 0;
      for (let x = 1; x < this.cols - 1; x++) {
        avgSlope += (this.sandGrid[x][y].smoothHeight - this.sandGrid[x - 1][y].smoothHeight);
      }
      avgSlope = Math.max(-1, Math.min(1, avgSlope / this.cols));

      // Build layered gradient
      const grad = ctx.createLinearGradient(0, rowY - 20, 0, rowY + 60);
      const highlight = this.blendColors(this.colors.sandLight, this.colors.sandBase, verticalRatio * 0.3);
      const shadow = this.blendColors(this.colors.sandShadow, this.colors.bg, 0.4 + verticalRatio * 0.3);
      
      grad.addColorStop(0, highlight);
      grad.addColorStop(0.2, this.colors.sandBase);
      grad.addColorStop(1, shadow);

      ctx.fillStyle = grad;
      ctx.fill();

      // Add a subtle golden stroke on dune crests for beautiful ridge definition
      ctx.strokeStyle = this.blendColors(this.colors.sandLight, this.colors.sandBase, 0.5 - avgSlope * 0.5);
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    // 5. Render glistening sand grains
    ctx.fillStyle = this.colors.grain;
    this.grains.forEach(g => {
      g.x += g.speed;
      g.phase += g.shimmerSpeed;
      
      if (g.x > this.width) g.x = 0;
      
      const localSandH = this.getGridHeight(g.x, g.y);
      const renderY = g.y + localSandH;

      const alpha = 0.2 + 0.6 * Math.sin(g.phase);
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.beginPath();
      ctx.arc(g.x, renderY, g.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;
  }

  getGridHeight(canvasX, canvasY) {
    const xIndex = Math.max(0, Math.min(this.cols - 1, Math.floor(canvasX / this.spacing)));
    const yIndex = Math.max(0, Math.min(this.rows - 1, Math.floor(canvasY / this.spacing)));
    
    if (this.sandGrid[xIndex] && this.sandGrid[xIndex][yIndex]) {
      return this.sandGrid[xIndex][yIndex].smoothHeight;
    }
    return 0;
  }

  blendColors(c1, c2, weight) {
    const parse = (c) => {
      if (c.startsWith('#')) {
        const r = parseInt(c.slice(1, 3), 16);
        const g = parseInt(c.slice(3, 5), 16);
        const b = parseInt(c.slice(5, 7), 16);
        return [r, g, b];
      }
      return [0, 0, 0];
    };
    const [r1, g1, b1] = parse(c1);
    const [r2, g2, b2] = parse(c2);
    const w = Math.max(0, Math.min(1, weight));
    
    const r = Math.round(r1 * (1 - w) + r2 * w);
    const g = Math.round(g1 * (1 - w) + g2 * w);
    const b = Math.round(b1 * (1 - w) + b2 * w);
    
    return `rgb(${r}, ${g}, ${b})`;
  }

  destroy() {
    this.sandGrid = [];
    this.grains = [];
    super.destroy();
  }

  handleMouseMove(x, y) {
    this.mouse.x = x;
    this.mouse.y = y;
    this.mouse.active = true;

    const radiusInCells = Math.ceil(this.mouse.radius / this.spacing);
    const mouseCol = Math.floor(x / this.spacing);
    const mouseRow = Math.floor(y / this.spacing);

    for (let dx = -radiusInCells; dx <= radiusInCells; dx++) {
      const colX = mouseCol + dx;
      if (colX < 0 || colX >= this.cols) continue;

      for (let dy = -radiusInCells; dy <= radiusInCells; dy++) {
        const rowY = mouseRow + dy;
        if (rowY < 0 || rowY >= this.rows) continue;

        const cellX = colX * this.spacing;
        const cellY = rowY * this.spacing;
        const dist = Math.hypot(cellX - x, cellY - y);

        if (dist < this.mouse.radius) {
          const force = (this.mouse.radius - dist) / this.mouse.radius;
          const rakeWave = Math.sin(dist * 0.28) * 8.5;
          
          this.sandGrid[colX][rowY].rakeHeight += (rakeWave - 2) * force * 0.18;
          this.sandGrid[colX][rowY].rakeHeight = Math.max(
            -28,
            Math.min(28, this.sandGrid[colX][rowY].rakeHeight)
          );
        }
      }
    }
  }

  handleMouseLeave() {
    this.mouse.active = false;
    this.mouse.x = null;
    this.mouse.y = null;
  }

  static get title() {
    return 'Kinetic Sand Ripple';
  }

  static get description() {
    return 'Simulates tactile wind-blown desert sand dunes with high-fidelity coordinate rendering. Drag your cursor to rake physical ridges and smooth indentations into the warm golden landscape, evoking Zen garden serenity.';
  }

  static get vibe() {
    return 'Satisfying';
  }

  static get sourceCode() {
    return `class KineticSandRipple {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.spacing = 18;
    this.cols = 0;
    this.rows = 0;
    this.sandGrid = [];
    this.windPhase = 0;
    this.mouse = { x: null, y: null, active: false, radius: 100 };
    
    this.colors = {
      bg: '#1c130c',
      sandBase: '#dfad56',
      sandLight: '#f6d899',
      sandShadow: '#8e5b23',
      grain: '#fdf3cd'
    };
    
    this.grains = [];
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
    this.cols = Math.ceil(this.width / this.spacing) + 2;
    this.rows = Math.ceil(this.height / this.spacing) + 2;
    
    this.sandGrid = [];
    for (let x = 0; x < this.cols; x++) {
      this.sandGrid[x] = [];
      for (let y = 0; y < this.rows; y++) {
        const baseRipple = Math.sin(x * 0.3 + y * 0.15) * 4;
        this.sandGrid[x][y] = {
          height: baseRipple,
          rakeHeight: 0,
          smoothHeight: baseRipple,
          shimmer: Math.random()
        };
      }
    }

    this.grains = [];
    const grainCount = Math.min(400, Math.floor((this.width * this.height) / 3000));
    for (let i = 0; i < grainCount; i++) {
      this.grains.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: Math.random() * 1.5 + 0.5,
        speed: 0.1 + Math.random() * 0.25,
        shimmerSpeed: 0.02 + Math.random() * 0.05,
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
    
    const oldGrid = this.sandGrid;
    this.setup();
    
    if (oldGrid && oldGrid.length > 0) {
      for (let x = 0; x < Math.min(this.cols, oldGrid.length); x++) {
        for (let y = 0; y < Math.min(this.rows, oldGrid[0].length); y++) {
          if (oldGrid[x] && oldGrid[x][y]) {
            this.sandGrid[x][y].rakeHeight = oldGrid[x][y].rakeHeight;
          }
        }
      }
    }
  }

  animate(time = 0) {
    this.ctx.fillStyle = this.colors.bg;
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.windPhase = time * 0.0006;

    for (let x = 0; x < this.cols; x++) {
      const colX = x * this.spacing;
      for (let y = 0; y < this.rows; y++) {
        const rowY = y * this.spacing;
        const cell = this.sandGrid[x][y];
        const windWave = Math.sin(colX * 0.015 - this.windPhase + rowY * 0.005) * 5 +
                         Math.cos(colX * 0.04 + rowY * 0.02 - this.windPhase * 1.5) * 2;
        const target = windWave + cell.rakeHeight;
        cell.height += (target - cell.height) * 0.08;
        cell.smoothHeight += (cell.height - cell.smoothHeight) * 0.15;
      }
    }

    for (let y = 1; y < this.rows - 1; y++) {
      const rowY = y * this.spacing;
      
      this.ctx.beginPath();
      const startX = -this.spacing;
      const startY = rowY + this.getGridHeight(startX, rowY);
      this.ctx.moveTo(startX, startY);

      for (let x = 0; x < this.cols; x++) {
        const colX = x * this.spacing;
        const heightVal = this.sandGrid[x][y].smoothHeight;
        const pointX = colX;
        const pointY = rowY + heightVal;

        if (x === 0) {
          this.ctx.lineTo(pointX, pointY);
        } else {
          const prevX = (x - 1) * this.spacing;
          const prevY = rowY + this.sandGrid[x - 1][y].smoothHeight;
          const midX = (prevX + pointX) / 2;
          const midY = (prevY + pointY) / 2;
          this.ctx.quadraticCurveTo(prevX, prevY, midX, midY);
        }
      }

      this.ctx.lineTo(this.width + this.spacing, rowY + 100);
      this.ctx.lineTo(this.width + this.spacing, this.height + 50);
      this.ctx.lineTo(-this.spacing, this.height + 50);
      this.ctx.closePath();

      const verticalRatio = y / this.rows;
      let avgSlope = 0;
      for (let x = 1; x < this.cols - 1; x++) {
        avgSlope += (this.sandGrid[x][y].smoothHeight - this.sandGrid[x - 1][y].smoothHeight);
      }
      avgSlope = Math.max(-1, Math.min(1, avgSlope / this.cols));

      const grad = this.ctx.createLinearGradient(0, rowY - 20, 0, rowY + 60);
      const highlight = this.blendColors(this.colors.sandLight, this.colors.sandBase, verticalRatio * 0.3);
      const shadow = this.blendColors(this.colors.sandShadow, this.colors.bg, 0.4 + verticalRatio * 0.3);
      
      grad.addColorStop(0, highlight);
      grad.addColorStop(0.2, this.colors.sandBase);
      grad.addColorStop(1, shadow);

      this.ctx.fillStyle = grad;
      this.ctx.fill();

      this.ctx.strokeStyle = this.blendColors(this.colors.sandLight, this.colors.sandBase, 0.5 - avgSlope * 0.5);
      this.ctx.lineWidth = 1.2;
      this.ctx.stroke();
    }

    this.ctx.fillStyle = this.colors.grain;
    this.grains.forEach(g => {
      g.x += g.speed;
      g.phase += g.shimmerSpeed;
      if (g.x > this.width) g.x = 0;
      
      const renderY = g.y + this.getGridHeight(g.x, g.y);
      const alpha = 0.2 + 0.6 * Math.sin(g.phase);
      this.ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      this.ctx.beginPath();
      this.ctx.arc(g.x, renderY, g.size, 0, Math.PI * 2);
      this.ctx.fill();
    });
    this.ctx.globalAlpha = 1.0;

    requestAnimationFrame((t) => this.animate(t));
  }

  getGridHeight(canvasX, canvasY) {
    const xIndex = Math.max(0, Math.min(this.cols - 1, Math.floor(canvasX / this.spacing)));
    const yIndex = Math.max(0, Math.min(this.rows - 1, Math.floor(canvasY / this.spacing)));
    if (this.sandGrid[xIndex] && this.sandGrid[xIndex][yIndex]) {
      return this.sandGrid[xIndex][yIndex].smoothHeight;
    }
    return 0;
  }

  blendColors(c1, c2, weight) {
    const parse = (c) => {
      const r = parseInt(c.slice(1, 3), 16);
      const g = parseInt(c.slice(3, 5), 16);
      const b = parseInt(c.slice(5, 7), 16);
      return [r, g, b];
    };
    const [r1, g1, b1] = parse(c1);
    const [r2, g2, b2] = parse(c2);
    const w = Math.max(0, Math.min(1, weight));
    const r = Math.round(r1 * (1 - w) + r2 * w);
    const g = Math.round(g1 * (1 - w) + g2 * w);
    const b = Math.round(b1 * (1 - w) + b2 * w);
    return \`rgb(\${r}, \${g}, \${b})\`;
  }

  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    this.mouse.x = x;
    this.mouse.y = y;
    this.mouse.active = true;

    const radiusInCells = Math.ceil(this.mouse.radius / this.spacing);
    const mouseCol = Math.floor(x / this.spacing);
    const mouseRow = Math.floor(y / this.spacing);

    for (let dx = -radiusInCells; dx <= radiusInCells; dx++) {
      const colX = mouseCol + dx;
      if (colX < 0 || colX >= this.cols) continue;

      for (let dy = -radiusInCells; dy <= radiusInCells; dy++) {
        const rowY = mouseRow + dy;
        if (rowY < 0 || rowY >= this.rows) continue;

        const cellX = colX * this.spacing;
        const cellY = rowY * this.spacing;
        const dist = Math.hypot(cellX - x, cellY - y);

        if (dist < this.mouse.radius) {
          const force = (this.mouse.radius - dist) / this.mouse.radius;
          const rakeWave = Math.sin(dist * 0.28) * 8.5;
          this.sandGrid[colX][rowY].rakeHeight += (rakeWave - 2) * force * 0.18;
          this.sandGrid[colX][rowY].rakeHeight = Math.max(-28, Math.min(28, this.sandGrid[colX][rowY].rakeHeight));
        }
      }
    }
  }

  handleMouseLeave() {
    this.mouse.active = false;
    this.mouse.x = null;
    this.mouse.y = null;
  }
}`;
  }
}
