import { $, S, rankName, fmt$, ACHIEVEMENTS } from './state.js';
import { sfx } from './audio.js';
import { monitorPush, setMonitorStats } from './monitor.js';

let choiceFns = [];

export function updateHUD() {
  $('s-bal').textContent = fmt$(S.balance);
  $('s-marks').textContent = S.marks;
  $('s-heat').textContent = Math.floor(S.heat);
  $('bar-heat').style.width = Math.min(100, S.heat) + '%';
  $('s-susp').textContent = Math.floor(S.susp);
  $('bar-susp').style.width = Math.min(100, S.susp) + '%';
  const sk = $('s-streak'); if (sk) sk.textContent = S.streak;
  const rk = $('s-rank'); if (rk) rk.textContent = rankName();
  const xp = $('s-xp'); if (xp) xp.textContent = S.xp || 0;
  setMonitorStats({ bal: S.balance, heat: S.heat, streak: S.streak });
  updateNightClock();
  const ap = $('ach-panel');
  if (ap) ap.textContent = (S.achievements?.length || 0) + '/' + Object.keys(ACHIEVEMENTS).length + ' achievements';
}

export function updateNightClock() {
  const el = $('night-clock');
  if (!el) return;
  const h = String(S.nightHour).padStart(2,'0');
  const m = String(S.nightMin).padStart(2,'0');
  el.textContent = 'NIGHT SHIFT  ' + h + ':' + m;
}

export function showDossier(t) {
  $('d-name').textContent = t.name + ', ' + t.age;
  $('d-meta').textContent = t.city + ' | ' + t.carrier;
  $('d-case').textContent = S.caseId || '-';
  $('d-acct').textContent = t.acct;
  $('d-bal').textContent = fmt$(t.balance);
  $('d-lasttx').textContent = t.lastTx;
  $('d-vuln').textContent = t.vuln + '%';
  $('d-vuln-bar').style.width = t.vuln + '%';
  const pt = $('d-ptype');
  if (pt) pt.textContent = t.personality?.label || '';
  const flags = [];
  if (t.vuln > 70) flags.push('HIGH TRUST');
  if (S.smsSent) flags.push('SMS');
  if (S.walletReady) flags.push('WALLET');
  if (S.remoteReady) flags.push('REMOTE');
  if (t.personality?.tag) flags.push(t.personality.tag);
  $('d-flags').textContent = flags.join(' | ');
  $('dossier').classList.add('show');
}
export function hideDossier() { $('dossier').classList.remove('show'); }

export function log(msg, cls) {
  let who = '', kind = 'sys';
  if (cls === 'accent' || msg.startsWith('You:')) {
    who = 'You'; kind = 'you'; msg = msg.replace(/^You:\s*/, '');
  } else if (cls === 'warn' && msg.includes(':')) {
    const idx = msg.indexOf(':');
    if (idx > 0 && idx < 40) { who = msg.slice(0, idx); msg = msg.slice(idx+1).trim(); kind = 'target'; }
  } else if (cls === 'good') kind = 'good';
  else if (cls === 'bad') kind = 'bad';
  else kind = 'sys';
  monitorPush(who, msg, kind);
}

export function clearChoices() { $('choices').innerHTML = ''; choiceFns = []; }
export function showChoices(opts) {
  clearChoices();
  choiceFns = opts.map(o => o.fn);
  opts.forEach((o, i) => {
    const b = document.createElement('button');
    b.className = 'choice-btn' + (o.danger ? ' danger' : '') + (o.safe ? ' safe' : '');
    const key = (i < 9) ? String(i + 1) : '';
    b.innerHTML = (key ? '<span class="key">' + key + '</span>' : '') +
      '<span><span class="lbl">' + o.label + '</span><span class="tag">' + (o.tag||'') + '</span></span>';
    b.addEventListener('mouseenter', () => sfx('hover'));
    b.addEventListener('click', () => { sfx('click'); clearChoices(); o.fn(); });
    $('choices').appendChild(b);
  });
}
export function pickChoice(n) {
  if (n >= 0 && n < choiceFns.length) {
    const fn = choiceFns[n];
    clearChoices();
    sfx('click');
    fn();
  }
}
export function hint(msg, ms=3500) {
  const h = $('hint'); h.textContent = msg; h.classList.add('show');
  clearTimeout(hint._t); hint._t = setTimeout(() => h.classList.remove('show'), ms);
}
export function showTools(on) { $('tools').classList.toggle('show', !!on); }
export function setCallBanner() {}

export function toast(title, body) {
  const box = $('toast');
  if (!box) return;
  const el = document.createElement('div');
  el.className = 'toast-item';
  el.innerHTML = '<div class="tt">' + title + '</div><div>' + body + '</div>';
  box.appendChild(el);
  sfx('achieve');
  setTimeout(() => el.remove(), 3200);
}

export function shake() {
  document.body.classList.remove('shake');
  void document.body.offsetWidth;
  document.body.classList.add('shake');
  setTimeout(() => document.body.classList.remove('shake'), 500);
}
