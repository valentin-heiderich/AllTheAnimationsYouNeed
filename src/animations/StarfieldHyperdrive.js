import BaseAnimation from './BaseAnimation.js';

export default class StarfieldHyperdrive extends BaseAnimation {
  constructor() {
    super();
    this.stars = [];
    this.mouse = { x: null, y: null, active: false, rx: 0, ry: 0 };
    this.warpCenter = { x: 0, y: 0 };
    this.speed = 1.0;
    this.targetSpeed = 1.0;
    this.maxDepth = 1000;
  }

  setup() {
    this.stars = [];
    // Scale count with resolution
    const area = this.width * this.height;
    const count = Math.min(1000, Math.floor(area / 1600));

    this.mouse.rx = this.width / 2;
    this.mouse.ry = this.height / 2;
    this.warpCenter.x = this.width / 2;
    this.warpCenter.y = this.height / 2;

    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: (Math.random() - 0.5) * this.width * 2,
        y: (Math.random() - 0.5) * this.height * 2,
        z: Math.random() * this.maxDepth,
        color: Math.random() > 0.4 ? '#ffffff' : `hsla(${260 + Math.random() * 60}, 100%, 80%, 1)`,
        size: Math.random() * 1.5 + 0.5
      });
    }

    // Set initial black/indigo cosmos background
    this.ctx.fillStyle = '#05020c';
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  resize(width, height) {
    super.resize(width, height);
    this.setup();
  }

  draw(ctx, time) {
    // Satisfying trailing effect using alpha decay
    ctx.fillStyle = 'rgba(5, 2, 12, 0.18)';
    ctx.fillRect(0, 0, this.width, this.height);

    const actualCenter = { x: this.width / 2, y: this.height / 2 };

    // Smooth spring movement for mouse influence
    if (this.mouse.active && this.mouse.x !== null) {
      this.mouse.rx = this.mouse.rx * 0.9 + this.mouse.x * 0.1;
      this.mouse.ry = this.mouse.ry * 0.9 + this.mouse.y * 0.1;
      
      // Speed increases when moving mouse or when mouse is away from center
      const dx = this.mouse.x - actualCenter.x;
      const dy = this.mouse.y - actualCenter.y;
      const distance = Math.hypot(dx, dy);
      const maxDistance = Math.hypot(actualCenter.x, actualCenter.y);
      this.targetSpeed = 1.0 + (distance / maxDistance) * 35.0; // Boost speed up to 36x
    } else {
      // Return to base speed and slow orbit drift for center
      this.mouse.rx = this.mouse.rx * 0.95 + (actualCenter.x + Math.sin(time * 0.0008) * (this.width * 0.1)) * 0.05;
      this.mouse.ry = this.mouse.ry * 0.95 + (actualCenter.y + Math.cos(time * 0.0006) * (this.height * 0.1)) * 0.05;
      this.targetSpeed = 1.5 + Math.sin(time * 0.001) * 0.5; // Natural speed pulsing
    }

    // Blend speed transitions
    this.speed = this.speed * 0.92 + this.targetSpeed * 0.08;
    this.warpCenter.x = this.mouse.rx;
    this.warpCenter.y = this.mouse.ry;

    // Drawing stars
    const sizeMultiplier = 1.0 + (this.speed * 0.05);

    ctx.lineCap = 'round';
    this.stars.forEach(star => {
      // Cache previous depth to compute start points of warp lines
      const prevZ = star.z;
      
      // Move star closer to the screen
      star.z -= this.speed * 4.5;

      // Recycle star when it goes past screen viewport or z <= 0
      if (star.z <= 0) {
        star.z = this.maxDepth;
        star.x = (Math.random() - 0.5) * this.width * 2;
        star.y = (Math.random() - 0.5) * this.height * 2;
        star.color = Math.random() > 0.4 ? '#ffffff' : `hsla(${260 + Math.random() * 60}, 100%, 80%, 1)`;
        return;
      }

      // Calculate current 2D projection
      const k = 600; // Focal length
      const currX = (star.x / star.z) * k + this.warpCenter.x;
      const currY = (star.y / star.z) * k + this.warpCenter.y;

      // Calculate previous 2D projection for trail
      const prevX = (star.x / prevZ) * k + this.warpCenter.x;
      const prevY = (star.y / prevZ) * k + this.warpCenter.y;

      // Skip draw if off screen
      if (currX < 0 || currX > this.width || currY < 0 || currY > this.height) {
        return;
      }

      // Adjust opacity based on depth (fades in from background, fades out near camera)
      const depthOpacity = Math.min(1.0, (this.maxDepth - star.z) / 200) * Math.min(1.0, star.z / 100);
      
      // Draw warp trail line
      ctx.beginPath();
      ctx.moveTo(prevX, prevY);
      ctx.lineTo(currX, currY);

      ctx.strokeStyle = star.color;
      ctx.lineWidth = star.size * sizeMultiplier * depthOpacity;
      ctx.stroke();

      // Glow effect for fast stars
      if (this.speed > 15 && Math.random() > 0.95) {
        ctx.beginPath();
        ctx.arc(currX, currY, star.size * 3 * depthOpacity, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180, 100, 255, ${depthOpacity * 0.3})`;
        ctx.fill();
      }
    });
  }

  destroy() {
    super.destroy();
    this.stars = [];
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
    return 'Starfield Hyperdrive';
  }

  static get description() {
    return 'Perspective warp space-travel rendering through a deep stellar dust field. Moving the mouse adjusts the destination trajectory warp center and dramatically accelerates speed to hyperdrive. Experience bright, glowing interstellar violet-violet and pure white trails fading exponentially.';
  }

  static get vibe() {
    return 'Astrological';
  }

  static get sourceCode() {
    return `class StarfieldHyperdrive {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.stars = [];
    this.mouse = { x: null, y: null, active: false, rx: 0, ry: 0 };
    this.warpCenter = { x: 0, y: 0 };
    this.speed = 1.0;
    this.targetSpeed = 1.0;
    this.maxDepth = 1000;

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
    this.stars = [];
    const area = this.width * this.height;
    const count = Math.min(1000, Math.floor(area / 1600));

    this.mouse.rx = this.width / 2;
    this.mouse.ry = this.height / 2;
    this.warpCenter.x = this.width / 2;
    this.warpCenter.y = this.height / 2;

    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: (Math.random() - 0.5) * this.width * 2,
        y: (Math.random() - 0.5) * this.height * 2,
        z: Math.random() * this.maxDepth,
        color: Math.random() > 0.4 ? '#ffffff' : \`hsla(\${260 + Math.random() * 60}, 100%, 80%, 1)\`,
        size: Math.random() * 1.5 + 0.5
      });
    }

    this.ctx.fillStyle = '#05020c';
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
    this.ctx.fillStyle = 'rgba(5, 2, 12, 0.18)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    const actualCenter = { x: this.width / 2, y: this.height / 2 };

    if (this.mouse.active && this.mouse.x !== null) {
      this.mouse.rx = this.mouse.rx * 0.9 + this.mouse.x * 0.1;
      this.mouse.ry = this.mouse.ry * 0.9 + this.mouse.y * 0.1;
      
      const dx = this.mouse.x - actualCenter.x;
      const dy = this.mouse.y - actualCenter.y;
      const distance = Math.hypot(dx, dy);
      const maxDistance = Math.hypot(actualCenter.x, actualCenter.y);
      this.targetSpeed = 1.0 + (distance / maxDistance) * 35.0;
    } else {
      this.mouse.rx = this.mouse.rx * 0.95 + (actualCenter.x + Math.sin(time * 0.0008) * (this.width * 0.1)) * 0.05;
      this.mouse.ry = this.mouse.ry * 0.95 + (actualCenter.y + Math.cos(time * 0.0006) * (this.height * 0.1)) * 0.05;
      this.targetSpeed = 1.5 + Math.sin(time * 0.001) * 0.5;
    }

    this.speed = this.speed * 0.92 + this.targetSpeed * 0.08;
    this.warpCenter.x = this.mouse.rx;
    this.warpCenter.y = this.mouse.ry;

    const sizeMultiplier = 1.0 + (this.speed * 0.05);
    this.ctx.lineCap = 'round';

    this.stars.forEach(star => {
      const prevZ = star.z;
      star.z -= this.speed * 4.5;

      if (star.z <= 0) {
        star.z = this.maxDepth;
        star.x = (Math.random() - 0.5) * this.width * 2;
        star.y = (Math.random() - 0.5) * this.height * 2;
        star.color = Math.random() > 0.4 ? '#ffffff' : \`hsla(\${260 + Math.random() * 60}, 100%, 80%, 1)\`;
        return;
      }

      const k = 600;
      const currX = (star.x / star.z) * k + this.warpCenter.x;
      const currY = (star.y / star.z) * k + this.warpCenter.y;

      const prevX = (star.x / prevZ) * k + this.warpCenter.x;
      const prevY = (star.y / prevZ) * k + this.warpCenter.y;

      if (currX < 0 || currX > this.width || currY < 0 || currY > this.height) {
        return;
      }

      const depthOpacity = Math.min(1.0, (this.maxDepth - star.z) / 200) * Math.min(1.0, star.z / 100);
      
      this.ctx.beginPath();
      this.ctx.moveTo(prevX, prevY);
      this.ctx.lineTo(currX, currY);

      this.ctx.strokeStyle = star.color;
      this.ctx.lineWidth = star.size * sizeMultiplier * depthOpacity;
      this.ctx.stroke();

      if (this.speed > 15 && Math.random() > 0.95) {
        this.ctx.beginPath();
        this.ctx.arc(currX, currY, star.size * 3 * depthOpacity, 0, Math.PI * 2);
        this.ctx.fillStyle = \`rgba(180, 100, 255, \${depthOpacity * 0.3})\`;
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
