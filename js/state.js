export const S = {
  balance:0, marks:0, heat:0, susp:0,
  target:null, dead:false, awaitingDial:false,
  stage:null, pressure:false, payout_mod:1,
  callStart:0, callActive:false, smsSent:false,
  walletReady:false, remoteReady:false, caseOpened:false,
  seedPhrase:null, recoveryAddr:null, caseId:null,
  lifetime:0, streak:0, bestStreak:0, cashedTotal:0,
  cooling:false, _nextVulnBoost:0
};
export const FIRST = ['Harold','Margaret','Dorothy','Robert','Helen','Frank','Betty','Walter','Evelyn','George','Doris','Arthur','Mildred','Raymond','Gladys','Norman','Shirley','Kenneth','Irene','Albert'];
export const LAST = ['Johnson','Williams','Brown','Miller','Davis','Wilson','Anderson','Taylor','Thomas','Moore','Jackson','White','Harris','Martin','Thompson','Garcia','Clark','Lewis','Lee','Walker'];
export const AGES = [52,55,58,61,63,65,67,70,72,74,76];
export const CITIES = ['Phoenix, AZ','Tampa, FL','Columbus, OH','Charlotte, NC','Nashville, TN','Tucson, AZ','Fresno, CA','Atlanta, GA','Raleigh, NC','Omaha, NE'];
export const CARRIERS = ['Verizon','AT&T','T-Mobile'];
export const LAST_TX = ['Sold 0.4 BTC to bank','Bought $2,100 ETH','Transfer from Coinbase Pro','Staking reward SOL','ACH deposit $5,000'];
export const WORDS = ['abandon','ability','able','about','above','absent','absorb','abstract','absurd','abuse','access','accident','account','accuse','achieve','acid','acoustic','acquire','across','act','action','actor','actress','actual','adapt','add','addict','address','adjust','admit','adult','advance','advice','aerobic','affair','afford','afraid','again','age','agent','agree','ahead','aim','air','airport','aisle','alarm','album','alcohol','alert','alien'];

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
export function addHeat(n){ S.heat=Math.min(100,Math.max(0,S.heat+n)); if(_onHeat) _onHeat(S.heat); }
export function addSusp(n){ S.susp=Math.max(0,Math.min(100,S.susp+n)); }
