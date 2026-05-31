import BaseAnimation from './BaseAnimation.js';

export default class VerletMossDampener extends BaseAnimation {
  constructor() {
    super();
    this.strands = [];
    this.mouse = { x: null, y: null, active: false, radius: 100 };
    this.bg = '#050806'; // Cozy forest shade dark green
  }

  setup() {
    this.strands = [];
    const count = 16 + Math.floor(this.width / 60);

    for (let i = 0; i < count; i++) {
      const startX = (this.width / (count + 1)) * (i + 1) + (Math.random() - 0.5) * 15;
      const links = [];
      const numLinks = 10 + Math.floor(Math.random() * 8);

      for (let l = 0; l < numLinks; l++) {
        links.push({
          x: startX,
          y: l * 12,
          px: startX,
          py: l * 12,
          length: 10 + Math.random() * 4,
          brushed: false
        });
      }
      this.strands.push(links);
    }
  }

  resize(width, height) {
    super.resize(width, height);
    this.setup();
  }

  draw(ctx, time) {
    // Elegant deep forest trail glow
    ctx.fillStyle = 'rgba(5, 8, 6, 0.12)';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.strokeStyle = 'rgba(115, 155, 125, 0.28)';
    ctx.lineWidth = 1.8;

    this.strands.forEach((links, strIdx) => {
      // 1. Verlet updates
      links.forEach((link, idx) => {
        if (idx === 0) {
          // Anchor point at top of canvas
          link.x = link.x;
          link.y = 0;
        } else {
          const vx = (link.x - link.px) * 0.93;
          const vy = (link.y - link.py) * 0.93 + 0.05; // tiny gravity

          link.px = link.x;
          link.py = link.y;
          link.x += vx;
          link.y += vy;

          // Drag check
          if (this.mouse.active && this.mouse.x !== null) {
            const dx = link.x - this.mouse.x;
            const dy = link.y - this.mouse.y;
            const dist = Math.hypot(dx, dy);

            if (dist < this.mouse.radius) {
              const force = (this.mouse.radius - dist) / this.mouse.radius;
              link.x += (dx / (dist || 1)) * force * 5.0; // push moss strands
              
              if (dist < 28 && !link.brushed) {
                link.brushed = true;
                this.playDampPluckSound(link.y);
              }
            } else {
              link.brushed = false;
            }
          } else {
            link.brushed = false;
          }
        }
      });

      // 2. Solve link elastic constraints
      for (let step = 0; step < 4; step++) {
        for (let l = 1; l < links.length; l++) {
          const l1 = links[l - 1];
          const l2 = links[l];
          const dx = l2.x - l1.x;
          const dy = l2.y - l1.y;
          const d = Math.hypot(dx, dy);
          const diff = l2.length - d;
          const pct = (diff / (d || 1)) * 0.5;

          l2.x += dx * pct;
          l2.y += dy * pct;
          l1.x -= dx * pct;
          l1.y -= dy * pct;
        }
      }

      // 3. Draw moss strand curved paths
      ctx.beginPath();
      ctx.moveTo(links[0].x, links[0].y);
      for (let l = 1; l < links.length; l++) {
        ctx.lineTo(links[l].x, links[l].y);
      }
      ctx.stroke();

      // Render moss leafy texture nodes
      ctx.fillStyle = 'rgba(125, 175, 135, 0.42)';
      links.forEach((link, idx) => {
        if (idx > 0 && idx % 2 === 0) {
          ctx.beginPath();
          ctx.arc(link.x, link.y, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    });
  }

  destroy() {
    super.destroy();
    this.strands = [];
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

  playDampPluckSound(y) {
    if (this.canvas && this.canvas.getAttribute('data-audio-muted') === 'true') {
      return;
    }

    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const ctx = this.audioCtx;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Soothing bass-mid acoustic scale
      const pentatonic = [110.00, 130.81, 146.83, 164.81, 196.00, 220.00, 261.63, 293.66, 329.63];
      const scalePct = 1 - Math.max(0, Math.min(1, y / this.height));
      const noteIdx = Math.floor(scalePct * (pentatonic.length - 1));
      const freq = pentatonic[noteIdx];

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      const lofiVolSetting = localStorage.getItem('aetherflow_lofi_vol');
      const masterVolumeMultiplier = lofiVolSetting !== null ? parseFloat(lofiVolSetting) : 0.5;
      const vol = 0.14 * masterVolumeMultiplier;

      // Fast dampened decay envelope
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.005);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);

      // Dampened acoustic guitar lowpass filter
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.3);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.55);
    } catch (e) {}
  }

  static get title() {
    return 'Verlet Moss Dampener';
  }

  static get description() {
    return 'Hanging green moss strands dangling from the canopy, solved dynamically via elastic Verlet chain links. Dragging your cursor through the strands triggers muffled, cozy nylon acoustic-guitar notes.';
  }

  static get vibe() {
    return 'Organic';
  }

  static get sourceCode() {
    return `class VerletMossDampener {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.strands = [];
    this.mouse = { x: null, y: null, active: false, radius: 100 };
    
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
    this.strands = [];
    const count = 16 + Math.floor(this.width / 60);

    for (let i = 0; i < count; i++) {
      const startX = (this.width / (count + 1)) * (i + 1) + (Math.random() - 0.5) * 15;
      const links = [];
      const numLinks = 10 + Math.floor(Math.random() * 8);

      for (let l = 0; l < numLinks; l++) {
        links.push({
          x: startX,
          y: l * 12,
          px: startX,
          py: l * 12,
          length: 10 + Math.random() * 4,
          brushed: false
        });
      }
      this.strands.push(links);
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
    this.ctx.fillStyle = 'rgba(5, 8, 6, 0.12)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.strokeStyle = 'rgba(115, 155, 125, 0.28)';
    this.ctx.lineWidth = 1.8;

    this.strands.forEach((links) => {
      links.forEach((link, idx) => {
        if (idx === 0) {
          link.y = 0;
        } else {
          const vx = (link.x - link.px) * 0.93;
          const vy = (link.y - link.py) * 0.93 + 0.05;

          link.px = link.x;
          link.py = link.y;
          link.x += vx;
          link.y += vy;

          if (this.mouse.active && this.mouse.x !== null) {
            const dx = link.x - this.mouse.x;
            const dy = link.y - this.mouse.y;
            const dist = Math.hypot(dx, dy);

            if (dist < this.mouse.radius) {
              const force = (this.mouse.radius - dist) / this.mouse.radius;
              link.x += (dx / (dist || 1)) * force * 5.0;
              
              if (dist < 28 && !link.brushed) {
                link.brushed = true;
                this.playDampPluckSound(link.y);
              }
            } else {
              link.brushed = false;
            }
          } else {
            link.brushed = false;
          }
        }
      });

      for (let step = 0; step < 4; step++) {
        for (let l = 1; l < links.length; l++) {
          const l1 = links[l - 1];
          const l2 = links[l];
          const dx = l2.x - l1.x;
          const dy = l2.y - l1.y;
          const d = Math.hypot(dx, dy);
          const diff = l2.length - d;
          const pct = (diff / (d || 1)) * 0.5;

          l2.x += dx * pct;
          l2.y += dy * pct;
          l1.x -= dx * pct;
          l1.y -= dy * pct;
        }
      }

      this.ctx.beginPath();
      this.ctx.moveTo(links[0].x, links[0].y);
      for (let l = 1; l < links.length; l++) {
        this.ctx.lineTo(links[l].x, links[l].y);
      }
      this.ctx.stroke();

      this.ctx.fillStyle = 'rgba(125, 175, 135, 0.42)';
      links.forEach((link, idx) => {
        if (idx > 0 && idx % 2 === 0) {
          this.ctx.beginPath();
          this.ctx.arc(link.x, link.y, 2.5, 0, Math.PI * 2);
          this.ctx.fill();
        }
      });
    });

    requestAnimationFrame((t) => this.animate(t));
  }

  playDampPluckSound(y) {
    if (this.canvas && this.canvas.getAttribute('data-audio-muted') === 'true') return;
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
      
      const ctx = this.audioCtx;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      const pentatonic = [110.00, 130.81, 146.83, 164.81, 196.00, 220.00, 261.63, 293.66, 329.63];
      const scalePct = 1 - Math.max(0, Math.min(1, y / this.height));
      const noteIdx = Math.floor(scalePct * (pentatonic.length - 1));
      const freq = pentatonic[noteIdx];

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      const lofiVolSetting = localStorage.getItem('aetherflow_lofi_vol');
      const masterVolumeMultiplier = lofiVolSetting !== null ? parseFloat(lofiVolSetting) : 0.5;
      const vol = 0.14 * masterVolumeMultiplier;

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.005);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.3);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.55);
    } catch (e) {}
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
