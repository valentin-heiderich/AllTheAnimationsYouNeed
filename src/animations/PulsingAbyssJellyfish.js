import BaseAnimation from './BaseAnimation.js';

export default class PulsingAbyssJellyfish extends BaseAnimation {
  constructor() {
    super();
    this.jellyfish = [];
    this.mouse = { x: null, y: null, active: false, radius: 160 };
    this.bg = '#03050c'; // Deep midnight ocean abyss black-blue
  }

  setup() {
    this.jellyfish = [];
    const count = 4;
    for (let i = 0; i < count; i++) {
      this.jellyfish.push(this.createJelly(true));
    }
  }

  createJelly(randomizeY = false) {
    const radius = 25 + Math.random() * 20;
    const x = Math.random() * this.width;
    const y = randomizeY ? Math.random() * this.height : this.height + 100;
    
    // Create 6 elastic Verlet tendrils
    const tendrils = [];
    const numTendrils = 6;
    for (let t = 0; t < numTendrils; t++) {
      const links = [];
      const numLinks = 8 + Math.floor(Math.random() * 6);
      const startX = x - radius + (radius * 2 / (numTendrils - 1)) * t;
      
      for (let l = 0; l < numLinks; l++) {
        links.push({
          x: startX,
          y: y + l * 8,
          px: startX,
          py: y + l * 8,
          length: 8 + Math.random() * 4
        });
      }
      tendrils.push(links);
    }

    return {
      x,
      y,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -0.2 - Math.random() * 0.4,
      radius,
      color: `hsla(${190 + Math.random() * 60}, 90%, 65%, 0.35)`, // glowing cyans & purples
      tendrils,
      pulsePhase: Math.random() * Math.PI * 2,
      pulseSpeed: 0.02 + Math.random() * 0.015,
      contracted: false
    };
  }

  resize(width, height) {
    super.resize(width, height);
    this.setup();
  }

  draw(ctx, time) {
    // Elegant deep ink liquid fade
    ctx.fillStyle = 'rgba(3, 5, 12, 0.12)';
    ctx.fillRect(0, 0, this.width, this.height);

    this.jellyfish.forEach(jelly => {
      // Periodic pulse phase for propulsion
      const prevPhase = jelly.pulsePhase;
      jelly.pulsePhase += jelly.pulseSpeed;
      
      const contraction = Math.sin(jelly.pulsePhase);
      const isContracting = contraction > 0.8;

      // propulsion force on peaks of contraction
      if (isContracting) {
        jelly.vy = -1.6 - Math.random() * 0.6;
        jelly.vx += (Math.random() - 0.5) * 0.2;
        
        // Trigger sub-bass pulse only once per contraction cycle
        if (!jelly.contracted) {
          jelly.contracted = true;
          this.playSubBassSound(jelly.y);
        }
      } else {
        jelly.vy += ( -0.35 - jelly.vy ) * 0.05; // ease back to drift speed
        if (contraction < 0.0) {
          jelly.contracted = false;
        }
      }

      jelly.x += jelly.vx;
      jelly.y += jelly.vy;

      // Steer back inside bounds horizontally
      if (jelly.x < -100) jelly.x = this.width + 100;
      if (jelly.x > this.width + 100) jelly.x = -100;
      
      // Recycle at bottom when drifting past top
      if (jelly.y < -120) {
        Object.assign(jelly, this.createJelly(false));
      }

      // Physics: Verlet Integration on trailing tentacles
      jelly.tendrils.forEach((tendril, tIndex) => {
        const attachX = jelly.x - jelly.radius + (jelly.radius * 2 / (jelly.tendrils.length - 1)) * tIndex;
        const attachY = jelly.y + Math.max(0, contraction) * 8; // move anchor up/down on pulse

        tendril.forEach((link, lIndex) => {
          if (lIndex === 0) {
            link.x = attachX;
            link.y = attachY;
          } else {
            // Verlet updates
            const vx = (link.x - link.px) * 0.95;
            const vy = (link.y - link.py) * 0.95 + 0.04; // gravity drag
            
            link.px = link.x;
            link.py = link.y;
            link.x += vx;
            link.y += vy;

            // Cursor sweep checks
            if (this.mouse.active && this.mouse.x !== null) {
              const dx = link.x - this.mouse.x;
              const dy = link.y - this.mouse.y;
              const d = Math.hypot(dx, dy);
              if (d < this.mouse.radius) {
                const force = (this.mouse.radius - d) / this.mouse.radius;
                link.x += (dx / (d || 1)) * force * 6; // push tentacles
                
                if (Math.random() < 0.012) {
                  this.playAbyssPadSound(link.y);
                }
              }
            }
          }
        });

        // Resolve link constraints
        for (let step = 0; step < 3; step++) {
          for (let l = 1; l < tendril.length; l++) {
            const l1 = tendril[l - 1];
            const l2 = tendril[l];
            const dx = l2.x - l1.x;
            const dy = l2.y - l1.y;
            const d = Math.hypot(dx, dy);
            const diff = l2.length - d;
            const offsetPct = (diff / (d || 1)) * 0.5;
            
            l2.x += dx * offsetPct;
            l2.y += dy * offsetPct;
            l1.x -= dx * offsetPct;
            l1.y -= dy * offsetPct;
          }
        }
      });

      // Render tentacles
      ctx.lineWidth = 1.6;
      jelly.tendrils.forEach(tendril => {
        ctx.beginPath();
        ctx.moveTo(tendril[0].x, tendril[0].y);
        for (let l = 1; l < tendril.length; l++) {
          ctx.lineTo(tendril[l].x, tendril[l].y);
        }
        ctx.strokeStyle = jelly.color.replace(/[\d.]+\)$/, '0.14)');
        ctx.stroke();
      });

      // Render bioluminescent bell cap
      ctx.save();
      ctx.translate(jelly.x, jelly.y);
      const stretch = Math.max(0.7, 1.0 - contraction * 0.25);
      ctx.scale(1.0 + contraction * 0.2, stretch);

      ctx.beginPath();
      ctx.arc(0, 0, jelly.radius, Math.PI, 0, false);
      ctx.quadraticCurveTo(jelly.radius * 0.9, jelly.radius * 0.3, jelly.radius, jelly.radius * 0.3);
      ctx.quadraticCurveTo(0, jelly.radius * 0.45, -jelly.radius, jelly.radius * 0.3);
      ctx.quadraticCurveTo(-jelly.radius * 0.9, jelly.radius * 0.3, -jelly.radius, 0);
      ctx.closePath();
      
      ctx.shadowBlur = 15;
      ctx.shadowColor = jelly.color.replace(/[\d.]+\)$/, '0.55)');
      ctx.fillStyle = jelly.color;
      ctx.fill();
      ctx.shadowBlur = 0; // reset

      // inner bioluminescent rib detailing
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(-jelly.radius * 0.5, 0);
      ctx.quadraticCurveTo(0, -jelly.radius * 0.6, jelly.radius * 0.5, 0);
      ctx.stroke();

      ctx.restore();
    });
  }

  destroy() {
    super.destroy();
    this.jellyfish = [];
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

  playSubBassSound(y) {
    if (this.canvas && this.canvas.getAttribute('data-audio-muted') === 'true') return;
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
      
      const ctx = this.audioCtx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      // Deep sub-bass sweep mapped to depth
      const ratio = 1 - Math.max(0, Math.min(1, y / this.height));
      const targetHz = 40 + ratio * 35; // 40Hz to 75Hz sub frequencies

      osc.type = 'sine';
      osc.frequency.setValueAtTime(targetHz + 30, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(targetHz, ctx.currentTime + 0.35);

      const lofiVolSetting = localStorage.getItem('aetherflow_lofi_vol');
      const masterVolumeMultiplier = lofiVolSetting !== null ? parseFloat(lofiVolSetting) : 0.5;
      const vol = 0.22 * masterVolumeMultiplier;

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.8);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 2.0);
    } catch (e) {}
  }

  playAbyssPadSound(y) {
    if (this.canvas && this.canvas.getAttribute('data-audio-muted') === 'true') return;
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
      
      const ctx = this.audioCtx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      // Spacious deep oceanic pentatonic scale
      const pentatonic = [196.00, 220.00, 261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];
      const idx = Math.floor((1 - Math.max(0, Math.min(1, y / this.height))) * (pentatonic.length - 1));
      const freq = pentatonic[idx];

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      const lofiVolSetting = localStorage.getItem('aetherflow_lofi_vol');
      const masterVolumeMultiplier = lofiVolSetting !== null ? parseFloat(lofiVolSetting) : 0.5;
      const vol = 0.08 * masterVolumeMultiplier;

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.5);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(250, ctx.currentTime + 1.2);
      filter.Q.setValueAtTime(1.5, ctx.currentTime);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 2.7);
    } catch (e) {}
  }

  static get title() {
    return 'Pulsing Abyss Jellyfish';
  }

  static get description() {
    return 'Bioluminescent jellyfish swimming in the deep ocean abyss. Bell propulsion contractions generate deep analog sub-bass swells, while swiping their trailing Verlet-link tentacles triggers cozy ambient pad swells.';
  }

  static get vibe() {
    return 'Biological';
  }

  static get sourceCode() {
    return `class PulsingAbyssJellyfish {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.jellyfish = [];
    this.mouse = { x: null, y: null, active: false, radius: 160 };
    
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
    this.jellyfish = [];
    const count = 4;
    for (let i = 0; i < count; i++) {
      this.jellyfish.push(this.createJelly(true));
    }
  }

  createJelly(randomizeY = false) {
    const radius = 25 + Math.random() * 20;
    const x = Math.random() * this.width;
    const y = randomizeY ? Math.random() * this.height : this.height + 100;
    
    const tendrils = [];
    const numTendrils = 6;
    for (let t = 0; t < numTendrils; t++) {
      const links = [];
      const numLinks = 8 + Math.floor(Math.random() * 6);
      const startX = x - radius + (radius * 2 / (numTendrils - 1)) * t;
      
      for (let l = 0; l < numLinks; l++) {
        links.push({
          x: startX,
          y: y + l * 8,
          px: startX,
          py: y + l * 8,
          length: 8 + Math.random() * 4
        });
      }
      tendrils.push(links);
    }

    return {
      x,
      y,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -0.2 - Math.random() * 0.4,
      radius,
      color: \`hsla(\${190 + Math.random() * 60}, 90%, 65%, 0.35)\`,
      tendrils,
      pulsePhase: Math.random() * Math.PI * 2,
      pulseSpeed: 0.02 + Math.random() * 0.015,
      contracted: false
    };
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
    this.ctx.fillStyle = 'rgba(3, 5, 12, 0.12)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.jellyfish.forEach(jelly => {
      const prevPhase = jelly.pulsePhase;
      jelly.pulsePhase += jelly.pulseSpeed;
      
      const contraction = Math.sin(jelly.pulsePhase);
      const isContracting = contraction > 0.8;

      if (isContracting) {
        jelly.vy = -1.6 - Math.random() * 0.6;
        jelly.vx += (Math.random() - 0.5) * 0.2;
        
        if (!jelly.contracted) {
          jelly.contracted = true;
          this.playSubBassSound(jelly.y);
        }
      } else {
        jelly.vy += ( -0.35 - jelly.vy ) * 0.05;
        if (contraction < 0.0) jelly.contracted = false;
      }

      jelly.x += jelly.vx;
      jelly.y += jelly.vy;

      if (jelly.x < -100) jelly.x = this.width + 100;
      if (jelly.x > this.width + 100) jelly.x = -100;
      if (jelly.y < -120) {
        Object.assign(jelly, this.createJelly(false));
      }

      jelly.tendrils.forEach((tendril, tIndex) => {
        const attachX = jelly.x - jelly.radius + (jelly.radius * 2 / (jelly.tendrils.length - 1)) * tIndex;
        const attachY = jelly.y + Math.max(0, contraction) * 8;

        tendril.forEach((link, lIndex) => {
          if (lIndex === 0) {
            link.x = attachX;
            link.y = attachY;
          } else {
            const vx = (link.x - link.px) * 0.95;
            const vy = (link.y - link.py) * 0.95 + 0.04;
            
            link.px = link.x;
            link.py = link.y;
            link.x += vx;
            link.y += vy;

            if (this.mouse.active && this.mouse.x !== null) {
              const dx = link.x - this.mouse.x;
              const dy = link.y - this.mouse.y;
              const d = Math.hypot(dx, dy);
              if (d < this.mouse.radius) {
                const force = (this.mouse.radius - d) / this.mouse.radius;
                link.x += (dx / (d || 1)) * force * 6;
                
                if (Math.random() < 0.012) {
                  this.playAbyssPadSound(link.y);
                }
              }
            }
          }
        });

        for (let step = 0; step < 3; step++) {
          for (let l = 1; l < tendril.length; l++) {
            const l1 = tendril[l - 1];
            const l2 = tendril[l];
            const dx = l2.x - l1.x;
            const dy = l2.y - l1.y;
            const d = Math.hypot(dx, dy);
            const diff = l2.length - d;
            const offsetPct = (diff / (d || 1)) * 0.5;
            
            l2.x += dx * offsetPct;
            l2.y += dy * offsetPct;
            l1.x -= dx * offsetPct;
            l1.y -= dy * offsetPct;
          }
        }
      });

      jelly.tendrils.forEach(tendril => {
        this.ctx.beginPath();
        this.ctx.moveTo(tendril[0].x, tendril[0].y);
        for (let l = 1; l < tendril.length; l++) {
          this.ctx.lineTo(tendril[l].x, tendril[l].y);
        }
        this.ctx.strokeStyle = jelly.color.replace(/[\\d.]+\\)$/, '0.14)');
        this.ctx.stroke();
      });

      this.ctx.save();
      this.ctx.translate(jelly.x, jelly.y);
      const stretch = Math.max(0.7, 1.0 - contraction * 0.25);
      this.ctx.scale(1.0 + contraction * 0.2, stretch);

      this.ctx.beginPath();
      this.ctx.arc(0, 0, jelly.radius, Math.PI, 0, false);
      this.ctx.quadraticCurveTo(jelly.radius * 0.9, jelly.radius * 0.3, jelly.radius, jelly.radius * 0.3);
      this.ctx.quadraticCurveTo(0, jelly.radius * 0.45, -jelly.radius, jelly.radius * 0.3);
      this.ctx.quadraticCurveTo(-jelly.radius * 0.9, jelly.radius * 0.3, -jelly.radius, 0);
      this.ctx.closePath();
      
      this.ctx.fillStyle = jelly.color;
      this.ctx.fill();
      this.ctx.restore();
    });

    requestAnimationFrame((t) => this.animate(t));
  }

  playSubBassSound(y) {
    if (this.canvas && this.canvas.getAttribute('data-audio-muted') === 'true') return;
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
      
      const ctx = this.audioCtx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      const ratio = 1 - Math.max(0, Math.min(1, y / this.height));
      const targetHz = 40 + ratio * 35;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(targetHz + 30, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(targetHz, ctx.currentTime + 0.35);

      const lofiVolSetting = localStorage.getItem('aetherflow_lofi_vol');
      const masterVolumeMultiplier = lofiVolSetting !== null ? parseFloat(lofiVolSetting) : 0.5;
      const vol = 0.22 * masterVolumeMultiplier;

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.8);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 2.0);
    } catch (e) {}
  }

  playAbyssPadSound(y) {
    if (this.canvas && this.canvas.getAttribute('data-audio-muted') === 'true') return;
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
      
      const ctx = this.audioCtx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      const pentatonic = [196.00, 220.00, 261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];
      const idx = Math.floor((1 - Math.max(0, Math.min(1, y / this.height))) * (pentatonic.length - 1));
      const freq = pentatonic[idx];

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      const lofiVolSetting = localStorage.getItem('aetherflow_lofi_vol');
      const masterVolumeMultiplier = lofiVolSetting !== null ? parseFloat(lofiVolSetting) : 0.5;
      const vol = 0.08 * masterVolumeMultiplier;

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.5);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(250, ctx.currentTime + 1.2);
      filter.Q.setValueAtTime(1.5, ctx.currentTime);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 2.7);
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
