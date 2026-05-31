const animationRegistry = [
  {
    id: 'AbstractStringSymphony',
    title: 'Abstract String Symphony',
    description: 'Elegant musical threads resonating in 3D space.',
    vibe: 'Musical',
    load: () => import('./animations/AbstractStringSymphony.js').then(m => m.default)
  },
  {
    id: 'AcousticMyceliumNetwork',
    title: 'Acoustic Mycelium Network',
    description: 'Underground fungal neural pathways pulse with bioluminescent signals.',
    vibe: 'Biological',
    load: () => import('./animations/AcousticMyceliumNetwork.js').then(m => m.default)
  },
  {
    id: 'ASCIICyberStreams',
    title: 'ASCII Cyber Streams',
    description: 'Columns of glowing cyan ASCII cyber characters.',
    vibe: 'Retro',
    load: () => import('./animations/ASCIICyberStreams.js').then(m => m.default)
  },
  {
    id: 'AuroraBorealisWave',
    title: 'Aurora Borealis Wave',
    description: 'Slowly waving vertical sheets of auroral curtains.',
    vibe: 'Atmospheric',
    load: () => import('./animations/AuroraBorealisWave.js').then(m => m.default)
  },
  {
    id: 'BendingVineIvy',
    title: 'Bending Vine Ivy',
    description: 'Growing ivy vines climbing organically up the screen.',
    vibe: 'Organic',
    load: () => import('./animations/BendingVineIvy.js').then(m => m.default)
  },
  {
    id: 'BioluminescentRain',
    title: 'Bioluminescent Rain',
    description: 'Glowing raindrops falling through a dark aquatic void.',
    vibe: 'Atmospheric',
    load: () => import('./animations/BioluminescentRain.js').then(m => m.default)
  },
  {
    id: 'BioluminescentRainPianos',
    title: 'Bioluminescent Rain Pianos',
    description: 'Neon bioluminescent raindrops that synthesize warm piano keys.',
    vibe: 'Atmospheric',
    load: () => import('./animations/BioluminescentRainPianos.js').then(m => m.default)
  },
  {
    id: 'BioluminescentSwarm',
    title: 'Bioluminescent Swarm',
    description: 'Firefly-like glowing dots clustering in intelligent flocks.',
    vibe: 'Natural',
    load: () => import('./animations/BioluminescentSwarm.js').then(m => m.default)
  },
  {
    id: 'BloomingLSystemForest',
    title: 'Blooming L-System Forest',
    description: 'Procedurally generated L-System fractal trees growing and blooming.',
    vibe: 'Organic',
    load: () => import('./animations/BloomingLSystemForest.js').then(m => m.default)
  },
  {
    id: 'BoidsFlockingSwarm',
    title: 'Boids Flocking Swarm',
    description: 'Flocking simulation of autonomous boids implementing Craig Reynolds algorithm.',
    vibe: 'Simulated',
    load: () => import('./animations/BoidsFlockingSwarm.js').then(m => m.default)
  },
  {
    id: 'CelestialOrbitGravity',
    title: 'Celestial Orbit Gravity',
    description: 'Celestial orbital dust forming accretion disks around massive core stars.',
    vibe: 'Cosmic',
    load: () => import('./animations/CelestialOrbitGravity.js').then(m => m.default)
  },
  {
    id: 'ChimingVinesIvy',
    title: 'Chiming Vines Ivy',
    description: 'Organic climbing vines that trigger crystalline chime tones.',
    vibe: 'Natural',
    load: () => import('./animations/ChimingVinesIvy.js').then(m => m.default)
  },
  {
    id: 'CosmicRibbonFlow',
    title: 'Cosmic Ribbon Flow',
    description: 'Flowing ribbons of light painting trails across the cosmos.',
    vibe: 'Cosmic',
    load: () => import('./animations/CosmicRibbonFlow.js').then(m => m.default)
  },
  {
    id: 'DandelionWindSeeds',
    title: 'Dandelion Wind Seeds',
    description: 'A meadow dandelion with seeds that scatter in wind currents.',
    vibe: 'Natural',
    load: () => import('./animations/DandelionWindSeeds.js').then(m => m.default)
  },
  {
    id: 'DelaunayTriangulation',
    title: 'Delaunay Triangulation',
    description: 'Drifting nodes computing Delaunay triangle bridges with gradient color fills.',
    vibe: 'Structural',
    load: () => import('./animations/DelaunayTriangulation.js').then(m => m.default)
  },
  {
    id: 'DigitalRainMatrix',
    title: 'Digital Rain Matrix',
    description: 'Matrix-style columns of glowing digital code raining down.',
    vibe: 'Cybernetic',
    load: () => import('./animations/DigitalRainMatrix.js').then(m => m.default)
  },
  {
    id: 'DNASpiralHelix',
    title: 'DNA Spiral Helix',
    description: 'Twin double-helix strands tracing 3D spiral equations projected onto the canvas.',
    vibe: 'Biological',
    load: () => import('./animations/DNASpiralHelix.js').then(m => m.default)
  },
  {
    id: 'FloatingAutumnLeaves',
    title: 'Floating Autumn Leaves',
    description: 'Gently swirling colorful leaves drifting through space.',
    vibe: 'Atmospheric',
    load: () => import('./animations/FloatingAutumnLeaves.js').then(m => m.default)
  },
  {
    id: 'FloatingAutumnWoodwinds',
    title: 'Floating Autumn Woodwinds',
    description: 'Slowly drifting maple leaves synthesizing cozy woodwind tones.',
    vibe: 'Atmospheric',
    load: () => import('./animations/FloatingAutumnWoodwinds.js').then(m => m.default)
  },
  {
    id: 'FlockingButterflies',
    title: 'Flocking Butterflies',
    description: 'Pastel neon butterflies performing interactive swarm dynamics.',
    vibe: 'Natural',
    load: () => import('./animations/FlockingButterflies.js').then(m => m.default)
  },
  {
    id: 'FlockingButterflyStrings',
    title: 'Flocking Butterfly Strings',
    description: 'Neon butterflies performing swarming dynamics that trigger string instrument tones.',
    vibe: 'Natural',
    load: () => import('./animations/FlockingButterflyStrings.js').then(m => m.default)
  },
  {
    id: 'FluidGradientNoise',
    title: 'Fluid Gradient Noise',
    description: 'Smooth, flowing gradients that shift through noise-driven color spaces.',
    vibe: 'Mesmerizing',
    load: () => import('./animations/FluidGradientNoise.js').then(m => m.default)
  },
  {
    id: 'FractalTreeGrowth',
    title: 'Fractal Tree Growth',
    description: 'Elegant fractal branching system with organic wind-blown sway.',
    vibe: 'Organic',
    load: () => import('./animations/FractalTreeGrowth.js').then(m => m.default)
  },
  {
    id: 'GeometricMatrixGrid',
    title: 'Geometric Matrix Grid',
    description: 'Neon digital grid system with flashing node hubs.',
    vibe: 'Cybernetic',
    load: () => import('./animations/GeometricMatrixGrid.js').then(m => m.default)
  },
  {
    id: 'GeometricSphericalWave',
    title: 'Geometric Spherical Wave',
    description: 'Three-dimensional spherical wireframe pulsing with energy.',
    vibe: 'Geometric',
    load: () => import('./animations/GeometricSphericalWave.js').then(m => m.default)
  },
  {
    id: 'GrowingBotanicalFungus',
    title: 'Growing Botanical Fungus',
    description: 'Bioluminescent fungi growing procedurally from dark soil.',
    vibe: 'Biological',
    load: () => import('./animations/GrowingBotanicalFungus.js').then(m => m.default)
  },
  {
    id: 'HexagonalHiveGrid',
    title: 'Hexagonal Hive Grid',
    description: 'An interactive honeycomb grid of hexagonal cells.',
    vibe: 'Geometric',
    load: () => import('./animations/HexagonalHiveGrid.js').then(m => m.default)
  },
  {
    id: 'JellyfishDrift',
    title: 'Jellyfish Drift',
    description: 'Translucent jellyfish drifting through deep ocean currents.',
    vibe: 'Biological',
    load: () => import('./animations/JellyfishDrift.js').then(m => m.default)
  },
  {
    id: 'KaleidoscopeFractal',
    title: 'Kaleidoscope Fractal',
    description: 'Mathematically reflected kaleidoscope with repeating triangular mirrors.',
    vibe: 'Geometric',
    load: () => import('./animations/KaleidoscopeFractal.js').then(m => m.default)
  },
  {
    id: 'KineticSandMarimbas',
    title: 'Kinetic Sand Marimbas',
    description: 'Warm kinetic sand ripples that synthesize soft marimba tones.',
    vibe: 'Satisfying',
    load: () => import('./animations/KineticSandMarimbas.js').then(m => m.default)
  },
  {
    id: 'KineticSandRipple',
    title: 'Kinetic Sand Ripple',
    description: 'Tactile kinetic sand rippling organically in wind waves.',
    vibe: 'Satisfying',
    load: () => import('./animations/KineticSandRipple.js').then(m => m.default)
  },
  {
    id: 'LavaLampBlobs',
    title: 'Lava Lamp Blobs',
    description: 'Beautiful viscous liquid metaballs merging and dividing smoothly.',
    vibe: 'Fluidic',
    load: () => import('./animations/LavaLampBlobs.js').then(m => m.default)
  },
  {
    id: 'LissajousWebDancer',
    title: 'Lissajous Web Dancer',
    description: 'Pulsing mathematical streams executing harmonic orbital trajectories.',
    vibe: 'Mathematical',
    load: () => import('./animations/LissajousWebDancer.js').then(m => m.default)
  },
  {
    id: 'LSystemTreeForest',
    title: 'L-System Tree Forest',
    description: 'Procedurally generated forest using L-System fractal grammar.',
    vibe: 'Organic',
    load: () => import('./animations/LSystemTreeForest.js').then(m => m.default)
  },
  {
    id: 'MagneticFieldLines',
    title: 'Magnetic Field Lines',
    description: 'A simulation of physical magnetic field equations between revolving poles.',
    vibe: 'Interactive',
    load: () => import('./animations/MagneticFieldLines.js').then(m => m.default)
  },
  {
    id: 'MandalaTrigonometry',
    title: 'Mandala Trigonometry',
    description: 'Mesmerizing geometric kaleidoscope of rotating concentric floral patterns.',
    vibe: 'Geometric',
    load: () => import('./animations/MandalaTrigonometry.js').then(m => m.default)
  },
  {
    id: 'MathematicalAttractors',
    title: 'Mathematical Lorenz Attractors',
    description: 'Real-time solver of chaotic Lorenz differential equations.',
    vibe: 'Complex',
    load: () => import('./animations/MathematicalAttractors.js').then(m => m.default)
  },
  {
    id: 'MysticForestMist',
    title: 'Mystic Forest Mist',
    description: 'Overlapping vector mist layers moving across screen depths.',
    vibe: 'Atmospheric',
    load: () => import('./animations/MysticForestMist.js').then(m => m.default)
  },
  {
    id: 'NebulaGasSwells',
    title: 'Nebula Gas Swells',
    description: 'Swirling cosmic gaseous cloud coordinates shifting continuously.',
    vibe: 'Cosmic',
    load: () => import('./animations/NebulaGasSwells.js').then(m => m.default)
  },
  {
    id: 'NebulaGasSwirl',
    title: 'Nebula Gas Swirl',
    description: 'Drifting organic cosmic clouds glowing in vibrant violet, pink, and amber.',
    vibe: 'Cosmic',
    load: () => import('./animations/NebulaGasSwirl.js').then(m => m.default)
  },
  {
    id: 'NeonParticleWeb',
    title: 'Neon Particle Web',
    description: 'A constellation-like network of drifting neon particles.',
    vibe: 'Interactive',
    load: () => import('./animations/NeonParticleWeb.js').then(m => m.default)
  },
  {
    id: 'NeuralNetworkSynapses',
    title: 'Neural Network Synapses',
    description: 'Interactive biological brain-like neural network architecture.',
    vibe: 'Cybernetic',
    load: () => import('./animations/NeuralNetworkSynapses.js').then(m => m.default)
  },
  {
    id: 'OceanWaveRipple',
    title: 'Ocean Wave Ripple',
    description: 'Overlapping ocean wave ripples shifting in layered perspective.',
    vibe: 'Satisfying',
    load: () => import('./animations/OceanWaveRipple.js').then(m => m.default)
  },
  {
    id: 'PerlinFlowField',
    title: 'Perlin Flow Field',
    description: 'Glowing silk filaments flowing along organic trigonometric noise streamlines.',
    vibe: 'Mesmerizing',
    load: () => import('./animations/PerlinFlowField.js').then(m => m.default)
  },
  {
    id: 'PlasmaFractalGlow',
    title: 'Plasma Fractal Glow',
    description: 'Shifting fluidic mathematical plasma liquid.',
    vibe: 'Fluidic',
    load: () => import('./animations/PlasmaFractalGlow.js').then(m => m.default)
  },
  {
    id: 'PulsingAbyssJellyfish',
    title: 'Pulsing Abyss Jellyfish',
    description: 'Bioluminescent jellyfish swimming in the deep ocean abyss.',
    vibe: 'Biological',
    load: () => import('./animations/PulsingAbyssJellyfish.js').then(m => m.default)
  },
  {
    id: 'QuantumEntanglement',
    title: 'Quantum Entanglement',
    description: 'Linked pairs of orbital particles spinning in harmonic lockstep.',
    vibe: 'Quantum',
    load: () => import('./animations/QuantumEntanglement.js').then(m => m.default)
  },
  {
    id: 'QuantumFoamDrift',
    title: 'Quantum Foam Drift',
    description: 'Planck-scale glowing spheres bubbling and drifting along a vector flow grid.',
    vibe: 'Quantum',
    load: () => import('./animations/QuantumFoamDrift.js').then(m => m.default)
  },
  {
    id: 'RainbowSpiralTunnel',
    title: 'Rainbow Spiral Tunnel',
    description: 'A dynamic vortex tunnel of nested rings scaling exponentially outwards.',
    vibe: 'Psychedelic',
    load: () => import('./animations/RainbowSpiralTunnel.js').then(m => m.default)
  },
  {
    id: 'ResonantDandelionSeeds',
    title: 'Resonant Dandelion Seeds',
    description: 'An organic dandelion head swaying with seeds that trigger harp plucks.',
    vibe: 'Natural',
    load: () => import('./animations/ResonantDandelionSeeds.js').then(m => m.default)
  },
  {
    id: 'RiverStoneRefractions',
    title: 'River Stone Refractions',
    description: 'Smooth wet river stones under dynamic shifting light caustics.',
    vibe: 'Satisfying',
    load: () => import('./animations/RiverStoneRefractions.js').then(m => m.default)
  },
  {
    id: 'RiverStonesFlow',
    title: 'River Stones Flow',
    description: 'Tactile smooth river stones under a flowing water caustics layer.',
    vibe: 'Satisfying',
    load: () => import('./animations/RiverStonesFlow.js').then(m => m.default)
  },
  {
    id: 'SoftSnowStorm',
    title: 'Soft Snow Storm',
    description: 'Drifting snowflakes caught in shifting wind currents.',
    vibe: 'Atmospheric',
    load: () => import('./animations/SoftSnowStorm.js').then(m => m.default)
  },
  {
    id: 'StarfieldHyperdrive',
    title: 'Starfield Hyperdrive',
    description: 'Perspective warp space-travel rendering through a deep stellar dust field.',
    vibe: 'Astrological',
    load: () => import('./animations/StarfieldHyperdrive.js').then(m => m.default)
  },
  {
    id: 'SupernovaExpansion',
    title: 'Supernova Stellar Expansion',
    description: 'Cosmic star cores collapsing into singularities then exploding.',
    vibe: 'Cosmic',
    load: () => import('./animations/SupernovaExpansion.js').then(m => m.default)
  },
  {
    id: 'SwarmingFireflies',
    title: 'Swarming Fireflies',
    description: 'A simulated golden-amber flock of swarming fireflies.',
    vibe: 'Simulated',
    load: () => import('./animations/SwarmingFireflies.js').then(m => m.default)
  },
  {
    id: 'SwarmingFireflyFlutes',
    title: 'Swarming Firefly Flutes',
    description: 'Golden boid fireflies flocking that produce soft flute tones.',
    vibe: 'Simulated',
    load: () => import('./animations/SwarmingFireflyFlutes.js').then(m => m.default)
  },
  {
    id: 'TrochoidalWaveHarps',
    title: 'Trochoidal Wave Harps',
    description: 'Front-to-back trochoidal ocean waves that pluck harp strings.',
    vibe: 'Satisfying',
    load: () => import('./animations/TrochoidalWaveHarps.js').then(m => m.default)
  },
  {
    id: 'VerletMossDampener',
    title: 'Verlet Moss Dampener',
    description: 'Hanging green moss strands solved via elastic Verlet chain links.',
    vibe: 'Organic',
    load: () => import('./animations/VerletMossDampener.js').then(m => m.default)
  },
  {
    id: 'VortexFlowField',
    title: 'Vortex Flow Field',
    description: 'Satisfying streams of neon particles swirling around gravity wells.',
    vibe: 'Satisfying',
    load: () => import('./animations/VortexFlowField.js').then(m => m.default)
  },
  {
    id: 'WaveInterference',
    title: 'Wave Interference',
    description: 'Interactive circular ripple fluid simulator with interference patterns.',
    vibe: 'Satisfying',
    load: () => import('./animations/WaveInterference.js').then(m => m.default)
  },
  {
    id: 'WindyGrassChimes',
    title: 'Windy Grass Chimes',
    description: 'Misty grass fields swaying with metallic wind chime sounds.',
    vibe: 'Natural',
    load: () => import('./animations/WindyGrassChimes.js').then(m => m.default)
  },
  {
    id: 'WindyGrassField',
    title: 'Windy Grass Field',
    description: 'A glowing bioluminescent grass field swaying in coordinated wave gusts.',
    vibe: 'Natural',
    load: () => import('./animations/WindyGrassField.js').then(m => m.default)
  }
];

export default animationRegistry;
