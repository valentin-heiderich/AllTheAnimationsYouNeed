import BaseAnimation from './BaseAnimation.js';

export default class FloatingAutumnLeaves extends BaseAnimation {
  constructor() {
    super();
    this.leaves = [];
    this.mouse = { x: null, y: null, active: false, radius: 150 };
    
    // Rich autumn forest palette
    this.colors = {
      bg: '#140c08', // Deep earthy black-brown
      maple: ['#b83321', '#df5b33', '#e0391d'], // Fiery Red
      oak: ['#c18b33', '#ddab4b', '#a26620'], // Rusty Gold
      birch: ['#ebd258', '#f8e47c', '#d3b22e'] // Radiant Yellow
    };
  }

  setup() {
    this.leaves = [];
    // Scale density based on screen dimensions
    const count = Math.min(100, Math.max(30, Math.floor((this.width * this.height) / 14000)));

    for (let i = 0; i < count; i++) {
      this.leaves.push(this.createLeaf(true));
    }
  }

  createLeaf(randomizeY = false) {
    const types = ['maple', 'oak', 'birch'];
    const type = types[Math.floor(Math.random() * types.length)];
    const colorArray = this.colors[type];
    
    return {
      x: Math.random() * this.width,
      y: randomizeY ? Math.random() * this.height : -50,
      scale: 0.45 + Math.random() * 0.45,
      type: type,
      color: colorArray[Math.floor(Math.random() * colorArray.length)],
      
      // Steady drift physics
      vx: -0.8 + Math.random() * 0.4, // Bias drift to the left (wind)
      vy: 0.9 + Math.random() * 1.2, // Gravity fall rate
      
      // Dynamic 3D rotational mechanics
      rx: Math.random() * Math.PI * 2, // Pitch
      ry: Math.random() * Math.PI * 2, // Yaw (controls width narrowing)
      rz: Math.random() * Math.PI * 2, // Roll (planar rotation angle)
      
      // Dynamic spin speed offsets
      vrx: 0.005 + Math.random() * 0.015,
      vry: 0.01 + Math.random() * 0.02,
      vrz: -0.01 + Math.random() * 0.02,
      
      // Sway factors
      swayFreq: 0.015 + Math.random() * 0.015,
      swayAmp: 1.2 + Math.random() * 1.8,
      swayPhase: Math.random() * Math.PI * 2
    };
  }

  resize(width, height) {
    super.resize(width, height);
    this.setup();
  }

  draw(ctx, time) {
    // 1. Shimmering earth atmosphere backdrop
    ctx.fillStyle = this.colors.bg;
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Render each floating leaf
    this.leaves.forEach(lf => {
      lf.swayPhase += lf.swayFreq;

      // Natural pendulum sway motion added to drift
      const currentSway = Math.sin(lf.swayPhase) * lf.swayAmp;
      
      let targetVx = lf.vx + currentSway * 0.15;
      let targetVy = lf.vy + Math.cos(lf.swayPhase) * 0.1;

      let extraVrx = 0;
      let extraVry = 0;
      let extraVrz = 0;

      // 3. Mouse Interaction (Air Drag Vortex)
      if (this.mouse.active && this.mouse.x !== null) {
        const dx = lf.x - this.mouse.x;
        const dy = lf.y - this.mouse.y;
        const dist = Math.hypot(dx, dy);

        if (dist < this.mouse.radius) {
          const force = (this.mouse.radius - dist) / this.mouse.radius;
          
          // Tangent vectors for rotational vortex currents
          const angle = Math.atan2(dy, dx);
          const vortexAngle = angle + Math.PI / 2; // Perpendicular vortex path
          
          const vortexStrength = force * 6.5;
          targetVx += Math.cos(vortexAngle) * vortexStrength + Math.cos(angle) * force * 2.0;
          targetVy += Math.sin(vortexAngle) * vortexStrength + Math.sin(angle) * force * 2.0;

          // Highly excited 3D tumbling torque from local air drag
          extraVrx = force * 0.22;
          extraVry = force * 0.35;
          extraVrz = force * 0.15;
        }
      }

      // Smooth step positioning and rotation advancement
      lf.x += targetVx;
      lf.y += targetVy;

      lf.rx += lf.vrx + extraVrx;
      lf.ry += lf.vry + extraVry;
      lf.rz += lf.vrz + extraVrz;

      // Bound wrapping
      if (lf.y > this.height + 40) {
        // Reset back to top
        const resetLeaf = this.createLeaf(false);
        Object.assign(lf, resetLeaf);
      }
      if (lf.x < -40) lf.x = this.width + 40;
      if (lf.x > this.width + 40) lf.x = -40;

      // 4. Render the leaf with simulated 3D projection
      ctx.save();
      ctx.translate(lf.x, lf.y);
      ctx.rotate(lf.rz);
      
      // Perform 3D foreshortening by mapping y/x rotations to 2D scales!
      // This creates an incredibly beautiful tumbling effect.
      const scaleX = lf.scale * Math.cos(lf.ry);
      const scaleY = lf.scale * Math.cos(lf.rx);
      ctx.scale(Math.abs(scaleX) > 0.05 ? scaleX : 0.05, Math.abs(scaleY) > 0.05 ? scaleY : 0.05);

      this.drawLeafShape(ctx, lf.type, lf.color);

      ctx.restore();
    });
  }

  drawLeafShape(ctx, type, color) {
    ctx.fillStyle = color;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.lineWidth = 1.2;

    ctx.beginPath();
    if (type === 'maple') {
      // 5-Lobed jagged maple leaf path
      ctx.moveTo(0, 0);
      ctx.lineTo(-4, -12);
      ctx.lineTo(-20, -14);
      ctx.lineTo(-12, -26);
      ctx.lineTo(-28, -35);
      ctx.lineTo(-10, -42);
      ctx.lineTo(0, -62); // Top apex tip
      ctx.lineTo(10, -42);
      ctx.lineTo(28, -35);
      ctx.lineTo(12, -26);
      ctx.lineTo(20, -14);
      ctx.lineTo(4, -12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Stem and veins
      ctx.beginPath();
      ctx.moveTo(0, 8);
      ctx.lineTo(0, -50);
      ctx.moveTo(0, -20);
      ctx.lineTo(-15, -30);
      ctx.moveTo(0, -20);
      ctx.lineTo(15, -30);
      ctx.moveTo(0, -35);
      ctx.lineTo(-10, -45);
      ctx.moveTo(0, -35);
      ctx.lineTo(10, -45);
      ctx.strokeStyle = 'rgba(255,255,255,0.22)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

    } else if (type === 'oak') {
      // Symmetrical lobed oak leaf path
      ctx.moveTo(0, 15);
      ctx.quadraticCurveTo(-15, 8, -12, -5);
      ctx.quadraticCurveTo(-22, -10, -14, -22);
      ctx.quadraticCurveTo(-24, -28, -10, -40);
      ctx.quadraticCurveTo(-15, -48, 0, -56); // Tip
      ctx.quadraticCurveTo(15, -48, 10, -40);
      ctx.quadraticCurveTo(24, -28, 14, -22);
      ctx.quadraticCurveTo(22, -10, 12, -5);
      ctx.quadraticCurveTo(15, 8, 0, 15);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Stem and veins
      ctx.beginPath();
      ctx.moveTo(0, 20);
      ctx.lineTo(0, -48);
      for (let offset = -30; offset <= 0; offset += 15) {
        ctx.moveTo(0, offset);
        ctx.lineTo(-10, offset - 8);
        ctx.moveTo(0, offset);
        ctx.lineTo(10, offset - 8);
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 1.3;
      ctx.stroke();

    } else {
      // Elegant spade-shaped serrated birch leaf path
      ctx.moveTo(0, 10);
      ctx.quadraticCurveTo(-18, 0, -18, -25);
      ctx.lineTo(-12, -35);
      ctx.quadraticCurveTo(-14, -42, 0, -52); // Tip
      ctx.quadraticCurveTo(14, -42, 12, -35);
      ctx.lineTo(18, -25);
      ctx.quadraticCurveTo(18, 0, 0, 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Stem and veins
      ctx.beginPath();
      ctx.moveTo(0, 16);
      ctx.lineTo(0, -46);
      for (let offset = -28; offset <= -8; offset += 10) {
        ctx.moveTo(0, offset);
        ctx.lineTo(-10, offset - 8);
        ctx.moveTo(0, offset);
        ctx.lineTo(10, offset - 8);
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
  }

  destroy() {
    this.leaves = [];
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
    return 'Floating Autumn Leaves';
  }

  static get description() {
    return 'Detailed maple, oak, and birch styled leaves drifting down with complex 3D-simulated roll, pitch, and yaw rotations. Moving the cursor forms atmospheric vortexes, causing nearby foliage to spiral and spin in responsive drag currents.';
  }

  static get vibe() {
    return 'Natural';
  }

  static get sourceCode() {
    return `class FloatingAutumnLeaves {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.leaves = [];
    this.mouse = { x: null, y: null, active: false, radius: 150 };
    
    this.colors = {
      bg: '#140c08',
      maple: ['#b83321', '#df5b33', '#e0391d'],
      oak: ['#c18b33', '#ddab4b', '#a26620'],
      birch: ['#ebd258', '#f8e47c', '#d3b22e']
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
    this.leaves = [];
    const count = Math.min(100, Math.max(30, Math.floor((this.width * this.height) / 14000)));
    for (let i = 0; i < count; i++) {
      this.leaves.push(this.createLeaf(true));
    }
  }

  createLeaf(randomizeY = false) {
    const types = ['maple', 'oak', 'birch'];
    const type = types[Math.floor(Math.random() * types.length)];
    const colorArray = this.colors[type];
    
    return {
      x: Math.random() * this.width,
      y: randomizeY ? Math.random() * this.height : -50,
      scale: 0.45 + Math.random() * 0.45,
      type: type,
      color: colorArray[Math.floor(Math.random() * colorArray.length)],
      vx: -0.8 + Math.random() * 0.4,
      vy: 0.9 + Math.random() * 1.2,
      rx: Math.random() * Math.PI * 2,
      ry: Math.random() * Math.PI * 2,
      rz: Math.random() * Math.PI * 2,
      vrx: 0.005 + Math.random() * 0.015,
      vry: 0.01 + Math.random() * 0.02,
      vrz: -0.01 + Math.random() * 0.02,
      swayFreq: 0.015 + Math.random() * 0.015,
      swayAmp: 1.2 + Math.random() * 1.8,
      swayPhase: Math.random() * Math.PI * 2
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
    this.ctx.fillStyle = this.colors.bg;
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.leaves.forEach(lf => {
      lf.swayPhase += lf.swayFreq;
      const currentSway = Math.sin(lf.swayPhase) * lf.swayAmp;
      
      let targetVx = lf.vx + currentSway * 0.15;
      let targetVy = lf.vy + Math.cos(lf.swayPhase) * 0.1;

      let extraVrx = 0;
      let extraVry = 0;
      let extraVrz = 0;

      if (this.mouse.active && this.mouse.x !== null) {
        const dx = lf.x - this.mouse.x;
        const dy = lf.y - this.mouse.y;
        const dist = Math.hypot(dx, dy);

        if (dist < this.mouse.radius) {
          const force = (this.mouse.radius - dist) / this.mouse.radius;
          const angle = Math.atan2(dy, dx);
          const vortexAngle = angle + Math.PI / 2;
          const vortexStrength = force * 6.5;
          targetVx += Math.cos(vortexAngle) * vortexStrength + Math.cos(angle) * force * 2.0;
          targetVy += Math.sin(vortexAngle) * vortexStrength + Math.sin(angle) * force * 2.0;
          extraVrx = force * 0.22;
          extraVry = force * 0.35;
          extraVrz = force * 0.15;
        }
      }

      lf.x += targetVx;
      lf.y += targetVy;
      lf.rx += lf.vrx + extraVrx;
      lf.ry += lf.vry + extraVry;
      lf.rz += lf.vrz + extraVrz;

      if (lf.y > this.height + 40) {
        const resetLeaf = this.createLeaf(false);
        Object.assign(lf, resetLeaf);
      }
      if (lf.x < -40) lf.x = this.width + 40;
      if (lf.x > this.width + 40) lf.x = -40;

      this.ctx.save();
      this.ctx.translate(lf.x, lf.y);
      this.ctx.rotate(lf.rz);
      
      const scaleX = lf.scale * Math.cos(lf.ry);
      const scaleY = lf.scale * Math.cos(lf.rx);
      this.ctx.scale(Math.abs(scaleX) > 0.05 ? scaleX : 0.05, Math.abs(scaleY) > 0.05 ? scaleY : 0.05);

      this.drawLeafShape(lf.type, lf.color);
      this.ctx.restore();
    });

    requestAnimationFrame((t) => this.animate(t));
  }

  drawLeafShape(type, color) {
    this.ctx.fillStyle = color;
    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
    this.ctx.lineWidth = 1.2;
    this.ctx.beginPath();

    if (type === 'maple') {
      this.ctx.moveTo(0, 0);
      this.ctx.lineTo(-4, -12);
      this.ctx.lineTo(-20, -14);
      this.ctx.lineTo(-12, -26);
      this.ctx.lineTo(-28, -35);
      this.ctx.lineTo(-10, -42);
      this.ctx.lineTo(0, -62);
      this.ctx.lineTo(10, -42);
      this.ctx.lineTo(28, -35);
      this.ctx.lineTo(12, -26);
      this.ctx.lineTo(20, -14);
      this.ctx.lineTo(4, -12);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();

      this.ctx.beginPath();
      this.ctx.moveTo(0, 8);
      this.ctx.lineTo(0, -50);
      this.ctx.moveTo(0, -20);
      this.ctx.lineTo(-15, -30);
      this.ctx.moveTo(0, -20);
      this.ctx.lineTo(15, -30);
      this.ctx.moveTo(0, -35);
      this.ctx.lineTo(-10, -45);
      this.ctx.moveTo(0, -35);
      this.ctx.lineTo(10, -45);
      this.ctx.strokeStyle = 'rgba(255,255,255,0.22)';
      this.ctx.lineWidth = 1.5;
      this.ctx.stroke();
    } else if (type === 'oak') {
      this.ctx.moveTo(0, 15);
      this.ctx.quadraticCurveTo(-15, 8, -12, -5);
      this.ctx.quadraticCurveTo(-22, -10, -14, -22);
      this.ctx.quadraticCurveTo(-24, -28, -10, -40);
      this.ctx.quadraticCurveTo(-15, -48, 0, -56);
      this.ctx.quadraticCurveTo(15, -48, 10, -40);
      this.ctx.quadraticCurveTo(24, -28, 14, -22);
      this.ctx.quadraticCurveTo(22, -10, 12, -5);
      this.ctx.quadraticCurveTo(15, 8, 0, 15);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();

      this.ctx.beginPath();
      this.ctx.moveTo(0, 20);
      this.ctx.lineTo(0, -48);
      for (let offset = -30; offset <= 0; offset += 15) {
        this.ctx.moveTo(0, offset);
        this.ctx.lineTo(-10, offset - 8);
        this.ctx.moveTo(0, offset);
        this.ctx.lineTo(10, offset - 8);
      }
      this.ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      this.ctx.lineWidth = 1.3;
      this.ctx.stroke();
    } else {
      this.ctx.moveTo(0, 10);
      this.ctx.quadraticCurveTo(-18, 0, -18, -25);
      this.ctx.lineTo(-12, -35);
      this.ctx.quadraticCurveTo(-14, -42, 0, -52);
      this.ctx.quadraticCurveTo(14, -42, 12, -35);
      this.ctx.lineTo(18, -25);
      this.ctx.quadraticCurveTo(18, 0, 0, 10);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();

      this.ctx.beginPath();
      this.ctx.moveTo(0, 16);
      this.ctx.lineTo(0, -46);
      for (let offset = -28; offset <= -8; offset += 10) {
        this.ctx.moveTo(0, offset);
        this.ctx.lineTo(-10, offset - 8);
        this.ctx.moveTo(0, offset);
        this.ctx.lineTo(10, offset - 8);
      }
      this.ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      this.ctx.lineWidth = 1.2;
      this.ctx.stroke();
    }
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
