// Audio engine - procedural SFX
const AC = new (window.AudioContext || window.webkitAudioContext)();

export function tone(freq, dur, type = 'sine', vol = 0.08, when = 0) {
  const t0 = AC.currentTime + when;
  const o = AC.createOscillator();
  const g = AC.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  o.connect(g);
  g.connect(AC.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

export function sfx(name) {
  if (AC.state === 'suspended') AC.resume();
  if (name === 'click') tone(800, 0.04, 'square', 0.04);
  else if (name === 'dial') {
    [440, 480, 440, 480, 440].forEach((f, i) => tone(f, 0.12, 'sine', 0.06, i * 0.14));
  } else if (name === 'ring') {
    for (let i = 0; i < 3; i++) {
      tone(480, 0.15, 'sine', 0.07, i * 0.4);
      tone(440, 0.15, 'sine', 0.07, i * 0.4 + 0.15);
    }
  } else if (name === 'connect') {
    tone(600, 0.08, 'sine', 0.06);
    tone(900, 0.12, 'sine', 0.05, 0.08);
  } else if (name === 'success') {
    tone(523, 0.1);
    tone(659, 0.1, 'sine', 0.06, 0.1);
    tone(784, 0.2, 'sine', 0.06, 0.2);
  } else if (name === 'fail') {
    tone(200, 0.25, 'sawtooth', 0.06);
    tone(150, 0.3, 'sawtooth', 0.05, 0.15);
  } else if (name === 'alert') {
    tone(880, 0.08, 'square', 0.05);
    tone(880, 0.08, 'square', 0.05, 0.12);
  } else if (name === 'transfer') {
    for (let i = 0; i < 8; i++) tone(400 + i * 40, 0.06, 'sine', 0.04, i * 0.07);
  } else if (name === 'type') {
    tone(1200 + Math.random() * 400, 0.02, 'square', 0.02);
  } else if (name === 'hover') {
    tone(600, 0.03, 'sine', 0.02);
  } else if (name === 'ambient') {
    tone(55, 0.8, 'sine', 0.015);
    tone(110, 0.6, 'sine', 0.01, 0.1);
  }
}

export function resumeAudio() {
  if (AC.state === 'suspended') return AC.resume();
  return Promise.resolve();
}
