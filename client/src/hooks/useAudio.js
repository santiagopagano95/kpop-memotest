// Audio system using Web Audio API for synthesized sounds
// No external files needed - generates sounds programmatically

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  // Resume if suspended (autoplay policy)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Play a sequence of notes
function playNotes(notes, type = 'sine', volume = 0.15) {
  try {
    const ctx = getAudioContext();
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.connect(ctx.destination);

    let time = ctx.currentTime;
    notes.forEach(({ freq, duration }) => {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, time);
      
      const noteGain = ctx.createGain();
      noteGain.gain.setValueAtTime(volume, time);
      noteGain.gain.exponentialRampToValueAtTime(0.001, time + duration);
      
      osc.connect(noteGain);
      noteGain.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + duration);
      time += duration;
    });
  } catch {
    // Ignore audio errors
  }
}

// Card flip sound - quick whoosh
export function playFlipSound() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch {
    // Ignore
  }
}

// Match found - happy ascending chime
export function playMatchSound() {
  playNotes([
    { freq: 523, duration: 0.1 },  // C5
    { freq: 659, duration: 0.1 },  // E5
    { freq: 784, duration: 0.15 }, // G5
    { freq: 1047, duration: 0.3 }, // C6
  ], 'triangle', 0.15);
}

// Victory fanfare - triumphant melody
export function playVictorySound() {
  playNotes([
    { freq: 523, duration: 0.15 }, // C5
    { freq: 523, duration: 0.15 }, // C5
    { freq: 523, duration: 0.15 }, // C5
    { freq: 523, duration: 0.4 },  // C5 (long)
    { freq: 415, duration: 0.3 },  // Ab4
    { freq: 466, duration: 0.3 },  // Bb4
    { freq: 523, duration: 0.15 }, // C5
    { freq: 466, duration: 0.1 },  // Bb4
    { freq: 523, duration: 0.5 },  // C5 (long)
  ], 'triangle', 0.12);
}

// Error / buzz sound
export function playErrorSound() {
  playNotes([
    { freq: 200, duration: 0.15 },
    { freq: 150, duration: 0.2 },
  ], 'sawtooth', 0.08);
}

// Background music - simple looping pattern
let bgMusicInterval = null;
let bgMusicGain = null;

export function startBgMusic() {
  if (bgMusicInterval) return;
  
  try {
    const ctx = getAudioContext();
    
    // Play a soft ambient chord progression
    const chords = [
      [262, 330, 392],  // C major
      [220, 277, 330],  // A minor  
      [349, 440, 523],  // F major
      [392, 494, 587],  // G major
    ];
    
    let chordIndex = 0;
    
    function playChord() {
      const chord = chords[chordIndex % chords.length];
      chordIndex++;
      
      chord.forEach(freq => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        
        gain.gain.setValueAtTime(0.03, ctx.currentTime);
        gain.gain.setValueAtTime(0.03, ctx.currentTime + 1.5);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.0);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 2.0);
      });
    }
    
    playChord();
    bgMusicInterval = setInterval(playChord, 2000);
  } catch {
    // Ignore
  }
}

export function stopBgMusic() {
  if (bgMusicInterval) {
    clearInterval(bgMusicInterval);
    bgMusicInterval = null;
  }
}

// Legacy API compatibility
export function playSound(src) {
  if (src.includes('flip')) playFlipSound();
  else if (src.includes('match')) playMatchSound();
  else if (src.includes('victory')) playVictorySound();
}
