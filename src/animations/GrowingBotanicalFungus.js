import BaseAnimation from './BaseAnimation.js';

export default class GrowingBotanicalFungus extends BaseAnimation {
  constructor() {
    super();
    this.nodes = [];
    this.tips = [];
    this.pulses = [];
    this.mouse = { x: null, y: null, active: false };
    
    // Bio-electric bioluminescent palette
    this.colors = {
      bg: '#030605', // Deep organic swamp loam
      hyphae: 'rgba(145, 185, 155, 0.28)', // Cozy sage-moss green, beautifully visible!
      hyphaeGlow: 'rgba(0, 240, 255, 0.75)', // Glowing excited mycelium
      pulseCore: '#ffffff', // High-intensity spark
      pulseGlow: '#00ffb7' // Teal-neon electric field glow
    };
  }

  setup() {
    this.nodes = [];
    this.tips = [];
    this.pulses = [];
    
    // Spawn 4 core spores across the canvas quadrants
    const rootCount = 4;
    const padding = 150;
    
    const rootLocations = [
      { x: padding, y: padding },
      { x: this.width - padding, y: padding },
      { x: padding, y: this.height - padding },
      { x: this.width - padding, y: this.height - padding }
    ];

    rootLocations.forEach((loc, idx) => {
      // Add first root node
      const rootNode = {
        x: loc.x + (Math.random() - 0.5) * 50,
        y: loc.y + (Math.random() - 0.5) * 50,
        parent: null,
        children: [],
        glow: 0,
        age: 0
      };
      
      this.nodes.push(rootNode);
      const rootIdx = this.nodes.length - 1;

      // Spawn 3 active branching tips from each spore
      for (let j = 0; j < 3; j++) {
        const angle = (idx * Math.PI / 2) + (j - 1) * 0.45 + (Math.random() - 0.5) * 0.2;
        this.tips.push({
          x: rootNode.x,
          y: rootNode.y,
          angle,
          speed: 1.2 + Math.random() * 0.8,
          parentIdx: rootIdx,
          stuck: false
        });
      }
    });
  }

  resize(width, height) {
    super.resize(width, height);
    this.setup();
  }

  draw(ctx, time) {
    // 1. Dark moss backdrop
    ctx.fillStyle = this.colors.bg;
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Perform slow growing algorithm (limit node size)
    const maxNodes = 1200;
    
    if (this.nodes.length < maxNodes) {
      this.tips.forEach(tp => {
        if (tp.stuck) return;

        // Active growth steering
        let targetAngle = tp.angle;
        if (this.mouse.active && this.mouse.x !== null) {
          // Attracted slowly to the warm light of the mouse
          const dx = this.mouse.x - tp.x;
          const dy = this.mouse.y - tp.y;
          const dist = Math.hypot(dx, dy);
          
          if (dist < 280) {
            targetAngle = Math.atan2(dy, dx);
          }
        }

        // Apply steering and noise
        tp.angle += (targetAngle - tp.angle) * 0.05;
        tp.angle += (Math.random() - 0.5) * 0.3;

        // Move tip forward
        tp.x += Math.cos(tp.angle) * tp.speed;
        tp.y += Math.sin(tp.angle) * tp.speed;

        // Contact Inhibition: check if running into existing networks
        let collides = false;
        for (let i = 0; i < this.nodes.length; i++) {
          // Skip immediate parent to prevent false collisions
          if (i === tp.parentIdx) continue;
          
          const dx = tp.x - this.nodes[i].x;
          const dy = tp.y - this.nodes[i].y;
          if (Math.hypot(dx, dy) < 14) {
            collides = true;
            break;
          }
        }

        // Stop tips running outside of canvas boundaries
        if (tp.x < 10 || tp.x > this.width - 10 || tp.y < 10 || tp.y > this.height - 10) {
          collides = true;
        }

        if (collides) {
          tp.stuck = true;
          return;
        }

        // Add node
        const newNode = {
          x: tp.x,
          y: tp.y,
          parent: tp.parentIdx,
          children: [],
          glow: 0,
          age: 0
        };

        this.nodes.push(newNode);
        const newIdx = this.nodes.length - 1;
        
        // Link child index to parent node
        this.nodes[tp.parentIdx].children.push(newIdx);
        
        // Retarget tip parent index
        tp.parentIdx = newIdx;

        // Mycelial branching: 2.2% chance to branch out into multiple tips
        if (Math.random() < 0.022 && this.tips.filter(t => !t.stuck).length < 40) {
          const branchSide = Math.random() > 0.5 ? 1 : -1;
          const branchAngle = tp.angle + (0.35 + Math.random() * 0.25) * branchSide;
          
          this.tips.push({
            x: tp.x,
            y: tp.y,
            angle: branchAngle,
            speed: tp.speed * (0.85 + Math.random() * 0.15),
            parentIdx: newIdx,
            stuck: false
          });
        }
      });
    }

    // 3. Spontaneous electric action potentials at tip nodes
    if (Math.random() < 0.025 && this.nodes.length > 50) {
      const activeTips = this.tips.filter(t => !t.stuck);
      if (activeTips.length > 0) {
        const randTip = activeTips[Math.floor(Math.random() * activeTips.length)];
        this.triggerElectricPulse(randTip.parentIdx);
      }
    }

    // 4. Mouse interaction: hovering near nodes triggers cascades
    if (this.mouse.active && this.mouse.x !== null) {
      for (let i = 0; i < this.nodes.length; i += 4) { // Sample subset for fast performance
        const node = this.nodes[i];
        const dist = Math.hypot(node.x - this.mouse.x, node.y - this.mouse.y);
        
        if (dist < 70 && node.glow < 0.05) {
          this.triggerElectricPulse(i);
        }
      }
    }

    // 5. Update propagating bio-electric action potentials
    for (let i = this.pulses.length - 1; i >= 0; i--) {
      const p = this.pulses[i];
      p.life += 0.1;

      if (p.life >= 1.0) {
        // Advance pulse to neighbor connections
        const currNode = this.nodes[p.nodeIdx];
        
        if (currNode) {
          // Gather connected nodes (children & parent)
          const paths = [...currNode.children];
          if (currNode.parent !== null) {
            paths.push(currNode.parent);
          }

          // Disperse charge to non-visited connections
          paths.forEach(nextIdx => {
            if (nextIdx !== p.prevIdx) {
              this.pulses.push({
                nodeIdx: nextIdx,
                prevIdx: p.nodeIdx,
                life: 0
              });
            }
          });
        }

        // Decay pulse
        this.pulses.splice(i, 1);
      }
    }

    // 6. Draw Mycelial Network
    this.nodes.forEach(node => {
      // Glow decay dynamics
      if (node.glow > 0) {
        node.glow -= 0.035;
        if (node.glow < 0) node.glow = 0;
      }

      if (node.parent !== null) {
        const parentNode = this.nodes[node.parent];
        
        ctx.beginPath();
        ctx.moveTo(node.x, node.y);
        ctx.lineTo(parentNode.x, parentNode.y);
        
        // Highlight active pathways during electrical spikes
        const glowVal = Math.max(node.glow, parentNode.glow);
        if (glowVal > 0) {
          ctx.strokeStyle = this.colors.hyphaeGlow;
          ctx.lineWidth = 1.8 + glowVal * 2.2;
          ctx.globalAlpha = Math.min(1, 0.2 + glowVal * 0.8);
        } else {
          ctx.strokeStyle = this.colors.hyphae;
          ctx.lineWidth = 1.15;
          ctx.globalAlpha = 0.75;
        }
        ctx.stroke();
      }
    });
    ctx.globalAlpha = 1.0;

    // 7. Render high-intensity glowing pulse cores
    this.pulses.forEach(p => {
      const node = this.nodes[p.nodeIdx];
      if (!node) return;

      // Charge up node glow state
      node.glow = 1.0;

      // Interpolate traveling spark coordinate along segment path
      let drawX = node.x;
      let drawY = node.y;
      
      if (p.prevIdx !== null) {
        const prevNode = this.nodes[p.prevIdx];
        if (prevNode) {
          drawX = prevNode.x + (node.x - prevNode.x) * p.life;
          drawY = prevNode.y + (node.y - prevNode.y) * p.life;
        }
      }

      // Render glowing electric fields
      ctx.beginPath();
      ctx.arc(drawX, drawY, 8.5, 0, Math.PI * 2);
      ctx.fillStyle = this.colors.pulseGlow;
      ctx.globalAlpha = 0.25;
      ctx.fill();

      // Sharp bio-electric core spark
      ctx.beginPath();
      ctx.arc(drawX, drawY, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = this.colors.pulseCore;
      ctx.globalAlpha = 0.95;
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // Slow organic mycelial fade and reboot if max network density is reached
    if (this.nodes.length >= maxNodes && this.pulses.length === 0) {
      if (Math.random() < 0.003) {
        this.setup(); // Reset
      }
    }
  }

  triggerElectricPulse(nodeIdx) {
    if (this.pulses.length > 150) return; // Cap maximum cascading spikes
    this.pulses.push({
      nodeIdx: nodeIdx,
      prevIdx: null,
      life: 0
    });
  }

  destroy() {
    this.nodes = [];
    this.tips = [];
    this.pulses = [];
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
    return 'Growing Botanical Fungus';
  }

  static get description() {
    return 'Branching coordinate-based mycelium network expanding across dark forest damp soil. Dynamic contact-inhibited branching logic ensures natural self-avoiding structures, while mouse hovers excite node networks, sending flowing cascades of bio-electric light waves rippling through fungal synapses.';
  }

  static get vibe() {
    return 'Biological';
  }

  static get sourceCode() {
    return `class GrowingBotanicalFungus {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.nodes = [];
    this.tips = [];
    this.pulses = [];
    this.mouse = { x: null, y: null, active: false };
    
    this.colors = {
      bg: '#030605',
      hyphae: 'rgba(145, 185, 155, 0.28)',
      hyphaeGlow: 'rgba(0, 240, 255, 0.75)',
      pulseCore: '#ffffff',
      pulseGlow: '#00ffb7'
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
    this.nodes = [];
    this.tips = [];
    this.pulses = [];
    
    const rootCount = 4;
    const padding = 150;
    const rootLocations = [
      { x: padding, y: padding },
      { x: this.width - padding, y: padding },
      { x: padding, y: this.height - padding },
      { x: this.width - padding, y: this.height - padding }
    ];

    rootLocations.forEach((loc, idx) => {
      const rootNode = {
        x: loc.x + (Math.random() - 0.5) * 50,
        y: loc.y + (Math.random() - 0.5) * 50,
        parent: null,
        children: [],
        glow: 0,
        age: 0
      };
      
      this.nodes.push(rootNode);
      const rootIdx = this.nodes.length - 1;

      for (let j = 0; j < 3; j++) {
        const angle = (idx * Math.PI / 2) + (j - 1) * 0.45 + (Math.random() - 0.5) * 0.2;
        this.tips.push({
          x: rootNode.x,
          y: rootNode.y,
          angle,
          speed: 1.2 + Math.random() * 0.8,
          parentIdx: rootIdx,
          stuck: false
        });
      }
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

    const maxNodes = 1200;
    
    if (this.nodes.length < maxNodes) {
      this.tips.forEach(tp => {
        if (tp.stuck) return;

        let targetAngle = tp.angle;
        if (this.mouse.active && this.mouse.x !== null) {
          const dx = this.mouse.x - tp.x;
          const dy = this.mouse.y - tp.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 280) {
            targetAngle = Math.atan2(dy, dx);
          }
        }

        tp.angle += (targetAngle - tp.angle) * 0.05;
        tp.angle += (Math.random() - 0.5) * 0.3;

        tp.x += Math.cos(tp.angle) * tp.speed;
        tp.y += Math.sin(tp.angle) * tp.speed;

        let collides = false;
        for (let i = 0; i < this.nodes.length; i++) {
          if (i === tp.parentIdx) continue;
          const dx = tp.x - this.nodes[i].x;
          const dy = tp.y - this.nodes[i].y;
          if (Math.hypot(dx, dy) < 14) {
            collides = true;
            break;
          }
        }

        if (tp.x < 10 || tp.x > this.width - 10 || tp.y < 10 || tp.y > this.height - 10) {
          collides = true;
        }

        if (collides) {
          tp.stuck = true;
          return;
        }

        const newNode = {
          x: tp.x,
          y: tp.y,
          parent: tp.parentIdx,
          children: [],
          glow: 0,
          age: 0
        };

        this.nodes.push(newNode);
        const newIdx = this.nodes.length - 1;
        this.nodes[tp.parentIdx].children.push(newIdx);
        tp.parentIdx = newIdx;

        if (Math.random() < 0.022 && this.tips.filter(t => !t.stuck).length < 40) {
          const branchSide = Math.random() > 0.5 ? 1 : -1;
          const branchAngle = tp.angle + (0.35 + Math.random() * 0.25) * branchSide;
          this.tips.push({
            x: tp.x,
            y: tp.y,
            angle: branchAngle,
            speed: tp.speed * (0.85 + Math.random() * 0.15),
            parentIdx: newIdx,
            stuck: false
          });
        }
      });
    }

    if (Math.random() < 0.025 && this.nodes.length > 50) {
      const activeTips = this.tips.filter(t => !t.stuck);
      if (activeTips.length > 0) {
        const randTip = activeTips[Math.floor(Math.random() * activeTips.length)];
        this.triggerElectricPulse(randTip.parentIdx);
      }
    }

    if (this.mouse.active && this.mouse.x !== null) {
      for (let i = 0; i < this.nodes.length; i += 4) {
        const node = this.nodes[i];
        const dist = Math.hypot(node.x - this.mouse.x, node.y - this.mouse.y);
        if (dist < 70 && node.glow < 0.05) {
          this.triggerElectricPulse(i);
        }
      }
    }

    for (let i = this.pulses.length - 1; i >= 0; i--) {
      const p = this.pulses[i];
      p.life += 0.1;

      if (p.life >= 1.0) {
        const currNode = this.nodes[p.nodeIdx];
        if (currNode) {
          const paths = [...currNode.children];
          if (currNode.parent !== null) {
            paths.push(currNode.parent);
          }
          paths.forEach(nextIdx => {
            if (nextIdx !== p.prevIdx) {
              this.pulses.push({
                nodeIdx: nextIdx,
                prevIdx: p.nodeIdx,
                life: 0
              });
            }
          });
        }
        this.pulses.splice(i, 1);
      }
    }

    this.nodes.forEach(node => {
      if (node.glow > 0) {
        node.glow -= 0.035;
        if (node.glow < 0) node.glow = 0;
      }

      if (node.parent !== null) {
        const parentNode = this.nodes[node.parent];
        this.ctx.beginPath();
        this.ctx.moveTo(node.x, node.y);
        this.ctx.lineTo(parentNode.x, parentNode.y);
        
        const glowVal = Math.max(node.glow, parentNode.glow);
        if (glowVal > 0) {
          this.ctx.strokeStyle = this.colors.hyphaeGlow;
          this.ctx.lineWidth = 1.8 + glowVal * 2.2;
          this.ctx.globalAlpha = Math.min(1, 0.2 + glowVal * 0.8);
        } else {
          this.ctx.strokeStyle = this.colors.hyphae;
          this.ctx.lineWidth = 1.15;
          this.ctx.globalAlpha = 0.75;
        }
        this.ctx.stroke();
      }
    });
    this.ctx.globalAlpha = 1.0;

    this.pulses.forEach(p => {
      const node = this.nodes[p.nodeIdx];
      if (!node) return;

      node.glow = 1.0;
      let drawX = node.x;
      let drawY = node.y;
      
      if (p.prevIdx !== null) {
        const prevNode = this.nodes[p.prevIdx];
        if (prevNode) {
          drawX = prevNode.x + (node.x - prevNode.x) * p.life;
          drawY = prevNode.y + (node.y - prevNode.y) * p.life;
        }
      }

      this.ctx.beginPath();
      this.ctx.arc(drawX, drawY, 8.5, 0, Math.PI * 2);
      this.ctx.fillStyle = this.colors.pulseGlow;
      this.ctx.globalAlpha = 0.25;
      this.ctx.fill();

      this.ctx.beginPath();
      this.ctx.arc(drawX, drawY, 2.5, 0, Math.PI * 2);
      this.ctx.fillStyle = this.colors.pulseCore;
      this.ctx.globalAlpha = 0.95;
      this.ctx.fill();
    });
    this.ctx.globalAlpha = 1.0;

    if (this.nodes.length >= maxNodes && this.pulses.length === 0) {
      if (Math.random() < 0.003) {
        this.setup();
      }
    }

    requestAnimationFrame((t) => this.animate(t));
  }

  triggerElectricPulse(nodeIdx) {
    if (this.pulses.length > 150) return;
    this.pulses.push({
      nodeIdx: nodeIdx,
      prevIdx: null,
      life: 0
    });
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
