/**
 * AetherFlow Lofi Background Music Engine
 * A fully procedural, browser-synthesized ambient music generator using native Web Audio API.
 * Synthesizes warm jazz keys, sub-bass, dusty vinyl crackles, boom-bap drums, and delayed melodies.
 */
class LofiMusicEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.vinylGain = null;
    this.musicGain = null;
    this.drumGain = null;
    this.melodyGain = null;
    
    this.isPlaying = false;
    this.isMuted = false;
    
    // Scheduler variables
    this.timerId = null;
    this.tempo = 78; // Lofi BPM
    this.secondsPerBeat = 60 / this.tempo;
    this.sixteenthDuration = this.secondsPerBeat / 4;
    this.nextNoteTime = 0.0;
    this.currentStep = 0; // 0 to 31 (2 bars loop of 16th notes = 32 steps)
    this.scheduleAheadTime = 0.1; // How far ahead to schedule audio (seconds)
    this.lookahead = 25.0; // How frequently to call scheduler (ms)

    // Pre-allocated noise buffer for vinyl crackles and snare hits
    this.noiseBuffer = null;

    // Chord definition arrays (frequencies)
    this.chords = [
      // Dbmaj9: Db3(138.59), F3(174.61), Ab3(207.65), C4(261.63), Eb4(311.13)
      { root: 69.30, keys: [138.59, 174.61, 207.65, 261.63, 311.13], scale: [261.63, 311.13, 349.23, 392.00, 466.16, 523.25] },
      // Bbm9: Bb2(116.54), Db3(138.59), F3(174.61), Ab3(207.65), C4(261.63)
      { root: 58.27, keys: [116.54, 138.59, 174.61, 207.65, 261.63], scale: [233.08, 261.63, 277.18, 311.13, 349.23, 466.16] },
      // Ebm9: Eb2(77.78), Gb3(185.00), Bb3(233.08), Db4(277.18), F4(349.23)
      { root: 38.89, keys: [77.78, 185.00, 233.08, 277.18, 349.23], scale: [277.18, 311.13, 349.23, 369.99, 415.30, 554.37] },
      // Ab13sus4: Ab2(103.83), Gb3(185.00), C4(261.63), Eb4(311.13), F4(349.23)
      { root: 51.91, keys: [103.83, 185.00, 261.63, 311.13, 349.23], scale: [261.63, 293.66, 311.13, 349.23, 392.00, 466.16] }
    ];
    this.currentChordIndex = 0;
    
    // Constant vinyl oscillators or buffers
    this.vinylHum = null;
    this.vinylCrackleTimer = null;
    this.delayNode = null;
  }

  /**
   * Initializes the AudioContext lazily on user gesture
   */
  init() {
    if (this.ctx) return;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContextClass();
    
    // Build Nodes Graph
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.5, this.ctx.currentTime); // Default volume 50%
    this.masterGain.connect(this.ctx.destination);

    // Vinyl sub-mix
    this.vinylGain = this.ctx.createGain();
    this.vinylGain.gain.setValueAtTime(0.08, this.ctx.currentTime); // Keep crackle atmospheric
    this.vinylGain.connect(this.masterGain);

    // Music sub-mix (chords, bass)
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.setValueAtTime(0.24, this.ctx.currentTime);
    this.musicGain.connect(this.masterGain);

    // Drum sub-mix (kick, snare, hi-hats)
    this.drumGain = this.ctx.createGain();
    this.drumGain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    this.drumGain.connect(this.masterGain);

    // Melody plucks sub-mix with dedicated feedback delay
    this.melodyGain = this.ctx.createGain();
    this.melodyGain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    
    // Create Spacious Stereo Echo for Melodies
    this.delayNode = this.ctx.createDelay(1.0);
    const delayFeedback = this.ctx.createGain();
    
    this.delayNode.delayTime.setValueAtTime(this.secondsPerBeat * 0.75, this.ctx.currentTime); // Dotted 8th delay
    delayFeedback.gain.setValueAtTime(0.4, this.ctx.currentTime); // feedback amount
    
    // Delay loop: input -> delay -> feedback -> delay
    this.melodyGain.connect(this.delayNode);
    this.delayNode.connect(delayFeedback);
    delayFeedback.connect(this.delayNode);
    
    // Connect both dry and wet signals to master
    this.melodyGain.connect(this.masterGain);
    this.delayNode.connect(this.masterGain);

    // Pre-build 2-second white noise buffer
    const bufferSize = this.ctx.sampleRate * 2;
    this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    // Begin vinyl backdrop
    this.startVinylNoise();
  }

  /**
   * Generates a vinyl record soundscape with persistent 60Hz hum and bandpassed crackle pops
   */
  startVinylNoise() {
    if (!this.ctx) return;

    // 1. Cozy hum
    this.vinylHum = this.ctx.createOscillator();
    this.vinylHum.type = 'sine';
    this.vinylHum.frequency.setValueAtTime(60, this.ctx.currentTime);

    const humFilter = this.ctx.createBiquadFilter();
    humFilter.type = 'lowpass';
    humFilter.frequency.setValueAtTime(100, this.ctx.currentTime);

    const humGain = this.ctx.createGain();
    humGain.gain.setValueAtTime(0.12, this.ctx.currentTime); // very subtle

    this.vinylHum.connect(humFilter);
    humFilter.connect(humGain);
    humGain.connect(this.vinylGain);
    this.vinylHum.start();

    // 2. Continual loop of bandpassed low-volume static noise
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = this.noiseBuffer;
    noiseSource.loop = true;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(1200, this.ctx.currentTime);
    noiseFilter.Q.setValueAtTime(1.5, this.ctx.currentTime);

    const noiseVol = this.ctx.createGain();
    noiseVol.gain.setValueAtTime(0.04, this.ctx.currentTime);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseVol);
    noiseVol.connect(this.vinylGain);
    noiseSource.start();

    // 3. Procedural Crackles (discrete pops in time)
    const triggerPop = () => {
      if (!this.isPlaying) return;
      
      const popTime = this.ctx.currentTime;
      const pop = this.ctx.createBufferSource();
      pop.buffer = this.noiseBuffer;

      const popFilter = this.ctx.createBiquadFilter();
      popFilter.type = 'bandpass';
      popFilter.frequency.setValueAtTime(800 + Math.random() * 2000, popTime);
      popFilter.Q.setValueAtTime(6.0, popTime);

      const popGain = this.ctx.createGain();
      // Extremely quick click envelope
      popGain.gain.setValueAtTime(0.0, popTime);
      popGain.gain.linearRampToValueAtTime(0.12 + Math.random() * 0.15, popTime + 0.001);
      popGain.gain.exponentialRampToValueAtTime(0.001, popTime + 0.005 + Math.random() * 0.015);

      pop.connect(popFilter);
      popFilter.connect(popGain);
      popGain.connect(this.vinylGain);
      pop.start(popTime);

      // Schedule next random pop
      const nextPopInterval = 150 + Math.random() * 1200;
      this.vinylCrackleTimer = setTimeout(triggerPop, nextPopInterval);
    };

    triggerPop();
  }

  /**
   * Main scheduler matching the classic HTML5 audio clock pattern
   */
  scheduler() {
    while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
      this.scheduleStep(this.currentStep, this.nextNoteTime);
      this.advanceStep();
    }
    this.timerId = setTimeout(() => this.scheduler(), this.lookahead);
  }

  advanceStep() {
    this.nextNoteTime += this.sixteenthDuration;
    this.currentStep = (this.currentStep + 1) % 32; // 2 bars loop
  }

  /**
   * Schedule synthesized events at high-precision audio timeline marks
   */
  scheduleStep(step, time) {
    const chordStep = Math.floor(step / 8); // Switch chords every 8 beats (2 bars = 32 steps, 16 steps per bar)
    
    // Switch chord at beat 0 of every bar cycle (steps 0 and 16)
    if (step === 0) {
      this.currentChordIndex = 0;
      this.playChord(this.chords[0], time);
    } else if (step === 8) {
      this.currentChordIndex = 1;
      this.playChord(this.chords[1], time);
    } else if (step === 16) {
      this.currentChordIndex = 2;
      this.playChord(this.chords[2], time);
    } else if (step === 24) {
      this.currentChordIndex = 3;
      this.playChord(this.chords[3], time);
    }

    const currentChord = this.chords[this.currentChordIndex];

    // --- Sub-Bass (Syncopated pattern) ---
    // Roots hit on step 0, 4, 10, 14, 16, 20, 26, 30
    if (step === 0 || step === 16) {
      this.playBass(currentChord.root, time, 6); // longer root note
    } else if (step === 6 || step === 22) {
      this.playBass(currentChord.root, time, 2);
    } else if (step === 10 || step === 26) {
      this.playBass(currentChord.root, time, 4);
    } else if (step === 14 || step === 30) {
      // 16th note bounce into the next bar
      this.playBass(currentChord.root, time, 1.5);
    }

    // --- Boom-Bap Drums Sequencer ---
    // Standard Lofi Groove: 
    // Kick: 1, 9, 14, 17, 25, 30
    // Snare: 4, 12, 20, 28
    // Hihat: every odd step (swing offset added in scheduler time)
    
    // Drum swings: shift the odd 16th notes slightly late to give that lazy lofi "swing"
    const swingFactor = 0.015;
    const isOddStep = step % 2 !== 0;
    const playTime = isOddStep ? time + swingFactor : time;

    // Kick Drum
    if (step === 0 || step === 10 || step === 14 || step === 16 || step === 26 || step === 30) {
      this.playKick(playTime);
    }

    // Snare Drum (Cozy Rimshot/Chamber Snare style)
    if (step === 4 || step === 12 || step === 20 || step === 28) {
      this.playSnare(playTime);
    }

    // Hi-Hats (Soft, volume-swayed plucks)
    if (step % 2 === 0) {
      const isDownbeat = step % 4 === 0;
      const vol = isDownbeat ? 0.35 + Math.random() * 0.15 : 0.15 + Math.random() * 0.1;
      this.playHihat(playTime, vol);
    }

    // --- Distant Melody Plucks ---
    // Occasionally trigger a random delayed note on random empty intervals
    if (step % 4 !== 0 && Math.random() < 0.28) {
      const notePool = currentChord.scale;
      const randomNote = notePool[Math.floor(Math.random() * notePool.length)];
      this.playMelodyPluck(randomNote, time);
    }
  }

  /**
   * Plays a warm Rhodes-style jazz chord using filtered oscillators and LFO tape wobble
   */
  playChord(chord, time) {
    const chordDuration = this.secondsPerBeat * 2.0; // Cozy pad duration

    // Create a beautiful, subtle vibrato LFO to detune chord oscillators (creates tape-warble wobble)
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(3.8 + Math.random() * 0.8, time);
    
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(5.5, time); // Detune amplitude (in cents)
    
    lfo.connect(lfoGain);
    lfo.start(time);
    lfo.stop(time + chordDuration + 0.1);

    // Warm chord-lowpass filter
    const chordFilter = this.ctx.createBiquadFilter();
    chordFilter.type = 'lowpass';
    chordFilter.frequency.setValueAtTime(320, time);
    chordFilter.frequency.exponentialRampToValueAtTime(450, time + 0.15); // gentle decay sweep
    chordFilter.frequency.exponentialRampToValueAtTime(260, time + chordDuration);

    const chordVolume = this.ctx.createGain();
    chordVolume.gain.setValueAtTime(0.0, time);
    chordVolume.gain.linearRampToValueAtTime(0.55, time + 0.08); // slow soft attack
    chordVolume.gain.setValueAtTime(0.55, time + chordDuration - 0.3);
    chordVolume.gain.exponentialRampToValueAtTime(0.001, time + chordDuration + 0.1); // warm tail fadeout

    chordVolume.connect(chordFilter);
    chordFilter.connect(this.musicGain);

    // Generate individual oscillators for each chord interval (Dual Triangle & Sine mix)
    chord.keys.forEach((freq) => {
      // 1. Primary warm triangle wave
      const triOsc = this.ctx.createOscillator();
      triOsc.type = 'triangle';
      triOsc.frequency.setValueAtTime(freq, time);
      lfoGain.connect(triOsc.detune);

      const triGain = this.ctx.createGain();
      triGain.gain.setValueAtTime(0.65, time);

      triOsc.connect(triGain);
      triGain.connect(chordVolume);

      // 2. Overtone sine wave for round bell-like harmonics
      const sineOsc = this.ctx.createOscillator();
      sineOsc.type = 'sine';
      sineOsc.frequency.setValueAtTime(freq * 2.0, time); // 1st octave overtone
      lfoGain.connect(sineOsc.detune);

      const sineGain = this.ctx.createGain();
      sineGain.gain.setValueAtTime(0.14, time); // quiet

      sineOsc.connect(sineGain);
      sineGain.connect(chordVolume);

      // Start & Stop chord components
      triOsc.start(time);
      triOsc.stop(time + chordDuration + 0.1);
      sineOsc.start(time);
      sineOsc.stop(time + chordDuration + 0.1);
    });
  }

  /**
   * Plays a deep sub-bass note (pure filtered low sine)
   */
  playBass(freq, time, durationSteps) {
    const bassDuration = this.sixteenthDuration * durationSteps;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * 0.5, time); // 1 Octave down

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(75, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0, time);
    gain.gain.linearRampToValueAtTime(0.75, time + 0.03); // slightly soft attack to prevent clicking
    gain.gain.setValueAtTime(0.75, time + bassDuration - 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, time + bassDuration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + bassDuration + 0.1);
  }

  /**
   * Synthesizes a warm, rounded kick drum sweep
   */
  playKick(time) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.drumGain);

    // Sine sweep down creates the compression kick thump
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.09);

    gain.gain.setValueAtTime(1.0, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);

    osc.start(time);
    osc.stop(time + 0.2);
  }

  /**
   * Synthesizes a soft, cozy lofi snare (bandpassed noise mixed with warm rimshot)
   */
  playSnare(time) {
    if (!this.noiseBuffer) return;

    // 1. Noise Component (Snare brush spray)
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(1200, time);
    noiseFilter.Q.setValueAtTime(1.8, time);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.48, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.drumGain);
    noise.start(time);
    noise.stop(time + 0.25);

    // 2. Tonality Component (Warm wooden body)
    const bodyOsc = this.ctx.createOscillator();
    bodyOsc.type = 'triangle';
    bodyOsc.frequency.setValueAtTime(175, time);

    const bodyGain = this.ctx.createGain();
    bodyGain.gain.setValueAtTime(0.55, time);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, time + 0.075);

    bodyOsc.connect(bodyGain);
    bodyGain.connect(this.drumGain);
    bodyOsc.start(time);
    bodyOsc.stop(time + 0.1);
  }

  /**
   * Synthesizes a dusty hi-hat brush pluck
   */
  playHihat(time, volume) {
    if (!this.noiseBuffer) return;

    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7000 + Math.random() * 2000, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume * 0.72, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.025 + Math.random() * 0.015);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.drumGain);

    source.start(time);
    source.stop(time + 0.06);
  }

  /**
   * Synthesizes a beautiful electric piano melody bell pluck
   */
  playMelodyPluck(freq, time) {
    const osc = this.ctx.createOscillator();
    osc.type = 'sine'; // Pure sweet bell
    osc.frequency.setValueAtTime(freq, time);

    const subOsc = this.ctx.createOscillator();
    subOsc.type = 'triangle'; // Add body
    subOsc.frequency.setValueAtTime(freq, time);

    const pluckGain = this.ctx.createGain();
    pluckGain.gain.setValueAtTime(0.0, time);
    pluckGain.gain.linearRampToValueAtTime(0.38, time + 0.008); // sharp click pluck
    pluckGain.gain.exponentialRampToValueAtTime(0.001, time + 0.85);

    const pluckFilter = this.ctx.createBiquadFilter();
    pluckFilter.type = 'lowpass';
    pluckFilter.frequency.setValueAtTime(950, time);

    osc.connect(pluckFilter);
    subOsc.connect(pluckFilter);
    
    pluckFilter.connect(pluckGain);
    pluckGain.connect(this.melodyGain);

    osc.start(time);
    osc.stop(time + 1.0);
    subOsc.start(time);
    subOsc.stop(time + 1.0);
  }

  /**
   * Starts lofi background music playback (registers state and starts sequencing tick loop)
   */
  play() {
    this.init();
    if (this.isPlaying) return;

    this.isPlaying = true;
    
    // Resume context if suspended (browser focus security)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.nextNoteTime = this.ctx.currentTime + 0.05;
    this.currentStep = 0;
    this.scheduler();
  }

  /**
   * Pauses the sequencing clock loop
   */
  pause() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    if (this.timerId) clearTimeout(this.timerId);
  }

  /**
   * Smoothly adjusts the Master Volume Gain (0.0 to 1.0)
   */
  setVolume(volume) {
    if (!this.ctx) return;
    const safeVol = Math.max(0.0, Math.min(1.0, parseFloat(volume)));
    this.masterGain.gain.setTargetAtTime(safeVol, this.ctx.currentTime, 0.05);
  }

  /**
   * Smoothly adjusts the background Vinyl crackle level independently
   */
  setVinylVolume(volume) {
    if (!this.ctx) return;
    const safeVol = Math.max(0.0, Math.min(1.0, parseFloat(volume)));
    this.vinylGain.gain.setTargetAtTime(safeVol * 0.15, this.ctx.currentTime, 0.05);
  }
}

// Export singleton instance
export default new LofiMusicEngine();
