import BaseAnimation from './BaseAnimation.js';

export default class AcousticMyceliumNetwork extends BaseAnimation {
  constructor() {
    super();
    this.nodes = [];
    this.tips = [];
    this.pulses = [];
    this.mouse = { x: null, y: null, active: false, radius: 100 };
    this.bg = '#060a08'; // Dark mossy soil background
    this.maxNodes = 280;
    this.growTimer = 0;
  }

  setup() {
    this.nodes = [];
    this.tips = [];
    this.pulses = [];
    
    // Create initial mycelial spores/roots
    const rootCount = 3 + Math.floor(this.width / 400);
    for (let i = 0; i < rootCount; i++) {
      const rootX = (this.width / (rootCount + 1)) * (i + 1);
      const rootY = this.height * 0.5 + (Math.random() - 0.5) * 100;
      
      const rootNode = {
        x: rootX,
        y: rootY,
        parent: null,
        children: [],
        pulseCharge: 0,
        age: 0,
        depth: 0,
        active: true
      };
      
      this.nodes.push(rootNode);
      this.tips.push(rootNode);
    }
  }

  resize(width, height) {
    super.resize(width, height);
    this.setup();
  }

  draw(ctx, time) {
    // Fade background to create organic trail glow
    ctx.fillStyle = 'rgba(6, 10, 8, 0.08)';
    ctx.fillRect(0, 0, this.width, this.height);

    this.growTimer++;
    if (this.growTimer % 8 === 0 && this.nodes.length < this.maxNodes) {
      this.growNetwork();
    }

    // Update and draw branches
    ctx.strokeStyle = 'rgba(145, 185, 155, 0.22)';
    ctx.lineWidth = 1.15;
    ctx.lineCap = 'round';
    
    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i];
      if (node.parent) {
        ctx.beginPath();
        ctx.moveTo(node.parent.x, node.parent.y);
        ctx.lineTo(node.x, node.y);
        ctx.stroke();
      }
      
      // Draw organic node hubs
      if (node.pulseCharge > 0.1) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, 2 + node.pulseCharge * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180, 255, 200, ${node.pulseCharge * 0.8})`;
        ctx.fill();
        node.pulseCharge *= 0.95; // decay visual charge
      }
    }

    // Process propagating pulses
    ctx.lineWidth = 2.2;
    for (let i = this.pulses.length - 1; i >= 0; i--) {
      const p = this.pulses[i];
      p.progress += 0.08; // pulse speed

      if (p.progress >= 1.0) {
        // Arrived at target node
        p.target.pulseCharge = 1.0;
        this.playMarimbaSound(p.target.y);

        // Propagate to target's children
        if (p.target.children.length > 0 && Math.random() < 0.9) {
          p.target.children.forEach(child => {
            this.pulses.push({
              source: p.target,
              target: child,
              progress: 0
            });
          });
        }
        
        this.pulses.splice(i, 1);
        continue;
      }

      // Draw active traveling bio-electric spark
      const currX = p.source.x + (p.target.x - p.source.x) * p.progress;
      const currY = p.source.y + (p.target.y - p.source.y) * p.progress;

      ctx.beginPath();
      ctx.arc(currX, currY, 1.8, 0, Math.PI * 2);
      ctx.fillStyle = '#9cf5b9';
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#80e2a3';
      ctx.fill();
      ctx.shadowBlur = 0; // reset glow
    }

    // Mouse excitation check
    if (this.mouse.active && this.mouse.x !== null && Math.random() < 0.05) {
      // Find closest node to mouse
      let closestNode = null;
      let minDist = 999999;
      
      this.nodes.forEach(node => {
        const dx = node.x - this.mouse.x;
        const dy = node.y - this.mouse.y;
        const d = Math.hypot(dx, dy);
        if (d < minDist) {
          minDist = d;
          closestNode = node;
        }
      });

      if (closestNode && minDist < this.mouse.radius && closestNode.children.length > 0) {
        closestNode.pulseCharge = 1.0;
        closestNode.children.forEach(child => {
          // Trigger propagating spark
          this.pulses.push({
            source: closestNode,
            target: child,
            progress: 0
          });
        });
      }
    }
  }

  growNetwork() {
    if (this.tips.length === 0) return;
    
    // Choose a random growth tip
    const tipIndex = Math.floor(Math.random() * this.tips.length);
    const parentNode = this.tips[tipIndex];

    if (parentNode.depth > 12) {
      this.tips.splice(tipIndex, 1);
      return;
    }

    // Branch angle
    let angle = Math.random() * Math.PI * 2;
    if (parentNode.parent) {
      const parentAngle = Math.atan2(parentNode.y - parentNode.parent.y, parentNode.x - parentNode.parent.x);
      angle = parentAngle + (Math.random() - 0.5) * 1.5; // steer forward with sway
    }

    const length = 18 + Math.random() * 15;
    const newX = parentNode.x + Math.cos(angle) * length;
    const newY = parentNode.y + Math.sin(angle) * length;

    // Contact inhibition check: Avoid growing near other filaments
    if (newX < 0 || newX > this.width || newY < 0 || newY > this.height) {
      return;
    }

    let isTooClose = false;
    for (let i = 0; i < this.nodes.length; i++) {
      const other = this.nodes[i];
      if (other === parentNode || other === parentNode.parent) continue;
      if (Math.hypot(other.x - newX, other.y - newY) < 18) {
        isTooClose = true;
        break;
      }
    }

    if (!isTooClose) {
      const childNode = {
        x: newX,
        y: newY,
        parent: parentNode,
        children: [],
        pulseCharge: 0,
        age: 0,
        depth: parentNode.depth + 1,
        active: true
      };

      parentNode.children.push(childNode);
      this.nodes.push(childNode);

      // Branching factor: replace or add tip
      if (Math.random() < 0.38) {
        this.tips.push(childNode); // bifurcate
      } else {
        this.tips[tipIndex] = childNode; // replace
      }
    } else {
      // Tip blocked, stop growing here
      this.tips.splice(tipIndex, 1);
    }
  }

  destroy() {
    super.destroy();
    this.nodes = [];
    this.tips = [];
    this.pulses = [];
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

  playMarimbaSound(y) {
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
      const biquad = ctx.createBiquadFilter();

      // Connections
      osc.connect(biquad);
      biquad.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Pitch calculation (higher nodes = higher pentatonic pitch)
      const pentatonic = [130.81, 146.83, 164.81, 196.00, 220.00, 261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00];
      const scalePct = 1 - Math.max(0, Math.min(1, y / this.height));
      const noteIdx = Math.floor(scalePct * (pentatonic.length - 1));
      const freq = pentatonic[noteIdx];

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      // Wooden marimba pluck sound envelope
      const lofiVolSetting = localStorage.getItem('aetherflow_lofi_vol');
      const masterVolumeMultiplier = lofiVolSetting !== null ? parseFloat(lofiVolSetting) : 0.5;
      const vol = 0.16 * masterVolumeMultiplier;

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.004);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);

      // Bandpass filter to create resonant wooden timber
      biquad.type = 'bandpass';
      biquad.frequency.setValueAtTime(freq * 1.5, ctx.currentTime);
      biquad.Q.setValueAtTime(4.0, ctx.currentTime);
      biquad.frequency.exponentialRampToValueAtTime(freq, ctx.currentTime + 0.3);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch (err) {
      console.warn('Marimba synthesis failed: ', err);
    }
  }

  static get title() {
    return 'Acoustic Mycelium Network';
  }

  static get description() {
    return 'A self-avoiding mycelium root structure creeping organically. Moving your mouse excites node clusters, sending green electric waves that synthesize hollow wooden marimba plucks at varying heights.';
  }

  static get vibe() {
    return 'Biological';
  }

  static get sourceCode() {
    return `class AcousticMyceliumNetwork {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.nodes = [];
    this.tips = [];
    this.pulses = [];
    this.mouse = { x: null, y: null, active: false, radius: 100 };
    this.maxNodes = 280;
    this.growTimer = 0;
    
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
    this.nodes = [];
    this.tips = [];
    this.pulses = [];
    
    const rootCount = 4;
    for (let i = 0; i < rootCount; i++) {
      const rootX = (this.width / (rootCount + 1)) * (i + 1);
      const rootY = this.height * 0.5 + (Math.random() - 0.5) * 100;
      
      const rootNode = {
        x: rootX,
        y: rootY,
        parent: null,
        children: [],
        pulseCharge: 0,
        age: 0,
        depth: 0,
        active: true
      };
      
      this.nodes.push(rootNode);
      this.tips.push(rootNode);
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

  animate() {
    this.ctx.fillStyle = 'rgba(6, 10, 8, 0.08)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.growTimer++;
    if (this.growTimer % 8 === 0 && this.nodes.length < this.maxNodes) {
      this.growNetwork();
    }

    this.ctx.strokeStyle = 'rgba(145, 185, 155, 0.22)';
    this.ctx.lineWidth = 1.15;
    this.ctx.lineCap = 'round';
    
    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i];
      if (node.parent) {
        this.ctx.beginPath();
        this.ctx.moveTo(node.parent.x, node.parent.y);
        this.ctx.lineTo(node.x, node.y);
        this.ctx.stroke();
      }
      
      if (node.pulseCharge > 0.1) {
        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, 2 + node.pulseCharge * 2.5, 0, Math.PI * 2);
        this.ctx.fillStyle = \`rgba(180, 255, 200, \${node.pulseCharge * 0.8})\`;
        this.ctx.fill();
        node.pulseCharge *= 0.95;
      }
    }

    this.ctx.lineWidth = 2.2;
    for (let i = this.pulses.length - 1; i >= 0; i--) {
      const p = this.pulses[i];
      p.progress += 0.08;

      if (p.progress >= 1.0) {
        p.target.pulseCharge = 1.0;
        this.playMarimbaSound(p.target.y);

        if (p.target.children.length > 0 && Math.random() < 0.9) {
          p.target.children.forEach(child => {
            this.pulses.push({
              source: p.target,
              target: child,
              progress: 0
            });
          });
        }
        
        this.pulses.splice(i, 1);
        continue;
      }

      const currX = p.source.x + (p.target.x - p.source.x) * p.progress;
      const currY = p.source.y + (p.target.y - p.source.y) * p.progress;

      this.ctx.beginPath();
      this.ctx.arc(currX, currY, 1.8, 0, Math.PI * 2);
      this.ctx.fillStyle = '#9cf5b9';
      this.ctx.fill();
    }

    if (this.mouse.active && this.mouse.x !== null && Math.random() < 0.05) {
      let closestNode = null;
      let minDist = 999999;
      
      this.nodes.forEach(node => {
        const dx = node.x - this.mouse.x;
        const dy = node.y - this.mouse.y;
        const d = Math.hypot(dx, dy);
        if (d < minDist) {
          minDist = d;
          closestNode = node;
        }
      });

      if (closestNode && minDist < this.mouse.radius && closestNode.children.length > 0) {
        closestNode.pulseCharge = 1.0;
        closestNode.children.forEach(child => {
          this.pulses.push({
            source: closestNode,
            target: child,
            progress: 0
          });
        });
      }
    }

    requestAnimationFrame(() => this.animate());
  }

  growNetwork() {
    if (this.tips.length === 0) return;
    
    const tipIndex = Math.floor(Math.random() * this.tips.length);
    const parentNode = this.tips[tipIndex];

    if (parentNode.depth > 12) {
      this.tips.splice(tipIndex, 1);
      return;
    }

    let angle = Math.random() * Math.PI * 2;
    if (parentNode.parent) {
      const parentAngle = Math.atan2(parentNode.y - parentNode.parent.y, parentNode.x - parentNode.parent.x);
      angle = parentAngle + (Math.random() - 0.5) * 1.5;
    }

    const length = 18 + Math.random() * 15;
    const newX = parentNode.x + Math.cos(angle) * length;
    const newY = parentNode.y + Math.sin(angle) * length;

    if (newX < 0 || newX > this.width || newY < 0 || newY > this.height) {
      return;
    }

    let isTooClose = false;
    for (let i = 0; i < this.nodes.length; i++) {
      const other = this.nodes[i];
      if (other === parentNode || other === parentNode.parent) continue;
      if (Math.hypot(other.x - newX, other.y - newY) < 18) {
        isTooClose = true;
        break;
      }
    }

    if (!isTooClose) {
      const childNode = {
        x: newX,
        y: newY,
        parent: parentNode,
        children: [],
        pulseCharge: 0,
        age: 0,
        depth: parentNode.depth + 1,
        active: true
      };

      parentNode.children.push(childNode);
      this.nodes.push(childNode);

      if (Math.random() < 0.38) {
        this.tips.push(childNode);
      } else {
        this.tips[tipIndex] = childNode;
      }
    } else {
      this.tips.splice(tipIndex, 1);
    }
  }

  playMarimbaSound(y) {
    if (this.canvas && this.canvas.getAttribute('data-audio-muted') === 'true') return;
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
      
      const ctx = this.audioCtx;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const biquad = ctx.createBiquadFilter();

      osc.connect(biquad);
      biquad.connect(gainNode);
      gainNode.connect(ctx.destination);

      const pentatonic = [130.81, 146.83, 164.81, 196.00, 220.00, 261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00];
      const scalePct = 1 - Math.max(0, Math.min(1, y / this.height));
      const noteIdx = Math.floor(scalePct * (pentatonic.length - 1));
      const freq = pentatonic[noteIdx];

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      const lofiVolSetting = localStorage.getItem('aetherflow_lofi_vol');
      const masterVolumeMultiplier = lofiVolSetting !== null ? parseFloat(lofiVolSetting) : 0.5;
      const vol = 0.16 * masterVolumeMultiplier;

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.004);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);

      biquad.type = 'bandpass';
      biquad.frequency.setValueAtTime(freq * 1.5, ctx.currentTime);
      biquad.Q.setValueAtTime(4.0, ctx.currentTime);
      biquad.frequency.exponentialRampToValueAtTime(freq, ctx.currentTime + 0.3);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
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
