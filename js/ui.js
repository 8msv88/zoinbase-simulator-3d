import { $, S, rankName, fmt$ } from './state.js';
import { sfx } from './audio.js';
import { monitorPush } from './monitor.js';

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
  if (S.smsSent) flags.push('SMS');
  if (S.walletReady) flags.push('WALLET');
  if (S.remoteReady) flags.push('REMOTE');
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

export function clearConvo() {}
export function clearChoices() { $('choices').innerHTML = ''; }
export function showChoices(opts) {
  clearChoices();
  opts.forEach(o => {
    const b = document.createElement('button');
    b.className = 'choice-btn' + (o.danger ? ' danger' : '') + (o.safe ? ' safe' : '');
    b.innerHTML = '<span class="lbl">' + o.label + '</span><span class="tag">' + (o.tag||'') + '</span>';
    b.addEventListener('mouseenter', () => sfx('hover'));
    b.addEventListener('click', () => { sfx('click'); clearChoices(); o.fn(); });
    $('choices').appendChild(b);
  });
}
export function hint(msg, ms=3500) {
  const h = $('hint'); h.textContent = msg; h.classList.add('show');
  clearTimeout(hint._t); hint._t = setTimeout(() => h.classList.remove('show'), ms);
}
export function showTools(on) { $('tools').classList.toggle('show', !!on); }
export function setCallBanner() {}
