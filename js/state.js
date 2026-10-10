export const S = {
  balance:0, marks:0, heat:0, susp:0,
  target:null, dead:false, awaitingDial:false,
  stage:null, pressure:false, payout_mod:1,
  callStart:0, callActive:false, smsSent:false,
  walletReady:false, remoteReady:false, caseOpened:false,
  seedPhrase:null, recoveryAddr:null, caseId:null,
  lifetime:0, streak:0, bestStreak:0, cashedTotal:0,
  cooling:false, _nextVulnBoost:0,
  nightHour:22, nightMin:0, xp:0, achievements:[],
  totalDialed:0, totalHangups:0, longestCall:0
};

export const FIRST = ['Harold','Margaret','Dorothy','Robert','Helen','Frank','Betty','Walter','Evelyn','George','Doris','Arthur','Mildred','Raymond','Gladys','Norman','Shirley','Kenneth','Irene','Albert','Eugene','Phyllis','Carl','Lois','Gerald'];
export const LAST = ['Johnson','Williams','Brown','Miller','Davis','Wilson','Anderson','Taylor','Thomas','Moore','Jackson','White','Harris','Martin','Thompson','Garcia','Clark','Lewis','Lee','Walker','Hall','Allen','Young','King','Wright'];
export const AGES = [52,55,58,61,63,65,67,70,72,74,76,78,81];
export const CITIES = ['Phoenix, AZ','Tampa, FL','Columbus, OH','Charlotte, NC','Nashville, TN','Tucson, AZ','Fresno, CA','Atlanta, GA','Raleigh, NC','Omaha, NE','Boise, ID','Tulsa, OK','Richmond, VA'];
export const CARRIERS = ['Verizon','AT&T','T-Mobile','Spectrum Mobile'];
export const LAST_TX = ['Sold 0.4 BTC to bank','Bought $2,100 ETH','Transfer from Coinbase Pro','Staking reward SOL','ACH deposit $5,000','Sold ETH for USD','Received from family'];
export const WORDS = ['abandon','ability','able','about','above','absent','absorb','abstract','absurd','abuse','access','accident','account','accuse','achieve','acid','acoustic','acquire','across','act','action','actor','actress','actual','adapt','add','addict','address','adjust','admit','adult','advance','advice','aerobic','affair','afford','afraid','again','age','agent','agree','ahead','aim','air','airport','aisle','alarm','album','alcohol','alert','alien'];

export const PERSONALITIES = [
  { id:'trusting', label:'Trusting', vulnMod:12, tag:'Easy open' },
  { id:'paranoid', label:'Paranoid', vulnMod:-18, tag:'Hard verify' },
  { id:'busy', label:'Busy/Rushed', vulnMod:5, tag:'Short window' },
  { id:'technical', label:'Semi-technical', vulnMod:-10, tag:'Knows wallets' },
  { id:'elderly', label:'Confused elder', vulnMod:15, tag:'Slow but soft' },
  { id:'skeptical', label:'Skeptical', vulnMod:-8, tag:'Needs proof' }
];

export const ACHIEVEMENTS = {
  first_mark: { title:'First Blood', desc:'Land your first mark' },
  streak_3: { title:'Hot Streak', desc:'3 marks in a row' },
  streak_5: { title:'Operator', desc:'5-mark streak' },
  cash_10k: { title:'Five Figures', desc:'Balance hits $10,000' },
  cash_50k: { title:'Serious Money', desc:'Balance hits $50,000' },
  heat_survive: { title:'Cool Under Fire', desc:'Survive a heat crisis' },
  perfect_call: { title:'Clean Script', desc:'Win with suspicion under 20' },
  tools_all: { title:'Full Kit', desc:'Use case, SMS, wallet and remote on one call' },
  night_owl: { title:'Night Owl', desc:'Still dialing past 3 AM' },
  lifetime_10: { title:'Career Criminal', desc:'10 lifetime marks' }
};

export const $ = id => document.getElementById(id);
export function fmt$(n){ return '$'+Math.floor(n).toLocaleString(); }
export function rand(a,b){ return a+Math.random()*(b-a); }
export function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
export function caseId(){ return 'CB-'+Math.floor(rand(100000,999999))+'-'+String.fromCharCode(65+Math.floor(Math.random()*26))+Math.floor(rand(10,99)); }
export function genSeed(){ const w=[]; for(let i=0;i<12;i++) w.push(pick(WORDS)); return w.join(' '); }
export function genAddr(){ let a='0x'; for(let i=0;i<40;i++) a+='0123456789abcdef'[Math.floor(Math.random()*16)]; return a; }
export function rankName(){
  const m=S.lifetime;
  if(m>=100) return 'Ghost'; if(m>=50) return 'Operator'; if(m>=25) return 'Call Center';
  if(m>=12) return 'Runner'; if(m>=5) return 'Tire Kicker'; return 'Rookie';
}
let _onHeat=null;
export function onHeatChange(fn){ _onHeat=fn; }
export function addHeat(n){ S.heat=Math.min(100,Math.max(0,S.heat+n)); if(_onHeat) _onHeat(S.heat); save(); }
export function addSusp(n){ S.susp=Math.max(0,Math.min(100,S.susp+n)); }

export function save() {
  try {
    localStorage.setItem('zoinbase_v2', JSON.stringify({
      balance:S.balance, marks:S.marks, heat:S.heat, lifetime:S.lifetime,
      streak:S.streak, bestStreak:S.bestStreak, cashedTotal:S.cashedTotal,
      xp:S.xp, achievements:S.achievements, totalDialed:S.totalDialed,
      totalHangups:S.totalHangups, longestCall:S.longestCall,
      nightHour:S.nightHour, nightMin:S.nightMin
    }));
  } catch(e) {}
}
export function load() {
  try {
    const raw = localStorage.getItem('zoinbase_v2');
    if (!raw) return false;
    const d = JSON.parse(raw);
    Object.assign(S, d);
    return true;
  } catch(e) { return false; }
}
export function unlock(id) {
  if (S.achievements.includes(id)) return false;
  S.achievements.push(id);
  save();
  return true;
}
