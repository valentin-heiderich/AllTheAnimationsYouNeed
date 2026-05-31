import BaseAnimation from './BaseAnimation.js';

export default class GeometricSphericalWave extends BaseAnimation {
  constructor() {
    super();
    this.mouse = { x: null, y: null, active: false, rx: 0, ry: 0 };
    this.rot = { x: 0, y: 0, z: 0 };
    this.rotSpeed = { x: 0.004, y: 0.006, z: 0.002 };
    this.bg = '#080512'; // Sleek dark cyber-violet background
  }

  setup() {
    // Center point initialization
    this.mouse.rx = this.width / 2;
    this.mouse.ry = this.height / 2;

    this.rot.x = Math.random() * Math.PI;
    this.rot.y = Math.random() * Math.PI;
    this.rot.z = 0;
  }

  resize(width, height) {
    super.resize(width, height);
  }

  draw(ctx, time) {
    // 1. Deep space violet background
    ctx.fillStyle = this.bg;
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Draw ambient holographic background spotlight
    const baseRadius = Math.min(this.width, this.height) * 0.28;
    const centerGlow = ctx.createRadialGradient(
      this.width / 2, this.height / 2, 0,
      this.width / 2, this.height / 2, baseRadius * 1.5
    );
    centerGlow.addColorStop(0, 'rgba(236, 72, 153, 0.08)'); // Glowing Pink core
    centerGlow.addColorStop(0.5, 'rgba(168, 85, 247, 0.03)'); // Shifting Purple
    centerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = centerGlow;
    ctx.fillRect(0, 0, this.width, this.height);

    // 3. User interaction: cursor position scales rotation velocity on X & Y axes
    if (this.mouse.active && this.mouse.x !== null) {
      // Scale target speeds based on cursor displacement from canvas center
      const tx = (this.mouse.y - this.height / 2) * 0.00004;
      const ty = (this.mouse.x - this.width / 2) * 0.00004;

      this.rotSpeed.x = this.rotSpeed.x * 0.95 + tx * 0.05;
      this.rotSpeed.y = this.rotSpeed.y * 0.95 + ty * 0.05;
    } else {
      // Elegant default automatic drift speeds
      this.rotSpeed.x = this.rotSpeed.x * 0.98 + 0.004 * 0.02;
      this.rotSpeed.y = this.rotSpeed.y * 0.98 + 0.006 * 0.02;
    }

    // Accumulate rotational coordinates
    this.rot.x += this.rotSpeed.x;
    this.rot.y += this.rotSpeed.y;
    this.rot.z += 0.002; // Constant slow Z rotation

    // 4. Mathematical sphere projection configuration
    const latSegments = 16;  // Latitude divisions (horizontal slices)
    const lonSegments = 26;  // Longitude divisions (vertical segments)
    const fov = 450;        // Perspective Camera focal length

    // Pre-calculate sin/cos values for rotation matrix optimization
    const cosX = Math.cos(this.rot.x);
    const sinX = Math.sin(this.rot.x);
    const cosY = Math.cos(this.rot.y);
    const sinY = Math.sin(this.rot.y);
    const cosZ = Math.cos(this.rot.z);
    const sinZ = Math.sin(this.rot.z);

    // Create dynamic 3D projected coordinate grid
    const projectedGrid = [];

    for (let latIdx = 0; latIdx <= latSegments; latIdx++) {
      // Map latitude angle from -PI/2 (South Pole) to PI/2 (North Pole)
      const latAngle = (latIdx / latSegments) * Math.PI - Math.PI / 2;
      const cosLat = Math.cos(latAngle);
      const sinLat = Math.sin(latAngle);

      projectedGrid[latIdx] = [];

      for (let lonIdx = 0; lonIdx < lonSegments; lonIdx++) {
        // Map longitude angle from -PI to PI
        const lonAngle = (lonIdx / lonSegments) * Math.PI * 2 - Math.PI;
        const cosLon = Math.cos(lonAngle);
        const sinLon = Math.sin(lonAngle);

        // Spherical Wave Deformation: Modulate radius based on a traveling harmonic wave
        const waveFrequency = 4.0;
        const waveSpeed = 0.0035;
        const waveAmplitude = baseRadius * 0.16;
        
        // Dynamic wave formula combining lat, lon, and time
        const waveOffset = Math.sin(latAngle * waveFrequency + lonAngle * 2.0 + time * waveSpeed) * waveAmplitude;
        const currentRadius = baseRadius + waveOffset;

        // Base 3D Cartesian coordinates
        const x3d = currentRadius * cosLat * cosLon;
        const y3d = currentRadius * cosLat * sinLon;
        const z3d = currentRadius * sinLat;

        // Apply 3D Rotation Matrix
        // Rotate Y
        let rx = x3d * cosY - z3d * sinY;
        let rz = x3d * sinY + z3d * cosY;
        // Rotate X
        let ry = y3d * cosX - rz * sinX;
        rz = y3d * sinX + rz * cosX;
        // Rotate Z
        const rxFinal = rx * cosZ - ry * sinZ;
        const ryFinal = rx * sinZ + ry * cosZ;

        // Perspective 3D to 2D projection
        // Offset z to place sphere completely in front of camera
        const cameraZOffset = baseRadius * 1.6;
        const projectionScale = fov / (fov + rz + cameraZOffset);
        
        const screenX = this.width / 2 + rxFinal * projectionScale;
        const screenY = this.height / 2 + ryFinal * projectionScale;

        projectedGrid[latIdx][lonIdx] = {
          x: screenX,
          y: screenY,
          depth: rz // Depth value stored for depth-shading color cueing!
        };
      }
    }

    // 5. Render Projected 3D Sphere mesh (connect lines between coordinate matrix nodes)
    ctx.lineWidth = 1.0;

    for (let latIdx = 0; latIdx <= latSegments; latIdx++) {
      for (let lonIdx = 0; lonIdx < lonSegments; lonIdx++) {
        const pCurrent = projectedGrid[latIdx][lonIdx];

        // depth factor maps depth from -baseRadius to +baseRadius to range 0.0 to 1.0
        // (0 = closest, 1 = furthest)
        const depthRatio = (pCurrent.depth + baseRadius) / (baseRadius * 2);
        
        // Neon color gradient depending on depth: pink (#EC4899) up front, purple (#8B5CF6) in back
        const hue = 320 - depthRatio * 60; // Shifting HSL hue index from pink (320) to purple (260)
        const opacity = 0.65 - depthRatio * 0.48; // Dim background lines significantly to emphasize depth

        ctx.strokeStyle = `hsla(${hue}, 92%, 68%, ${opacity})`;

        // Connect node to neighboring node in same longitude slice (Latitude Ring Connection)
        const nextLonIdx = (lonIdx + 1) % lonSegments;
        const pNextLon = projectedGrid[latIdx][nextLonIdx];

        ctx.beginPath();
        ctx.moveTo(pCurrent.x, pCurrent.y);
        ctx.lineTo(pNextLon.x, pNextLon.y);
        ctx.stroke();

        // Connect node to adjacent node in the next horizontal slice (Longitude Line Connection)
        if (latIdx < latSegments) {
          const pNextLat = projectedGrid[latIdx + 1][lonIdx];
          
          ctx.beginPath();
          ctx.moveTo(pCurrent.x, pCurrent.y);
          ctx.lineTo(pNextLat.x, pNextLat.y);
          ctx.stroke();
        }
      }
    }
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
    return 'Geometric Spherical Wave';
  }

  static get description() {
    return 'A rotating 3D wireframe spherical wave built using latitude/longitude projection. Interactive cursor bends rotation velocity and angle. Depth-shaded glowing lines shift color and opacity from neon pink to purple.';
  }

  static get vibe() {
    return 'Geometric';
  }

  static get sourceCode() {
    return `class GeometricSphericalWave {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.mouse = { x: null, y: null, active: false, rx: 0, ry: 0 };
    this.rot = { x: 0, y: 0, z: 0 };
    this.rotSpeed = { x: 0.004, y: 0.006, z: 0.002 };
    this.bg = '#080512';

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

    this.rot.x = Math.random() * Math.PI;
    this.rot.y = Math.random() * Math.PI;
    this.rot.z = 0;
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

    const baseRadius = Math.min(this.width, this.height) * 0.28;
    const centerGlow = this.ctx.createRadialGradient(
      this.width / 2, this.height / 2, 0,
      this.width / 2, this.height / 2, baseRadius * 1.5
    );
    centerGlow.addColorStop(0, 'rgba(236, 72, 153, 0.08)');
    centerGlow.addColorStop(0.5, 'rgba(168, 85, 247, 0.03)');
    centerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    this.ctx.fillStyle = centerGlow;
    this.ctx.fillRect(0, 0, this.width, this.height);

    if (this.mouse.active && this.mouse.x !== null) {
      const tx = (this.mouse.y - this.height / 2) * 0.00004;
      const ty = (this.mouse.x - this.width / 2) * 0.00004;

      this.rotSpeed.x = this.rotSpeed.x * 0.95 + tx * 0.05;
      this.rotSpeed.y = this.rotSpeed.y * 0.95 + ty * 0.05;
    } else {
      this.rotSpeed.x = this.rotSpeed.x * 0.98 + 0.004 * 0.02;
      this.rotSpeed.y = this.rotSpeed.y * 0.98 + 0.006 * 0.02;
    }

    this.rot.x += this.rotSpeed.x;
    this.rot.y += this.rotSpeed.y;
    this.rot.z += 0.002;

    const latSegments = 16;
    const lonSegments = 26;
    const fov = 450;

    const cosX = Math.cos(this.rot.x);
    const sinX = Math.sin(this.rot.x);
    const cosY = Math.cos(this.rot.y);
    const sinY = Math.sin(this.rot.y);
    const cosZ = Math.cos(this.rot.z);
    const sinZ = Math.sin(this.rot.z);

    const projectedGrid = [];

    for (let latIdx = 0; latIdx <= latSegments; latIdx++) {
      const latAngle = (latIdx / latSegments) * Math.PI - Math.PI / 2;
      const cosLat = Math.cos(latAngle);
      const sinLat = Math.sin(latAngle);

      projectedGrid[latIdx] = [];

      for (let lonIdx = 0; lonIdx < lonSegments; lonIdx++) {
        const lonAngle = (lonIdx / lonSegments) * Math.PI * 2 - Math.PI;
        const cosLon = Math.cos(lonAngle);
        const sinLon = Math.sin(lonAngle);

        const waveFrequency = 4.0;
        const waveSpeed = 0.0035;
        const waveAmplitude = baseRadius * 0.16;
        
        const waveOffset = Math.sin(latAngle * waveFrequency + lonAngle * 2.0 + time * waveSpeed) * waveAmplitude;
        const currentRadius = baseRadius + waveOffset;

        const x3d = currentRadius * cosLat * cosLon;
        const y3d = currentRadius * cosLat * sinLon;
        const z3d = currentRadius * sinLat;

        let rx = x3d * cosY - z3d * sinY;
        let rz = x3d * sinY + z3d * cosY;
        let ry = y3d * cosX - rz * sinX;
        rz = y3d * sinX + rz * cosX;
        const rxFinal = rx * cosZ - ry * sinZ;
        const ryFinal = rx * sinZ + ry * cosZ;

        const cameraZOffset = baseRadius * 1.6;
        const projectionScale = fov / (fov + rz + cameraZOffset);
        
        const screenX = this.width / 2 + rxFinal * projectionScale;
        const screenY = this.height / 2 + ryFinal * projectionScale;

        projectedGrid[latIdx][lonIdx] = {
          x: screenX,
          y: screenY,
          depth: rz
        };
      }
    }

    this.ctx.lineWidth = 1.0;

    for (let latIdx = 0; latIdx <= latSegments; latIdx++) {
      for (let lonIdx = 0; lonIdx < lonSegments; lonIdx++) {
        const pCurrent = projectedGrid[latIdx][lonIdx];
        const depthRatio = (pCurrent.depth + baseRadius) / (baseRadius * 2);
        const hue = 320 - depthRatio * 60;
        const opacity = 0.65 - depthRatio * 0.48;

        this.ctx.strokeStyle = \`hsla(\${hue}, 92%, 68%, \${opacity})\`;

        const nextLonIdx = (lonIdx + 1) % lonSegments;
        const pNextLon = projectedGrid[latIdx][nextLonIdx];

        this.ctx.beginPath();
        this.ctx.moveTo(pCurrent.x, pCurrent.y);
        this.ctx.lineTo(pNextLon.x, pNextLon.y);
        this.ctx.stroke();

        if (latIdx < latSegments) {
          const pNextLat = projectedGrid[latIdx + 1][lonIdx];
          
          this.ctx.beginPath();
          this.ctx.moveTo(pCurrent.x, pCurrent.y);
          this.ctx.lineTo(pNextLat.x, pNextLat.y);
          this.ctx.stroke();
        }
      }
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
