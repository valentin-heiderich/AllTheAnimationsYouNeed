import BaseAnimation from './BaseAnimation.js';

export default class TrochoidalWaveHarps extends BaseAnimation {
  constructor() {
    super();
    this.strings = [];
    this.mouse = { x: null, y: null, active: false };
    this.prevMouse = { x: null, y: null };
    this.bg = '#04090e'; // Midnight marine blue
  }

  setup() {
    this.strings = [];
    // Define 7 horizontal musical wave strings acting as wave peaks
    const count = 7;
    const spacing = this.height / (count + 1);

    for (let i = 0; i < count; i++) {
      const baseY = spacing * (i + 1.2);
      const points = [];
      const numPoints = 35; // node density for trochoidal solver
      const segmentWidth = this.width / (numPoints - 1);

      for (let j = 0; j < numPoints; j++) {
        points.push({
          x: j * segmentWidth,
          y: baseY,
          vy: 0,
          baseY: baseY,
          trochoidalOffsetX: 0,
          trochoidalOffsetY: 0
        });
      }

      this.strings.push({
        baseY: baseY,
        points: points,
        phase: Math.random() * Math.PI * 2,
        speed: 0.015 + i * 0.005,
        waveAmp: 18 + i * 4,
        tension: 0.06 + Math.random() * 0.03,
        dampening: 0.94,
        hue: 180 + i * 8 // smooth gradient from green-teal to navy
      });
    }
  }

  resize(width, height) {
    super.resize(width, height);
    this.setup();
  }

  draw(ctx, time) {
    // Sea liquid ink shading
    ctx.fillStyle = 'rgba(4, 9, 14, 0.16)';
    ctx.fillRect(0, 0, this.width, this.height);

    this.strings.forEach((str, strIndex) => {
      // 1. Solve Trochoidal wind displacement physics
      str.phase += str.speed;

      str.points.forEach((pt, pIndex) => {
        // Gerstner/Trochoidal wave offset equations
        const waveX = pIndex * 0.28 - str.phase;
        pt.trochoidalOffsetX = Math.sin(waveX) * str.waveAmp * 0.6;
        pt.trochoidalOffsetY = Math.cos(waveX) * str.waveAmp * 0.8;

        // Apply physical string spring restoring forces
        const acceleration = (pt.baseY - pt.y) * str.tension;
        pt.vy += acceleration;
        pt.vy *= str.dampening;
        pt.y += pt.vy;

        // Interaction coordinates
        const renderX = pt.x + pt.trochoidalOffsetX;
        const renderY = pt.y + pt.trochoidalOffsetY;

        // Mouse pluck sweep check
        if (this.mouse.active && this.mouse.x !== null && this.prevMouse.x !== null) {
          const minX = Math.min(this.prevMouse.x, this.mouse.x);
          const maxX = Math.max(this.prevMouse.x, this.mouse.x);

          if (renderX >= minX && renderX <= maxX) {
            // Check vertical intersection
            const mouseInterpY = this.prevMouse.y + (this.mouse.y - this.prevMouse.y) * ((renderX - this.prevMouse.x) / (this.mouse.x - this.prevMouse.x || 1));
            const dy = renderY - mouseInterpY;

            if (Math.abs(dy) < 32) {
              // Pluck! excite node velocity
              pt.vy = (this.mouse.y - this.prevMouse.y) * 0.5 + (dy > 0 ? 12 : -12);
              
              if (Math.random() < 0.05) {
                this.playPadSound(strIndex, Math.abs(pt.vy));
              }
            }
          }
        }
      });

      // 2. Draw curved Trochoidal waves
      ctx.beginPath();
      const firstPt = str.points[0];
      ctx.moveTo(firstPt.x + firstPt.trochoidalOffsetX, firstPt.y + firstPt.trochoidalOffsetY);

      for (let i = 1; i < str.points.length; i++) {
        const pt = str.points[i];
        ctx.lineTo(pt.x + pt.trochoidalOffsetX, pt.y + pt.trochoidalOffsetY);
      }

      ctx.strokeStyle = `hsla(${str.hue}, 70%, 55%, 0.38)`;
      ctx.lineWidth = 2.5 + strIndex * 0.5;
      ctx.lineCap = 'round';
      ctx.stroke();
    });

    // Save mouse cache
    if (this.mouse.active) {
      this.prevMouse.x = this.mouse.x;
      this.prevMouse.y = this.mouse.y;
    } else {
      this.prevMouse.x = null;
      this.prevMouse.y = null;
    }
  }

  destroy() {
    super.destroy();
    this.strings = [];
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
    this.prevMouse.x = null;
    this.prevMouse.y = null;
  }

  playPadSound(index, force) {
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
      const filter = ctx.createBiquadFilter();

      // Connections
      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Pentatonic warm strings/chords
      const pentatonic = [146.83, 164.81, 220.00, 261.63, 293.66, 329.63, 440.00];
      const baseFreq = pentatonic[index % pentatonic.length];

      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      
      // detuned secondary oscillator to synthesize thick lush string pads
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(baseFreq * 1.51, ctx.currentTime);

      const lofiVolSetting = localStorage.getItem('aetherflow_lofi_vol');
      const masterVolumeMultiplier = lofiVolSetting !== null ? parseFloat(lofiVolSetting) : 0.5;
      
      // Soft ambient string pad envelope
      const vol = Math.min(0.18, force * 0.015) * masterVolumeMultiplier;

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.12);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.4);

      // Cozy warm lowpass sweep
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(260, ctx.currentTime + 1.4);

      osc1.start(ctx.currentTime);
      osc2.start(ctx.currentTime);
      
      osc1.stop(ctx.currentTime + 2.5);
      osc2.stop(ctx.currentTime + 2.5);
    } catch (e) {}
  }

  static get title() {
    return 'Trochoidal Wave Harps';
  }

  static get description() {
    return 'Front-to-back trochoidal ocean waves shifting horizontally. Swiping your mouse across the waves plucks them like harp strings, synthesizing cozy, long-decaying string pad chords.';
  }

  static get vibe() {
    return 'Satisfying';
  }

  static get sourceCode() {
    return `class TrochoidalWaveHarps {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.strings = [];
    this.mouse = { x: null, y: null, active: false };
    this.prevMouse = { x: null, y: null };
    
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
    this.strings = [];
    const count = 7;
    const spacing = this.height / (count + 1);

    for (let i = 0; i < count; i++) {
      const baseY = spacing * (i + 1.2);
      const points = [];
      const numPoints = 35;
      const segmentWidth = this.width / (numPoints - 1);

      for (let j = 0; j < numPoints; j++) {
        points.push({
          x: j * segmentWidth,
          y: baseY,
          vy: 0,
          baseY: baseY,
          trochoidalOffsetX: 0,
          trochoidalOffsetY: 0
        });
      }

      this.strings.push({
        baseY: baseY,
        points: points,
        phase: Math.random() * Math.PI * 2,
        speed: 0.015 + i * 0.005,
        waveAmp: 18 + i * 4,
        tension: 0.06 + Math.random() * 0.03,
        dampening: 0.94,
        hue: 180 + i * 8
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
    this.ctx.fillStyle = 'rgba(4, 9, 14, 0.16)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.strings.forEach((str, strIndex) => {
      str.phase += str.speed;

      str.points.forEach((pt, pIndex) => {
        const waveX = pIndex * 0.28 - str.phase;
        pt.trochoidalOffsetX = Math.sin(waveX) * str.waveAmp * 0.6;
        pt.trochoidalOffsetY = Math.cos(waveX) * str.waveAmp * 0.8;

        const acceleration = (pt.baseY - pt.y) * str.tension;
        pt.vy += acceleration;
        pt.vy *= str.dampening;
        pt.y += pt.vy;

        const renderX = pt.x + pt.trochoidalOffsetX;
        const renderY = pt.y + pt.trochoidalOffsetY;

        if (this.mouse.active && this.mouse.x !== null && this.prevMouse.x !== null) {
          const minX = Math.min(this.prevMouse.x, this.mouse.x);
          const maxX = Math.max(this.prevMouse.x, this.mouse.x);

          if (renderX >= minX && renderX <= maxX) {
            const mouseInterpY = this.prevMouse.y + (this.mouse.y - this.prevMouse.y) * ((renderX - this.prevMouse.x) / (this.mouse.x - this.prevMouse.x || 1));
            const dy = renderY - mouseInterpY;

            if (Math.abs(dy) < 32) {
              pt.vy = (this.mouse.y - this.prevMouse.y) * 0.5 + (dy > 0 ? 12 : -12);
              if (Math.random() < 0.05) {
                this.playPadSound(strIndex, Math.abs(pt.vy));
              }
            }
          }
        }
      });

      this.ctx.beginPath();
      const firstPt = str.points[0];
      this.ctx.moveTo(firstPt.x + firstPt.trochoidalOffsetX, firstPt.y + firstPt.trochoidalOffsetY);

      for (let i = 1; i < str.points.length; i++) {
        const pt = str.points[i];
        this.ctx.lineTo(pt.x + pt.trochoidalOffsetX, pt.y + pt.trochoidalOffsetY);
      }

      this.ctx.strokeStyle = \`hsla(\${str.hue}, 70%, 55%, 0.38)\`;
      this.ctx.lineWidth = 2.5 + strIndex * 0.5;
      this.ctx.lineCap = 'round';
      this.ctx.stroke();
    });

    if (this.mouse.active) {
      this.prevMouse.x = this.mouse.x;
      this.prevMouse.y = this.mouse.y;
    } else {
      this.prevMouse.x = null;
      this.prevMouse.y = null;
    }

    requestAnimationFrame((t) => this.animate(t));
  }

  playPadSound(index, force) {
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
      const filter = ctx.createBiquadFilter();

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      const pentatonic = [146.83, 164.81, 220.00, 261.63, 293.66, 329.63, 440.00];
      const baseFreq = pentatonic[index % pentatonic.length];

      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(baseFreq * 1.51, ctx.currentTime);

      const lofiVolSetting = localStorage.getItem('aetherflow_lofi_vol');
      const masterVolumeMultiplier = lofiVolSetting !== null ? parseFloat(lofiVolSetting) : 0.5;
      const vol = Math.min(0.18, force * 0.015) * masterVolumeMultiplier;

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.12);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.4);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(260, ctx.currentTime + 1.4);

      osc1.start(ctx.currentTime);
      osc2.start(ctx.currentTime);
      
      osc1.stop(ctx.currentTime + 2.5);
      osc2.stop(ctx.currentTime + 2.5);
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
    this.prevMouse.x = null;
    this.prevMouse.y = null;
  }
}`;
  }
}
