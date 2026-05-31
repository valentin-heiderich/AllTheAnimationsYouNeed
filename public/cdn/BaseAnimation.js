/**
 * BaseAnimation class
 * Abstract representation of a canvas background animation.
 * All custom animations must extend this class and override its methods.
 */
export default class BaseAnimation {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.width = 0;
    this.height = 0;
  }

  /**
   * Initialize the animation on a canvas element.
   * @param {HTMLCanvasElement} canvas 
   */
  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;
    
    this.setup();
  }

  /**
   * Perform initial state and particle setup.
   * Override in subclass.
   */
  setup() {}

  /**
   * Handle resize events.
   * @param {number} width 
   * @param {number} height 
   */
  resize(width, height) {
    this.width = width;
    this.height = height;
  }

  /**
   * Draw loop execution frame.
   * Override in subclass.
   * @param {CanvasRenderingContext2D} ctx 
   * @param {number} time - current timestamp in milliseconds
   */
  draw(ctx, time) {}

  /**
   * Tear down state and event listeners to prevent memory leaks.
   * Override in subclass.
   */
  destroy() {
    this.canvas = null;
    this.ctx = null;
  }

  /**
   * Process mouse movement interactions.
   * Override in subclass.
   * @param {number} x - canvas-relative x coordinate
   * @param {number} y - canvas-relative y coordinate
   */
  handleMouseMove(x, y) {}

  /**
   * Process mouse exit interactions.
   * Override in subclass.
   */
  handleMouseLeave() {}

  // Metadata Getters (to be overridden by subclasses)
  static get title() {
    return 'Base Animation';
  }

  static get description() {
    return 'Abstract base template for AetherFlow canvas renderings.';
  }

  static get vibe() {
    return 'Minimal';
  }

  static get sourceCode() {
    return '// BaseAnimation Source Code';
  }
}
