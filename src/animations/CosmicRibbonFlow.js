import BaseAnimation from './BaseAnimation.js';

export default class CosmicRibbonFlow extends BaseAnimation {
  constructor() {
    super();
    this.streams = [];
    this.mouse = { x: null, y: null, active: false, rx: 0, ry: 0 };
    this.hueBase = 0;
  }

  setup() {
    this.streams = [];
    const count = 4; // 4 primary ribbon bands

    for (let i = 0; i < count; i++) {
      this.streams.push({
        // Different harmonic frequencies for complex non-repeating curves
        freqX1: 0.0006 + i * 0.0001,
        freqY1: 0.0005 + i * 0.00015,
        freqX2: 0.0003 + i * 0.00008,
        freqY2: 0.0004 + i * 0.00012,
        
        // Phase offsets
        phaseX: i * (Math.PI / 2),
        phaseY: i * Math.PI,

        // Positions
        prevPoints: [], // Keep track of past points to draw clean lines
        maxHistory: 6,  // Multi-line bridge segmenting

        // Dynamic offsets
        hueOffset: i * 70,
        thickness: Math.random() * 1.5 + 1.0
      });
    }

    // Set canvas initial background
    this.ctx.fillStyle = '#080A10';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.mouse.rx = this.width / 2;
    this.mouse.ry = this.height / 2;
  }

  resize(width, height) {
    super.resize(width, height);
    
    // Clear history to prevent jumping segments across screen resize
    this.streams.forEach(s => s.prevPoints = []);
    
    this.ctx.fillStyle = '#080A10';
    this.ctx.fillRect(0, 0, width, height);
  }

  draw(ctx, time) {
    // 1. Draw semi-transparent background to create satisfying fading trails
    ctx.fillStyle = 'rgba(8, 10, 16, 0.04)';
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Track smooth cursor spring coordinates
    if (this.mouse.active && this.mouse.x !== null) {
      this.mouse.rx = this.mouse.rx * 0.95 + this.mouse.x * 0.05;
      this.mouse.ry = this.mouse.ry * 0.95 + this.mouse.y * 0.05;
    } else {
      // Neutral slow drift center
      this.mouse.rx = this.mouse.rx * 0.98 + (this.width / 2 + Math.sin(time * 0.0005) * (this.width * 0.15)) * 0.02;
      this.mouse.ry = this.mouse.ry * 0.98 + (this.height / 2 + Math.cos(time * 0.0004) * (this.height * 0.15)) * 0.02;
    }

    // 3. Render ribbons
    this.streams.forEach((s, index) => {
      // Primary parametric coordinates (double-sine harmonograph shape)
      const baseAmpX = this.width * 0.32;
      const baseAmpY = this.height * 0.32;

      let rx = this.width / 2 + 
               Math.sin(time * s.freqX1 + s.phaseX) * baseAmpX + 
               Math.cos(time * s.freqX2) * (baseAmpX * 0.4);
               
      let ry = this.height / 2 + 
               Math.cos(time * s.freqY1 + s.phaseY) * baseAmpY + 
               Math.sin(time * s.freqY2) * (baseAmpY * 0.4);

      // Mouse local gravitational warping
      const dx = this.mouse.rx - rx;
      const dy = this.mouse.ry - ry;
      const dist = Math.hypot(dx, dy);
      const warpRadius = Math.min(this.width, this.height) * 0.45;

      if (dist < warpRadius) {
        const force = Math.pow((warpRadius - dist) / warpRadius, 2); // Squared for smooth exponential warp
        rx += (dx / dist) * force * (dist * 0.55);
        ry += (dy / dist) * force * (dist * 0.55);
      }

      // Add to coordinate queue
      s.prevPoints.push({ x: rx, y: ry });
      if (s.prevPoints.length > s.maxHistory) {
        s.prevPoints.shift();
      }

      // Skip draw if not enough history
      if (s.prevPoints.length < 2) return;

      const pCurrent = s.prevPoints[s.prevPoints.length - 1];
      const pPrevious = s.prevPoints[s.prevPoints.length - 2];

      // Draw multi-filament ribbon structure (4 parallel wires for 3D band feel)
      const wireCount = 5;
      const spread = 22; // Filament band spacing
      const hue = (time * 0.012 + s.hueOffset) % 360;

      for (let w = 0; w < wireCount; w++) {
        // Parallel coordinate offset using sine offsets
        const offsetRatio = (w - (wireCount - 1) / 2) / wireCount;
        const offsetX = Math.sin(time * 0.002 + index) * spread * offsetRatio;
        const offsetY = Math.cos(time * 0.002 + index) * spread * offsetRatio;

        ctx.beginPath();
        ctx.moveTo(pPrevious.x + offsetX, pPrevious.y + offsetY);
        ctx.lineTo(pCurrent.x + offsetX, pCurrent.y + offsetY);

        // Opacity fading towards ribbon borders
        const opacity = (1 - Math.abs(offsetRatio) * 1.2) * 0.35;
        ctx.strokeStyle = `hsla(${hue}, 95%, 68%, ${opacity})`;
        ctx.lineWidth = s.thickness * (1.1 - Math.abs(offsetRatio) * 0.6);
        
        ctx.stroke();
      }
    });
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
    return 'Cosmic Ribbon Flow';
  }

  static get description() {
    return 'Elegant, glowing cosmic ribbon streams tracing mathematical harmonograph curves. A partial canvas decay clearing creates beautifully fading trails. Move your cursor to act as a gravity point, smoothly bending and warping the cosmic flows toward it.';
  }

  static get vibe() {
    return 'Satisfying';
  }

  static get sourceCode() {
    return `class CosmicRibbonFlow {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.streams = [];
    this.mouse = { x: null, y: null, active: false, rx: 0, ry: 0 };
    
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
    const count = 4;

    for (let i = 0; i < count; i++) {
      this.streams.push({
        freqX1: 0.0006 + i * 0.0001,
        freqY1: 0.0005 + i * 0.00015,
        freqX2: 0.0003 + i * 0.00008,
        freqY2: 0.0004 + i * 0.00012,
        phaseX: i * (Math.PI / 2),
        phaseY: i * Math.PI,
        prevPoints: [],
        maxHistory: 6,
        hueOffset: i * 70,
        thickness: Math.random() * 1.5 + 1.0
      });
    }

    this.ctx.fillStyle = '#080A10';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.mouse.rx = this.width / 2;
    this.mouse.ry = this.height / 2;
  }

  resize() {
    this.dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;

    this.canvas.width = rect.width * this.dpr;
    this.canvas.height = rect.height * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);

    this.streams.forEach(s => s.prevPoints = []);
    this.ctx.fillStyle = '#080A10';
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  animate(time = 0) {
    // Fading trails decay overlay
    this.ctx.fillStyle = 'rgba(8, 10, 16, 0.04)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Spring cursor coordination
    if (this.mouse.active && this.mouse.x !== null) {
      this.mouse.rx = this.mouse.rx * 0.95 + this.mouse.x * 0.05;
      this.mouse.ry = this.mouse.ry * 0.95 + this.mouse.y * 0.05;
    } else {
      this.mouse.rx = this.mouse.rx * 0.98 + (this.width / 2 + Math.sin(time * 0.0005) * (this.width * 0.15)) * 0.02;
      this.mouse.ry = this.mouse.ry * 0.98 + (this.height / 2 + Math.cos(time * 0.0004) * (this.height * 0.15)) * 0.02;
    }

    // Render ribbons
    this.streams.forEach((s, index) => {
      const baseAmpX = this.width * 0.32;
      const baseAmpY = this.height * 0.32;

      let rx = this.width / 2 + 
               Math.sin(time * s.freqX1 + s.phaseX) * baseAmpX + 
               Math.cos(time * s.freqX2) * (baseAmpX * 0.4);
               
      let ry = this.height / 2 + 
               Math.cos(time * s.freqY1 + s.phaseY) * baseAmpY + 
               Math.sin(time * s.freqY2) * (baseAmpY * 0.4);

      // Local gravitational cursor bend
      const dx = this.mouse.rx - rx;
      const dy = this.mouse.ry - ry;
      const dist = Math.hypot(dx, dy);
      const warpRadius = Math.min(this.width, this.height) * 0.45;

      if (dist < warpRadius) {
        const force = Math.pow((warpRadius - dist) / warpRadius, 2);
        rx += (dx / dist) * force * (dist * 0.55);
        ry += (dy / dist) * force * (dist * 0.55);
      }

      s.prevPoints.push({ x: rx, y: ry });
      if (s.prevPoints.length > s.maxHistory) {
        s.prevPoints.shift();
      }

      if (s.prevPoints.length < 2) return;

      const pCurrent = s.prevPoints[s.prevPoints.length - 1];
      const pPrevious = s.prevPoints[s.prevPoints.length - 2];

      const wireCount = 5;
      const spread = 22;
      const hue = (time * 0.012 + s.hueOffset) % 360;

      for (let w = 0; w < wireCount; w++) {
        const offsetRatio = (w - (wireCount - 1) / 2) / wireCount;
        const offsetX = Math.sin(time * 0.002 + index) * spread * offsetRatio;
        const offsetY = Math.cos(time * 0.002 + index) * spread * offsetRatio;

        this.ctx.beginPath();
        this.ctx.moveTo(pPrevious.x + offsetX, pPrevious.y + offsetY);
        this.ctx.lineTo(pCurrent.x + offsetX, pCurrent.y + offsetY);

        const opacity = (1 - Math.abs(offsetRatio) * 1.2) * 0.35;
        this.ctx.strokeStyle = \`hsla(\${hue}, 95%, 68%, \${opacity})\`;
        this.ctx.lineWidth = s.thickness * (1.1 - Math.abs(offsetRatio) * 0.6);
        this.ctx.stroke();
      }
    });

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
