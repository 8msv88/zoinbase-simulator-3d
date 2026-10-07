import {
  S, $, FIRST, LAST, AGES, CITIES, CARRIERS, LAST_TX,
  fmt$, rand, pick, caseId, rankName, addHeat as _addHeat, addSusp as _addSusp, onHeatChange
} from './state.js';
import { sfx, resumeAudio } from './audio.js';
import {
  updateHUD, showDossier, hideDossier, log,
  clearChoices, showChoices, hint, showTools
} from './ui.js';
import { pulseHalo } from './scene.js';
import {
  monitorIdle, monitorDialing, monitorStartCall, monitorEndCall, monitorSetTimer
} from './monitor.js';

export function addHeat(n) { _addHeat(n); }
export function addSusp(n) { _addSusp(n); updateHUD(); }
onHeatChange(() => { updateHUD(); if (S.heat >= 100 && !S.cooling) heatCrisis(); });

function heatCrisis() {
  if (S.dead || S.cooling) return;
  S.cooling = true; S.callActive = false;
  $('call-timer').classList.remove('on');
  clearChoices(); hideDossier(); showTools(false); sfx('fail');
  monitorEndCall();
  const lost = Math.min(S.balance, Math.floor(S.balance * rand(0.08, 0.22)));
  S.balance -= lost; S.streak = 0; updateHUD();
  log('! HEAT CRITICAL - laying low...', 'bad');
  if (lost > 0) log('Burn: -' + fmt$(lost), 'bad');
  showChoices([
    { label: 'Lay low', tag: 'Heat ~25 | keep balance', safe: true, fn: () => {
      S.heat = Math.floor(rand(18, 32)); S.cooling = false; updateHUD(); sfx('connect');
      monitorIdle(); log('Relay online. Click the phone.', 'dim'); S.awaitingDial = true; maybeEvent();
    }},
    { label: 'Burn decoy and push', tag: 'Heat 55', danger: true, fn: () => {
      const b = Math.floor(S.balance * 0.05); S.balance = Math.max(0, S.balance - b);
      S.heat = 55; S.cooling = false; updateHUD(); sfx('alert');
      monitorIdle(); log('Decoy burned. Still hot.', 'warn'); S.awaitingDial = true; maybeEvent();
    }}
  ]);
}

function genTarget() {
  const scale = 1 + Math.min(1.4, S.lifetime * 0.015);
  let vuln = Math.floor(rand(32, 90));
  if (S.lifetime > 15) vuln = Math.floor(rand(28, 82));
  if (S._nextVulnBoost) { vuln = Math.min(95, vuln + S._nextVulnBoost); S._nextVulnBoost = 0; }
  if (S.streak >= 5) vuln = Math.min(95, vuln + 4);
  return {
    name: pick(FIRST) + ' ' + pick(LAST), age: pick(AGES), city: pick(CITIES),
    carrier: pick(CARRIERS), acct: '**** ' + Math.floor(rand(1000, 9999)),
    balance: Math.floor(rand(4000, 52000) * scale), vuln, lastTx: pick(LAST_TX)
  };
}

export function onDialPhone() {
  if (S.dead || !S.awaitingDial || S.cooling) return;
  pulseHalo(); sfx('dial'); S.awaitingDial = false;
  monitorDialing();
  setTimeout(() => { sfx('ring'); setTimeout(nextTarget, 900); }, 400);
}

function nextTarget() {
  if (S.dead) return;
  S.susp = 0; S.pressure = false; S.payout_mod = 1;
  S.smsSent = false; S.walletReady = false; S.remoteReady = false; S.caseOpened = false;
  S.seedPhrase = null; S.recoveryAddr = null; S.caseId = caseId();
  S.target = genTarget(); S.callActive = true; S.callStart = Date.now();
  $('call-timer').classList.add('on');
  monitorStartCall(S.target.name, S.caseId);
  updateHUD(); showDossier(S.target); showTools(true); sfx('connect');
  log('Connected via spoof portal', 'dim');
  setTimeout(() => { log(S.target.name + ': Hello? Who is this?', 'warn'); showOpening(); }, 600);
}

function showOpening() {
  showChoices([
    { label: 'Coinbase Security - unusual activity on your account.', tag: 'Standard', fn: () => {
      log('You: This is Coinbase security. Unusual activity detected' + (S.caseOpened ? ' - case ' + S.caseId : '') + '.', 'accent');
      let d = S.target.vuln > 60 ? -6 : 7; if (S.smsSent) d -= 5; if (S.caseOpened) d -= 4;
      addSusp(d); S.payout_mod = 1; setTimeout(targetReaction, 800);
    }},
    { label: 'Bank fraud dept - flagged transfer.', tag: 'Safer | half payout', safe: true, fn: () => {
      log('You: Calling from fraud department about a flagged transfer.', 'accent');
      addSusp(S.smsSent ? 0 : 3); S.payout_mod = 0.5; setTimeout(targetReaction, 800);
    }},
    { label: 'Withdrawal in progress RIGHT NOW.', tag: 'Max urgency', danger: true, fn: () => {
      log('You: Active withdrawal for ' + fmt$(Math.floor(S.target.balance * 0.4)) + ' right now.', 'accent');
      addSusp(S.smsSent ? 12 : 22); S.pressure = true; S.payout_mod = 1.15; setTimeout(targetReaction, 800);
    }}
  ]);
}

function targetReaction() {
  if (S.dead) return;
  if (S.susp >= 100) { sfx('fail'); log(S.target.name + ': I am hanging up.', 'bad'); hangUp(25); return; }
  if (S.susp > 52) { log(S.target.name + ': How do I know you are really Coinbase?', 'warn'); setTimeout(showVerify, 500); }
  else { log(S.target.name + ': Oh god... what do I need to do?', 'warn'); setTimeout(showWalk, 500); }
}

function showVerify() {
  showChoices([
    { label: 'Urgency - funds may be gone if you hang up.', tag: 'Reduce suspicion', fn: () => {
      log('You: You can call the number on your card - but the withdrawal may clear first.', 'accent');
      addSusp(-(S.target.vuln / 3.5));
      setTimeout(() => {
        if (S.susp > 42) { log(S.target.name + ': I am calling them myself.', 'bad'); hangUp(12); }
        else { log(S.target.name + ': Okay. Tell me what to do.', 'warn'); setTimeout(showWalk, 450); }
      }, 700);
    }},
    { label: 'Quote case ID', tag: 'Better if case opened', fn: () => {
      log('You: Case ' + (S.caseId || caseId()) + ' is on the support portal.', 'accent');
      addSusp(S.caseOpened ? 4 : 11);
      setTimeout(() => {
        const chance = S.target.vuln / 100 + (S.caseOpened ? 0.15 : 0) + (S.smsSent ? 0.1 : 0);
        if (Math.random() < chance) { log(S.target.name + ': That matches. What next?', 'warn'); setTimeout(showWalk, 450); }
        else { log(S.target.name + ': That does not match. Goodbye.', 'bad'); hangUp(10); }
      }, 750);
    }},
    { label: 'Threaten 48-hour account freeze.', tag: 'Panic if vuln > 45', fn: () => {
      log('You: I am freezing the account for 48 hours.', 'accent');
      setTimeout(() => {
        if (S.target.vuln > 45) { addSusp(-18); log(S.target.name + ': Wait - do not freeze it!', 'warn'); setTimeout(showWalk, 450); }
        else { log(S.target.name + ': Fine. Goodbye.', 'bad'); hangUp(6); }
      }, 700);
    }}
  ]);
}

function showWalk() {
  showChoices([
    { label: 'Walk to secure recovery wallet', tag: S.walletReady ? 'Prepped' : 'Prep in toolkit', fn: () => {
      log('You: Move assets into a secure recovery wallet.', 'accent');
      addHeat(S.pressure ? 18 : 11);
      setTimeout(() => {
        let t = S.target.vuln - S.susp / 3; if (S.walletReady) t += 12; if (S.smsSent) t += 6;
        const roll = Math.random() * 100;
        if (roll < t) successMark(S.target.balance * S.payout_mod * (S.walletReady ? 1 : 0.85));
        else if (roll < S.target.vuln + 28) { sfx('fail'); log(S.target.name + ': My son says this is a scam!', 'bad'); hangUp(16); }
        else { sfx('fail'); log(S.target.name + ': Calling Coinbase myself.', 'bad'); hangUp(20); }
      }, 1000);
    }},
    { label: 'Ask for 12 recovery words', tag: 'High heat | high reward', danger: true, fn: () => {
      log('You: Read the 12 recovery words to verify ownership.', 'accent'); addHeat(20);
      setTimeout(() => {
        if (Math.random() < S.target.vuln / 140 + (S.smsSent ? 0.05 : 0)) { successMark(S.target.balance * S.payout_mod * 1.1); addHeat(12); }
        else { sfx('fail'); log(S.target.name + ': I am not reading those. Goodbye.', 'bad'); hangUp(22); }
      }, 900);
    }},
    { label: 'Remote with AnyDesk', tag: S.remoteReady ? 'Session live' : 'Use Remote tool first', fn: () => {
      log('You: Install AnyDesk so I can secure the session.', 'accent'); addHeat(S.remoteReady ? 8 : 12);
      setTimeout(() => {
        let chance = S.target.vuln / 115; if (S.remoteReady) chance += 0.18; if (S.smsSent) chance += 0.05;
        if (Math.random() < chance) { successMark(S.target.balance * 0.72); addHeat(6); }
        else { sfx('fail'); log(S.target.name + ': Never install remote software. Goodbye.', 'bad'); hangUp(14); }
      }, 950);
    }}
  ]);
}

function hangUp(heat) {
  addHeat(heat); if (S.streak > 0) log('Streak broken (' + S.streak + ').', 'dim');
  S.streak = 0; updateHUD(); endCall();
  if (!S.dead && !S.cooling) setTimeout(() => {
    S.awaitingDial = true; monitorIdle(); log('Line dead. Click the phone.', 'dim'); showTools(false); maybeEvent();
  }, 800);
}

function endCall() {
  S.callActive = false; $('call-timer').classList.remove('on'); hideDossier();
  setTimeout(() => { if (!S.callActive) monitorEndCall(); }, 2500);
}

function successMark(amt) {
  const gain = Math.floor(amt);
  S.balance += gain; S.marks++; S.lifetime++; S.streak++;
  S.bestStreak = Math.max(S.bestStreak, S.streak); updateHUD(); sfx('transfer'); sfx('success');
  log('TRANSFER COMPLETE - +' + fmt$(gain), 'good');
  log(S.target.name + ' marked. Streak ' + S.streak, 'good'); endCall();
  setTimeout(() => {
    if (S.dead) return;
    showChoices([
      { label: 'Park 40% cash', tag: 'Heat -12', safe: true, fn: () => {
        const part = Math.floor(S.balance * 0.4);
        if (part > 0) { S.balance -= part; S.cashedTotal += part; S.heat = Math.max(0, S.heat - 12); updateHUD(); sfx('success'); log('Parked ' + fmt$(part), 'good'); }
        afterMarkMenu();
      }},
      { label: 'Dial next mark', tag: 'Heat +6', fn: () => {
        addHeat(6); if (!S.dead && !S.cooling) { S.awaitingDial = true; monitorIdle(); log('Click the phone.', 'dim'); showTools(false); maybeEvent(); }
      }},
      { label: 'Scanner event', tag: 'Random', fn: () => { forceEvent(); afterMarkMenu(); }}
    ]);
  }, 600);
}

function afterMarkMenu() {
  if (S.dead || S.cooling) return;
  showChoices([
    { label: 'Dial next mark', tag: 'Keep going', fn: () => {
      addHeat(4); if (!S.dead && !S.cooling) { S.awaitingDial = true; monitorIdle(); log('Click the phone.', 'dim'); showTools(false); }
    }},
    { label: 'Park more cash', tag: '40% | heat -10', safe: true, fn: () => {
      const part = Math.floor(S.balance * 0.4);
      if (part > 0) { S.balance -= part; S.cashedTotal += part; S.heat = Math.max(0, S.heat - 10); updateHUD(); sfx('success'); log('Parked ' + fmt$(part), 'good'); }
      afterMarkMenu();
    }}
  ]);
}

const EVENTS = [
  { msg: 'Scanner: PD pinged VoIP. Heat +4.', heat: 4, cls: 'warn' },
  { msg: 'Mixer hop. Heat -5.', heat: -5, cls: 'good' },
  { msg: 'Quiet hour. Heat -8.', heat: -8, cls: 'good' },
  { msg: 'Crew pinched. Heat +6.', heat: 6, cls: 'bad' },
  { msg: 'Crypto pumps. Vuln bump next call.', heat: 0, cls: 'accent', vuln: true },
  { msg: 'Breach list drop. Heat -3.', heat: -3, cls: 'good' }
];
function maybeEvent() { if (Math.random() > 0.42) return; forceEvent(); }
function forceEvent() {
  const e = pick(EVENTS); log(e.msg, e.cls);
  if (e.heat) addHeat(e.heat); if (e.vuln) S._nextVulnBoost = 8;
  sfx(e.heat && e.heat > 0 ? 'alert' : 'click');
}

export function startGame() {
  resumeAudio();
  Object.assign(S, { balance: 0, marks: 0, heat: 0, susp: 0, target: null, dead: false,
    awaitingDial: false, pressure: false, payout_mod: 1, callActive: false, smsSent: false,
    walletReady: false, remoteReady: false, caseOpened: false, streak: 0, cooling: false });
  $('hud').classList.remove('hidden');
  $('start-modal').classList.add('hidden'); $('end-modal').classList.add('hidden');
  updateHUD(); hideDossier(); clearChoices(); showTools(false);
  monitorIdle();
  log('Shift started. Click the burner phone.', 'dim');
  if (S.lifetime > 0) log('Lifetime: ' + S.lifetime + ' | Rank: ' + rankName(), 'dim');
  S.awaitingDial = true; sfx('connect'); hint('Click the glowing phone - watch the monitor', 5000);
}

export function bindModals() {
  $('btn-start').addEventListener('click', () => { sfx('click'); startGame(); });
  $('btn-again').addEventListener('click', () => {
    sfx('click'); $('end-modal').classList.add('hidden'); $('hud').classList.remove('hidden');
    S.dead = false; S.cooling = false; updateHUD(); monitorIdle();
    log('Back at the desk.', 'dim'); S.awaitingDial = true;
  });
  $('btn-menu').addEventListener('click', () => {
    sfx('click'); $('end-modal').classList.add('hidden'); $('start-modal').classList.remove('hidden');
    $('hud').classList.add('hidden'); hideDossier(); clearChoices(); showTools(false); monitorIdle();
  });
}

setInterval(() => {
  if (!S.callActive) return;
  const sec = Math.floor((Date.now() - S.callStart) / 1000);
  const m = String(Math.floor(sec / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  const t = m + ':' + s;
  $('call-timer').textContent = 'CALL ' + t;
  monitorSetTimer(t);
}, 500);
