// Live canvas texture drawn onto the 3D monitor screen
const W = 640, H = 400;
const canvas = document.createElement('canvas');
canvas.width = W; canvas.height = H;
const ctx = canvas.getContext('2d');

let lines = [];
let mode = 'idle';
let callName = '';
let callTimer = '00:00';
let caseLabel = '';
let blink = 0;
let texture = null;

export function getMonitorCanvas() { return canvas; }
export function setMonitorTexture(tex) { texture = tex; paint(); }
export function monitorIdle() { mode = 'idle'; lines = []; callName = ''; caseLabel = ''; paint(); }
export function monitorDialing() { mode = 'dialing'; lines = []; paint(); }
export function monitorStartCall(name, caseId) { mode = 'call'; callName = name; caseLabel = caseId || ''; lines = []; paint(); }
export function monitorEndCall() { mode = 'idle'; callName = ''; paint(); }
export function monitorPush(who, text, kind) {
  let color = '#8a90a0';
  if (kind === 'you' || who === 'You') color = '#7eb0ff';
  else if (kind === 'target') color = '#ffc04d';
  else if (kind === 'good') color = '#3ddc84';
  else if (kind === 'bad') color = '#ff6b7a';
  else if (kind === 'sys') color = '#6a7080';
  lines.push({ who: who || '', text: String(text), color });
  while (lines.length > 14) lines.shift();
  paint();
}
export function monitorSetTimer(str) { callTimer = str; if (mode === 'call') paint(); }

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function paint() {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#0a1628'); g.addColorStop(1, '#060d18');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(79,140,255,0.04)'; ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  if (mode === 'idle') paintIdle();
  else if (mode === 'dialing') paintDialing();
  else if (mode === 'call') paintCall();
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);
  const vg = ctx.createRadialGradient(W/2, H/2, H*0.3, W/2, H/2, H*0.7);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  if (texture) texture.needsUpdate = true;
}

function paintIdle() {
  ctx.fillStyle = 'rgba(79,140,255,0.12)'; ctx.fillRect(0, 0, W, 36);
  ctx.fillStyle = '#4f8cff'; ctx.font = 'bold 13px Courier New, monospace';
  ctx.fillText('ZOINBASE  |  SUPPORT CONSOLE', 16, 23);
  ctx.fillStyle = '#3ddc84'; ctx.font = '11px Courier New, monospace';
  ctx.fillText('RELAY ONLINE', W - 120, 23);
  const cx = 80, cy = 80, cw = W - 160, ch = 220;
  ctx.fillStyle = 'rgba(8,14,24,0.85)'; roundRect(cx, cy, cw, ch, 8); ctx.fill();
  ctx.strokeStyle = 'rgba(79,140,255,0.25)'; ctx.lineWidth = 1; roundRect(cx, cy, cw, ch, 8); ctx.stroke();
  ctx.fillStyle = '#4f8cff'; ctx.font = 'bold 16px Courier New, monospace';
  ctx.fillText('> AWAITING DIAL', cx + 24, cy + 48);
  ctx.fillStyle = '#8a90a0'; ctx.font = '12px Courier New, monospace';
  ctx.fillText('Click the burner phone on the desk to dial.', cx + 24, cy + 80);
  ctx.fillText('Conversation appears here on the monitor.', cx + 24, cy + 102);
  ctx.fillText('Use the toolkit during live calls.', cx + 24, cy + 124);
  ctx.fillStyle = '#3a4050'; ctx.font = '11px Courier New, monospace';
  ctx.fillText('VoIP encrypted  |  Spoof portal ready', cx + 24, cy + 170);
  blink = (blink + 1) % 60;
  if (blink < 30) { ctx.fillStyle = '#4f8cff'; ctx.fillRect(cx + 24, cy + 190, 10, 14); }
}

function paintDialing() {
  ctx.fillStyle = 'rgba(79,140,255,0.12)'; ctx.fillRect(0, 0, W, 36);
  ctx.fillStyle = '#ffb020'; ctx.font = 'bold 13px Courier New, monospace';
  ctx.fillText('DIALING...', 16, 23);
  ctx.fillStyle = '#4f8cff'; ctx.font = 'bold 20px Courier New, monospace'; ctx.textAlign = 'center';
  ctx.fillText('Connecting VoIP relay...', W/2, H/2 - 10);
  ctx.fillStyle = '#6a7080'; ctx.font = '12px Courier New, monospace';
  ctx.fillText('Spoofing caller ID  |  +1 (888) 908-7930', W/2, H/2 + 20);
  ctx.textAlign = 'left';
}

function paintCall() {
  ctx.fillStyle = 'rgba(10,20,36,0.95)'; ctx.fillRect(0, 0, W, 48);
  ctx.fillStyle = '#3ddc84'; ctx.beginPath(); ctx.arc(18, 24, 5, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#e0e4ef'; ctx.font = 'bold 13px Courier New, monospace';
  ctx.fillText('ON CALL  |  ' + (callName || 'Unknown'), 32, 20);
  ctx.fillStyle = '#6a7080'; ctx.font = '11px Courier New, monospace';
  ctx.fillText((caseLabel ? caseLabel + '  |  ' : '') + callTimer, 32, 38);
  ctx.fillStyle = '#ff4d5e'; ctx.font = 'bold 11px Courier New, monospace';
  ctx.fillText('LIVE', W - 50, 28);
  const top = 56, bottom = H - 28;
  let y = top + 8;
  const maxW = W - 48;
  for (const ln of lines) {
    const isYou = ln.who === 'You' || ln.color === '#7eb0ff';
    const isSys = !ln.who;
    ctx.font = '12px Courier New, monospace';
    if (isSys) {
      ctx.fillStyle = ln.color; ctx.font = 'italic 11px Courier New, monospace';
      const tw = ctx.measureText(ln.text).width;
      ctx.fillText(ln.text, (W - tw) / 2, y + 12);
      y += 22;
    } else {
      const prefix = ln.who ? ln.who + ': ' : '';
      const full = prefix + ln.text;
      const words = full.split(' ');
      const wrapped = []; let row = '';
      for (const w of words) {
        const test = row ? row + ' ' + w : w;
        if (ctx.measureText(test).width > maxW - 24) { if (row) wrapped.push(row); row = w; }
        else row = test;
      }
      if (row) wrapped.push(row);
      const bh = wrapped.length * 16 + 16;
      const bw = Math.min(maxW, Math.max(...wrapped.map(r => ctx.measureText(r).width)) + 24);
      const bx = isYou ? W - 16 - bw : 16;
      ctx.fillStyle = isYou ? 'rgba(79,140,255,0.2)' : 'rgba(255,176,32,0.12)';
      roundRect(bx, y, bw, bh, 8); ctx.fill();
      ctx.strokeStyle = isYou ? 'rgba(79,140,255,0.4)' : 'rgba(255,176,32,0.3)';
      ctx.lineWidth = 1; roundRect(bx, y, bw, bh, 8); ctx.stroke();
      ctx.fillStyle = ln.color;
      let ty = y + 14;
      for (const r of wrapped) { ctx.fillText(r, bx + 12, ty); ty += 16; }
      y += bh + 8;
    }
    if (y > bottom - 20) break;
  }
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(0, H - 24, W, 24);
  ctx.fillStyle = '#3a4050'; ctx.font = '10px Courier New, monospace';
  ctx.fillText('Encrypted channel  |  Do not share seed phrases on unsecured lines', 12, H - 8);
}

setInterval(() => { if (mode === 'idle') paint(); }, 500);
paint();
