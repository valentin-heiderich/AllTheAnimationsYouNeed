import BaseAnimation from './BaseAnimation.js';

export default class WindyGrassChimes extends BaseAnimation {
  constructor() {
    super();
    this.blades = [];
    this.mouse = { x: null, y: null, active: false, radius: 100 };
    this.bg = '#050708'; // Misty mountain night green-black background
    this.windPhase = 0;
    this.windSpeed = 0.003;
  }

  setup() {
    this.blades = [];
    // Spawn 140 grass blades distributed in 3 parallax depth layers
    const count = 140;
    for (let i = 0; i < count; i++) {
      const zDepth = Math.random(); // 0 (far) to 1 (near)
      const heightMultiplier = 0.22 + zDepth * 0.28; // taller blades in front
      
      this.blades.push({
        x: Math.random() * this.width,
        y: this.height + 15,
        length: this.height * heightMultiplier,
        thickness: 1.5 + zDepth * 3.5,
        z: zDepth,
        angleOffset: (Math.random() - 0.5) * 0.15,
        windSens: 0.8 + (1 - zDepth) * 1.2, // background waves react more
        color: `hsla(${75 + zDepth * 40}, ${30 + zDepth * 30}%, ${18 + zDepth * 26}%, 0.72)`,
        stiffness: 0.05 + zDepth * 0.08,
        sway: 0,
        brushed: false
      });
    }

    // Sort blades so far/back layers draw first
    this.blades.sort((a, b) => a.z - b.z);
  }

  resize(width, height) {
    super.resize(width, height);
    this.setup();
  }

  draw(ctx, time) {
    // Parallax night misty glow
    ctx.fillStyle = 'rgba(5, 7, 8, 0.14)';
    ctx.fillRect(0, 0, this.width, this.height);

    // Global wind wave formula
    this.windPhase += this.windSpeed;
    const globalWind = Math.sin(this.windPhase) * Math.cos(this.windPhase * 0.6) * 0.45 + 0.2;

    this.blades.forEach(blade => {
      // Blade target sway including wind and natural recovery
      const targetSway = globalWind * blade.windSens + blade.angleOffset;
      blade.sway += (targetSway - blade.sway) * blade.stiffness;

      // Tip coordinates calculation for mouse proximity check
      const swayX = Math.sin(blade.sway) * blade.length;
      const tipX = blade.x + swayX;
      const tipY = blade.y - Math.cos(blade.sway) * blade.length;

      // Mouse sweep check
      if (this.mouse.active && this.mouse.x !== null) {
        const dx = tipX - this.mouse.x;
        const dy = tipY - this.mouse.y;
        const dist = Math.hypot(dx, dy);

        if (dist < this.mouse.radius) {
          const force = (this.mouse.radius - dist) / this.mouse.radius;
          blade.sway += (dx / (dist || 1)) * force * 0.35; // push blade away from mouse
          
          if (dist < 40 && !blade.brushed) {
            blade.brushed = true;
            this.playChimeSound(tipY);
          }
        } else {
          blade.brushed = false;
        }
      } else {
        blade.brushed = false;
      }

      // Draw elegant organic curved grass blade
      const controlX = blade.x + Math.sin(blade.sway * 0.5) * (blade.length * 0.5);
      const controlY = blade.y - blade.length * 0.48;

      ctx.beginPath();
      ctx.moveTo(blade.x, blade.y);
      ctx.quadraticCurveTo(controlX, controlY, tipX, tipY);
      
      ctx.strokeStyle = blade.color;
      ctx.lineWidth = blade.thickness;
      ctx.lineCap = 'round';
      ctx.stroke();
    });
  }

  destroy() {
    super.destroy();
    this.blades = [];
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

  playChimeSound(y) {
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
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      // High-frequency crystal wind chimes scale
      const pentatonic = [880.00, 987.77, 1174.66, 1318.51, 1567.98, 1760.00, 1975.53, 2349.32];
      const scalePct = 1 - Math.max(0, Math.min(1, y / this.height));
      const noteIdx = Math.floor(scalePct * (pentatonic.length - 1));
      const baseFreq = pentatonic[noteIdx];

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      
      // detuned secondary harmonic osc to synthesize metallic inharmonic tinkle
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(baseFreq * 2.76, ctx.currentTime);

      const lofiVolSetting = localStorage.getItem('aetherflow_lofi_vol');
      const masterVolumeMultiplier = lofiVolSetting !== null ? parseFloat(lofiVolSetting) : 0.5;
      const vol = 0.07 * masterVolumeMultiplier;

      // Extremely quick decay envelope
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.002);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.85);

      osc1.start(ctx.currentTime);
      osc2.start(ctx.currentTime);
      
      osc1.stop(ctx.currentTime + 0.9);
      osc2.stop(ctx.currentTime + 0.9);
    } catch (err) {
      console.warn('Wind chime synthesis failed: ', err);
    }
  }

  static get title() {
    return 'Windy Grass Chimes';
  }

  static get description() {
    return 'Misty grass fields swaying gently in layers of parallax wind waves. Brushing grass tips with your cursor triggers high-pitched, sparkling metallic wind chimes synthesized with fast decays.';
  }

  static get vibe() {
    return 'Natural';
  }

  static get sourceCode() {
    return `class WindyGrassChimes {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.blades = [];
    this.mouse = { x: null, y: null, active: false, radius: 100 };
    this.windPhase = 0;
    this.windSpeed = 0.003;
    
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
    const count = 140;
    for (let i = 0; i < count; i++) {
      const zDepth = Math.random();
      const heightMultiplier = 0.22 + zDepth * 0.28;
      
      this.blades.push({
        x: Math.random() * this.width,
        y: this.height + 15,
        length: this.height * heightMultiplier,
        thickness: 1.5 + zDepth * 3.5,
        z: zDepth,
        angleOffset: (Math.random() - 0.5) * 0.15,
        windSens: 0.8 + (1 - zDepth) * 1.2,
        color: \`hsla(\${75 + zDepth * 40}, \${30 + zDepth * 30}%, \${18 + zDepth * 26}%, 0.72)\`,
        stiffness: 0.05 + zDepth * 0.08,
        sway: 0,
        brushed: false
      });
    }
    this.blades.sort((a, b) => a.z - b.z);
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
    this.ctx.fillStyle = 'rgba(5, 7, 8, 0.14)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.windPhase += this.windSpeed;
    const globalWind = Math.sin(this.windPhase) * Math.cos(this.windPhase * 0.6) * 0.45 + 0.2;

    this.blades.forEach(blade => {
      const targetSway = globalWind * blade.windSens + blade.angleOffset;
      blade.sway += (targetSway - blade.sway) * blade.stiffness;

      const swayX = Math.sin(blade.sway) * blade.length;
      const tipX = blade.x + swayX;
      const tipY = blade.y - Math.cos(blade.sway) * blade.length;

      if (this.mouse.active && this.mouse.x !== null) {
        const dx = tipX - this.mouse.x;
        const dy = tipY - this.mouse.y;
        const dist = Math.hypot(dx, dy);

        if (dist < this.mouse.radius) {
          const force = (this.mouse.radius - dist) / this.mouse.radius;
          blade.sway += (dx / (dist || 1)) * force * 0.35;
          
          if (dist < 40 && !blade.brushed) {
            blade.brushed = true;
            this.playChimeSound(tipY);
          }
        } else {
          blade.brushed = false;
        }
      } else {
        blade.brushed = false;
      }

      const controlX = blade.x + Math.sin(blade.sway * 0.5) * (blade.length * 0.5);
      const controlY = blade.y - blade.length * 0.48;

      this.ctx.beginPath();
      this.ctx.moveTo(blade.x, blade.y);
      this.ctx.quadraticCurveTo(controlX, controlY, tipX, tipY);
      this.ctx.strokeStyle = blade.color;
      this.ctx.lineWidth = blade.thickness;
      this.ctx.lineCap = 'round';
      this.ctx.stroke();
    });

    requestAnimationFrame((t) => this.animate(t));
  }

  playChimeSound(y) {
    if (this.canvas && this.canvas.getAttribute('data-audio-muted') === 'true') return;
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
      
      const ctx = this.audioCtx;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      const pentatonic = [880.00, 987.77, 1174.66, 1318.51, 1567.98, 1760.00, 1975.53, 2349.32];
      const scalePct = 1 - Math.max(0, Math.min(1, y / this.height));
      const noteIdx = Math.floor(scalePct * (pentatonic.length - 1));
      const baseFreq = pentatonic[noteIdx];

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(baseFreq * 2.76, ctx.currentTime);

      const lofiVolSetting = localStorage.getItem('aetherflow_lofi_vol');
      const masterVolumeMultiplier = lofiVolSetting !== null ? parseFloat(lofiVolSetting) : 0.5;
      const vol = 0.07 * masterVolumeMultiplier;

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.002);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.85);

      osc1.start(ctx.currentTime);
      osc2.start(ctx.currentTime);
      
      osc1.stop(ctx.currentTime + 0.9);
      osc2.stop(ctx.currentTime + 0.9);
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
