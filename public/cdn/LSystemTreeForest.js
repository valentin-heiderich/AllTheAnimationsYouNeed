import BaseAnimation from './BaseAnimation.js';

export default class LSystemTreeForest extends BaseAnimation {
  constructor() {
    super();
    this.trees = [];
    this.leaves = [];
    this.mouse = { x: null, y: null, active: false, radius: 150 };
    this.lastMouseX = null;
    this.lastMouseY = null;
    this.mouseSpeedX = 0;
    this.mouseSpeedY = 0;
    this.forestGrowth = 0;
  }

  setup() {
    this.leaves = [];
    this.trees = [];
    this.forestGrowth = 0;
    this.lastMouseX = null;
    this.lastMouseY = null;
    this.mouseSpeedX = 0;
    this.mouseSpeedY = 0;

    // Distribute 4 generative trees along the canvas floor coordinate
    const treeCount = Math.min(5, Math.max(3, Math.floor(this.width / 240)));
    const spacing = this.width / (treeCount + 1);

    for (let i = 0; i < treeCount; i++) {
      const x = spacing * (i + 1) + (Math.random() * 30 - 15);
      const trunkLength = this.height * 0.16 + Math.random() * 30;
      
      this.trees.push({
        x: x,
        y: this.height,
        trunkLength: trunkLength,
        thickness: Math.min(9, this.width * 0.012),
        growthRate: 0.003 + Math.random() * 0.002,
        growth: 0, // starts at 0, goes to 1
        swayPhase: Math.random() * Math.PI * 2,
        swayFrequency: 0.001 + Math.random() * 0.0005,
        swayAmplitude: 0.02 + Math.random() * 0.015,
        branchesAngle: 0.35 + Math.random() * 0.15 // organic divergence angle
      });
    }
  }

  spawnLeaf(x, y) {
    if (this.leaves.length > 250) return; // Prevent performance drops
    this.leaves.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 1.0,
      vy: Math.random() * 0.8 + 0.6, // fall speed
      size: Math.random() * 3.5 + 2.5,
      hue: 335 + Math.random() * 25, // cherry blossom pink to light magenta
      opacity: 0.9,
      decay: 0.002 + Math.random() * 0.002,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.05,
      wobblePhase: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.03 + Math.random() * 0.03
    });
  }

  resize(width, height) {
    super.resize(width, height);
    this.setup();
  }

  draw(ctx, time) {
    // Beautiful mystical forest night-gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 0, this.height);
    bgGradient.addColorStop(0, '#03050c');
    bgGradient.addColorStop(0.6, '#080d1a');
    bgGradient.addColorStop(1, '#0c1626');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, this.width, this.height);

    // Slowly grow forest trees over time
    this.trees.forEach(tree => {
      if (tree.growth < 1.0) {
        tree.growth += tree.growthRate;
        if (tree.growth > 1.0) tree.growth = 1.0;
      }
    });

    // Draw generative trees recursively
    this.trees.forEach(tree => {
      ctx.lineCap = 'round';
      this.drawBranch(
        ctx,
        tree.x,
        tree.y,
        -Math.PI / 2, // point upwards
        tree.trunkLength,
        tree.thickness,
        0, // start level
        time,
        tree.growth,
        tree
      );
    });

    // Update and draw floating glowing leaves
    for (let i = this.leaves.length - 1; i >= 0; i--) {
      const leaf = this.leaves[i];

      // Natural floating swing movement
      leaf.wobblePhase += leaf.wobbleSpeed;
      leaf.vx += Math.sin(leaf.wobblePhase) * 0.05;
      
      // Gravity falling
      leaf.y += leaf.vy;
      leaf.x += leaf.vx;
      leaf.rotation += leaf.rotSpeed;

      // Mouse interactive wind gusts pushing leaves
      if (this.mouse.active && this.mouse.x !== null) {
        const dx = leaf.x - this.mouse.x;
        const dy = leaf.y - this.mouse.y;
        const dist = Math.hypot(dx, dy);

        if (dist < this.mouse.radius) {
          const force = (this.mouse.radius - dist) / this.mouse.radius;
          
          // Push leaves away horizontally and vertically
          leaf.vx += (dx / (dist || 1)) * force * 1.5;
          leaf.vy += (dy / (dist || 1)) * force * 0.5;
          
          // Add drag speed from direct mouse motion
          leaf.vx += this.mouseSpeedX * force * 0.35;
          leaf.vy += this.mouseSpeedY * force * 0.15;
        }
      }

      // Limit speed
      leaf.vx *= 0.95;
      if (leaf.vy > 2.0) leaf.vy = 2.0;

      leaf.opacity -= leaf.decay;

      // Reset or delete leaf if dead or out of bounds
      if (leaf.opacity <= 0 || leaf.y > this.height + 10 || leaf.x < -10 || leaf.x > this.width + 10) {
        this.leaves.splice(i, 1);
        continue;
      }

      // Render rotating cherry blossom glowing leaf
      ctx.save();
      ctx.translate(leaf.x, leaf.y);
      ctx.rotate(leaf.rotation);
      
      ctx.beginPath();
      ctx.fillStyle = `hsla(${leaf.hue}, 100%, 75%, ${leaf.opacity})`;
      ctx.shadowBlur = leaf.size * 2.5;
      ctx.shadowColor = `hsla(${leaf.hue}, 100%, 65%, ${leaf.opacity})`;
      
      // Draw organic leaf shape
      ctx.ellipse(0, 0, leaf.size * 1.3, leaf.size * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    
    ctx.shadowBlur = 0;
  }

  // Recursive branch rendering algorithm
  drawBranch(ctx, x, y, angle, length, thickness, level, time, growth, tree) {
    const maxLevel = 5;
    
    // Scale branching progress dynamically based on time growth value
    const levelStart = level / maxLevel;
    const levelEnd = (level + 1) / maxLevel;
    
    let levelGrowth = 0;
    if (growth > levelStart) {
      levelGrowth = Math.min(1.0, (growth - levelStart) / (levelEnd - levelStart));
    }

    if (levelGrowth <= 0) return;

    // Natural organic branch sway using offset time cosines
    const sway = Math.sin(time * tree.swayFrequency + tree.swayPhase + level * 0.5) * tree.swayAmplitude * (level + 1) * 0.45;
    const finalAngle = angle + sway;
    const finalLength = length * levelGrowth;

    const endX = x + Math.cos(finalAngle) * finalLength;
    const endY = y + Math.sin(finalAngle) * finalLength;

    // Draw branch line
    ctx.beginPath();
    
    // Smooth transition from dark trunk brown to soft green twigs
    const hue = 25 + level * 15;
    const sat = 30 + level * 8;
    const light = 12 + level * 4;
    
    ctx.strokeStyle = `hsla(${hue}, ${sat}%, ${light}%, 0.9)`;
    ctx.lineWidth = Math.max(1.0, thickness * (1.0 - level * 0.16));
    ctx.moveTo(x, y);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Buds and blooming pink flowers on final levels
    if (level === maxLevel - 1) {
      if (levelGrowth >= 0.9) {
        const flowerAlpha = (levelGrowth - 0.9) * 10; // quickly fade in flower
        
        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 175, 195, ${flowerAlpha * 0.95})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(255, 130, 170, 0.8)';
        ctx.arc(endX, endY, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // organic leaf shedding
        if (Math.random() < 0.0006 * levelGrowth) {
          this.spawnLeaf(endX, endY);
        }
      }
      return; // end recursion at tips
    }

    // Branch splitting ratios
    const nextLength = length * (0.68 + Math.random() * 0.08);
    const nextThickness = thickness * 0.72;

    // Left sub-branch
    this.drawBranch(ctx, endX, endY, finalAngle - tree.branchesAngle, nextLength, nextThickness, level + 1, time, growth, tree);
    // Right sub-branch
    this.drawBranch(ctx, endX, endY, finalAngle + tree.branchesAngle, nextLength, nextThickness, level + 1, time, growth, tree);
  }

  destroy() {
    super.destroy();
    this.trees = [];
    this.leaves = [];
  }

  handleMouseMove(x, y) {
    this.mouse.x = x;
    this.mouse.y = y;
    this.mouse.active = true;

    // Track mouse speed vectors to create organic air currents
    if (this.lastMouseX !== null) {
      this.mouseSpeedX = x - this.lastMouseX;
      this.mouseSpeedY = y - this.lastMouseY;
    }

    this.lastMouseX = x;
    this.lastMouseY = y;
  }

  handleMouseLeave() {
    this.mouse.active = false;
    this.mouse.x = null;
    this.mouse.y = null;
    this.lastMouseX = null;
    this.lastMouseY = null;
    this.mouseSpeedX = 0;
    this.mouseSpeedY = 0;
  }

  static get title() {
    return 'L-System Tree Forest';
  }

  static get description() {
    return 'A generative forest of tiny organic trees using recursive branching L-system equations. Blooms slow-growing pink flowers that shed glowing petals which react to cursor air currents.';
  }

  static get vibe() {
    return 'Organic';
  }

  static get sourceCode() {
    return `class LSystemTreeForest {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.trees = [];
    this.leaves = [];
    this.mouse = { x: null, y: null, active: false, radius: 150 };
    this.lastMouseX = null;
    this.lastMouseY = null;
    this.mouseSpeedX = 0;
    this.mouseSpeedY = 0;
    this.forestGrowth = 0;
    
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
    this.trees = [];
    this.forestGrowth = 0;
    this.lastMouseX = null;
    this.lastMouseY = null;
    this.mouseSpeedX = 0;
    this.mouseSpeedY = 0;

    const treeCount = Math.min(5, Math.max(3, Math.floor(this.width / 240)));
    const spacing = this.width / (treeCount + 1);

    for (let i = 0; i < treeCount; i++) {
      const x = spacing * (i + 1) + (Math.random() * 30 - 15);
      const trunkLength = this.height * 0.16 + Math.random() * 30;
      
      this.trees.push({
        x: x,
        y: this.height,
        trunkLength: trunkLength,
        thickness: Math.min(9, this.width * 0.012),
        growthRate: 0.003 + Math.random() * 0.002,
        growth: 0,
        swayPhase: Math.random() * Math.PI * 2,
        swayFrequency: 0.001 + Math.random() * 0.0005,
        swayAmplitude: 0.02 + Math.random() * 0.015,
        branchesAngle: 0.35 + Math.random() * 0.15
      });
    }
  }

  spawnLeaf(x, y) {
    if (this.leaves.length > 250) return;
    this.leaves.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 1.0,
      vy: Math.random() * 0.8 + 0.6,
      size: Math.random() * 3.5 + 2.5,
      hue: 335 + Math.random() * 25,
      opacity: 0.9,
      decay: 0.002 + Math.random() * 0.002,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.05,
      wobblePhase: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.03 + Math.random() * 0.03
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
    const bgGradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
    bgGradient.addColorStop(0, '#03050c');
    bgGradient.addColorStop(0.6, '#080d1a');
    bgGradient.addColorStop(1, '#0c1626');
    this.ctx.fillStyle = bgGradient;
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.trees.forEach(tree => {
      if (tree.growth < 1.0) {
        tree.growth += tree.growthRate;
        if (tree.growth > 1.0) tree.growth = 1.0;
      }
    });

    this.trees.forEach(tree => {
      this.ctx.lineCap = 'round';
      this.drawBranch(
        this.ctx,
        tree.x,
        tree.y,
        -Math.PI / 2,
        tree.trunkLength,
        tree.thickness,
        0,
        time,
        tree.growth,
        tree
      );
    });

    for (let i = this.leaves.length - 1; i >= 0; i--) {
      const leaf = this.leaves[i];
      leaf.wobblePhase += leaf.wobbleSpeed;
      leaf.vx += Math.sin(leaf.wobblePhase) * 0.05;
      leaf.y += leaf.vy;
      leaf.x += leaf.vx;
      leaf.rotation += leaf.rotSpeed;

      if (this.mouse.active && this.mouse.x !== null) {
        const dx = leaf.x - this.mouse.x;
        const dy = leaf.y - this.mouse.y;
        const dist = Math.hypot(dx, dy);

        if (dist < this.mouse.radius) {
          const force = (this.mouse.radius - dist) / this.mouse.radius;
          leaf.vx += (dx / (dist || 1)) * force * 1.5;
          leaf.vy += (dy / (dist || 1)) * force * 0.5;
          leaf.vx += this.mouseSpeedX * force * 0.35;
          leaf.vy += this.mouseSpeedY * force * 0.15;
        }
      }

      leaf.vx *= 0.95;
      if (leaf.vy > 2.0) leaf.vy = 2.0;
      leaf.opacity -= leaf.decay;

      if (leaf.opacity <= 0 || leaf.y > this.height + 10 || leaf.x < -10 || leaf.x > this.width + 10) {
        this.leaves.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.translate(leaf.x, leaf.y);
      this.ctx.rotate(leaf.rotation);
      
      this.ctx.beginPath();
      this.ctx.fillStyle = \`hsla(\${leaf.hue}, 100%, 75%, \${leaf.opacity})\`;
      this.ctx.shadowBlur = leaf.size * 2.5;
      this.ctx.shadowColor = \`hsla(\${leaf.hue}, 100%, 65%, \${leaf.opacity})\`;
      this.ctx.ellipse(0, 0, leaf.size * 1.3, leaf.size * 0.7, 0, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }
    
    this.ctx.shadowBlur = 0;
    requestAnimationFrame((t) => this.animate(t));
  }

  drawBranch(ctx, x, y, angle, length, thickness, level, time, growth, tree) {
    const maxLevel = 5;
    const levelStart = level / maxLevel;
    const levelEnd = (level + 1) / maxLevel;
    
    let levelGrowth = 0;
    if (growth > levelStart) {
      levelGrowth = Math.min(1.0, (growth - levelStart) / (levelEnd - levelStart));
    }

    if (levelGrowth <= 0) return;

    const sway = Math.sin(time * tree.swayFrequency + tree.swayPhase + level * 0.5) * tree.swayAmplitude * (level + 1) * 0.45;
    const finalAngle = angle + sway;
    const finalLength = length * levelGrowth;

    const endX = x + Math.cos(finalAngle) * finalLength;
    const endY = y + Math.sin(finalAngle) * finalLength;

    ctx.beginPath();
    const hue = 25 + level * 15;
    const sat = 30 + level * 8;
    const light = 12 + level * 4;
    
    ctx.strokeStyle = \`hsla(\${hue}, \${sat}%, \${light}%, 0.9)\`;
    ctx.lineWidth = Math.max(1.0, thickness * (1.0 - level * 0.16));
    ctx.moveTo(x, y);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    if (level === maxLevel - 1) {
      if (levelGrowth >= 0.9) {
        const flowerAlpha = (levelGrowth - 0.9) * 10;
        ctx.beginPath();
        ctx.fillStyle = \`rgba(255, 175, 195, \${flowerAlpha * 0.95})\`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(255, 130, 170, 0.8)';
        ctx.arc(endX, endY, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        if (Math.random() < 0.0006 * levelGrowth) {
          this.spawnLeaf(endX, endY);
        }
      }
      return;
    }

    const nextLength = length * (0.68 + Math.random() * 0.08);
    const nextThickness = thickness * 0.72;

    this.drawBranch(ctx, endX, endY, finalAngle - tree.branchesAngle, nextLength, nextThickness, level + 1, time, growth, tree);
    this.drawBranch(ctx, endX, endY, finalAngle + tree.branchesAngle, nextLength, nextThickness, level + 1, time, growth, tree);
  }

  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    this.mouse.x = x;
    this.mouse.y = y;
    this.mouse.active = true;

    if (this.lastMouseX !== null) {
      this.mouseSpeedX = x - this.lastMouseX;
      this.mouseSpeedY = y - this.lastMouseY;
    }

    this.lastMouseX = x;
    this.lastMouseY = y;
  }

  handleMouseLeave() {
    this.mouse.active = false;
    this.mouse.x = null;
    this.mouse.y = null;
    this.lastMouseX = null;
    this.lastMouseY = null;
    this.mouseSpeedX = 0;
    this.mouseSpeedY = 0;
  }
}`;
  }
}
