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
    html = `<div class="tool-box"><h3>CASE FILE / TICKET</h3>
      <div class="field"><label>Case ID</label><input id="t-case" value="${S.caseId || caseId()}" readonly></div>
      <div class="field"><label>Spoofed caller ID</label><input value="+1 (888) 908-7930" readonly></div>
      <div class="field"><label>Notes for script</label><input id="t-notes" value="Unauthorized login | IP flagged | funds at risk"></div>
      <div class="row-btns"><button class="btn-secondary" id="t-close">Close</button>
      <button class="btn-primary" id="t-use-case">Open case</button></div></div>`;
  } else if (name === 'sms') {
    html = `<div class="tool-box"><h3>SMS SPOOF</h3>
      <div class="field"><label>From</label><input value="Coinbase" readonly></div>
      <div class="field"><label>Message</label><input id="t-sms" value="Coinbase Alert: Unusual login detected. Call support immediately if this wasn't you."></div>
      <p class="dim" style="font-size:10px;margin:8px 0">Sends a panic text before/during the call. Lowers resistance.</p>
      <div class="row-btns"><button class="btn-secondary" id="t-close">Close</button>
      <button class="btn-primary" id="t-send-sms">Send spoof SMS</button></div></div>`;
  } else if (name === 'wallet') {
    if (!S.seedPhrase) { S.seedPhrase = genSeed(); S.recoveryAddr = genAddr(); }
    html = `<div class="tool-box"><h3>SECURE RECOVERY WALLET</h3>
      <div class="field"><label>Controlled seed (12 words)</label>
      <div class="out" id="t-seed">${S.seedPhrase}</div></div>
      <div class="field"><label>Recovery address</label>
      <div class="out">${S.recoveryAddr}</div></div>
      <p class="dim" style="font-size:10px;margin:8px 0">You give them THIS seed - or walk them to transfer to the address. You control the keys.</p>
      <div class="row-btns"><button class="btn-secondary" id="t-close">Close</button>
      <button class="btn-primary" id="t-prep-wallet">Mark ready</button></div></div>`;
  } else if (name === 'remote') {
    html = `<div class="tool-box"><h3>REMOTE SESSION (AnyDesk)</h3>
      <div class="field"><label>Session ID</label><input value="${Math.floor(rand(100000000, 999999999))}" readonly></div>
      <div class="prog"><div class="prog-fill" id="t-prog" style="width:0%"></div></div>
      <p class="dim" style="font-size:10px" id="t-remote-msg">Walk target through install, then take control.</p>
      <div class="row-btns"><button class="btn-secondary" id="t-close">Close</button>
      <button class="btn-primary" id="t-start-remote">Simulate session</button></div></div>`;
  } else if (name === 'mixer') {
    html = `<div class="tool-box"><h3>MIXER / CASH STATUS</h3>
      <div class="row"><span class="dim">On-desk balance</span><span class="good">${fmt$(S.balance)}</span></div>
      <div class="row" style="margin-top:6px"><span class="dim">Marks</span><span>${S.marks}</span></div>
      <div class="row" style="margin-top:6px"><span class="dim">Heat</span><span class="bad">${Math.floor(S.heat)}%</span></div>
      <div class="row" style="margin-top:6px"><span class="dim">Parked (lifetime)</span><span>${fmt$(S.cashedTotal)}</span></div>
      <p class="dim" style="font-size:10px;margin:10px 0">Funds route through tumbler after each mark. Park cash from dialogue to bleed heat.</p>
      <div class="row-btns"><button class="btn-secondary" id="t-close">Close</button></div></div>`;
  }
  modal.innerHTML = html;
  modal.querySelector('#t-close')?.addEventListener('click', () => { sfx('click'); modal.classList.add('hidden'); });
  modal.querySelector('#t-use-case')?.addEventListener('click', () => {
    sfx('click'); S.caseId = $('t-case').value; S.caseOpened = true;
    log('Case ' + S.caseId + ' opened on spoof portal.', 'dim');
    if (S.target) showDossier(S.target);
    modal.classList.add('hidden');
    hint('Case ID ready - quote it on the call');
  });
  modal.querySelector('#t-send-sms')?.addEventListener('click', () => {
    sfx('alert'); S.smsSent = true; addHeat(3);
    log('SMS spoof sent -> target phone.', 'warn');
    if (S.target) { S.target.vuln = Math.min(95, S.target.vuln + 8); showDossier(S.target); }
    modal.classList.add('hidden');
    hint('SMS delivered. Target more receptive.');
  });
  modal.querySelector('#t-prep-wallet')?.addEventListener('click', () => {
    sfx('success'); S.walletReady = true;
    log('Recovery wallet prepared. Seed under your control.', 'good');
    if (S.target) showDossier(S.target);
    modal.classList.add('hidden');
    hint('Wallet ready for the walk stage');
  });
  modal.querySelector('#t-start-remote')?.addEventListener('click', () => {
    const prog = $('t-prog'), msg = $('t-remote-msg');
    let p = 0;
    const iv = setInterval(() => {
      p += rand(8, 18); if (p > 100) p = 100;
      prog.style.width = p + '%';
      if (p < 30) msg.textContent = 'Target downloading AnyDesk...';
      else if (p < 60) msg.textContent = 'Granting permissions...';
      else if (p < 90) msg.textContent = 'Session connecting...';
      else msg.textContent = 'Remote control active.';
      sfx('type');
      if (p >= 100) {
        clearInterval(iv); sfx('connect'); S.remoteReady = true; addHeat(4);
        log('AnyDesk session live. Desktop under control.', 'good');
        if (S.target) showDossier(S.target);
        setTimeout(() => modal.classList.add('hidden'), 600);
        hint('Remote session ready');
      }
    }, 280);
  });
}
