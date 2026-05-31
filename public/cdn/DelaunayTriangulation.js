import BaseAnimation from './BaseAnimation.js';

export default class DelaunayTriangulation extends BaseAnimation {
  constructor() {
    super();
    this.nodes = [];
    this.mouse = { x: null, y: null, active: false, radius: 180 };
  }

  setup() {
    this.nodes = [];
    // Adjust density to ensure smooth 60fps rendering of triangulation
    const count = Math.min(55, Math.max(25, Math.floor((this.width * this.height) / 25000)));

    for (let i = 0; i < count; i++) {
      const vx = (Math.random() - 0.5) * 0.4;
      const vy = (Math.random() - 0.5) * 0.4;
      this.nodes.push({
        id: i,
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx, vy,
        originalVx: vx,
        originalVy: vy,
        pulseOffset: Math.random() * Math.PI * 2
      });
    }
  }

  resize(width, height) {
    super.resize(width, height);
    this.setup();
  }

  draw(ctx, time) {
    // Elegant deep indigo-charcoal backfill
    ctx.fillStyle = '#06050a';
    ctx.fillRect(0, 0, this.width, this.height);

    // 1. Particle physics drift & boundaries
    this.nodes.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;

      // Bounce boundaries
      if (p.x < 0 || p.x > this.width) p.vx = -p.vx;
      if (p.y < 0 || p.y > this.height) p.vy = -p.vy;

      // Mouse interactive push/pull force
      if (this.mouse.active && this.mouse.x !== null) {
        const dx = this.mouse.x - p.x;
        const dy = this.mouse.y - p.y;
        const dist = Math.hypot(dx, dy);

        if (dist < this.mouse.radius) {
          const force = (this.mouse.radius - dist) / this.mouse.radius;
          // Elastic repellent force
          p.vx -= (dx / dist) * force * 0.08;
          p.vy -= (dy / dist) * force * 0.08;
        }
      }

      // Return gradually to original drift (Damping)
      p.vx = p.vx * 0.95 + p.originalVx * 0.05;
      p.vy = p.vy * 0.95 + p.originalVy * 0.05;
    });

    // 2. Prepare triangulation vertices
    const vertices = this.nodes.map(n => ({ x: n.x, y: n.y, id: n.id }));
    
    // Include cursor dynamically as a primary structural vertex
    if (this.mouse.active && this.mouse.x !== null) {
      vertices.push({ x: this.mouse.x, y: this.mouse.y, id: -1 });
    }

    // 3. Bowyer-Watson Triangulation Algorithm
    const triangles = this.triangulate(vertices);

    // 4. Render Triangulation Mesh
    triangles.forEach(t => {
      // Shifting gradients from electric violet to rose pink
      const midY = (t.p1.y + t.p2.y + t.p3.y) / 3;
      const hue = 280 + (midY / this.height) * 60 + Math.sin(time * 0.001) * 15; // Electric Violet to Rose Pink

      ctx.beginPath();
      ctx.moveTo(t.p1.x, t.p1.y);
      ctx.lineTo(t.p2.x, t.p2.y);
      ctx.lineTo(t.p3.x, t.p3.y);
      ctx.closePath();

      // Dynamic color filling based on time and height
      ctx.fillStyle = `hsla(${hue}, 100%, 65%, 0.035)`;
      ctx.fill();

      // Glowing wireframe
      ctx.strokeStyle = `hsla(${hue}, 100%, 65%, 0.12)`;
      ctx.lineWidth = 0.85;
      ctx.stroke();
    });

    // 5. Draw node visual landmarks
    vertices.forEach(v => {
      const isMouseNode = v.id === -1;
      ctx.beginPath();
      ctx.arc(v.x, v.y, isMouseNode ? 4.5 : 2, 0, Math.PI * 2);
      ctx.fillStyle = isMouseNode ? '#FF3366' : '#BB33FF';
      ctx.shadowBlur = isMouseNode ? 10 : 4;
      ctx.shadowColor = isMouseNode ? '#FF3366' : '#BB33FF';
      ctx.fill();
    });

    ctx.shadowBlur = 0; // Reset for performance
  }

  // Bowyer-Watson Delaunay triangulation implementation
  triangulate(points) {
    // Define super-triangle bounding all coordinates
    const superTriangle = {
      p1: { x: this.width / 2, y: -this.height * 3 },
      p2: { x: -this.width * 3, y: this.height * 2 },
      p3: { x: this.width * 4, y: this.height * 2 }
    };

    let triangles = [superTriangle];

    points.forEach(p => {
      const badTriangles = [];
      triangles.forEach(t => {
        if (this.inCircumcircle(p, t)) {
          badTriangles.push(t);
        }
      });

      // Find boundary edges of the polygon formed by bad triangles
      const polygon = [];
      badTriangles.forEach(t => {
        const edges = [
          { p1: t.p1, p2: t.p2 },
          { p1: t.p2, p2: t.p3 },
          { p1: t.p3, p2: t.p1 }
        ];

        edges.forEach(e => {
          let shared = false;
          badTriangles.forEach(otherT => {
            if (t === otherT) return;
            const otherEdges = [
              { p1: otherT.p1, p2: otherT.p2 },
              { p1: otherT.p2, p2: otherT.p3 },
              { p1: otherT.p3, p2: otherT.p1 }
            ];
            otherEdges.forEach(oe => {
              if ((this.isEqualPoint(e.p1, oe.p1) && this.isEqualPoint(e.p2, oe.p2)) ||
                  (this.isEqualPoint(e.p1, oe.p2) && this.isEqualPoint(e.p2, oe.p1))) {
                shared = true;
              }
            });
          });

          if (!shared) {
            polygon.push(e);
          }
        });
      });

      // Remove bad triangles from the list
      triangles = triangles.filter(t => !badTriangles.includes(t));

      // Re-triangulate the polygonal hole using the new point
      polygon.forEach(edge => {
        triangles.push({
          p1: edge.p1,
          p2: edge.p2,
          p3: p
        });
      });
    });

    // Remove super-triangle vertices connections
    return triangles.filter(t => {
      return !this.sharesVertex(t, superTriangle);
    });
  }

  // Check if point is inside circumcircle of triangle
  inCircumcircle(p, t) {
    const d = 2 * (t.p1.x * (t.p2.y - t.p3.y) + t.p2.x * (t.p3.y - t.p1.y) + t.p3.x * (t.p1.y - t.p2.y));
    if (Math.abs(d) < 0.00001) return false;

    const ux = ((t.p1.x * t.p1.x + t.p1.y * t.p1.y) * (t.p2.y - t.p3.y) + (t.p2.x * t.p2.x + t.p2.y * t.p2.y) * (t.p3.y - t.p1.y) + (t.p3.x * t.p3.x + t.p3.y * t.p3.y) * (t.p1.y - t.p2.y)) / d;
    const uy = ((t.p1.x * t.p1.x + t.p1.y * t.p1.y) * (t.p3.x - t.p2.x) + (t.p2.x * t.p2.x + t.p2.y * t.p2.y) * (t.p1.x - t.p3.x) + (t.p3.x * t.p3.x + t.p3.y * t.p3.y) * (t.p2.x - t.p1.x)) / d;
    const r = Math.hypot(t.p1.x - ux, t.p1.y - uy);

    return Math.hypot(p.x - ux, p.y - uy) < r;
  }

  isEqualPoint(p1, p2) {
    return p1.x === p2.x && p1.y === p2.y;
  }

  sharesVertex(t1, t2) {
    const vertices = [t1.p1, t1.p2, t1.p3];
    const superVertices = [t2.p1, t2.p2, t2.p3];
    return vertices.some(v => superVertices.some(sv => this.isEqualPoint(v, sv)));
  }

  destroy() {
    super.destroy();
    this.nodes = [];
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
    return 'Delaunay Triangulation';
  }

  static get description() {
    return 'Drifting spatial landmarks generating self-healing Delaunay geometric grids. Hover to introduce your cursor as a structural anchor, altering connections with violet/rose gradient fills.';
  }

  static get vibe() {
    return 'Structural';
  }

  static get sourceCode() {
    return `class DelaunayTriangulation {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.nodes = [];
    this.mouse = { x: null, y: null, active: false, radius: 180 };
    
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
    this.nodes = [];
    const count = Math.min(55, Math.max(25, Math.floor((this.width * this.height) / 25000)));

    for (let i = 0; i < count; i++) {
      const vx = (Math.random() - 0.5) * 0.4;
      const vy = (Math.random() - 0.5) * 0.4;
      this.nodes.push({
        id: i,
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx, vy,
        originalVx: vx,
        originalVy: vy
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
    this.setup();
  }

  animate(time = 0) {
    this.ctx.fillStyle = '#06050a';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.nodes.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > this.width) p.vx = -p.vx;
      if (p.y < 0 || p.y > this.height) p.vy = -p.vy;

      if (this.mouse.active && this.mouse.x !== null) {
        const dx = this.mouse.x - p.x;
        const dy = this.mouse.y - p.y;
        const dist = Math.hypot(dx, dy);

        if (dist < this.mouse.radius) {
          const force = (this.mouse.radius - dist) / this.mouse.radius;
          p.vx -= (dx / dist) * force * 0.08;
          p.vy -= (dy / dist) * force * 0.08;
        }
      }

      p.vx = p.vx * 0.95 + p.originalVx * 0.05;
      p.vy = p.vy * 0.95 + p.originalVy * 0.05;
    });

    const vertices = this.nodes.map(n => ({ x: n.x, y: n.y, id: n.id }));
    if (this.mouse.active && this.mouse.x !== null) {
      vertices.push({ x: this.mouse.x, y: this.mouse.y, id: -1 });
    }

    const triangles = this.triangulate(vertices);

    triangles.forEach(t => {
      const midY = (t.p1.y + t.p2.y + t.p3.y) / 3;
      const hue = 280 + (midY / this.height) * 60 + Math.sin(time * 0.001) * 15;

      this.ctx.beginPath();
      this.ctx.moveTo(t.p1.x, t.p1.y);
      this.ctx.lineTo(t.p2.x, t.p2.y);
      this.ctx.lineTo(t.p3.x, t.p3.y);
      this.ctx.closePath();

      this.ctx.fillStyle = \`hsla(\${hue}, 100%, 65%, 0.035)\`;
      this.ctx.fill();

      this.ctx.strokeStyle = \`hsla(\${hue}, 100%, 65%, 0.12)\`;
      this.ctx.lineWidth = 0.85;
      this.ctx.stroke();
    });

    vertices.forEach(v => {
      const isMouseNode = v.id === -1;
      this.ctx.beginPath();
      this.ctx.arc(v.x, v.y, isMouseNode ? 4.5 : 2, 0, Math.PI * 2);
      this.ctx.fillStyle = isMouseNode ? '#FF3366' : '#BB33FF';
      this.ctx.shadowBlur = isMouseNode ? 10 : 4;
      this.ctx.shadowColor = isMouseNode ? '#FF3366' : '#BB33FF';
      this.ctx.fill();
    });

    this.ctx.shadowBlur = 0;
    requestAnimationFrame((t) => this.animate(t));
  }

  triangulate(points) {
    const superTriangle = {
      p1: { x: this.width / 2, y: -this.height * 3 },
      p2: { x: -this.width * 3, y: this.height * 2 },
      p3: { x: this.width * 4, y: this.height * 2 }
    };

    let triangles = [superTriangle];

    points.forEach(p => {
      const badTriangles = [];
      triangles.forEach(t => {
        if (this.inCircumcircle(p, t)) {
          badTriangles.push(t);
        }
      });

      const polygon = [];
      badTriangles.forEach(t => {
        const edges = [
          { p1: t.p1, p2: t.p2 },
          { p1: t.p2, p2: t.p3 },
          { p1: t.p3, p2: t.p1 }
        ];

        edges.forEach(e => {
          let shared = false;
          badTriangles.forEach(otherT => {
            if (t === otherT) return;
            const otherEdges = [
              { p1: otherT.p1, p2: otherT.p2 },
              { p1: otherT.p2, p2: otherT.p3 },
              { p1: otherT.p3, p2: otherT.p1 }
            ];
            otherEdges.forEach(oe => {
              if ((this.isEqualPoint(e.p1, oe.p1) && this.isEqualPoint(e.p2, oe.p2)) ||
                  (this.isEqualPoint(e.p1, oe.p2) && this.isEqualPoint(e.p2, oe.p1))) {
                shared = true;
              }
            });
          });

          if (!shared) {
            polygon.push(e);
          }
        });
      });

      triangles = triangles.filter(t => !badTriangles.includes(t));

      polygon.forEach(edge => {
        triangles.push({
          p1: edge.p1,
          p2: edge.p2,
          p3: p
        });
      });
    });

    return triangles.filter(t => {
      return !this.sharesVertex(t, superTriangle);
    });
  }

  inCircumcircle(p, t) {
    const d = 2 * (t.p1.x * (t.p2.y - t.p3.y) + t.p2.x * (t.p3.y - t.p1.y) + t.p3.x * (t.p1.y - t.p2.y));
    if (Math.abs(d) < 0.00001) return false;

    const ux = ((t.p1.x * t.p1.x + t.p1.y * t.p1.y) * (t.p2.y - t.p3.y) + (t.p2.x * t.p2.x + t.p2.y * t.p2.y) * (t.p3.y - t.p1.y) + (t.p3.x * t.p3.x + t.p3.y * t.p3.y) * (t.p1.y - t.p2.y)) / d;
    const uy = ((t.p1.x * t.p1.x + t.p1.y * t.p1.y) * (t.p3.x - t.p2.x) + (t.p2.x * t.p2.x + t.p2.y * t.p2.y) * (t.p1.x - t.p3.x) + (t.p3.x * t.p3.x + t.p3.y * t.p3.y) * (t.p2.x - t.p1.x)) / d;
    const r = Math.hypot(t.p1.x - ux, t.p1.y - uy);

    return Math.hypot(p.x - ux, p.y - uy) < r;
  }

  isEqualPoint(p1, p2) {
    return p1.x === p2.x && p1.y === p2.y;
  }

  sharesVertex(t1, t2) {
    const vertices = [t1.p1, t1.p2, t1.p3];
    const superVertices = [t2.p1, t2.p2, t2.p3];
    return vertices.some(v => superVertices.some(sv => this.isEqualPoint(v, sv)));
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
