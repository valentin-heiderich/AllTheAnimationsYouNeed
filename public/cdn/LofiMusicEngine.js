/**
 * AetherFlow Lofi & Ambient Background Music Engine
 * A fully procedural, browser-synthesized multi-track audio workstation using native Web Audio API.
 * Supports:
 * 1. Cozy Lofi Jazz: Dbmaj9/Bbm9, warm Rhodes tape wobble, boom-bap drums
 * 2. Midnight Ambient: Emaj9/C#m9, extra-muffled pads, dotted echo plucks, minimal clicks
 * 3. Synthwave Retro: Am9/Fmaj9, 4-on-the-floor electronic kick, driving 8th bass, retro detunes
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
    this.currentTrack = 'lofi-jazz';
    
    // Scheduler variables
    this.timerId = null;
    this.tempo = 78; // Active BPM
    this.secondsPerBeat = 60 / this.tempo;
    this.sixteenthDuration = this.secondsPerBeat / 4;
    this.nextNoteTime = 0.0;
    this.currentStep = 0; // 0 to 31 (2 bars loop of 16th notes = 32 steps)
    this.scheduleAheadTime = 0.1; // How far ahead to schedule audio (seconds)
    this.lookahead = 25.0; // How frequently to call scheduler (ms)

    // Pre-allocated noise buffer for vinyl crackles, snares, hats
    this.noiseBuffer = null;

    // Custom music tracks definition
    this.tracks = {
      'lofi-jazz': {
        bpm: 78,
        chords: [
          // Dbmaj9: Db3(138.59), F3(174.61), Ab3(207.65), C4(261.63), Eb4(311.13)
          { root: 69.30, keys: [138.59, 174.61, 207.65, 261.63, 311.13], scale: [261.63, 311.13, 349.23, 392.00, 466.16, 523.25] },
          // Bbm9: Bb2(116.54), Db3(138.59), F3(174.61), Ab3(207.65), C4(261.63)
          { root: 58.27, keys: [116.54, 138.59, 174.61, 207.65, 261.63], scale: [233.08, 261.63, 277.18, 311.13, 349.23, 466.16] },
          // Ebm9: Eb2(77.78), Gb3(185.00), Bb3(233.08), Db4(277.18), F4(349.23)
          { root: 38.89, keys: [77.78, 185.00, 233.08, 277.18, 349.23], scale: [277.18, 311.13, 349.23, 369.99, 415.30, 554.37] },
          // Ab13sus4: Ab2(103.83), Gb3(185.00), C4(261.63), Eb4(311.13), F4(349.23)
          { root: 51.91, keys: [103.83, 185.00, 261.63, 311.13, 349.23], scale: [261.63, 293.66, 311.13, 349.23, 392.00, 466.16] }
        ]
      },
      'midnight-ambient': {
        bpm: 62,
        chords: [
          // Emaj9: E3(164.81), G#3(207.65), B3(246.94), D#4(293.66), F#4(369.99)
          { root: 82.41, keys: [164.81, 207.65, 246.94, 293.66, 369.99], scale: [293.66, 329.63, 369.99, 415.30, 493.88, 554.37] },
          // C#m9: C#3(138.59), E3(164.81), G#3(207.65), B3(246.94), D#4(293.66)
          { root: 69.30, keys: [138.59, 164.81, 207.65, 246.94, 293.66], scale: [277.18, 329.63, 369.99, 415.30, 493.88, 554.37] },
          // Amaj9: A2(110.00), C#3(138.59), E3(164.81), G#3(207.65), B3(246.94)
          { root: 55.00, keys: [110.00, 138.59, 164.81, 207.65, 246.94], scale: [220.00, 246.94, 277.18, 329.63, 369.99, 440.00] },
          // F#m9: F#2(92.50), A2(110.00), C#3(138.59), E3(164.81), G#3(207.65)
          { root: 46.25, keys: [92.50, 110.00, 138.59, 164.81, 207.65], scale: [185.00, 220.00, 246.94, 277.18, 329.63, 369.99] }
        ]
      },
      'synthwave-retro': {
        bpm: 96,
        chords: [
          // Am9: A2(110.00), C3(130.81), E3(164.81), G3(196.00), B3(246.94)
          { root: 55.00, keys: [110.00, 130.81, 164.81, 196.00, 246.94], scale: [220.00, 246.94, 261.63, 293.66, 329.63, 392.00] },
          // Fmaj9: F2(87.31), A2(110.00), C3(130.81), E3(164.81), G3(196.00)
          { root: 43.65, keys: [87.31, 110.00, 130.81, 164.81, 196.00], scale: [220.00, 261.63, 293.66, 329.63, 349.23, 392.00] },
          // G11: G2(98.00), B2(123.47), D3(146.83), F3(174.61), A3(220.00)
          { root: 49.00, keys: [98.00, 123.47, 146.83, 174.61, 220.00], scale: [196.00, 220.00, 246.94, 293.66, 329.63, 392.00] },
          // Em9: E2(82.41), G2(98.00), B2(123.47), D3(146.83), F#3(185.00)
          { root: 41.20, keys: [82.41, 98.00, 123.47, 146.83, 185.00], scale: [196.00, 220.00, 246.94, 293.66, 329.63, 392.00] }
        ]
      }
    };
    
    this.currentChordIndex = 0;
    this.vinylHum = null;
    this.vinylCrackleTimer = null;
    this.delayNode = null;
    this.delayFeedback = null;
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
    this.vinylGain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    this.vinylGain.connect(this.masterGain);

    // Music sub-mix (chords, bass)
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.setValueAtTime(0.24, this.ctx.currentTime);
    this.musicGain.connect(this.masterGain);

    // Drum sub-mix (kick, snare, hi-hats)
    this.drumGain = this.ctx.createGain();
    this.drumGain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    this.drumGain.connect(this.masterGain);

    // Melody plucks sub-mix with feedback delay
    this.melodyGain = this.ctx.createGain();
    this.melodyGain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    
    this.delayNode = this.ctx.createDelay(2.0);
    this.delayFeedback = this.ctx.createGain();
    
    this.delayNode.delayTime.setValueAtTime(this.secondsPerBeat * 0.75, this.ctx.currentTime);
    this.delayFeedback.gain.setValueAtTime(0.4, this.ctx.currentTime);
    
    this.melodyGain.connect(this.delayNode);
    this.delayNode.connect(this.delayFeedback);
    this.delayFeedback.connect(this.delayNode);
    
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

    // 1. Hum
    this.vinylHum = this.ctx.createOscillator();
    this.vinylHum.type = 'sine';
    this.vinylHum.frequency.setValueAtTime(60, this.ctx.currentTime);

    const humFilter = this.ctx.createBiquadFilter();
    humFilter.type = 'lowpass';
    humFilter.frequency.setValueAtTime(100, this.ctx.currentTime);

    const humGain = this.ctx.createGain();
    humGain.gain.setValueAtTime(0.12, this.ctx.currentTime);

    this.vinylHum.connect(humFilter);
    humFilter.connect(humGain);
    humGain.connect(this.vinylGain);
    this.vinylHum.start();

    // 2. Continuous static noise
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

    // 3. Procedural Crackles
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
      popGain.gain.setValueAtTime(0.0, popTime);
      popGain.gain.linearRampToValueAtTime(0.12 + Math.random() * 0.15, popTime + 0.001);
      popGain.gain.exponentialRampToValueAtTime(0.001, popTime + 0.005 + Math.random() * 0.015);

      pop.connect(popFilter);
      popFilter.connect(popGain);
      popGain.connect(this.vinylGain);
      pop.start(popTime);

      const nextPopInterval = 150 + Math.random() * 1200;
      this.vinylCrackleTimer = setTimeout(triggerPop, nextPopInterval);
    };

    triggerPop();
  }

  /**
   * Sets the active music track style
   * @param {string} trackName - 'lofi-jazz', 'midnight-ambient', or 'synthwave-retro'
   */
  setTrack(trackName) {
    if (!this.tracks[trackName]) return;
    this.currentTrack = trackName;
    
    // Auto-update base track BPM
    this.setBPM(this.tracks[trackName].bpm);
  }

  /**
   * Set custom BPM and recalculate sequencing lengths
   */
  setBPM(bpm) {
    const safeBPM = Math.max(40, Math.min(180, parseInt(bpm)));
    this.tempo = safeBPM;
    this.secondsPerBeat = 60 / safeBPM;
    this.sixteenthDuration = this.secondsPerBeat / 4;
    
    // Dynamically adjust active delay nodes to match new tempo
    if (this.ctx && this.delayNode) {
      const delayTimeVal = this.secondsPerBeat * (this.currentTrack === 'midnight-ambient' ? 1.0 : 0.75);
      this.delayNode.delayTime.setTargetAtTime(delayTimeVal, this.ctx.currentTime, 0.1);
    }
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
    this.currentStep = (this.currentStep + 1) % 32;
  }

  /**
   * Schedule synthesized events at high-precision audio timeline marks
   */
  scheduleStep(step, time) {
    const trackData = this.tracks[this.currentTrack];
    const chordsList = trackData.chords;
    
    // Switch chord at beat 0 of every bar cycle (steps 0, 8, 16, 24)
    if (step === 0) {
      this.currentChordIndex = 0;
      this.playChord(chordsList[0], time);
    } else if (step === 8) {
      this.currentChordIndex = 1;
      this.playChord(chordsList[1], time);
    } else if (step === 16) {
      this.currentChordIndex = 2;
      this.playChord(chordsList[2], time);
    } else if (step === 24) {
      this.currentChordIndex = 3;
      this.playChord(chordsList[3], time);
    }

    const currentChord = chordsList[this.currentChordIndex];

    // --- Sub-Bass Scheduling ---
    if (this.currentTrack === 'lofi-jazz') {
      if (step === 0 || step === 16) {
        this.playBass(currentChord.root, time, 6, 'sine');
      } else if (step === 6 || step === 22) {
        this.playBass(currentChord.root, time, 2, 'sine');
      } else if (step === 10 || step === 26) {
        this.playBass(currentChord.root, time, 4, 'sine');
      } else if (step === 14 || step === 30) {
        this.playBass(currentChord.root, time, 1.5, 'sine');
      }
    } else if (this.currentTrack === 'midnight-ambient') {
      // Extremely sparse bass on first beats only
      if (step === 0 || step === 16) {
        this.playBass(currentChord.root, time, 10, 'sine');
      }
    } else if (this.currentTrack === 'synthwave-retro') {
      // Driving 8th notes bass line! (Every even step)
      if (step % 2 === 0) {
        const isOffbeat = step % 4 === 2;
        const bassFreq = isOffbeat ? currentChord.root * 1.0 : currentChord.root * 0.5; // alternate octaves
        this.playBass(bassFreq, time, 1.6, 'sawtooth');
      }
    }

    // --- Drum Sequencer Scheduling ---
    const swingFactor = this.currentTrack === 'lofi-jazz' ? 0.015 : 0.0;
    const isOddStep = step % 2 !== 0;
    const playTime = isOddStep ? time + swingFactor : time;

    if (this.currentTrack === 'lofi-jazz') {
      // Boom-bap drums
      if (step === 0 || step === 10 || step === 14 || step === 16 || step === 26 || step === 30) {
        this.playKick(playTime);
      }
      if (step === 4 || step === 12 || step === 20 || step === 28) {
        this.playSnare(playTime, 'lofi');
      }
      if (step % 2 === 0) {
        const vol = (step % 4 === 0) ? 0.35 : 0.15;
        this.playHihat(playTime, vol);
      }
    } else if (this.currentTrack === 'midnight-ambient') {
      // Muted ambient drums (sparse clicks)
      if (step === 0 || step === 16) {
        this.playKick(playTime * 0.65); // extremely soft deep thud
      }
      if (step === 12 || step === 28) {
        this.playSnare(playTime, 'ambient'); // tiny click
      }
    } else if (this.currentTrack === 'synthwave-retro') {
      // Driving 4-on-the-floor beats
      if (step % 4 === 0) {
        this.playKick(playTime); // Kick on every beat
      }
      if (step === 4 || step === 12 || step === 20 || step === 28) {
        this.playSnare(playTime, 'retro'); // Snare on 2 and 4
      }
      if (step % 2 === 2) {
        this.playHihat(playTime, 0.28); // Upbeat hats
      }
    }

    // --- Melody plucks ---
    if (this.currentTrack === 'lofi-jazz') {
      if (step % 4 !== 0 && Math.random() < 0.28) {
        const note = currentChord.scale[Math.floor(Math.random() * currentChord.scale.length)];
        this.playMelodyPluck(note, time, 'sine');
      }
    } else if (this.currentTrack === 'midnight-ambient') {
      // Random higher echoing bells
      if (step % 3 === 0 && Math.random() < 0.22) {
        const note = currentChord.scale[Math.floor(Math.random() * currentChord.scale.length)] * 2.0; // Octave up
        this.playMelodyPluck(note, time, 'ambient');
      }
    } else if (this.currentTrack === 'synthwave-retro') {
      // 16th note arpeggio style melodies
      if (step % 4 === 2 && Math.random() < 0.45) {
        const note = currentChord.scale[Math.floor(Math.random() * currentChord.scale.length)];
        this.playMelodyPluck(note, time, 'retro');
      }
    }
  }

  /**
   * Plays a chord using filtered oscillators
   */
  playChord(chord, time) {
    const chordDuration = this.secondsPerBeat * 2.0;

    // Vibrato LFO detune
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(this.currentTrack === 'synthwave-retro' ? 6.0 : 3.8, time);
    
    const lfoGain = this.ctx.createGain();
    // Synthwave detunes more for a retro VHS tape feel
    const detuneCents = this.currentTrack === 'synthwave-retro' ? 9.5 : 5.5;
    lfoGain.gain.setValueAtTime(detuneCents, time);
    
    lfo.connect(lfoGain);
    lfo.start(time);
    lfo.stop(time + chordDuration + 0.1);

    const chordFilter = this.ctx.createBiquadFilter();
    chordFilter.type = 'lowpass';
    
    // Set muffled frequencies based on tracks
    let filterFreq = 320;
    if (this.currentTrack === 'midnight-ambient') filterFreq = 210;
    if (this.currentTrack === 'synthwave-retro') filterFreq = 680;

    chordFilter.frequency.setValueAtTime(filterFreq, time);
    chordFilter.frequency.exponentialRampToValueAtTime(filterFreq * 1.35, time + 0.15);
    chordFilter.frequency.exponentialRampToValueAtTime(filterFreq * 0.85, time + chordDuration);

    const chordVolume = this.ctx.createGain();
    chordVolume.gain.setValueAtTime(0.0, time);
    
    // Ambient has a very slow swell attack
    const attackDur = this.currentTrack === 'midnight-ambient' ? 0.35 : 0.08;
    chordVolume.gain.linearRampToValueAtTime(0.55, time + attackDur);
    chordVolume.gain.setValueAtTime(0.55, time + chordDuration - attackDur);
    chordVolume.gain.exponentialRampToValueAtTime(0.001, time + chordDuration + 0.1);

    chordVolume.connect(chordFilter);
    chordFilter.connect(this.musicGain);

    chord.keys.forEach((freq) => {
      // Oscillator 1
      const triOsc = this.ctx.createOscillator();
      // Synthwave uses warm sawtooth, ambient/lofi use triangle
      triOsc.type = this.currentTrack === 'synthwave-retro' ? 'sawtooth' : 'triangle';
      triOsc.frequency.setValueAtTime(freq, time);
      lfoGain.connect(triOsc.detune);

      const triGain = this.ctx.createGain();
      triGain.gain.setValueAtTime(this.currentTrack === 'synthwave-retro' ? 0.28 : 0.65, time);

      triOsc.connect(triGain);
      triGain.connect(chordVolume);

      // Oscillator 2 (Overtones)
      const sineOsc = this.ctx.createOscillator();
      sineOsc.type = 'sine';
      sineOsc.frequency.setValueAtTime(freq * 2.0, time);
      lfoGain.connect(sineOsc.detune);

      const sineGain = this.ctx.createGain();
      sineGain.gain.setValueAtTime(0.12, time);

      sineOsc.connect(sineGain);
      sineGain.connect(chordVolume);

      triOsc.start(time);
      triOsc.stop(time + chordDuration + 0.1);
      sineOsc.start(time);
      sineOsc.stop(time + chordDuration + 0.1);
    });
  }

  /**
   * Plays a deep sub-bass or retro synth bass note
   */
  playBass(freq, time, durationSteps, waveform = 'sine') {
    const bassDuration = this.sixteenthDuration * durationSteps;

    const osc = this.ctx.createOscillator();
    osc.type = waveform;
    osc.frequency.setValueAtTime(waveform === 'sawtooth' ? freq : freq * 0.5, time);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(waveform === 'sawtooth' ? 140 : 75, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0, time);
    gain.gain.linearRampToValueAtTime(waveform === 'sawtooth' ? 0.38 : 0.75, time + 0.02);
    gain.gain.setValueAtTime(waveform === 'sawtooth' ? 0.38 : 0.75, time + bassDuration - 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, time + bassDuration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + bassDuration + 0.1);
  }

  /**
   * Synthesizes a kick thump
   */
  playKick(time) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.drumGain);

    const startFreq = this.currentTrack === 'synthwave-retro' ? 150 : 130;
    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.08);

    gain.gain.setValueAtTime(1.0, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

    osc.start(time);
    osc.stop(time + 0.18);
  }

  /**
   * Synthesizes a snare, rimshot, or click
   */
  playSnare(time, mode) {
    if (!this.noiseBuffer) return;

    if (mode === 'ambient') {
      // Extremely quiet click / high wood block
      const body = this.ctx.createOscillator();
      body.type = 'sine';
      body.frequency.setValueAtTime(1100, time);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.12, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.02);

      body.connect(gain);
      gain.connect(this.drumGain);
      body.start(time);
      body.stop(time + 0.05);
      return;
    }

    // Retro or Lofi Snare
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(mode === 'retro' ? 900 : 1200, time);
    noiseFilter.Q.setValueAtTime(mode === 'retro' ? 1.0 : 1.8, time);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(mode === 'retro' ? 0.38 : 0.48, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + (mode === 'retro' ? 0.28 : 0.18));

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.drumGain);
    noise.start(time);
    noise.stop(time + 0.3);

    // Tone body
    const bodyOsc = this.ctx.createOscillator();
    bodyOsc.type = 'triangle';
    bodyOsc.frequency.setValueAtTime(mode === 'retro' ? 150 : 175, time);

    const bodyGain = this.ctx.createGain();
    bodyGain.gain.setValueAtTime(0.5, time);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

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
    filter.frequency.setValueAtTime(8000 + Math.random() * 2000, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume * 0.72, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.025);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.drumGain);

    source.start(time);
    source.stop(time + 0.05);
  }

  /**
   * Synthesizes a beautiful electric piano melody bell pluck
   */
  playMelodyPluck(freq, time, mode = 'sine') {
    const osc = this.ctx.createOscillator();
    osc.type = mode === 'retro' ? 'sawtooth' : 'sine';
    osc.frequency.setValueAtTime(freq, time);

    const subOsc = this.ctx.createOscillator();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(freq, time);

    const pluckGain = this.ctx.createGain();
    pluckGain.gain.setValueAtTime(0.0, time);
    
    const attackVal = mode === 'ambient' ? 0.18 : 0.38;
    pluckGain.gain.linearRampToValueAtTime(attackVal, time + 0.008);
    pluckGain.gain.exponentialRampToValueAtTime(0.001, time + (mode === 'ambient' ? 1.6 : 0.85));

    const pluckFilter = this.ctx.createBiquadFilter();
    pluckFilter.type = 'lowpass';
    pluckFilter.frequency.setValueAtTime(mode === 'retro' ? 1200 : 950, time);

    osc.connect(pluckFilter);
    subOsc.connect(pluckFilter);
    
    pluckFilter.connect(pluckGain);
    pluckGain.connect(this.melodyGain);

    osc.start(time);
    osc.stop(time + 1.8);
    subOsc.start(time);
    subOsc.stop(time + 1.8);
  }

  /**
   * Starts lofi background music playback
   */
  play() {
    this.init();
    if (this.isPlaying) return;

    this.isPlaying = true;
    
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
