import { $, S, caseId, genSeed, genAddr, rand, fmt$, addHeat } from './state.js';
import { sfx } from './audio.js';
import { log, showDossier, hint } from './ui.js';

export function bindTools() {
  document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.addEventListener('click', () => { sfx('click'); openTool(btn.dataset.tool); });
  });
}

function openTool(name) {
  const modal = $('tool-modal');
  modal.classList.remove('hidden');
  let html = '';
  if (name === 'case') {
    html = `<div class="tool-box"><h3>CASE FILE</h3>
      <div class="field"><label>Case ID</label><input id="t-case" value="${S.caseId||caseId()}" readonly></div>
      <div class="field"><label>Caller ID</label><input value="+1 (888) 908-7930" readonly></div>
      <div class="row-btns"><button class="btn-secondary" id="t-close">Close</button>
      <button class="btn-primary" id="t-use-case">Open case</button></div></div>`;
  } else if (name === 'sms') {
    html = `<div class="tool-box"><h3>SMS SPOOF</h3>
      <div class="field"><label>From</label><input value="Coinbase" readonly></div>
      <div class="field"><label>Message</label><input id="t-sms" value="Coinbase Alert: Unusual login. Call support if this wasn't you."></div>
      <div class="row-btns"><button class="btn-secondary" id="t-close">Close</button>
      <button class="btn-primary" id="t-send-sms">Send</button></div></div>`;
  } else if (name === 'wallet') {
    if (!S.seedPhrase) { S.seedPhrase = genSeed(); S.recoveryAddr = genAddr(); }
    html = `<div class="tool-box"><h3>RECOVERY WALLET</h3>
      <div class="field"><label>Controlled seed</label><div class="out">${S.seedPhrase}</div></div>
      <div class="field"><label>Address</label><div class="out">${S.recoveryAddr}</div></div>
      <div class="row-btns"><button class="btn-secondary" id="t-close">Close</button>
      <button class="btn-primary" id="t-prep-wallet">Mark ready</button></div></div>`;
  } else if (name === 'remote') {
    html = `<div class="tool-box"><h3>ANYDESK SESSION</h3>
      <div class="field"><label>Session ID</label><input value="${Math.floor(rand(1e8,9e8))}" readonly></div>
      <div class="prog"><div class="prog-fill" id="t-prog" style="width:0%"></div></div>
      <p class="dim" style="font-size:10px" id="t-remote-msg">Simulate remote control</p>
      <div class="row-btns"><button class="btn-secondary" id="t-close">Close</button>
      <button class="btn-primary" id="t-start-remote">Connect</button></div></div>`;
  } else if (name === 'mixer') {
    html = `<div class="tool-box"><h3>MIXER</h3>
      <div class="row"><span class="dim">Balance</span><span class="good">${fmt$(S.balance)}</span></div>
      <div class="row"><span class="dim">Marks</span><span>${S.marks}</span></div>
      <div class="row"><span class="dim">Heat</span><span class="bad">${Math.floor(S.heat)}%</span></div>
      <div class="row"><span class="dim">Parked</span><span>${fmt$(S.cashedTotal)}</span></div>
      <div class="row-btns"><button class="btn-secondary" id="t-close">Close</button></div></div>`;
  }
  modal.innerHTML = html;
  modal.querySelector('#t-close')?.addEventListener('click', () => { sfx('click'); modal.classList.add('hidden'); });
  modal.querySelector('#t-use-case')?.addEventListener('click', () => {
    sfx('click'); S.caseId = $('t-case').value; S.caseOpened = true;
    log('Case ' + S.caseId + ' opened.', 'dim');
    if (S.target) showDossier(S.target);
    modal.classList.add('hidden'); hint('Case ID ready');
  });
  modal.querySelector('#t-send-sms')?.addEventListener('click', () => {
    sfx('alert'); S.smsSent = true; addHeat(3);
    log('SMS spoof sent to target phone.', 'warn');
    if (S.target) { S.target.vuln = Math.min(95, S.target.vuln + 8); showDossier(S.target); }
    modal.classList.add('hidden'); hint('SMS delivered');
  });
  modal.querySelector('#t-prep-wallet')?.addEventListener('click', () => {
    sfx('success'); S.walletReady = true;
    log('Recovery wallet prepared.', 'good');
    if (S.target) showDossier(S.target);
    modal.classList.add('hidden'); hint('Wallet ready');
  });
  modal.querySelector('#t-start-remote')?.addEventListener('click', () => {
    const prog = $('t-prog'), msg = $('t-remote-msg');
    let p = 0;
    const iv = setInterval(() => {
      p = Math.min(100, p + rand(10, 20)); prog.style.width = p + '%'; sfx('type');
      if (p < 40) msg.textContent = 'Downloading...';
      else if (p < 80) msg.textContent = 'Permissions...';
      else msg.textContent = 'Connected.';
      if (p >= 100) {
        clearInterval(iv); sfx('connect'); S.remoteReady = true; addHeat(4);
        log('AnyDesk session live.', 'good');
        if (S.target) showDossier(S.target);
        setTimeout(() => modal.classList.add('hidden'), 500); hint('Remote ready');
      }
    }, 250);
  });
}
