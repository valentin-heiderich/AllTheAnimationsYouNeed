import BaseAnimation from './BaseAnimation.js';

export default class JellyfishDrift extends BaseAnimation {
  constructor() {
    super();
    this.jellyfish = [];
    this.mouse = { x: null, y: null, active: false, radius: 250 };
    
    // Bioluminescent neon deep sea palette
    this.colors = [
      { core: '#ffffff', glow: 'rgba(0, 240, 255, 0.4)', tendril: 'rgba(0, 240, 255, 0.18)' }, // Neon Cyan
      { core: '#ffffff', glow: 'rgba(189, 0, 255, 0.4)', tendril: 'rgba(189, 0, 255, 0.18)' }, // Glowing Violet
      { core: '#ffffff', glow: 'rgba(255, 0, 127, 0.4)', tendril: 'rgba(255, 0, 127, 0.18)' }, // Shocking Pink
      { core: '#ffffff', glow: 'rgba(0, 255, 204, 0.4)', tendril: 'rgba(0, 255, 204, 0.18)' }  // Sea Mint
    ];
  }

  setup() {
    this.jellyfish = [];
    // Scale count: 3 to 6 jellyfish in the background
    const densityFactor = 160000;
    const count = Math.min(6, Math.max(3, Math.floor((this.width * this.height) / densityFactor)));

    for (let i = 0; i < count; i++) {
      this.jellyfish.push(this.createJellyfish(true));
    }
  }

  createJellyfish(randomizeY = false) {
    const radius = 24 + Math.random() * 24;
    const x = Math.random() * this.width;
    const y = randomizeY ? Math.random() * this.height : this.height + 100;
    
    // Core physics properties
    const theme = this.colors[Math.floor(Math.random() * this.colors.length)];
    
    // Create physics points for 8 trail tendrils
    const tendrilCount = 8;
    const tendrils = [];
    for (let j = 0; j < tendrilCount; j++) {
      const points = [];
      const nodeCount = 14;
      for (let n = 0; n < nodeCount; n++) {
        points.push({ x: x, y: y + n * 6, prevX: x, prevY: y + n * 6 });
      }
      tendrils.push(points);
    }

    return {
      x,
      y,
      vx: 0,
      vy: -0.4 - Math.random() * 0.6,
      radius,
      theme,
      angle: -Math.PI / 2, // Swim straight up initially
      targetAngle: -Math.PI / 2,
      pulsePhase: Math.random() * Math.PI * 2,
      pulseSpeed: 0.02 + Math.random() * 0.015,
      tendrils,
      glowFactor: 0.2 + Math.random() * 0.2,
      excited: false
    };
  }

  resize(width, height) {
    super.resize(width, height);
    this.setup();
  }

  draw(ctx, time) {
    // 1. Abyss black backdrop
    ctx.fillStyle = '#02040b';
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Update and draw each jellyfish
    this.jellyfish.forEach(jf => {
      // Pulse animation logic
      jf.pulsePhase += jf.pulseSpeed;
      const contraction = Math.sin(jf.pulsePhase);
      
      // Determine if contracting or extending
      // Contraction triggers forward pulse movement
      const isContracting = contraction > 0.3;
      
      // Target velocities under hydrodynamics
      let speed = isContracting ? 1.6 : 0.28;
      
      // Cursor illumination attraction (excited by light)
      jf.excited = false;
      if (this.mouse.active && this.mouse.x !== null) {
        const dx = this.mouse.x - jf.x;
        const dy = this.mouse.y - jf.y;
        const dist = Math.hypot(dx, dy);

        if (dist < this.mouse.radius) {
          jf.excited = true;
          // Curve towards the mouse cursor
          jf.targetAngle = Math.atan2(dy, dx);
          // Swim faster when excited
          speed *= 1.45;
          jf.pulseSpeed = 0.035 + (1.0 - dist / this.mouse.radius) * 0.02;
        } else {
          jf.targetAngle = -Math.PI / 2 + Math.sin(time * 0.0004 + jf.x) * 0.2;
          jf.pulseSpeed = 0.02 + Math.random() * 0.005;
        }
      } else {
        jf.targetAngle = -Math.PI / 2 + Math.sin(time * 0.0004 + jf.x) * 0.2;
      }

      // Smooth heading correction
      jf.angle += (jf.targetAngle - jf.angle) * 0.04;

      // Apply thrust vectors
      const tx = Math.cos(jf.angle) * speed;
      const ty = Math.sin(jf.angle) * speed;

      jf.vx += (tx - jf.vx) * 0.06;
      jf.vy += (ty - jf.vy) * 0.06;

      // Move coordinate
      jf.x += jf.vx;
      jf.y += jf.vy;

      // Boundary warp wrapping
      if (jf.y < -120) {
        const fresh = this.createJellyfish(false);
        Object.assign(jf, fresh);
        jf.y = this.height + 120;
      }
      if (jf.x < -80) jf.x = this.width + 80;
      if (jf.x > this.width + 80) jf.x = -80;

      // Squish and stretch factors
      // Squishes (wider bell) when contracting, elongates when drifting
      const bellWidthScale = 1.0 - contraction * 0.18;
      const bellHeightScale = 1.0 + contraction * 0.12;

      // 3. Update physics chains for tentacles
      const rimWidth = jf.radius * 0.9 * bellWidthScale;
      
      jf.tendrils.forEach((points, tIndex) => {
        // Find anchor position on the rim of the dome
        const rimRatio = tIndex / (jf.tendrils.length - 1 || 1);
        const rimAngle = jf.angle + Math.PI / 2 + (rimRatio - 0.5) * Math.PI * 0.8;
        
        // Head of tendril chain is anchored
        const headX = jf.x + Math.cos(rimAngle) * rimWidth;
        const headY = jf.y - Math.sin(rimAngle) * jf.radius * 0.15;
        
        points[0].x = headX;
        points[0].y = headY;

        // Perform Verlet-like string solver
        for (let n = 1; n < points.length; n++) {
          const pt = points[n];
          const prev = points[n - 1];
          
          // Current velocities
          let ptVx = (pt.x - pt.prevX) * 0.85;
          let ptVy = (pt.y - pt.prevY) * 0.85;

          // Drag forces and ocean current sway offsets
          const currentSway = Math.sin(time * 0.0014 + n * 0.3 + tIndex) * 0.12;
          
          ptVx += currentSway;
          ptVy += 0.055; // Gravity settling drag

          pt.prevX = pt.x;
          pt.prevY = pt.y;

          pt.x += ptVx;
          pt.y += ptVy;

          // Distance link constraint
          const dx = pt.x - prev.x;
          const dy = pt.y - prev.y;
          const dist = Math.hypot(dx, dy);
          const segmentLen = 6.2;
          
          if (dist > segmentLen) {
            const ratio = segmentLen / dist;
            pt.x = prev.x + dx * ratio;
            pt.y = prev.y + dy * ratio;
          }
        }
      });

      // 4. Render bioluminescent tendrils (drawn behind the bell body)
      jf.tendrils.forEach(points => {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let n = 1; n < points.length; n++) {
          const midX = (points[n - 1].x + points[n].x) / 2;
          const midY = (points[n - 1].y + points[n].y) / 2;
          ctx.quadraticCurveTo(points[n - 1].x, points[n - 1].y, midX, midY);
        }
        ctx.strokeStyle = jf.theme.tendril;
        ctx.lineWidth = 1.6;
        ctx.lineCap = 'round';
        ctx.stroke();
      });

      // 5. Render translucent bioluminescent bell dome
      ctx.save();
      ctx.translate(jf.x, jf.y);
      ctx.rotate(jf.angle + Math.PI / 2);
      ctx.scale(bellWidthScale, bellHeightScale);

      // Bell shadow path & glowing fill
      ctx.beginPath();
      // Dome top
      ctx.arc(0, 0, jf.radius, Math.PI, 0, false);
      // Fluted rim base wave
      ctx.bezierCurveTo(jf.radius * 0.5, 8, jf.radius * 0.4, -4, 0, 4);
      ctx.bezierCurveTo(-jf.radius * 0.4, -4, -jf.radius * 0.5, 8, -jf.radius, 0);
      ctx.closePath();

      // Soft bioluminescent radial gradient
      const bellGrad = ctx.createRadialGradient(0, -jf.radius * 0.2, 2, 0, -jf.radius * 0.2, jf.radius);
      const glowColor = jf.excited ? jf.theme.glow.replace('0.4', '0.6') : jf.theme.glow;
      
      bellGrad.addColorStop(0, '#ffffff');
      bellGrad.addColorStop(0.35, glowColor);
      bellGrad.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.fillStyle = bellGrad;
      ctx.fill();

      // Detailed interior gonads (clover-like glowing lobes)
      ctx.beginPath();
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 2) {
        const gx = Math.cos(angle) * jf.radius * 0.28;
        const gy = Math.sin(angle) * jf.radius * 0.18 - jf.radius * 0.2;
        ctx.arc(gx, gy, jf.radius * 0.12, 0, Math.PI * 2);
      }
      ctx.fillStyle = glowColor;
      ctx.fill();

      ctx.restore();
    });
  }

  destroy() {
    this.jellyfish = [];
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
    return 'Jellyfish Drift';
  }

  static get description() {
    return 'A small school of bioluminescent jellyfish contracting physically to propel themselves upward through the dark abyss. Trail tendrils experience realistic fluid drag while cursor movement acts as an attractive light beacon.';
  }

  static get vibe() {
    return 'Biological';
  }

  static get sourceCode() {
    return `class JellyfishDrift {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.jellyfish = [];
    this.mouse = { x: null, y: null, active: false, radius: 250 };
    
    this.colors = [
      { core: '#ffffff', glow: 'rgba(0, 240, 255, 0.4)', tendril: 'rgba(0, 240, 255, 0.18)' },
      { core: '#ffffff', glow: 'rgba(189, 0, 255, 0.4)', tendril: 'rgba(189, 0, 255, 0.18)' },
      { core: '#ffffff', glow: 'rgba(255, 0, 127, 0.4)', tendril: 'rgba(255, 0, 127, 0.18)' },
      { core: '#ffffff', glow: 'rgba(0, 255, 204, 0.4)', tendril: 'rgba(0, 255, 204, 0.18)' }
    ];
    
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
    const count = Math.min(6, Math.max(3, Math.floor((this.width * this.height) / 160000)));
    for (let i = 0; i < count; i++) {
      this.jellyfish.push(this.createJellyfish(true));
    }
  }

  createJellyfish(randomizeY = false) {
    const radius = 24 + Math.random() * 24;
    const x = Math.random() * this.width;
    const y = randomizeY ? Math.random() * this.height : this.height + 100;
    const theme = this.colors[Math.floor(Math.random() * this.colors.length)];
    
    const tendrilCount = 8;
    const tendrils = [];
    for (let j = 0; j < tendrilCount; j++) {
      const points = [];
      const nodeCount = 14;
      for (let n = 0; n < nodeCount; n++) {
        points.push({ x: x, y: y + n * 6, prevX: x, prevY: y + n * 6 });
      }
      tendrils.push(points);
    }

    return {
      x, y, vx: 0, vy: -0.4 - Math.random() * 0.6,
      radius, theme, angle: -Math.PI / 2, targetAngle: -Math.PI / 2,
      pulsePhase: Math.random() * Math.PI * 2,
      pulseSpeed: 0.02 + Math.random() * 0.015,
      tendrils, glowFactor: 0.2 + Math.random() * 0.2, excited: false
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
    this.ctx.fillStyle = '#02040b';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.jellyfish.forEach(jf => {
      jf.pulsePhase += jf.pulseSpeed;
      const contraction = Math.sin(jf.pulsePhase);
      const isContracting = contraction > 0.3;
      let speed = isContracting ? 1.6 : 0.28;
      
      jf.excited = false;
      if (this.mouse.active && this.mouse.x !== null) {
        const dx = this.mouse.x - jf.x;
        const dy = this.mouse.y - jf.y;
        const dist = Math.hypot(dx, dy);

        if (dist < this.mouse.radius) {
          jf.excited = true;
          jf.targetAngle = Math.atan2(dy, dx);
          speed *= 1.45;
          jf.pulseSpeed = 0.035 + (1.0 - dist / this.mouse.radius) * 0.02;
        } else {
          jf.targetAngle = -Math.PI / 2 + Math.sin(time * 0.0004 + jf.x) * 0.2;
          jf.pulseSpeed = 0.02 + Math.random() * 0.005;
        }
      } else {
        jf.targetAngle = -Math.PI / 2 + Math.sin(time * 0.0004 + jf.x) * 0.2;
      }

      jf.angle += (jf.targetAngle - jf.angle) * 0.04;
      jf.vx += (Math.cos(jf.angle) * speed - jf.vx) * 0.06;
      jf.vy += (Math.sin(jf.angle) * speed - jf.vy) * 0.06;

      jf.x += jf.vx;
      jf.y += jf.vy;

      if (jf.y < -120) {
        const fresh = this.createJellyfish(false);
        Object.assign(jf, fresh);
        jf.y = this.height + 120;
      }
      if (jf.x < -80) jf.x = this.width + 80;
      if (jf.x > this.width + 80) jf.x = -80;

      const bellWidthScale = 1.0 - contraction * 0.18;
      const bellHeightScale = 1.0 + contraction * 0.12;
      const rimWidth = jf.radius * 0.9 * bellWidthScale;
      
      jf.tendrils.forEach((points, tIndex) => {
        const rimRatio = tIndex / (jf.tendrils.length - 1 || 1);
        const rimAngle = jf.angle + Math.PI / 2 + (rimRatio - 0.5) * Math.PI * 0.8;
        points[0].x = jf.x + Math.cos(rimAngle) * rimWidth;
        points[0].y = jf.y - Math.sin(rimAngle) * jf.radius * 0.15;

        for (let n = 1; n < points.length; n++) {
          const pt = points[n];
          const prev = points[n - 1];
          let ptVx = (pt.x - pt.prevX) * 0.85;
          let ptVy = (pt.y - pt.prevY) * 0.85;

          ptVx += Math.sin(time * 0.0014 + n * 0.3 + tIndex) * 0.12;
          ptVy += 0.055;

          pt.prevX = pt.x;
          pt.prevY = pt.y;
          pt.x += ptVx;
          pt.y += ptVy;

          const dx = pt.x - prev.x;
          const dy = pt.y - prev.y;
          const dist = Math.hypot(dx, dy);
          const segmentLen = 6.2;
          if (dist > segmentLen) {
            const ratio = segmentLen / dist;
            pt.x = prev.x + dx * ratio;
            pt.y = prev.y + dy * ratio;
          }
        }
      });

      jf.tendrils.forEach(points => {
        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x, points[0].y);
        for (let n = 1; n < points.length; n++) {
          const midX = (points[n - 1].x + points[n].x) / 2;
          const midY = (points[n - 1].y + points[n].y) / 2;
          this.ctx.quadraticCurveTo(points[n - 1].x, points[n - 1].y, midX, midY);
        }
        this.ctx.strokeStyle = jf.theme.tendril;
        this.ctx.lineWidth = 1.6;
        this.ctx.lineCap = 'round';
        this.ctx.stroke();
      });

      this.ctx.save();
      this.ctx.translate(jf.x, jf.y);
      this.ctx.rotate(jf.angle + Math.PI / 2);
      this.ctx.scale(bellWidthScale, bellHeightScale);

      this.ctx.beginPath();
      this.ctx.arc(0, 0, jf.radius, Math.PI, 0, false);
      this.ctx.bezierCurveTo(jf.radius * 0.5, 8, jf.radius * 0.4, -4, 0, 4);
      this.ctx.bezierCurveTo(-jf.radius * 0.4, -4, -jf.radius * 0.5, 8, -jf.radius, 0);
      this.closePath();

      const bellGrad = this.ctx.createRadialGradient(0, -jf.radius * 0.2, 2, 0, -jf.radius * 0.2, jf.radius);
      const glowColor = jf.excited ? jf.theme.glow.replace('0.4', '0.6') : jf.theme.glow;
      bellGrad.addColorStop(0, '#ffffff');
      bellGrad.addColorStop(0.35, glowColor);
      bellGrad.addColorStop(1, 'rgba(0,0,0,0)');
      this.ctx.fillStyle = bellGrad;
      this.ctx.fill();

      this.ctx.beginPath();
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 2) {
        const gx = Math.cos(angle) * jf.radius * 0.28;
        const gy = Math.sin(angle) * jf.radius * 0.18 - jf.radius * 0.2;
        this.ctx.arc(gx, gy, jf.radius * 0.12, 0, Math.PI * 2);
      }
      this.ctx.fillStyle = glowColor;
      this.ctx.fill();

      this.ctx.restore();
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
