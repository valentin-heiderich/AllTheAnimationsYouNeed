import BaseAnimation from './BaseAnimation.js';

export default class QuantumEntanglement extends BaseAnimation {
  constructor() {
    super();
    this.pairs = [];
    this.sparks = [];
    this.mouse = { x: null, y: null, active: false, radius: 120 };
    this.colors = {
      pink: '#FF007F', // Bright hot pink
      lime: '#39FF14', // Neon lime
      white: '#FFFFFF'
    };
  }

  setup() {
    this.pairs = [];
    this.sparks = [];
    
    // Scale count of quantum pairs with viewport
    const densityFactor = 30000;
    const pairCount = Math.min(
      45,
      Math.max(12, Math.floor((this.width * this.height) / densityFactor))
    );

    for (let i = 0; i < pairCount; i++) {
      const centerX = Math.random() * this.width;
      const centerY = Math.random() * this.height;
      const vx = (Math.random() - 0.5) * 0.8;
      const vy = (Math.random() - 0.5) * 0.8;
      const orbitRadius = Math.random() * 30 + 25;
      const orbitSpeed = (Math.random() * 0.03 + 0.015) * (Math.random() < 0.5 ? 1 : -1);
      
      this.pairs.push({
        x: centerX,
        y: centerY,
        vx, vy,
        orbitRadius,
        currentOrbitRadius: orbitRadius,
        orbitSpeed,
        angle: Math.random() * Math.PI * 2,
        integrity: 1.0, // Bond health: 1.0 (entangled) to 0.0 (broken)
        wobble: Math.random() * 100,
        phaseOffset: Math.random() * Math.PI * 2
      });
    }
  }

  resize(width, height) {
    super.resize(width, height);
    this.pairs.forEach(p => {
      if (p.x > width) p.x = Math.random() * width;
      if (p.y > height) p.y = Math.random() * height;
    });
  }

  draw(ctx, time) {
    // Premium quantum void background (extremely deep space purple/black)
    ctx.fillStyle = '#050308';
    ctx.fillRect(0, 0, this.width, this.height);

    // Update and draw sparks (emitted when bonds break)
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.x += s.vx;
      s.y += s.vy;
      s.vy += 0.03; // Light gravity drift
      s.life -= 0.02;
      if (s.life <= 0) {
        this.sparks.splice(i, 1);
        continue;
      }
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2);
      ctx.fillStyle = s.color;
      ctx.globalAlpha = s.life * 0.8;
      ctx.fill();
    }

    ctx.globalAlpha = 1.0;

    // Draw Quantum Pairs
    this.pairs.forEach((p, idx) => {
      // 1. Float and bounce barycenter
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > this.width) p.vx = -p.vx;
      if (p.y < 0 || p.y > this.height) p.vy = -p.vy;

      // Ensure pairs stay within bounds gently
      p.x = Math.max(0, Math.min(this.width, p.x));
      p.y = Math.max(0, Math.min(this.height, p.y));

      // 2. Rotate orbit
      p.angle += p.orbitSpeed;

      // 3. Compute particle positions
      const cosA = Math.cos(p.angle);
      const sinA = Math.sin(p.angle);
      
      const p1x = p.x + cosA * p.currentOrbitRadius;
      const p1y = p.y + sinA * p.currentOrbitRadius;
      const p2x = p.x - cosA * p.currentOrbitRadius;
      const p2y = p.y - sinA * p.currentOrbitRadius;

      // 4. Mouse proximity interaction
      let nearMouse = false;
      if (this.mouse.active && this.mouse.x !== null) {
        // Distance to barycenter
        const dCenter = Math.hypot(this.mouse.x - p.x, this.mouse.y - p.y);
        // Distance to particle 1 & 2
        const d1 = Math.hypot(this.mouse.x - p1x, this.mouse.y - p1y);
        const d2 = Math.hypot(this.mouse.x - p2x, this.mouse.y - p2y);
        
        if (dCenter < this.mouse.radius || d1 < this.mouse.radius || d2 < this.mouse.radius) {
          nearMouse = true;
        }
      }

      // Handle Integrity Transitions
      if (nearMouse) {
        if (p.integrity > 0.05) {
          // Emit sparks at break point
          if (Math.random() < 0.3) {
            const sparkCount = Math.floor(Math.random() * 3) + 2;
            const midX = (p1x + p2x) / 2;
            const midY = (p1y + p2y) / 2;
            for (let k = 0; k < sparkCount; k++) {
              this.sparks.push({
                x: midX + (Math.random() - 0.5) * 10,
                y: midY + (Math.random() - 0.5) * 10,
                vx: (Math.random() - 0.5) * 2.5,
                vy: (Math.random() - 0.5) * 2.5,
                size: Math.random() * 2 + 1,
                color: Math.random() < 0.5 ? this.colors.pink : this.colors.lime,
                life: 1.0
              });
            }
          }
        }
        p.integrity = Math.max(0, p.integrity - 0.08); // Decays fast
        p.currentOrbitRadius = p.currentOrbitRadius * 0.94 + (p.orbitRadius * 1.8) * 0.06; // Orbit expands when broken
      } else {
        p.integrity = Math.min(1.0, p.integrity + 0.02); // Recharges gradually
        p.currentOrbitRadius = p.currentOrbitRadius * 0.95 + p.orbitRadius * 0.05; // Orbit contracts to normal
      }

      // 5. Draw Energy Bridge (Entanglement bond)
      if (p.integrity > 0.01) {
        const dist = Math.hypot(p2x - p1x, p2y - p1y);
        const steps = 24;
        const amplitude = (1 - p.integrity) * 18 + Math.sin(time * 0.015 + p.phaseOffset) * 4;

        ctx.beginPath();
        ctx.moveTo(p1x, p1y);

        // Render vibrating sine wave bridge
        for (let s = 1; s <= steps; s++) {
          const t = s / steps;
          const lx = p1x + (p2x - p1x) * t;
          const ly = p1y + (p2y - p1y) * t;

          // Normal vector offset for wiggle wave
          const nx = -(p2y - p1y) / dist;
          const ny = (p2x - p1x) / dist;

          const wave = Math.sin(t * Math.PI * 4 - time * 0.02 + p.phaseOffset) * amplitude * p.integrity;
          ctx.lineTo(lx + nx * wave, ly + ny * wave);
        }

        const grad = ctx.createLinearGradient(p1x, p1y, p2x, p2y);
        grad.addColorStop(0, this.colors.pink);
        grad.addColorStop(0.5, this.colors.white);
        grad.addColorStop(1, this.colors.lime);

        ctx.strokeStyle = grad;
        ctx.lineWidth = p.integrity * 2.0;
        ctx.globalAlpha = p.integrity * 0.65;
        ctx.stroke();

        // Inner filament glow
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = p.integrity * 0.8;
        ctx.globalAlpha = p.integrity * 0.9;
        ctx.stroke();
      }

      // 6. Draw Entangled Orbital Particles
      // Particle 1: Hot Pink
      ctx.beginPath();
      ctx.arc(p1x, p1y, 7, 0, Math.PI * 2);
      ctx.fillStyle = this.colors.pink;
      ctx.globalAlpha = 0.35 + Math.sin(time * 0.01 + p.phaseOffset) * 0.15;
      ctx.shadowBlur = 15;
      ctx.shadowColor = this.colors.pink;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(p1x, p1y, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowBlur = 0;
      ctx.fill();

      // Particle 2: Neon Lime
      ctx.beginPath();
      ctx.arc(p2x, p2y, 7, 0, Math.PI * 2);
      ctx.fillStyle = this.colors.lime;
      ctx.globalAlpha = 0.35 + Math.cos(time * 0.01 + p.phaseOffset) * 0.15;
      ctx.shadowBlur = 15;
      ctx.shadowColor = this.colors.lime;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(p2x, p2y, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowBlur = 0;
      ctx.fill();

      // Draw faint center barycenter ring (only when bonded)
      if (p.integrity > 0.1) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.currentOrbitRadius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    });

    ctx.globalAlpha = 1.0;
    ctx.shadowBlur = 0; // Reset shadow configurations
  }

  destroy() {
    super.destroy();
    this.pairs = [];
    this.sparks = [];
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
    return 'Quantum Entanglement';
  }

  static get description() {
    return 'Linked pairs of orbital particles spin in harmonic lockstep connected by energetic wave bridges. Move your cursor to disrupt the local magnetic fields, snapping the quantum bonds and sending particles into unstable orbits.';
  }

  static get vibe() {
    return 'Quantum';
  }

  static get sourceCode() {
    return `class QuantumEntanglement {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.pairs = [];
    this.sparks = [];
    this.mouse = { x: null, y: null, active: false, radius: 120 };
    this.colors = {
      pink: '#FF007F',
      lime: '#39FF14',
      white: '#FFFFFF'
    };

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
    this.pairs = [];
    this.sparks = [];
    const pairCount = Math.min(45, Math.max(12, Math.floor((this.width * this.height) / 30000)));

    for (let i = 0; i < pairCount; i++) {
      const orbitRadius = Math.random() * 30 + 25;
      this.pairs.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        orbitRadius,
        currentOrbitRadius: orbitRadius,
        orbitSpeed: (Math.random() * 0.03 + 0.015) * (Math.random() < 0.5 ? 1 : -1),
        angle: Math.random() * Math.PI * 2,
        integrity: 1.0,
        wobble: Math.random() * 100,
        phaseOffset: Math.random() * Math.PI * 2
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
  }

  animate(time = 0) {
    this.ctx.fillStyle = '#050308';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Update and draw sparks
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.x += s.vx;
      s.y += s.vy;
      s.vy += 0.03;
      s.life -= 0.02;
      if (s.life <= 0) {
        this.sparks.splice(i, 1);
        continue;
      }
      this.ctx.beginPath();
      this.ctx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2);
      this.ctx.fillStyle = s.color;
      this.ctx.globalAlpha = s.life * 0.8;
      this.ctx.fill();
    }

    this.ctx.globalAlpha = 1.0;

    // Draw Quantum Pairs
    this.pairs.forEach((p, idx) => {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > this.width) p.vx = -p.vx;
      if (p.y < 0 || p.y > this.height) p.vy = -p.vy;

      p.x = Math.max(0, Math.min(this.width, p.x));
      p.y = Math.max(0, Math.min(this.height, p.y));

      p.angle += p.orbitSpeed;

      const cosA = Math.cos(p.angle);
      const sinA = Math.sin(p.angle);
      
      const p1x = p.x + cosA * p.currentOrbitRadius;
      const p1y = p.y + sinA * p.currentOrbitRadius;
      const p2x = p.x - cosA * p.currentOrbitRadius;
      const p2y = p.y - sinA * p.currentOrbitRadius;

      let nearMouse = false;
      if (this.mouse.active && this.mouse.x !== null) {
        const dCenter = Math.hypot(this.mouse.x - p.x, this.mouse.y - p.y);
        const d1 = Math.hypot(this.mouse.x - p1x, this.mouse.y - p1y);
        const d2 = Math.hypot(this.mouse.x - p2x, this.mouse.y - p2y);
        if (dCenter < this.mouse.radius || d1 < this.mouse.radius || d2 < this.mouse.radius) {
          nearMouse = true;
        }
      }

      if (nearMouse) {
        if (p.integrity > 0.05) {
          if (Math.random() < 0.3) {
            const sparkCount = Math.floor(Math.random() * 3) + 2;
            const midX = (p1x + p2x) / 2;
            const midY = (p1y + p2y) / 2;
            for (let k = 0; k < sparkCount; k++) {
              this.sparks.push({
                x: midX + (Math.random() - 0.5) * 10,
                y: midY + (Math.random() - 0.5) * 10,
                vx: (Math.random() - 0.5) * 2.5,
                vy: (Math.random() - 0.5) * 2.5,
                size: Math.random() * 2 + 1,
                color: Math.random() < 0.5 ? this.colors.pink : this.colors.lime,
                life: 1.0
              });
            }
          }
        }
        p.integrity = Math.max(0, p.integrity - 0.08);
        p.currentOrbitRadius = p.currentOrbitRadius * 0.94 + (p.orbitRadius * 1.8) * 0.06;
      } else {
        p.integrity = Math.min(1.0, p.integrity + 0.02);
        p.currentOrbitRadius = p.currentOrbitRadius * 0.95 + p.orbitRadius * 0.05;
      }

      if (p.integrity > 0.01) {
        const dist = Math.hypot(p2x - p1x, p2y - p1y);
        const steps = 24;
        const amplitude = (1 - p.integrity) * 18 + Math.sin(time * 0.015 + p.phaseOffset) * 4;

        this.ctx.beginPath();
        this.ctx.moveTo(p1x, p1y);

        for (let s = 1; s <= steps; s++) {
          const t = s / steps;
          const lx = p1x + (p2x - p1x) * t;
          const ly = p1y + (p2y - p1y) * t;
          const nx = -(p2y - p1y) / dist;
          const ny = (p2x - p1x) / dist;
          const wave = Math.sin(t * Math.PI * 4 - time * 0.02 + p.phaseOffset) * amplitude * p.integrity;
          this.ctx.lineTo(lx + nx * wave, ly + ny * wave);
        }

        const grad = this.ctx.createLinearGradient(p1x, p1y, p2x, p2y);
        grad.addColorStop(0, this.colors.pink);
        grad.addColorStop(0.5, this.colors.white);
        grad.addColorStop(1, this.colors.lime);

        this.ctx.strokeStyle = grad;
        this.ctx.lineWidth = p.integrity * 2.0;
        this.ctx.globalAlpha = p.integrity * 0.65;
        this.ctx.stroke();

        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = p.integrity * 0.8;
        this.ctx.globalAlpha = p.integrity * 0.9;
        this.ctx.stroke();
      }

      // Draw P1 (Pink)
      this.ctx.beginPath();
      this.ctx.arc(p1x, p1y, 7, 0, Math.PI * 2);
      this.ctx.fillStyle = this.colors.pink;
      this.ctx.globalAlpha = 0.35 + Math.sin(time * 0.01 + p.phaseOffset) * 0.15;
      this.ctx.shadowBlur = 15;
      this.ctx.shadowColor = this.colors.pink;
      this.ctx.fill();

      this.ctx.beginPath();
      this.ctx.arc(p1x, p1y, 3, 0, Math.PI * 2);
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.shadowBlur = 0;
      this.ctx.fill();

      // Draw P2 (Lime)
      this.ctx.beginPath();
      this.ctx.arc(p2x, p2y, 7, 0, Math.PI * 2);
      this.ctx.fillStyle = this.colors.lime;
      this.ctx.globalAlpha = 0.35 + Math.cos(time * 0.01 + p.phaseOffset) * 0.15;
      this.ctx.shadowBlur = 15;
      this.ctx.shadowColor = this.colors.lime;
      this.ctx.fill();

      this.ctx.beginPath();
      this.ctx.arc(p2x, p2y, 3, 0, Math.PI * 2);
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.shadowBlur = 0;
      this.ctx.fill();
    });

    this.ctx.globalAlpha = 1.0;
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
