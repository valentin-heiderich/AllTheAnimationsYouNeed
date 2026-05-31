import BaseAnimation from './BaseAnimation.js';

export default class BendingVineIvy extends BaseAnimation {
  constructor() {
    super();
    this.vines = [];
    this.mouse = { x: null, y: null, active: false };
    
    // Organic forest vegetation palette
    this.colors = {
      bg: '#080d09', // Damp midnight green
      stem: '#1b2d1d', // Woody stem
      leafBase: '#1f592f', // Dark ivy green
      leafMid: '#398b4f', // Lush spring green
      leafTip: '#79c882', // Tender sprout green
      bud: '#bd6a82' // Tiny magenta-pink bloom buds
    };
  }

  setup() {
    this.vines = [];
    // Sprout a few primary stems spaced along the bottom
    const densityFactor = 120000;
    const startCount = Math.min(5, Math.max(2, Math.floor((this.width * this.height) / densityFactor)));
    
    for (let i = 0; i < startCount; i++) {
      const startX = this.width * (0.2 + 0.6 * (i / (startCount - 1 || 1)));
      this.spawnVine(startX, this.height + 10, -Math.PI / 2, 0.45);
    }
  }

  spawnVine(x, y, angle, thickness) {
    if (this.vines.length > 25) return; // Prevent excessive performance drain
    
    this.vines.push({
      points: [{ x, y }],
      currentX: x,
      currentY: y,
      angle: angle,
      thickness: thickness,
      active: true,
      age: 0,
      maxAge: 160 + Math.random() * 200,
      leaves: [],
      lastLeafDist: 0,
      speed: 1.8 + Math.random() * 1.2
    });
  }

  resize(width, height) {
    super.resize(width, height);
    this.setup();
  }

  draw(ctx, time) {
    // 1. Sleek organic moss-dark background
    ctx.fillStyle = this.colors.bg;
    ctx.fillRect(0, 0, this.width, this.height);

    const windSway = Math.sin(time * 0.0012) * 0.05;

    // 2. Grow and update each vine
    this.vines.forEach(v => {
      if (v.active) {
        v.age++;
        
        // Heliotropism: attract growth tip to mouse cursor (the sun)
        let targetAngle = v.angle;
        if (this.mouse.active && this.mouse.x !== null) {
          const dx = this.mouse.x - v.currentX;
          const dy = this.mouse.y - v.currentY;
          const dist = Math.hypot(dx, dy);
          
          if (dist > 20) {
            const angleToMouse = Math.atan2(dy, dx);
            // Strong attraction to the "sun" light
            targetAngle = angleToMouse;
          }
        } else {
          // Default upwards creep with winding curvature
          targetAngle = -Math.PI / 2 + Math.sin(v.age * 0.05) * 0.35;
        }

        // Smooth angle adjustments + random natural noise
        v.angle += (targetAngle - v.angle) * 0.08;
        v.angle += (Math.random() - 0.5) * 0.22;

        // Move active tip coordinates forward
        const prevX = v.currentX;
        const prevY = v.currentY;
        v.currentX += Math.cos(v.angle) * v.speed;
        v.currentY += Math.sin(v.angle) * v.speed;

        v.points.push({ x: v.currentX, y: v.currentY });

        // Sprout leaves at periodic intervals along the stem growth distance
        const segmentDist = Math.hypot(v.currentX - prevX, v.currentY - prevY);
        v.lastLeafDist += segmentDist;
        if (v.lastLeafDist > 18) {
          v.lastLeafDist = 0;
          
          // Alternate left and right leaves
          const leafSide = v.leaves.length % 2 === 0 ? 1 : -1;
          const leafAngle = v.angle + (Math.PI / 2.2) * leafSide;
          
          v.leaves.push({
            x: v.currentX,
            y: v.currentY,
            angle: leafAngle,
            scale: 0.01, // Starts as a tiny bud
            targetScale: 0.45 + Math.random() * 0.45,
            growSpeed: 0.018 + Math.random() * 0.015,
            side: leafSide,
            bloomProgress: 0
          });
        }

        // Branching mechanism
        if (v.age > 40 && Math.random() < 0.012 && this.vines.length < 20) {
          // Sprout a new branching offshoot at a perpendicular angle
          const branchSide = Math.random() > 0.5 ? 1 : -1;
          const branchAngle = v.angle + (Math.PI / 4) * branchSide;
          this.spawnVine(v.currentX, v.currentY, branchAngle, v.thickness * 0.7);
        }

        // Deactivate vine if it gets too old or runs off screen boundaries
        if (v.age >= v.maxAge || 
            v.currentX < -40 || v.currentX > this.width + 40 || 
            v.currentY < -40) {
          v.active = false;
        }
      }

      // 3. Render the stem using an organic tapering width path
      if (v.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(v.points[0].x, v.points[0].y);
        
        for (let i = 1; i < v.points.length; i++) {
          const pt = v.points[i];
          // Gentle ambient wind sway scales with height/distance from base
          const stemHeightRatio = 1.0 - (pt.y / this.height);
          const swayOffset = Math.sin(time * 0.0008 + i * 0.08) * windSway * 18 * stemHeightRatio;
          
          ctx.lineTo(pt.x + swayOffset, pt.y);
        }
        
        ctx.strokeStyle = this.colors.stem;
        ctx.lineWidth = v.thickness * 6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
      }

      // 4. Render leaf nodes and flowers with blooming animations
      v.leaves.forEach(lf => {
        // Unfurl leaf scale
        if (lf.scale < lf.targetScale) {
          lf.scale += lf.growSpeed;
        }

        ctx.save();
        
        // Calculate ambient wind sway for the individual leaf coordinate
        const leafHeightRatio = 1.0 - (lf.y / this.height);
        const swayOffset = Math.sin(time * 0.0008 + (lf.x * 0.1)) * windSway * 18 * leafHeightRatio;

        ctx.translate(lf.x + swayOffset, lf.y);
        ctx.rotate(lf.angle + Math.sin(time * 0.0015 + lf.x) * 0.08);
        ctx.scale(lf.scale, lf.scale);

        // Draw leaf organic shape using Bézier vectors
        ctx.beginPath();
        ctx.moveTo(0, 0);
        // Left side of leaf
        ctx.quadraticCurveTo(-15, -12, -22, -35);
        ctx.quadraticCurveTo(-10, -42, 0, -55);
        // Right side of leaf
        ctx.quadraticCurveTo(10, -42, 22, -35);
        ctx.quadraticCurveTo(15, -12, 0, 0);
        ctx.closePath();

        // Foliage radial gradient shading
        const leafGrad = ctx.createRadialGradient(0, -25, 2, 0, -25, 30);
        leafGrad.addColorStop(0, this.colors.leafTip);
        leafGrad.addColorStop(0.5, this.colors.leafMid);
        leafGrad.addColorStop(1, this.colors.leafBase);

        ctx.fillStyle = leafGrad;
        ctx.fill();

        // Subtle leaf vein lines
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -48);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Tiny bio-electric blossoms
        if (lf.scale > 0.6 && Math.sin(lf.x) > 0.75) {
          ctx.beginPath();
          ctx.arc(0, -25, 4, 0, Math.PI * 2);
          ctx.fillStyle = this.colors.bud;
          ctx.shadowColor = this.colors.bud;
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        ctx.restore();
      });
    });

    // Sprout fresh root vines to replace dead ones
    const activeCount = this.vines.filter(v => v.active).length;
    if (activeCount < 2 && Math.random() < 0.005) {
      const startX = Math.random() * this.width;
      this.spawnVine(startX, this.height + 10, -Math.PI / 2, 0.45);
    }
  }

  destroy() {
    this.vines = [];
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
    return 'Bending Vine Ivy';
  }

  static get description() {
    return 'Creeping botanical vines that climb up virtual structures and sprout lush, budding leaves. The mouse cursor acts as a solar beacon, drawing active growth tips and causing new foliage to bloom in shades of deep green.';
  }

  static get vibe() {
    return 'Organic';
  }

  static get sourceCode() {
    return `class BendingVineIvy {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.vines = [];
    this.mouse = { x: null, y: null, active: false };
    
    this.colors = {
      bg: '#080d09',
      stem: '#1b2d1d',
      leafBase: '#1f592f',
      leafMid: '#398b4f',
      leafTip: '#79c882',
      bud: '#bd6a82'
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
    this.vines = [];
    const startCount = Math.min(5, Math.max(2, Math.floor((this.width * this.height) / 120000)));
    for (let i = 0; i < startCount; i++) {
      const startX = this.width * (0.2 + 0.6 * (i / (startCount - 1 || 1)));
      this.spawnVine(startX, this.height + 10, -Math.PI / 2, 0.45);
    }
  }

  spawnVine(x, y, angle, thickness) {
    if (this.vines.length > 25) return;
    this.vines.push({
      points: [{ x, y }],
      currentX: x,
      currentY: y,
      angle: angle,
      thickness: thickness,
      active: true,
      age: 0,
      maxAge: 160 + Math.random() * 200,
      leaves: [],
      lastLeafDist: 0,
      speed: 1.8 + Math.random() * 1.2
    });
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

    const windSway = Math.sin(time * 0.0012) * 0.05;

    this.vines.forEach(v => {
      if (v.active) {
        v.age++;
        let targetAngle = v.angle;
        if (this.mouse.active && this.mouse.x !== null) {
          const dx = this.mouse.x - v.currentX;
          const dy = this.mouse.y - v.currentY;
          const dist = Math.hypot(dx, dy);
          if (dist > 20) {
            targetAngle = Math.atan2(dy, dx);
          }
        } else {
          targetAngle = -Math.PI / 2 + Math.sin(v.age * 0.05) * 0.35;
        }

        v.angle += (targetAngle - v.angle) * 0.08;
        v.angle += (Math.random() - 0.5) * 0.22;

        const prevX = v.currentX;
        const prevY = v.currentY;
        v.currentX += Math.cos(v.angle) * v.speed;
        v.currentY += Math.sin(v.angle) * v.speed;
        v.points.push({ x: v.currentX, y: v.currentY });

        const segmentDist = Math.hypot(v.currentX - prevX, v.currentY - prevY);
        v.lastLeafDist += segmentDist;
        if (v.lastLeafDist > 18) {
          v.lastLeafDist = 0;
          const leafSide = v.leaves.length % 2 === 0 ? 1 : -1;
          const leafAngle = v.angle + (Math.PI / 2.2) * leafSide;
          v.leaves.push({
            x: v.currentX,
            y: v.currentY,
            angle: leafAngle,
            scale: 0.01,
            targetScale: 0.45 + Math.random() * 0.45,
            growSpeed: 0.018 + Math.random() * 0.015,
            side: leafSide
          });
        }

        if (v.age > 40 && Math.random() < 0.012 && this.vines.length < 20) {
          const branchSide = Math.random() > 0.5 ? 1 : -1;
          const branchAngle = v.angle + (Math.PI / 4) * branchSide;
          this.spawnVine(v.currentX, v.currentY, branchAngle, v.thickness * 0.7);
        }

        if (v.age >= v.maxAge || v.currentX < -40 || v.currentX > this.width + 40 || v.currentY < -40) {
          v.active = false;
        }
      }

      if (v.points.length > 1) {
        this.ctx.beginPath();
        this.ctx.moveTo(v.points[0].x, v.points[0].y);
        for (let i = 1; i < v.points.length; i++) {
          const pt = v.points[i];
          const stemHeightRatio = 1.0 - (pt.y / this.height);
          const swayOffset = Math.sin(time * 0.0008 + i * 0.08) * windSway * 18 * stemHeightRatio;
          this.ctx.lineTo(pt.x + swayOffset, pt.y);
        }
        this.ctx.strokeStyle = this.colors.stem;
        this.ctx.lineWidth = v.thickness * 6;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.stroke();
      }

      v.leaves.forEach(lf => {
        if (lf.scale < lf.targetScale) {
          lf.scale += lf.growSpeed;
        }

        this.ctx.save();
        const leafHeightRatio = 1.0 - (lf.y / this.height);
        const swayOffset = Math.sin(time * 0.0008 + (lf.x * 0.1)) * windSway * 18 * leafHeightRatio;

        this.ctx.translate(lf.x + swayOffset, lf.y);
        this.ctx.rotate(lf.angle + Math.sin(time * 0.0015 + lf.x) * 0.08);
        this.ctx.scale(lf.scale, lf.scale);

        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.quadraticCurveTo(-15, -12, -22, -35);
        this.ctx.quadraticCurveTo(-10, -42, 0, -55);
        this.ctx.quadraticCurveTo(10, -42, 22, -35);
        this.ctx.quadraticCurveTo(15, -12, 0, 0);
        this.ctx.closePath();

        const leafGrad = this.ctx.createRadialGradient(0, -25, 2, 0, -25, 30);
        leafGrad.addColorStop(0, this.colors.leafTip);
        leafGrad.addColorStop(0.5, this.colors.leafMid);
        leafGrad.addColorStop(1, this.colors.leafBase);
        this.ctx.fillStyle = leafGrad;
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(0, -48);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        this.ctx.lineWidth = 1.5;
        this.ctx.stroke();

        if (lf.scale > 0.6 && Math.sin(lf.x) > 0.75) {
          this.ctx.beginPath();
          this.ctx.arc(0, -25, 4, 0, Math.PI * 2);
          this.ctx.fillStyle = this.colors.bud;
          this.ctx.shadowColor = this.colors.bud;
          this.ctx.shadowBlur = 10;
          this.ctx.fill();
          this.ctx.shadowBlur = 0;
        }
        this.ctx.restore();
      });
    });

    const activeCount = this.vines.filter(v => v.active).length;
    if (activeCount < 2 && Math.random() < 0.005) {
      const startX = Math.random() * this.width;
      this.spawnVine(startX, this.height + 10, -Math.PI / 2, 0.45);
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
  }
}`;
  }
}
