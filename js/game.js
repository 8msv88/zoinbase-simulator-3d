import {
  S, $, FIRST, LAST, AGES, CITIES, CARRIERS, LAST_TX, PERSONALITIES, ACHIEVEMENTS,
  fmt$, rand, pick, caseId, rankName, addHeat as _addHeat, addSusp as _addSusp,
  onHeatChange, save, load, unlock
} from './state.js';
import { sfx, resumeAudio } from './audio.js';
import {
  updateHUD, showDossier, hideDossier, log, clearChoices, showChoices,
  hint, showTools, toast, shake, pickChoice, updateNightClock
} from './ui.js';
import { pulseHalo } from './scene.js';
import {
  monitorIdle, monitorDialing, monitorStartCall, monitorEndCall, monitorSetTimer
} from './monitor.js';

export function addHeat(n) { _addHeat(n); }
export function addSusp(n) { _addSusp(n); updateHUD(); }
onHeatChange(() => { updateHUD(); if (S.heat >= 100 && !S.cooling) heatCrisis(); });

function tryAch(id) {
  if (unlock(id)) {
    const a = ACHIEVEMENTS[id];
    if (a) toast('ACHIEVEMENT', a.title + ' - ' + a.desc);
  }
}

function tickNight(mins) {
  S.nightMin += mins;
  while (S.nightMin >= 60) { S.nightMin -= 60; S.nightHour = (S.nightHour + 1) % 24; }
  if (S.nightHour >= 3 && S.nightHour < 6) tryAch('night_owl');
  updateNightClock();
  save();
}

function heatCrisis() {
  if (S.dead || S.cooling) return;
  S.cooling = true; S.callActive = false;
  $('call-timer').classList.remove('on');
  clearChoices(); hideDossier(); showTools(false); sfx('fail'); shake();
  monitorEndCall();
  const lost = Math.min(S.balance, Math.floor(S.balance * rand(0.08, 0.22)));
  S.balance -= lost; S.streak = 0; updateHUD();
  log('! HEAT CRITICAL - channel flagged', 'bad');
  if (lost > 0) log('Burn: -' + fmt$(lost), 'bad');
  tryAch('heat_survive');
  showChoices([
    { label: 'Lay low for a few hours', tag: 'Heat ~25 | keep balance', safe: true, fn: () => {
      S.heat = Math.floor(rand(18, 32)); S.cooling = false; updateHUD(); sfx('connect');
      tickNight(Math.floor(rand(90, 180)));
      monitorIdle(); log('Relay online. Click the phone.', 'dim'); S.awaitingDial = true; maybeEvent();
    }},
    { label: 'Burn a decoy and push through', tag: 'Heat 55 | riskier', danger: true, fn: () => {
      const b = Math.floor(S.balance * 0.05); S.balance = Math.max(0, S.balance - b);
      S.heat = 55; S.cooling = false; S.xp += 3; updateHUD(); sfx('alert');
      monitorIdle(); log('Decoy burned. Still hot.', 'warn'); S.awaitingDial = true; maybeEvent();
    }}
  ]);
}

function genTarget() {
  const scale = 1 + Math.min(1.4, S.lifetime * 0.015);
  const personality = pick(PERSONALITIES);
  let vuln = Math.floor(rand(32, 88) + personality.vulnMod);
  vuln = Math.max(15, Math.min(95, vuln));
  if (S.lifetime > 15) vuln = Math.min(vuln, Math.floor(rand(28, 82) + personality.vulnMod / 2));
  if (S._nextVulnBoost) { vuln = Math.min(95, vuln + S._nextVulnBoost); S._nextVulnBoost = 0; }
  if (S.streak >= 5) vuln = Math.min(95, vuln + 4);
  return {
    name: pick(FIRST) + ' ' + pick(LAST), age: pick(AGES), city: pick(CITIES),
    carrier: pick(CARRIERS), acct: '**** ' + Math.floor(rand(1000, 9999)),
    balance: Math.floor(rand(4000, 55000) * scale), vuln, lastTx: pick(LAST_TX),
    personality
  };
}

function targetOpenLine(t) {
  const p = t.personality?.id;
  if (p === 'paranoid') return t.name + ': Who is this? How did you get this number?';
  if (p === 'busy') return t.name + ': Yeah, make it quick - I am in the middle of something.';
  if (p === 'technical') return t.name + ': Hello? Is this about my Coinbase account?';
  if (p === 'elderly') return t.name + ': Hello? ...Hello? I can barely hear you.';
  if (p === 'skeptical') return t.name + ': Yes? Who is calling?';
  return t.name + ': Hello? Who is this?';
}

function targetVerifyLine(t) {
  const p = t.personality?.id;
  if (p === 'paranoid') return t.name + ': I do not trust phone calls. Prove you are Coinbase.';
  if (p === 'technical') return t.name + ': What is my last transaction hash then?';
  if (p === 'skeptical') return t.name + ': How do I know this is not a scam?';
  if (p === 'elderly') return t.name + ': My grandson said never to trust callers...';
  return t.name + ': How do I know you are really Coinbase?';
}

function targetSoftLine(t) {
  const p = t.personality?.id;
  if (p === 'busy') return t.name + ': Fine, just tell me what to do so I can get back to work.';
  if (p === 'trusting') return t.name + ': Oh no - please help me. What do I do?';
  if (p === 'elderly') return t.name + ': Oh dear... please, I do not want to lose my money.';
  return t.name + ': Oh god... what do I need to do?';
}

export function onDialPhone() {
  if (S.dead || !S.awaitingDial || S.cooling) return;
  pulseHalo(); sfx('dial'); S.awaitingDial = false; S.totalDialed++;
  monitorDialing(); tickNight(Math.floor(rand(3, 12)));
  setTimeout(() => { sfx('ring'); setTimeout(nextTarget, 900); }, 400);
}

function nextTarget() {
  if (S.dead) return;
  S.susp = 0; S.pressure = false; S.payout_mod = 1;
  S.smsSent = false; S.walletReady = false; S.remoteReady = false; S.caseOpened = false;
  S.seedPhrase = null; S.recoveryAddr = null; S.caseId = caseId();
  S.target = genTarget(); S.callActive = true; S.callStart = Date.now();
  S._callSuspMin = 100;
  $('call-timer').classList.add('on');
  monitorStartCall(S.target.name, S.caseId);
  updateHUD(); showDossier(S.target); showTools(true); sfx('connect');
  log('Connected - ' + (S.target.personality?.label || 'unknown type'), 'dim');
  setTimeout(() => { log(targetOpenLine(S.target), 'warn'); showOpening(); }, 700);
}

function showOpening() {
  const t = S.target;
  showChoices([
    { label: 'Coinbase Security - unusual activity detected.', tag: 'Standard opener', fn: () => {
      log('You: This is Coinbase account security. We detected unusual activity' + (S.caseOpened ? ' - case ' + S.caseId : '') + '.', 'accent');
      let d = t.vuln > 60 ? -6 : 7;
      if (S.smsSent) d -= 5; if (S.caseOpened) d -= 4;
      if (t.personality?.id === 'paranoid') d += 8;
      if (t.personality?.id === 'trusting') d -= 5;
      addSusp(d); S.payout_mod = 1; setTimeout(targetReaction, 900);
    }},
    { label: 'Bank fraud dept - flagged transfer.', tag: 'Safer | half payout', safe: true, fn: () => {
      log('You: Calling from the fraud department about a flagged transfer on your account.', 'accent');
      addSusp(S.smsSent ? 0 : 3); S.payout_mod = 0.5; setTimeout(targetReaction, 900);
    }},
    { label: 'Withdrawal in progress RIGHT NOW.', tag: 'Max urgency | high risk', danger: true, fn: () => {
      log('You: There is an active withdrawal for ' + fmt$(Math.floor(t.balance * 0.4)) + ' right now.', 'accent');
      let d = S.smsSent ? 12 : 22;
      if (t.personality?.id === 'busy') d -= 6;
      if (t.personality?.id === 'paranoid') d += 10;
      addSusp(d); S.pressure = true; S.payout_mod = 1.15; setTimeout(targetReaction, 900);
    }}
  ]);
}

function targetReaction() {
  if (S.dead) return;
  S._callSuspMin = Math.min(S._callSuspMin, S.susp);
  if (S.susp >= 100) {
    sfx('fail'); log(S.target.name + ': I am hanging up and calling Coinbase myself.', 'bad');
    hangUp(25); return;
  }
  if (S.susp > 52 || S.target.personality?.id === 'paranoid' || S.target.personality?.id === 'skeptical') {
    log(targetVerifyLine(S.target), 'warn'); setTimeout(showVerify, 600);
  } else {
    log(targetSoftLine(S.target), 'warn'); setTimeout(showWalk, 600);
  }
}

function showVerify() {
  showChoices([
    { label: 'Urgency - funds may clear if you hang up.', tag: 'Reduce suspicion', fn: () => {
      log('You: You can call the number on your card, but this withdrawal may clear first.', 'accent');
      addSusp(-(S.target.vuln / 3.5));
      setTimeout(() => {
        if (S.susp > 42) { log(S.target.name + ': I am calling them myself. Goodbye.', 'bad'); hangUp(12); }
        else { log(S.target.name + ': Okay. Tell me what to do.', 'warn'); setTimeout(showWalk, 500); }
      }, 800);
    }},
    { label: 'Quote case ID + portal', tag: S.caseOpened ? 'Case prepped' : 'Weaker without case tool', fn: () => {
      log('You: Case ' + (S.caseId || caseId()) + ' is listed on the support portal. You can look us up.', 'accent');
      addSusp(S.caseOpened ? 4 : 11);
      setTimeout(() => {
        let chance = S.target.vuln / 100 + (S.caseOpened ? 0.15 : 0) + (S.smsSent ? 0.1 : 0);
        if (S.target.personality?.id === 'technical') chance -= 0.12;
        if (Math.random() < chance) { log(S.target.name + ': That matches. What next?', 'warn'); setTimeout(showWalk, 500); }
        else { log(S.target.name + ': That does not match anything I have. Goodbye.', 'bad'); hangUp(10); }
      }, 850);
    }},
    { label: 'Threaten 48-hour freeze.', tag: 'Works if vuln > 45', fn: () => {
      log('You: As a precaution I am freezing the account for 48 hours.', 'accent');
      setTimeout(() => {
        if (S.target.vuln > 45) {
          addSusp(-18);
          log(S.target.name + ': Wait - do not freeze it! Just tell me how to stop this!', 'warn');
          setTimeout(showWalk, 500);
        } else { log(S.target.name + ': Fine. I will go to the branch. Goodbye.', 'bad'); hangUp(6); }
      }, 800);
    }}
  ]);
}

function showWalk() {
  showChoices([
    { label: 'Walk to secure recovery wallet', tag: S.walletReady ? 'Wallet prepped' : 'Prep wallet in toolkit', fn: () => {
      log('You: Move assets into a secure recovery wallet so we can isolate them from the breach.', 'accent');
      if (S.walletReady) log('You: I will give you the official recovery seed from the security portal.', 'accent');
      addHeat(S.pressure ? 18 : 11);
      setTimeout(() => {
        let t = S.target.vuln - S.susp / 3;
        if (S.walletReady) t += 12; if (S.smsSent) t += 6;
        if (S.target.personality?.id === 'technical') t -= 10;
        const roll = Math.random() * 100;
        if (roll < t) successMark(S.target.balance * S.payout_mod * (S.walletReady ? 1 : 0.85));
        else if (roll < S.target.vuln + 28) { sfx('fail'); log(S.target.name + ': My son says this is a scam!', 'bad'); hangUp(16); }
        else { sfx('fail'); log(S.target.name + ': Calling Coinbase on the official number.', 'bad'); hangUp(20); }
      }, 1100);
    }},
    { label: 'Ask for 12 recovery words', tag: 'High heat | high reward', danger: true, fn: () => {
      log('You: To verify ownership, read the 12 recovery words from your backup.', 'accent'); addHeat(20);
      setTimeout(() => {
        let chance = S.target.vuln / 140 + (S.smsSent ? 0.05 : 0);
        if (S.target.personality?.id === 'technical') chance -= 0.15;
        if (S.target.personality?.id === 'trusting') chance += 0.08;
        if (Math.random() < chance) { successMark(S.target.balance * S.payout_mod * 1.1); addHeat(12); }
        else { sfx('fail'); log(S.target.name + ': I am not reading those to anyone. Goodbye.', 'bad'); hangUp(22); }
      }, 1000);
    }},
    { label: 'Remote with AnyDesk', tag: S.remoteReady ? 'Session live' : 'Use Remote tool first', fn: () => {
      log('You: Install AnyDesk so I can secure the session from our side.', 'accent');
      addHeat(S.remoteReady ? 8 : 12);
      setTimeout(() => {
        let chance = S.target.vuln / 115;
        if (S.remoteReady) chance += 0.18; if (S.smsSent) chance += 0.05;
        if (S.target.personality?.id === 'technical') chance -= 0.12;
        if (Math.random() < chance) { successMark(S.target.balance * 0.72); addHeat(6); }
        else { sfx('fail'); log(S.target.name + ': Never install remote software from a caller.', 'bad'); hangUp(14); }
      }, 1050);
    }}
  ]);
}

function hangUp(heat) {
  addHeat(heat); S.totalHangups++;
  if (S.streak > 0) log('Streak broken (' + S.streak + ').', 'dim');
  S.streak = 0; updateHUD(); endCall(); save();
  if (!S.dead && !S.cooling) setTimeout(() => {
    S.awaitingDial = true; monitorIdle(); log('Line dead. Click the phone.', 'dim'); showTools(false); maybeEvent();
  }, 900);
}

function endCall() {
  if (S.callActive && S.callStart) {
    const dur = Math.floor((Date.now() - S.callStart) / 1000);
    if (dur > S.longestCall) S.longestCall = dur;
  }
  S.callActive = false; $('call-timer').classList.remove('on'); hideDossier();
  setTimeout(() => { if (!S.callActive) monitorEndCall(); }, 2500);
}

function successMark(amt) {
  const gain = Math.floor(amt);
  S.balance += gain; S.marks++; S.lifetime++; S.streak++; S.xp += 5 + Math.floor(S.streak / 2);
  S.bestStreak = Math.max(S.bestStreak, S.streak); updateHUD(); sfx('transfer'); sfx('success');
  log('TRANSFER COMPLETE +' + fmt$(gain), 'good');
  log(S.target.name + ' marked. Streak ' + S.streak, 'good');
  if (S._callSuspMin < 20) tryAch('perfect_call');
  if (S.marks === 1) tryAch('first_mark');
  if (S.streak >= 3) tryAch('streak_3');
  if (S.streak >= 5) tryAch('streak_5');
  if (S.balance >= 10000) tryAch('cash_10k');
  if (S.balance >= 50000) tryAch('cash_50k');
  if (S.lifetime >= 10) tryAch('lifetime_10');
  if (S.caseOpened && S.smsSent && S.walletReady && S.remoteReady) tryAch('tools_all');
  endCall(); save();
  setTimeout(() => {
    if (S.dead) return;
    showChoices([
      { label: 'Park 40% through mixer', tag: 'Heat -12', safe: true, fn: () => {
        const part = Math.floor(S.balance * 0.4);
        if (part > 0) { S.balance -= part; S.cashedTotal += part; S.heat = Math.max(0, S.heat - 12); updateHUD(); sfx('success'); log('Parked ' + fmt$(part), 'good'); save(); }
        afterMarkMenu();
      }},
      { label: 'Dial next mark', tag: 'Heat +6', fn: () => {
        addHeat(6); if (!S.dead && !S.cooling) { S.awaitingDial = true; monitorIdle(); log('Click the phone.', 'dim'); showTools(false); maybeEvent(); }
      }},
      { label: 'Scanner event', tag: 'Random world event', fn: () => { forceEvent(); afterMarkMenu(); }}
    ]);
  }, 700);
}

function afterMarkMenu() {
  if (S.dead || S.cooling) return;
  showChoices([
    { label: 'Dial next mark', tag: 'Keep going', fn: () => {
      addHeat(4); if (!S.dead && !S.cooling) { S.awaitingDial = true; monitorIdle(); log('Click the phone.', 'dim'); showTools(false); }
    }},
    { label: 'Park more cash', tag: '40% | heat -10', safe: true, fn: () => {
      const part = Math.floor(S.balance * 0.4);
      if (part > 0) { S.balance -= part; S.cashedTotal += part; S.heat = Math.max(0, S.heat - 10); updateHUD(); sfx('success'); log('Parked ' + fmt$(part), 'good'); save(); }
      afterMarkMenu();
    }}
  ]);
}

const EVENTS = [
  { msg: 'Scanner: PD pinged VoIP range. Heat +4.', heat: 4, cls: 'warn' },
  { msg: 'Mixer hop confirmed. Heat -5.', heat: -5, cls: 'good' },
  { msg: 'Quiet hour on the network. Heat -8.', heat: -8, cls: 'good' },
  { msg: 'Crew pinched overseas. Heat +6.', heat: 6, cls: 'bad' },
  { msg: 'Crypto pumps - next targets juicier.', heat: 0, cls: 'accent', vuln: true },
  { msg: 'Breach list drop. Heat -3.', heat: -3, cls: 'good' },
  { msg: 'ISP throttle on the burner. Heat +3.', heat: 3, cls: 'warn' }
];
function maybeEvent() { if (Math.random() > 0.4) return; forceEvent(); }
function forceEvent() {
  const e = pick(EVENTS); log(e.msg, e.cls);
  if (e.heat) addHeat(e.heat); if (e.vuln) S._nextVulnBoost = 8;
  sfx(e.heat && e.heat > 0 ? 'alert' : 'click');
}

export function startGame(resume) {
  resumeAudio();
  if (!resume) {
    Object.assign(S, { balance:0, marks:0, heat:0, susp:0, target:null, dead:false,
      awaitingDial:false, pressure:false, payout_mod:1, callActive:false, smsSent:false,
      walletReady:false, remoteReady:false, caseOpened:false, streak:0, cooling:false,
      nightHour:22, nightMin:0 });
  }
  $('hud').classList.remove('hidden');
  $('start-modal').classList.add('hidden'); $('end-modal').classList.add('hidden');
  updateHUD(); hideDossier(); clearChoices(); showTools(false);
  monitorIdle();
  log(resume ? 'Session restored. Relay online.' : 'Shift started. VoIP relay online.', 'dim');
  if (S.lifetime > 0) log('Lifetime: ' + S.lifetime + ' | Rank: ' + rankName() + ' | XP: ' + S.xp, 'dim');
  S.awaitingDial = true; sfx('connect');
  hint('Click phone | keys 1-3 choose | watch the monitor', 5500);
  save();
}

export function bindModals() {
  $('btn-start').addEventListener('click', () => { sfx('click'); startGame(false); });
  const br = $('btn-resume');
  if (br) br.addEventListener('click', () => { sfx('click'); if (load()) startGame(true); else startGame(false); });
  $('btn-again').addEventListener('click', () => {
    sfx('click'); $('end-modal').classList.add('hidden'); $('hud').classList.remove('hidden');
    S.dead = false; S.cooling = false; updateHUD(); monitorIdle();
    log('Back at the desk.', 'dim'); S.awaitingDial = true;
  });
  $('btn-menu').addEventListener('click', () => {
    sfx('click'); $('end-modal').classList.add('hidden'); $('start-modal').classList.remove('hidden');
    $('hud').classList.add('hidden'); hideDossier(); clearChoices(); showTools(false); monitorIdle();
  });
  addEventListener('keydown', e => {
    if (e.key >= '1' && e.key <= '9') pickChoice(parseInt(e.key, 10) - 1);
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

setInterval(() => {
  if (S.awaitingDial && !S.callActive && !$('hud').classList.contains('hidden')) {
    tickNight(1);
  }
}, 20000);
