// Web Audio API Synthesizer for Radar Sonification
// Lightweight, zero-dependency, safe fallback

let audioCtx = null;
let soundEnabled = false;

export function toggleRadarSound(enable) {
  soundEnabled = enable;
  if (soundEnabled && !audioCtx) {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();
    } catch (e) {
      console.warn('Web Audio not supported:', e);
      soundEnabled = false;
    }
  }
  return soundEnabled;
}

export function isRadarSoundEnabled() {
  return soundEnabled;
}

// Play a short radar pulse ping (e.g. on sweep, layer toggle)
export function playRadarPing(frequency = 880, duration = 0.12) {
  if (!soundEnabled || !audioCtx) return;
  try {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(frequency * 0.5, audioCtx.currentTime + duration);

    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    // Silently handle audio restrictions
  }
}

// Convert decibels backscatter (-25 dB to +5 dB) to tone frequency (200 Hz to 1200 Hz)
export function playBackscatterProbeTone(dbValue) {
  if (!soundEnabled || !audioCtx) return;
  try {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    // Map -25 dB (dark water) to 220 Hz, 0 dB (double-bounce) to 880 Hz
    const clampedDb = Math.max(-25, Math.min(5, dbValue));
    const normalized = (clampedDb + 25) / 30; // 0 to 1
    const freq = 220 + normalized * 660;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

    gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.08);
  } catch (e) {
    // Ignore
  }
}
