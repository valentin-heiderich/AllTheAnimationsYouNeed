import BaseAnimation from './BaseAnimation.js';

export default class AbstractStringSymphony extends BaseAnimation {
  constructor() {
    super();
    this.strings = [];
    this.mouse = { x: null, y: null, active: false };
    this.prevMouse = { x: null, y: null };
    this.bg = '#080916'; // Deep space digital indigo background
  }

  setup() {
    this.strings = [];
    const count = 12; // 12 elegant musical strings
    const spacing = this.height / (count + 1);

    for (let i = 0; i < count; i++) {
      const restingY = spacing * (i + 1);
      const points = [];
      const numPoints = 26; // Node resolution for physical wave simulation
      const segmentWidth = this.width / (numPoints - 1);

      for (let j = 0; j < numPoints; j++) {
        points.push({
          x: j * segmentWidth,
          y: restingY,
          vy: 0,
          baseY: restingY
        });
      }

      this.strings.push({
        restingY: restingY,
        points: points,
        phase: Math.random() * Math.PI * 2,
        tension: 0.08 + Math.random() * 0.04, // Spring tension
        dampening: 0.94, // Velocity decay
        pluckTimer: 0,
        freq: 0.0003 + i * 0.00005,
        thickness: 1.0 + (i % 3) * 0.5 // Varied wire gauge
      });
    }

    this.prevMouse.x = null;
    this.prevMouse.y = null;
  }

  resize(width, height) {
    super.resize(width, height);
    this.setup(); // Re-initialize node coordinates to fit new aspect ratios perfectly
  }

  draw(ctx, time) {
    // 1. Digital deep indigo canvas base
    ctx.fillStyle = this.bg;
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Ambient background spotlight
    const ambient = ctx.createRadialGradient(
      this.width / 2, this.height / 2, 50,
      this.width / 2, this.height / 2, this.width * 0.7
    );
    ambient.addColorStop(0, 'rgba(79, 70, 229, 0.1)'); // Indigo core
    ambient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = ambient;
    ctx.fillRect(0, 0, this.width, this.height);

    const mouseActive = this.mouse.active && this.mouse.x !== null && this.mouse.y !== null;
    const prevMouseActive = this.prevMouse.x !== null && this.prevMouse.y !== null;

    // 3. Update & Render Strings
    this.strings.forEach((s, idx) => {
      // Harmonic base idle sway - strings whisper gently when not touched
      const idleForce = Math.sin(time * s.freq + s.phase) * 1.5;

      // Check if mouse crossed the resting string plane to trigger a PHYSICAL PLUCK
      let pluckedIndex = -1;
      let pluckForce = 0;

      if (mouseActive && prevMouseActive) {
        const yMin = Math.min(this.prevMouse.y, this.mouse.y);
        const yMax = Math.max(this.prevMouse.y, this.mouse.y);

        if (s.restingY >= yMin - 5 && s.restingY <= yMax + 5) {
          // Find closest horizontal node
          const ratio = this.mouse.x / this.width;
          pluckedIndex = Math.floor(ratio * (s.points.length - 1));
          pluckedIndex = Math.max(1, Math.min(s.points.length - 2, pluckedIndex));
          
          // Speed of mouse swipe dictates plucking amplitude
          const dy = this.mouse.y - this.prevMouse.y;
          pluckForce = dy * 1.8;
          if (Math.abs(pluckForce) < 3) {
            pluckForce = 8 * Math.sign(dy || 1); // Minimum snap threshold
          }

          // Trigger physical pluck sound synthesis
          this.playPluckSound(idx, pluckForce);
        }
      }

      // First pass: Physics update for all nodes
      for (let j = 0; j < s.points.length; j++) {
        const p = s.points[j];
        
        // Static boundary pins: Ends of strings are anchored to screen edges
        if (j === 0 || j === s.points.length - 1) {
          p.y = p.baseY;
          continue;
        }

        // Apply string harmonic spring restoring force back to rest line
        const springForce = (p.baseY - p.y) * s.tension;
        p.vy += springForce;

        // Apply mouse pre-tension hovering gravity
        if (mouseActive) {
          const dx = this.mouse.x - p.x;
          const dy = this.mouse.y - p.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 100) {
            const pullForce = (100 - dist) / 100;
            // Pull nodes gently toward cursor, building tension before release
            p.vy += (this.mouse.y - p.y) * pullForce * 0.05;
          }
        }

        // Apply physical plucking impulse
        if (j === pluckedIndex && Math.abs(pluckForce) > 0.01) {
          p.vy += pluckForce;
          s.pluckTimer = 30; // Flash glow on pluck
        }

        // Dampen velocity to decay waves realistically over time
        p.vy *= s.dampening;
        
        // Idle gentle drift addition
        p.y += p.vy + idleForce * (1 - Math.abs(j - s.points.length/2) / (s.points.length/2));
      }

      // Second pass: Wave propagation (coupling neighbors via tension tension-differential)
      // Done multiple times per frame for ultra-high-fidelity propagation
      for (let iter = 0; iter < 4; iter++) {
        for (let j = 1; j < s.points.length - 1; j++) {
          const prev = s.points[j - 1];
          const curr = s.points[j];
          const next = s.points[j + 1];

          // Pull neighbors towards each other
          const leftDiff = prev.y - curr.y;
          const rightDiff = next.y - curr.y;

          curr.vy += (leftDiff + rightDiff) * 0.08;
        }
      }

      // Draw string shadow/glow underlay (thick soft blur glow)
      ctx.beginPath();
      ctx.moveTo(s.points[0].x, s.points[0].y);
      for (let j = 1; j < s.points.length - 2; j++) {
        const xc = (s.points[j].x + s.points[j + 1].x) / 2;
        const yc = (s.points[j].y + s.points[j + 1].y) / 2;
        ctx.quadraticCurveTo(s.points[j].x, s.points[j].y, xc, yc);
      }
      ctx.quadraticCurveTo(
        s.points[s.points.length - 2].x, s.points[s.points.length - 2].y,
        s.points[s.points.length - 1].x, s.points[s.points.length - 1].y
      );

      // Glowing aura: blue/indigo color shifting
      const glowOpacity = 0.12 + (s.pluckTimer > 0 ? (s.pluckTimer / 30) * 0.45 : 0);
      ctx.strokeStyle = `hsla(230, 85%, 60%, ${glowOpacity})`;
      ctx.lineWidth = s.thickness * 4.5;
      ctx.stroke();

      // Draw primary crisp string foreground
      const grad = ctx.createLinearGradient(0, s.restingY, this.width, s.restingY);
      grad.addColorStop(0, '#4F46E5'); // Indigo
      grad.addColorStop(0.35, '#818CF8'); // Light Indigo
      grad.addColorStop(0.5, '#FFFFFF'); // Clean White
      grad.addColorStop(0.65, '#818CF8');
      grad.addColorStop(1, '#4F46E5');

      ctx.strokeStyle = grad;
      ctx.lineWidth = s.thickness * (s.pluckTimer > 0 ? 1.5 : 1.0);
      ctx.stroke();

      if (s.pluckTimer > 0) s.pluckTimer--;
    });

    // 4. Save mouse path coordinates
    if (mouseActive) {
      this.prevMouse.x = this.mouse.x;
      this.prevMouse.y = this.mouse.y;
    } else {
      this.prevMouse.x = null;
      this.prevMouse.y = null;
    }
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

  playPluckSound(index, force) {
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
      
      const pentatonic = [130.81, 155.56, 174.61, 196.00, 233.08, 261.63, 311.13, 349.23, 392.00, 466.16, 523.25, 622.25];
      const freqIndex = pentatonic.length - 1 - (index % pentatonic.length);
      const frequency = pentatonic[freqIndex];
      
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      
      const volume = Math.min(0.22, Math.abs(force) * 0.01);
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.006);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);
      
      osc.type = 'triangle';
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 1.25);
    } catch (err) {
      console.warn('Web Audio synthesis failed: ', err);
    }
  }

  destroy() {
    super.destroy();
    this.strings = [];
    if (this.audioCtx) {
      this.audioCtx.close();
      this.audioCtx = null;
    }
  }

  static get title() {
    return 'Abstract String Symphony';
  }

  static get description() {
    return 'Parallel interweaving Bezier chords behaving like physical string instruments. Moving the cursor directly plucks the strings, triggering real-time spring wave propagation that vibrates outwards and snaps back satisfyingly.';
  }

  static get vibe() {
    return 'Satisfying';
  }

  static get sourceCode() {
    return `class AbstractStringSymphony {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.strings = [];
    this.mouse = { x: null, y: null, active: false };
    this.prevMouse = { x: null, y: null };
    this.bg = '#080916';

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
    const count = 12;
    const spacing = this.height / (count + 1);

    for (let i = 0; i < count; i++) {
      const restingY = spacing * (i + 1);
      const points = [];
      const numPoints = 26;
      const segmentWidth = this.width / (numPoints - 1);

      for (let j = 0; j < numPoints; j++) {
        points.push({
          x: j * segmentWidth,
          y: restingY,
          vy: 0,
          baseY: restingY
        });
      }

      this.strings.push({
        restingY: restingY,
        points: points,
        phase: Math.random() * Math.PI * 2,
        tension: 0.08 + Math.random() * 0.04,
        dampening: 0.94,
        pluckTimer: 0,
        freq: 0.0003 + i * 0.00005,
        thickness: 1.0 + (i % 3) * 0.5
      });
    }

    this.prevMouse.x = null;
    this.prevMouse.y = null;
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
    this.ctx.fillStyle = this.bg;
    this.ctx.fillRect(0, 0, this.width, this.height);

    const ambient = this.ctx.createRadialGradient(
      this.width / 2, this.height / 2, 50,
      this.width / 2, this.height / 2, this.width * 0.7
    );
    ambient.addColorStop(0, 'rgba(79, 70, 229, 0.1)');
    ambient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    this.ctx.fillStyle = ambient;
    this.ctx.fillRect(0, 0, this.width, this.height);

    const mouseActive = this.mouse.active && this.mouse.x !== null && this.mouse.y !== null;
    const prevMouseActive = this.prevMouse.x !== null && this.prevMouse.y !== null;

    this.strings.forEach((s, idx) => {
      const idleForce = Math.sin(time * s.freq + s.phase) * 1.5;
      let pluckedIndex = -1;
      let pluckForce = 0;

      if (mouseActive && prevMouseActive) {
        const yMin = Math.min(this.prevMouse.y, this.mouse.y);
        const yMax = Math.max(this.prevMouse.y, this.mouse.y);

        if (s.restingY >= yMin - 5 && s.restingY <= yMax + 5) {
          const ratio = this.mouse.x / this.width;
          pluckedIndex = Math.floor(ratio * (s.points.length - 1));
          pluckedIndex = Math.max(1, Math.min(s.points.length - 2, pluckedIndex));
          
          const dy = this.mouse.y - this.prevMouse.y;
          pluckForce = dy * 1.8;
          if (Math.abs(pluckForce) < 3) {
            pluckForce = 8 * Math.sign(dy || 1);
          }

          this.playPluckSound(idx, pluckForce);
        }
      }

      for (let j = 0; j < s.points.length; j++) {
        const p = s.points[j];
        if (j === 0 || j === s.points.length - 1) {
          p.y = p.baseY;
          continue;
        }

        const springForce = (p.baseY - p.y) * s.tension;
        p.vy += springForce;

        if (mouseActive) {
          const dx = this.mouse.x - p.x;
          const dy = this.mouse.y - p.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 100) {
            const pullForce = (100 - dist) / 100;
            p.vy += (this.mouse.y - p.y) * pullForce * 0.05;
          }
        }

        if (j === pluckedIndex && Math.abs(pluckForce) > 0.01) {
          p.vy += pluckForce;
          s.pluckTimer = 30;
        }

        p.vy *= s.dampening;
        p.y += p.vy + idleForce * (1 - Math.abs(j - s.points.length/2) / (s.points.length/2));
      }

      for (let iter = 0; iter < 4; iter++) {
        for (let j = 1; j < s.points.length - 1; j++) {
          const prev = s.points[j - 1];
          const curr = s.points[j];
          const next = s.points[j + 1];

          const leftDiff = prev.y - curr.y;
          const rightDiff = next.y - curr.y;

          curr.vy += (leftDiff + rightDiff) * 0.08;
        }
      }

      this.ctx.beginPath();
      this.ctx.moveTo(s.points[0].x, s.points[0].y);
      for (let j = 1; j < s.points.length - 2; j++) {
        const xc = (s.points[j].x + s.points[j + 1].x) / 2;
        const yc = (s.points[j].y + s.points[j + 1].y) / 2;
        this.ctx.quadraticCurveTo(s.points[j].x, s.points[j].y, xc, yc);
      }
      this.ctx.quadraticCurveTo(
        s.points[s.points.length - 2].x, s.points[s.points.length - 2].y,
        s.points[s.points.length - 1].x, s.points[s.points.length - 1].y
      );

      const glowOpacity = 0.12 + (s.pluckTimer > 0 ? (s.pluckTimer / 30) * 0.45 : 0);
      this.ctx.strokeStyle = \`hsla(230, 85%, 60%, \${glowOpacity})\`;
      this.ctx.lineWidth = s.thickness * 4.5;
      this.ctx.stroke();

      const grad = this.ctx.createLinearGradient(0, s.restingY, this.width, s.restingY);
      grad.addColorStop(0, '#4F46E5');
      grad.addColorStop(0.35, '#818CF8');
      grad.addColorStop(0.5, '#FFFFFF');
      grad.addColorStop(0.65, '#818CF8');
      grad.addColorStop(1, '#4F46E5');

      this.ctx.strokeStyle = grad;
      this.ctx.lineWidth = s.thickness * (s.pluckTimer > 0 ? 1.5 : 1.0);
      this.ctx.stroke();

      if (s.pluckTimer > 0) s.pluckTimer--;
    });

    if (mouseActive) {
      this.prevMouse.x = this.mouse.x;
      this.prevMouse.y = this.mouse.y;
    } else {
      this.prevMouse.x = null;
      this.prevMouse.y = null;
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
    this.prevMouse.x = null;
    this.prevMouse.y = null;
  }

  playPluckSound(index, force) {
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
      
      const pentatonic = [130.81, 155.56, 174.61, 196.00, 233.08, 261.63, 311.13, 349.23, 392.00, 466.16, 523.25, 622.25];
      const freqIndex = pentatonic.length - 1 - (index % pentatonic.length);
      const frequency = pentatonic[freqIndex];
      
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      
      const volume = Math.min(0.22, Math.abs(force) * 0.01);
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.006);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);
      
      osc.type = 'triangle';
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 1.25);
    } catch (err) {
      console.warn('Web Audio synthesis failed: ', err);
    }
  }
}`;
  }
}
