import BaseAnimation from './BaseAnimation.js';

export default class FlockingButterflies extends BaseAnimation {
  constructor() {
    super();
    this.butterflies = [];
    this.mouse = { x: null, y: null, active: false, radius: 250 };
    
    this.colorPalettes = [
      { c1: '#FF007F', c2: '#FF75A0' }, // Vibrant Pink / Rose
      { c1: '#00F0FF', c2: '#0072FF' }, // Glowing Cyan / Royal Blue
      { c1: '#FF7F00', c2: '#FFD700' }, // Gold / Orange Flame
      { c1: '#BD00FF', c2: '#7F00FF' }, // Neon Violet / Purple
      { c1: '#00FF87', c2: '#60EFFF' }  // Emerald Teal / Soft Blue
    ];
  }

  setup() {
    this.butterflies = [];
    
    // Scale swarm size with screen dimensions
    const densityFactor = 12000;
    const count = Math.min(100, Math.max(30, Math.floor((this.width * this.height) / densityFactor)));

    for (let i = 0; i < count; i++) {
      const palette = this.colorPalettes[Math.floor(Math.random() * this.colorPalettes.length)];
      this.butterflies.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 3.5,
        vy: (Math.random() - 0.5) * 3.5,
        angle: Math.random() * Math.PI * 2,
        size: Math.random() * 5 + 7, // Wingspan radius
        color1: palette.c1,
        color2: palette.c2,
        flapPhase: Math.random() * Math.PI * 2,
        flapSpeed: 0.12 + Math.random() * 0.12,
        maxSpeed: 2.2 + Math.random() * 1.2,
        maxForce: 0.08 + Math.random() * 0.06
      });
    }
  }

  resize(width, height) {
    super.resize(width, height);
    
    // Re-fit butterflies
    this.butterflies.forEach(b => {
      if (b.x > width) b.x = Math.random() * width;
      if (b.y > height) b.y = Math.random() * height;
    });
  }

  draw(ctx, time) {
    // Beautiful deep violet-night gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, this.height);
    bgGrad.addColorStop(0, '#04020a');
    bgGrad.addColorStop(1, '#0e0b1d');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Boids Simulation Loop
    this.butterflies.forEach(b => {
      // 1. Calculate Flocking Vectors (Separation, Alignment, Cohesion)
      const flockForces = this.calculateFlocking(b);
      
      // 2. Cursor Attraction Force (Boids swarm toward cursor coordinates)
      let targetForceX = 0;
      let targetForceY = 0;

      if (this.mouse.active && this.mouse.x !== null) {
        const dx = this.mouse.x - b.x;
        const dy = this.mouse.y - b.y;
        const dist = Math.hypot(dx, dy);

        // Standard seek steering behavior
        if (dist > 10) {
          const targetVx = (dx / dist) * b.maxSpeed;
          const targetVy = (dy / dist) * b.maxSpeed;
          targetForceX = (targetVx - b.vx) * 0.25;
          targetForceY = (targetVy - b.vy) * 0.25;
        }
      } else {
        // Wandering flow drift when mouse is inactive
        const wanderAngle = Math.sin(b.x * 0.005 + time * 0.0002) * Math.cos(b.y * 0.005 - time * 0.00025) * Math.PI * 1.5;
        targetForceX = Math.cos(wanderAngle) * 0.12;
        targetForceY = Math.sin(wanderAngle) * 0.12;
      }

      // Combine forces
      b.vx += flockForces.sepX * 1.5 + flockForces.aliX * 1.0 + flockForces.cohX * 1.0 + targetForceX * 1.6;
      b.vy += flockForces.sepY * 1.5 + flockForces.aliY * 1.0 + flockForces.cohY * 1.0 + targetForceY * 1.6;

      // Limit speed
      const currentSpeed = Math.hypot(b.vx, b.vy);
      if (currentSpeed > b.maxSpeed) {
        b.vx = (b.vx / currentSpeed) * b.maxSpeed;
        b.vy = (b.vy / currentSpeed) * b.maxSpeed;
      }

      // Move boid
      b.x += b.vx;
      b.y += b.vy;

      // Update orientation angle towards velocity direction
      b.angle = Math.atan2(b.vy, b.vx);

      // Boundary Wrap-around with a margin
      const margin = 30;
      if (b.x < -margin) b.x = this.width + margin;
      if (b.x > this.width + margin) b.x = -margin;
      if (b.y < -margin) b.y = this.height + margin;
      if (b.y > this.height + margin) b.y = -margin;

      // 3. Render Butterfly with flapping wings transform
      b.flapPhase += b.flapSpeed;
      // 3D Perspective flapping wing factor: scale the wings horizontally
      // Math.abs(Math.sin) oscillates wings together outwards/inwards
      const wingScaleX = Math.max(0.12, Math.abs(Math.sin(b.flapPhase)));

      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.angle + Math.PI / 2); // Rotate to point head forwards (butterfly is drawn pointing UP)

      // Draw wings outer glow
      ctx.shadowBlur = 12;
      ctx.shadowColor = b.color1;

      // LEFT WINGS (scaled leftwards)
      ctx.save();
      ctx.scale(-wingScaleX, 1.0);
      this.drawWings(ctx, b.size, b.color1, b.color2);
      ctx.restore();

      // RIGHT WINGS (scaled rightwards)
      ctx.save();
      ctx.scale(wingScaleX, 1.0);
      this.drawWings(ctx, b.size, b.color1, b.color2);
      ctx.restore();

      // Disable shadow blur for body for high performance
      ctx.shadowBlur = 0;

      // Draw Butterfly Body
      ctx.fillStyle = '#110D18';
      ctx.beginPath();
      // Abdomen
      ctx.ellipse(0, 2, b.size * 0.16, b.size * 0.65, 0, 0, Math.PI * 2);
      // Head
      ctx.arc(0, -b.size * 0.6, b.size * 0.18, 0, Math.PI * 2);
      ctx.fill();

      // Draw antennae
      ctx.strokeStyle = '#221930';
      ctx.lineWidth = 0.85;
      ctx.beginPath();
      ctx.moveTo(-0.5, -b.size * 0.6);
      ctx.quadraticCurveTo(-b.size * 0.3, -b.size * 1.1, -b.size * 0.45, -b.size * 1.25);
      ctx.moveTo(0.5, -b.size * 0.6);
      ctx.quadraticCurveTo(b.size * 0.3, -b.size * 1.1, b.size * 0.45, -b.size * 1.25);
      ctx.stroke();

      ctx.restore();
    });

    ctx.shadowBlur = 0; // cleanup global context state
    ctx.globalAlpha = 1.0;
  }

  // Draw two wings (forewing and hindwing) on one side
  drawWings(ctx, size, color1, color2) {
    const wingGrad = ctx.createLinearGradient(0, 0, size * 1.4, -size * 0.6);
    wingGrad.addColorStop(0, color1);
    wingGrad.addColorStop(1, color2);
    ctx.fillStyle = wingGrad;

    // Forewing (Upper, larger wing)
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.15);
    ctx.bezierCurveTo(size * 0.6, -size * 1.25, size * 1.75, -size * 0.85, size * 1.3, size * 0.05);
    ctx.bezierCurveTo(size * 0.9, size * 0.25, size * 0.3, size * 0.1, 0, -size * 0.15);
    ctx.closePath();
    ctx.fill();

    // Hindwing (Lower, smaller wing)
    ctx.beginPath();
    ctx.moveTo(0, size * 0.1);
    ctx.bezierCurveTo(size * 0.4, size * 0.1, size * 1.2, size * 0.4, size * 0.85, size * 0.85);
    ctx.bezierCurveTo(size * 0.55, size * 1.15, size * 0.15, size * 0.7, 0, size * 0.2);
    ctx.closePath();
    ctx.fill();
    
    // Add glowing wing borders
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 0.55;
    ctx.globalAlpha = 0.45;
    ctx.stroke();
    ctx.globalAlpha = 1.0;
  }

  // Craig Reynolds flocking algorithm (separation, alignment, cohesion)
  calculateFlocking(boid) {
    let sepX = 0, sepY = 0;
    let aliX = 0, aliY = 0;
    let cohX = 0, cohY = 0;

    let sepCount = 0;
    let neighborCount = 0;

    const sepDist = boid.size * 2.8; // comfort zone distance
    const flockDist = boid.size * 6.5; // neighborhood visibility

    this.butterflies.forEach(other => {
      if (other === boid) return;

      const dx = other.x - boid.x;
      const dy = other.y - boid.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 0 && dist < flockDist) {
        neighborCount++;
        
        // Alignment accumulation
        aliX += other.vx;
        aliY += other.vy;

        // Cohesion accumulation
        cohX += other.x;
        cohY += other.y;

        // Separation (inverse distance push)
        if (dist < sepDist) {
          sepCount++;
          sepX += (boid.x - other.x) / dist;
          sepY += (boid.y - other.y) / dist;
        }
      }
    });

    // Average flocking forces
    if (neighborCount > 0) {
      // Alignment
      aliX = aliX / neighborCount;
      aliY = aliY / neighborCount;
      const aliLength = Math.hypot(aliX, aliY);
      if (aliLength > 0) {
        aliX = ((aliX / aliLength) * boid.maxSpeed - boid.vx) * boid.maxForce;
        aliY = ((aliY / aliLength) * boid.maxSpeed - boid.vy) * boid.maxForce;
      }

      // Cohesion (seek the center of mass of neighbors)
      cohX = cohX / neighborCount;
      cohY = cohY / neighborCount;
      const cohDx = cohX - boid.x;
      const cohDy = cohY - boid.y;
      const cohDist = Math.hypot(cohDx, cohDy);
      if (cohDist > 0) {
        cohX = ((cohDx / cohDist) * boid.maxSpeed - boid.vx) * boid.maxForce;
        cohY = ((cohDy / cohDist) * boid.maxSpeed - boid.vy) * boid.maxForce;
      }
    }

    if (sepCount > 0) {
      sepX = sepX / sepCount;
      sepY = sepY / sepCount;
      const sepLength = Math.hypot(sepX, sepY);
      if (sepLength > 0) {
        sepX = ((sepX / sepLength) * boid.maxSpeed - boid.vx) * boid.maxForce;
        sepY = ((sepY / sepLength) * boid.maxSpeed - boid.vy) * boid.maxForce;
      }
    }

    return { sepX, sepY, aliX, aliY, cohX, cohY };
  }

  destroy() {
    this.butterflies = [];
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
    return 'Flocking Butterflies';
  }

  static get description() {
    return 'A swarm of glowing colorful butterflies flapping their wings in beautiful 3D perspective scales. Standard Craig Reynolds boid dynamics control their separation, alignment, and cohesion, guiding the swarm into dynamic flight patterns toward the cursor coordinates.';
  }

  static get vibe() {
    return 'Simulated';
  }

  static get sourceCode() {
    return `class FlockingButterflies {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.butterflies = [];
    this.mouse = { x: null, y: null, active: false, radius: 250 };
    
    this.colorPalettes = [
      { c1: '#FF007F', c2: '#FF75A0' },
      { c1: '#00F0FF', c2: '#0072FF' },
      { c1: '#FF7F00', c2: '#FFD700' },
      { c1: '#BD00FF', c2: '#7F00FF' },
      { c1: '#00FF87', c2: '#60EFFF' }
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
    this.butterflies = [];
    const densityFactor = 12000;
    const count = Math.min(100, Math.max(30, Math.floor((this.width * this.height) / densityFactor)));

    for (let i = 0; i < count; i++) {
      const palette = this.colorPalettes[Math.floor(Math.random() * this.colorPalettes.length)];
      this.butterflies.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 3.5,
        vy: (Math.random() - 0.5) * 3.5,
        angle: Math.random() * Math.PI * 2,
        size: Math.random() * 5 + 7,
        color1: palette.c1,
        color2: palette.c2,
        flapPhase: Math.random() * Math.PI * 2,
        flapSpeed: 0.12 + Math.random() * 0.12,
        maxSpeed: 2.2 + Math.random() * 1.2,
        maxForce: 0.08 + Math.random() * 0.06
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

    this.butterflies.forEach(b => {
      if (b.x > this.width) b.x = Math.random() * this.width;
      if (b.y > this.height) b.y = Math.random() * this.height;
    });
  }

  animate(time = 0) {
    const bgGrad = this.ctx.createLinearGradient(0, 0, 0, this.height);
    bgGrad.addColorStop(0, '#04020a');
    bgGrad.addColorStop(1, '#0e0b1d');
    this.ctx.fillStyle = bgGrad;
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.butterflies.forEach(b => {
      const flockForces = this.calculateFlocking(b);
      let targetForceX = 0;
      let targetForceY = 0;

      if (this.mouse.active && this.mouse.x !== null) {
        const dx = this.mouse.x - b.x;
        const dy = this.mouse.y - b.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 10) {
          const targetVx = (dx / dist) * b.maxSpeed;
          const targetVy = (dy / dist) * b.maxSpeed;
          targetForceX = (targetVx - b.vx) * 0.25;
          targetForceY = (targetVy - b.vy) * 0.25;
        }
      } else {
        const wanderAngle = Math.sin(b.x * 0.005 + time * 0.0002) * Math.cos(b.y * 0.005 - time * 0.00025) * Math.PI * 1.5;
        targetForceX = Math.cos(wanderAngle) * 0.12;
        targetForceY = Math.sin(wanderAngle) * 0.12;
      }

      b.vx += flockForces.sepX * 1.5 + flockForces.aliX * 1.0 + flockForces.cohX * 1.0 + targetForceX * 1.6;
      b.vy += flockForces.sepY * 1.5 + flockForces.aliY * 1.0 + flockForces.cohY * 1.0 + targetForceY * 1.6;

      const currentSpeed = Math.hypot(b.vx, b.vy);
      if (currentSpeed > b.maxSpeed) {
        b.vx = (b.vx / currentSpeed) * b.maxSpeed;
        b.vy = (b.vy / currentSpeed) * b.maxSpeed;
      }

      b.x += b.vx;
      b.y += b.vy;
      b.angle = Math.atan2(b.vy, b.vx);

      const margin = 30;
      if (b.x < -margin) b.x = this.width + margin;
      if (b.x > this.width + margin) b.x = -margin;
      if (b.y < -margin) b.y = this.height + margin;
      if (b.y > this.height + margin) b.y = -margin;

      b.flapPhase += b.flapSpeed;
      const wingScaleX = Math.max(0.12, Math.abs(Math.sin(b.flapPhase)));

      this.ctx.save();
      this.ctx.translate(b.x, b.y);
      this.ctx.rotate(b.angle + Math.PI / 2);

      this.ctx.shadowBlur = 12;
      this.ctx.shadowColor = b.color1;

      this.ctx.save();
      this.ctx.scale(-wingScaleX, 1.0);
      this.drawWings(b.size, b.color1, b.color2);
      this.ctx.restore();

      this.ctx.save();
      this.ctx.scale(wingScaleX, 1.0);
      this.drawWings(b.size, b.color1, b.color2);
      this.ctx.restore();

      this.ctx.shadowBlur = 0;

      this.ctx.fillStyle = '#110D18';
      this.ctx.beginPath();
      this.ctx.ellipse(0, 2, b.size * 0.16, b.size * 0.65, 0, 0, Math.PI * 2);
      this.ctx.arc(0, -b.size * 0.6, b.size * 0.18, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.strokeStyle = '#221930';
      this.ctx.lineWidth = 0.85;
      this.ctx.beginPath();
      this.ctx.moveTo(-0.5, -b.size * 0.6);
      this.ctx.quadraticCurveTo(-b.size * 0.3, -b.size * 1.1, -b.size * 0.45, -b.size * 1.25);
      this.ctx.moveTo(0.5, -b.size * 0.6);
      this.ctx.quadraticCurveTo(b.size * 0.3, -b.size * 1.1, b.size * 0.45, -b.size * 1.25);
      this.ctx.stroke();

      this.ctx.restore();
    });

    this.ctx.shadowBlur = 0;
    this.ctx.globalAlpha = 1.0;
    requestAnimationFrame((t) => this.animate(t));
  }

  drawWings(size, color1, color2) {
    const wingGrad = this.ctx.createLinearGradient(0, 0, size * 1.4, -size * 0.6);
    wingGrad.addColorStop(0, color1);
    wingGrad.addColorStop(1, color2);
    this.ctx.fillStyle = wingGrad;

    this.ctx.beginPath();
    this.ctx.moveTo(0, -size * 0.15);
    this.ctx.bezierCurveTo(size * 0.6, -size * 1.25, size * 1.75, -size * 0.85, size * 1.3, size * 0.05);
    this.ctx.bezierCurveTo(size * 0.9, size * 0.25, size * 0.3, size * 0.1, 0, -size * 0.15);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.moveTo(0, size * 0.1);
    this.ctx.bezierCurveTo(size * 0.4, size * 0.1, size * 1.2, size * 0.4, size * 0.85, size * 0.85);
    this.ctx.bezierCurveTo(size * 0.55, size * 1.15, size * 0.15, size * 0.7, 0, size * 0.2);
    this.ctx.closePath();
    this.ctx.fill();
    
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.lineWidth = 0.55;
    this.ctx.globalAlpha = 0.45;
    this.ctx.stroke();
    this.ctx.globalAlpha = 1.0;
  }

  calculateFlocking(boid) {
    let sepX = 0, sepY = 0;
    let aliX = 0, aliY = 0;
    let cohX = 0, cohY = 0;

    let sepCount = 0;
    let neighborCount = 0;

    const sepDist = boid.size * 2.8;
    const flockDist = boid.size * 6.5;

    this.butterflies.forEach(other => {
      if (other === boid) return;

      const dx = other.x - boid.x;
      const dy = other.y - boid.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 0 && dist < flockDist) {
        neighborCount++;
        aliX += other.vx;
        aliY += other.vy;
        cohX += other.x;
        cohY += other.y;

        if (dist < sepDist) {
          sepCount++;
          sepX += (boid.x - other.x) / dist;
          sepY += (boid.y - other.y) / dist;
        }
      }
    });

    if (neighborCount > 0) {
      aliX = aliX / neighborCount;
      aliY = aliY / neighborCount;
      const aliLength = Math.hypot(aliX, aliY);
      if (aliLength > 0) {
        aliX = ((aliX / aliLength) * boid.maxSpeed - boid.vx) * boid.maxForce;
        aliY = ((aliY / aliLength) * boid.maxSpeed - boid.vy) * boid.maxForce;
      }

      cohX = cohX / neighborCount;
      cohY = cohY / neighborCount;
      const cohDx = cohX - boid.x;
      const cohDy = cohY - boid.y;
      const cohDist = Math.hypot(cohDx, cohDy);
      if (cohDist > 0) {
        cohX = ((cohDx / cohDist) * boid.maxSpeed - boid.vx) * boid.maxForce;
        cohY = ((cohDy / cohDist) * boid.maxSpeed - boid.vy) * boid.maxForce;
      }
    }

    if (sepCount > 0) {
      sepX = sepX / sepCount;
      sepY = sepY / sepCount;
      const sepLength = Math.hypot(sepX, sepY);
      if (sepLength > 0) {
        sepX = ((sepX / sepLength) * boid.maxSpeed - boid.vx) * boid.maxForce;
        sepY = ((sepY / sepLength) * boid.maxSpeed - boid.vy) * boid.maxForce;
      }
    }

    return { sepX, sepY, aliX, aliY, cohX, cohY };
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
