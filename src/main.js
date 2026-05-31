import './style.css';
import AnimationManager from './animations/AnimationManager.js';
import NeonParticleWeb from './animations/NeonParticleWeb.js';
import FluidGradientNoise from './animations/FluidGradientNoise.js';
import CosmicRibbonFlow from './animations/CosmicRibbonFlow.js';

// 1. Registry of available animations
const animations = [
  NeonParticleWeb,
  FluidGradientNoise,
  CosmicRibbonFlow
];

let activeIndex = -1;
let copyTimeout = null;

// 2. Main DOM Elements
const canvas = document.getElementById('bg-canvas');
const listContainer = document.getElementById('animation-list');
const titleElem = document.getElementById('animation-title');
const descElem = document.getElementById('animation-description');
const vibeElem = document.getElementById('spec-vibe');
const copyBtn = document.getElementById('copy-btn');
const toast = document.getElementById('toast-notif');

// Telemetry DOM Bindings
const telemetry = {
  fps: document.getElementById('fps-counter'),
  dim: document.getElementById('canvas-dim')
};

// 3. Initialize the Global Animation Manager
const manager = new AnimationManager(canvas, telemetry);

// 4. Render Sidebar Navigation Items dynamically
animations.forEach((AnimClass, index) => {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'nav-item w-full flex items-center justify-between py-3.5 px-4 rounded-xl text-left text-sm text-slate-400 hover:text-white cursor-pointer focus:outline-none';
  btn.setAttribute('id', `nav-item-${index}`);
  
  // Clean, premium numbering and micro-dot indicators
  btn.innerHTML = `
    <div class="flex items-center gap-3">
      <span class="w-1.5 h-1.5 rounded-full bg-slate-600 dot-indicator transition-all duration-300"></span>
      <span class="font-medium tracking-wide">${AnimClass.title}</span>
    </div>
    <span class="text-[10px] text-slate-600 font-mono">0${index + 1}</span>
  `;

  btn.addEventListener('click', () => {
    selectAnimation(index);
  });

  listContainer.appendChild(btn);
});

// 5. Animation selection handler
function selectAnimation(index) {
  if (index === activeIndex) return;
  
  // Clean up old active button classes
  if (activeIndex !== -1) {
    const prevBtn = document.getElementById(`nav-item-${activeIndex}`);
    if (prevBtn) {
      prevBtn.classList.remove('active');
      const dot = prevBtn.querySelector('.dot-indicator');
      if (dot) dot.className = 'w-1.5 h-1.5 rounded-full bg-slate-600 dot-indicator transition-all duration-300';
    }
  }

  activeIndex = index;
  const AnimClass = animations[index];

  // Set active classes on selected item
  const currentBtn = document.getElementById(`nav-item-${index}`);
  if (currentBtn) {
    currentBtn.classList.add('active');
    
    // Animate the status dot to reflect active state
    const dot = currentBtn.querySelector('.dot-indicator');
    if (dot) {
      dot.className = 'w-1.5 h-1.5 rounded-full bg-indigo-400 dot-indicator shadow-sm shadow-indigo-500/50 transition-all duration-300 scale-125';
    }
  }

  // Fade out text, load state, and fade in smoothly (micro-animation!)
  const overlay = document.getElementById('info-overlay');
  overlay.style.opacity = '0.3';
  overlay.style.transform = 'translateY(10px)';

  setTimeout(() => {
    // Load animation in manager
    manager.setAnimation(AnimClass);

    // Update Floating Overlay Metadata
    titleElem.textContent = AnimClass.title;
    descElem.textContent = AnimClass.description;
    vibeElem.textContent = AnimClass.vibe;

    // Reset Copy button visual state
    resetCopyButton();

    overlay.style.opacity = '1.0';
    overlay.style.transform = 'translateY(0)';
  }, 250);
}

// 6. Clipboard copy pipeline
copyBtn.addEventListener('click', async () => {
  if (activeIndex === -1) return;
  
  const AnimClass = animations[activeIndex];
  const sourceCode = AnimClass.sourceCode;

  try {
    // Write code string to clipboard
    await navigator.clipboard.writeText(sourceCode);
    
    // Trigger successful copy state
    triggerCopySuccess();
  } catch (err) {
    console.error('Failed to copy to clipboard: ', err);
    
    // Fallback: simple copy attempt using older execCommand if clipboard fails
    const textarea = document.createElement('textarea');
    textarea.value = sourceCode;
    textarea.style.position = 'fixed';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      triggerCopySuccess();
    } catch (e) {
      alert('Could not copy automatically. Please inspect console.');
    }
    document.body.removeChild(textarea);
  }
});

function triggerCopySuccess() {
  // Clear any existing timeouts to prevent overlapping states
  if (copyTimeout) clearTimeout(copyTimeout);

  // 1. Button feedback (change icon & text)
  copyBtn.classList.remove('hover:text-indigo-300');
  copyBtn.classList.add('bg-emerald-500/10', 'border-emerald-500/30', 'text-emerald-400');
  
  copyBtn.innerHTML = `
    <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path>
    </svg>
    <span>Source Code Copied!</span>
  `;

  // 2. Spawn slide-up toast notification
  toast.classList.remove('hidden');
  toast.classList.add('flex', 'animate-toast');

  // 3. Revert button and toast after delay
  copyTimeout = setTimeout(() => {
    resetCopyButton();
    
    // Smoothly fade out toast
    toast.style.opacity = '0';
    toast.style.transform = 'translate(-50%, -10px)';
    
    setTimeout(() => {
      toast.classList.add('hidden');
      toast.classList.remove('flex', 'animate-toast');
      toast.style.opacity = '';
      toast.style.transform = '';
    }, 300);
  }, 3000);
}

function resetCopyButton() {
  copyBtn.className = 'glass-button flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl text-sm font-semibold text-white hover:text-indigo-300 active:scale-98 cursor-pointer focus:outline-none';
  copyBtn.innerHTML = `
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path>
    </svg>
    <span>Copy Source Code</span>
  `;
}

// 7. Load default first animation
selectAnimation(0);
