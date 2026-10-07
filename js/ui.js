import { $, S, rankName, fmt$ } from './state.js';
import { sfx } from './audio.js';

export function updateHUD() {
  $('s-bal').textContent = fmt$(S.balance);
  $('s-marks').textContent = S.marks;
  $('s-heat').textContent = Math.floor(S.heat);
  $('bar-heat').style.width = Math.min(100, S.heat) + '%';
  $('s-susp').textContent = Math.floor(S.susp);
  $('bar-susp').style.width = Math.min(100, S.susp) + '%';
  const sk = $('s-streak'); if (sk) sk.textContent = S.streak;
  const rk = $('s-rank'); if (rk) rk.textContent = rankName();
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
  const flags = [];
  if (t.vuln > 70) flags.push('HIGH TRUST');
  if (S.smsSent) flags.push('SMS SENT');
  if (S.walletReady) flags.push('WALLET READY');
  if (S.remoteReady) flags.push('REMOTE OK');
  $('d-flags').textContent = flags.join(' | ') || '';
  $('dossier').classList.add('show');
}

export function hideDossier() { $('dossier').classList.remove('show'); }

export function log(msg, cls) {
  const el = document.createElement('div');
  el.className = 'log-line' + (cls ? ' ' + cls : '');
  el.textContent = msg;
  const box = $('log');
  box.appendChild(el);
  box.scrollTop = box.scrollHeight;
  while (box.children.length > 50) box.removeChild(box.firstChild);
  pushBubble(msg, cls);
}

export function clearConvo() {
  const c = $('convo');
  if (c) { c.innerHTML = ''; c.classList.remove('show'); }
}

function pushBubble(msg, cls) {
  const box = $('convo');
  if (!box) return;
  let kind = 'sys', who = '';
  if (cls === 'accent' || msg.startsWith('You:')) {
    kind = 'you'; who = 'You';
    msg = msg.replace(/^You:\s*/, '');
  } else if (cls === 'warn' && msg.includes(':')) {
    const idx = msg.indexOf(':');
    if (idx > 0 && idx < 40) {
      kind = 'target';
      who = msg.slice(0, idx);
      msg = msg.slice(idx + 1).trim();
    }
  } else if (cls === 'good' || cls === 'bad' || cls === 'dim') {
    kind = 'sys';
  } else return;

  if (kind === 'sys' && !(cls === 'good' || cls === 'bad' || msg.startsWith('--') || msg.startsWith('!') || msg.startsWith('*'))) {
    if (!msg.includes('Connected') && !msg.includes('Line dead') && !msg.includes('TRANSFER') && !msg.includes('HEAT')) return;
  }

  box.classList.add('show');
  const b = document.createElement('div');
  b.className = 'bubble ' + kind;
  if (who) {
    b.innerHTML = '<div class="who">' + who + '</div>' +
      msg.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  } else b.textContent = msg;
  box.appendChild(b);
  box.scrollTop = box.scrollHeight;
  while (box.children.length > 12) box.removeChild(box.firstChild);
}

export function clearChoices() { $('choices').innerHTML = ''; }

export function showChoices(opts) {
  clearChoices();
  opts.forEach(o => {
    const b = document.createElement('button');
    b.className = 'choice-btn' + (o.danger ? ' danger' : '') + (o.safe ? ' safe' : '');
    b.innerHTML = '<span class="lbl">' + o.label + '</span><span class="tag">' + (o.tag || '') + '</span>';
    b.addEventListener('mouseenter', () => sfx('hover'));
    b.addEventListener('click', () => { sfx('click'); clearChoices(); o.fn(); });
    $('choices').appendChild(b);
  });
}

export function hint(msg, ms = 3500) {
  const h = $('hint');
  h.textContent = msg;
  h.classList.add('show');
  clearTimeout(hint._t);
  hint._t = setTimeout(() => h.classList.remove('show'), ms);
}

export function showTools(on) { $('tools').classList.toggle('show', !!on); }

export function setCallBanner(on, name) {
  const ban = $('call-banner');
  if (!ban) return;
  ban.classList.toggle('on', !!on);
  if (on && name) $('call-banner-text').textContent = 'ON CALL | ' + name.split(' ')[0];
}
