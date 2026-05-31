import BaseAnimation from './BaseAnimation.js';

export default class DigitalRainMatrix extends BaseAnimation {
  constructor() {
    super();
    this.streams = [];
    this.fontSize = 15;
    this.mouse = { x: null, y: null, active: false, radius: 150 };
  }

  setup() {
    this.streams = [];
    const columns = Math.ceil(this.width / this.fontSize) + 1;

    for (let i = 0; i < columns; i++) {
      this.streams.push({
        x: i * this.fontSize,
        y: Math.random() * -this.height - 100,
        speed: Math.random() * 3 + 2,
        tailLength: Math.floor(Math.random() * 15) + 10,
        chars: Array.from({ length: 30 }, () => (Math.random() > 0.5 ? '1' : '0')),
        lastMutation: 0
      });
    }
  }

  resize(width, height) {
    super.resize(width, height);
    this.setup();
  }

  draw(ctx, time) {
    ctx.fillStyle = 'rgba(6, 8, 12, 0.16)';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.font = `bold ${this.fontSize}px monospace`;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'center';

    this.streams.forEach(stream => {
      stream.y += stream.speed;
      if (stream.y - (stream.tailLength * this.fontSize) > this.height) {
        stream.y = Math.random() * -200 - 50;
        stream.speed = Math.random() * 3 + 2;
      }

      for (let i = 0; i < stream.tailLength; i++) {
        const charY = stream.y - i * this.fontSize;
        if (charY < 0 || charY > this.height) continue;

        if (time - stream.lastMutation > 200) {
          if (Math.random() < 0.05) {
            stream.chars[i] = Math.random() > 0.5 ? '1' : '0';
            stream.lastMutation = time;
          }
        }

        const char = stream.chars[i % stream.chars.length];
        let drawX = stream.x + this.fontSize / 2;
        let drawY = charY;

        if (this.mouse.active && this.mouse.x !== null) {
          const dx = drawX - this.mouse.x;
          const dy = drawY - this.mouse.y;
          const dist = Math.hypot(dx, dy);

          if (dist < this.mouse.radius) {
            const force = (this.mouse.radius - dist) / this.mouse.radius;
            drawX += (dx / (dist || 1)) * force * 55;
            drawY += (dy / (dist || 1)) * force * 55;
          }
        }

        const alpha = 1 - i / stream.tailLength;
        
        if (i === 0) {
          ctx.fillStyle = `rgba(220, 255, 240, ${alpha})`;
          ctx.shadowBlur = 8;
          ctx.shadowColor = '#00FF99';
        } else {
          const hue = 140 + Math.sin(time * 0.001 + stream.x) * 15;
          ctx.fillStyle = `hsla(${hue}, 100%, 55%, ${alpha})`;
          ctx.shadowBlur = 4;
          ctx.shadowColor = `hsla(${hue}, 100%, 55%, 0.6)`;
        }

        ctx.fillText(char, drawX, drawY);
      }
    });

    ctx.shadowBlur = 0;
  }

  destroy() {
    super.destroy();
    this.streams = [];
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
    return 'Digital Rain Matrix';
  }

  static get description() {
    return 'A cascading matrix of binary code elements. Move your cursor to create a high-tech repellent forcefield that bends the digital streams around your mouse in real-time.';
  }

  static get vibe() {
    return 'Cybernetic';
  }

  static get sourceCode() {
    return `class DigitalRainMatrix {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.streams = [];
    this.fontSize = 15;
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
    this.streams = [];
    const columns = Math.ceil(this.width / this.fontSize) + 1;

    for (let i = 0; i < columns; i++) {
      this.streams.push({
        x: i * this.fontSize,
        y: Math.random() * -this.height - 100,
        speed: Math.random() * 3 + 2,
        tailLength: Math.floor(Math.random() * 15) + 10,
        chars: Array.from({ length: 30 }, () => (Math.random() > 0.5 ? '1' : '0')),
        lastMutation: 0
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
    this.ctx.fillStyle = 'rgba(6, 8, 12, 0.16)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.font = \`bold \${this.fontSize}px monospace\`;
    this.ctx.textBaseline = 'top';
    this.ctx.textAlign = 'center';

    this.streams.forEach(stream => {
      stream.y += stream.speed;
      if (stream.y - (stream.tailLength * this.fontSize) > this.height) {
        stream.y = Math.random() * -200 - 50;
        stream.speed = Math.random() * 3 + 2;
      }

      for (let i = 0; i < stream.tailLength; i++) {
        const charY = stream.y - i * this.fontSize;
        if (charY < 0 || charY > this.height) continue;

        if (time - stream.lastMutation > 200) {
          if (Math.random() < 0.05) {
            stream.chars[i] = Math.random() > 0.5 ? '1' : '0';
            stream.lastMutation = time;
          }
        }

        const char = stream.chars[i % stream.chars.length];
        let drawX = stream.x + this.fontSize / 2;
        let drawY = charY;

        if (this.mouse.active && this.mouse.x !== null) {
          const dx = drawX - this.mouse.x;
          const dy = drawY - this.mouse.y;
          const dist = Math.hypot(dx, dy);

          if (dist < this.mouse.radius) {
            const force = (this.mouse.radius - dist) / this.mouse.radius;
            drawX += (dx / (dist || 1)) * force * 55;
            drawY += (dy / (dist || 1)) * force * 55;
          }
        }

        const alpha = 1 - i / stream.tailLength;
        
        if (i === 0) {
          this.ctx.fillStyle = \`rgba(220, 255, 240, \${alpha})\`;
          this.ctx.shadowBlur = 8;
          this.ctx.shadowColor = '#00FF99';
        } else {
          const hue = 140 + Math.sin(time * 0.001 + stream.x) * 15;
          this.ctx.fillStyle = \`hsla(\${hue}, 100%, 55%, \${alpha})\`;
          this.ctx.shadowBlur = 4;
          this.ctx.shadowColor = \`hsla(\${hue}, 100%, 55%, 0.6)\`;
        }

        this.ctx.fillText(char, drawX, drawY);
      }
    });

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
