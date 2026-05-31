import BaseAnimation from './BaseAnimation.js';

export default class ASCIICyberStreams extends BaseAnimation {
  constructor() {
    super();
    this.columns = [];
    this.fontSize = 15;
    this.mouse = { x: null, y: null, active: false, radius: 150 };
    this.colors = ['#00F0FF', '#00A8FF', '#0066FF', '#0033CC']; // Bright cyan & digital blues
    this.chars = '01010101ABCDEF⚡☣⚙✦✧█▓▒░'.split('');
  }

  setup() {
    this.columns = [];
    const columnCount = Math.floor(this.width / this.fontSize);

    for (let i = 0; i < columnCount; i++) {
      const colX = i * this.fontSize;
      const colHeight = this.height;

      // Create multiple characters stacked vertically in this stream
      const maxChars = Math.floor(colHeight / this.fontSize) + 2;
      const streamChars = [];

      for (let j = 0; j < maxChars; j++) {
        streamChars.push({
          x: colX,
          y: j * this.fontSize,
          char: this.chars[Math.floor(Math.random() * this.chars.length)],
          opacity: Math.random() * 0.8 + 0.2,
          pulseSpeed: Math.random() * 0.05 + 0.01,
          pulseOffset: Math.random() * Math.PI * 2
        });
      }

      this.columns.push({
        x: colX,
        speed: Math.random() * 2 + 1.2,
        yOffset: Math.random() * -this.height, // Initial staggered fall offsets
        chars: streamChars
      });
    }
  }

  resize(width, height) {
    super.resize(width, height);
    this.setup(); // Re-initialize streams to properly match new bounds
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

      // Update stream offset (continuous falling effect)
      col.yOffset += col.speed;
      if (col.yOffset > 0) {
        col.yOffset = -this.height * 0.5; // Loop back up staggered
      }

      // Draw all characters in this stream column
      const numChars = col.chars.length;
      for (let j = 0; j < numChars; j++) {
        const charData = col.chars[j];
        
        // Compute raw position
        const origX = charData.x;
        const origY = (charData.y + col.yOffset + this.height) % this.height;

        let renderX = origX;
        let renderY = origY;
        let finalAlpha = charData.opacity;

        // Dynamic Cursor Repulsion Shield
        if (this.mouse.active && this.mouse.x !== null) {
          const dx = origX - this.mouse.x;
          const dy = origY - this.mouse.y;
          const dist = Math.hypot(dx, dy);

          if (dist < shieldRadius && dist > 0) {
            // Push force increases exponentially as characters get closer to center
            const pushFactor = (shieldRadius - dist) / dist;
            
            // Warp coordinates away from cursor
            renderX = origX + dx * pushFactor * 0.8;
            renderY = origY + dy * pushFactor * 0.8;

            // Fade characters out significantly as they get pushed
            finalAlpha = (dist / shieldRadius) * 0.25; 
          }
        }

        // Randomly mutate character occasionally for dynamic glitch/stream look
        if (Math.random() < 0.002) {
          charData.char = this.chars[Math.floor(Math.random() * this.chars.length)];
        }

        // Compute glowing pulse opacity
        const pulse = Math.sin(time * charData.pulseSpeed + charData.pulseOffset) * 0.2 + 0.8;
        ctx.globalAlpha = finalAlpha * pulse;

        // Dynamic cyber-hued gradients depending on index/position
        const colorIndex = Math.min(
          this.colors.length - 1,
          Math.floor((origY / this.height) * this.colors.length)
        );
        let activeColor = this.colors[colorIndex];

        // Make the leading character of each stream white-hot for high contrast
        const isLeadingChar = Math.abs(origY - ((col.yOffset + this.height) % this.height)) < this.fontSize * 1.5;
        if (isLeadingChar && finalAlpha > 0.4) {
          ctx.fillStyle = '#FFFFFF';
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#00F0FF';
        } else {
          ctx.fillStyle = activeColor;
          ctx.shadowBlur = 0;
        }

        ctx.fillText(charData.char, renderX, renderY);
      }
    }

    // Clean up drawing states
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1.0;

    // Optional subtle terminal overlay (CRT scanlines)
    ctx.fillStyle = 'rgba(2, 4, 10, 0.05)';
    for (let y = 0; y < this.height; y += 4) {
      ctx.fillRect(0, y, this.width, 1.5);
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
    const columnCount = Math.floor(this.width / this.fontSize);

    for (let i = 0; i < columnCount; i++) {
      const colX = i * this.fontSize;
      const colHeight = this.height;
      const maxChars = Math.floor(colHeight / this.fontSize) + 2;
      const streamChars = [];

      for (let j = 0; j < maxChars; j++) {
        streamChars.push({
          x: colX,
          y: j * this.fontSize,
          char: this.chars[Math.floor(Math.random() * this.chars.length)],
          opacity: Math.random() * 0.8 + 0.2,
          pulseSpeed: Math.random() * 0.05 + 0.01,
          pulseOffset: Math.random() * Math.PI * 2
        });
      }

      this.columns.push({
        x: colX,
        speed: Math.random() * 2 + 1.2,
        yOffset: Math.random() * -this.height,
        chars: streamChars
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
      col.yOffset += col.speed;
      if (col.yOffset > 0) {
        col.yOffset = -this.height * 0.5;
      }

      const numChars = col.chars.length;
      for (let j = 0; j < numChars; j++) {
        const charData = col.chars[j];
        const origX = charData.x;
        const origY = (charData.y + col.yOffset + this.height) % this.height;

        let renderX = origX;
        let renderY = origY;
        let finalAlpha = charData.opacity;

        if (this.mouse.active && this.mouse.x !== null) {
          const dx = origX - this.mouse.x;
          const dy = origY - this.mouse.y;
          const dist = Math.hypot(dx, dy);

          if (dist < shieldRadius && dist > 0) {
            const pushFactor = (shieldRadius - dist) / dist;
            renderX = origX + dx * pushFactor * 0.8;
            renderY = origY + dy * pushFactor * 0.8;
            finalAlpha = (dist / shieldRadius) * 0.25;
          }
        }

        if (Math.random() < 0.002) {
          charData.char = this.chars[Math.floor(Math.random() * this.chars.length)];
        }

        const pulse = Math.sin(time * charData.pulseSpeed + charData.pulseOffset) * 0.2 + 0.8;
        this.ctx.globalAlpha = finalAlpha * pulse;

        const colorIndex = Math.min(
          this.colors.length - 1,
          Math.floor((origY / this.height) * this.colors.length)
        );
        let activeColor = this.colors[colorIndex];

        const isLeadingChar = Math.abs(origY - ((col.yOffset + this.height) % this.height)) < this.fontSize * 1.5;
        if (isLeadingChar && finalAlpha > 0.4) {
          this.ctx.fillStyle = '#FFFFFF';
          this.ctx.shadowBlur = 10;
          this.ctx.shadowColor = '#00F0FF';
        } else {
          this.ctx.fillStyle = activeColor;
          this.ctx.shadowBlur = 0;
        }

        this.ctx.fillText(charData.char, renderX, renderY);
      }
    }

    this.ctx.shadowBlur = 0;
    this.ctx.globalAlpha = 1.0;

    // Subtle terminal scanline grid overlay
    this.ctx.fillStyle = 'rgba(2, 4, 10, 0.05)';
    for (let y = 0; y < this.height; y += 4) {
      this.ctx.fillRect(0, y, this.width, 1.5);
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
