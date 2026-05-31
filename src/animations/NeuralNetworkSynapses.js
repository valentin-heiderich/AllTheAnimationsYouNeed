import BaseAnimation from './BaseAnimation.js';

export default class NeuralNetworkSynapses extends BaseAnimation {
  constructor() {
    super();
    this.nodes = [];
    this.pulses = [];
    this.maxPulses = 200;
    this.mouse = { x: null, y: null, active: false, radius: 90 };
    this.colors = {
      blue: '#00C6FF', // Cobalt blue
      pink: '#FF007F', // Neon pink
      bg: '#04060c'
    };
  }

  setup() {
    this.nodes = [];
    this.pulses = [];
    
    // Scale neuron count with viewport dimensions
    const densityFactor = 22000;
    const nodeCount = Math.min(
      80,
      Math.max(25, Math.floor((this.width * this.height) / densityFactor))
    );

    for (let i = 0; i < nodeCount; i++) {
      this.nodes.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: Math.random() * 2.5 + 2,
        color: Math.random() < 0.65 ? this.colors.blue : this.colors.pink,
        activity: 0.0, // High when hovered or triggered
        connections: []
      });
    }

    this.rebuildSynapses();
  }

  rebuildSynapses() {
    const maxDist = 130;
    const len = this.nodes.length;
    
    // Precompute connections for faster drawing
    for (let i = 0; i < len; i++) {
      this.nodes[i].connections = [];
      for (let j = i + 1; j < len; j++) {
        const dx = this.nodes[j].x - this.nodes[i].x;
        const dy = this.nodes[j].y - this.nodes[i].y;
        const dist = Math.hypot(dx, dy);
        
        if (dist < maxDist) {
          this.nodes[i].connections.push(j);
        }
      }
    }
  }

  resize(width, height) {
    super.resize(width, height);
    this.setup();
  }

  draw(ctx, time) {
    // Ultra deep digital dark blue-black void
    ctx.fillStyle = this.colors.bg;
    ctx.fillRect(0, 0, this.width, this.height);

    const numNodes = this.nodes.length;

    // 1. Update and drift nodes
    this.nodes.forEach((n) => {
      n.x += n.vx;
      n.y += n.vy;

      // Wrap-around boundaries softly
      if (n.x < -10) n.x = this.width + 10;
      if (n.x > this.width + 10) n.x = -10;
      if (n.y < -10) n.y = this.height + 10;
      if (n.y > this.height + 10) n.y = -10;

      // Cool down activity state gradually
      n.activity = Math.max(0, n.activity - 0.04);
    });

    // 2. Interactive Cursor Action
    if (this.mouse.active && this.mouse.x !== null) {
      // Find nodes close to cursor and excite them
      this.nodes.forEach((n) => {
        const dist = Math.hypot(n.x - this.mouse.x, n.y - this.mouse.y);
        if (dist < this.mouse.radius) {
          n.activity = Math.min(1.0, n.activity + 0.12);
          
          // Hover excitations trigger a cascade of pulsing action potentials
          if (n.activity > 0.85 && Math.random() < 0.15 && this.pulses.length < this.maxPulses) {
            this.triggerCascade(n);
          }
        }
      });
    }

    // 3. Render Synaptic Pathways (Lines)
    ctx.lineWidth = 0.8;
    for (let i = 0; i < numNodes; i++) {
      const n1 = this.nodes[i];
      n1.connections.forEach((targetIdx) => {
        const n2 = this.nodes[targetIdx];
        const dist = Math.hypot(n2.x - n1.x, n2.y - n1.y);
        
        // Dynamically compute path opacity and gradient
        const maxActivity = Math.max(n1.activity, n2.activity);
        ctx.globalAlpha = 0.06 + maxActivity * 0.35;
        
        const grad = ctx.createLinearGradient(n1.x, n1.y, n2.x, n2.y);
        grad.addColorStop(0, n1.color);
        grad.addColorStop(1, n2.color);

        ctx.beginPath();
        ctx.moveTo(n1.x, n1.y);
        ctx.lineTo(n2.x, n2.y);
        ctx.strokeStyle = grad;
        ctx.stroke();
      });
    }

    // 4. Update and Draw Action Potential Pulses
    ctx.globalAlpha = 1.0;
    for (let i = this.pulses.length - 1; i >= 0; i--) {
      const p = this.pulses[i];
      p.progress += p.speed;

      if (p.progress >= 1.0) {
        // Pulse arrived! Excite target node
        const target = this.nodes[p.to];
        if (target) {
          target.activity = 1.0;
          // Sub-cascade: Chance to propagate further from target node
          if (Math.random() < p.cascadeChance && this.pulses.length < this.maxPulses) {
            this.triggerCascade(target, p.cascadeChance * 0.4); // Damp cascade chance to prevent runaway loops
          }
        }
        this.pulses.splice(i, 1);
        continue;
      }

      const fromNode = this.nodes[p.from];
      const toNode = this.nodes[p.to];

      if (fromNode && toNode) {
        // Interpolate along connection vector
        const pulseX = fromNode.x + (toNode.x - fromNode.x) * p.progress;
        const pulseY = fromNode.y + (toNode.y - fromNode.y) * p.progress;

        ctx.beginPath();
        ctx.arc(pulseX, pulseY, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    // 5. Draw Neural Soma (Node Cores)
    this.nodes.forEach((n, idx) => {
      // Glow Aura
      if (n.activity > 0.02) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius * (2.5 + n.activity * 2.0), 0, Math.PI * 2);
        ctx.fillStyle = n.color;
        ctx.globalAlpha = n.activity * 0.35;
        ctx.fill();
      }

      // Solid Core
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
      ctx.fillStyle = n.activity > 0.5 ? '#FFFFFF' : n.color;
      ctx.globalAlpha = 0.7 + n.activity * 0.3;
      ctx.fill();
    });

    ctx.globalAlpha = 1.0;

    // Occasional natural background signal spikes (firing action potentials)
    if (Math.random() < 0.04 && this.pulses.length < this.maxPulses) {
      const randomNode = this.nodes[Math.floor(Math.random() * numNodes)];
      if (randomNode) {
        this.triggerCascade(randomNode);
      }
    }
  }

  triggerCascade(sourceNode, chance = 0.7) {
    const sourceIndex = this.nodes.indexOf(sourceNode);
    if (sourceIndex === -1) return;

    // Fire pulses along outbound connections
    sourceNode.connections.forEach((targetIndex) => {
      if (this.pulses.length >= this.maxPulses) return;

      this.pulses.push({
        from: sourceIndex,
        to: targetIndex,
        progress: 0.0,
        speed: Math.random() * 0.03 + 0.015,
        size: Math.random() * 2 + 1.5,
        color: Math.random() < 0.5 ? this.colors.blue : this.colors.pink,
        cascadeChance: chance
      });
    });
  }

  destroy() {
    super.destroy();
    this.nodes = [];
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

  static get title() {
    return 'Neural Network Synapses';
  }

  static get description() {
    return 'Interactive biological brain-like neural network architecture. Glowing action potential signals fire organically along synaptic pathways. Hover over the nodes to trigger glowing neural signal cascades.';
  }

  static get vibe() {
    return 'Cybernetic';
  }

  static get sourceCode() {
    return `class NeuralNetworkSynapses {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.nodes = [];
    this.pulses = [];
    this.maxPulses = 200;
    this.mouse = { x: null, y: null, active: false, radius: 90 };
    this.colors = {
      blue: '#00C6FF',
      pink: '#FF007F',
      bg: '#04060c'
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
    this.nodes = [];
    this.pulses = [];
    const count = Math.min(80, Math.max(25, Math.floor((this.width * this.height) / 22000)));

    for (let i = 0; i < count; i++) {
      this.nodes.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: Math.random() * 2.5 + 2,
        color: Math.random() < 0.65 ? this.colors.blue : this.colors.pink,
        activity: 0.0,
        connections: []
      });
    }

    this.rebuildSynapses();
  }

  rebuildSynapses() {
    const maxDist = 130;
    const len = this.nodes.length;

    for (let i = 0; i < len; i++) {
      this.nodes[i].connections = [];
      for (let j = i + 1; j < len; j++) {
        const dx = this.nodes[j].x - this.nodes[i].x;
        const dy = this.nodes[j].y - this.nodes[i].y;
        const dist = Math.hypot(dx, dy);
        if (dist < maxDist) {
          this.nodes[i].connections.push(j);
        }
      }
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
    this.ctx.fillStyle = this.colors.bg;
    this.ctx.fillRect(0, 0, this.width, this.height);

    const numNodes = this.nodes.length;

    this.nodes.forEach((n) => {
      n.x += n.vx;
      n.y += n.vy;

      if (n.x < -10) n.x = this.width + 10;
      if (n.x > this.width + 10) n.x = -10;
      if (n.y < -10) n.y = this.height + 10;
      if (n.y > this.height + 10) n.y = -10;

      n.activity = Math.max(0, n.activity - 0.04);
    });

    if (this.mouse.active && this.mouse.x !== null) {
      this.nodes.forEach((n) => {
        const dist = Math.hypot(n.x - this.mouse.x, n.y - this.mouse.y);
        if (dist < this.mouse.radius) {
          n.activity = Math.min(1.0, n.activity + 0.12);
          if (n.activity > 0.85 && Math.random() < 0.15 && this.pulses.length < this.maxPulses) {
            this.triggerCascade(n);
          }
        }
      });
    }

    // Paths
    this.ctx.lineWidth = 0.8;
    for (let i = 0; i < numNodes; i++) {
      const n1 = this.nodes[i];
      n1.connections.forEach((targetIdx) => {
        const n2 = this.nodes[targetIdx];
        const maxActivity = Math.max(n1.activity, n2.activity);
        this.ctx.globalAlpha = 0.06 + maxActivity * 0.35;

        const grad = this.ctx.createLinearGradient(n1.x, n1.y, n2.x, n2.y);
        grad.addColorStop(0, n1.color);
        grad.addColorStop(1, n2.color);

        this.ctx.beginPath();
        this.ctx.moveTo(n1.x, n1.y);
        this.ctx.lineTo(n2.x, n2.y);
        this.ctx.strokeStyle = grad;
        this.ctx.stroke();
      });
    }

    // Pulses
    this.ctx.globalAlpha = 1.0;
    for (let i = this.pulses.length - 1; i >= 0; i--) {
      const p = this.pulses[i];
      p.progress += p.speed;

      if (p.progress >= 1.0) {
        const target = this.nodes[p.to];
        if (target) {
          target.activity = 1.0;
          if (Math.random() < p.cascadeChance && this.pulses.length < this.maxPulses) {
            this.triggerCascade(target, p.cascadeChance * 0.4);
          }
        }
        this.pulses.splice(i, 1);
        continue;
      }

      const fromNode = this.nodes[p.from];
      const toNode = this.nodes[p.to];

      if (fromNode && toNode) {
        const pulseX = fromNode.x + (toNode.x - fromNode.x) * p.progress;
        const pulseY = fromNode.y + (toNode.y - fromNode.y) * p.progress;

        this.ctx.beginPath();
        this.ctx.arc(pulseX, pulseY, p.size, 0, Math.PI * 2);
        this.ctx.fillStyle = p.color;
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = p.color;
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
      }
    }

    // Nodes
    this.nodes.forEach((n) => {
      if (n.activity > 0.02) {
        this.ctx.beginPath();
        this.ctx.arc(n.x, n.y, n.radius * (2.5 + n.activity * 2.0), 0, Math.PI * 2);
        this.ctx.fillStyle = n.color;
        this.ctx.globalAlpha = n.activity * 0.35;
        this.ctx.fill();
      }

      this.ctx.beginPath();
      this.ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = n.activity > 0.5 ? '#FFFFFF' : n.color;
      this.ctx.globalAlpha = 0.7 + n.activity * 0.3;
      this.ctx.fill();
    });

    this.ctx.globalAlpha = 1.0;

    if (Math.random() < 0.04 && this.pulses.length < this.maxPulses) {
      const randomNode = this.nodes[Math.floor(Math.random() * numNodes)];
      if (randomNode) {
        this.triggerCascade(randomNode);
      }
    }

    requestAnimationFrame((t) => this.animate(t));
  }

  triggerCascade(sourceNode, chance = 0.7) {
    const sourceIndex = this.nodes.indexOf(sourceNode);
    if (sourceIndex === -1) return;

    sourceNode.connections.forEach((targetIndex) => {
      if (this.pulses.length >= this.maxPulses) return;

      this.pulses.push({
        from: sourceIndex,
        to: targetIndex,
        progress: 0.0,
        speed: Math.random() * 0.03 + 0.015,
        size: Math.random() * 2 + 1.5,
        color: Math.random() < 0.5 ? this.colors.blue : this.colors.pink,
        cascadeChance: chance
      });
    });
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
