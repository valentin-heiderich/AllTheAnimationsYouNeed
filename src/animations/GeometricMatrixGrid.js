import BaseAnimation from './BaseAnimation.js';

export default class GeometricMatrixGrid extends BaseAnimation {
  constructor() {
    super();
    this.nodes = [];
    this.mouse = { x: null, y: null, active: false, radius: 150 };
    // Digital neon cyan/green cyber palette
    this.colors = {
      cyan: '#00F0FF',
      green: '#00FF66',
      white: '#FFFFFF',
      grid: '#062024' // deep digital dark teal
    };
    this.spacing = 55; // Grid cell size in pixels
    this.packets = [];
  }

  setup() {
    this.nodes = [];
    this.packets = [];
    
    const cols = Math.ceil(this.width / this.spacing) + 1;
    const rows = Math.ceil(this.height / this.spacing) + 1;

    for (let c = 0; c < cols; c++) {
      this.nodes[c] = [];
      for (let r = 0; r < rows; r++) {
        this.nodes[c][r] = {
          baseX: c * this.spacing,
          baseY: r * this.spacing,
          x: c * this.spacing,
          y: r * this.spacing,
          angle: Math.random() * Math.PI * 2,
          bobSpeed: 0.0008 + Math.random() * 0.0012,
          bobAmp: 3 + Math.random() * 4,
          glow: 0.0,
          flashPhase: Math.random() * Math.PI * 2,
          flashSpeed: 0.002 + Math.random() * 0.003,
          color: Math.random() > 0.5 ? this.colors.cyan : this.colors.green
        };
      }
    }

    // Seed cyber data packets traversing the grid lines
    const packetCount = 20;
    for (let i = 0; i < packetCount; i++) {
      this.spawnPacket(cols, rows);
    }
  }

  spawnPacket(cols, rows) {
    // Pick random starting cell coordinates
    const c = Math.floor(Math.random() * (cols - 2)) + 1;
    const r = Math.floor(Math.random() * (rows - 2)) + 1;
    const dir = Math.random() > 0.5 ? 'horizontal' : 'vertical';

    this.packets.push({
      col: c,
      row: r,
      dir,
      progress: 0.0,
      speed: 0.015 + Math.random() * 0.02,
      color: Math.random() > 0.5 ? this.colors.cyan : this.colors.green,
      size: Math.random() * 2.0 + 1.2
    });
  }

  resize(width, height) {
    super.resize(width, height);
    this.setup(); // Reinitialize grid structured positions on viewport changes
  }

  draw(ctx, time) {
    // Deep slate digital background
    ctx.fillStyle = '#030607';
    ctx.fillRect(0, 0, this.width, this.height);

    const cols = this.nodes.length;
    const rows = cols > 0 ? this.nodes[0].length : 0;

    if (cols === 0 || rows === 0) return;

    // 1. Physics: update nodes bobbing and mouse interactions
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const n = this.nodes[c][r];
        
        // Organic idle bobbing (cyber matrix float)
        const bobX = Math.sin(time * n.bobSpeed + n.angle) * n.bobAmp;
        const bobY = Math.cos(time * n.bobSpeed * 0.8 + n.angle * 1.5) * n.bobAmp;
        
        let targetX = n.baseX + bobX;
        let targetY = n.baseY + bobY;

        // Mouse hover interactions: light up and pull nodes gently
        n.glow *= 0.92; // Damping decay
        
        if (this.mouse.active && this.mouse.x !== null) {
          const dx = this.mouse.x - targetX;
          const dy = this.mouse.y - targetY;
          const dist = Math.hypot(dx, dy);

          if (dist < this.mouse.radius) {
            const force = (this.mouse.radius - dist) / this.mouse.radius;
            // Attract nodes slightly towards cursor
            targetX += (dx / dist) * force * 15;
            targetY += (dy / dist) * force * 15;
            
            // Intensify glow
            n.glow = Math.max(n.glow, force * 1.0);
          }
        }

        n.x = targetX;
        n.y = targetY;
      }
    }

    // 2. Draw Connection grid segments (horizontal and vertical lines)
    ctx.lineWidth = 0.6;
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const n1 = this.nodes[c][r];

        // Horizontal connection to (c+1, r)
        if (c < cols - 1) {
          const n2 = this.nodes[c + 1][r];
          const distToMouse = this.mouse.active && this.mouse.x !== null 
            ? Math.hypot(this.mouse.x - (n1.x + n2.x) / 2, this.mouse.y - (n1.y + n2.y) / 2)
            : Infinity;

          ctx.beginPath();
          ctx.moveTo(n1.x, n1.y);
          ctx.lineTo(n2.x, n2.y);

          if (distToMouse < this.mouse.radius) {
            const factor = (this.mouse.radius - distToMouse) / this.mouse.radius;
            // Glowing neon laser beam
            const grad = ctx.createLinearGradient(n1.x, n1.y, n2.x, n2.y);
            grad.addColorStop(0, n1.color);
            grad.addColorStop(1, n2.color);

            ctx.strokeStyle = grad;
            ctx.lineWidth = 0.6 + factor * 1.6;
            ctx.globalAlpha = 0.08 + factor * 0.45;
          } else {
            // Dark base background grid line
            ctx.strokeStyle = this.colors.grid;
            ctx.lineWidth = 0.6;
            ctx.globalAlpha = 0.35;
          }
          ctx.stroke();
        }

        // Vertical connection to (c, r+1)
        if (r < rows - 1) {
          const n2 = this.nodes[c][r + 1];
          const distToMouse = this.mouse.active && this.mouse.x !== null 
            ? Math.hypot(this.mouse.x - (n1.x + n2.x) / 2, this.mouse.y - (n1.y + n2.y) / 2)
            : Infinity;

          ctx.beginPath();
          ctx.moveTo(n1.x, n1.y);
          ctx.lineTo(n2.x, n2.y);

          if (distToMouse < this.mouse.radius) {
            const factor = (this.mouse.radius - distToMouse) / this.mouse.radius;
            // Glowing neon laser beam
            const grad = ctx.createLinearGradient(n1.x, n1.y, n2.x, n2.y);
            grad.addColorStop(0, n1.color);
            grad.addColorStop(1, n2.color);

            ctx.strokeStyle = grad;
            ctx.lineWidth = 0.6 + factor * 1.6;
            ctx.globalAlpha = 0.08 + factor * 0.45;
          } else {
            // Dark base background grid line
            ctx.strokeStyle = this.colors.grid;
            ctx.lineWidth = 0.6;
            ctx.globalAlpha = 0.35;
          }
          ctx.stroke();
        }
      }
    }

    // 3. Draw Traversing data packets
    this.packets.forEach(p => {
      p.progress += p.speed;
      
      let nextCol = p.col;
      let nextRow = p.row;
      if (p.dir === 'horizontal' && p.col < cols - 1) nextCol = p.col + 1;
      else if (p.dir === 'vertical' && p.row < rows - 1) nextRow = p.row + 1;

      // Handle packet completion / boundary resets
      if (p.progress >= 1.0) {
        p.progress = 0.0;
        p.col = nextCol;
        p.row = nextRow;

        // If hit bounds, respawn at random hub
        if (p.col >= cols - 1 || p.row >= rows - 1) {
          p.col = Math.floor(Math.random() * (cols - 2)) + 1;
          p.row = Math.floor(Math.random() * (rows - 2)) + 1;
        }

        // Randomly pick a new direction
        p.dir = Math.random() > 0.5 ? 'horizontal' : 'vertical';
      }

      const nStart = this.nodes[p.col][p.row];
      const nEnd = this.nodes[nextCol][nextRow];

      if (nStart && nEnd) {
        // Interpolate packet coordinates along active grid line
        const px = nStart.x + (nEnd.x - nStart.x) * p.progress;
        const py = nStart.y + (nEnd.y - nStart.y) * p.progress;

        // Render packet glow trail
        ctx.beginPath();
        ctx.arc(px, py, p.size * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.22;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fillStyle = this.colors.white;
        ctx.globalAlpha = 0.85;
        ctx.fill();
      }
    });

    // 4. Draw node intersection hubs
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const n = this.nodes[c][r];
        
        // Random digital pulse alpha modulation
        const pulse = Math.sin(time * n.flashSpeed + n.flashPhase);
        const alpha = 0.15 + (pulse * 0.1) + (n.glow * 0.7);
        const size = 2.0 + (pulse * 0.5) + (n.glow * 2.5);

        // Core Hub Dot
        ctx.beginPath();
        ctx.arc(n.x, n.y, size, 0, Math.PI * 2);
        ctx.fillStyle = n.glow > 0.3 ? this.colors.white : n.color;
        ctx.globalAlpha = alpha;
        ctx.fill();

        // Cybermatic outer cross / square indicator for interactive highlighted nodes
        if (n.glow > 0.4) {
          ctx.beginPath();
          // Draw cross hairs
          ctx.moveTo(n.x - size * 2.2, n.y);
          ctx.lineTo(n.x + size * 2.2, n.y);
          ctx.moveTo(n.x, n.y - size * 2.2);
          ctx.lineTo(n.x, n.y + size * 2.2);
          ctx.strokeStyle = n.color;
          ctx.lineWidth = 0.7;
          ctx.globalAlpha = n.glow * 0.6;
          ctx.stroke();
        }
      }
    }

    ctx.globalAlpha = 1.0;
  }

  destroy() {
    this.nodes = [];
    this.packets = [];
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
    return 'Geometric Matrix Grid';
  }

  static get description() {
    return 'A cybernetic digital mesh of grid intersections floating with subtle kinetic drifts. Move the cursor to illuminate local circuit pathways with high-intensity laser connections and warp grid intersections dynamically.';
  }

  static get vibe() {
    return 'Cybernetic';
  }

  static get sourceCode() {
    return `class GeometricMatrixGrid {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.nodes = [];
    this.mouse = { x: null, y: null, active: false, radius: 150 };
    this.colors = {
      cyan: '#00F0FF',
      green: '#00FF66',
      white: '#FFFFFF',
      grid: '#062024'
    };
    this.spacing = 55;
    this.packets = [];

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
    this.nodes = [];
    this.packets = [];
    
    const cols = Math.ceil(this.width / this.spacing) + 1;
    const rows = Math.ceil(this.height / this.spacing) + 1;

    for (let c = 0; c < cols; c++) {
      this.nodes[c] = [];
      for (let r = 0; r < rows; r++) {
        this.nodes[c][r] = {
          baseX: c * this.spacing,
          baseY: r * this.spacing,
          x: c * this.spacing,
          y: r * this.spacing,
          angle: Math.random() * Math.PI * 2,
          bobSpeed: 0.0008 + Math.random() * 0.0012,
          bobAmp: 3 + Math.random() * 4,
          glow: 0.0,
          flashPhase: Math.random() * Math.PI * 2,
          flashSpeed: 0.002 + Math.random() * 0.003,
          color: Math.random() > 0.5 ? this.colors.cyan : this.colors.green
        };
      }
    }

    for (let i = 0; i < 20; i++) {
      this.spawnPacket(cols, rows);
    }
  }

  spawnPacket(cols, rows) {
    const c = Math.floor(Math.random() * (cols - 2)) + 1;
    const r = Math.floor(Math.random() * (rows - 2)) + 1;
    const dir = Math.random() > 0.5 ? 'horizontal' : 'vertical';

    this.packets.push({
      col: c,
      row: r,
      dir,
      progress: 0.0,
      speed: 0.015 + Math.random() * 0.02,
      color: Math.random() > 0.5 ? this.colors.cyan : this.colors.green,
      size: Math.random() * 2.0 + 1.2
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
    
    // Safety check during initial resize call
    if (this.canvas.width > 0) {
      this.setup();
    }
  }

  animate(time = 0) {
    this.ctx.fillStyle = '#030607';
    this.ctx.fillRect(0, 0, this.width, this.height);

    const cols = this.nodes.length;
    const rows = cols > 0 ? this.nodes[0].length : 0;

    if (cols === 0 || rows === 0) {
      requestAnimationFrame((t) => this.animate(t));
      return;
    }

    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const n = this.nodes[c][r];
        const bobX = Math.sin(time * n.bobSpeed + n.angle) * n.bobAmp;
        const bobY = Math.cos(time * n.bobSpeed * 0.8 + n.angle * 1.5) * n.bobAmp;
        
        let targetX = n.baseX + bobX;
        let targetY = n.baseY + bobY;

        n.glow *= 0.92;
        
        if (this.mouse.active && this.mouse.x !== null) {
          const dx = this.mouse.x - targetX;
          const dy = this.mouse.y - targetY;
          const dist = Math.hypot(dx, dy);

          if (dist < this.mouse.radius) {
            const force = (this.mouse.radius - dist) / this.mouse.radius;
            targetX += (dx / dist) * force * 15;
            targetY += (dy / dist) * force * 15;
            n.glow = Math.max(n.glow, force);
          }
        }

        n.x = targetX;
        n.y = targetY;
      }
    }

    this.ctx.lineWidth = 0.6;
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const n1 = this.nodes[c][r];

        if (c < cols - 1) {
          const n2 = this.nodes[c + 1][r];
          const distToMouse = this.mouse.active && this.mouse.x !== null 
            ? Math.hypot(this.mouse.x - (n1.x + n2.x) / 2, this.mouse.y - (n1.y + n2.y) / 2)
            : Infinity;

          this.ctx.beginPath();
          this.ctx.moveTo(n1.x, n1.y);
          this.ctx.lineTo(n2.x, n2.y);

          if (distToMouse < this.mouse.radius) {
            const factor = (this.mouse.radius - distToMouse) / this.mouse.radius;
            const grad = this.ctx.createLinearGradient(n1.x, n1.y, n2.x, n2.y);
            grad.addColorStop(0, n1.color);
            grad.addColorStop(1, n2.color);

            this.ctx.strokeStyle = grad;
            this.ctx.lineWidth = 0.6 + factor * 1.6;
            this.ctx.globalAlpha = 0.08 + factor * 0.45;
          } else {
            this.ctx.strokeStyle = this.colors.grid;
            this.ctx.lineWidth = 0.6;
            this.ctx.globalAlpha = 0.35;
          }
          this.ctx.stroke();
        }

        if (r < rows - 1) {
          const n2 = this.nodes[c][r + 1];
          const distToMouse = this.mouse.active && this.mouse.x !== null 
            ? Math.hypot(this.mouse.x - (n1.x + n2.x) / 2, this.mouse.y - (n1.y + n2.y) / 2)
            : Infinity;

          this.ctx.beginPath();
          this.ctx.moveTo(n1.x, n1.y);
          this.ctx.lineTo(n2.x, n2.y);

          if (distToMouse < this.mouse.radius) {
            const factor = (this.mouse.radius - distToMouse) / this.mouse.radius;
            const grad = this.ctx.createLinearGradient(n1.x, n1.y, n2.x, n2.y);
            grad.addColorStop(0, n1.color);
            grad.addColorStop(1, n2.color);

            this.ctx.strokeStyle = grad;
            this.ctx.lineWidth = 0.6 + factor * 1.6;
            this.ctx.globalAlpha = 0.08 + factor * 0.45;
          } else {
            this.ctx.strokeStyle = this.colors.grid;
            this.ctx.lineWidth = 0.6;
            this.ctx.globalAlpha = 0.35;
          }
          this.ctx.stroke();
        }
      }
    }

    this.packets.forEach(p => {
      p.progress += p.speed;
      let nextCol = p.col;
      let nextRow = p.row;
      if (p.dir === 'horizontal' && p.col < cols - 1) nextCol = p.col + 1;
      else if (p.dir === 'vertical' && p.row < rows - 1) nextRow = p.row + 1;

      if (p.progress >= 1.0) {
        p.progress = 0.0;
        p.col = nextCol;
        p.row = nextRow;

        if (p.col >= cols - 1 || p.row >= rows - 1) {
          p.col = Math.floor(Math.random() * (cols - 2)) + 1;
          p.row = Math.floor(Math.random() * (rows - 2)) + 1;
        }
        p.dir = Math.random() > 0.5 ? 'horizontal' : 'vertical';
      }

      const nStart = this.nodes[p.col][p.row];
      const nEnd = this.nodes[nextCol][nextRow];

      if (nStart && nEnd) {
        const px = nStart.x + (nEnd.x - nStart.x) * p.progress;
        const py = nStart.y + (nEnd.y - nStart.y) * p.progress;

        this.ctx.beginPath();
        this.ctx.arc(px, py, p.size * 2.5, 0, Math.PI * 2);
        this.ctx.fillStyle = p.color;
        this.ctx.globalAlpha = 0.22;
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.arc(px, py, p.size, 0, Math.PI * 2);
        this.ctx.fillStyle = this.colors.white;
        this.ctx.globalAlpha = 0.85;
        this.ctx.fill();
      }
    });

    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const n = this.nodes[c][r];
        const pulse = Math.sin(time * n.flashSpeed + n.flashPhase);
        const alpha = 0.15 + (pulse * 0.1) + (n.glow * 0.7);
        const size = 2.0 + (pulse * 0.5) + (n.glow * 2.5);

        this.ctx.beginPath();
        this.ctx.arc(n.x, n.y, size, 0, Math.PI * 2);
        this.ctx.fillStyle = n.glow > 0.3 ? this.colors.white : n.color;
        this.ctx.globalAlpha = alpha;
        this.ctx.fill();

        if (n.glow > 0.4) {
          this.ctx.beginPath();
          this.ctx.moveTo(n.x - size * 2.2, n.y);
          this.ctx.lineTo(n.x + size * 2.2, n.y);
          this.ctx.moveTo(n.x, n.y - size * 2.2);
          this.ctx.lineTo(n.x, n.y + size * 2.2);
          this.ctx.strokeStyle = n.color;
          this.ctx.lineWidth = 0.7;
          this.ctx.globalAlpha = n.glow * 0.6;
          this.ctx.stroke();
        }
      }
    }

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
