const W = 800, H = 500;
const canvas = document.createElement('canvas');
canvas.width = W; canvas.height = H;
const ctx = canvas.getContext('2d');

let lines = [];
let mode = 'idle';
let callName = '', callTimer = '00:00', caseLabel = '';
let blink = 0, texture = null;
let typing = null;
let stats = { bal: 0, heat: 0, streak: 0 };

export function getMonitorCanvas() { return canvas; }
export function setMonitorTexture(tex) { texture = tex; paint(); }
export function setMonitorStats(s) { stats = s; if (mode === 'idle' || mode === 'call') paint(); }

export function monitorIdle() {
  mode = 'idle'; lines = []; callName = ''; caseLabel = ''; typing = null; paint();
}
export function monitorDialing() {
  mode = 'dialing'; lines = []; typing = null; paint();
}
export function monitorStartCall(name, caseId) {
  mode = 'call'; callName = name; caseLabel = caseId || ''; lines = []; typing = null; paint();
}
export function monitorEndCall() { mode = 'idle'; callName = ''; typing = null; paint(); }
export function monitorSetTimer(str) { callTimer = str; if (mode === 'call') paint(); }

export function monitorPush(who, text, kind) {
  let color = '#a0a8b8';
  if (kind === 'you' || who === 'You') color = '#9ec5ff';
  else if (kind === 'target') color = '#ffd070';
  else if (kind === 'good') color = '#4aee98';
  else if (kind === 'bad') color = '#ff7a88';
  else if (kind === 'sys') color = '#8890a0';
  if ((kind === 'you' || kind === 'target') && text.length > 8) {
    typing = { who: who || '', full: String(text), shown: '', color, kind };
    typeTick();
  } else {
    lines.push({ who: who || '', text: String(text), color });
    while (lines.length > 11) lines.shift();
    paint();
  }
}

function typeTick() {
  if (!typing) return;
  if (typing.shown.length < typing.full.length) {
    typing.shown += typing.full[typing.shown.length];
    paint();
    setTimeout(typeTick, 10 + Math.random() * 14);
  } else {
    lines.push({ who: typing.who, text: typing.full, color: typing.color });
    while (lines.length > 11) lines.shift();
    typing = null;
    paint();
  }
}

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
  ctx.fillStyle = '#0c1420';
  ctx.fillRect(0, 0, W, H);
  if (mode === 'idle') paintIdle();
  else if (mode === 'dialing') paintDialing();
  else if (mode === 'call') paintCall();
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1);
  if (texture) texture.needsUpdate = true;
}

function paintIdle() {
  ctx.fillStyle = '#152238';
  ctx.fillRect(0, 0, W, 40);
  ctx.fillStyle = '#6aabff';
  ctx.font = 'bold 16px Courier New, monospace';
  ctx.fillText('ZOINBASE  |  SUPPORT CONSOLE', 18, 26);
  ctx.fillStyle = '#3ddc84';
  ctx.font = '13px Courier New, monospace';
  ctx.fillText('RELAY ONLINE', W - 140, 26);
  ctx.fillStyle = '#0a1018';
  ctx.fillRect(0, 40, W, 32);
  ctx.fillStyle = '#c0c8d8';
  ctx.font = '13px Courier New, monospace';
  ctx.fillText('BAL $' + Math.floor(stats.bal||0).toLocaleString() + '    HEAT ' + Math.floor(stats.heat||0) + '%    STREAK ' + (stats.streak||0), 18, 62);
  const cx = 50, cy = 100, cw = W - 100, ch = 280;
  ctx.fillStyle = '#101a28';
  roundRect(cx, cy, cw, ch, 10); ctx.fill();
  ctx.strokeStyle = '#3a5a90';
  ctx.lineWidth = 2; roundRect(cx, cy, cw, ch, 10); ctx.stroke();
  ctx.fillStyle = '#7eb8ff';
  ctx.font = 'bold 22px Courier New, monospace';
  ctx.fillText('> AWAITING DIAL', cx + 28, cy + 50);
  ctx.fillStyle = '#d0d8e8';
  ctx.font = '16px Courier New, monospace';
  ctx.fillText('Click the glowing phone on the desk.', cx + 28, cy + 100);
  ctx.fillText('Conversation types out on this screen.', cx + 28, cy + 130);
  ctx.fillText('Press keys 1 - 3 to pick dialogue lines.', cx + 28, cy + 160);
  ctx.fillStyle = '#7080a0';
  ctx.font = '14px Courier New, monospace';
  ctx.fillText('VoIP encrypted  |  Spoof portal ready', cx + 28, cy + 220);
  blink = (blink + 1) % 60;
  if (blink < 30) {
    ctx.fillStyle = '#6aabff';
    ctx.fillRect(cx + 28, cy + 245, 12, 18);
  }
}

function paintDialing() {
  ctx.fillStyle = '#152238';
  ctx.fillRect(0, 0, W, 40);
  ctx.fillStyle = '#ffc040';
  ctx.font = 'bold 16px Courier New, monospace';
  ctx.fillText('DIALING...', 18, 26);
  ctx.fillStyle = '#8ec0ff';
  ctx.font = 'bold 26px Courier New, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Connecting VoIP relay...', W/2, H/2 - 10);
  ctx.fillStyle = '#90a0b8';
  ctx.font = '15px Courier New, monospace';
  ctx.fillText('Spoofing caller ID  |  +1 (888) 908-7930', W/2, H/2 + 28);
  ctx.textAlign = 'left';
}

function paintCall() {
  ctx.fillStyle = '#0e1a2c';
  ctx.fillRect(0, 0, W, 52);
  ctx.fillStyle = '#3ddc84';
  ctx.beginPath(); ctx.arc(22, 26, 6, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#f0f4fc';
  ctx.font = 'bold 16px Courier New, monospace';
  ctx.fillText('ON CALL  |  ' + (callName || 'Unknown'), 38, 22);
  ctx.fillStyle = '#90a0b8';
  ctx.font = '13px Courier New, monospace';
  ctx.fillText((caseLabel ? caseLabel + '  |  ' : '') + callTimer, 38, 42);
  ctx.fillStyle = '#ff5a6a';
  ctx.font = 'bold 13px Courier New, monospace';
  ctx.fillText('LIVE', W - 55, 30);
  const top = 62, bottom = H - 30;
  let y = top + 6;
  const maxW = W - 56;
  const drawList = lines.slice();
  if (typing) drawList.push({ who: typing.who, text: typing.shown + (blink < 30 ? '|' : ''), color: typing.color });
  for (const ln of drawList) {
    const isYou = ln.who === 'You' || ln.color === '#9ec5ff';
    const isSys = !ln.who;
    ctx.font = '15px Courier New, monospace';
    if (isSys) {
      ctx.fillStyle = ln.color;
      ctx.font = 'italic 14px Courier New, monospace';
      const tw = ctx.measureText(ln.text).width;
      ctx.fillText(ln.text, (W - tw) / 2, y + 14);
      y += 26;
    } else {
      const prefix = ln.who ? ln.who + ': ' : '';
      const full = prefix + ln.text;
      const words = full.split(' ');
      const wrapped = []; let row = '';
      for (const w of words) {
        const test = row ? row + ' ' + w : w;
        if (ctx.measureText(test).width > maxW - 28) { if (row) wrapped.push(row); row = w; }
        else row = test;
      }
      if (row) wrapped.push(row);
      const bh = wrapped.length * 20 + 18;
      const bw = Math.min(maxW, Math.max(...wrapped.map(r => ctx.measureText(r).width)) + 28);
      const bx = isYou ? W - 18 - bw : 18;
      ctx.fillStyle = isYou ? 'rgba(60,110,200,0.35)' : 'rgba(180,120,30,0.28)';
      roundRect(bx, y, bw, bh, 8); ctx.fill();
      ctx.strokeStyle = isYou ? 'rgba(120,170,255,0.55)' : 'rgba(255,190,60,0.45)';
      ctx.lineWidth = 1.5; roundRect(bx, y, bw, bh, 8); ctx.stroke();
      ctx.fillStyle = ln.color;
      let ty = y + 16;
      for (const r of wrapped) { ctx.fillText(r, bx + 14, ty); ty += 20; }
      y += bh + 10;
    }
    if (y > bottom - 24) break;
  }
  ctx.fillStyle = '#0a1018';
  ctx.fillRect(0, H - 28, W, 28);
  ctx.fillStyle = '#7080a0';
  ctx.font = '12px Courier New, monospace';
  ctx.fillText('Keys 1-3 choose  |  Heat ' + Math.floor(stats.heat||0) + '%', 14, H - 10);
}

setInterval(() => { blink = (blink + 1) % 60; if (mode === 'idle' || typing) paint(); }, 400);
paint();
