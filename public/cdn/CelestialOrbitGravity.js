import BaseAnimation from './BaseAnimation.js';

export default class CelestialOrbitGravity extends BaseAnimation {
  constructor() {
    super();
    this.mouse = { x: null, y: null, active: false, rx: 0, ry: 0 };
    this.dust = [];
    // Physics constants
    this.G = 0.85; // Gravitational constant
    this.M_center = 8000; // Center star mass
    this.M_mouse = 0; // Dynamic mouse mass (ramp up on enter)
    this.targetMouseMass = 7000;
  }

  setup() {
    this.dust = [];
    this.mouse.rx = this.width / 2;
    this.mouse.ry = this.height / 2;

    const area = this.width * this.height;
    const count = Math.min(600, Math.floor(area / 1800));

    const cx = this.width / 2;
    const cy = this.height / 2;

    // Populate stable orbital accretion disk dust
    for (let i = 0; i < count; i++) {
      // Distance from center star (don't place inside central core)
      const minDistance = Math.min(this.width, this.height) * 0.08;
      const maxDistance = Math.min(this.width, this.height) * 0.46;
      const r = minDistance + Math.pow(Math.random(), 1.5) * (maxDistance - minDistance);
      
      const theta = Math.random() * Math.PI * 2;
      
      const px = cx + Math.cos(theta) * r;
      const py = cy + Math.sin(theta) * r;

      // Calculate orbital velocity for circular orbit: v = sqrt(G * M / r)
      const orbitalSpeed = Math.sqrt((this.G * this.M_center) / r);
      
      // Velocity vector perpendicular to position vector
      const vx = -Math.sin(theta) * orbitalSpeed + (Math.random() - 0.5) * 0.15;
      const vy = Math.cos(theta) * orbitalSpeed + (Math.random() - 0.5) * 0.15;

      // Color scheme: Gold near center, transitioning to Cyan/Deep Blue at the edge
      const colorRatio = (r - minDistance) / (maxDistance - minDistance);
      let color;
      if (colorRatio < 0.35) {
        // Bright Gold / Hot White
        color = `hsla(${40 + colorRatio * 20}, 100%, ${70 + Math.random() * 15}%, 0.85)`;
      } else if (colorRatio < 0.7) {
        // Cyan / Ice Blue
        color = `hsla(${190 + (colorRatio - 0.35) * 40}, 95%, 68%, 0.8)`;
      } else {
        // Deep Royal Blue
        color = `hsla(${225 + (colorRatio - 0.7) * 30}, 90%, 58%, 0.65)`;
      }

      this.dust.push({
        x: px,
        y: py,
        vx: vx,
        vy: vy,
        size: Math.random() * 1.6 + 0.6,
        color: color,
        tail: [] // Store trails for premium motion blur
      });
    }

    this.ctx.fillStyle = '#040308';
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  resize(width, height) {
    super.resize(width, height);
    this.setup();
  }

  draw(ctx, time) {
    // Semi-transparent background for cosmic dust trails
    ctx.fillStyle = 'rgba(4, 3, 8, 0.14)';
    ctx.fillRect(0, 0, this.width, this.height);

    const cx = this.width / 2;
    const cy = this.height / 2;

    // Draw central star core with a powerful gold radial glow
    const grad = ctx.createRadialGradient(cx, cy, 1, cx, cy, Math.min(this.width, this.height) * 0.09);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.1, '#ffd700');
    grad.addColorStop(0.35, 'rgba(255, 165, 0, 0.2)');
    grad.addColorStop(1, 'rgba(255, 69, 0, 0)');
    ctx.beginPath();
    ctx.arc(cx, cy, Math.min(this.width, this.height) * 0.09, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Smooth spring movement for mouse body gravity
    if (this.mouse.active && this.mouse.x !== null) {
      this.mouse.rx = this.mouse.rx * 0.9 + this.mouse.x * 0.1;
      this.mouse.ry = this.mouse.ry * 0.9 + this.mouse.y * 0.1;
      this.M_mouse = this.M_mouse * 0.92 + this.targetMouseMass * 0.08;

      // Draw mouse gravitational distortion center (glowing cyan singularity)
      const mouseGrad = ctx.createRadialGradient(this.mouse.rx, this.mouse.ry, 0, this.mouse.rx, this.mouse.ry, 35);
      mouseGrad.addColorStop(0, 'rgba(0, 191, 255, 0.6)');
      mouseGrad.addColorStop(0.4, 'rgba(0, 128, 255, 0.25)');
      mouseGrad.addColorStop(1, 'rgba(0, 0, 100, 0)');
      ctx.beginPath();
      ctx.arc(this.mouse.rx, this.mouse.ry, 35, 0, Math.PI * 2);
      ctx.fillStyle = mouseGrad;
      ctx.fill();
    } else {
      this.M_mouse = this.M_mouse * 0.95; // Gravity fades out
    }

    const softCenter = 28.0; // Gravity softener for center
    const softMouse = 32.0;  // Gravity softener for mouse

    // Physics step and draw orbital dust
    this.dust.forEach(p => {
      // 1. Calculate force from central star core
      const dx_c = cx - p.x;
      const dy_c = cy - p.y;
      const r2_c = dx_c * dx_c + dy_c * dy_c;
      const dist_c = Math.sqrt(r2_c);
      
      // Acceleration: a = G * M / (r^2 + soft^2)
      const acc_c = (this.G * this.M_center) / (r2_c + softCenter * softCenter);
      let ax = (dx_c / (dist_c + 0.01)) * acc_c;
      let ay = (dy_c / (dist_c + 0.01)) * acc_c;

      // 2. Calculate force from mouse supermassive body (if active)
      if (this.M_mouse > 10) {
        const dx_m = this.mouse.rx - p.x;
        const dy_m = this.mouse.ry - p.y;
        const r2_m = dx_m * dx_m + dy_m * dy_m;
        const dist_m = Math.sqrt(r2_m);
        const acc_m = (this.G * this.M_mouse) / (r2_m + softMouse * softMouse);
        ax += (dx_m / (dist_m + 0.01)) * acc_m;
        ay += (dy_m / (dist_m + 0.01)) * acc_m;
      }

      // Update velocities
      p.vx += ax;
      p.vy += ay;

      // Velocity damping to keep accretion disk stable and structured
      p.vx *= 0.9995;
      p.vy *= 0.9995;

      // Update positions
      const prevX = p.x;
      const prevY = p.y;
      p.x += p.vx;
      p.y += p.vy;

      // Keep record of trails
      p.tail.push({ x: prevX, y: prevY });
      if (p.tail.length > 3) p.tail.shift();

      if (p.tail.length >= 2) {
        ctx.beginPath();
        ctx.moveTo(p.tail[0].x, p.tail[0].y);
        for (let t = 1; t < p.tail.length; t++) {
          ctx.lineTo(p.tail[t].x, p.tail[t].y);
        }
        ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size;
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      }
    });
  }

  destroy() {
    super.destroy();
    this.dust = [];
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
    return 'Celestial Orbit Gravity';
  }

  static get description() {
    return 'Cosmic physical simulation of an accretion disk orbiting a golden core star. Hovering and dragging the mouse adds a supermassive body into the system (like an active singularity), dynamically warping, bending, and stretching the dust streams in beautiful, physically accurate Keplerian paths.';
  }

  static get vibe() {
    return 'Cosmic';
  }

  static get sourceCode() {
    return `class CelestialOrbitGravity {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.mouse = { x: null, y: null, active: false, rx: 0, ry: 0 };
    this.dust = [];
    this.G = 0.85;
    this.M_center = 8000;
    this.M_mouse = 0;
    this.targetMouseMass = 7000;

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
    this.dust = [];
    this.mouse.rx = this.width / 2;
    this.mouse.ry = this.height / 2;

    const area = this.width * this.height;
    const count = Math.min(600, Math.floor(area / 1800));

    const cx = this.width / 2;
    const cy = this.height / 2;

    for (let i = 0; i < count; i++) {
      const minDistance = Math.min(this.width, this.height) * 0.08;
      const maxDistance = Math.min(this.width, this.height) * 0.46;
      const r = minDistance + Math.pow(Math.random(), 1.5) * (maxDistance - minDistance);
      const theta = Math.random() * Math.PI * 2;
      const px = cx + Math.cos(theta) * r;
      const py = cy + Math.sin(theta) * r;

      const orbitalSpeed = Math.sqrt((this.G * this.M_center) / r);
      const vx = -Math.sin(theta) * orbitalSpeed + (Math.random() - 0.5) * 0.15;
      const vy = Math.cos(theta) * orbitalSpeed + (Math.random() - 0.5) * 0.15;

      const colorRatio = (r - minDistance) / (maxDistance - minDistance);
      let color;
      if (colorRatio < 0.35) {
        color = \`hsla(\${40 + colorRatio * 20}, 100%, \${70 + Math.random() * 15}%, 0.85)\`;
      } else if (colorRatio < 0.7) {
        color = \`hsla(\${190 + (colorRatio - 0.35) * 40}, 95%, 68%, 0.8)\`;
      } else {
        color = \`hsla(\${225 + (colorRatio - 0.7) * 30}, 90%, 58%, 0.65)\`;
      }

      this.dust.push({
        x: px,
        y: py,
        vx: vx,
        vy: vy,
        size: Math.random() * 1.6 + 0.6,
        color: color,
        tail: []
      });
    }

    this.ctx.fillStyle = '#040308';
    this.ctx.fillRect(0, 0, this.width, this.height);
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
    this.ctx.fillStyle = 'rgba(4, 3, 8, 0.14)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    const cx = this.width / 2;
    const cy = this.height / 2;

    const grad = this.ctx.createRadialGradient(cx, cy, 1, cx, cy, Math.min(this.width, this.height) * 0.09);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.1, '#ffd700');
    grad.addColorStop(0.35, 'rgba(255, 165, 0, 0.2)');
    grad.addColorStop(1, 'rgba(255, 69, 0, 0)');
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, Math.min(this.width, this.height) * 0.09, 0, Math.PI * 2);
    this.ctx.fillStyle = grad;
    this.ctx.fill();

    if (this.mouse.active && this.mouse.x !== null) {
      this.mouse.rx = this.mouse.rx * 0.9 + this.mouse.x * 0.1;
      this.mouse.ry = this.mouse.ry * 0.9 + this.mouse.y * 0.1;
      this.M_mouse = this.M_mouse * 0.92 + this.targetMouseMass * 0.08;

      const mouseGrad = this.ctx.createRadialGradient(this.mouse.rx, this.mouse.ry, 0, this.mouse.rx, this.mouse.ry, 35);
      mouseGrad.addColorStop(0, 'rgba(0, 191, 255, 0.6)');
      mouseGrad.addColorStop(0.4, 'rgba(0, 128, 255, 0.25)');
      mouseGrad.addColorStop(1, 'rgba(0, 0, 100, 0)');
      this.ctx.beginPath();
      this.ctx.arc(this.mouse.rx, this.mouse.ry, 35, 0, Math.PI * 2);
      this.ctx.fillStyle = mouseGrad;
      this.ctx.fill();
    } else {
      this.M_mouse = this.M_mouse * 0.95;
    }

    const softCenter = 28.0;
    const softMouse = 32.0;

    this.dust.forEach(p => {
      const dx_c = cx - p.x;
      const dy_c = cy - p.y;
      const r2_c = dx_c * dx_c + dy_c * dy_c;
      const dist_c = Math.sqrt(r2_c);
      
      const acc_c = (this.G * this.M_center) / (r2_c + softCenter * softCenter);
      let ax = (dx_c / (dist_c + 0.01)) * acc_c;
      let ay = (dy_c / (dist_c + 0.01)) * acc_c;

      if (this.M_mouse > 10) {
        const dx_m = this.mouse.rx - p.x;
        const dy_m = this.mouse.ry - p.y;
        const r2_m = dx_m * dx_m + dy_m * dy_m;
        const dist_m = Math.sqrt(r2_m);
        const acc_m = (this.G * this.M_mouse) / (r2_m + softMouse * softMouse);
        ax += (dx_m / (dist_m + 0.01)) * acc_m;
        ay += (dy_m / (dist_m + 0.01)) * acc_m;
      }

      p.vx += ax;
      p.vy += ay;
      p.vx *= 0.9995;
      p.vy *= 0.9995;

      const prevX = p.x;
      const prevY = p.y;
      p.x += p.vx;
      p.y += p.vy;

      p.tail.push({ x: prevX, y: prevY });
      if (p.tail.length > 3) p.tail.shift();

      if (p.tail.length >= 2) {
        this.ctx.beginPath();
        this.ctx.moveTo(p.tail[0].x, p.tail[0].y);
        for (let t = 1; t < p.tail.length; t++) {
          this.ctx.lineTo(p.tail[t].x, p.tail[t].y);
        }
        this.ctx.lineTo(p.x, p.y);
        this.ctx.strokeStyle = p.color;
        this.ctx.lineWidth = p.size;
        this.ctx.stroke();
      } else {
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fillStyle = p.color;
        this.ctx.fill();
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
