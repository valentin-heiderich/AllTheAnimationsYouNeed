import './style.css';
import AnimationManager from './animations/AnimationManager.js';
import LofiMusicEngine from './audio/LofiMusicEngine.js';
import animationRegistry from './animationRegistry.js';

// 1. Code-Split Registry: All 63 animations loaded on-demand via dynamic import()
// Only lightweight metadata is bundled. Each animation's canvas code loads when selected.

let activeIndex = -1;
let loadedAnimClass = null; // Cache of the currently loaded animation class
let copyTimeout = null;

// 2. Main DOM Elements
const canvas = document.getElementById('bg-canvas');
const listContainer = document.getElementById('animation-list');
const titleElem = document.getElementById('animation-title');
const descElem = document.getElementById('animation-description');
const vibeElem = document.getElementById('spec-vibe');
const copyBtn = document.getElementById('copy-btn');
const toast = document.getElementById('toast-notif');
const muteBtn = document.getElementById('mute-btn');
const muteIcon = document.getElementById('mute-icon');

// Initialize Mute State from localStorage
let isMuted = localStorage.getItem('aetherflow_audio_muted') === 'true';
canvas.setAttribute('data-audio-muted', isMuted ? 'true' : 'false');
updateMuteIcon();

// Sound toggle listener
muteBtn.addEventListener('click', () => {
  isMuted = !isMuted;
  localStorage.setItem('aetherflow_audio_muted', isMuted ? 'true' : 'false');
  canvas.setAttribute('data-audio-muted', isMuted ? 'true' : 'false');
  updateMuteIcon();
});

function updateMuteIcon() {
  if (isMuted) {
    muteIcon.innerHTML = `
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"></path>
    `;
    muteBtn.classList.remove('text-indigo-400', 'border-indigo-500/10');
    muteBtn.classList.add('text-slate-500', 'border-slate-500/5');
  } else {
    muteIcon.innerHTML = `
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path>
    `;
    muteBtn.classList.remove('text-slate-500', 'border-slate-500/5');
    muteBtn.classList.add('text-indigo-400', 'border-indigo-500/10');
  }
}

// Telemetry DOM Bindings
const telemetry = {
  fps: document.getElementById('fps-counter'),
  dim: document.getElementById('canvas-dim')
};

// 3. Initialize the Global Animation Manager
const manager = new AnimationManager(canvas, telemetry);

// --- Ambient Lofi Configurator Suite Instrumentation ---
const lofiPlayBtn = document.getElementById('lofi-play-btn');
const lofiPlayIcon = document.getElementById('lofi-play-icon');
const lofiVolSlider = document.getElementById('lofi-vol-slider');
const lofiVolLabel = document.getElementById('lofi-vol-label');
const vinylVolSlider = document.getElementById('vinyl-vol-slider');
const vinylVolLabel = document.getElementById('vinyl-vol-label');
const lofiBpmSlider = document.getElementById('lofi-bpm-slider');
const lofiBpmLabel = document.getElementById('lofi-bpm-label');
const lofiTrackSelect = document.getElementById('lofi-track-select');
const lofiVisualizer = document.getElementById('lofi-visualizer');

// Initialize settings from localStorage
let lofiVolume = localStorage.getItem('aetherflow_lofi_vol') !== null 
  ? parseFloat(localStorage.getItem('aetherflow_lofi_vol')) 
  : 0.5;

let vinylVolume = localStorage.getItem('aetherflow_vinyl_vol') !== null 
  ? parseFloat(localStorage.getItem('aetherflow_vinyl_vol')) 
  : 0.5;

let lofiTrack = localStorage.getItem('aetherflow_lofi_track') !== null
  ? localStorage.getItem('aetherflow_lofi_track')
  : 'lofi-jazz';

let lofiBpm = localStorage.getItem('aetherflow_lofi_bpm') !== null
  ? parseInt(localStorage.getItem('aetherflow_lofi_bpm'))
  : 78;

lofiVolSlider.value = lofiVolume;
lofiVolLabel.textContent = `${Math.round(lofiVolume * 100)}%`;

vinylVolSlider.value = vinylVolume;
vinylVolLabel.textContent = `${Math.round(vinylVolume * 100)}%`;

lofiTrackSelect.value = lofiTrack;
LofiMusicEngine.setTrack(lofiTrack);

// If the user hasn't explicitly set a custom BPM, match it to track defaults
if (localStorage.getItem('aetherflow_lofi_bpm') === null) {
  lofiBpm = LofiMusicEngine.tracks[lofiTrack].bpm;
}
lofiBpmSlider.value = lofiBpm;
lofiBpmLabel.textContent = `${lofiBpm} BPM`;
LofiMusicEngine.setBPM(lofiBpm);

let isLofiPlaying = false;

lofiPlayBtn.addEventListener('click', () => {
  if (isLofiPlaying) {
    LofiMusicEngine.pause();
    isLofiPlaying = false;
    lofiVisualizer.classList.remove('playing');
    lofiPlayIcon.innerHTML = `<path d="M8 5v14l11-7z"></path>`;
    lofiPlayBtn.classList.remove('bg-indigo-500', 'text-white');
    lofiPlayBtn.classList.add('bg-indigo-500/10', 'text-indigo-400');
    lofiPlayBtn.title = 'Play Cozy Background Beats';
  } else {
    // Start engine (will lazily initialize context)
    LofiMusicEngine.play();
    
    // Set initial configuration parameters
    LofiMusicEngine.setTrack(lofiTrack);
    LofiMusicEngine.setBPM(lofiBpm);
    LofiMusicEngine.setVolume(lofiVolume);
    LofiMusicEngine.setVinylVolume(vinylVolume);
    
    isLofiPlaying = true;
    lofiVisualizer.classList.add('playing');
    // Change SVG to Pause icon
    lofiPlayIcon.innerHTML = `<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path>`;
    lofiPlayBtn.classList.remove('bg-indigo-500/10', 'text-indigo-400');
    lofiPlayBtn.classList.add('bg-indigo-500', 'text-white');
    lofiPlayBtn.title = 'Pause Cozy Background Beats';
  }
});

lofiVolSlider.addEventListener('input', (e) => {
  lofiVolume = parseFloat(e.target.value);
  lofiVolLabel.textContent = `${Math.round(lofiVolume * 100)}%`;
  localStorage.setItem('aetherflow_lofi_vol', lofiVolume);
  if (isLofiPlaying) {
    LofiMusicEngine.setVolume(lofiVolume);
  }
});

vinylVolSlider.addEventListener('input', (e) => {
  vinylVolume = parseFloat(e.target.value);
  vinylVolLabel.textContent = `${Math.round(vinylVolume * 100)}%`;
  localStorage.setItem('aetherflow_vinyl_vol', vinylVolume);
  if (isLofiPlaying) {
    LofiMusicEngine.setVinylVolume(vinylVolume);
  }
});

lofiBpmSlider.addEventListener('input', (e) => {
  lofiBpm = parseInt(e.target.value);
  lofiBpmLabel.textContent = `${lofiBpm} BPM`;
  localStorage.setItem('aetherflow_lofi_bpm', lofiBpm);
  LofiMusicEngine.setBPM(lofiBpm);
});

lofiTrackSelect.addEventListener('change', (e) => {
  lofiTrack = e.target.value;
  localStorage.setItem('aetherflow_lofi_track', lofiTrack);
  LofiMusicEngine.setTrack(lofiTrack);
  
  // Update tempo parameters automatically based on track recommendation
  lofiBpm = LofiMusicEngine.tracks[lofiTrack].bpm;
  lofiBpmSlider.value = lofiBpm;
  lofiBpmLabel.textContent = `${lofiBpm} BPM`;
  localStorage.setItem('aetherflow_lofi_bpm', lofiBpm);
  LofiMusicEngine.setBPM(lofiBpm);
});

// --- Collapsible Split-Screen Panel Instrumentations ---
const leftSidebar = document.getElementById('left-sidebar');
const sidebarToggle = document.getElementById('sidebar-toggle');
const sidebarToggleIcon = document.getElementById('sidebar-toggle-icon');

let isSidebarCollapsed = false;

sidebarToggle.addEventListener('click', () => {
  isSidebarCollapsed = !isSidebarCollapsed;
  if (isSidebarCollapsed) {
    leftSidebar.classList.add('collapsed');
    sidebarToggle.style.left = '0px';
    sidebarToggleIcon.style.transform = 'rotate(180deg)';
    sidebarToggle.setAttribute('aria-expanded', 'false');
  } else {
    leftSidebar.classList.remove('collapsed');
    sidebarToggle.style.left = '';
    sidebarToggleIcon.style.transform = '';
    sidebarToggle.setAttribute('aria-expanded', 'true');
  }
});

const audioSidebar = document.getElementById('audio-sidebar');
const audioToggle = document.getElementById('audio-toggle');
const audioToggleIcon = document.getElementById('audio-toggle-icon');

let isAudioCollapsed = false;

audioToggle.addEventListener('click', () => {
  isAudioCollapsed = !isAudioCollapsed;
  if (isAudioCollapsed) {
    audioSidebar.classList.add('collapsed');
    audioToggle.style.right = '0px';
    audioToggleIcon.style.transform = 'rotate(180deg)';
    audioToggle.setAttribute('aria-expanded', 'false');
  } else {
    audioSidebar.classList.remove('collapsed');
    audioToggle.style.right = '';
    audioToggleIcon.style.transform = '';
    audioToggle.setAttribute('aria-expanded', 'true');
  }
});

// --- Collapsible Bottom Overlay Panel ---
const overlayToggleBtn = document.getElementById('overlay-toggle-btn');
const overlayToggleIcon = document.getElementById('overlay-toggle-icon');
const overlayToggleText = document.getElementById('overlay-toggle-text');
const overlayContent = document.getElementById('overlay-content');

let isOverlayMinimized = false;

overlayToggleBtn.addEventListener('click', () => {
  isOverlayMinimized = !isOverlayMinimized;
  if (isOverlayMinimized) {
    overlayContent.classList.add('hidden');
    overlayToggleText.textContent = 'Expand';
    overlayToggleIcon.style.transform = 'rotate(180deg)';
    overlayToggleBtn.setAttribute('aria-expanded', 'false');
  } else {
    overlayContent.classList.remove('hidden');
    overlayToggleText.textContent = 'Minimize';
    overlayToggleIcon.style.transform = '';
    overlayToggleBtn.setAttribute('aria-expanded', 'true');
  }
});

// 4. Render Sidebar Navigation Items from lightweight registry metadata (no heavy imports!)
animationRegistry.forEach((anim, index) => {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'nav-item w-full flex items-center justify-between py-3.5 px-4 rounded-xl text-left text-sm text-slate-400 hover:text-white cursor-pointer focus:outline-none';
  btn.setAttribute('id', `nav-item-${index}`);
  btn.setAttribute('role', 'option');
  btn.setAttribute('aria-selected', 'false');
  btn.setAttribute('aria-label', `Select ${anim.title} animation`);
  
  // Clean, premium numbering and micro-dot indicators
  btn.innerHTML = `
    <div class="flex items-center gap-3">
      <span class="w-1.5 h-1.5 rounded-full bg-slate-600 dot-indicator transition-all duration-300" aria-hidden="true"></span>
      <span class="font-medium tracking-wide">${anim.title}</span>
    </div>
    <span class="text-[10px] text-slate-600 font-mono" aria-hidden="true">${(index + 1).toString().padStart(2, '0')}</span>
  `;

  btn.addEventListener('click', () => {
    selectAnimation(index);
  });

  listContainer.appendChild(btn);
});

// 5. Animation selection handler — now async with dynamic import()
async function selectAnimation(index) {
  if (index === activeIndex) return;
  
  // Clean up old active button classes
  if (activeIndex !== -1) {
    const prevBtn = document.getElementById(`nav-item-${activeIndex}`);
    if (prevBtn) {
      prevBtn.classList.remove('active');
      prevBtn.setAttribute('aria-selected', 'false');
      const dot = prevBtn.querySelector('.dot-indicator');
      if (dot) dot.className = 'w-1.5 h-1.5 rounded-full bg-slate-600 dot-indicator transition-all duration-300';
    }
  }

  activeIndex = index;
  const animMeta = animationRegistry[index];

  // Set active classes on selected item
  const currentBtn = document.getElementById(`nav-item-${index}`);
  if (currentBtn) {
    currentBtn.classList.add('active');
    currentBtn.setAttribute('aria-selected', 'true');
    
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

  // Update overlay metadata immediately from registry (instant, no network wait)
  titleElem.textContent = animMeta.title;
  descElem.textContent = animMeta.description;
  vibeElem.textContent = animMeta.vibe;

  // Dynamically import the animation module (code splitting!)
  try {
    const AnimClass = await animMeta.load();
    loadedAnimClass = AnimClass;

    // Load animation in manager
    manager.setAnimation(AnimClass);
  } catch (err) {
    console.error(`Failed to load animation: ${animMeta.id}`, err);
    titleElem.textContent = 'Error Loading Animation';
    descElem.textContent = 'This animation could not be loaded. Please try another one.';
  }

  // Reset Copy button visual state
  resetCopyButton();

  overlay.style.opacity = '1.0';
  overlay.style.transform = 'translateY(0)';
}

// 6. Clipboard copy pipeline
copyBtn.addEventListener('click', async () => {
  if (activeIndex === -1) return;
  
  const animMeta = animationRegistry[activeIndex];
  const origin = window.location.origin;
  const className = animMeta.id;
  const title = animMeta.title;

  const embedCode = `<!-- AetherFlow Canvas Background & Ambient soundscape: ${title} -->
<canvas id="aetherflow-canvas" style="position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: -1;"></canvas>

<script type="module">
  import AnimationManager from '${origin}/cdn/AnimationManager.js';
  import ${className} from '${origin}/cdn/${className}.js';
  import LofiMusicEngine from '${origin}/cdn/LofiMusicEngine.js';

  const canvas = document.getElementById('aetherflow-canvas');
  
  // Binds hardware-accelerated 60fps tracking, high-DPI scaling, and resize observers
  const manager = new AnimationManager(canvas);
  manager.setAnimation(${className});

  // Optional: Start ambient background audio workstation!
  // Customizable parameters:
  // LofiMusicEngine.setTrack('lofi-jazz'); // options: 'lofi-jazz', 'midnight-ambient', 'synthwave-retro'
  // LofiMusicEngine.setBPM(78); // set custom tempo BPM (40-180)
  // LofiMusicEngine.setVolume(0.4); // set master volume
  // LofiMusicEngine.setVinylVolume(0.25); // set vintage vinyl hum/crackle level
  
  window.addEventListener('click', () => {
    // Play lazily on first user gesture to satisfy browser autoplay restrictions
    LofiMusicEngine.play();
    LofiMusicEngine.setTrack('${lofiTrack}');
    LofiMusicEngine.setBPM(${lofiBpm});
    LofiMusicEngine.setVolume(${lofiVolume});
    LofiMusicEngine.setVinylVolume(${vinylVolume});
  }, { once: true });
<\/script>`;

  try {
    // Write code string to clipboard
    await navigator.clipboard.writeText(embedCode);
    
    // Trigger successful copy state
    triggerCopySuccess();
  } catch (err) {
    console.error('Failed to copy to clipboard: ', err);
    
    // Fallback: simple copy attempt using older execCommand if clipboard fails
    const textarea = document.createElement('textarea');
    textarea.value = embedCode;
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
    <svg class="w-4.5 h-4.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path>
    </svg>
    <span>Embed Snippet Copied!</span>
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
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path>
    </svg>
    <span>Copy CDN Embed Snippet</span>
  `;
}

// 7. Load default first animation
selectAnimation(0);
