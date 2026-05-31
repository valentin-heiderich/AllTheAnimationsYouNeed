import BaseAnimation from './BaseAnimation.js';

export default class RiverStonesFlow extends BaseAnimation {
  constructor() {
    super();
    this.stones = [];
    this.ripples = [];
    this.mouse = { x: null, y: null, active: false };
    this.stoneColors = [
      { base: '#2C3539', lit: '#4E5B61', shadow: '#151B1E' }, // Slate Dark
      { base: '#4A525A', lit: '#737E88', shadow: '#272C30' }, // Granite Gray
      { base: '#706B62', lit: '#9B9487', shadow: '#3E3B36' }, // Warm Pebble Brown
      { base: '#353E43', lit: '#54636B', shadow: '#1B2023' }, // Ocean Blue Stone
      { base: '#1C2826', lit: '#304541', shadow: '#0E1413' }  // Deep Moss Jade
    ];
  }

  setup() {
    this.stones = [];
    this.ripples = [];

    // Scale stone count with width
    const count = Math.min(45, Math.max(15, Math.floor(this.width / 35)));

    // Create stacked stones at the bottom
    for (let i = 0; i < count; i++) {
      const radiusX = Math.random() * 35 + 30;
      const radiusY = radiusX * (Math.random() * 0.25 + 0.55); // flattened oval shapes
      const color = this.stoneColors[Math.floor(Math.random() * this.stoneColors.length)];
      
      // Pile stones organically across the bottom
      const x = (i / (count - 1)) * this.width + (Math.random() - 0.5) * 40;
      // Stagger layers so they overlap realistically
      const y = this.height - radiusY * 0.75 - Math.random() * 25;

      this.stones.push({
        x,
        y,
        radiusX,
        radiusY,
        rotation: (Math.random() - 0.5) * 0.35,
        color,
        pulseOffset: Math.random() * Math.PI * 2
      });
    }
  }

  resize(width, height) {
    const oldHeight = this.height;
    super.resize(width, height);

    // Re-stack stones relative to the new bottom
    this.stones.forEach(s => {
      const distFromBottom = oldHeight - s.y;
      s.y = height - (distFromBottom > 0 ? distFromBottom : s.radiusY);
      if (s.x > width) s.x = Math.random() * width;
    });
  }

  draw(ctx, time) {
    // 1. Beautiful deep river bed gradient background (cool crystal deep water)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, this.height);
    bgGrad.addColorStop(0, '#040b13');
    bgGrad.addColorStop(0.5, '#081726');
    bgGrad.addColorStop(1, '#0e243a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Update ongoing ripples
    this.ripples.forEach((r, idx) => {
      r.radius += r.speed;
      r.strength *= r.decay;
      if (r.strength < 0.05) {
        this.ripples.splice(idx, 1);
      }
    });

    // 2. Draw River Stones with dynamic light refraction coordinates warp
    this.stones.forEach(s => {
      // Calculate dynamic wave displacement (sine-based refraction)
      let dx = Math.sin(s.y * 0.02 + time * 0.0016 + s.pulseOffset) * 2.8;
      let dy = Math.cos(s.x * 0.02 + time * 0.0012 + s.pulseOffset) * 1.5;

      // Add displacement from active mouse ripples
      this.ripples.forEach(r => {
        const dist = Math.hypot(s.x - r.x, s.y - r.y);
        const waveDist = Math.abs(dist - r.radius);
        if (waveDist < 80) {
          const waveForce = (1.0 - waveDist / 80) * r.strength * 8.0;
          const angle = Math.atan2(s.y - r.y, s.x - r.x);
          dx += Math.cos(angle) * waveForce;
          dy += Math.sin(angle) * waveForce;
        }
      });

      const stoneX = s.x + dx;
      const stoneY = s.y + dy;

      ctx.save();
      ctx.translate(stoneX, stoneY);
      ctx.rotate(s.rotation);

      // Draw shadow
      ctx.beginPath();
      ctx.ellipse(0, 4, s.radiusX, s.radiusY, 0, 0, Math.PI * 2);
      ctx.fillStyle = s.color.shadow;
      ctx.globalAlpha = 0.55;
      ctx.fill();

      // Draw base stone
      ctx.beginPath();
      ctx.ellipse(0, 0, s.radiusX, s.radiusY, 0, 0, Math.PI * 2);
      ctx.fillStyle = s.color.base;
      ctx.globalAlpha = 1.0;
      ctx.fill();

      // Draw subtle inner shadow / 3D rim highlight
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 2.0;
      ctx.stroke();

      // Draw wet 3D specular highlight (simulating sun hit through water surface)
      const specX = -s.radiusX * 0.28;
      const specY = -s.radiusY * 0.28;
      const specRadX = s.radiusX * 0.55;
      const specRadY = s.radiusY * 0.45;
      
      const specGrad = ctx.createRadialGradient(specX, specY, 0, specX, specY, specRadX);
      specGrad.addColorStop(0, 'rgba(255, 255, 255, 0.16)');
      specGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.04)');
      specGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.beginPath();
      ctx.ellipse(specX, specY, specRadX, specRadY, 0, 0, Math.PI * 2);
      ctx.fillStyle = specGrad;
      ctx.fill();

      ctx.restore();
    });

    // 3. Draw Water Caustics Layer (glowing network of light refraction)
    ctx.globalCompositeOperation = 'screen';
    ctx.strokeStyle = 'rgba(100, 200, 255, 0.11)';
    ctx.lineWidth = 1.5;

    const gridSize = 45;
    const cols = Math.ceil(this.width / gridSize) + 2;
    const rows = Math.ceil(this.height / gridSize) + 2;

    for (let r = 0; r < rows; r++) {
      ctx.beginPath();
      for (let c = 0; c < cols; c++) {
        const x = c * gridSize - gridSize;
        const y = r * gridSize - gridSize;

        // Wave formula for light network warping
        let wx = x + Math.sin(y * 0.015 + time * 0.0018) * 8.0 + Math.cos(x * 0.01 + time * 0.0012) * 4.0;
        let wy = y + Math.cos(x * 0.015 + time * 0.0016) * 8.0 + Math.sin(y * 0.01 + time * 0.0014) * 4.0;

        // Add displacement from active mouse ripples to caustics
        this.ripples.forEach(rp => {
          const dist = Math.hypot(x - rp.x, y - rp.y);
          const waveDist = Math.abs(dist - rp.radius);
          if (waveDist < 80) {
            const waveForce = (1.0 - waveDist / 80) * rp.strength * 12.0;
            const angle = Math.atan2(y - rp.y, x - rp.x);
            wx += Math.cos(angle) * waveForce;
            wy += Math.sin(angle) * waveForce;
          }
        });

        if (c === 0) {
          ctx.moveTo(wx, wy);
        } else {
          ctx.lineTo(wx, wy);
        }
      }
      ctx.stroke();
    }

    // Horizontal lines of caustics net
    for (let c = 0; c < cols; c++) {
      ctx.beginPath();
      for (let r = 0; r < rows; r++) {
        const x = c * gridSize - gridSize;
        const y = r * gridSize - gridSize;

        let wx = x + Math.sin(y * 0.015 + time * 0.0018) * 8.0 + Math.cos(x * 0.01 + time * 0.0012) * 4.0;
        let wy = y + Math.cos(x * 0.015 + time * 0.0016) * 8.0 + Math.sin(y * 0.01 + time * 0.0014) * 4.0;

        this.ripples.forEach(rp => {
          const dist = Math.hypot(x - rp.x, y - rp.y);
          const waveDist = Math.abs(dist - rp.radius);
          if (waveDist < 80) {
            const waveForce = (1.0 - waveDist / 80) * rp.strength * 12.0;
            const angle = Math.atan2(y - rp.y, x - rp.x);
            wx += Math.cos(angle) * waveForce;
            wy += Math.sin(angle) * waveForce;
          }
        });

        if (r === 0) {
          ctx.moveTo(wx, wy);
        } else {
          ctx.lineTo(wx, wy);
        }
      }
      ctx.stroke();
    }

    // 4. Draw Active Ripple Rings (Outer expanding water droplets)
    this.ripples.forEach(r => {
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(180, 230, 255, ${r.strength * 0.25})`;
      ctx.lineWidth = 2.0;
      ctx.stroke();
    });

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1.0;
  }

  destroy() {
    this.stones = [];
    this.ripples = [];
    super.destroy();
  }

  handleMouseMove(x, y) {
    this.mouse.x = x;
    this.mouse.y = y;
    this.mouse.active = true;

    // Trigger smooth ripple waves on mouse movement (throttled organically)
    if (Math.random() < 0.18) {
      this.ripples.push({
        x,
        y,
        radius: 0,
        speed: 3.5,
        strength: 1.0,
        decay: 0.965
      });
    }
  }

  handleMouseLeave() {
    this.mouse.active = false;
    this.mouse.x = null;
    this.mouse.y = null;
  }

  static get title() {
    return 'River Stones Flow';
  }

  static get description() {
    return 'Tactile, smooth river stones rest stacked organically along a dark crystal river floor. A flowing layer of glowing water caustics dances over them, warping the rocks under a high-performance coordinates refraction wave. Moving your cursor triggers ripples that expand across the canvas.';
  }

  static get vibe() {
    return 'Satisfying';
  }

  static get sourceCode() {
    return `class RiverStonesFlow {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.stones = [];
    this.ripples = [];
    this.mouse = { x: null, y: null, active: false };
    this.stoneColors = [
      { base: '#2C3539', lit: '#4E5B61', shadow: '#151B1E' },
      { base: '#4A525A', lit: '#737E88', shadow: '#272C30' },
      { base: '#706B62', lit: '#9B9487', shadow: '#3E3B36' },
      { base: '#353E43', lit: '#54636B', shadow: '#1B2023' },
      { base: '#1C2826', lit: '#304541', shadow: '#0E1413' }
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
    this.stones = [];
    this.ripples = [];
    const count = Math.min(45, Math.max(15, Math.floor(this.width / 35)));

    for (let i = 0; i < count; i++) {
      const radiusX = Math.random() * 35 + 30;
      const radiusY = radiusX * (Math.random() * 0.25 + 0.55);
      const color = this.stoneColors[Math.floor(Math.random() * this.stoneColors.length)];
      const x = (i / (count - 1)) * this.width + (Math.random() - 0.5) * 40;
      const y = this.height - radiusY * 0.75 - Math.random() * 25;

      this.stones.push({
        x,
        y,
        radiusX,
        radiusY,
        rotation: (Math.random() - 0.5) * 0.35,
        color,
        pulseOffset: Math.random() * Math.PI * 2
      });
    }
  }

  resize() {
    this.dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    const oldHeight = this.height || rect.height;
    
    this.width = rect.width;
    this.height = rect.height;
    
    this.canvas.width = rect.width * this.dpr;
    this.canvas.height = rect.height * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);

    this.stones.forEach(s => {
      const distFromBottom = oldHeight - s.y;
      s.y = this.height - (distFromBottom > 0 ? distFromBottom : s.radiusY);
      if (s.x > this.width) s.x = Math.random() * this.width;
    });
  }

  animate(time = 0) {
    const bgGrad = this.ctx.createLinearGradient(0, 0, 0, this.height);
    bgGrad.addColorStop(0, '#040b13');
    bgGrad.addColorStop(0.5, '#081726');
    bgGrad.addColorStop(1, '#0e243a');
    this.ctx.fillStyle = bgGrad;
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ripples.forEach((r, idx) => {
      r.radius += r.speed;
      r.strength *= r.decay;
      if (r.strength < 0.05) {
        this.ripples.splice(idx, 1);
      }
    });

    this.stones.forEach(s => {
      let dx = Math.sin(s.y * 0.02 + time * 0.0016 + s.pulseOffset) * 2.8;
      let dy = Math.cos(s.x * 0.02 + time * 0.0012 + s.pulseOffset) * 1.5;

      this.ripples.forEach(r => {
        const dist = Math.hypot(s.x - r.x, s.y - r.y);
        const waveDist = Math.abs(dist - r.radius);
        if (waveDist < 80) {
          const waveForce = (1.0 - waveDist / 80) * r.strength * 8.0;
          const angle = Math.atan2(s.y - r.y, s.x - r.x);
          dx += Math.cos(angle) * waveForce;
          dy += Math.sin(angle) * waveForce;
        }
      });

      const stoneX = s.x + dx;
      const stoneY = s.y + dy;

      this.ctx.save();
      this.ctx.translate(stoneX, stoneY);
      this.ctx.rotate(s.rotation);

      this.ctx.beginPath();
      this.ctx.ellipse(0, 4, s.radiusX, s.radiusY, 0, 0, Math.PI * 2);
      this.ctx.fillStyle = s.color.shadow;
      this.ctx.globalAlpha = 0.55;
      this.ctx.fill();

      this.ctx.beginPath();
      this.ctx.ellipse(0, 0, s.radiusX, s.radiusY, 0, 0, Math.PI * 2);
      this.ctx.fillStyle = s.color.base;
      this.ctx.globalAlpha = 1.0;
      this.ctx.fill();

      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      this.ctx.lineWidth = 2.0;
      this.ctx.stroke();

      const specX = -s.radiusX * 0.28;
      const specY = -s.radiusY * 0.28;
      const specRadX = s.radiusX * 0.55;
      const specRadY = s.radiusY * 0.45;
      
      const specGrad = this.ctx.createRadialGradient(specX, specY, 0, specX, specY, specRadX);
      specGrad.addColorStop(0, 'rgba(255, 255, 255, 0.16)');
      specGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.04)');
      specGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

      this.ctx.beginPath();
      this.ctx.ellipse(specX, specY, specRadX, specRadY, 0, 0, Math.PI * 2);
      this.ctx.fillStyle = specGrad;
      this.ctx.fill();

      this.ctx.restore();
    });

    this.ctx.globalCompositeOperation = 'screen';
    this.ctx.strokeStyle = 'rgba(100, 200, 255, 0.11)';
    this.ctx.lineWidth = 1.5;

    const gridSize = 45;
    const cols = Math.ceil(this.width / gridSize) + 2;
    const rows = Math.ceil(this.height / gridSize) + 2;

    for (let r = 0; r < rows; r++) {
      this.ctx.beginPath();
      for (let c = 0; c < cols; c++) {
        const x = c * gridSize - gridSize;
        const y = r * gridSize - gridSize;

        let wx = x + Math.sin(y * 0.015 + time * 0.0018) * 8.0 + Math.cos(x * 0.01 + time * 0.0012) * 4.0;
        let wy = y + Math.cos(x * 0.015 + time * 0.0016) * 8.0 + Math.sin(y * 0.01 + time * 0.0014) * 4.0;

        this.ripples.forEach(rp => {
          const dist = Math.hypot(x - rp.x, y - rp.y);
          const waveDist = Math.abs(dist - rp.radius);
          if (waveDist < 80) {
            const waveForce = (1.0 - waveDist / 80) * rp.strength * 12.0;
            const angle = Math.atan2(y - rp.y, x - rp.x);
            wx += Math.cos(angle) * waveForce;
            wy += Math.sin(angle) * waveForce;
          }
        });

        if (c === 0) {
          this.ctx.moveTo(wx, wy);
        } else {
          this.ctx.lineTo(wx, wy);
        }
      }
      this.ctx.stroke();
    }

    for (let c = 0; c < cols; c++) {
      this.ctx.beginPath();
      for (let r = 0; r < rows; r++) {
        const x = c * gridSize - gridSize;
        const y = r * gridSize - gridSize;

        let wx = x + Math.sin(y * 0.015 + time * 0.0018) * 8.0 + Math.cos(x * 0.01 + time * 0.0012) * 4.0;
        let wy = y + Math.cos(x * 0.015 + time * 0.0016) * 8.0 + Math.sin(y * 0.01 + time * 0.0014) * 4.0;

        this.ripples.forEach(rp => {
          const dist = Math.hypot(x - rp.x, y - rp.y);
          const waveDist = Math.abs(dist - rp.radius);
          if (waveDist < 80) {
            const waveForce = (1.0 - waveDist / 80) * rp.strength * 12.0;
            const angle = Math.atan2(y - rp.y, x - rp.x);
            wx += Math.cos(angle) * waveForce;
            wy += Math.sin(angle) * waveForce;
          }
        });

        if (r === 0) {
          this.ctx.moveTo(wx, wy);
        } else {
          this.ctx.lineTo(wx, wy);
        }
      }
      this.ctx.stroke();
    }

    this.ripples.forEach(r => {
      this.ctx.beginPath();
      this.ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      this.ctx.strokeStyle = \`rgba(180, 230, 255, \${r.strength * 0.25})\`;
      this.ctx.lineWidth = 2.0;
      this.ctx.stroke();
    });

    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.globalAlpha = 1.0;
    requestAnimationFrame((t) => this.animate(t));
  }

  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    this.mouse.x = x;
    this.mouse.y = y;
    this.mouse.active = true;

    if (Math.random() < 0.18) {
      this.ripples.push({
        x,
        y,
        radius: 0,
        speed: 3.5,
        strength: 1.0,
        decay: 0.965
      });
    }
  }

  handleMouseLeave() {
    this.mouse.active = false;
    this.mouse.x = null;
    this.mouse.y = null;
  }
}`;
  }
}
