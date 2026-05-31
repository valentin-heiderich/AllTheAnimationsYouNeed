import BaseAnimation from './BaseAnimation.js';

export default class ASCIICyberStreams extends BaseAnimation {
  constructor() {
    super();
    this.columns = [];
    this.fontSize = 15;
    this.mouse = { x: null, y: null, active: false, radius: 150 };
    this.colors = ['#00F0FF', '#00A8FF', '#0066FF', '#0033CC']; // Cyber blues & cyans
    this.chars = '01010101ABCDEF⚡☣⚙✦✧█▓▒░'.split('');
  }

  setup() {
    this.columns = [];
    // Spacing between columns for clean sparse waterfalls
    const spacing = Math.round(this.fontSize * 1.3);
    const columnCount = Math.floor(this.width / spacing);

    for (let i = 0; i < columnCount; i++) {
      const colX = i * spacing;
      const trailLength = Math.floor(Math.random() * 10) + 10; // 10-20 characters long
      
      // Statically cache stream character values to avoid generation inside loops
      const streamChars = [];
      for (let c = 0; c < 30; c++) {
        streamChars.push(this.chars[Math.floor(Math.random() * this.chars.length)]);
      }

      this.columns.push({
        x: colX,
        speed: Math.random() * 2.8 + 1.8,
        headY: Math.random() * -this.height - 100, // Staggered initial coordinates
        trailLength,
        charsCache: streamChars,
        baseAlpha: Math.random() * 0.45 + 0.55
      });
    }
  }

  resize(width, height) {
    super.resize(width, height);
    this.setup();
  }

  draw(ctx, time) {
    // Ultra deep retro terminal background
    ctx.fillStyle = '#02040a';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.font = `bold ${this.fontSize}px "Courier New", monospace`;
    ctx.textBaseline = 'top';

    const shieldRadius = this.mouse.radius;
    const numColumns = this.columns.length;

    for (let i = 0; i < numColumns; i++) {
      const col = this.columns[i];

      // Update waterfall head position
      col.headY += col.speed;
      if (col.headY > this.height + col.trailLength * this.fontSize) {
        col.headY = -15 * this.fontSize; // Loop back up
        col.speed = Math.random() * 2.8 + 1.8;
      }

      // Draw the trailing character cascade
      for (let j = 0; j < col.trailLength; j++) {
        const origY = col.headY - (j * this.fontSize);
        
        // Skip drawing if this specific character is offscreen
        if (origY < -this.fontSize || origY > this.height) continue;

        const origX = col.x;
        let renderX = origX;
        let renderY = origY;
        
        // Fades alpha toward tail
        const trailRatio = j / col.trailLength; // 0 (head) to 1 (tail)
        let finalAlpha = (1.0 - trailRatio) * col.baseAlpha;

        // Dynamic Cursor Repulsion Shield
        if (this.mouse.active && this.mouse.x !== null) {
          const dx = origX - this.mouse.x;
          const dy = origY - this.mouse.y;
          const dist = Math.hypot(dx, dy);

          if (dist < shieldRadius && dist > 0) {
            const pushFactor = (shieldRadius - dist) / dist;
            
            // Warp coordinates away from cursor
            renderX = origX + dx * pushFactor * 0.75;
            renderY = origY + dy * pushFactor * 0.75;

            // Fade characters out significantly as they get pushed
            finalAlpha *= (dist / shieldRadius) * 0.2; 
          }
        }

        if (finalAlpha < 0.02) continue;

        // Dynamic glitch character mutation
        const charIndex = (Math.floor(time * 0.005 + j) + i) % col.charsCache.length;
        let activeChar = col.charsCache[charIndex];
        
        if (Math.random() < 0.005) {
          col.charsCache[charIndex] = this.chars[Math.floor(Math.random() * this.chars.length)];
        }

        ctx.globalAlpha = finalAlpha;

        // Colors: Leading head character is white-hot, tail cascades through blues
        if (j === 0) {
          ctx.fillStyle = '#FFFFFF';
        } else {
          // Color based on height ratios
          const colorIndex = Math.min(
            this.colors.length - 1,
            Math.floor((origY / this.height) * this.colors.length)
          );
          ctx.fillStyle = this.colors[colorIndex];
        }

        ctx.fillText(activeChar, renderX, renderY);
      }
    }

    // Clean up drawing states
    ctx.globalAlpha = 1.0;

    // Fast terminal horizontal scanlines (no shadow or filter lag!)
    ctx.fillStyle = 'rgba(2, 4, 10, 0.06)';
    for (let y = 0; y < this.height; y += 4) {
      ctx.fillRect(0, y, this.width, 1.2);
    }
  }

  destroy() {
    super.destroy();
    this.columns = [];
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
    return 'ASCII Cyber Streams';
  }

  static get description() {
    return 'Retro cyber terminal scanlines of cascading glyphs, binary code, and tech symbols. Hovering your cursor creates a highly interactive magnetic repulsion shield, warping and fading code streams dynamically.';
  }

  static get vibe() {
    return 'Retro';
  }

  static get sourceCode() {
    return `class ASCIICyberStreams {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.columns = [];
    this.fontSize = 15;
    this.mouse = { x: null, y: null, active: false, radius: 150 };
    this.colors = ['#00F0FF', '#00A8FF', '#0066FF', '#0033CC'];
    this.chars = '01010101ABCDEF⚡☣⚙✦✧█▓▒░'.split('');

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
    this.columns = [];
    const spacing = Math.round(this.fontSize * 1.3);
    const columnCount = Math.floor(this.width / spacing);

    for (let i = 0; i < columnCount; i++) {
      const colX = i * spacing;
      const trailLength = Math.floor(Math.random() * 10) + 10;
      const streamChars = [];
      for (let c = 0; c < 30; c++) {
        streamChars.push(this.chars[Math.floor(Math.random() * this.chars.length)]);
      }

      this.columns.push({
        x: colX,
        speed: Math.random() * 2.8 + 1.8,
        headY: Math.random() * -this.height - 100,
        trailLength,
        charsCache: streamChars,
        baseAlpha: Math.random() * 0.45 + 0.55
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
    this.ctx.fillStyle = '#02040a';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.font = \`bold \${this.fontSize}px "Courier New", monospace\`;
    this.ctx.textBaseline = 'top';

    const shieldRadius = this.mouse.radius;
    const numColumns = this.columns.length;

    for (let i = 0; i < numColumns; i++) {
      const col = this.columns[i];
      col.headY += col.speed;
      if (col.headY > this.height + col.trailLength * this.fontSize) {
        col.headY = -15 * this.fontSize;
        col.speed = Math.random() * 2.8 + 1.8;
      }

      for (let j = 0; j < col.trailLength; j++) {
        const origY = col.headY - (j * this.fontSize);
        if (origY < -this.fontSize || origY > this.height) continue;

        const origX = col.x;
        let renderX = origX;
        let renderY = origY;
        const trailRatio = j / col.trailLength;
        let finalAlpha = (1.0 - trailRatio) * col.baseAlpha;

        if (this.mouse.active && this.mouse.x !== null) {
          const dx = origX - this.mouse.x;
          const dy = origY - this.mouse.y;
          const dist = Math.hypot(dx, dy);

          if (dist < shieldRadius && dist > 0) {
            const pushFactor = (shieldRadius - dist) / dist;
            renderX = origX + dx * pushFactor * 0.75;
            renderY = origY + dy * pushFactor * 0.75;
            finalAlpha *= (dist / shieldRadius) * 0.2;
          }
        }

        if (finalAlpha < 0.02) continue;

        const charIndex = (Math.floor(time * 0.005 + j) + i) % col.charsCache.length;
        let activeChar = col.charsCache[charIndex];
        
        if (Math.random() < 0.005) {
          col.charsCache[charIndex] = this.chars[Math.floor(Math.random() * this.chars.length)];
        }

        this.ctx.globalAlpha = finalAlpha;

        if (j === 0) {
          this.ctx.fillStyle = '#FFFFFF';
        } else {
          const colorIndex = Math.min(
            this.colors.length - 1,
            Math.floor((origY / this.height) * this.colors.length)
          );
          this.ctx.fillStyle = this.colors[colorIndex];
        }

        this.ctx.fillText(activeChar, renderX, renderY);
      }
    }

    this.ctx.globalAlpha = 1.0;

    // Terminal scanlines overlay
    this.ctx.fillStyle = 'rgba(2, 4, 10, 0.06)';
    for (let y = 0; y < this.height; y += 4) {
      this.ctx.fillRect(0, y, this.width, 1.2);
    }

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
