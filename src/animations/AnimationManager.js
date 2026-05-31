import BaseAnimation from './BaseAnimation.js';

export default class AnimationManager {
  /**
   * Create an AnimationManager.
   * @param {HTMLCanvasElement} canvas 
   * @param {Object} telemetry - DOM elements to report stats to
   */
  constructor(canvas, telemetry = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.activeAnimation = null;
    this.animationFrameId = null;
    
    // Performance Telemetry
    this.telemetry = telemetry;
    this.lastTime = 0;
    this.frameCount = 0;
    this.fpsTimer = 0;
    this.fps = 60;
    this.dpr = window.devicePixelRatio || 1;

    // Bound listeners for precise binding and unbinding
    this.resizeListener = this.handleResize.bind(this);
    this.mouseMoveListener = this.handleMouseMove.bind(this);
    this.mouseLeaveListener = this.handleMouseLeave.bind(this);

    this.setupListeners();
    this.handleResize();
  }

  /**
   * Bind event listeners to DOM and window elements.
   */
  setupListeners() {
    window.addEventListener('resize', this.resizeListener);
    this.canvas.addEventListener('mousemove', this.mouseMoveListener);
    this.canvas.addEventListener('mouseleave', this.mouseLeaveListener);
    // Touch support for mobile devices
    this.canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        if (this.activeAnimation) {
          this.activeAnimation.handleMouseMove(x, y);
        }
      }
    }, { passive: true });
    this.canvas.addEventListener('touchend', this.mouseLeaveListener, { passive: true });
  }

  /**
   * Set and activate a new background animation.
   * @param {typeof BaseAnimation} AnimationClass 
   */
  setAnimation(AnimationClass) {
    // 1. Clean up active animation
    if (this.activeAnimation) {
      this.activeAnimation.destroy();
      this.activeAnimation = null;
    }

    // 2. Stop rendering loop temporarily
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // 3. Reset telemetry timers
    this.lastTime = performance.now();
    this.frameCount = 0;
    this.fpsTimer = 0;

    // 4. Instantiate new class
    if (AnimationClass) {
      this.activeAnimation = new AnimationClass();
      
      // Perform viewport fitting
      const rect = this.canvas.getBoundingClientRect();
      this.activeAnimation.init(this.canvas);
      this.activeAnimation.resize(rect.width, rect.height);
      
      // 5. Start loop
      this.startLoop();
    }
  }

  /**
   * Run the continuous rendering loop.
   */
  startLoop() {
    const loop = (timestamp) => {
      // Calculate delta time
      const delta = timestamp - this.lastTime;
      this.lastTime = timestamp;

      // Track FPS
      this.frameCount++;
      this.fpsTimer += delta;
      
      if (this.fpsTimer >= 1000) {
        this.fps = Math.round((this.frameCount * 1000) / this.fpsTimer);
        this.frameCount = 0;
        this.fpsTimer = 0;
        this.updateTelemetry();
      }

      // Draw active animation
      if (this.activeAnimation) {
        // Clear canvas with base background or let animation handle trails
        // For standard animations, we clear but allow transparent backings
        this.activeAnimation.draw(this.ctx, timestamp);
      }

      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  /**
   * Handle responsive resize adjustments with Retina/High-DPI scaling.
   */
  handleResize() {
    this.dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();

    // Scale canvas buffer
    this.canvas.width = rect.width * this.dpr;
    this.canvas.height = rect.height * this.dpr;

    // Maintain context drawing space coordinate mapping
    this.ctx.scale(this.dpr, this.dpr);

    // Propagate changes to active animation
    if (this.activeAnimation) {
      this.activeAnimation.resize(rect.width, rect.height);
    }

    // Update canvas size metrics
    if (this.telemetry.dim) {
      this.telemetry.dim.textContent = `${Math.round(rect.width)} × ${Math.round(rect.height)}`;
    }
  }

  /**
   * Forward tracked cursor coordinate modifications.
   */
  handleMouseMove(e) {
    if (!this.activeAnimation) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    this.activeAnimation.handleMouseMove(x, y);
  }

  /**
   * Forward hover exit cues.
   */
  handleMouseLeave() {
    if (!this.activeAnimation) return;
    this.activeAnimation.handleMouseLeave();
  }

  /**
   * Update FPS stats text.
   */
  updateTelemetry() {
    if (this.telemetry.fps) {
      this.telemetry.fps.textContent = this.fps.toString().padStart(2, '0');
    }
  }

  /**
   * Unbind global window listeners to prevent leaks.
   */
  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.activeAnimation) {
      this.activeAnimation.destroy();
    }
    window.removeEventListener('resize', this.resizeListener);
    this.canvas.removeEventListener('mousemove', this.mouseMoveListener);
    this.canvas.removeEventListener('mouseleave', this.mouseLeaveListener);
  }
}
