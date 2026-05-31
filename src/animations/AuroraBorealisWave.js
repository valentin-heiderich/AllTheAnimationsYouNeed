import BaseAnimation from './BaseAnimation.js';

export default class AuroraBorealisWave extends BaseAnimation {
  constructor() {
    super();
    this.mouse = { x: null, y: null, active: false, radius: 200 };
    // Auroral green and purple/violet palettes
    this.colors = {
      green: 'rgba(0, 255, 110, ',   // neon green (alpha concatenated dynamically)
      purple: 'rgba(189, 0, 255, ',  // glowing purple
      blue: 'rgba(0, 114, 255, ',    // deep teal/blue
      magenta: 'rgba(255, 0, 180, '  // vibrant magenta
    };
    this.curtains = [];
  }

  setup() {
    // Configure independent auroral curtain sheets
    // Each has its own speed, scale, base color, height offsets, and phase
    this.curtains = [
      {
        primaryColor: this.colors.green,
        secondaryColor: this.colors.blue,
        yStartRatio: 0.12,
        yEndRatio: 0.82,
        speed: 0.0006,
        freqX: 0.004,
        amplitude: 55,
        phaseOffset: 0,
        verticalFolds: 14
      },
      {
        primaryColor: this.colors.purple,
        secondaryColor: this.colors.magenta,
        yStartRatio: 0.18,
        yEndRatio: 0.88,
        speed: 0.00045,
        freqX: 0.003,
        amplitude: 75,
        phaseOffset: Math.PI * 0.4,
        verticalFolds: 11
      },
      {
        primaryColor: this.colors.green,
        secondaryColor: this.colors.purple,
        yStartRatio: 0.05,
        yEndRatio: 0.75,
        speed: 0.0003,
        freqX: 0.005,
        amplitude: 45,
        phaseOffset: Math.PI * 0.8,
        verticalFolds: 18
      }
    ];
  }

  resize(width, height) {
    super.resize(width, height);
  }

  draw(ctx, time) {
    // 1. Deep night sky base with a very subtle purple-navy gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.height);
    skyGrad.addColorStop(0, '#020107');
    skyGrad.addColorStop(0.5, '#04030d');
    skyGrad.addColorStop(1, '#070514');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Composite operation to blend the overlapping translucent sheets gorgeously
    ctx.globalCompositeOperation = 'screen';

    // Render each curtain sheet
    this.curtains.forEach((curtain, cIdx) => {
      const timeOffset = time * curtain.speed;
      
      // Calculate top and bottom boundaries based on ratio
      const startY = this.height * curtain.yStartRatio;
      const endY = this.height * curtain.yEndRatio;
      const heightSpan = endY - startY;

      // Draw the curtain by rendering closely-spaced vertical Bezier chords
      // Drawing every 5 pixels provides high performance and a rich, solid fold structure
      const stepX = 5;
      for (let x = 0; x < this.width; x += stepX) {
        
        // 1. Double sine wave modulation for horizontal displacement (simulates billowing folds)
        const wave1 = Math.sin(x * curtain.freqX + timeOffset + curtain.phaseOffset);
        const wave2 = Math.cos(x * (curtain.freqX * 0.4) - timeOffset * 0.7 + curtain.phaseOffset * 1.5);
        
        // Combine waves for organic, complex folding structures
        let foldOffset = (wave1 * 0.7 + wave2 * 0.3) * curtain.amplitude;

        // 2. Cursor distortion: local magnetic warp that bends the aurora waves
        let hoverWarp = 0;
        let hoverBrighten = 0;

        if (this.mouse.active && this.mouse.x !== null) {
          const dx = x - this.mouse.x;
          // Warp calculations based on x proximity
          if (Math.abs(dx) < this.mouse.radius) {
            const force = (this.mouse.radius - Math.abs(dx)) / this.mouse.radius; // 0 to 1
            
            // Warp pushes the auroral curtains away or bends them locally
            hoverWarp = Math.sin(dx * 0.02) * force * 50;
            // Excite the curtain making it grow brighter near cursor
            hoverBrighten = force * 0.4;
          }
        }

        const adjustedX = x + foldOffset + hoverWarp;

        // 3. Modulate vertical curtain height with low frequency wave
        const heightMod = Math.sin(x * 0.002 + timeOffset * 0.5) * 25;
        const currentStartY = startY + heightMod;
        const currentEndY = endY - heightMod;

        // 4. Calculate control points for vertical cubic Bezier chords
        // By shifting control points, the curtains appear to swing three-dimensionally
        const cp1x = adjustedX + Math.sin(timeOffset * 2.0 + x * 0.01) * 35;
        const cp1y = currentStartY + heightSpan * 0.25;

        const cp2x = adjustedX - Math.cos(timeOffset * 1.5 - x * 0.015) * 45;
        const cp2y = currentEndY - heightSpan * 0.25;

        // 5. Build dynamic vertical color gradient for this specific slice
        const sliceGrad = ctx.createLinearGradient(adjustedX, currentStartY, adjustedX, currentEndY);
        
        // Combine colors with sinusoidal blending across the width
        const blendFactor = (Math.sin(x * 0.002 + timeOffset * 0.3) + 1) / 2;
        const baseAlpha = (0.04 + Math.sin(x * 0.01 + timeOffset * 2.0) * 0.02) * (1.0 - cIdx * 0.1) + hoverBrighten;

        // Top is fading out, middle is bright neon, bottom falls off into a soft mist
        sliceGrad.addColorStop(0, curtain.secondaryColor + '0.0)');
        sliceGrad.addColorStop(0.2, curtain.secondaryColor + (baseAlpha * 0.45).toFixed(3) + ')');
        sliceGrad.addColorStop(0.5, curtain.primaryColor + (baseAlpha * 1.0).toFixed(3) + ')');
        sliceGrad.addColorStop(0.8, curtain.secondaryColor + (baseAlpha * 0.6).toFixed(3) + ')');
        sliceGrad.addColorStop(1, curtain.primaryColor + '0.0)');

        // Draw vertical ribbon slice
        ctx.beginPath();
        ctx.moveTo(adjustedX, currentStartY);
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, adjustedX, currentEndY);
        
        ctx.strokeStyle = sliceGrad;
        ctx.lineWidth = 4.8; // thick overlapping lines to build the curtain density
        ctx.stroke();
      }
    });

    // Restore standard blend mode for any other layers
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1.0;
  }

  destroy() {
    this.curtains = [];
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
    return 'Aurora Borealis Wave';
  }

  static get description() {
    return 'Atmospheric simulation of slowly waving vertical green and purple auroral sheets. Crafted with closely-spaced vertical cubic Bezier chords modulated by multiple phase-shifted sine waves. Cursor acts as a magnetic distortion that warp folds in real-time.';
  }

  static get vibe() {
    return 'Atmospheric';
  }

  static get sourceCode() {
    return `class AuroraBorealisWave {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.mouse = { x: null, y: null, active: false, radius: 200 };
    
    this.colors = {
      green: 'rgba(0, 255, 110, ',
      purple: 'rgba(189, 0, 255, ',
      blue: 'rgba(0, 114, 255, ',
      magenta: 'rgba(255, 0, 180, '
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
    this.curtains = [
      {
        primaryColor: this.colors.green,
        secondaryColor: this.colors.blue,
        yStartRatio: 0.12,
        yEndRatio: 0.82,
        speed: 0.0006,
        freqX: 0.004,
        amplitude: 55,
        phaseOffset: 0
      },
      {
        primaryColor: this.colors.purple,
        secondaryColor: this.colors.magenta,
        yStartRatio: 0.18,
        yEndRatio: 0.88,
        speed: 0.00045,
        freqX: 0.003,
        amplitude: 75,
        phaseOffset: Math.PI * 0.4
      },
      {
        primaryColor: this.colors.green,
        secondaryColor: this.colors.purple,
        yStartRatio: 0.05,
        yEndRatio: 0.75,
        speed: 0.0003,
        freqX: 0.005,
        amplitude: 45,
        phaseOffset: Math.PI * 0.8
      }
    ];
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
    const skyGrad = this.ctx.createLinearGradient(0, 0, 0, this.height);
    skyGrad.addColorStop(0, '#020107');
    skyGrad.addColorStop(0.5, '#04030d');
    skyGrad.addColorStop(1, '#070514');
    this.ctx.fillStyle = skyGrad;
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.globalCompositeOperation = 'screen';

    this.curtains.forEach((curtain, cIdx) => {
      const timeOffset = time * curtain.speed;
      const startY = this.height * curtain.yStartRatio;
      const endY = this.height * curtain.yEndRatio;
      const heightSpan = endY - startY;

      const stepX = 5;
      for (let x = 0; x < this.width; x += stepX) {
        const wave1 = Math.sin(x * curtain.freqX + timeOffset + curtain.phaseOffset);
        const wave2 = Math.cos(x * (curtain.freqX * 0.4) - timeOffset * 0.7 + curtain.phaseOffset * 1.5);
        let foldOffset = (wave1 * 0.7 + wave2 * 0.3) * curtain.amplitude;

        let hoverWarp = 0;
        let hoverBrighten = 0;

        if (this.mouse.active && this.mouse.x !== null) {
          const dx = x - this.mouse.x;
          if (Math.abs(dx) < this.mouse.radius) {
            const force = (this.mouse.radius - Math.abs(dx)) / this.mouse.radius;
            hoverWarp = Math.sin(dx * 0.02) * force * 50;
            hoverBrighten = force * 0.4;
          }
        }

        const adjustedX = x + foldOffset + hoverWarp;
        const heightMod = Math.sin(x * 0.002 + timeOffset * 0.5) * 25;
        const currentStartY = startY + heightMod;
        const currentEndY = endY - heightMod;

        const cp1x = adjustedX + Math.sin(timeOffset * 2.0 + x * 0.01) * 35;
        const cp1y = currentStartY + heightSpan * 0.25;

        const cp2x = adjustedX - Math.cos(timeOffset * 1.5 - x * 0.015) * 45;
        const cp2y = currentEndY - heightSpan * 0.25;

        const sliceGrad = this.ctx.createLinearGradient(adjustedX, currentStartY, adjustedX, currentEndY);
        const baseAlpha = (0.04 + Math.sin(x * 0.01 + timeOffset * 2.0) * 0.02) * (1.0 - cIdx * 0.1) + hoverBrighten;

        sliceGrad.addColorStop(0, curtain.secondaryColor + '0.0)');
        sliceGrad.addColorStop(0.2, curtain.secondaryColor + Math.max(0, baseAlpha * 0.45).toFixed(3) + ')');
        sliceGrad.addColorStop(0.5, curtain.primaryColor + Math.max(0, baseAlpha * 1.0).toFixed(3) + ')');
        sliceGrad.addColorStop(0.8, curtain.secondaryColor + Math.max(0, baseAlpha * 0.6).toFixed(3) + ')');
        sliceGrad.addColorStop(1, curtain.primaryColor + '0.0)');

        this.ctx.beginPath();
        this.ctx.moveTo(adjustedX, currentStartY);
        this.ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, adjustedX, currentEndY);
        
        this.ctx.strokeStyle = sliceGrad;
        this.ctx.lineWidth = 4.8;
        this.ctx.stroke();
      }
    });

    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.globalAlpha = 1.0;
    
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
