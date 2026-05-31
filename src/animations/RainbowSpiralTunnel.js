import BaseAnimation from './BaseAnimation.js';

export default class RainbowSpiralTunnel extends BaseAnimation {
  constructor() {
    super();
    this.mouse = { x: null, y: null, active: false, rx: 0, ry: 0 };
    this.bg = '#020108'; // Deep psychedelic cosmic void background
  }

  setup() {
    // Start spring mouse at the center
    this.mouse.rx = this.width / 2;
    this.mouse.ry = this.height / 2;
  }

  resize(width, height) {
    super.resize(width, height);
  }

  draw(ctx, time) {
    // 1. Draw core dark space void background
    ctx.fillStyle = this.bg;
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Track smooth cursor spring coords
    if (this.mouse.active && this.mouse.x !== null) {
      this.mouse.rx = this.mouse.rx * 0.9 + this.mouse.x * 0.1;
      this.mouse.ry = this.mouse.ry * 0.9 + this.mouse.y * 0.1;
    } else {
      // Automatic slow, floating drift
      this.mouse.rx = this.mouse.rx * 0.97 + (this.width / 2 + Math.sin(time * 0.0008) * (this.width * 0.22)) * 0.03;
      this.mouse.ry = this.mouse.ry * 0.97 + (this.height / 2 + Math.cos(time * 0.0006) * (this.height * 0.22)) * 0.03;
    }

    // 3. Dynamic tunnel metrics
    const ringCount = 38; // Number of nested rings along depth axis
    const maxRadius = Math.max(this.width, this.height) * 0.88;
    const rayCount = 12; // Number of longitudinal rays forming cylinder grid
    
    // Displacement vector from default center
    const dx = this.mouse.rx - this.width / 2;
    const dy = this.mouse.ry - this.height / 2;

    const pointsGrid = [];

    // 4. Calculate ring nodes using an exponential depth scale to simulate real 3D perspective
    for (let i = 0; i <= ringCount; i++) {
      // Exponential scale creates perfect perspective depth grid mapping
      const scale = Math.pow(i / ringCount, 2.2); 
      const radius = maxRadius * scale;

      // Warp center coordinates based on cursor displacement
      // Deeper rings (smaller scale) shift more, bending the tunnel like a snake
      const warpFactor = Math.pow(1.0 - scale, 1.8);
      const ringX = this.width / 2 + dx * warpFactor;
      const ringY = this.height / 2 + dy * warpFactor;

      // Spiral rotation shifts smoothly over depth (creating vortex spiral)
      const rotAngle = i * 0.08 - time * 0.0007;

      pointsGrid[i] = [];

      // Calculate coordinates around the ring circumference
      for (let r = 0; r < rayCount; r++) {
        const angle = rotAngle + (r / rayCount) * Math.PI * 2;
        const px = ringX + radius * Math.cos(angle);
        const py = ringY + radius * Math.sin(angle);

        // HSL Color spectrum shifting over depth and time
        const hue = (time * 0.024 + i * 7.5 + r * 3) % 360;
        // Fade out rings close to camera and far away in center hole
        let opacity = Math.sin(scale * Math.PI) * 0.7;
        if (i === 0) opacity = 0; // Center deadzone

        pointsGrid[i][r] = {
          x: px,
          y: py,
          hue: hue,
          opacity: opacity
        };
      }
    }

    // 5. Render Tunnel elements from back-to-front (deep inside to front viewport)
    ctx.lineWidth = 1.25;

    for (let i = 1; i <= ringCount; i++) {
      // Draw Longitudinal connector lines (tunnel wall ribs)
      for (let r = 0; r < rayCount; r++) {
        const pPrev = pointsGrid[i - 1][r];
        const pCurrent = pointsGrid[i][r];

        ctx.beginPath();
        ctx.moveTo(pPrev.x, pPrev.y);
        ctx.lineTo(pCurrent.x, pCurrent.y);

        // Create linear gradient along the segment to blend colors beautifully
        const strokeGrad = ctx.createLinearGradient(pPrev.x, pPrev.y, pCurrent.x, pCurrent.y);
        strokeGrad.addColorStop(0, `hsla(${pPrev.hue}, 95%, 65%, ${pPrev.opacity * 0.65})`);
        strokeGrad.addColorStop(1, `hsla(${pCurrent.hue}, 95%, 65%, ${pCurrent.opacity * 0.65})`);

        ctx.strokeStyle = strokeGrad;
        ctx.stroke();
      }

      // Draw concentric polygons (cross-sections of tunnel)
      ctx.beginPath();
      ctx.moveTo(pointsGrid[i][0].x, pointsGrid[i][0].y);
      for (let r = 1; r < rayCount; r++) {
        ctx.lineTo(pointsGrid[i][r].x, pointsGrid[i][r].y);
      }
      ctx.closePath();

      // Render concentric outline with a soft hue matched to ring depth
      const ringHue = pointsGrid[i][0].hue;
      const ringOpacity = pointsGrid[i][0].opacity;
      
      ctx.strokeStyle = `hsla(${ringHue}, 98%, 68%, ${ringOpacity * 0.8})`;
      ctx.stroke();

      // Faint radial fill in alternate rings to build solid depth occlusion
      if (i % 2 === 0) {
        ctx.fillStyle = `hsla(${ringHue}, 98%, 40%, ${ringOpacity * 0.035})`;
        ctx.fill();
      }
    }

    // 6. Draw central glowing vortex light overlay to hide the center coordinate snap
    const vortexGlow = ctx.createRadialGradient(
      this.width / 2 + dx, this.height / 2 + dy, 5,
      this.width / 2 + dx * 0.7, this.height / 2 + dy * 0.7, maxRadius * 0.2
    );
    vortexGlow.addColorStop(0, '#000000'); // Perfect black hole core
    vortexGlow.addColorStop(0.3, 'rgba(8, 2, 20, 0.9)');
    vortexGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = vortexGlow;
    ctx.beginPath();
    ctx.arc(this.width / 2 + dx, this.height / 2 + dy, maxRadius * 0.2, 0, Math.PI * 2);
    ctx.fill();
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

  destroy() {
    super.destroy();
  }

  static get title() {
    return 'Rainbow Spiral Tunnel';
  }

  static get description() {
    return 'A dynamic vortex tunnel of nested rings scaling exponentially outwards. A physical cursor-focus warping bends the perspective of the tunnel based on mouse placement, shifting the entire tunnel along the full HSL color spectrum.';
  }

  static get vibe() {
    return 'Psychedelic';
  }

  static get sourceCode() {
    return `class RainbowSpiralTunnel {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.mouse = { x: null, y: null, active: false, rx: 0, ry: 0 };
    this.bg = '#020108';

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
  }

  animate(time = 0) {
    this.ctx.fillStyle = this.bg;
    this.ctx.fillRect(0, 0, this.width, this.height);

    if (this.mouse.active && this.mouse.x !== null) {
      this.mouse.rx = this.mouse.rx * 0.9 + this.mouse.x * 0.1;
      this.mouse.ry = this.mouse.ry * 0.9 + this.mouse.y * 0.1;
    } else {
      this.mouse.rx = this.mouse.rx * 0.97 + (this.width / 2 + Math.sin(time * 0.0008) * (this.width * 0.22)) * 0.03;
      this.mouse.ry = this.mouse.ry * 0.97 + (this.height / 2 + Math.cos(time * 0.0006) * (this.height * 0.22)) * 0.03;
    }

    const ringCount = 38;
    const maxRadius = Math.max(this.width, this.height) * 0.88;
    const rayCount = 12;
    
    const dx = this.mouse.rx - this.width / 2;
    const dy = this.mouse.ry - this.height / 2;

    const pointsGrid = [];

    for (let i = 0; i <= ringCount; i++) {
      const scale = Math.pow(i / ringCount, 2.2); 
      const radius = maxRadius * scale;

      const warpFactor = Math.pow(1.0 - scale, 1.8);
      const ringX = this.width / 2 + dx * warpFactor;
      const ringY = this.height / 2 + dy * warpFactor;

      const rotAngle = i * 0.08 - time * 0.0007;

      pointsGrid[i] = [];

      for (let r = 0; r < rayCount; r++) {
        const angle = rotAngle + (r / rayCount) * Math.PI * 2;
        const px = ringX + radius * Math.cos(angle);
        const py = ringY + radius * Math.sin(angle);

        const hue = (time * 0.024 + i * 7.5 + r * 3) % 360;
        let opacity = Math.sin(scale * Math.PI) * 0.7;
        if (i === 0) opacity = 0;

        pointsGrid[i][r] = {
          x: px,
          y: py,
          hue: hue,
          opacity: opacity
        };
      }
    }

    this.ctx.lineWidth = 1.25;

    for (let i = 1; i <= ringCount; i++) {
      for (let r = 0; r < rayCount; r++) {
        const pPrev = pointsGrid[i - 1][r];
        const pCurrent = pointsGrid[i][r];

        this.ctx.beginPath();
        this.ctx.moveTo(pPrev.x, pPrev.y);
        this.ctx.lineTo(pCurrent.x, pCurrent.y);

        const strokeGrad = this.ctx.createLinearGradient(pPrev.x, pPrev.y, pCurrent.x, pCurrent.y);
        strokeGrad.addColorStop(0, \`hsla(\${pPrev.hue}, 95%, 65%, \${pPrev.opacity * 0.65})\`);
        strokeGrad.addColorStop(1, \`hsla(\${pCurrent.hue}, 95%, 65%, \${pCurrent.opacity * 0.65})\`);

        this.ctx.strokeStyle = strokeGrad;
        this.ctx.stroke();
      }

      this.ctx.beginPath();
      this.ctx.moveTo(pointsGrid[i][0].x, pointsGrid[i][0].y);
      for (let r = 1; r < rayCount; r++) {
        this.ctx.lineTo(pointsGrid[i][r].x, pointsGrid[i][r].y);
      }
      this.ctx.closePath();

      const ringHue = pointsGrid[i][0].hue;
      const ringOpacity = pointsGrid[i][0].opacity;
      
      this.ctx.strokeStyle = \`hsla(\${ringHue}, 98%, 68%, \${ringOpacity * 0.8})\`;
      this.ctx.stroke();

      if (i % 2 === 0) {
        this.ctx.fillStyle = \`hsla(\${ringHue}, 98%, 40%, \${ringOpacity * 0.035})\`;
        this.ctx.fill();
      }
    }

    const vortexGlow = this.ctx.createRadialGradient(
      this.width / 2 + dx, this.height / 2 + dy, 5,
      this.width / 2 + dx * 0.7, this.height / 2 + dy * 0.7, maxRadius * 0.2
    );
    vortexGlow.addColorStop(0, '#000000');
    vortexGlow.addColorStop(0.3, 'rgba(8, 2, 20, 0.9)');
    vortexGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    this.ctx.fillStyle = vortexGlow;
    this.ctx.beginPath();
    this.ctx.arc(this.width / 2 + dx, this.height / 2 + dy, maxRadius * 0.2, 0, Math.PI * 2);
    this.ctx.fill();

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
