const AC = new (window.AudioContext || window.webkitAudioContext)();
let ambientNodes = [];

export function tone(freq, dur, type='sine', vol=0.08, when=0) {
  const t0 = AC.currentTime + when;
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  o.connect(g); g.connect(AC.destination);
  o.start(t0); o.stop(t0 + dur + 0.02);
}

export function sfx(name) {
  if (AC.state === 'suspended') AC.resume();
  if (name === 'click') tone(800, 0.04, 'square', 0.04);
  else if (name === 'dial') [440,480,440,480,440].forEach((f,i)=>tone(f,0.12,'sine',0.06,i*0.14));
  else if (name === 'ring') { for (let i=0;i<3;i++){ tone(480,0.15,'sine',0.07,i*0.4); tone(440,0.15,'sine',0.07,i*0.4+0.15);} }
  else if (name === 'connect') { tone(600,0.08,'sine',0.06); tone(900,0.12,'sine',0.05,0.08); }
  else if (name === 'success') { tone(523,0.1); tone(659,0.1,'sine',0.06,0.1); tone(784,0.2,'sine',0.06,0.2); }
  else if (name === 'fail') { tone(200,0.25,'sawtooth',0.06); tone(150,0.3,'sawtooth',0.05,0.15); }
  else if (name === 'alert') { tone(880,0.08,'square',0.05); tone(880,0.08,'square',0.05,0.12); }
  else if (name === 'transfer') { for (let i=0;i<8;i++) tone(400+i*40,0.06,'sine',0.04,i*0.07); }
  else if (name === 'type') tone(1200+Math.random()*400,0.02,'square',0.015);
  else if (name === 'hover') tone(600,0.03,'sine',0.02);
  else if (name === 'achieve') { tone(660,0.1); tone(880,0.12,'sine',0.06,0.1); tone(1100,0.2,'sine',0.05,0.22); }
  else if (name === 'key') tone(900+Math.random()*200,0.025,'square',0.02);
}

export function resumeAudio() {
  if (AC.state === 'suspended') return AC.resume().then(startAmbient);
  startAmbient();
  return Promise.resolve();
}

function startAmbient() {
  if (ambientNodes.length) return;
  const buf = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.015;
  const src = AC.createBufferSource();
  src.buffer = buf; src.loop = true;
  const g = AC.createGain(); g.gain.value = 0.35;
  const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 200;
  src.connect(f); f.connect(g); g.connect(AC.destination);
  src.start();
  ambientNodes = [src, g];
}
