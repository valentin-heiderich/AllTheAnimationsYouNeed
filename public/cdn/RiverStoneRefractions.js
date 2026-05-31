import BaseAnimation from './BaseAnimation.js';

export default class RiverStoneRefractions extends BaseAnimation {
  constructor() {
    super();
    this.stones = [];
    this.ripples = [];
    this.mouse = { x: null, y: null, active: false, radius: 130 };
    this.bg = '#03060a'; // Deep dark riverbed water black-blue
  }

  setup() {
    this.stones = [];
    this.ripples = [];
    
    // Spawn 15 smooth oval river stones at bottom
    const count = 15;
    for (let i = 0; i < count; i++) {
      const radiusX = 35 + Math.random() * 25;
      const radiusY = 20 + Math.random() * 15;
      
      this.stones.push({
        x: (this.width / (count + 1)) * (i + 1) + (Math.random() - 0.5) * 30,
        y: this.height - radiusY - Math.random() * 20,
        rx: radiusX,
        ry: radiusY,
        angle: (Math.random() - 0.5) * 0.4,
        color: `hsla(${200 + Math.random() * 30}, 20%, ${25 + Math.random() * 15}%, 0.75)`, // slate-grey stones
        brushed: false
      });
    }
  }

  resize(width, height) {
    super.resize(width, height);
    this.setup();
  }

  draw(ctx, time) {
    // Wet ink shading
    ctx.fillStyle = 'rgba(3, 6, 10, 0.14)';
    ctx.fillRect(0, 0, this.width, this.height);

    // Update and draw river ripples
    const causticFreq = time * 0.0015;

    // Draw stone silhouettes under refraction math
    this.stones.forEach(stone => {
      // Periodic water ripples refract horizontal positioning slightly
      const refractionX = Math.sin(causticFreq + stone.y * 0.02) * 5.0;
      const refractionY = Math.cos(causticFreq + stone.x * 0.02) * 3.5;

      const currX = stone.x + refractionX;
      const currY = stone.y + refractionY;

      // Mouse sweep collision trigger
      if (this.mouse.active && this.mouse.x !== null) {
        const dx = currX - this.mouse.x;
        const dy = currY - this.mouse.y;
        const dist = Math.hypot(dx, dy);

        if (dist < this.mouse.radius) {
          if (dist < 45 && !stone.brushed) {
            stone.brushed = true;
            this.triggerWaterDrop(currX, currY);
          }
        } else {
          stone.brushed = false;
        }
      } else {
        stone.brushed = false;
      }

      ctx.save();
      ctx.translate(currX, currY);
      ctx.rotate(stone.angle);
      
      ctx.beginPath();
      ctx.ellipse(0, 0, stone.rx, stone.ry, 0, 0, Math.PI * 2);
      ctx.fillStyle = stone.color;
      ctx.fill();
      
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1.0;
      ctx.stroke();

      ctx.restore();
    });

    // Draw active glowing caustics network overlays on top of water
    ctx.lineWidth = 1.1;
    ctx.strokeStyle = 'rgba(150, 220, 255, 0.08)';
    
    const density = 25;
    for (let x = 0; x < this.width; x += density) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      for (let y = 0; y < this.height; y += 12) {
        // Refraction math coordinate mesh
        const shiftX = Math.sin(x * 0.01 + y * 0.02 + causticFreq) * 12;
        ctx.lineTo(x + shiftX, y);
      }
      ctx.stroke();
    }

    // Process active water droplet rings
    ctx.lineWidth = 1.2;
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const rip = this.ripples[i];
      rip.radius += rip.speed;
      rip.opacity -= 0.016;

      if (rip.opacity <= 0) {
        this.ripples.splice(i, 1);
        continue;
      }

      ctx.beginPath();
      ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(180, 235, 255, ${rip.opacity * 0.55})`;
      ctx.stroke();
    }
  }

  triggerWaterDrop(x, y) {
    this.ripples.push({
      x,
      y,
      radius: 1.0,
      opacity: 0.85,
      speed: 0.65 + Math.random() * 0.45
    });

    // Synthesize organic wet bubbling water chime note
    this.playDropletSound(x, y);
  }

  destroy() {
    super.destroy();
    this.stones = [];
    this.ripples = [];
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

  playDropletSound(x, y) {
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

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Bubble/water chime scales
      const pentatonic = [261.63, 311.13, 349.23, 392.00, 466.16, 523.25, 622.25, 698.46, 783.99];
      const scalePct = Math.max(0, Math.min(1, x / this.width));
      const noteIdx = Math.floor(scalePct * (pentatonic.length - 1));
      const baseFreq = pentatonic[noteIdx];

      osc.type = 'sine';
      // Fast upward sweep to synthesize bubble formation (pop/drop)
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.88, ctx.currentTime + 0.08);

      const lofiVolSetting = localStorage.getItem('aetherflow_lofi_vol');
      const masterVolumeMultiplier = lofiVolSetting !== null ? parseFloat(lofiVolSetting) : 0.5;
      const vol = (0.04 + Math.random() * 0.03) * masterVolumeMultiplier;

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.005);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.28);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {}
  }

  static get title() {
    return 'River Stone Refractions';
  }

  static get description() {
    return 'Smooth wet river stones lying under dynamic shifting light caustics and caustics-refracted coordinates. Swiping through the water triggers expanding glowing ripples that synthesize cozy organic bubbling chimes.';
  }

  static get vibe() {
    return 'Satisfying';
  }

  static get sourceCode() {
    return `class RiverStoneRefractions {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.stones = [];
    this.ripples = [];
    this.mouse = { x: null, y: null, active: false, radius: 130 };
    
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
    this.stones = [];
    this.ripples = [];
    const count = 15;
    for (let i = 0; i < count; i++) {
      const radiusX = 35 + Math.random() * 25;
      const radiusY = 20 + Math.random() * 15;
      
      this.stones.push({
        x: (this.width / (count + 1)) * (i + 1) + (Math.random() - 0.5) * 30,
        y: this.height - radiusY - Math.random() * 20,
        rx: radiusX,
        ry: radiusY,
        angle: (Math.random() - 0.5) * 0.4,
        color: \`hsla(\${200 + Math.random() * 30}, 20%, \${25 + Math.random() * 15}%, 0.75)\`,
        brushed: false
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
    this.ctx.fillStyle = 'rgba(3, 6, 10, 0.14)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    const causticFreq = time * 0.0015;

    this.stones.forEach(stone => {
      const refractionX = Math.sin(causticFreq + stone.y * 0.02) * 5.0;
      const refractionY = Math.cos(causticFreq + stone.x * 0.02) * 3.5;

      const currX = stone.x + refractionX;
      const currY = stone.y + refractionY;

      if (this.mouse.active && this.mouse.x !== null) {
        const dx = currX - this.mouse.x;
        const dy = currY - this.mouse.y;
        const dist = Math.hypot(dx, dy);

        if (dist < this.mouse.radius) {
          if (dist < 45 && !stone.brushed) {
            stone.brushed = true;
            this.triggerWaterDrop(currX, currY);
          }
        } else {
          stone.brushed = false;
        }
      } else {
        stone.brushed = false;
      }

      this.ctx.save();
      this.ctx.translate(currX, currY);
      this.ctx.rotate(stone.angle);
      
      this.ctx.beginPath();
      this.ctx.ellipse(0, 0, stone.rx, stone.ry, 0, 0, Math.PI * 2);
      this.ctx.fillStyle = stone.color;
      this.ctx.fill();
      this.ctx.restore();
    });

    this.ctx.lineWidth = 1.1;
    this.ctx.strokeStyle = 'rgba(150, 220, 255, 0.08)';
    
    const density = 25;
    for (let x = 0; x < this.width; x += density) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      for (let y = 0; y < this.height; y += 12) {
        const shiftX = Math.sin(x * 0.01 + y * 0.02 + causticFreq) * 12;
        this.ctx.lineTo(x + shiftX, y);
      }
      this.ctx.stroke();
    }

    this.ctx.lineWidth = 1.2;
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const rip = this.ripples[i];
      rip.radius += rip.speed;
      rip.opacity -= 0.016;

      if (rip.opacity <= 0) {
        this.ripples.splice(i, 1);
        continue;
      }

      this.ctx.beginPath();
      this.ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
      this.ctx.strokeStyle = \`rgba(180, 235, 255, \${rip.opacity * 0.55})\`;
      this.ctx.stroke();
    }

    requestAnimationFrame((t) => this.animate(t));
  }

  triggerWaterDrop(x, y) {
    this.ripples.push({
      x,
      y,
      radius: 1.0,
      opacity: 0.85,
      speed: 0.65 + Math.random() * 0.45
    });
    this.playDropletSound(x, y);
  }

  playDropletSound(x, y) {
    if (this.canvas && this.canvas.getAttribute('data-audio-muted') === 'true') return;
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
      
      const ctx = this.audioCtx;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      const pentatonic = [261.63, 311.13, 349.23, 392.00, 466.16, 523.25, 622.25, 698.46, 783.99];
      const scalePct = Math.max(0, Math.min(1, x / this.width));
      const noteIdx = Math.floor(scalePct * (pentatonic.length - 1));
      const baseFreq = pentatonic[noteIdx];

      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.88, ctx.currentTime + 0.08);

      const lofiVolSetting = localStorage.getItem('aetherflow_lofi_vol');
      const masterVolumeMultiplier = lofiVolSetting !== null ? parseFloat(lofiVolSetting) : 0.5;
      const vol = (0.04 + Math.random() * 0.03) * masterVolumeMultiplier;

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.005);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.28);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
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
