'use strict';
const $=id=>document.getElementById(id),K='ctd',KFB='ctd-ic-fb',KUSR='ctd-ic-usr';
const S0={ov:{},cu:[],inv:{},hs:[],give:{},get:{},gems:{give:0,get:0},gist:{},sg:{},mk:15,dw:35,pr:{},th:'matrix',snd:1,goal:'',view:'grid',cat:'all',fav:{},lite:0,keep1:1,adSt:'std',adCmp:1,learn:1};
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmt=n=>Math.round(n||0).toLocaleString('ru'),f2=x=>(Math.round(x*100)/100).toLocaleString('ru');
const sfmt=n=>n>=1e6?f2(n/1e6)+'M':n>=1e4?f2(n/1e3)+'K':fmt(n);
const cfmt=n=>n>=1e6?(Math.round(n/1e4)/100)+'M':n>=1e3?(Math.round(n/100)/10)+'K':Math.round(n||0);
const I=(n,c='')=>`<svg class="ic ${c}"><use href="#i-${n}"/></svg>`;
const kv=(k,v)=>`<div class="kv"><span>${k}</span><b>${v??'—'}</b></div>`;
const kvo=(k,v)=>v===undefined||v===null||v===''||v===0?'':kv(k,v);
const pos=o=>Object.keys(o).length,pcs=o=>Object.values(o).reduce((a,b)=>a+b,0);
const nrm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
const jp=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
const tick=()=>new Promise(r=>setTimeout(r,0));

/* Единая таблица соответствия имён Index / game.guide / vaultedvaluesx */
const ALIAS={
  tvspider:'spidertv',spidertv:'tvspider',
  titancinemaman:'cinemamantitan',cinemamantitan:'titancinemaman',
  upgradedbruteprototype:'largeprototypetitan',largeprototypetitan:'upgradedbruteprototype',
  upgradedvideotapperprototype:'videotapertitan',videotapertitan:'upgradedvideotapperprototype',
  glitchcameraman:'glitchplungerman',glitchplungerman:'glitchcameraman',
  prototypesduo:'prototypeduo',prototypeduo:'prototypesduo',
  pumpkinlargespeakerman:'pumkinlargespeakerman',pumkinlargespeakerman:'pumpkinlargespeakerman',
  vampirecameraman:'vampirecameraman',
  speakerwoman:'speakerwoman',
  executionertvman:'executionertvman',
  chaoscameraman:'chaoscameraman',
  headlesstvman:'headlesstvman',
  scarecrowtvman:'scarecrowtvman',
  chocolatetvman:'chocolatetvman',
  dragoncameraman:'dragoncameraman',
  upgradedtitancameraman:'upgradedtitancameraman',
  tvwoman:'tvwoman',
  cameraspider:'cameraspider',
  doublecoins:'2xmoney','2xmoney':'doublecoins',
  doublecandy:'x2candy','2xcandy':'x2candy',x2candy:'doublecandy',
  doubleluck:'2xlucky','2xlucky':'doubleluck',
  x2speed:'2xspeed','2xspeed':'x2speed',
  doubleturkeyleg:'2xturkeyleg','2xturkeyleg':'doubleturkeyleg'
};

/* Place Cost из скринов Index (включая 7 юнитов, которых нет на game.guide) */
const PLACE_COST_FALLBACK={
  alliancecake:500,bakertitanspeakerman:1000,balloonspeakerman:350,cameraspider:400,chocolatetvman:900,
  engineercameraman:200,executionertvman:1000,hackedcameraman:200,jetpackcameraman:300,
  largescientistcameraman:300,prototypeduo:2000,prototypesduo:2000,reinforcedtitancameraman:1200,
  reinforcedtitanspeakerman:1000,scientistcameraman:200,speakerspider:200,spidertv:400,tvspider:400,
  vampirecameraman:1000,
  furnacelargetvman:2000,upgradedtitancameraman:2000,upgradedtitantvman:1500,
  cameraattackhelicopter:1000,chaoscameraman:1000,glitchplungerman:500,glitchcameraman:500,
  headlesstvman:900,largelasercameraman:450,mlgcameraman:200,pharaohcameraman:200,
  pumkinlargespeakerman:1000,pumpkinlargespeakerman:1000,scarecrowtvman:500,
  cinemamantitan:2000,titancinemaman:2000,tvwoman:700,largeprototypetitan:1500,
  upgradedbruteprototype:1500,upgradedtitanspeakerman:1000,videotapertitan:600,upgradedvideotapperprototype:600,
  camerarepairdrone:200,cookercameraman:900,darkspeakerman:200,dragoncameraman:1000,
  lasercameramancar:300,mummycameraman:900,musketeerlargecameraman:300,ninjacameraman:200,
  speakerhelicopter:1000,speakerwoman:350,titancameraman:800,titanspeakerman:500,titantvman:1000,
  camerahelicopter:200,darkcamerawoman:200,largecameraman:200,largespeakerman:180,
  largetvman:400,pumpkinfarmer:100,rocketcameraman:600,villagerspeakerman:300,
  popcorncameraman:150,tvman:200,werewolfspeakerman:300,
  browncameraman:100,carspeakerman:150,clownspeakerman:200,
  cameraman:80,speakerman:100
};

let S=Object.assign({},S0,jp(K,{}));
S.gems=Object.assign({give:0,get:0},S.gems);
let D={items:[],changelog:[],updated:''},HI={items:{}},IC={size:48,items:{},alt:{}},GI={size:48,items:{},alt:{},font:null},FNT=null,FB_IC=jp(KFB,{}),USR_IC=jp(KUSR,{size:0,items:{}});
let REFS=[],FONT_REFS=null,IDEAS=[],CNTS=[];
let ALL=[],IDX=new Map(),NK=new Map(),AN=new Map(),RN=0;
let mode='give',CU='',OPT=[],lv0='',TGL='',tabNow=0,FN=null,CHD=null,SC=null,SC_SLOT=null,RET=null;
let PKF='all',PKC='',PKS='v',PKQ='',CMP_MODE=0,CMP_LIST=[],fbLoading=0,AC,fxP=[],fxRun=0;
const save=()=>{try{localStorage.setItem(K,JSON.stringify(S))}catch{}};

const parseDate=d=>{
  if(typeof d=='number')return d<1e12?d*1000:d;
  const s=String(d||'').trim();if(!s)return NaN;
  if(/^\d{4}-\d{2}-\d{2}$/.test(s))return Date.parse(s+'T00:00:00Z');
  if(/^\d{4}-\d{2}-\d{2}T/.test(s)||/\b\d{4}\b/.test(s))return Date.parse(s);
  const yr=(D.updated||'').slice(0,4)||String(new Date().getFullYear()),t=Date.parse(s+' '+yr);
  if(!isNaN(t)){const ref=Date.parse(((D.updated||'').slice(0,10)||new Date().toISOString().slice(0,10))+'T00:00:00Z');return t>ref+864e5*30?Date.parse(s+' '+(+yr-1)):t}
  return Date.parse(s);
};
const parseVal=v=>{
  if(typeof v=='number')return isFinite(v)?v:NaN;
  const s=String(v||'').replace(/,/g,'').trim().toUpperCase(),m=s.match(/^([0-9]*\.?[0-9]+)\s*([KMB]?)$/);
  return m?+m[1]*({K:1e3,M:1e6,B:1e9}[m[2]]||1):Number(s);
};

const flagsOf=i=>Array.isArray(i.flags)&&i.flags.length?i.flags:String(i.stability||'Stable').split(/\s*[|,/]\s*/).filter(Boolean);
const isSigned=u=>u&&u.category==='Signed';
const sgOn=n=>!!S.sg[n]&&!isSigned(IDX.get(n));
const val=n=>{const u=IDX.get(n);return u?u.value*(sgOn(n)?1+(S.mk??15)/100:1):0};
const pLbl=(u,n=u?.name)=>!u||!u.value?'<span class="tg">N/A</span>':fmt(val(n))+(u.valueSource==='game.guide'&&S.ov[n]==null?' <span class="m">(gg)</span>':'');
const tabOf=i=>isSigned(i)?'signed':(i.kind==='boost'||i.kind==='crate'||i.kind==='currency')?'bc':'unit';
const flagHtml=u=>flagsOf(u).map(f=>`<span class="fl f-${esc(f)}">${esc(f)}</span>`).join('');
const rbadge=i=>isSigned(i)?'SIGNED':i.kind==='boost'?'БУСТ':i.kind==='crate'?'КЕЙС':i.kind==='currency'?'ВАЛЮТА':i.tier?'TIER '+i.tier:'';
const imgTag=(i,c)=>i.img?`<img class="${c}" src="${esc(i.img)}" loading="lazy" decoding="async" onerror="this.remove()">`:'';
const placeCostOf=u=>{if(!u)return 0;const c0=u.levels?.[0]?.cost;if(c0)return Math.round(c0);const k=nrm(u.name);return PLACE_COST_FALLBACK[k]||PLACE_COST_FALLBACK[ALIAS[k]]||0};
const resolveName=nm=>{if(!nm)return '';if(IDX.has(nm))return nm;const k=nrm(nm);return NK.get(k)||NK.get(ALIAS[k])||''};
const gemsOf=(side,gemsObj=S.gems)=>Math.max(0,Math.round(Number(gemsObj?.[side])||0));

/* ================= АНАЛИЗ ЮНИТОВ И ТРЕЙДОВ ================= */
function itemTrend(u){
  const raw=(u.priceHistory||[]).map(p=>Array.isArray(p)?[p[0],p[1]]:[p.date??p.d??p.t,p.value??p.v??p.price]);
  let pts=normSeries(raw,0);
  if(pts.length<2){
    const hRaw=(HI.items[u.name]||[]).map(r=>[r[0],r[1]]);
    (D.changelog||[]).filter(c=>nrm(c.name)===nrm(u.name)).forEach(c=>{const t=parseDate(c.date);if(isFinite(t)&&c.old>0)hRaw.push([t-864e5,c.old]);if(c.new>0)hRaw.push([c.date,c.new])});
    if(D.updated&&u.official>0)hRaw.push([D.updated.slice(0,10),u.official]);
    pts=normSeries(hRaw,0);
  }
  if(pts.length<2)return{pct:0,pts:pts.length,lastV:pts[0]?.[1]||0};
  const lastT=pts[pts.length-1][0],lastV=pts[pts.length-1][1],prev=pts.slice(0,-1);
  if(Math.max(lastV,...prev.map(p=>p[1]))<15)return{pct:0,pts:pts.length,lastV};
  const target=lastT-14*864e5;let near=prev.filter(p=>p[0]<=lastT-4*864e5);if(!near.length)near=prev;
  near.sort((a,b)=>Math.abs(a[0]-target)-Math.abs(b[0]-target));
  const win=near.slice(0,Math.min(3,near.length)).map(p=>p[1]).sort((a,b)=>a-b);
  const baseV=win.length===2?(win[0]+win[1])/2:(win[win.length>>1]||pts[0][1]);
  return{pct:Math.max(-95,Math.min(400,baseV>0?(lastV-baseV)/baseV*100:0)),pts:pts.length,lastV};
}

/* Баланс «цена ↔ спрос»: 0 — только цена, 1 — полный учёт спроса, тренда и качества (ползунок во вкладке «Ещё», S.dw 0–100) */
function dwK(){const v=S.dw==null?35:+S.dw;return Math.max(0,Math.min(1,(isFinite(v)?v:35)/100))}
function analyzeItem(u){
  const fl=flagsOf(u),m=u.market||{},tr=itemTrend(u),bu=m.buyers||0,se=m.sellers||0,bs=(bu+se)>=6?(bu+1)/(se+1):null;
  const est=u.value||(isSigned(u)?0:(m.median||tr.lastV||0)),mRatio=(u.value>0&&m.median>0)?m.median/u.value:1;
  const hasDrop=fl.some(f=>/Dropping|Unwanted/.test(f)),hasRise=fl.some(f=>/Rising|Overpaid/.test(f));
  let trend='stable';
  if(tr.pct<=-15||(hasDrop&&tr.pct<=5)||(mRatio<0.72&&u.demand<=4)||(bs!==null&&bs<0.25&&u.demand<=4))trend='down';
  else if(tr.pct>=15||(hasRise&&tr.pct>=-5)||(bs!==null&&bs>=1.6&&u.demand>=6))trend='up';

  let q=18+(u.demand||0)*4.6;
  const tp={S:22,A:15,B:8,C:2,D:-6}[u.tier];
  if(tp!=null)q+=tp;else if(u.category==='Godly')q+=14;else if(u.category==='Mythic'&&u.kind==='unit')q+=7;
  if(u.kind==='boost')q+=20;else if(u.kind==='crate')q+=(u.demand>=5?6:-4);else if(/Farm|Support|Spawner/i.test(u.role||'')&&u.tier!=='D')q+=9;
  if(/AOE/i.test(u.role||'')&&u.tier!=='D')q+=3;
  if(u.rarityRank&&u.rarityRank<=10&&u.demand>=4)q+=12;else if(u.exist&&u.exist<=20000&&u.demand>=4)q+=8;else if(u.exist&&u.exist>=1000000&&!/Farm/i.test(u.role||''))q-=12;
  /* «растёт / переплачивают / покупателей больше» — это один и тот же сигнал, поэтому плюсы за него ограничены (было до +25) */
  let upM=0,dnM=0;
  if(fl.includes('Overpaid'))upM+=10;if(fl.includes('Rising'))upM+=8;if(fl.includes('Underpaid'))dnM+=12;if(fl.includes('Dropping'))dnM+=16;if(fl.includes('Unwanted'))dnM+=14;if(fl.includes('Unstable')&&tr.pct<0)dnM+=5;
  if(tr.pct>=20)upM+=8;else if(tr.pct<=-20)dnM+=14;else if(tr.pct<=-10)dnM+=7;
  if(bs!==null){if(bs>=1.5)upM+=7;else if(bs<0.25)dnM+=12;else if(bs<0.5)dnM+=5}
  q+=Math.min(upM,12)-dnM;
  if(est>0&&est<25&&u.kind==='unit'&&!/Farm/i.test(u.role||''))q-=10;
  if(isSigned(u))q=Math.max(q,45+(u.demand||0)*4);
  q=Math.max(0,Math.min(100,Math.round(q)));
  const grade=q>=70?['imba','ИМБА','q-imba']:q>=48?['good','ХОРОШ','q-good']:q>=30?['mid','СРЕДН','q-mid']:(trend==='down'&&(u.tier==='S'||u.tier==='A'||est>=400))?['drop','СПАД','q-trash']:['trash','МУСОР','q-trash'];

  let mult=1;
  if(fl.includes('Overpaid'))mult+=0.08;if(fl.includes('Rising')||tr.pct>=18)mult+=0.08;
  if(fl.includes('Dropping'))mult-=0.18;if(fl.includes('Unwanted'))mult-=0.14;if(fl.includes('Underpaid'))mult-=0.15;
  if(tr.pct<=-20)mult-=0.15;else if(tr.pct<=-10)mult-=0.07;
  if(u.demand<=2)mult-=0.16;else if(u.demand<=4)mult-=0.07;else if(u.demand>=8)mult+=0.06;
  if(bs!==null&&bs<0.25)mult-=0.12;
  return{q,grade,trend,trPct:Math.round(tr.pct),est,bs,mRatio,mult:1+(Math.max(0.45,Math.min(1.25,mult))-1)*dwK()};
}

function rebuild(){
  ALL=[...D.items,...S.cu].map(i=>({...i,official:i.value,value:S.ov[i.name]??i.value,flags:flagsOf(i)}));
  IDX=new Map(ALL.map(i=>[i.name,i]));NK=new Map(ALL.map(i=>[nrm(i.name),i.name]));
  for(const[a,b]of Object.entries(ALIAS)){if(!NK.has(a)&&NK.has(b))NK.set(a,NK.get(b))}
  RN=Math.max(0,...ALL.map(i=>i.rarityRank||0));AN=new Map(ALL.map(i=>[i.name,analyzeItem(i)]));
}
