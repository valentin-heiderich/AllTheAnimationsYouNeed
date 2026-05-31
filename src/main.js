import './style.css';
import AnimationManager from './animations/AnimationManager.js';
import LofiMusicEngine from './audio/LofiMusicEngine.js';

// Import All 48 Animations alphabetically
import AbstractStringSymphony from './animations/AbstractStringSymphony.js';
import ASCIICyberStreams from './animations/ASCIICyberStreams.js';
import AuroraBorealisWave from './animations/AuroraBorealisWave.js';
import BendingVineIvy from './animations/BendingVineIvy.js';
import BioluminescentRain from './animations/BioluminescentRain.js';
import BioluminescentSwarm from './animations/BioluminescentSwarm.js';
import BoidsFlockingSwarm from './animations/BoidsFlockingSwarm.js';
import CelestialOrbitGravity from './animations/CelestialOrbitGravity.js';
import CosmicRibbonFlow from './animations/CosmicRibbonFlow.js';
import DandelionWindSeeds from './animations/DandelionWindSeeds.js';
import DelaunayTriangulation from './animations/DelaunayTriangulation.js';
import DigitalRainMatrix from './animations/DigitalRainMatrix.js';
import DNASpiralHelix from './animations/DNASpiralHelix.js';
import FloatingAutumnLeaves from './animations/FloatingAutumnLeaves.js';
import FlockingButterflies from './animations/FlockingButterflies.js';
import FluidGradientNoise from './animations/FluidGradientNoise.js';
import FractalTreeGrowth from './animations/FractalTreeGrowth.js';
import GeometricMatrixGrid from './animations/GeometricMatrixGrid.js';
import GeometricSphericalWave from './animations/GeometricSphericalWave.js';
import GrowingBotanicalFungus from './animations/GrowingBotanicalFungus.js';
import HexagonalHiveGrid from './animations/HexagonalHiveGrid.js';
import JellyfishDrift from './animations/JellyfishDrift.js';
import KaleidoscopeFractal from './animations/KaleidoscopeFractal.js';
import KineticSandRipple from './animations/KineticSandRipple.js';
import LSystemTreeForest from './animations/LSystemTreeForest.js';
import LavaLampBlobs from './animations/LavaLampBlobs.js';
import LissajousWebDancer from './animations/LissajousWebDancer.js';
import MagneticFieldLines from './animations/MagneticFieldLines.js';
import MandalaTrigonometry from './animations/MandalaTrigonometry.js';
import MathematicalAttractors from './animations/MathematicalAttractors.js';
import MysticForestMist from './animations/MysticForestMist.js';
import NebulaGasSwirl from './animations/NebulaGasSwirl.js';
import NeonParticleWeb from './animations/NeonParticleWeb.js';
import NeuralNetworkSynapses from './animations/NeuralNetworkSynapses.js';
import OceanWaveRipple from './animations/OceanWaveRipple.js';
import PerlinFlowField from './animations/PerlinFlowField.js';
import PlasmaFractalGlow from './animations/PlasmaFractalGlow.js';
import QuantumEntanglement from './animations/QuantumEntanglement.js';
import QuantumFoamDrift from './animations/QuantumFoamDrift.js';
import RainbowSpiralTunnel from './animations/RainbowSpiralTunnel.js';
import RiverStonesFlow from './animations/RiverStonesFlow.js';
import SoftSnowStorm from './animations/SoftSnowStorm.js';
import StarfieldHyperdrive from './animations/StarfieldHyperdrive.js';
import SupernovaExpansion from './animations/SupernovaExpansion.js';
import SwarmingFireflies from './animations/SwarmingFireflies.js';
import VortexFlowField from './animations/VortexFlowField.js';
import WaveInterference from './animations/WaveInterference.js';
import WindyGrassField from './animations/WindyGrassField.js';

// 1. Registry of available 48 animations
const animations = [
  AbstractStringSymphony,
  ASCIICyberStreams,
  AuroraBorealisWave,
  BendingVineIvy,
  BioluminescentRain,
  BioluminescentSwarm,
  BoidsFlockingSwarm,
  CelestialOrbitGravity,
  CosmicRibbonFlow,
  DandelionWindSeeds,
  DelaunayTriangulation,
  DigitalRainMatrix,
  DNASpiralHelix,
  FloatingAutumnLeaves,
  FlockingButterflies,
  FluidGradientNoise,
  FractalTreeGrowth,
  GeometricMatrixGrid,
  GeometricSphericalWave,
  GrowingBotanicalFungus,
  HexagonalHiveGrid,
  JellyfishDrift,
  KaleidoscopeFractal,
  KineticSandRipple,
  LSystemTreeForest,
  LavaLampBlobs,
  LissajousWebDancer,
  MagneticFieldLines,
  MandalaTrigonometry,
  MathematicalAttractors,
  MysticForestMist,
  NebulaGasSwirl,
  NeonParticleWeb,
  NeuralNetworkSynapses,
  OceanWaveRipple,
  PerlinFlowField,
  PlasmaFractalGlow,
  QuantumEntanglement,
  QuantumFoamDrift,
  RainbowSpiralTunnel,
  RiverStonesFlow,
  SoftSnowStorm,
  StarfieldHyperdrive,
  SupernovaExpansion,
  SwarmingFireflies,
  VortexFlowField,
  WaveInterference,
  WindyGrassField
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

// --- Ambient Lofi Player Instrumentation ---
const lofiPlayBtn = document.getElementById('lofi-play-btn');
const lofiPlayIcon = document.getElementById('lofi-play-icon');
const lofiVolSlider = document.getElementById('lofi-vol-slider');
const lofiVolLabel = document.getElementById('lofi-vol-label');
const vinylVolSlider = document.getElementById('vinyl-vol-slider');
const vinylVolLabel = document.getElementById('vinyl-vol-label');
const lofiVisualizer = document.getElementById('lofi-visualizer');

// Initialize settings from localStorage
let lofiVolume = localStorage.getItem('aetherflow_lofi_vol') !== null 
  ? parseFloat(localStorage.getItem('aetherflow_lofi_vol')) 
  : 0.5;

let vinylVolume = localStorage.getItem('aetherflow_vinyl_vol') !== null 
  ? parseFloat(localStorage.getItem('aetherflow_vinyl_vol')) 
  : 0.5;

lofiVolSlider.value = lofiVolume;
lofiVolLabel.textContent = `${Math.round(lofiVolume * 100)}%`;

vinylVolSlider.value = vinylVolume;
vinylVolLabel.textContent = `${Math.round(vinylVolume * 100)}%`;

let isLofiPlaying = false;

lofiPlayBtn.addEventListener('click', () => {
  if (isLofiPlaying) {
    LofiMusicEngine.pause();
    isLofiPlaying = false;
    lofiVisualizer.classList.remove('playing');
    lofiPlayIcon.innerHTML = `<path d="M8 5v14l11-7z"></path>`;
    lofiPlayBtn.classList.remove('bg-indigo-500', 'text-white');
    lofiPlayBtn.classList.add('bg-indigo-500/10', 'text-indigo-400');
    lofiPlayBtn.title = 'Play Cozy Lofi Beats';
  } else {
    // Start engine (will lazily initialize context)
    LofiMusicEngine.play();
    
    // Set initial volumes
    LofiMusicEngine.setVolume(lofiVolume);
    LofiMusicEngine.setVinylVolume(vinylVolume);
    
    isLofiPlaying = true;
    lofiVisualizer.classList.add('playing');
    // Change SVG to Pause icon
    lofiPlayIcon.innerHTML = `<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path>`;
    lofiPlayBtn.classList.remove('bg-indigo-500/10', 'text-indigo-400');
    lofiPlayBtn.classList.add('bg-indigo-500', 'text-white');
    lofiPlayBtn.title = 'Pause Cozy Lofi Beats';
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
    <span class="text-[10px] text-slate-600 font-mono">${(index + 1).toString().padStart(2, '0')}</span>
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
  const origin = window.location.origin;
  const className = AnimClass.name;
  const title = AnimClass.title;

  const embedCode = `<!-- AetherFlow Canvas Background: ${title} -->
<canvas id="aetherflow-canvas" style="position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: -1;"></canvas>

<script type="module">
  import AnimationManager from '${origin}/cdn/AnimationManager.js';
  import ${className} from '${origin}/cdn/${className}.js';

  const canvas = document.getElementById('aetherflow-canvas');
  
  // Binds hardware-accelerated 60fps tracking, high-DPI scaling, and resize observers
  const manager = new AnimationManager(canvas);
  manager.setAnimation(${className});
</script>`;

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
    <svg class="w-4.5 h-4.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path>
    </svg>
    <span>Copy CDN Embed Snippet</span>
  `;
}

// 7. Load default first animation
selectAnimation(0);
