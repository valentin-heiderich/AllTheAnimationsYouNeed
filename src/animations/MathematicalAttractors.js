import BaseAnimation from './BaseAnimation.js';

export default class MathematicalAttractors extends BaseAnimation {
  constructor() {
    super();
    this.attractors = [];
    this.mouse = { x: null, y: null, active: false };
    this.angleX = 0.3; // Auto-rotation angles
    this.angleY = 0.5;
    this.targetAngleX = 0.3;
    this.targetAngleY = 0.5;
    
    // Lorenz Attractor Parameters
    this.sigma = 10.0;
    this.rho = 28.0;
    this.beta = 8.0 / 3.0;
    this.dt = 0.005; // Time step for integration
  }

  setup() {
    this.attractors = [];
    
    // Scale count of parallel attractor traces with screen size
    const count = Math.min(12, Math.max(4, Math.floor(this.width / 250)));
    
    for (let i = 0; i < count; i++) {
      // Slightly different initial conditions to show chaotic divergence
      this.attractors.push({
        x: 0.1 + i * 0.012,
        y: 0,
        z: 0,
        history: [],
        maxHistory: 220,
        colorHue: (i * (360 / count)) % 360,
        speed: 1.0 + (i * 0.05)
      });
    }
  }

  resize(width, height) {
    super.resize(width, height);
  }

  draw(ctx, time) {
    // Elegant deep matte background
    ctx.fillStyle = '#030408';
    ctx.fillRect(0, 0, this.width, this.height);

    // Compute projection parameters
    const centerX = this.width / 2;
    const centerY = this.height / 2 + 30; // Slightly adjust down due to Lorenz vertical shift
    const scale = Math.min(this.width, this.height) * 0.15; // 3D to 2D projection scale factor

    // Update projection angles (smooth lerp toward mouse or auto-rotate)
    if (this.mouse.active && this.mouse.x !== null) {
      this.targetAngleY = ((this.mouse.x / this.width) - 0.5) * Math.PI * 1.5;
      this.targetAngleX = ((this.mouse.y / this.height) - 0.5) * Math.PI * 1.5;
    } else {
      this.targetAngleY = time * 0.0003;
      this.targetAngleX = Math.sin(time * 0.0001) * 0.4;
    }

    this.angleX += (this.targetAngleX - this.angleX) * 0.08;
    this.angleY += (this.targetAngleY - this.angleY) * 0.08;

    const cosX = Math.cos(this.angleX);
    const sinX = Math.sin(this.angleX);
    const cosY = Math.cos(this.angleY);
    const sinY = Math.sin(this.angleY);

    // Solve and update Attractors
    this.attractors.forEach((attr) => {
      // Perform multiple integration steps per frame for smooth speed
      const steps = 4;
      for (let s = 0; s < steps; s++) {
        const dx = this.sigma * (attr.y - attr.x) * this.dt * attr.speed;
        const dy = (attr.x * (this.rho - attr.z) - attr.y) * this.dt * attr.speed;
        const dz = (attr.x * attr.y - this.beta * attr.z) * this.dt * attr.speed;

        attr.x += dx;
        attr.y += dy;
        attr.z += dz;
      }

      // Add to history trail
      attr.history.push({ x: attr.x, y: attr.y, z: attr.z });
      if (attr.history.length > attr.maxHistory) {
        attr.history.shift();
      }

      // Project 3D history points to 2D screen coordinate space
      const screenPoints = attr.history.map((pt) => {
        // Shift Lorenz center coordinates for centering
        const xOffset = pt.x;
        const yOffset = pt.y;
        const zOffset = pt.z - 25; // Lorenz center of gravity is near z=25

        // Rotate around Y axis
        let x1 = xOffset * cosY - zOffset * sinY;
        let z1 = xOffset * sinY + zOffset * cosY;

        // Rotate around X axis
        let y2 = yOffset * cosX - z1 * sinX;
        let z2 = yOffset * sinX + z1 * cosX;

        // Perspective divide or simple orthographic projection
        const persp = 1 / (1 + z2 * 0.008); // Subtle perspective depth
        return {
          x: centerX + x1 * scale * persp,
          y: centerY + y2 * scale * persp,
          depth: z2
        };
      });

      // Render glowing trail with cycling rainbow colors
      if (screenPoints.length > 1) {
        for (let j = 1; j < screenPoints.length; j++) {
          const p1 = screenPoints[j - 1];
          const p2 = screenPoints[j];

          // Fade alpha toward tail of trail
          const alphaRatio = j / screenPoints.length;
          const hue = (attr.colorHue + (alphaRatio * 50) + time * 0.01) % 360;

          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          
          ctx.strokeStyle = `hsla(${hue}, 90%, 65%, ${alphaRatio * 0.65})`;
          ctx.lineWidth = alphaRatio * 3.5;
          ctx.stroke();

          // White glowing core for very tip of attractor
          if (j === screenPoints.length - 1) {
            ctx.beginPath();
            ctx.arc(p2.x, p2.y, 3.5, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.shadowBlur = 12;
            ctx.shadowColor = `hsla(${hue}, 100%, 70%, 1)`;
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
      }
    });

    ctx.globalAlpha = 1.0;
  }

  destroy() {
    super.destroy();
    this.attractors = [];
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
    return 'Mathematical Lorenz Attractors';
  }

  static get description() {
    return 'Real-time solver of chaotic Lorenz differential equations. Hover and move your cursor to rotate the 3D attractor space in real-time, viewing the complex, glowing divergence from different perspective planes.';
  }

  static get vibe() {
    return 'Complex';
  }

  static get sourceCode() {
    return `class MathematicalAttractors {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.attractors = [];
    this.mouse = { x: null, y: null, active: false };
    this.angleX = 0.3;
    this.angleY = 0.5;
    this.targetAngleX = 0.3;
    this.targetAngleY = 0.5;

    this.sigma = 10.0;
    this.rho = 28.0;
    this.beta = 8.0 / 3.0;
    this.dt = 0.005;

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
    this.attractors = [];
    const count = Math.min(12, Math.max(4, Math.floor(this.width / 250)));

    for (let i = 0; i < count; i++) {
      this.attractors.push({
        x: 0.1 + i * 0.012,
        y: 0,
        z: 0,
        history: [],
        maxHistory: 220,
        colorHue: (i * (360 / count)) % 360,
        speed: 1.0 + (i * 0.05)
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
    this.ctx.fillStyle = '#030408';
    this.ctx.fillRect(0, 0, this.width, this.height);

    const centerX = this.width / 2;
    const centerY = this.height / 2 + 30;
    const scale = Math.min(this.width, this.height) * 0.15;

    if (this.mouse.active && this.mouse.x !== null) {
      this.targetAngleY = ((this.mouse.x / this.width) - 0.5) * Math.PI * 1.5;
      this.targetAngleX = ((this.mouse.y / this.height) - 0.5) * Math.PI * 1.5;
    } else {
      this.targetAngleY = time * 0.0003;
      this.targetAngleX = Math.sin(time * 0.0001) * 0.4;
    }

    this.angleX += (this.targetAngleX - this.angleX) * 0.08;
    this.angleY += (this.targetAngleY - this.angleY) * 0.08;

    const cosX = Math.cos(this.angleX);
    const sinX = Math.sin(this.angleX);
    const cosY = Math.cos(this.angleY);
    const sinY = Math.sin(this.angleY);

    this.attractors.forEach((attr) => {
      const steps = 4;
      for (let s = 0; s < steps; s++) {
        const dx = this.sigma * (attr.y - attr.x) * this.dt * attr.speed;
        const dy = (attr.x * (this.rho - attr.z) - attr.y) * this.dt * attr.speed;
        const dz = (attr.x * attr.y - this.beta * attr.z) * this.dt * attr.speed;

        attr.x += dx;
        attr.y += dy;
        attr.z += dz;
      }

      attr.history.push({ x: attr.x, y: attr.y, z: attr.z });
      if (attr.history.length > attr.maxHistory) {
        attr.history.shift();
      }

      const screenPoints = attr.history.map((pt) => {
        const xOffset = pt.x;
        const yOffset = pt.y;
        const zOffset = pt.z - 25;

        let x1 = xOffset * cosY - zOffset * sinY;
        let z1 = xOffset * sinY + zOffset * cosY;
        let y2 = yOffset * cosX - z1 * sinX;
        let z2 = yOffset * sinX + z1 * cosX;

        const persp = 1 / (1 + z2 * 0.008);
        return {
          x: centerX + x1 * scale * persp,
          y: centerY + y2 * scale * persp
        };
      });

      if (screenPoints.length > 1) {
        for (let j = 1; j < screenPoints.length; j++) {
          const p1 = screenPoints[j - 1];
          const p2 = screenPoints[j];
          const alphaRatio = j / screenPoints.length;
          const hue = (attr.colorHue + (alphaRatio * 50) + time * 0.01) % 360;

          this.ctx.beginPath();
          this.ctx.moveTo(p1.x, p1.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.strokeStyle = \`hsla(\${hue}, 90%, 65%, \${alphaRatio * 0.65})\`;
          this.ctx.lineWidth = alphaRatio * 3.5;
          this.ctx.stroke();

          if (j === screenPoints.length - 1) {
            this.ctx.beginPath();
            this.ctx.arc(p2.x, p2.y, 3.5, 0, Math.PI * 2);
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.shadowBlur = 12;
            this.ctx.shadowColor = \`hsla(\${hue}, 100%, 70%, 1)\`;
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
          }
        }
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
