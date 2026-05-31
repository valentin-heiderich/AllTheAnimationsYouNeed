import BaseAnimation from './BaseAnimation.js';

export default class DNASpiralHelix extends BaseAnimation {
  constructor() {
    super();
    this.mouse = { x: null, y: null, active: false, radius: 220 };
    // Breathtaking soft pink and neon teal biology palette
    this.colors = {
      teal: '#00F0FF',
      pink: '#FF69B4',
      white: '#FFFFFF',
      tealGlow: 'rgba(0, 240, 255, ',
      pinkGlow: 'rgba(255, 105, 180, '
    };
    this.nodesCount = 0;
    this.helixRadius = 60;
    this.cycles = 3.5; // Number of full spirals across the screen
  }

  setup() {
    // Count scales dynamically with viewport width
    this.nodesCount = Math.min(95, Math.max(35, Math.floor(this.width / 15)));
    this.helixRadius = Math.min(75, Math.max(45, this.height * 0.12));
  }

  resize(width, height) {
    super.resize(width, height);
    this.setup();
  }

  draw(ctx, time) {
    // Sleek clinical biological dark space base
    ctx.fillStyle = '#050308';
    ctx.fillRect(0, 0, this.width, this.height);

    const timeSec = time * 0.001;
    const yAxis = this.height * 0.5;

    // We will precompute all coordinates along the double helix to draw rungs and backbones in depth order
    const pointsStrand1 = [];
    const pointsStrand2 = [];
    const rungs = [];

    // Calculate positions
    for (let i = 0; i < this.nodesCount; i++) {
      const t = i / (this.nodesCount - 1);
      const x = t * this.width;

      // Base rotation phase
      const basePhase = t * this.cycles * Math.PI * 2 + timeSec * 1.2;

      // Cursor twisting influence
      let localTwist = 0;
      let localSwell = 1.0;
      let localGlow = 0.0;

      if (this.mouse.active && this.mouse.x !== null) {
        const dx = x - this.mouse.x;
        const absDx = Math.abs(dx);

        if (absDx < this.mouse.radius) {
          const force = (this.mouse.radius - absDx) / this.mouse.radius; // 0 to 1
          
          // Warp phase rotation (twist helix) based on mouse vertical offset
          const mouseYFactor = this.mouse.y !== null ? (this.mouse.y - yAxis) / (this.height * 0.5) : 0;
          localTwist = force * Math.PI * 1.5 * (1 + mouseYFactor);
          
          // Swell radius locally
          localSwell = 1.0 + force * 0.55;
          
          // Boost brightness glow
          localGlow = force;
        }
      }

      // Final angles for the twin strands (offset by 180 deg / PI)
      const angle1 = basePhase + localTwist;
      const angle2 = basePhase + localTwist + Math.PI;

      const currentRadius = this.helixRadius * localSwell;

      // 3D coordinates (x, y, z)
      // z represents depth (-currentRadius to +currentRadius)
      const y1 = yAxis + Math.sin(angle1) * currentRadius;
      const z1 = Math.cos(angle1) * currentRadius;

      const y2 = yAxis + Math.sin(angle2) * currentRadius;
      const z2 = Math.cos(angle2) * currentRadius;

      pointsStrand1.push({ x, y: y1, z: z1, glow: localGlow });
      pointsStrand2.push({ x, y: y2, z: z2, glow: localGlow });

      // Add connection rung
      rungs.push({
        idx: i,
        x,
        y1,
        z1,
        y2,
        z2,
        avgZ: (z1 + z2) / 2,
        glow: localGlow
      });
    }

    // Sort rungs by average Z coordinate to draw back-to-front (depth buffering!)
    // This creates an absolutely perfect, highly professional 3D layering illusion.
    rungs.sort((a, b) => a.avgZ - b.avgZ);

    // 1. Draw rungs that are in the background (avgZ < 0)
    ctx.lineWidth = 1.0;
    rungs.forEach(rung => {
      if (rung.avgZ < 0) {
        this.drawRung(ctx, rung);
      }
    });

    // 2. Draw backbone strands segment by segment in depth order
    // To do this cleanly, we can draw connections between subsequent points.
    // We render background segments first, then foreground segments.
    // For simplicity and extreme performance, we can draw the backbones as continuous lines
    // but splitting background vs foreground points. Or we can draw segments (i -> i+1) sorted by average Z.
    const segments = [];
    for (let i = 0; i < this.nodesCount - 1; i++) {
      const p1a = pointsStrand1[i];
      const p1b = pointsStrand1[i + 1];
      const p2a = pointsStrand2[i];
      const p2b = pointsStrand2[i + 1];

      segments.push({
        type: 'strand1',
        x1: p1a.x, y1: p1a.y, z1: p1a.z,
        x2: p1b.x, y2: p1b.y, z2: p1b.z,
        avgZ: (p1a.z + p1b.z) / 2,
        glow: (p1a.glow + p1b.glow) / 2
      });

      segments.push({
        type: 'strand2',
        x1: p2a.x, y1: p2a.y, z1: p2a.z,
        x2: p2b.x, y2: p2b.y, z2: p2b.z,
        avgZ: (p2a.z + p2b.z) / 2,
        glow: (p2a.glow + p2b.glow) / 2
      });
    }

    segments.sort((a, b) => a.avgZ - b.avgZ);

    // Draw all background segments (avgZ < 0)
    segments.forEach(seg => {
      if (seg.avgZ < 0) {
        this.drawStrandSegment(ctx, seg);
      }
    });

    // 3. Draw foreground rungs (avgZ >= 0)
    rungs.forEach(rung => {
      if (rung.avgZ >= 0) {
        this.drawRung(ctx, rung);
      }
    });

    // Draw foreground segments (avgZ >= 0)
    segments.forEach(seg => {
      if (seg.avgZ >= 0) {
        this.drawStrandSegment(ctx, seg);
      }
    });

    // 4. Draw glowing nodes on top of the backbones in depth order
    const allNodes = [];
    pointsStrand1.forEach((pt, idx) => {
      allNodes.push({ type: 'strand1', ...pt });
    });
    pointsStrand2.forEach((pt, idx) => {
      allNodes.push({ type: 'strand2', ...pt });
    });

    allNodes.sort((a, b) => a.z - b.z);

    allNodes.forEach(node => {
      // Scale size based on Z depth
      const depthScale = 1.0 + node.z / (this.helixRadius * 2); // 0.5 to 1.5
      const baseRadius = (node.type === 'strand1' ? 4.5 : 4.0) * depthScale;
      const glowRadius = baseRadius * (2.8 + node.glow * 1.5);
      const color = node.type === 'strand1' ? this.colors.teal : this.colors.pink;
      const alpha = (0.2 + (node.z + this.helixRadius) / (this.helixRadius * 2) * 0.75) * (1.0 + node.glow * 1.5);

      // Outer glow
      ctx.beginPath();
      ctx.arc(node.x, node.y, glowRadius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = Math.min(0.38, alpha * 0.28);
      ctx.fill();

      // Node core
      ctx.beginPath();
      ctx.arc(node.x, node.y, baseRadius, 0, Math.PI * 2);
      ctx.fillStyle = node.glow > 0.4 ? this.colors.white : color;
      ctx.globalAlpha = Math.min(1.0, alpha);
      ctx.fill();
    });

    ctx.globalAlpha = 1.0;
  }

  drawRung(ctx, rung) {
    // Depth scaling variables
    const depthFactor = (rung.avgZ + this.helixRadius) / (this.helixRadius * 2); // 0 to 1
    const alpha = (0.05 + depthFactor * 0.55) * (1.0 + rung.glow * 1.2);
    const width = 0.8 + depthFactor * 2.2;

    ctx.beginPath();
    ctx.moveTo(rung.x, rung.y1);
    ctx.lineTo(rung.x, rung.y2);

    // Linear gradient for rungs from Teal (Strand 1) to Pink (Strand 2)
    const grad = ctx.createLinearGradient(rung.x, rung.y1, rung.x, rung.y2);
    grad.addColorStop(0, this.colors.teal);
    grad.addColorStop(1, this.colors.pink);

    ctx.strokeStyle = grad;
    ctx.lineWidth = width;
    ctx.globalAlpha = alpha;
    ctx.stroke();

    // Small interior center bead on rung (representing hydrogen bonds)
    const beadY = (rung.y1 + rung.y2) / 2;
    ctx.beginPath();
    ctx.arc(rung.x, beadY, width * 1.5, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.globalAlpha = alpha * 0.9;
    ctx.fill();
  }

  drawStrandSegment(ctx, seg) {
    const depthFactor = (seg.avgZ + this.helixRadius) / (this.helixRadius * 2); // 0 to 1
    const alpha = (0.12 + depthFactor * 0.72) * (1.0 + seg.glow * 1.4);
    const width = 1.5 + depthFactor * 3.5;
    const color = seg.type === 'strand1' ? this.colors.teal : this.colors.pink;

    ctx.beginPath();
    ctx.moveTo(seg.x1, seg.y1);
    ctx.lineTo(seg.x2, seg.y2);

    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.globalAlpha = Math.min(0.95, alpha);
    ctx.stroke();
  }

  destroy() {
    super.destroy();
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
    return 'DNA Spiral Helix';
  }

  static get description() {
    return 'Twin double-helix strands tracing 3D spiral mathematical equations projected in real-time onto 2D space. Hovering your cursor twists the strands and swells base-pair hubs in glowing excited states.';
  }

  static get vibe() {
    return 'Biological';
  }

  static get sourceCode() {
    return `class DNASpiralHelix {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.mouse = { x: null, y: null, active: false, radius: 220 };
    this.colors = {
      teal: '#00F0FF',
      pink: '#FF69B4',
      white: '#FFFFFF'
    };
    this.nodesCount = 0;
    this.helixRadius = 60;
    this.cycles = 3.5;

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
    this.nodesCount = Math.min(95, Math.max(35, Math.floor(this.width / 15)));
    this.helixRadius = Math.min(75, Math.max(45, this.height * 0.12));
  }

  resize() {
    this.dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;

    this.canvas.width = rect.width * this.dpr;
    this.canvas.height = rect.height * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);
    
    if (this.canvas.width > 0) {
      this.setup();
    }
  }

  animate(time = 0) {
    this.ctx.fillStyle = '#050308';
    this.ctx.fillRect(0, 0, this.width, this.height);

    const timeSec = time * 0.001;
    const yAxis = this.height * 0.5;

    const pointsStrand1 = [];
    const pointsStrand2 = [];
    const rungs = [];

    for (let i = 0; i < this.nodesCount; i++) {
      const t = i / (this.nodesCount - 1);
      const x = t * this.width;
      const basePhase = t * this.cycles * Math.PI * 2 + timeSec * 1.2;

      let localTwist = 0;
      let localSwell = 1.0;
      let localGlow = 0.0;

      if (this.mouse.active && this.mouse.x !== null) {
        const dx = x - this.mouse.x;
        const absDx = Math.abs(dx);

        if (absDx < this.mouse.radius) {
          const force = (this.mouse.radius - absDx) / this.mouse.radius;
          const mouseYFactor = this.mouse.y !== null ? (this.mouse.y - yAxis) / (this.height * 0.5) : 0;
          localTwist = force * Math.PI * 1.5 * (1 + mouseYFactor);
          localSwell = 1.0 + force * 0.55;
          localGlow = force;
        }
      }

      const angle1 = basePhase + localTwist;
      const angle2 = basePhase + localTwist + Math.PI;
      const currentRadius = this.helixRadius * localSwell;

      const y1 = yAxis + Math.sin(angle1) * currentRadius;
      const z1 = Math.cos(angle1) * currentRadius;
      const y2 = yAxis + Math.sin(angle2) * currentRadius;
      const z2 = Math.cos(angle2) * currentRadius;

      pointsStrand1.push({ x, y: y1, z: z1, glow: localGlow });
      pointsStrand2.push({ x, y: y2, z: z2, glow: localGlow });

      rungs.push({
        idx: i, x, y1, z1, y2, z2,
        avgZ: (z1 + z2) / 2,
        glow: localGlow
      });
    }

    rungs.sort((a, b) => a.avgZ - b.avgZ);

    // Background rungs
    rungs.forEach(rung => {
      if (rung.avgZ < 0) this.drawRung(rung);
    });

    // Build segments
    const segments = [];
    for (let i = 0; i < this.nodesCount - 1; i++) {
      const p1a = pointsStrand1[i];
      const p1b = pointsStrand1[i + 1];
      const p2a = pointsStrand2[i];
      const p2b = pointsStrand2[i + 1];

      segments.push({
        type: 'strand1',
        x1: p1a.x, y1: p1a.y, z1: p1a.z,
        x2: p1b.x, y2: p1b.y, z2: p1b.z,
        avgZ: (p1a.z + p1b.z) / 2,
        glow: (p1a.glow + p1b.glow) / 2
      });

      segments.push({
        type: 'strand2',
        x1: p2a.x, y1: p2a.y, z1: p2a.z,
        x2: p2b.x, y2: p2b.y, z2: p2b.z,
        avgZ: (p2a.z + p2b.z) / 2,
        glow: (p2a.glow + p2b.glow) / 2
      });
    }

    segments.sort((a, b) => a.avgZ - b.avgZ);

    // Background segments
    segments.forEach(seg => {
      if (seg.avgZ < 0) this.drawStrandSegment(seg);
    });

    // Foreground rungs
    rungs.forEach(rung => {
      if (rung.avgZ >= 0) this.drawRung(rung);
    });

    // Foreground segments
    segments.forEach(seg => {
      if (seg.avgZ >= 0) this.drawStrandSegment(seg);
    });

    // Nodes
    const allNodes = [];
    pointsStrand1.forEach(pt => allNodes.push({ type: 'strand1', ...pt }));
    pointsStrand2.forEach(pt => allNodes.push({ type: 'strand2', ...pt }));
    allNodes.sort((a, b) => a.z - b.z);

    allNodes.forEach(node => {
      const depthScale = 1.0 + node.z / (this.helixRadius * 2);
      const baseRadius = (node.type === 'strand1' ? 4.5 : 4.0) * depthScale;
      const color = node.type === 'strand1' ? this.colors.teal : this.colors.pink;
      const alpha = (0.2 + (node.z + this.helixRadius) / (this.helixRadius * 2) * 0.75) * (1.0 + node.glow * 1.5);

      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, baseRadius * (2.8 + node.glow * 1.5), 0, Math.PI * 2);
      this.ctx.fillStyle = color;
      this.ctx.globalAlpha = Math.min(0.38, alpha * 0.28);
      this.ctx.fill();

      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, baseRadius, 0, Math.PI * 2);
      this.ctx.fillStyle = node.glow > 0.4 ? this.colors.white : color;
      this.ctx.globalAlpha = Math.min(1.0, alpha);
      this.ctx.fill();
    });

    this.ctx.globalAlpha = 1.0;
    requestAnimationFrame((t) => this.animate(t));
  }

  drawRung(rung) {
    const depthFactor = (rung.avgZ + this.helixRadius) / (this.helixRadius * 2);
    const alpha = (0.05 + depthFactor * 0.55) * (1.0 + rung.glow * 1.2);
    const width = 0.8 + depthFactor * 2.2;

    this.ctx.beginPath();
    this.ctx.moveTo(rung.x, rung.y1);
    this.ctx.lineTo(rung.x, rung.y2);

    const grad = this.ctx.createLinearGradient(rung.x, rung.y1, rung.x, rung.y2);
    grad.addColorStop(0, this.colors.teal);
    grad.addColorStop(1, this.colors.pink);

    this.ctx.strokeStyle = grad;
    this.ctx.lineWidth = width;
    this.ctx.globalAlpha = alpha;
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.arc(rung.x, (rung.y1 + rung.y2) / 2, width * 1.5, 0, Math.PI * 2);
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.globalAlpha = alpha * 0.9;
    this.ctx.fill();
  }

  drawStrandSegment(seg) {
    const depthFactor = (seg.avgZ + this.helixRadius) / (this.helixRadius * 2);
    const alpha = (0.12 + depthFactor * 0.72) * (1.0 + seg.glow * 1.4);
    const width = 1.5 + depthFactor * 3.5;
    const color = seg.type === 'strand1' ? this.colors.teal : this.colors.pink;

    this.ctx.beginPath();
    this.ctx.moveTo(seg.x1, seg.y1);
    this.ctx.lineTo(seg.x2, seg.y2);

    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = width;
    this.ctx.globalAlpha = Math.min(0.95, alpha);
    this.ctx.stroke();
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
