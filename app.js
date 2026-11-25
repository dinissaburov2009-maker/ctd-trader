'use strict';
const $=id=>document.getElementById(id),K='ctd',KFB='ctd-ic-fb',KUSR='ctd-ic-usr';
const S0={ov:{},cu:[],inv:{},hs:[],give:{},get:{},gems:{give:0,get:0},gist:{},sg:{},mk:15,pr:{},th:'matrix',snd:1,goal:'',view:'grid',cat:'all',fav:{},lite:0,keep1:1,adSt:'std',adCmp:1,learn:1};
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
const imgTag=(i,c)=>i.img?`<img class="${c}" src="${esc(i.img)}" loading="lazy" onerror="this.remove()">`:'';
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
  if(fl.includes('Overpaid'))q+=10;if(fl.includes('Rising'))q+=8;if(fl.includes('Underpaid'))q-=12;if(fl.includes('Dropping'))q-=16;if(fl.includes('Unwanted'))q-=14;if(fl.includes('Unstable')&&tr.pct<0)q-=5;
  if(tr.pct>=20)q+=8;else if(tr.pct<=-20)q-=14;else if(tr.pct<=-10)q-=7;
  if(bs!==null){if(bs>=1.5)q+=7;else if(bs<0.25)q-=12;else if(bs<0.5)q-=5}
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
  return{q,grade,trend,trPct:Math.round(tr.pct),est,bs,mRatio,mult:Math.max(0.45,Math.min(1.25,mult))};
}

function rebuild(){
  ALL=[...D.items,...S.cu].map(i=>({...i,official:i.value,value:S.ov[i.name]??i.value,flags:flagsOf(i)}));
  IDX=new Map(ALL.map(i=>[i.name,i]));NK=new Map(ALL.map(i=>[nrm(i.name),i.name]));
  for(const[a,b]of Object.entries(ALIAS)){if(!NK.has(a)&&NK.has(b))NK.set(a,NK.get(b))}
  RN=Math.max(0,...ALL.map(i=>i.rarityRank||0));AN=new Map(ALL.map(i=>[i.name,analyzeItem(i)]));
}

/* ================= ЭТАЛОНЫ ПОРТРЕТОВ, ШРИФТ И СКАНЕР v7.1 ================= */
function sobel(lum,sz){
  const e=new Float32Array(sz*sz);
  for(let y=1;y<sz-1;y++)for(let x=1;x<sz-1;x++){
    const i=y*sz+x;
    const gx=-lum[i-sz-1]+lum[i-sz+1]-2*lum[i-1]+2*lum[i+1]-lum[i+sz-1]+lum[i+sz+1];
    const gy=-lum[i-sz-1]-2*lum[i-sz]-lum[i-sz+1]+lum[i+sz-1]+2*lum[i+sz]+lum[i+sz+1];
    e[i]=Math.min(255,Math.hypot(gx,gy)*.5);
  }
  return e;
}
function grid8(r,g,b,mask,ed,sz){
  const r8=new Float32Array(64),g8=new Float32Array(64),b8=new Float32Array(64),c8=new Float32Array(64),e8=new Float32Array(64);
  for(let by=0;by<8;by++){
    const y0=Math.floor(by*sz/8),y1=Math.floor((by+1)*sz/8);
    for(let bx=0;bx<8;bx++){
      const x0=Math.floor(bx*sz/8),x1=Math.floor((bx+1)*sz/8),k=by*8+bx;
      let sr=0,sg=0,sb=0,se=0,mc=0,tot=0;
      for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
        const i=y*sz+x;tot++;se+=ed[i];
        if(mask[i]){sr+=r[i];sg+=g[i];sb+=b[i];mc++}
      }
      if(mc){r8[k]=sr/mc;g8[k]=sg/mc;b8[k]=sb/mc}
      c8[k]=tot?mc/tot:0;e8[k]=tot?se/tot:0;
    }
  }
  return{r8,g8,b8,c8,e8};
}
function rgbHue(r,g,b){
  const mx=r>g?(r>b?r:b):(g>b?g:b),mn=r<g?(r<b?r:b):(g<b?g:b),d=mx-mn;
  if(!d)return 0;
  let h=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4;
  h*=60;return h<0?h+360:h;
}
function colorBin(r,g,b){
  const mx=r>g?(r>b?r:b):(g>b?g:b),mn=r<g?(r<b?r:b):(g<b?g:b),sat=mx-mn,lum=r*.299+g*.587+b*.114;
  if(mx<64||(sat<34&&lum<95))return 0;
  if(sat<34)return 1;
  const h=rgbHue(r,g,b);
  if(h<20||h>=340)return 2;
  if(h<46)return 3;
  if(h<75)return 4;
  if(h<165)return 5;
  if(h<255)return 6;
  return 7;
}
function colorBins3x3(r,g,b,mask,sz){
  const hist=new Float32Array(72),cnt=new Float32Array(9);
  for(let y=0;y<sz;y++){
    const by=Math.min(2,Math.floor(y*3/sz));
    for(let x=0;x<sz;x++){
      const i=y*sz+x;if(!mask[i])continue;
      const bx=Math.min(2,Math.floor(x*3/sz)),cell=by*3+bx;
      hist[cell*8+colorBin(r[i],g[i],b[i])]++;cnt[cell]++;
    }
  }
  for(let c=0;c<9;c++){const s=cnt[c]||1;for(let b0=0;b0<8;b0++)hist[c*8+b0]/=s}
  return hist;
}
function resizeB64(b64,oldS,newS){
  try{
    const bin=atob(b64);if(bin.length!==oldS*oldS*4)return '';
    const c1=document.createElement('canvas');c1.width=oldS;c1.height=oldS;
    const x1=c1.getContext('2d'),im=x1.createImageData(oldS,oldS);
    for(let i=0;i<bin.length;i++)im.data[i]=bin.charCodeAt(i);
    x1.putImageData(im,0,0);
    const c2=document.createElement('canvas');c2.width=newS;c2.height=newS;
    const x2=c2.getContext('2d');x2.drawImage(c1,0,0,newS,newS);
    const px=x2.getImageData(0,0,newS,newS).data;let out='';
    for(let i=0;i<px.length;i++)out+=String.fromCharCode(px[i]);
    return btoa(out);
  }catch{return ''}
}
function pushRef(u,b64,src,sz){
  const n=sz*sz;let bin;try{bin=atob(b64)}catch{return}
  if(bin.length!==n*4)return;
  const r=new Uint8Array(n),g=new Uint8Array(n),b=new Uint8Array(n),a=new Uint8Array(n),lum=new Float32Array(n),mask=new Uint8Array(n);
  let opq=0;
  for(let i=0;i<n;i++){
    const k=i*4;r[i]=bin.charCodeAt(k);g[i]=bin.charCodeAt(k+1);b[i]=bin.charCodeAt(k+2);a[i]=bin.charCodeAt(k+3);
    lum[i]=r[i]*.299+g[i]*.587+b[i]*.114;if(a[i]>=48){mask[i]=1;opq++}
  }
  if(opq<Math.round(n*.02))return;
  const ed=sobel(lum,sz);for(let i=0;i<n;i++)if(a[i]<48)ed[i]=0;
  const g8=grid8(r,g,b,mask,ed,sz),h3=colorBins3x3(r,g,b,mask,sz);
  const placeCost=placeCostOf(u),costLen=placeCost?String(placeCost).length+1:0;
  REFS.push({name:u.name,src,kind:u.kind,cat:u.category,placeCost,costLen,r,g,b,a,lum,ed,opq,fill:opq/n,sz,...g8,h3});
}

function buildFontRefs(){
  FONT_REFS=null;
  const src=GI.font||FNT?.font||FNT;
  if(!src||typeof src!=='object')return;
  const out={},W=12,H=16;
  const toMask12x16=(raw)=>{
    let w=0,h=0,arr=null;
    if(Array.isArray(raw)){
      if(Array.isArray(raw[0])){h=raw.length;w=raw[0].length;arr=new Float32Array(w*h);for(let y=0;y<h;y++)for(let x=0;x<w;x++)arr[y*w+x]=raw[y][x]>1?raw[y][x]/255:raw[y][x]}
      else{const s=Math.round(Math.sqrt(raw.length));if(s*s===raw.length){w=h=s;arr=Float32Array.from(raw,v=>v>1?v/255:v)}}
    }else if(raw&&typeof raw==='object'&&raw.w&&raw.h&&raw.data){
      w=raw.w;h=raw.h;
      if(typeof raw.data==='string'){
        try{const bin=atob(raw.data);if(bin.length===w*h*4){arr=new Float32Array(w*h);for(let i=0;i<w*h;i++)arr[i]=bin.charCodeAt(i*4+3)>64?1:0}
        else if(bin.length===w*h){arr=new Float32Array(w*h);for(let i=0;i<w*h;i++)arr[i]=bin.charCodeAt(i)/255}}catch{}
      }else if(Array.isArray(raw.data)){arr=Float32Array.from(raw.data,v=>v>1?v/255:v)}
    }else if(typeof raw==='string'){
      try{const bin=atob(raw),s=Math.round(Math.sqrt(bin.length/4));if(s*s*4===bin.length){w=h=s;arr=new Float32Array(w*h);for(let i=0;i<w*h;i++)arr[i]=Math.max(bin.charCodeAt(i*4),bin.charCodeAt(i*4+3)>90?bin.charCodeAt(i*4):0)/255}}catch{}
    }
    if(!arr||!w||!h)return null;
    const dst=new Float32Array(W*H);
    for(let y=0;y<H;y++){const sy=Math.min(h-1,Math.floor(y*h/H));for(let x=0;x<W;x++){const sx=Math.min(w-1,Math.floor(x*w/W));dst[y*W+x]=arr[sy*w+sx]>0.35?1:0}}
    return dst;
  };
  for(const ch of['$','0','1','2','3','4','5','6','7','8','9']){
    if(src[ch]!=null){const m=toMask12x16(src[ch]);if(m)out[ch]=m}
  }
  if(Object.keys(out).length>=10)FONT_REFS=out;
}

function buildRefs(){
  REFS=[];const sz=IC.size||48,seen=new Set();
  if(USR_IC.size&&USR_IC.size!==sz&&USR_IC.items){
    const nextU={};let ch=0;
    for(const[nm,obj]of Object.entries(USR_IC.items)){
      const nb=resizeB64(obj.b,USR_IC.size,sz);
      if(nb){nextU[nm]={b:nb,t:obj.t||Date.now()};ch=1}
    }
    USR_IC={size:sz,items:nextU};if(ch)try{localStorage.setItem(KUSR,JSON.stringify(USR_IC))}catch{}
  }
  const giRaw=(GI.items||GI.icons||{}),giSz=GI.size||sz,giMap=new Map();
  for(const[k,b64]of Object.entries(giRaw)){
    const rn=resolveName(k);if(!rn||giMap.has(rn))continue;
    giMap.set(rn,giSz===sz?b64:resizeB64(b64,giSz,sz));
  }
  const giAltMap=new Map();
  for(const[k,b64]of Object.entries(GI.alt||{})){
    const rn=resolveName(k);if(!rn||giAltMap.has(rn))continue;
    giAltMap.set(rn,giSz===sz?b64:resizeB64(b64,giSz,sz));
  }
  const merged={...FB_IC,...(IC.items||{})},alts=IC.alt||{},usrs=USR_IC.items||{};
  for(const u of ALL.filter(x=>!isSigned(x)).sort((a,b)=>(b.value||0)-(a.value||0))){
    const nk=nrm(u.name);
    if(usrs[u.name]?.b&&!seen.has(nk+'|usr')){seen.add(nk+'|usr');pushRef(u,usrs[u.name].b,'usr',sz)}
    if(giMap.get(u.name)&&!seen.has(nk+'|game')){seen.add(nk+'|game');pushRef(u,giMap.get(u.name),'game',sz)}
    if(giAltMap.get(u.name)&&!seen.has(nk+'|galt')){seen.add(nk+'|galt');pushRef(u,giAltMap.get(u.name),'game',sz)}
    if(merged[u.name]&&!seen.has(nk+'|main')){seen.add(nk+'|main');pushRef(u,merged[u.name],'main',sz)}
    if(alts[u.name]&&!seen.has(nk+'|alt')){seen.add(nk+'|alt');pushRef(u,alts[u.name],'alt',sz)}
  }
  buildFontRefs();
}

async function hydrateMissingIcons(){
  if(fbLoading)return;
  const sz=IC.size||48,needLen=sz*sz*4,icItems=IC.items||{},giItems=GI.items||GI.icons||{};
  const validB64=b=>{if(!b)return 0;try{return atob(b).length===needLen}catch{return 0}};
  const hasGi=u=>!!(giItems[u.name]||Object.keys(giItems).some(k=>resolveName(k)===u.name));
  const missing=ALL.filter(u=>!isSigned(u)&&u.img&&!hasGi(u)&&!validB64(icItems[u.name])&&!validB64(FB_IC[u.name]));
  if(!missing.length)return;
  fbLoading=1;let added=0;
  const bake=url=>new Promise(res=>{
    const im=new Image();im.crossOrigin='anonymous';const tm=setTimeout(()=>res(null),4500);
    im.onload=()=>{clearTimeout(tm);try{
      const w=im.naturalWidth||im.width,h=im.naturalHeight||im.height;if(!w||!h)return res(null);
      const cv=document.createElement('canvas');cv.width=w;cv.height=h;const cx=cv.getContext('2d',{willReadFrequently:true});cx.drawImage(im,0,0);
      const d=cx.getImageData(0,0,w,h).data;let x0=w,y0=h,x1=0,y1=0;
      for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(d[(y*w+x)*4+3]>36){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
      if(x1<=x0||y1<=y0){x0=0;y0=0;x1=w-1;y1=h-1}
      const bw=x1-x0+1,bh=y1-y0+1,side=Math.max(bw,bh),sc=document.createElement('canvas');sc.width=sz;sc.height=sz;
      const sx=sc.getContext('2d',{willReadFrequently:true}),pad=1,ds=sz-pad*2,dw=bw/side*ds,dh=bh/side*ds;
      sx.drawImage(cv,x0,y0,bw,bh,pad+(ds-dw)/2,pad+(ds-dh)/2,dw,dh);
      const px=sx.getImageData(0,0,sz,sz).data;let bin='';for(let i=0;i<px.length;i++)bin+=String.fromCharCode(px[i]);res(btoa(bin));
    }catch{res(null)}};
    im.onerror=()=>{clearTimeout(tm);res(null)};im.src=url;
  });
  await Promise.all(missing.map(async u=>{const b64=await bake(u.img);if(b64){FB_IC[u.name]=b64;added++}}));
  fbLoading=0;
  if(added){try{localStorage.setItem(KFB,JSON.stringify(FB_IC))}catch{}buildRefs();if($('dl').open&&SC)renderScan()}
}

async function load(f){
  const oldP=new Map((D.items||[]).map(i=>[i.name,i.value]));
  try{
    const [r,h,ic,gi,fn]=await Promise.all([
      fetch('data/prices.json?t='+Date.now(),{cache:'no-store'}),
      fetch('data/history.json?t='+Date.now(),{cache:'no-store'}).catch(()=>null),
      fetch('data/icons.json?t='+Date.now(),{cache:'no-store'}).catch(()=>null),
      fetch('data/game-icons.json?t='+Date.now(),{cache:'no-store'}).catch(()=>null),
      fetch('data/font.json?t='+Date.now(),{cache:'no-store'}).catch(()=>null)
    ]);
    if(!r.ok)throw 0;D=await r.json();try{localStorage.setItem('ctd-d',JSON.stringify(D))}catch{}
    if(h&&h.ok){HI=await h.json();try{localStorage.setItem('ctd-h',JSON.stringify(HI))}catch{}}
    if(ic&&ic.ok)IC=await ic.json();
    if(gi&&gi.ok)GI=await gi.json();
    if(fn&&fn.ok)FNT=await fn.json();
  }catch{D=jp('ctd-d',{items:[],changelog:[]});HI=jp('ctd-h',{items:{}})}
  D.items||=[];HI.items||={};IC.items||={};IC.alt||={};GI.items||={};init();hydrateMissingIcons();
  if(f){
    const favChg=D.items.filter(i=>S.fav[i.name]&&oldP.has(i.name)&&oldP.get(i.name)!==i.value).map(i=>`${i.name}: ${oldP.get(i.name)}→${i.value}`);
    toast(favChg.length?'Избранное изменилось: '+favChg.join(', '):'Цены обновлены: '+D.items.length+' поз.');
  }
}

const sfx=k=>{if(!S.snd)return;try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();const[f,d,ty,v]={tap:[[900],.03,'square',.03],add:[[600,820],.06,'triangle',.05],win:[[523,659,784,1046],.1,'sawtooth',.05],err:[[220,150],.12,'sawtooth',.05]}[k]||[[600],.05,'sine',.04],t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain(),e=t+f.length*d+.05;o.type=ty;f.forEach((x,i)=>o.frequency.setValueAtTime(x,t+i*d));g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,e);o.connect(g).connect(AC.destination);o.start(t);o.stop(e+.01)}catch{}};
const fx=$('fx'),fc=fx.getContext('2d'),fit=()=>{fx.width=innerWidth;fx.height=innerHeight};fit();addEventListener('resize',fit);
const burst=(x,y,n=60)=>{if(S.lite)return;const c=window.RC||'#00ff9c';for(let i=0;i<n;i++){const a=Math.random()*6.283,s=2+Math.random()*7;fxP.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-2,l:1,c:i%3?c:'#fff'})}
  if(!fxRun){fxRun=1;(function f(){fc.clearRect(0,0,fx.width,fx.height);fxP=fxP.filter(p=>p.l>0);fxP.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.18;p.vx*=.98;p.l-=.018;fc.globalAlpha=Math.max(p.l,0);fc.fillStyle=p.c;fc.shadowColor=p.c;fc.shadowBlur=10;fc.fillRect(p.x,p.y,3,3)});if(fxP.length)requestAnimationFrame(f);else fxRun=0})()}};
const toast=m=>{const e=document.createElement('div');e.className='ts';e.textContent='> '+m;$('ts').append(e);setTimeout(()=>e.remove(),2600)};
(()=>{const cv=$('rain'),x=cv.getContext('2d'),ch='01アイウエオカキクケコ$#<>/{}';let W,H,dr;const rs=()=>{W=cv.width=innerWidth;H=cv.height=innerHeight;dr=Array.from({length:Math.ceil(W/16)},()=>Math.random()*H/16)};rs();addEventListener('resize',rs);
  setInterval(()=>{if(document.hidden||S.lite)return;x.fillStyle='rgba(4,7,11,.12)';x.fillRect(0,0,W,H);x.fillStyle=window.RC||'#00ff9c';x.font='14px monospace';dr.forEach((y,i)=>{x.fillText(ch[Math.random()*ch.length|0],i*16,y*16);dr[i]=y*16>H&&Math.random()>.975?0:y+1})},55)})();
(()=>{const b=$('boot'),L=['> CTD//TRADER v7.3','> establishing secure link ...... OK','> pulling prices & game icons ... OK','> ring+gem scanner & share ...... READY','> ACCESS GRANTED'];let k=0;b.onclick=()=>b.classList.add('x');(function tp(){if(k<L.length){b.textContent+=L[k++]+'\n';setTimeout(tp,180)}else setTimeout(()=>b.classList.add('x'),300)})()})();
const scr=e=>{if(S.lite)return;const t=e.dataset.o||(e.dataset.o=e.textContent);let i=0;clearInterval(e._t);e._t=setInterval(()=>{e.textContent=[...t].map((c,j)=>j<i||c==' '?c:'#$%&*@01'[Math.random()*8|0]).join('');if((i+=.6)>=t.length){clearInterval(e._t);e.textContent=t}},30)};
const cup=e=>{if(S.lite)return;const n=+e.textContent.replace(/\D/g,''),t0=performance.now();(function f(t){const p=Math.max(0,Math.min(1,(t-t0)/500));e.textContent=fmt(n*(1-Math.pow(1-p,3)));if(p<1)requestAnimationFrame(f)})(t0)};

const TH={matrix:'#00ff9c',cyber:'#ff2ea6',gold:'#ffc83d'};
const setTh=(t,q)=>{S.th=t;save();document.documentElement.dataset.th=t;window.RC=TH[t];document.querySelector('meta[name=theme-color]').content=t=='gold'?'#070604':'#04070b';document.querySelectorAll('.thb').forEach(b=>b.classList.toggle('on',b.dataset.t==t));if(!q)sfx('add')};
const applyLite=()=>{document.documentElement.dataset.lite=S.lite?'1':'0';$('ltb')?.classList.toggle('on',!!S.lite)};
const sndI=()=>{$('snd').innerHTML=I(S.snd?'snd':'mute')};
$('ctl').innerHTML=Object.keys(TH).map(t=>`<button class="thb" data-a="th" data-t="${t}" title="${t.toUpperCase()}" style="--c:${TH[t]}"></button>`).join('')+'<button id="ltb" class="sb" data-a="lite" title="Lite-режим (без лагов)">⚡</button><button id="snd" class="sb" data-a="snd"></button>';
const NV=[['scale','Трейд'],['grid','Каталог'],['box','Инвентарь'],['mega','Объявл.'],['gear','Ещё']];
$('nv').innerHTML=NV.map((n,i)=>`<button data-a="tab" data-i="${i}">${I(n[0])}<span>${n[1]}</span><small id="nc${i}"></small></button>`).join('');
function cnt(){
  const tot=ALL.length,live=D.updated&&D.updated!='seed',N=FN??tot,tp=pos(S.give)+pos(S.get),tq=pcs(S.give)+pcs(S.get);
  $('cn').innerHTML=`<span class="${live?'ok':'wn'}">БАЗА ${live?'LIVE':'SEED'}: ${(D.items||[]).length}</span><span>ВСЕГО: ${tot}</span><span>ФИЛЬТР: ${N}</span><span>ИНВ: ${pos(S.inv)}п/${pcs(S.inv)}шт</span><span>ТРЕЙД: ${tp}п/${tq}шт</span>`;
  $('nc0').textContent=tp+'п/'+tq+'шт';$('nc1').textContent=N+'/'+tot;$('nc2').textContent=pos(S.inv)+'п/'+pcs(S.inv)+'шт';
}
function tab(i){tabNow=i;document.querySelectorAll('.tab').forEach((e,j)=>e.classList.toggle('on',i==j));[...$('nv').children].forEach((e,j)=>e.classList.toggle('on',i==j));$('nv').style.setProperty('--i',i);if(i==2)inv();if(i==3)ad();scrollTo(0,0);document.querySelectorAll('.tab.on h3').forEach(scr)}
function init(){
  rebuild();buildRefs();fillFilters();
  const nonSg=ALL.filter(u=>!isSigned(u)&&u.img).length,uniqRef=new Set(REFS.map(r=>r.name)).size,giN=Object.keys(GI.items||GI.icons||{}).length;
  $('upd').textContent='Обновлено: '+(D.updated=='seed'?'стартовая база':D.updated?new Date(D.updated).toLocaleString('ru'):'—')+(D.sources?` · позиций: ${D.sources.values}/${D.sources.valuesTotal||'?'}`:'')+(REFS.length?` · эталонов: ${uniqRef}/${nonSg}${giN?` (игровых ${giN})`:''}`:'');
  $('gt').value=S.gist.t||'';$('gi').value=S.gist.i||'';
  const c=(D.changelog||[]).map(c=>`<span class="${c.new>c.old?'win':'lose'}">${c.new>c.old?'▲':'▼'} ${esc(c.name)} ${fmt(c.old)}→${fmt(c.new)}</span>`),
    t=[...D.items].sort((a,b)=>b.value-a.value).slice(0,8).map(i=>`<span>◆ ${esc(i.name)} ${fmt(i.value)}</span>`);
  document.querySelector('#tk div').innerHTML=[...c,...t].join(' &nbsp;&nbsp; ');
  tab(tabNow);calc();cat();cnt();
}

function lst(side){
  $(side=='give'?'gl':'rl').innerHTML=Object.entries(S[side]).map(([n,q])=>{
    const u=IDX.get(n),a=AN.get(n),qb=a?`<span class="qb ${a.grade[2]}">${a.grade[1]}</span>`:'';
    const tr=a&&Math.abs(a.trPct)>=12?`<span class="${a.trPct>0?'win':'lose'}">${a.trPct>0?'▲+':'▼'}${a.trPct}%</span>`:'';
    return `<div class="row">${u?imgTag(u,'u'):''}<span class="n" data-a="det" data-n="${esc(n)}" style="cursor:pointer">${esc(n)} ${qb}${sgOn(n)?' <b class="tag">SG</b>':''}${isSigned(u)?' <b class="tag">DEV</b>':''}<div class="m">${pLbl(u,n)} ${tr}${u?` · ${u.demand}/10`:''}</div></span><button class="sm" data-a="qty" data-s="${side}" data-n="${esc(n)}" data-d="-1">−</button><b>${q}</b><button class="sm" data-a="qty" data-s="${side}" data-n="${esc(n)}" data-d="1">+</button><button class="sm" data-a="qty" data-s="${side}" data-n="${esc(n)}" data-d="5">+5</button></div>`;
  }).join('')||'<div class="m">Пусто</div>';
  const gi=$(side=='give'?'ggm':'rgm');if(gi&&document.activeElement!==gi)gi.value=S.gems[side]||'';
}
const qty=(s,n,d)=>{S[s][n]=(S[s][n]||0)+d;if(S[s][n]<=0)delete S[s][n];save();calc()};
const sum=(s,itemsObj=S[s],gemsObj=S.gems)=>Object.entries(itemsObj).reduce((a,[n,q])=>a+val(n)*q,0)+gemsOf(s,gemsObj);

function sideStats(side,itemsObj=S[side],gemsObj=S.gems){
  const ent=Object.entries(itemsObj),gems=gemsOf(side,gemsObj);
  let pcsCount=0,rawSum=gems,estSum=gems,adjSum=gems,wSum=gems,wQ=gems*85,wDem=gems*9.5,wTr=0,downW=0,upW=0,trashW=0,imbaW=0,top=null,maxDps=0,bestRank=1e9,bestExist=1e12;
  const list=[];
  for(const[n,q]of ent){
    const u=IDX.get(n);if(!u)continue;
    const a=AN.get(n)||analyzeItem(u),unitV=val(n),effV=unitV||(a.est*(sgOn(n)?1+(S.mk??15)/100:1)),w=Math.max(10,effV)*q;
    pcsCount+=q;rawSum+=unitV*q;estSum+=effV*q;adjSum+=effV*q*a.mult;wSum+=w;wQ+=a.q*w;wDem+=(u.demand||0)*w;wTr+=a.trPct*w;
    if(a.trend==='down')downW+=w;if(a.trend==='up')upW+=w;if(a.q<32||(u.demand||0)<=3)trashW+=w;if(a.q>=68)imbaW+=w;
    if(u.maxDps&&u.maxDps>maxDps)maxDps=u.maxDps;
    if(u.rarityRank&&u.rarityRank<bestRank)bestRank=u.rarityRank;
    if(u.exist&&u.exist<bestExist)bestExist=u.exist;
    if(!top||effV>top.effV)top={n,u,a,effV,q};list.push({n,u,a,q,unitV,effV});
  }
  const hasAny=ent.length>0||gems>0,d=wSum||1;
  return{pcs:pcsCount,gems,rawSum,estSum,adjSum,top,list,maxDps,bestRank:bestRank<1e9?bestRank:0,bestExist:bestExist<1e12?bestExist:0,wQ:hasAny?Math.round(wQ/d):0,wDem:hasAny?wDem/d:0,wTr:hasAny?Math.round(wTr/d):0,downShare:downW/d,upShare:upW/d,trashShare:trashW/d,imbaShare:imbaW/d};
}

function analyzeTrade(giveObj=S.give,getObj=S.get,giveGems=S.gems.give,getGems=S.gems.get){
  const gm={give:giveGems,get:getGems},G=sideStats('give',giveObj,gm),R=sideStats('get',getObj,gm),notes=[],un=[],noEst=[];
  for(const[side,st]of[['give',G],['get',R]]){
    const L=side=='give'?'Отдаёшь':'Получаешь';
    for(const{n,u,a}of st.list){
      const fl=u.flags;
      if(!u.value){if(!un.includes(n))un.push(n);if(a.est>0)notes.push([side=='give'&&a.est>=300?'bad':'w',`${L} ${n}: без цены (N/A), но на рынке ориентир ~${fmt(a.est)}`]);else{if(!noEst.includes(n))noEst.push(n);notes.push(['w',`${L} ${n}: N/A (нет цены ни на одном сайте — укажи вручную)`])}}
      if(a.trend==='down')notes.push([side==='get'?'bad':'ok',`${L} на спаде — ${n} (${[fl.filter(f=>/Dropping|Unwanted/.test(f)).join('+'),a.trPct<=-12?`${a.trPct}%`:'',u.demand<=3?`спрос ${u.demand}/10`:''].filter(Boolean).join(', ')||'слабый рынок'})`]);
      else if(a.trend==='up')notes.push([side==='get'?'ok':'w',`${L} на росте — ${n} (${[fl.filter(f=>/Rising|Overpaid/.test(f)).join('+'),a.trPct>=12?`+${a.trPct}%`:'',u.demand>=7?`спрос ${u.demand}/10`:''].filter(Boolean).join(', ')})`]);
      if(a.bs!==null&&a.bs<0.25)notes.push([side==='get'?'bad':'ok',`${L} неликвид — ${n}: продавцов в ${Math.round(1/a.bs)}× больше (${u.market.buyers} vs ${u.market.sellers})`]);
      else if(fl.includes('Underpaid'))notes.push([side==='get'?'w':'ok',`${L} ${n}: Underpaid (сливают ниже прайса)`]);
      if(a.q>=72&&u.value>0)notes.push([side==='get'?'ok':'w',`${L} ИМБУ — ${n} (${u.tier?'Tier '+u.tier+', ':''}${u.role||u.category}, ${a.q}/100)`]);
      else if(u.tier==='S'&&a.trend==='down')notes.push(['w',`${n}: силён в бою (Tier S), но в трейде падает (${a.trPct}%) и спрос ${u.demand}/10`]);
      if(u.value>0&&u.market?.median&&Math.abs(u.market.median-u.value)/u.value>=0.25){const md=(u.market.median-u.value)/u.value*100;notes.push(['w',`${n}: рынок gg ${md>0?'выше':'ниже'} списка (${fmt(u.market.median)} vs ${fmt(u.value)}, ${md>0?'+':''}${md.toFixed(0)}%)`])}
    }
  }
  const topG=G.top?.effV||0,topR=R.top?.effV||0;
  const isDowngrade=R.pcs>=G.pcs+3||(R.pcs>=4&&G.pcs<=2&&topG>=400&&topR<topG*0.6);
  const isTrashDump=isDowngrade&&topG>=400&&(topR<topG*0.5||R.trashShare>=0.40||R.downShare>=0.45||R.wQ<=G.wQ-22);
  const isUpgrade=(G.pcs>=R.pcs+3||(G.pcs>=4&&R.pcs<=2))&&topR>=400&&(topR>=topG*1.6||R.wQ>=G.wQ+15)&&R.wQ>=48;
  if(isTrashDump)notes.unshift(['bad',`ДАУНГРЕЙД В МУСОР: отдаёшь ${G.pcs} шт (топ ${sfmt(topG)}, ${G.wQ}/100) за ${R.pcs} слабых/падающих (${R.wQ}/100). Проси +20–35% хорошими юнитами или гемами.`]);
  else if(isDowngrade)notes.unshift(['w',`Даунгрейд (${G.pcs} → ${R.pcs} шт): дробишь крупного (${sfmt(topG)}) на мелких (макс ${sfmt(topR)}).`]);
  if(isUpgrade)notes.unshift(['ok',`ВЫГОДНЫЙ АПГРЕЙД: отдаёшь ${G.pcs} мелких за сильного ${R.top.n} (${R.wQ}/100).`]);
  if(R.gems>0&&R.gems>=R.estSum*0.25)notes.push(['ok',`Партнёр докидывает ${fmt(R.gems)} 💎 — чистая ликвидность.`]);

  const adjDiff=R.adjSum-G.adjSum,adjPct=G.adjSum?adjDiff/G.adjSum*100:(R.adjSum?100:0),clamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));
  let score=clamp(adjPct,-60,60)*0.85+(R.wQ-G.wQ)*0.55+(R.wDem-G.wDem)*3.0+clamp(R.wTr-G.wTr,-80,80)*0.15;
  if(isTrashDump)score-=24;else if(isDowngrade)score-=12;if(isUpgrade)score+=14;
  if(G.imbaShare>=0.6&&R.imbaShare<0.25)score-=10;if(R.imbaShare>=0.6&&G.imbaShare<0.25)score+=10;

  let rec;
  if(noEst.length)rec=score<-12?['no','[✕] ОТКАЗАТЬСЯ / ЛОВУШКА','Есть N/A-предмет, но по остальным позициям обмен уже в минус.']:['mid','[?] ПРОВЕРЬ N/A ВРУЧНУЮ','В трейде есть предмет без цены на обоих сайтах (например, DevSigned).'];
  else if(score>=9)rec=['go','[✓] СОГЛАШАТЬСЯ',isUpgrade?'Отличный апгрейд: меняешь количество на качество и ликвидность.':adjPct>12?`Выгодно по реальной ценности (${adjPct>0?'+':''}${adjPct.toFixed(0)}%) с учётом спроса и тренда.`:'Получаешь более качественных/ликвидных юнитов.'];
  else if(score<=-10)rec=['no',isTrashDump?'[✕] ЛОВУШКА':'[✕] ОТКАЗАТЬСЯ',isTrashDump?'Ловушка: отдаёшь имбу за кучу слабого или падающего мусора.':R.downShare>=0.5?'Получаешь падающие позиции с плохим спросом.':`Реальный баланс с учётом спроса и тренда: ${adjPct.toFixed(0)}%.`];
  else rec=['mid','[?] СПОРНО / ТОРГ',isDowngrade?'Для даунгрейда переплата маловата — проси заменить мусор или докинуть.':'Пограничный обмен: попроси небольшую доплату.'];

  const ord={bad:0,w:1,ok:2},seen=new Set(),cleanNotes=notes.filter(x=>seen.has(x[1])?0:seen.add(x[1])).sort((a,b)=>ord[a[0]]-ord[b[0]]).slice(0,7);
  return{G,R,un,noEst,adjDiff,adjPct,isDowngrade,isTrashDump,rec,notes:cleanNotes};
}

function quickRepliesHtml(T,g,r){
  const gap=Math.max(50,Math.round((g-r)/50)*50||Math.round(Math.max(0,T.G.adjSum-T.R.adjSum)/50)*50||500);
  const replies=[];
  if(T.rec[0]==='go')replies.push(['deal!','deal!'],['ty!','ty!']);
  else if(T.R.downShare>=0.35)replies.push(['nty, change dropping','nty, change dropping'],[`add ${gap} value pls`,`add ${gap} value pls`]);
  else if(g>r)replies.push([`add ${gap} value pls`,`add ${gap} value pls`],['nty, low','nty, low']);
  else replies.push([`add ${gap} gems/value`,`add ${gap} value pls`],['nty, pass','nty, pass']);
  return `<div class="chips" style="margin-top:6px"><span class="m" style="align-self:center">Ответ в Roblox:</span>${replies.map(([lbl,txt])=>`<button class="sm" data-a="cpTxt" data-tx="${esc(txt)}">${esc(lbl)}</button>`).join('')}</div>`;
}

function counterOffer(need,G,R){
  CNTS=[];if(need<20)return '';
  const topNames=new Set([...G.list,...R.list].flatMap(x=>(x.u.market?.topTrades||[]).map(t=>resolveName(t.name))).filter(Boolean));
  const pool=ALL.filter(u=>!isSigned(u)&&u.value>0&&u.value<=need*1.35).map(u=>({u,a:AN.get(u.name)})).filter(x=>x.a&&x.a.q>=48&&x.a.trend!=='down')
    .sort((x,y)=>(topNames.has(y.u.name)-topNames.has(x.u.name))||(y.a.q-x.a.q));
  if(!pool.length)return '';
  const s1=pool.filter(x=>x.u.value>=need*.75).sort((a,b)=>Math.abs(a.u.value-need)-Math.abs(b.u.value-need))[0];
  if(s1)CNTS.push([s1.u.name]);
  const combo=[];let rest=need;
  for(const x of [...pool].sort((a,b)=>b.u.value-a.u.value)){
    while(rest>=x.u.value*.85&&combo.length<4){combo.push(x.u.name);rest-=x.u.value;if(rest<20)break}
    if(rest<20)break;
  }
  if(combo.length>1&&(Math.abs(rest)<need*.35))CNTS.push(combo);
  const seen=new Set();CNTS=CNTS.filter(c=>{const k=[...c].sort().join('|');return seen.has(k)?0:seen.add(k)});
  if(!CNTS.length)return '';
  const tot=c=>c.reduce((a,n)=>a+val(n),0);
  return `<div class="adv" style="border-color:var(--y)"><b>Контр-оффер: что попросить (+${fmt(need)} 💎 или юниты)</b>${CNTS.map((c,k)=>`<div class="row"><span class="n">${esc(c.join(' + '))}<div class="m">На ${fmt(tot(c))} · ликвидные/растущие</div></span><button class="sm" data-a="applyCnt" data-k="${k}">+ Получу</button></div>`).join('')}</div>`;
}

function calc(){
  lst('give');lst('get');
  const g=sum('give'),r=sum('get'),df=r-g,p=g?df/g*100:(r?100:0),R=$('res'),has=pos(S.give)||pos(S.get)||gemsOf('give')>0||gemsOf('get')>0;
  const gGrade=q=>q>=70?'<span class="qb q-imba">ИМБА</span>':q>=48?'<span class="qb q-good">ХОРОШ</span>':q>=30?'<span class="qb q-mid">СРЕДН</span>':'<span class="qb q-trash">МУСОР</span>';
  let head='',body='';
  if(!has){head='<div class="m">Добавь юнитов или гемов с обеих сторон (или отсканируй скрин трейда)</div>';lv0=''}
  else{
    const T=analyzeTrade(),{G,R:GR,un,rec,notes,adjPct,isDowngrade}=T;
    const w=un.length?['fair','N/A В ОФФЕРЕ']:p>5?['win','WIN']:p<-5?['lose','LOSE']:['fair','FAIR'];
    const rawPos=Math.max(4,Math.min(96,50+Math.max(-50,Math.min(50,p))*.92));
    const adjPos=Math.max(4,Math.min(96,50+Math.max(-50,Math.min(50,adjPct))*.92));

    head=`<div class="row"><span class="n">Отдаю: <b>${fmt(g)}</b>${G.gems?` <span class="m">(${fmt(G.gems)}💎)</span>`:''}</span><span>Получаю: <b>${fmt(r)}</b>${GR.gems?` <span class="m">(${fmt(GR.gems)}💎)</span>`:''}</span></div>`
      +(un.length?`<h2 class="${w[0]}">${w[1]}</h2><div class="m">По оценённым: ${df>0?'+':''}${fmt(df)}</div>`:`<h2 class="${w[0]}">${w[1]} ${df>0?'+':''}${fmt(df)} (${p>0?'+':''}${p.toFixed(1)}%)</h2>`);

    const sideBox=(title,st)=>`<div class="cmp-b"><b class="h">${title} (${st.pcs} шт${st.gems?` + ${sfmt(st.gems)}💎`:''})</b><div>Качество: <b>${st.wQ}/100</b> ${gGrade(st.wQ)}</div><div>Спрос: <b>${st.wDem.toFixed(1)}/10</b> · Тренд: <b class="${st.wTr>=10?'win':st.wTr<=-10?'lose':''}">${st.wTr>0?'+':''}${st.wTr}%</b></div><div class="m">Реал. вес: <b>${fmt(st.adjSum)}</b>${st.top?` · топ ${sfmt(st.top.effV)}`:''}</div></div>`;
    const hasBoth=(G.pcs>0||G.gems>0)&&(GR.pcs>0||GR.gems>0);
    const rarLine=hasBoth&&(G.bestRank||GR.bestRank||G.maxDps||GR.maxDps)?`<div class="m" style="margin:4px 0">${(G.bestRank||GR.bestRank)?`Редкость: <b>${G.bestRank?'#'+G.bestRank:'—'}</b> (${G.bestExist?sfmt(G.bestExist):'—'}) → <b>${GR.bestRank?'#'+GR.bestRank:'—'}</b> (${GR.bestExist?sfmt(GR.bestExist):'—'})`:''}${(G.maxDps||GR.maxDps)?` · Max DPS: <b>${sfmt(G.maxDps)}</b> → <b>${sfmt(GR.maxDps)}</b>`:''}</div>`:'';
    const balBar=hasBoth?`<div class="bal" title="Белая точка — номинал, голубая — реал. баланс"><i class="bal-c"></i><i class="bal-m bal-raw" style="left:${rawPos.toFixed(1)}%"></i><i class="bal-m bal-adj" style="left:${adjPos.toFixed(1)}%"></i></div><div class="m" style="display:flex;justify-content:space-between;font-size:10px"><span>LOSE</span><span>● номинал · <b style="color:var(--b)">● реал (${adjPct>0?'+':''}${adjPct.toFixed(0)}%)</b></span><span>WIN</span></div>`:'';

    const needAsk0=hasBoth&&!un.length&&((g>r*1.05)?(g-r):(isDowngrade&&rec[0]!=='go'?Math.max(0,Math.round(G.adjSum*1.15-GR.adjSum)):0)),needAsk=needAsk0||(hasBoth&&!un.length&&rec[0]!=='go'?Math.max(0,Math.round(G.adjSum*1.08-GR.adjSum)):0);
    body=(hasBoth?`<div class="rec ${rec[0]}"><div class="rt"><span>${rec[1]}</span><span class="m" style="color:inherit">баланс ${adjPct>0?'+':''}${adjPct.toFixed(0)}%</span></div><div class="rs">${esc(rec[2])}</div>${quickRepliesHtml(T,g,r)}</div>`:`<div class="note"><b class="tg">[i]</b> Добавь юнитов или гемов на вторую сторону для полной рекомендации.</div>`)
      +balBar+rarLine+`<div class="cmp">${sideBox('Отдаёшь',G)}${sideBox('Получаешь',GR)}</div>`
      +notes.map(x=>`<div class="${x[0]=='ok'?'note':x[0]=='bad'?'bad':'warn'}"><b class="${x[0]=='ok'?'win':x[0]=='bad'?'lose':'tg'}">${x[0]=='ok'?'[+]':x[0]=='bad'?'[✕]':'[!]'}</b> ${esc(x[1])}</div>`).join('')
      +(needAsk?counterOffer(needAsk,G,GR):'')+(hasBoth&&rec[0]!=='go'?ofReplHtml(GR):'')+ofBundleHtml();

    if(rec[0]==='go'&&lv0!=='go'&&hasBoth){const b=R.getBoundingClientRect();burst(b.left+b.width/2,b.top+30,40);sfx('win')}
    else if(rec[0]==='no'&&lv0!=='no'&&hasBoth)sfx('err');
    lv0=hasBoth?rec[0]:'';
  }
  R.innerHTML=head+body+'<i class="ls"></i>';R.querySelectorAll('.row b').forEach(cup);
  if(has&&df>0&&!Object.keys(S.give).concat(Object.keys(S.get)).some(n=>!IDX.get(n)?.value)&&(!g||p>5))adv(df);
  cnt();
}
function adv(gap){
  const pool=Object.entries(S.inv).map(([n,q])=>[n,q-(S.give[n]||0),val(n),AN.get(n)?.q??50]).filter(x=>x[1]>0&&x[2]>0),R=$('res');OPT=[];
  if(!pool.length)return R.insertAdjacentHTML('beforeend',`<div class="warn"><b class="tg">[?]</b> Партнёр переплачивает ${fmt(gap)} — докинуть до Fair можно ${fmt(gap)} 💎 (инвентарь юнитов пуст).</div>`);
  const s1=pool.filter(x=>x[2]>=gap*.95).sort((a,b)=>(a[2]-b[2])||(a[3]-b[3]))[0];if(s1)OPT.push([s1[0]]);
  let best=null;for(let i=0;i<pool.length;i++)for(let j=i;j<pool.length;j++){if(i==j&&pool[i][1]<2)continue;const t=pool[i][2]+pool[j][2];if(t>=gap*.95&&(!best||t<best[0]))best=[t,[pool[i][0],pool[j][0]]]}
  if(best)OPT.push(best[1]);
  let rest=gap;const gr=[];for(const x of[...pool].sort((a,b)=>(a[3]>=70?1:0)-(b[3]>=70?1:0)||(b[2]-a[2]))){let q=x[1];while(q-->0&&rest>gap*.05&&gr.length<6){gr.push(x[0]);rest-=x[2]}}
  if(rest<=gap*.05&&gr.length>2)OPT.push(gr);
  const seen=new Set();OPT=OPT.filter(o=>{const k=[...o].sort().join('|');return seen.has(k)?0:seen.add(k)});
  const tot=o=>o.reduce((a,n)=>a+val(n),0),tagO=o=>o.map(n=>{const a=AN.get(n);return esc(n)+(a?` [${a.grade[1]}]`:'')}).join(' + ');
  R.insertAdjacentHTML('beforeend',`<div class="adv"><b>Чтобы уравнять с твоей стороны (не хватает ${fmt(gap)} 💎)</b><div class="m">Чем докинуть из инвентаря:</div>${OPT.map((o,k)=>`<div class="row"><span class="n">${tagO(o)}<div class="m">${fmt(tot(o))} · переплата ${Math.max(0,Math.round((tot(o)-gap)/gap*100))}%</div></span><button class="sm" data-a="applyOpt" data-k="${k}">Добавить</button></div>`).join('')||'<div class="m">Инвентаря не хватает — докинь гемами.</div>'}</div>`);
}
function done(){
  const g=sum('give'),r=sum('get'),ge=Object.entries(S.give),re=Object.entries(S.get),gg=gemsOf('give'),rg=gemsOf('get');
  if(!ge.length&&!re.length&&!gg&&!rg)return;
  const b=$('res').getBoundingClientRect();
  S.hs.unshift({d:new Date().toISOString(),give:S.give,get:S.get,giveGems:gg,getGems:rg,profit:r-g});
  for(const[n,q]of ge){S.inv[n]=(S.inv[n]||0)-q;if(S.inv[n]<=0)delete S.inv[n]}
  for(const[n,q]of re)S.inv[n]=(S.inv[n]||0)+q;
  S.give={};S.get={};S.gems={give:0,get:0};save();calc();toast('Сделка записана');
  if(r>g*1.05||(!g&&r)){burst(b.left+b.width/2,b.top+40,90);sfx('win')}else sfx('add');
}

/* ================= ДЕТЕКТОР КРУЖКОВ, ГЕМОВ, ACCEPT И МАТЧЕР v7.1 ================= */
const ANG36=Array.from({length:36},(_,k)=>{const a=k*Math.PI/18;return[Math.cos(a),Math.sin(a),Math.sin(a)<=0.35]});
const getOffs=sz=>sz>=44?[[0,0],[-1,0],[1,0],[0,-1],[0,1],[-2,0],[2,0],[0,-2],[0,2],[-2,-2],[2,-2],[-3,0],[0,-3]]:[[0,0],[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1],[-2,0],[2,0],[0,-2],[0,2]];
const isSkyPx=(r,g,b)=>b>128&&r<142&&(b-r)>46&&(b-g)>8&&g>62;
const isIceBgPx=(r,g,b)=>b>175&&g>145&&r>105&&(b-r)>=7&&(b-r)<98&&Math.abs(b-g)<70;
/* внутренность панели оффера (темнее общей голубой подложки окна трейда, без тёмной рамки) */
const isInnerPx=(r,g,b)=>isSkyPx(r,g,b)&&g>=125&&g<=151&&b<=242;
const isNeonGreenPx=(r,g,b)=>g>180&&r<145&&b<145&&(g-r)>60&&(g-b)>50;
let _scPcv,_scPcx,_scTcv,_scTcx;

function loadCv(file){
  return new Promise((res,rej)=>{
    const fr=new FileReader();fr.onerror=()=>rej('Не удалось прочитать файл');
    fr.onload=()=>{
      const im=new Image();im.onerror=()=>rej('Неподдерживаемый формат изображения');
      im.onload=()=>{
        const maxW=1120,k=Math.min(1,maxW/Math.max(im.width,im.height));
        const cv=document.createElement('canvas');cv.width=Math.round(im.width*k);cv.height=Math.round(im.height*k);
        const ctx=cv.getContext('2d',{willReadFrequently:true});ctx.drawImage(im,0,0,cv.width,cv.height);
        res({cv,ctx,w:cv.width,h:cv.height,data:ctx.getImageData(0,0,cv.width,cv.height).data});
      };im.src=fr.result;
    };fr.readAsDataURL(file);
  });
}

function findLeftInvPanel(d,W,H){
  const col=new Int32Array(W),y0=Math.floor(H*.08),y1=Math.floor(H*.92);
  for(let x=0;x<Math.floor(W*.55);x+=2){
    let c=0;for(let y=y0;y<y1;y+=2){const i=(y*W+x)*4;if(isIceBgPx(d[i],d[i+1],d[i+2]))c+=2}
    col[x]=c;if(x+1<W)col[x+1]=c;
  }
  const minH=H*.14;let best=null,x0=-1;
  for(let x=0;x<Math.floor(W*.55);x++){
    if(col[x]>=minH){if(x0<0)x0=x}else if(x0>=0){if(x-x0>=W*.13&&(!best||x-x0>best[1]-best[0]))best=[x0,x-1];x0=-1}
  }
  if(x0>=0&&Math.floor(W*.55)-x0>=W*.13&&(!best||Math.floor(W*.55)-x0>best[1]-best[0]))best=[x0,Math.floor(W*.55)-1];
  if(!best||best[0]>W*.30||best[1]>W*.52)return null;
  let ry0=y1,ry1=y0;
  for(let y=y0;y<y1;y+=2){let hits=0;for(let x=best[0];x<=best[1];x+=4){const i=(y*W+x)*4;if(isIceBgPx(d[i],d[i+1],d[i+2]))hits++}if(hits>((best[1]-best[0])/4)*.15){if(y<ry0)ry0=y;if(y>ry1)ry1=y}}
  if(ry1-ry0<H*.26)return null;
  return{x0:best[0],y0:ry0,x1:best[1],y1:ry1,type:'ice'};
}

function findTradeBoxes(d,W,H){
  const invP=findLeftInvPanel(d,W,H);
  const startX=invP&&(W-invP.x1>=W*.36)?invP.x1+2:0;
  const col=new Int32Array(W),yMin=Math.floor(H*.14),yMax=Math.floor(H*.86);
  let peak=0;
  for(let x=startX;x<W;x+=2){
    let c=0;for(let y=yMin;y<yMax;y+=2){const i=(y*W+x)*4;if(isSkyPx(d[i],d[i+1],d[i+2]))c+=2}
    col[x]=c;if(x+1<W)col[x+1]=c;if(c>peak)peak=c;
  }
  if(peak<H*.14)return{boxes:null,invP};
  const thr=Math.max(H*.08,peak*.25),spans=[];let x0=-1;
  for(let x=startX;x<W;x++){if(col[x]>=thr){if(x0<0)x0=x}else if(x0>=0){if(x-x0>=W*.11)spans.push([x0,x-1]);x0=-1}}
  if(x0>=0&&W-x0>=W*.11)spans.push([x0,W-1]);

  if(spans.length===1&&spans[0][1]-spans[0][0]>=(W-startX)*.55){
    const[sx0,sx1]=spans[0],m0=Math.round(sx0+(sx1-sx0)*.28),m1=Math.round(sx0+(sx1-sx0)*.72);
    let minV=1e9,spX=-1;
    for(let x=m0;x<=m1;x++){const s=(col[x-2]+col[x-1]+col[x]+col[x+1]+col[x+2])/5;if(s<minV){minV=s;spX=x}}
    if(spX>0&&(minV<peak*.65||(sx1-sx0)>W*.58)){spans.splice(0,1,[sx0,spX-2],[spX+2,sx1])}
  }

  // Если обе панели стоят на общей голубой подложке, между ними нет «провала» и split не сработал.
  // Второй проход: ищем только внутренность панелей (подложка и рамки в неё не попадают).
  let pxF=isSkyPx;
  if(spans.length<2){
    const c2=new Int32Array(W);let pk2=0;
    for(let x=startX;x<W;x+=2){
      let c=0;for(let y=yMin;y<yMax;y+=2){const i=(y*W+x)*4;if(isInnerPx(d[i],d[i+1],d[i+2]))c+=2}
      c2[x]=c;if(x+1<W)c2[x+1]=c;if(c>pk2)pk2=c;
    }
    const th2=Math.max(H*.06,pk2*.3),sp2=[];let q0=-1;
    for(let x=startX;x<W;x++){if(c2[x]>=th2){if(q0<0)q0=x}else if(q0>=0){if(x-q0>=W*.09)sp2.push([q0,x-1]);q0=-1}}
    if(q0>=0&&W-q0>=W*.09)sp2.push([q0,W-1]);
    if(sp2.length>=2){spans.length=0;spans.push(...sp2);pxF=isInnerPx}
  }

  const boxes=[];
  for(const[sx0,sx1]of spans){
    let ry0=yMax,ry1=yMin;
    for(let y=Math.floor(H*.08);y<Math.floor(H*.92);y+=2){
      let hits=0;for(let x=sx0;x<=sx1;x+=4){const i=(y*W+x)*4;if(pxF(d[i],d[i+1],d[i+2]))hits++}
      if(hits>((sx1-sx0)/4)*.18){if(y<ry0)ry0=y;if(y>ry1)ry1=y}
    }
    if(ry1-ry0>=H*.18)boxes.push({x0:sx0+2,y0:Math.max(0,ry0),x1:sx1-2,y1:Math.min(H-1,ry1),type:'sky',area:(sx1-sx0)*(ry1-ry0)});
  }
  if(boxes.length<2)return{boxes:null,invP};
  let pair=boxes.sort((a,b)=>b.area-a.area).slice(0,3).sort((a,b)=>a.x0-b.x0);
  if(pair.length===3&&!invP&&pair[0].x1<W*.42)pair=pair.slice(1);
  pair=pair.sort((a,b)=>b.area-a.area).slice(0,2).sort((a,b)=>a.x0-b.x0);
  return{boxes:pair,invP};
}

function findInvBox(d,W,H){
  const col=new Int32Array(W),yMin=Math.floor(H*.07),yMax=Math.floor(H*.94);
  let peak=0;
  for(let x=0;x<W;x+=2){
    let c=0;for(let y=yMin;y<yMax;y+=2){const i=(y*W+x)*4;if(isIceBgPx(d[i],d[i+1],d[i+2]))c+=2}
    col[x]=c;if(x+1<W)col[x+1]=c;if(c>peak)peak=c;
  }
  if(peak<H*.12)return{x0:0,y0:0,x1:W-1,y1:H-1,type:'auto'};
  const thr=Math.max(H*.06,peak*.22),spans=[];let x0=-1;
  for(let x=0;x<W;x++){if(col[x]>=thr){if(x0<0)x0=x}else if(x0>=0){if(x-x0>=W*.15)spans.push([x0,x-1]);x0=-1}}
  if(x0>=0&&W-x0>=W*.15)spans.push([x0,W-1]);
  const best=spans.sort((a,b)=>(b[1]-b[0])-(a[1]-a[0]))[0];
  if(!best)return{x0:0,y0:0,x1:W-1,y1:H-1,type:'auto'};
  const[sx0,sx1]=best;let ry0=yMax,ry1=yMin;
  for(let y=yMin;y<yMax;y+=2){let hits=0;for(let x=sx0;x<=sx1;x+=4){const i=(y*W+x)*4;if(isIceBgPx(d[i],d[i+1],d[i+2]))hits++}if(hits>((sx1-sx0)/4)*.10){if(y<ry0)ry0=y;if(y>ry1)ry1=y}}
  return{x0:sx0+2,y0:Math.max(0,ry0),x1:sx1-2,y1:Math.min(H-1,ry1),type:'ice'};
}

/* Детектор ярко-зелёной рамки Accept вокруг правой панели партнёра */
function detectPartnerAccept(d,W,H,boxes,splitX){
  const checkEdge=(x0,y0,x1,y1,vert)=>{
    let tot=0,hits=0;
    const xA=Math.max(0,x0),xB=Math.min(W-1,x1),yA=Math.max(0,y0),yB=Math.min(H-1,y1);
    if(vert){
      for(let y=yA;y<=yB;y+=3){tot++;let ok=0;for(let x=xA;x<=xB;x+=2){const i=(y*W+x)*4;if(isNeonGreenPx(d[i],d[i+1],d[i+2])){ok=1;break}}if(ok)hits++}
    }else{
      for(let x=xA;x<=xB;x+=3){tot++;let ok=0;for(let y=yA;y<=yB;y+=2){const i=(y*W+x)*4;if(isNeonGreenPx(d[i],d[i+1],d[i+2])){ok=1;break}}if(ok)hits++}
    }
    return tot?hits/tot:0;
  };
  if(boxes&&boxes[1]){
    const b=boxes[1],pad=Math.max(8,Math.round((b.x1-b.x0)*.06));
    const eTop=checkEdge(b.x0,b.y0-pad,b.x1,b.y0+pad,0);
    const eBot=checkEdge(b.x0,b.y1-pad,b.x1,b.y1+pad,0);
    const eL=checkEdge(b.x0-pad,b.y0,b.x0+pad,b.y1,1);
    const eR=checkEdge(b.x1-pad,b.y0,b.x1+pad,b.y1,1);
    return (eTop+eBot+eL+eR)/4>=0.38||([eTop,eBot,eL,eR].filter(v=>v>=0.45).length>=2);
  }
  const sx=Math.max(Math.round(splitX||W*.5),Math.round(W*.45));
  let green=0,tot=0;
  for(let y=Math.round(H*.12);y<Math.round(H*.85);y+=4)for(let x=sx;x<W;x+=4){tot++;const i=(y*W+x)*4;if(isNeonGreenPx(d[i],d[i+1],d[i+2]))green++}
  return tot&&(green/tot)>0.025;
}

/* Оценка кружка: упор на верхне-боковые ~230° (без требования замкнутого низа из-за $...) + проверка фона снаружи */
function ringEval(d,W,H,cx,cy,R){
  let hits=0,topHits=0,topTotal=0,topGap=0,maxTopGap=0,cSum=0,extR=0,extG=0,extB=0,extN=0,badExt=0;
  const r1=R+Math.max(3.5,R*.12),r2=R+Math.max(6,R*.20);
  // Углы верхней-боковой дуги ~230° по часовой: от 155° (низ-лево) через 270° (верх) до 385° (низ-право)
  const topArc=[];
  for(let k=0;k<36;k++){
    const[cs,sn,isTop]=ANG36[k];
    let bestW=-999,bestL=0,bestS=255;
    for(let dr=-2.5;dr<=2.51;dr+=0.85){
      const px=Math.round(cx+cs*(R+dr)),py=Math.round(cy+sn*(R+dr));
      if(px<0||px>=W||py<0||py>=H)continue;
      const i=(py*W+px)*4,r=d[i],g=d[i+1],b=d[i+2];
      const mn=r<g?(r<b?r:b):(g<b?g:b),mx=r>g?(r>b?r:b):(g>b?g:b),sat=mx-mn,w=mn-sat*.75;
      if(w>bestW){bestW=w;bestL=r*.299+g*.587+b*.114;bestS=sat}
    }
    let wOut=999,lumOut=255,satOut=0,or1=0,og1=0,ob1=0,hasOut=0;
    for(const ro of[r1,r2]){
      const ox=Math.round(cx+cs*ro),oy=Math.round(cy+sn*ro);
      if(ox<0||ox>=W||oy<0||oy>=H)continue;
      const i=(oy*W+ox)*4,r=d[i],g=d[i+1],b=d[i+2];
      const mn=r<g?(r<b?r:b):(g<b?g:b),mx=r>g?(r>b?r:b):(g>b?g:b),sat=mx-mn,w=mn-sat*.75;
      if(w<wOut){wOut=w;lumOut=r*.299+g*.587+b*.114;satOut=sat;or1=r;og1=g;ob1=b;hasOut=1}
    }
    if(hasOut&&isTop){
      extR+=or1;extG+=og1;extB+=ob1;extN++;
      // Фильтр красного крестика X и жёлтых/оранжевых кнопок
      if((or1>175&&og1<100&&ob1<100)||(or1>185&&og1>155&&ob1<95))badExt++;
    }
    const ok=hasOut&&bestW>=118&&bestL>=166&&bestS<=80&&(bestW-wOut>=22||bestL-lumOut>=16||satOut-bestS>=20);
    if(ok){hits++;cSum+=Math.max(0,bestW-wOut)}
    if(isTop){topTotal++;if(ok)topHits++;topArc.push({k,ok})}
  }
  // Сортируем верхнюю дугу непрерывно от левого края к правому (через 270°)
  topArc.sort((a,b)=>((a.k+22)%36)-((b.k+22)%36));
  for(const p of topArc){if(p.ok)topGap=0;else{topGap++;if(topGap>maxTopGap)maxTopGap=topGap}}
  const aR=extN?extR/extN:0,aG=extN?extG/extN:0,aB=extN?extB/extN:0;
  const blueExt=extN&&(aB>aR+18&&aB>115);
  return{hits,topHits,topTotal,maxTopGap,cAvg:hits?cSum/hits:0,extR:aR,extG:aG,extB:aB,extN,badExt,blueExt};
}

function circleHasContent(d,W,H,ev,cx,cy,R){
  let sumL=0,sumL2=0,cnt=0,diff=0;
  const samp=(x,y)=>{
    const px=Math.round(x),py=Math.round(y);if(px<0||px>=W||py<0||py>=H)return;
    const i=(py*W+px)*4,r=d[i],g=d[i+1],b=d[i+2],l=r*.299+g*.587+b*.114;
    sumL+=l;sumL2+=l*l;cnt++;
    if(ev.extN&&(Math.abs(r-ev.extR)+Math.abs(g-ev.extG)+Math.abs(b-ev.extB))>28)diff++;
  };
  samp(cx,cy);
  for(const rf of[.28,.54])for(let k=0;k<12;k++){const a=k*Math.PI/6;samp(cx+Math.cos(a)*R*rf,cy+Math.sin(a)*R*rf)}
  if(cnt<10)return false;
  const mean=sumL/cnt,std=Math.sqrt(Math.max(0,sumL2/cnt-mean*mean));
  return std>=7.0&&(diff>=6||!ev.extN);
}

function detectCircles(d,W,H,box){
  const bw=box.x1-box.x0+1,bh=box.y1-box.y0+1;if(bw<36||bh<36)return[];
  const s=Math.min(1,340/Math.min(bw,bh),520/Math.max(bw,bh));
  const sw=Math.max(36,Math.round(bw*s)),sh=Math.max(36,Math.round(bh*s));
  const wh=new Float32Array(sw*sh);
  for(let y=0;y<sh;y++){
    const gy=Math.min(H-1,box.y0+Math.round(y/s));
    for(let x=0;x<sw;x++){
      const gx=Math.min(W-1,box.x0+Math.round(x/s)),i=(gy*W+gx)*4,r=d[i],g=d[i+1],b=d[i+2];
      const mn=r<g?(r<b?r:b):(g<b?g:b),mx=r>g?(r>b?r:b):(g>b?g:b);
      wh[y*sw+x]=mn-(mx-mn)*.75;
    }
  }
  const rMin=Math.max(8,Math.round(sw*.028)),rMax=Math.min(Math.round(Math.min(sw,sh)*.47),130);
  if(rMax<=rMin+2)return[];
  const acc=new Float32Array(sw*sh);
  for(let y=2;y<sh-2;y++)for(let x=2;x<sw-2;x++){
    const p=y*sw+x;if(wh[p]<132)continue;
    const gx=-wh[p-sw-1]+wh[p-sw+1]-2*wh[p-1]+2*wh[p+1]-wh[p+sw-1]+wh[p+sw+1];
    const gy=-wh[p-sw-1]-2*wh[p-sw]-wh[p-sw+1]+wh[p+sw-1]+2*wh[p+sw]+wh[p+sw+1];
    const mag=Math.hypot(gx,gy);if(mag<62)continue;
    const nx=gx/mag,ny=gy/mag;
    for(let r=rMin;r<=rMax;r++){
      const cx=Math.round(x+nx*r),cy=Math.round(y+ny*r);
      if(cx>=2&&cx<sw-2&&cy>=2&&cy<sh-2)acc[cy*sw+cx]+=1;
    }
  }
  const accS=new Float32Array(sw*sh);
  for(let y=1;y<sh-1;y++)for(let x=1;x<sw-1;x++){
    const p=y*sw+x;
    accS[p]=acc[p]*2+acc[p-1]+acc[p+1]+acc[p-sw]+acc[p+sw]+(acc[p-sw-1]+acc[p-sw+1]+acc[p+sw-1]+acc[p+sw+1])*.5;
  }
  const peaks=[],minSep=Math.max(4,rMin*.65);
  for(let y=rMin;y<sh-rMin;y++)for(let x=rMin;x<sw-rMin;x++){
    const p=y*sw+x,v=accS[p];if(v<24)continue;
    if(v>=accS[p-1]&&v>=accS[p+1]&&v>=accS[p-sw]&&v>=accS[p+sw]&&v>=accS[p-sw-1]&&v>=accS[p-sw+1]&&v>=accS[p+sw-1]&&v>=accS[p+sw+1]){
      peaks.push({x,y,v});
    }
  }
  peaks.sort((a,b)=>b.v-a.v);
  const cands=[];
  for(const pk of peaks){if(!cands.some(c=>Math.hypot(c.x-pk.x,c.y-pk.y)<minSep)){cands.push(pk);if(cands.length>=80)break}}

  const R_min_f=Math.max(11,Math.round(bw*.028)),R_max_f=Math.round(Math.min(bw,bh)*.47),step=Math.max(1,Math.round((R_max_f-R_min_f)/36));
  const valid=[];
  for(const pk of cands){
    const cx0=box.x0+pk.x/s,cy0=box.y0+pk.y/s;
    let bestR=-1,bestScore=-1;
    for(let R=R_min_f;R<=R_max_f;R+=step){
      if(cx0-R<box.x0-5||cx0+R>box.x1+5||cy0-R<box.y0-5||cy0+R>box.y1+5)continue;
      const ev=ringEval(d,W,H,cx0,cy0,R);
      const sc=ev.topHits*15+ev.hits*6-ev.maxTopGap*10+ev.cAvg*.15+(ev.blueExt?24:0)-ev.badExt*25;
      if(ev.topHits>=14&&sc>bestScore){bestScore=sc;bestR=R}
    }
    if(bestR<0)continue;
    let bx=cx0,by=cy0,br=bestR,bev=ringEval(d,W,H,bx,by,br),bsc=bev.topHits*16+bev.hits*6-bev.maxTopGap*10+bev.cAvg*.2+(bev.blueExt?26:0)-bev.badExt*25;
    for(let dx=-2;dx<=2;dx+=2)for(let dy=-2;dy<=2;dy+=2)for(let dr=-2;dr<=2;dr+=1){
      const tx=cx0+dx,ty=cy0+dy,tr=bestR+dr;
      if(tr<R_min_f||tx-tr<box.x0-4||tx+tr>box.x1+4||ty-tr<box.y0-4||ty+tr>box.y1+4)continue;
      if(tx-tr<-2||tx+tr>W+2||ty-tr<-2||ty+tr>H+2)continue;
      const ev=ringEval(d,W,H,tx,ty,tr),sc=ev.topHits*16+ev.hits*6-ev.maxTopGap*10+ev.cAvg*.2+(ev.blueExt?26:0)-ev.badExt*25;
      if(sc>bsc){bsc=sc;bx=tx;by=ty;br=tr;bev=ev}
    }
    // Проверяем верхне-боковую дугу (~230°) и синий/не-красный фон панели снаружи
    if(bev.topHits<16||bev.hits<20||bev.maxTopGap>5||bev.badExt>=4)continue;
    if(bx-br<-2||bx+br>W+2||by-br<-2||by+br>H+2)continue;
    if(!circleHasContent(d,W,H,bev,bx,by,br))continue;
    valid.push({cx:bx,cy:by,R:br,score:bsc,ev:bev});
  }
  valid.sort((a,b)=>b.score-a.score);
  const nms=[];
  // max(u.R, v.R) не даёт разрезать один крупный кружок на несколько мелких фрагментов
  for(const v of valid)if(!nms.some(u=>Math.hypot(u.cx-v.cx,u.cy-v.cy)<1.6*Math.max(u.R,v.R)))nms.push(v);

  let out=nms;
  if(nms.length>=2){
    let baseR=nms[0].R,bestSup=-1;
    for(const a of nms){
      const sup=nms.filter(b=>Math.abs(b.R-a.R)<=a.R*.20).length;
      if(sup>bestSup||(sup===bestSup&&a.R>baseR)){bestSup=sup;baseR=a.R}
    }
    if(bestSup>=2)out=nms.filter(v=>v.R>=baseR*.70&&v.R<=baseR*1.40);
  }
  out.sort((a,b)=>Math.abs(a.cy-b.cy)<a.R*.9?a.cx-b.cx:a.cy-b.cy);
  return out;
}

function splitTradeCircles(all,d,W,H,invP){
  const list=all.filter(c=>{
    if(invP&&c.cx>=invP.x0-4&&c.cx<=invP.x1+4&&c.cy>=invP.y0-4&&c.cy<=invP.y1+4)return false;
    const e=c.ev;
    if(e&&e.extN&&isIceBgPx(e.extR,e.extG,e.extB)&&c.cx<W*.52)return false;
    return true;
  });
  if(!list.length)return{give:[],get:[],splitX:W*.5};
  const xs=[...list].sort((a,b)=>a.cx-b.cx);
  let splitX=invP?invP.x1+(W-invP.x1)*.5:W*.5,maxGap=0;
  for(let i=1;i<xs.length;i++){
    const g=xs[i].cx-xs[i-1].cx;
    if(g>maxGap&&g>Math.max(W*.08,xs[i].R*2.8)){maxGap=g;splitX=(xs[i].cx+xs[i-1].cx)/2}
  }
  const ord=(a,b)=>Math.abs(a.cy-b.cy)<a.R*.9?a.cx-b.cx:a.cy-b.cy;
  return{give:list.filter(c=>c.cx<splitX).sort(ord),get:list.filter(c=>c.cx>=splitX).sort(ord),splitX};
}

function circleBgColor(d,W,H,c){
  /* v7.2: фон берём по всей дуге выше зоны цены, пропуская белую обводку и ТЁМНЫЕ пиксели
     (корпус/тень юнита). Раньше тёмный юнит на красном фоне давал «фон» почти чёрный,
     и юнит вычитался как фон. */
  const bins=new Map();
  for(let a=-215;a<=35;a+=5){
    const rad=a*Math.PI/180,ca=Math.cos(rad),sa=Math.sin(rad);
    if(sa>.38)continue;
    for(const rf of[.80,.88,.93]){
      const x=Math.round(c.cx+ca*c.R*rf),y=Math.round(c.cy+sa*c.R*rf);
      if(x<0||x>=W||y<0||y>=H)continue;
      const i=(y*W+x)*4,r=d[i],g=d[i+1],b=d[i+2];
      const mn=Math.min(r,g,b),mx=Math.max(r,g,b),lum=r*.299+g*.587+b*.114;
      if(mn>222&&(mx-mn)<24)continue;
      if(lum<55)continue;
      const key=((r>>5)<<6)|((g>>5)<<3)|(b>>5);
      let arr=bins.get(key);if(!arr)bins.set(key,arr=[]);
      arr.push([r,g,b]);
    }
  }
  let bestArr=null;
  for(const arr of bins.values())if(!bestArr||arr.length>bestArr.length)bestArr=arr;
  if(!bestArr||!bestArr.length)return[40,60,110];
  const med=k=>bestArr.map(p=>p[k]).sort((x,y)=>x-y)[bestArr.length>>1];
  return[med(0),med(1),med(2)];
}

/* Чтение белых цифр с чёрной обводкой (цена $... внизу кружка и гемы 💎 под панелью) */
function readOutlinedText(d,W,H,x0,y0,x1,y1,circleCheck=null){
  const w=Math.max(1,x1-x0+1),h=Math.max(1,y1-y0+1);
  if(w<8||h<6)return{text:'',val:0,cnt:0,span:0};
  const mask=new Uint8Array(w*h);let cnt=0,minX=w,maxX=-1;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const gx=x0+x,gy=y0+y;
    /* v7.3: цена торчит за нижний край кружка, поэтому маску кружка применяем только к верхней части области */
    if(circleCheck&&gy<circleCheck.cy+circleCheck.R*.5&&Math.hypot(gx-circleCheck.cx,gy-circleCheck.cy)>circleCheck.R*.87)continue;
    const i=(gy*W+gx)*4,r=d[i],g=d[i+1],b=d[i+2];
    const mn=r<g?(r<b?r:b):(g<b?g:b),mx=r>g?(r>b?r:b):(g>b?g:b),lum=r*.299+g*.587+b*.114;
    if(lum>194&&(mx-mn)<56){
      let darkEdge=0;
      for(const[dx,dy]of[[-2,0],[2,0],[0,-2],[0,2],[-1,-1],[1,1]]){
        const nx=gx+dx,ny=gy+dy;if(nx<0||nx>=W||ny<0||ny>=H)continue;
        const j=(ny*W+nx)*4,dl=d[j]*.299+d[j+1]*.587+d[j+2]*.114;
        /* v7.3: обводка цены бывает ТЁМНОЙ (Index) или ЗЕЛЁНОЙ (окно трейда) */
        if(dl<82||(d[j+1]-d[j]>30&&d[j+1]-d[j+2]>30&&dl<170)){darkEdge=1;break}
      }
      if(darkEdge){mask[y*w+x]=1;cnt++;if(x<minX)minX=x;if(x>maxX)maxX=x}
    }
  }
  const span=maxX>minX?maxX-minX+1:0;
  if(cnt<5||span<4)return{text:'',val:0,cnt,span};

  // Сегментация символов по столбцам
  const colSum=new Int16Array(w);
  for(let x=0;x<w;x++){let s=0;for(let y=0;y<h;y++)s+=mask[y*w+x];colSum[x]=s}
  const boxes=[];let bx0=-1;
  for(let x=0;x<w;x++){
    if(colSum[x]>0){if(bx0<0)bx0=x}
    else if(bx0>=0){if(x-bx0>=2)boxes.push([bx0,x-1]);bx0=-1}
  }
  if(bx0>=0&&w-bx0>=2)boxes.push([bx0,w-1]);

  /* v7.3: на малом масштабе соседние цифры склеиваются в один сегмент — режем широкие сегменты по минимумам столбцов */
  const segBoxes=[];
  for(const[a,b]of boxes){
    let ya=h,yb=-1;for(let y=0;y<h;y++)for(let x=a;x<=b;x++)if(mask[y*w+x]){if(y<ya)ya=y;if(y>yb)yb=y}
    const cw0=b-a+1,ch0=yb-ya+1;
    if(ch0>=6&&cw0>ch0*1.12){
      const k=Math.max(2,Math.round(cw0/(ch0*.68)));let prev=a;
      for(let q=1;q<k;q++){
        const ideal=a+Math.round(cw0*q/k),lo=Math.max(prev+2,ideal-2),hi=Math.min(b-2,ideal+2);
        let bx=ideal,bv=1e9;for(let x=lo;x<=hi;x++)if(colSum[x]<bv){bv=colSum[x];bx=x}
        segBoxes.push([prev,bx-1]);prev=bx;
      }
      segBoxes.push([prev,b]);
    }else segBoxes.push([a,b]);
  }
  let txt='';const segs=[];
  if(FONT_REFS&&segBoxes.length>=1&&segBoxes.length<=8){
    const TW=12,TH=16;
    for(const[cx0,cx1]of segBoxes){
      let cy0=h,cy1=-1;
      for(let y=0;y<h;y++)for(let x=cx0;x<=cx1;x++)if(mask[y*w+x]){if(y<cy0)cy0=y;if(y>cy1)cy1=y}
      if(cy1-cy0<3)continue;
      const cw=cx1-cx0+1,ch=cy1-cy0+1;
      if(ch<h*.25||cw>ch*1.6)continue;
      let bestCh='',bestSc=-1;const segC=[];
      for(const[k,tmpl]of Object.entries(FONT_REFS)){
        let inter=0,uni=0;
        for(let y=0;y<TH;y++){
          const sy=cy0+Math.min(ch-1,Math.floor(y*ch/TH));
          for(let x=0;x<TW;x++){
            const sx=cx0+Math.min(cw-1,Math.floor(x*cw/TW));
            const a=mask[sy*w+sx]?1:0,b=tmpl[y*TW+x]>0.5?1:0;
            if(a&&b)inter++;
            if(a||b)uni++;
          }
        }
        const iou=uni?inter/uni:0;
        segC.push([k,iou]);
        if(iou>bestSc){bestSc=iou;bestCh=k}
      }
      segC.sort((a,b)=>b[1]-a[1]);segs.push(segC.slice(0,3));
      if(bestSc>=0.36)txt+=bestCh;
    }
  }
  const numM=txt.replace(/[^0-9]/g,'');
  return{text:txt,val:numM?parseInt(numM,10):0,cnt,span,segs};
}

/* v7.3: допустимые цены установки (из таблицы и из данных юнитов) — по ним проверяем и исправляем прочитанную цену */
function knownCosts(){
  const st=new Set(Object.values(PLACE_COST_FALLBACK).map(Number).filter(Boolean));
  try{for(const u of ALL){const c=u?.levels?.[0]?.cost;if(c)st.add(Math.round(c))}}catch{}
  return st;
}
function decodeCost(segs,known){
  if(!segs||!segs.length||segs.length>7)return null;
  let best=null;
  const rec=(i,str,sc)=>{
    if(i===segs.length){
      const t=str.replace(/^\$/,'');
      if(/^\d{2,4}$/.test(t)&&known.has(+t)){const a=sc/segs.length;if(!best||a>best.score)best={cost:+t,score:a}}
      return;
    }
    for(const[ch,v]of segs[i])rec(i+1,str+ch,sc+v);
  };
  rec(0,'',0);
  return best&&best.score>=.62?best:null;
}

function readTradeGems(d,W,H,boxes){
  if(!boxes)return[0,0];
  return boxes.map(b=>{
    const bw=b.x1-b.x0+1,bh=b.y1-b.y0+1;
    const y0=Math.min(H-1,b.y1+2),y1=Math.min(H-1,b.y1+Math.max(18,Math.round(bh*.28)));
    const x0=Math.max(0,b.x0+Math.round(bw*.15)),x1=Math.min(W-1,b.x1-Math.round(bw*.05));
    if(y1<=y0+4||x1<=x0+10)return 0;
    const r=readOutlinedText(d,W,H,x0,y0,x1,y1,null);
    return (r.val>0&&r.val<=5000000)?r.val:0;
  });
}

/* Точная классификация цвета редкости по ТЗ:
   Exclusive: светло-сиреневый/лавандовый, Godly: тёмный сиренево-синий градиент (НЕ красный!),
   Mythic: ярко-красный, Legendary: жёлтый, Epic: насыщенно-фиолетовый, Rare: голубой, Uncommon: зелёный, Common: серый */
function analyzeSlotMeta(d,W,H,c,bR,bG,bB){
  /* v7.3: цена торчит за нижний край кружка — область чтения шире и ниже */
  const y0=Math.max(2,Math.round(c.cy+c.R*.36)),y1=Math.min(H-3,Math.round(c.cy+c.R*1.3));
  const x0=Math.max(2,Math.round(c.cx-c.R*1.05)),x1=Math.min(W-3,Math.round(c.cx+c.R*1.05));
  const ocr=readOutlinedText(d,W,H,x0,y0,x1,y1,c);
  const hasPrice=ocr.cnt>=Math.max(5,Math.round(c.R*.10));
  const priceSpan=hasPrice&&ocr.span?(ocr.span/(2*c.R)):0;
  let parsedCost=ocr.val,costFuzzy=false;
  const known=knownCosts();
  if(!(parsedCost&&known.has(parsedCost))){
    /* прочитано мусором или не из таблицы цен: пробуем исправить по вариантам символов, иначе не доверяем */
    const dc=decodeCost(ocr.segs,known);
    if(dc){parsedCost=dc.cost;costFuzzy=true}else parsedCost=0;
  }

  let bgCat='';
  const mx=Math.max(bR,bG,bB),mn=Math.min(bR,bG,bB),sat=mx-mn,lum=bR*.299+bG*.587+bB*.114;
  if(sat<26&&lum>80&&lum<200)bgCat='Common';
  else if(sat>=36){
    const h=rgbHue(bR,bG,bB);
    if(h>=338||h<20)bgCat='Mythic';
    else if(h>=36&&h<68)bgCat='Legendary';
    else if(h>=80&&h<162)bgCat='Uncommon';
    else if(h>=180&&h<222)bgCat='Rare';
    else if(h>=222&&h<315){
      if(lum>=148&&bB>=bR-8&&bR>bG+8)bgCat='Exclusive';
      else if(h<270&&bB>bR&&lum<148)bgCat='Godly';
      else bgCat='Epic';
    }
  }
  return{hasPrice,priceSpan,parsedCost,costFuzzy,bgCat};
}

function buildPatch(srcCv,rx,ry,rSide,c,bR,bG,bB,sz,noBgSub=0){
  if(!_scTcv){_scTcv=document.createElement('canvas');_scTcx=_scTcv.getContext('2d',{willReadFrequently:true})}
  if(_scTcv.width!==sz){_scTcv.width=sz;_scTcv.height=sz}
  _scTcx.clearRect(0,0,sz,sz);
  _scTcx.drawImage(srcCv,rx,ry,rSide,rSide,0,0,sz,sz);
  const px=_scTcx.getImageData(0,0,sz,sz).data,n=sz*sz,bLum=bR*.299+bG*.587+bB*.114;
  const cr=new Uint8Array(n),cg=new Uint8Array(n),cb=new Uint8Array(n),lum=new Float32Array(n),fg=new Uint8Array(n),tMask=new Uint8Array(n),wt=new Float32Array(n);
  for(let y=0;y<sz;y++)for(let x=0;x<sz;x++){
    const i=y*sz+x,k=i*4,r=px[k],g=px[k+1],b=px[k+2],l=r*.299+g*.587+b*.114;
    cr[i]=r;cg[i]=g;cb[i]=b;lum[i]=l;
    const gx=rx+(x+.5)/sz*rSide,gy=ry+(y+.5)/sz*rSide,dist=Math.hypot(gx-c.cx,gy-c.cy);
    if(dist>c.R*.90){wt[i]=0;tMask[i]=1;continue}
    const mn=r<g?(r<b?r:b):(g<b?g:b),mx=r>g?(r>b?r:b):(g>b?g:b),sat=mx-mn,yRel=(gy-c.cy)/c.R;
    if(yRel>=.38&&!noBgSub){
      const isTxt=(l>180&&sat<56)||(l<48&&yRel>=.44);
      if(isTxt){tMask[i]=1;wt[i]=.02;continue}
      wt[i]=yRel>=.54?.12:.34;
    }else wt[i]=1;
    if(noBgSub){fg[i]=1;continue}
    const dRGB=Math.hypot((r-bR)*.85,(g-bG)*1.15,(b-bB)*.85);
    const dHue=Math.abs((r-g)-(bR-bG))+Math.abs((g-b)-(bG-bB));
    if(dRGB>34||Math.abs(l-bLum)>26||dHue>30)fg[i]=1;
  }
  const fgC=new Uint8Array(fg);
  if(!noBgSub){
    for(let y=1;y<sz-1;y++)for(let x=1;x<sz-1;x++){
      const i=y*sz+x;if(!fg[i])continue;
      const nb=fg[i-1]+fg[i+1]+fg[i-sz]+fg[i+sz];
      if(nb<2)fgC[i]=0;
    }
  }
  const ed=sobel(lum,sz);
  for(let y=0;y<sz;y++)for(let x=0;x<sz;x++){
    const i=y*sz+x,gx=rx+(x+.5)/sz*rSide,gy=ry+(y+.5)/sz*rSide;
    if((!noBgSub&&tMask[i])||Math.hypot(gx-c.cx,gy-c.cy)>c.R*.83)ed[i]=0;
  }
  return{cr,cg,cb,lum,fg:fgC,wt,ed,g8:grid8(cr,cg,cb,fgC,ed,sz),h3:colorBins3x3(cr,cg,cb,fgC,sz)};
}

function patchToB64(P,sz){
  const n=sz*sz;let bin='';
  for(let i=0;i<n;i++){
    const op=P.fg[i]&&P.wt[i]>.22?255:0;
    bin+=String.fromCharCode(P.cr[i],P.cg[i],P.cb[i],op);
  }
  return btoa(bin);
}

function matchCircle(srcCv,d,W,H,c){
  const sz=IC.size||48;
  if(!_scPcv){_scPcv=document.createElement('canvas');_scPcx=_scPcv.getContext('2d',{willReadFrequently:true});_scPcv.width=48;_scPcv.height=48}
  _scPcx.clearRect(0,0,48,48);
  _scPcx.drawImage(srcCv,c.cx-c.R,c.cy-c.R,c.R*2,c.R*2,0,0,48,48);
  const crop=_scPcv.toDataURL('image/jpeg',.85);
  if(!REFS.length)return{crop,cands:[],name:'',lowConf:true,learnB64:''};

  const[bR,bG,bB]=circleBgColor(d,W,H,c);
  const meta=analyzeSlotMeta(d,W,H,c,bR,bG,bB);
  const baseSide=c.R*1.84,baseX=c.cx-c.R*.92,baseY=c.cy-c.R*.92;
  const baseP=buildPatch(srcCv,baseX,baseY,baseSide,c,bR,bG,bB,sz,0);

  // 5 кропов без искажённого растягивания половины тела по пояс
  let fx0=sz,fy0=sz,fx1=-1,fy1=-1;
  for(let y=1;y<sz-1;y++)for(let x=1;x<sz-1;x++){
    const i=y*sz+x;if(baseP.fg[i]&&baseP.wt[i]>.3){if(x<fx0)fx0=x;if(x>fx1)fx1=x;if(y<fy0)fy0=y;if(y>fy1)fy1=y}
  }
  const boxes=[];
  if(fx1-fx0>=sz*.24&&fy1-fy0>=sz*.24){
    const pad=Math.max(1,Math.round(Math.max(fx1-fx0+1,fy1-fy0+1)*.04));
    const bx0=Math.max(0,fx0-pad),by0=Math.max(0,fy0-pad),bx1=Math.min(sz-1,fx1+pad),by1=Math.min(sz-1,fy1+pad);
    const bw=bx1-bx0+1,bh=by1-by0+1,side=Math.max(bw,bh),cxP=(bx0+bx1+1)/2,cyP=(by0+by1+1)/2;
    boxes.push([baseX+(cxP-side/2)/sz*baseSide,baseY+(cyP-side/2)/sz*baseSide,side/sz*baseSide]);
  }
  for(const[sc,dy]of[[.88,0],[.78,-.05],[.66,-.07],[.94,0]])boxes.push([c.cx-c.R*sc,c.cy+c.R*(dy-sc),c.R*sc*2]);

  const patches=boxes.map(([rx,ry,rSide])=>buildPatch(srcCv,rx,ry,rSide,c,bR,bG,bB,sz,0));
  const fullP=buildPatch(srcCv,c.cx-c.R*.90,c.cy-c.R*.90,c.R*1.80,c,bR,bG,bB,sz,1);
  const learnB64=patchToB64(patches[0],sz);

  const coarseMap=new Map();
  for(let ri=0;ri<REFS.length;ri++){
    const ref=REFS[ri],isFull=ref.fill>.85,pList=isFull?[fullP,patches[0]]:patches;
    let best=1e9;
    for(const P of pList){
      const pg=P.g8;
      let hDiff=0;for(let k=0;k<48;k++)hDiff+=Math.abs(P.h3[k]-ref.h3[k]);
      const hErr=(hDiff/6)*15;
      for(const[dx,dy]of[[0,0],[-1,0],[1,0],[0,-1]]){
        let cSum=0,hSum=0,sSum=0,wSum=0;
        for(let y=0;y<6;y++)for(let x=0;x<8;x++){
          const rx=x+dx,ry=y+dy;if(rx<0||rx>=8||ry<0||ry>=8)continue;
          const pk=y*8+x,rk=ry*8+rx,rc=ref.c8[rk],pc=pg.c8[pk];
          if(rc>.15&&pc>.15){
            const w=rc*pc;
            cSum+=w*(Math.abs(pg.r8[pk]-ref.r8[rk])+Math.abs(pg.g8[pk]-ref.g8[rk])+Math.abs(pg.b8[pk]-ref.b8[rk]))/3;
            hSum+=w*(Math.abs((pg.r8[pk]-pg.g8[pk])-(ref.r8[rk]-ref.g8[rk]))+Math.abs((pg.g8[pk]-pg.b8[pk])-(ref.g8[rk]-ref.b8[rk])))/2;
            wSum+=w;
          }
          if(!isFull)sSum+=Math.abs(pc-rc);
        }
        if(wSum<.3)continue;
        const sc=(cSum/wSum)+(hSum/wSum)*.8+(sSum/48)*30+hErr*.6;
        if(sc<best)best=sc;
      }
    }
    const prev=coarseMap.get(ref.name);
    if(prev==null||best<prev)coarseMap.set(ref.name,best);
  }
  const topNames=new Set([...coarseMap.entries()].sort((a,b)=>a[1]-b[1]).slice(0,26).map(x=>x[0]));

  const offs=getOffs(sz),headCut=Math.round(sz*.55),bestByName=new Map();
  for(const ref of REFS){
    if(!topNames.has(ref.name))continue;
    const isFull=ref.fill>.85,pList=isFull?[fullP,patches[0]]:patches;
    let best=1e9;
    for(const P of pList){
      let hDiff=0;for(let k=0;k<48;k++)hDiff+=Math.abs(P.h3[k]-ref.h3[k]);
      const histErr=(hDiff/6)*14;
      for(const[ox,oy]of offs){
        let mLC=0,mLR=0,mN=0;
        for(let y=1;y<sz-1;y++)for(let x=1;x<sz-1;x++){
          const i=y*sz+x;if(P.wt[i]<.3)continue;
          const rx=x+ox,ry=y+oy;if(rx<0||rx>=sz||ry<0||ry>=sz)continue;
          const j=ry*sz+rx;if(ref.a[j]<60)continue;
          mLC+=P.lum[i];mLR+=ref.lum[j];mN++;
        }
        if(mN<16)continue;
        mLC/=mN;mLR/=mN;
        const dL=Math.max(-20,Math.min(20,mLC-mLR));

        let cErr=0,chErr=0,wSum=0,eErr=0,eW=0,sInter=0,sUnion=0,cN=0,cov=0,vC=0,vR=0;
        for(let y=1;y<sz-1;y++){
          const hw=y<headCut?1.6:1.0;
          for(let x=1;x<sz-1;x++){
            const i=y*sz+x,w=P.wt[i];if(!w)continue;
            const rx=x+ox,ry=y+oy;if(rx<0||rx>=sz||ry<0||ry>=sz)continue;
            const j=ry*sz+rx,al=ref.a[j];
            if(al>=60){
              const aw=w*hw*(al>=160?1:.38),rr=ref.r[j],rg=ref.g[j],rb=ref.b[j];
              cErr+=aw*(Math.abs(P.cr[i]-(rr+dL))+Math.abs(P.cg[i]-(rg+dL))+Math.abs(P.cb[i]-(rb+dL)))/3;
              chErr+=aw*(Math.abs((P.cr[i]-P.cg[i])-(rr-rg))+Math.abs((P.cg[i]-P.cb[i])-(rg-rb)))/2;
              wSum+=aw;
              if(w>=.3){
                const dc=P.lum[i]-mLC,dr=ref.lum[j]-mLR;
                cov+=dc*dr;vC+=dc*dc;vR+=dr*dr;cN++;
              }
            }
            if(w>.5&&al>=48){eErr+=Math.abs(P.ed[i]-ref.ed[j]);eW++}
            if(w>.5&&!isFull){
              const inRef=al>=64,inFg=P.fg[i]===1;
              if(inRef&&inFg)sInter++;
              if(inRef||inFg)sUnion++;
            }
          }
        }
        if(wSum<10||cN<14)continue;
        const zncc=(vC>4&&vR>4)?cov/Math.sqrt(vC*vR):0;
        const eZncc=(1-Math.max(-1,Math.min(1,zncc)))*28;
        const sErr=isFull?0:(1-sInter/(sUnion||1))*34;
        let sc=(cErr/wSum)*.80+(chErr/wSum)*.75+eZncc*.85+sErr*.80+(eW?eErr/eW:0)*.42+histErr*.75;
        if(meta.hasPrice&&ref.kind!=='unit')sc+=9;
        else if(!meta.hasPrice&&ref.kind!=='unit')sc-=7;
        if(meta.hasPrice&&meta.parsedCost&&ref.placeCost){
          if(meta.parsedCost===ref.placeCost)sc-=(meta.costFuzzy?7:11);
          else if(String(meta.parsedCost).length===String(ref.placeCost).length)sc+=4;
          else sc+=8;
        }else if(meta.hasPrice&&ref.costLen){
          if(meta.priceSpan>=.58&&ref.costLen<=3)sc+=4;
          else if(meta.priceSpan>=.58&&ref.costLen>=5)sc-=4;
          else if(meta.priceSpan>0&&meta.priceSpan<=.44&&ref.costLen>=5)sc+=4;
        }
        if(meta.bgCat&&ref.cat===meta.bgCat)sc-=3.5;
        if(ref.src==='usr')sc-=5;
        else if(ref.src==='game')sc-=3;
        if(sc<best)best=sc;
      }
    }
    const prev=bestByName.get(ref.name);
    if(prev==null||best<prev)bestByName.set(ref.name,best);
  }
  const scored=[...bestByName.entries()].map(([name,score])=>({name,score})).sort((a,b)=>a.score-b.score);
  /* v7.3: уверенность по ОТРЫВУ от второго кандидата, а не только по абсолютному баллу.
     «?» ставим, если: нет ответа; отрыв <2.5 (почти ничья); балл плохой (>62) и отрыв небольшой (<14); балл очень плохой (>105) */
  const _gap=scored[1]&&scored[0]?scored[1].score-scored[0].score:99;
  const lowConf=!scored[0]||_gap<2.5||(scored[0].score>62&&_gap<14)||scored[0].score>105;
  return{crop,cands:scored.slice(0,4).map(x=>x.name),name:scored[0]?.name||'',lowConf,learnB64,cx:c.cx,cy:c.cy,R:c.R,parsedCost:meta.parsedCost};
}

function scDrawAnn(shotIdx=0){
  if(!SC)return;
  if(SC.kind==='trade'){
    if(!SC.imgData)return;
    const{cv,w,h}=SC.imgData,ann=document.createElement('canvas');ann.width=w;ann.height=h;
    const ax=ann.getContext('2d');ax.drawImage(cv,0,0);
    const drawCircles=(list,col)=>{
      const lw=Math.max(2,w/380),fs=Math.max(12,Math.round(w/65));
      ax.lineWidth=lw;ax.font=`bold ${fs}px monospace`;
      list.forEach((r,idx)=>{
        if(!r.R)return;
        ax.strokeStyle=col;ax.beginPath();ax.arc(r.cx,r.cy,r.R,0,Math.PI*2);ax.stroke();
        const tx=Math.max(4,r.cx-r.R),ty=Math.max(fs+4,r.cy-r.R+fs);
        ax.fillStyle='#020a08d8';ax.fillRect(tx-2,ty-fs,fs*1.5,fs+3);
        ax.fillStyle=col;ax.fillText('#'+(idx+1),tx,ty-2);
      });
    };
    if(SC.boxes){
      ax.lineWidth=2;ax.strokeStyle='#00ff9c';ax.strokeRect(SC.boxes[0].x0,SC.boxes[0].y0,SC.boxes[0].x1-SC.boxes[0].x0,SC.boxes[0].y1-SC.boxes[0].y0);
      ax.strokeStyle=SC.partnerAccept?'#00ff9c':'#00e5ff';if(SC.partnerAccept)ax.lineWidth=4;
      ax.strokeRect(SC.boxes[1].x0,SC.boxes[1].y0,SC.boxes[1].x1-SC.boxes[1].x0,SC.boxes[1].y1-SC.boxes[1].y0);
      ax.lineWidth=2;
    }
    if(SC.invP){ax.setLineDash([6,4]);ax.strokeStyle='#ffd00099';ax.strokeRect(SC.invP.x0,SC.invP.y0,SC.invP.x1-SC.invP.x0,SC.invP.y1-SC.invP.y0);ax.setLineDash([])}
    drawCircles(SC.give,'#00ff9c');drawCircles(SC.get,'#00e5ff');
    SC.annUrl=ann.toDataURL('image/jpeg',.86);
  }else{
    const sh=SC.shots?.[shotIdx];if(!sh?.imgData)return;
    const{cv,w,h}=sh.imgData,ann=document.createElement('canvas');ann.width=w;ann.height=h;
    const ax=ann.getContext('2d');ax.drawImage(cv,0,0);
    if(sh.box){ax.lineWidth=2;ax.strokeStyle='#00ff9c';ax.strokeRect(sh.box.x0,sh.box.y0,sh.box.x1-sh.box.x0,sh.box.y1-sh.box.y0)}
    const lw=Math.max(2,w/380),fs=Math.max(12,Math.round(w/65));
    ax.lineWidth=lw;ax.font=`bold ${fs}px monospace`;ax.strokeStyle='#00ff9c';
    SC.items.forEach((r,idx)=>{
      if(r.shotIdx!==shotIdx||!r.R)return;
      ax.beginPath();ax.arc(r.cx,r.cy,r.R,0,Math.PI*2);ax.stroke();
      const tx=Math.max(4,r.cx-r.R),ty=Math.max(fs+4,r.cy-r.R+fs);
      ax.fillStyle='#020a08d8';ax.fillRect(tx-2,ty-fs,fs*1.5,fs+3);
      ax.fillStyle='#00ff9c';ax.fillText('#'+(idx+1),tx,ty-2);
    });
    sh.annUrl=ann.toDataURL('image/jpeg',.86);
    if(shotIdx===SC.shotIdx)SC.annUrl=sh.annUrl;
  }
}

function scanOpen(kind){SC={kind,annUrl:'',give:[],get:[],items:[],shots:[],shotIdx:0,giveGems:0,getGems:0,partnerAccept:false,err:'',info:'',prog:'',imgData:null,boxes:null,invP:null,splitX:0,hlSide:'',hlIdx:-1};SC_SLOT=null;renderScan();openDl(0,1)}

async function scPickFiles(fileList,autoDetect=false){
  const files=[...(fileList||[])].filter(Boolean);
  if(!files.length||!SC)return;
  if(!REFS.length){SC.err='Не загружены эталоны портретов (data/game-icons.json или icons.json).';return renderScan()}
  try{
    SC.err='';SC.hlSide='';SC.hlIdx=-1;
    if(SC.kind==='trade'){
      const img=await loadCv(files[0]);
      if(autoDetect){
        const tb=findTradeBoxes(img.data,img.w,img.h);
        if(!tb.boxes){SC.kind='inv';return scPickFiles([files[0]],false)}
      }
      SC.imgData=img;SC.give=[];SC.get=[];SC.prog='Поиск панелей и кружков…';renderScan();await tick();
      const{boxes,invP}=findTradeBoxes(img.data,img.w,img.h);
      SC.boxes=boxes;SC.invP=invP;
      let cL=[],cR=[],modeInfo='';
      if(boxes){
        cL=detectCircles(img.data,img.w,img.h,boxes[0]);
        cR=detectCircles(img.data,img.w,img.h,boxes[1]);
        SC.splitX=(boxes[0].x1+boxes[1].x0)/2;
        modeInfo=`Панели трейда найдены${invP?' (инвентарь слева игнорирован)':''}`;
      }else{
        const all=detectCircles(img.data,img.w,img.h,{x0:0,y0:0,x1:img.w-1,y1:img.h-1,type:'auto'});
        const sp=splitTradeCircles(all,img.data,img.w,img.h,invP);
        cL=sp.give;cR=sp.get;SC.splitX=sp.splitX;
        modeInfo='Резервный поиск кружков по всему экрану';
        SC.err='⚠ Панели трейда не найдены, сработал запасной поиск по всему экрану. Результат может быть неверным: проверь каждый слот и тапни по пропущенным юнитам.';
      }
      SC.partnerAccept=detectPartnerAccept(img.data,img.w,img.h,boxes,SC.splitX);
      const[gg,rg]=readTradeGems(img.data,img.w,img.h,boxes);
      SC.giveGems=gg;SC.getGems=rg;
      const tot=cL.length+cR.length;let doneC=0;
      const pushAsync=async(arr,dst)=>{
        for(const c of arr){
          doneC++;SC.prog=`Распознано ${doneC}/${tot}…`;
          const el=$('sc-prog');if(el)el.textContent=SC.prog;
          await tick();
          dst.push({...matchCircle(img.cv,img.data,img.w,img.h,c),qty:1,signed:false,edited:false});
        }
      };
      await pushAsync(cL,SC.give);
      await pushAsync(cR,SC.get);
      SC.prog='';
      SC.info=`${modeInfo} · Отдаю: ${cL.length} · Получаю: ${cR.length}${(gg||rg)?` · 💎 ${gg}/${rg}`:''}`;
      scDrawAnn();
    }else{
      SC.shots=[];SC.items=[];SC.shotIdx=0;
      for(let fi=0;fi<files.length;fi++){
        SC.prog=`Скрин ${fi+1}/${files.length}: поиск кружков…`;renderScan();await tick();
        const img=await loadCv(files[fi]),box=findInvBox(img.data,img.w,img.h),cs=detectCircles(img.data,img.w,img.h,box);
        SC.shots.push({imgData:img,box,annUrl:'',count:cs.length});
        for(let ci=0;ci<cs.length;ci++){
          SC.prog=`Скрин ${fi+1}/${files.length}: распознано ${ci+1}/${cs.length}…`;
          const el=$('sc-prog');if(el)el.textContent=SC.prog;
          await tick();
          SC.items.push({...matchCircle(img.cv,img.data,img.w,img.h,cs[ci]),shotIdx:fi,qty:1,signed:false,edited:false});
        }
        scDrawAnn(fi);
      }
      SC.prog='';
      SC.shotIdx=SC.shots.length-1;
      SC.annUrl=SC.shots[SC.shotIdx]?.annUrl||'';
      SC.info=`Скринов: ${SC.shots.length} · Всего распознано кружков: ${SC.items.length}`;
    }
    sfx('win');renderScan();
  }catch(e){SC.prog='';SC.err=String(e);sfx('err');renderScan()}
}

function scImgClick(el,e){
  if(!SC)return;
  const imgData=SC.kind==='trade'?SC.imgData:SC.shots?.[SC.shotIdx]?.imgData;
  if(!imgData)return;
  const r=el.getBoundingClientRect(),px=(e.clientX-r.left)/r.width*imgData.w,py=(e.clientY-r.top)/r.height*imgData.h;
  const sides=SC.kind==='trade'?['give','get']:['items'];
  for(const s of sides)for(let i=0;i<SC[s].length;i++){
    const sl=SC[s][i];
    if(SC.kind==='inv'&&sl.shotIdx!==SC.shotIdx)continue;
    if(sl.R&&Math.hypot(px-sl.cx,py-sl.cy)<=sl.R*1.05){
      SC.hlSide=s;SC.hlIdx=i;renderScan();
      $('sc-sl-'+s+'-'+i)?.scrollIntoView({behavior:'smooth',block:'center'});
      return sfx('tap');
    }
  }
  const allR=[...SC.give,...SC.get,...SC.items].filter(x=>x.R).map(x=>x.R);
  const estR=allR.length?allR.sort((a,b)=>a-b)[allR.length>>1]:Math.round(Math.min(imgData.w,imgData.h)*.055);
  let bx=px,by=py,br=estR,bsc=-1;
  const{cv,data,w,h}=imgData;
  for(let dx=-10;dx<=10;dx+=5)for(let dy=-10;dy<=10;dy+=5)for(let dr=Math.round(estR*.84);dr<=Math.round(estR*1.16);dr+=Math.max(2,Math.round(estR*.08))){
    const ev=ringEval(data,w,h,px+dx,py+dy,dr),sc=ev.topHits*12+ev.hits*5-ev.maxTopGap*8;
    if(ev.topHits>=10&&sc>bsc){bsc=sc;bx=px+dx;by=py+dy;br=dr}
  }
  const c={cx:Math.max(br,Math.min(w-br,bx)),cy:Math.max(br,Math.min(h-br,by)),R:br};
  let targetSide='items';
  if(SC.kind==='trade'){
    if(SC.boxes){
      const d0=Math.hypot(c.cx-(SC.boxes[0].x0+SC.boxes[0].x1)/2,c.cy-(SC.boxes[0].y0+SC.boxes[0].y1)/2);
      const d1=Math.hypot(c.cx-(SC.boxes[1].x0+SC.boxes[1].x1)/2,c.cy-(SC.boxes[1].y0+SC.boxes[1].y1)/2);
      targetSide=d0<=d1?'give':'get';
    }else targetSide=c.cx<(SC.splitX||w*.5)?'give':'get';
  }
  const slot={...matchCircle(cv,data,w,h,c),qty:1,signed:false,edited:false,...(SC.kind==='inv'?{shotIdx:SC.shotIdx}:{})};
  SC[targetSide].push(slot);SC.hlSide=targetSide;SC.hlIdx=SC[targetSide].length-1;
  scDrawAnn(SC.shotIdx);renderScan();sfx('add');
  $('sc-sl-'+targetSide+'-'+SC.hlIdx)?.scrollIntoView({behavior:'smooth',block:'center'});
}

function renderScan(){
  if(!SC)return;
  const k=SC.kind,opts=[...ALL].sort((a,b)=>a.name.localeCompare(b.name)).map(i=>`<option value="${esc(i.name)}">${esc(i.name)} (${i.value?sfmt(i.value):'N/A'})</option>`).join('');
  const slotList=(arr,side)=>arr.map((r,idx)=>{
    const u=IDX.get(r.name),uv=(u?.value||0)*(r.signed&&!isSigned(u)?1+(S.mk??15)/100:1);
    const alts=(r.cands||[]).map(cn=>{const cu=IDX.get(cn);return `<button class="sc-alt ${cn===r.name?'on':''}" data-a="scPickAlt" data-s="${side}" data-i="${idx}" data-n="${esc(cn)}">${cu&&cu.img?`<img src="${esc(cu.img)}" onerror="this.remove()">`:''}${esc(cn)}</button>`}).join('');
    const hl=SC.hlSide===side&&SC.hlIdx===idx?'hl':'';
    return `<div id="sc-sl-${side}-${idx}" class="sc-slot ${r.lowConf?'low':''} ${hl}"><div class="sc-main">
      <div class="sc-id"><span class="sc-num ${side==='get'?'b':''}">#${idx
+1}</span>${r.crop?`<img class="sc-crop" src="${r.crop}">`:''}${u?imgTag(u,'u'):''}<span class="n"><b data-a="det" data-ret="scan" data-n="${esc(r.name)}" style="cursor:pointer">${esc(r.name||'Не распознан')}</b>${r.lowConf?' <span class="tag" style="border-color:var(--y);color:var(--y)">?</span>':''}${r.parsedCost?` <span class="m">$${r.parsedCost}</span>`:''}<div class="m">${u&&u.value?fmt(uv*r.qty):'<span class="tg">N/A</span>'}</div></span></div>
      <div class="sc-ctl">${!isSigned(u)?`<button class="sm tag ${r.signed?'':'off'}" data-a="scSg" data-s="${side}" data-i="${idx}">SG</button>`:''}<button class="sm" data-a="scPickModal" data-s="${side}" data-i="${idx}">Выбрать</button><button class="sm" data-a="scQ" data-s="${side}" data-i="${idx}" data-d="-1">−</button><b>${r.qty}</b><button class="sm" data-a="scQ" data-s="${side}" data-i="${idx}" data-d="1">+</button><button class="sm" data-a="scDel" data-s="${side}" data-i="${idx}" title="Удалить">✕</button></div>
    </div>${alts?`<div class="sc-alts">${alts}</div>`:''}</div>`;
  }).join('')||'<div class="m">Кружки не найдены — тапни по пропущенному юниту на скрине или добавь вручную ниже</div>';

  const gemInp=(side,valNum)=>`<div class="gem-row"><span class="gem-ic">💎</span><span class="m">Гемы</span><input type="number" min="0" step="10" data-scg="${side}" value="${valNum||''}" placeholder="0"></div>`;
  const box=(title,arr,side,gVal=0)=>`<div class="sc-box"><b>${title} (${arr.length})</b>${slotList(arr,side)}${k==='trade'?gemInp(side,gVal):''}<div class="sc-add"><select id="sc-sel-${side}">${opts}</select><button class="sm" data-a="scAdd" data-s="${side}">${I('plus')}</button></div></div>`;

  const toObj=arr=>{const o={};for(const r of arr)if(r.name)o[r.name]=(o[r.name]||0)+r.qty;return o};
  const scTradeSummary=()=>{
    const gObj=toObj(SC.give),rObj=toObj(SC.get);
    const gv=sum('give',gObj,{give:SC.giveGems,get:SC.getGems}),gt=sum('get',rObj,{give:SC.giveGems,get:SC.getGems});
    const df=gt-gv,p=gv?df/gv*100:(gt?100:0),w=p>5?['win','WIN']:p<-5?['lose','LOSE']:['fair','FAIR'];
    const T=analyzeTrade(gObj,rObj,SC.giveGems,SC.getGems);
    const acceptBan=SC.partnerAccept?'<div class="acc-ban">✓ [Партнёр нажал Accept]</div>':'';
    const hasBoth=(T.G.pcs>0||T.G.gems>0)&&(T.R.pcs>0||T.R.gems>0);
    const verdict=hasBoth?`<div class="rec ${T.rec[0]}"><div class="rt"><span>${T.rec[1]}</span><span class="m" style="color:inherit">реал ${T.adjPct>0?'+':''}${T.adjPct.toFixed(0)}%</span></div><div class="rs">${esc(T.rec[2])}</div>${quickRepliesHtml(T,gv,gt)}</div>`:'';
    const shaky=[...SC.give.map((r,i)=>['Я отдаю',i,r]),...SC.get.map((r,i)=>['Я получаю',i,r])].filter(([,,r])=>!r.name||(r.lowConf&&!r.edited)).map(([sd,i])=>sd+' #'+(i+1));
    if(shaky.length)return `${acceptBan}<div class="warn" style="margin-top:8px;font-size:14px"><b>⚠ СКАН НЕНАДЁЖЕН — НЕ ВЕРЬ ВЕРДИКТУ</b><br>Не уверен: ${shaky.join(', ')}. Тапни нужного юнита в строке — вердикт появится.</div>`;
    return `${acceptBan}<div class="note" style="margin-top:8px">Отдаю: <b>${fmt(gv)}</b> · Получаю: <b>${fmt(gt)}</b> → <b class="${w[0]}">${w[1]} ${df>0?'+':''}${fmt(df)} (${p>0?'+':''}${p.toFixed(1)}%)</b></div>${verdict}`;
  };

  let preview='';
  if(SC.annUrl){
    if(k==='trade'){
      preview=`${box('Я отдаю (зелёный)',SC.give,'give',SC.giveGems)}${box('Я получаю (голубой)',SC.get,'get',SC.getGems)}
      <div id="sc-sum">${scTradeSummary()}</div>
      <div class="bar"><button class="p" data-a="scApply" data-m="rep">Заменить трейд</button><button data-a="scApply" data-m="add">Добавить к трейду</button></div>`;
    }else{
      const tot=SC.items.reduce((a,r)=>a+(IDX.get(r.name)?.value||0)*r.qty,0);
      preview=`${box('Распознано в инвентаре (~'+fmt(tot)+')',SC.items,'items')}
      <div class="bar"><button class="p" data-a="scApply" data-m="rep">Заменить инвентарь</button><button data-a="scApply" data-m="add">Добавить к текущему</button></div>`;
    }
  }
  const shotsBar=k==='inv'&&SC.shots?.length>1?`<div class="sc-shots">${SC.shots.map((sh,si)=>`<button class="sm ${si===SC.shotIdx?'onb':''}" data-a="scShot" data-i="${si}">Скрин ${si+1} (${sh.count})</button>`).join('')}</div>`:'';
  const totalNonSg=ALL.filter(u=>!isSigned(u)&&u.img).length,uniqRef=new Set(REFS.map(r=>r.name)).size,usrN=Object.keys(USR_IC.items||{}).length;
  $('dl').innerHTML=`<div class="row"><h3 style="flex:1;margin:0">${k==='trade'?'Скан трейда':'Скан инвентаря'}</h3><button class="sm" data-a="close">${I('x')}</button></div>
  <div class="sc-drop">${shotsBar}${SC.annUrl?`<img src="${SC.annUrl}" data-a="scImgClick" title="Тапни на кружок — перейти к слоту; тапни в пустое место — добавить пропущенный кружок"><div class="m">Подсказка: если кружок пропустился — тапни прямо по нему на скрине!</div>`:`<div class="m">${k==='inv'?'Выбери 1 или несколько скринов инвентаря.':'Загрузи скрин трейда (или вставь <b>Ctrl+V</b>).'} Локальный скан без VPN.</div>`}
    ${SC.prog?`<div id="sc-prog" class="sc-prog">${esc(SC.prog)}</div>`:''}
    <div class="bar" style="width:100%;margin:0">
      <label style="flex:1;display:block"><input id="scf" type="file" accept="image/*" ${k==='inv'?'multiple':''} hidden><span style="display:block;padding:8px 10px;border:1px solid rgba(var(--gr),.35);border-radius:3px;background:rgba(var(--gr),.08);cursor:pointer;font-size:12px;text-transform:uppercase">${SC.annUrl?(k==='inv'?'Другие скрины':'Другой скрин'):(k==='inv'?'Выбрать скрины':'Выбрать скрин')}</span></label>
      <button data-a="scPaste">Из буфера</button>
    </div>
    <div class="m">${SC.info?esc(SC.info)+' · ':''}База (${IC.size||48}px): <b>${uniqRef}/${totalNonSg}</b> · Шрифт: <b>${FONT_REFS?'ОК':'авто'}</b> · Память: <b>${usrN}</b></div>
    <div class="row" style="width:100%;justify-content:center;gap:6px;flex-wrap:wrap"><label class="sw" style="margin:0"><input type="checkbox" data-c="learn" ${S.learn!==0?'checked':''}> Самообучение</label>${usrN?`<button class="sm" data-a="scExportUsr">Экспорт game-icons.json</button><button class="sm" data-a="scClearUsr">Сброс (${usrN})</button>`:''}</div>
  </div>${SC.err?`<div class="warn">${esc(SC.err)}</div>`:''}${preview}`;
}

async function scPaste(){
  try{if(!navigator.clipboard?.read)throw 0;const items=await navigator.clipboard.read();
    for(const it of items){const t=it.types.find(x=>x.startsWith('image/'));if(t)return scPickFiles([await it.getType(t)])}
    toast('В буфере нет картинки');
  }catch{toast('Нажми Ctrl+V или выбери файл вручную')}
}
function scLearnSlots(slots){
  if(S.learn===0)return 0;
  const sz=IC.size||48;if(!USR_IC.items)USR_IC.items={};USR_IC.size=sz;
  let learned=0;
  for(const r of slots){
    if(!r.name||!r.learnB64||isSigned(IDX.get(r.name)))continue;
    /* v7.2: учимся ТОЛЬКО на слотах, которые пользователь сам выбрал/подтвердил.
       Раньше запоминалась и неуверенная догадка сканера, и ошибка закреплялась (бонус -5 за «выученный» слот). */
    if(r.edited){
      USR_IC.items[r.name]={b:r.learnB64,t:Date.now()};learned++;
    }
  }
  const ent=Object.entries(USR_IC.items);
  if(ent.length>90){ent.sort((a,b)=>(b[1].t||0)-(a[1].t||0));USR_IC.items=Object.fromEntries(ent.slice(0,90))}
  if(learned){try{localStorage.setItem(KUSR,JSON.stringify(USR_IC))}catch{}buildRefs()}
  return learned;
}
function scExportUsr(){
  const sz=IC.size||48,merged={};
  for(const[k,v]of Object.entries(GI.items||GI.icons||{})){const rn=resolveName(k)||k;if(v)merged[rn]=v}
  let uCnt=0;
  for(const[k,obj]of Object.entries(USR_IC.items||{})){if(obj?.b){merged[k]=obj.b;uCnt++}}
  if(!Object.keys(merged).length){toast('Память эталонов пуста');return sfx('err')}
  const payload={version:1,size:sz,updated:new Date().toISOString(),items:merged,...(GI.font||FNT?{font:GI.font||FNT.font||FNT}:{})};
  const blob=new Blob([JSON.stringify(payload)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='game-icons.json';a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1500);
  toast(`Выгружено ${Object.keys(merged).length} иконок (новых из памяти: ${uCnt})`);sfx('add');
}
function scApply(m){
  if(SC.kind==='trade'){
    const lr=scLearnSlots([...SC.give,...SC.get]);
    if(m==='rep'){S.give={};S.get={};S.gems={give:0,get:0}}
    for(const r of SC.give)if(r.name){S.give[r.name]=(S.give[r.name]||0)+r.qty;if(r.signed&&!isSigned(IDX.get(r.name)))S.sg[r.name]=true}
    for(const r of SC.get)if(r.name){S.get[r.name]=(S.get[r.name]||0)+r.qty;if(r.signed&&!isSigned(IDX.get(r.name)))S.sg[r.name]=true}
    S.gems.give=m==='rep'?(SC.giveGems||0):(gemsOf('give')+(SC.giveGems||0));
    S.gems.get=m==='rep'?(SC.getGems||0):(gemsOf('get')+(SC.getGems||0));
    save();SC=null;$('dl').close();calc();tab(0);toast('Трейд загружен'+(lr?` · запомнено ${lr} икон.`:''));
  }else{
    const lr=scLearnSlots(SC.items);
    if(m==='rep')S.inv={};
    for(const r of SC.items)if(r.name)S.inv[r.name]=(S.inv[r.name]||0)+r.qty;
    save();SC=null;$('dl').close();inv();toast('Инвентарь обновлён'+(lr?` · запомнено ${lr} икон.`:''));
  }
  sfx('add');
}

/* ================= ВИЗУАЛЬНЫЙ ПИКЕР ЮНИТОВ ================= */
let PKCH='';
const openDl=(full=0,wide=0)=>{const d=$('dl');d.classList.toggle('full',!!full);d.classList.toggle('wide',!!wide&&!full);if(!d.open)d.showModal();d.querySelectorAll('h3').forEach(scr)};
function pick(m){
  mode=m;PKC='';PKCH='';
  const titles={give:'Добавить в «Я отдаю»',get:'Добавить в «Я получаю»',inv:'Добавить в инвентарь',goal:'Выбери цель',scan:'Выбери юнита для слота'};
  const cats=[...new Set(ALL.map(i=>i.category))];
  const tabs=[['all','Все'],...(m!=='goal'&&m!=='scan'&&pcs(S.inv)?[['inv','В инвентаре']]:[]),['unit','Юниты'],['bc','Бусты/Кейсы'],['signed','DevSigned']];
  if(PKF==='inv'&&(!pcs(S.inv)||m==='goal'||m==='scan'))PKF='all';
  const doneBtn=m==='scan'?`<button data-a="scBack">Назад к скану</button>`:`<button class="p" data-a="close">Готово</button>`;
  $('dl').innerHTML=`<div class="row"><h3 style="flex:1;margin:0">${titles[m]||'Выбери юнитов'}</h3><button class="sm" data-a="${m==='scan'?'scBack':'close'}">${I('x')}</button></div>
  <input id="pq" placeholder="Поиск по названию…" value="${esc(PKQ)}">
  <div class="pk-tabs" id="pkf">${tabs.map(t=>`<button class="${PKF==t[0]?'on':''}" data-a="pkf" data-f="${t[0]}">${t[1]}</button>`).join('')}</div>
  <div class="pk-tabs" id="pkc2">${[['','Все'],['imba','🔥 ИМБА'],['up','📈 Рост'],['down','📉 Спад'],['fav','★ Избранное']].map(c=>`<button class="${PKCH==c[0]?'on':''}" data-a="pkchip" data-c="${c[0]}">${c[1]}</button>`).join('')}</div>
  <div class="bar sel" style="margin:4px 0"><select id="pkc"><option value="">Все редкости</option>${cats.map(c=>`<option>${esc(c)}</option>`).join('')}</select>
    <select id="pks"><option value="v" ${PKS=='v'?'selected':''}>По цене</option><option value="q" ${PKS=='q'?'selected':''}>По крутости (ИМБА)</option><option value="d" ${PKS=='d'?'selected':''}>По спросу</option><option value="a" ${PKS=='a'?'selected':''}>А–Я</option></select></div>
  <div id="pls" class="pls pk-grid"></div>
  <div class="row" style="margin-top:6px"><span id="pkSum" class="m" style="flex:1"></span>${doneBtn}</div>`;
  openDl(0,1);pl();
}
function pl(){
  PKQ=$('pq')?.value||'';const q=PKQ.toLowerCase(),el=$('pls'),st=el.scrollTop;
  const list=ALL.filter(i=>{
    if(!i.name.toLowerCase().includes(q))return 0;if(PKC&&i.category!==PKC)return 0;
    if(PKF==='inv'&&(S.inv[i.name]||0)<=0)return 0;if(PKF!=='all'&&PKF!=='inv'&&tabOf(i)!==PKF)return 0;
    const a=AN.get(i.name);
    if(PKCH==='imba'&&(!a||a.q<70))return 0;
    if(PKCH==='up'&&(!a||a.trend!=='up'))return 0;
    if(PKCH==='down'&&(!a||a.trend!=='down'))return 0;
    if(PKCH==='fav'&&!S.fav[i.name])return 0;
    return 1;
  }).sort(PKS=='q'?(a,b)=>(AN.get(b.name)?.q||0)-(AN.get(a.name)?.q||0)||val(b.name)-val(a.name):PKS=='d'?(a,b)=>b.demand-a.demand||val(b.name)-val(a.name):PKS=='a'?(a,b)=>a.name.localeCompare(b.name):(a,b)=>val(b.name)-val(a.name));

  const bag=mode==='inv'?S.inv:(mode==='give'||mode==='get')?S[mode]:null;
  el.innerHTML=list.map(i=>{
    const iv=S.inv[i.name]||0,cur=bag?(bag[i.name]||0):0,an=AN.get(i.name),qb=an?`<span class="qb ${an.grade[2]}">${an.grade[1]}</span>`:'';
    const tr=an&&Math.abs(an.trPct)>=12?`<b class="${an.trPct>0?'win':'lose'}">${an.trPct>0?'+':''}${an.trPct}%</b>`:'';
    const ctl=(mode==='goal'||mode==='scan')?`<div class="pk-ctl"><button class="p" data-a="pk" data-n="${esc(i.name)}">${mode==='scan'?'Выбрать':'Выбрать целью'}</button></div>`
      :`<div class="pk-ctl"><button data-a="pkDec" data-n="${esc(i.name)}" ${cur?'':'disabled'}>−</button><b>${cur}</b><button class="p" data-a="pk" data-n="${esc(i.name)}">+</button><button data-a="pk5" data-n="${esc(i.name)}">+5</button></div>`;
    return `<div class="pk-tile r-${esc(i.category)} ${cur?'on':''}">
      <div class="pk-topL">${qb}</div>
      <div class="pk-topR">${iv&&mode!=='inv'?`<span class="pk-inv">инв:${iv}</span>`:''}<button class="pk-info" data-a="det" data-ret="pick" data-n="${esc(i.name)}" title="Досье">i</button></div>
      <div class="pk-hit" data-a="pk" data-n="${esc(i.name)}">${i.img?`<img class="pk-img" src="${esc(i.img)}" loading="lazy" onerror="this.outerHTML='<div class=\\'pk-ph\\'>?</div>'">`:'<div class="pk-ph">?</div>'}<div class="pk-nm">${esc(i.name)}</div><div class="pk-pr">${pLbl(i)}</div><div class="pk-meta"><span class="rb">${esc(i.category)}</span> · ${i.demand}/10 ${tr}</div></div>${ctl}</div>`;
  }).join('')||'<div class="m">Ничего не найдено</div>';
  el.scrollTop=st;
  const sumEl=$('pkSum');
  if(sumEl){
    if(mode==='give'||mode==='get')sumEl.textContent=`Выбрано: ${pcs(S[mode])} шт · ${fmt(sum(mode))}`;
    else if(mode==='inv')sumEl.textContent=`В инвентаре: ${pcs(S.inv)} шт · ${fmt(Object.entries(S.inv).reduce((a,[n,q])=>a+val(n)*q,0))}`;
    else sumEl.textContent='Нажми на карточку для выбора';
  }
}
function pk(n,d=1){
  if(mode=='scan'&&SC&&SC_SLOT){const sl=SC[SC_SLOT.side]?.[SC_SLOT.idx];if(sl){sl.name=n;sl.lowConf=false;sl.edited=true;if(!sl.cands.includes(n))sl.cands.unshift(n)}SC_SLOT=null;renderScan();openDl(0,1)}
  else if(mode=='goal'){S.goal=n;save();$('dl').close();inv()}
  else if(mode=='inv'){S.inv[n]=(S.inv[n]||0)+d;save();inv();pl()}
  else{qty(mode,n,d);pl()}
  sfx('add');
}
function pkDec(n){
  if(mode=='inv'){S.inv[n]=(S.inv[n]||0)-1;if(S.inv[n]<=0)delete S.inv[n];save();inv();pl()}
  else if(mode=='give'||mode=='get'){qty(mode,n,-1);pl()}
  sfx('tap');
}

/* ================= КАТАЛОГ + СРАВНЕНИЕ A vs B + ИЗБРАННОЕ ================= */
const CT=[['all','Все'],['unit','Юниты'],['bc','Бусты и Кейсы'],['signed','DevSigned']];
const TGL_=[['','Все'],['fav','★ Избранное'],['hot','Топ спрос'],['up','Растут / Overpaid'],['down','Падают / Неликвид'],['ttn','🗿 Титаны'],['frm','💰 Фарм/саппорт'],['erl','🌱 Ранние'],['gd','💎 Выгодно брать']],
  TGF={'':()=>1,fav:i=>!!S.fav[i.name],hot:i=>i.demand>=8,up:i=>i.flags.some(f=>/Rising|Overpaid/.test(f)),down:i=>i.flags.some(f=>/Dropping|Unwanted/.test(f)),ttn:i=>i.kind==='unit'&&!isSigned(i)&&/titan/i.test(i.name),frm:i=>/Farm|Spawner|Support/.test(i.role||'')&&!isSigned(i),erl:i=>/^(Common|Uncommon|Rare|Epic|Legendary)$/.test(i.category)&&i.maxDps>0,gd:i=>ofGood(i)};
$('tg').innerHTML=TGL_.map((t,i)=>`<button data-a="tg" data-g="${t[0]}" class="${i?'':'on'}">${t[1]}</button>`).join('');
function fillFilters(){
  const inTab=ALL.filter(i=>S.cat=='all'||tabOf(i)==S.cat),cs=[...new Set(inTab.map(i=>i.category))],ss=[...new Set(inTab.flatMap(i=>i.flags))],c0=$('fc').value,s0=$('fs').value;
  $('fc').innerHTML='<option value="">Все категории</option>'+cs.map(c=>`<option>${esc(c)}</option>`).join('');
  $('fs').innerHTML='<option value="">Любая стабильность</option>'+ss.map(c=>`<option>${esc(c)}</option>`).join('');
  $('fc').value=cs.includes(c0)?c0:'';$('fs').value=ss.includes(s0)?s0:'';
  $('ct').innerHTML=CT.map(t=>`<button data-a="ctab" data-c="${t[0]}" class="${S.cat==t[0]?'on':''}">${t[1]} <span class="m">${t[0]=='all'?ALL.length:ALL.filter(i=>tabOf(i)==t[0]).length}</span></button>`).join('');
  document.querySelectorAll('#vm button').forEach(b=>b.classList.toggle('on',b.dataset.v==S.view));
  const cb=$('cmpb');if(cb){cb.classList.toggle('onb',!!CMP_MODE);cb.textContent=CMP_MODE?`⚖ Выбрано ${CMP_LIST.length}/2`:'⚖ Сравнить'}
}
const tile=i=>{
  const a=AN.get(i.name),tr=a&&Math.abs(a.trPct)>=12?` <b class="${a.trPct>0?'win':'lose'}">${a.trPct>0?'▲+':'▼'}${a.trPct}%</b>`:'';
  const sel=CMP_MODE&&CMP_LIST.includes(i.name)?'cmps':'';
  return `<div class="tile r-${esc(i.category)} ${sel}" data-a="catTap" data-n="${esc(i.name)}">${rbadge(i)?`<span class="bdg">${rbadge(i)}</span>`:''}<div class="trp">${a?`<span class="qb ${a.grade[2]}">${a.grade[1]}</span>`:''}${sgOn(i.name)?'<span class="tag">SG</span>':''}${ofGood(i)?'<span class="tag" title="Спрос высокий, рынок выше списка или растёт">💎</span>':''}<button class="fav ${S.fav[i.name]?'on':''}" data-a="fav" data-n="${esc(i.name)}">${S.fav[i.name]?'★':'☆'}</button></div>${i.img?`<img class="ti" src="${esc(i.img)}" loading="lazy" onerror="this.outerHTML='<div class=\\'ti ph\\'>?</div>'">`:'<div class="ti ph">?</div>'}<b class="tn">${esc(i.name)}</b><div class="tp ${i.value?'':'z'}">${pLbl(i)}</div><i class="db"><i style="width:${i.demand*10}%"></i></i><div class="tf">спрос ${i.demand}/10${tr}<br>${flagHtml(i)}</div></div>`;
};
const listRow=i=>{
  const a=AN.get(i.name),sel=CMP_MODE&&CMP_LIST.includes(i.name)?'style="border-color:#fff"':'';
  return `<div class="li r-${esc(i.category)}" ${sel} data-a="catTap" data-n="${esc(i.name)}">${imgTag(i,'u')}<span class="n"><b>${esc(i.name)}</b> ${a?`<span class="qb ${a.grade[2]}">${a.grade[1]}</span>`:''}${rbadge(i)?` <span class="tag">${rbadge(i)}</span>`:''}${ofGood(i)?' <span class="tag">💎 БРАТЬ</span>':''}<div class="m"><span class="rb">${esc(i.category)}</span> · ${i.demand}/10 · ${flagHtml(i)}${i.maxDps?` · DPS ${fmt(i.maxDps)}`:''}</div></span><button class="fav ${S.fav[i.name]?'on':''}" data-a="fav" data-n="${esc(i.name)}">${S.fav[i.name]?'★':'☆'}</button><b class="v ${i.value?'':'z'}">${pLbl(i)}</b></div>`;
};
function cat(){
  const q=$('q').value.toLowerCase(),c=$('fc').value,s=$('fs').value,o=$('so').value,TR=['S','A','B','C','D'],ti=t=>{const k=TR.indexOf(t);return k<0?9:k},cm=x=>x.cashToMax||1e12;
  const a=ALL.filter(i=>(S.cat=='all'||tabOf(i)==S.cat)&&i.name.toLowerCase().includes(q)&&(!c||i.category==c)&&(!s||i.flags.includes(s))&&TGF[TGL](i));
  a.sort(o=='v'?(x,y)=>val(y.name)-val(x.name):o=='q'?(x,y)=>(AN.get(y.name)?.q||0)-(AN.get(x.name)?.q||0)||val(y.name)-val(x.name):o=='d'?(x,y)=>y.demand-x.demand:o=='p'?(x,y)=>(y.maxDps||0)-(x.maxDps||0):o=='t'?(x,y)=>ti(x.tier)-ti(y.tier):o=='c'?(x,y)=>cm(x)-cm(y):(x,y)=>x.name.localeCompare(y.name));
  FN=a.length;$('cl').className=S.view=='grid'?'grid':'lst';$('cl').innerHTML=a.map(S.view=='grid'?tile:listRow).join('')||'<div class="m">Ничего не найдено</div>';cnt();
}

function openCompare(n1,n2){
  const u1=IDX.get(n1),u2=IDX.get(n2),a1=AN.get(n1),a2=AN.get(n2);if(!u1||!u2)return;
  RET=null;
  const row=(k,v1,v2,win1,win2)=>`<tr><td>${k}</td><td class="${win1?'win':''}">${v1}</td><td class="${win2?'win':''}">${v2}</td></tr>`;
  const rk=(x,y)=>x&&y?(x<y?1:0):(x?1:0),mx=(x,y)=>x>y?1:0;
  $('dl').innerHTML=`<div class="row"><h3 style="flex:1;margin:0">Сравнение A vs B</h3><button class="sm" data-a="close">${I('x')}</button></div>
  <div class="cmp">
    <div class="cmp-b" style="text-align:center">${imgTag(u1,'u')}<br><b>${esc(n1)}</b><div class="m"><span class="qb ${a1.grade[2]}">${a1.grade[1]} ${a1.q}</span></div></div>
    <div class="cmp-b" style="text-align:center">${imgTag(u2,'u')}<br><b>${esc(n2)}</b><div class="m"><span class="qb ${a2.grade[2]}">${a2.grade[1]} ${a2.q}</span></div></div>
  </div>
  <div class="tw"><table>
    <tr><th>Параметр</th><th>${esc(n1.slice(0,16))}</th><th>${esc(n2.slice(0,16))}</th></tr>
    ${row('Цена',pLbl(u1),pLbl(u2),mx(val(n1),val(n2)),mx(val(n2),val(n1)))}
    ${row('Качество',a1.q+'/100',a2.q+'/100',mx(a1.q,a2.q),mx(a2.q,a1.q))}
    ${row('Спрос',u1.demand+'/10',u2.demand+'/10',mx(u1.demand,u2.demand),mx(u2.demand,u1.demand))}
    ${row('Тренд 14д',`${a1.trPct>0?'+':''}${a1.trPct}%`,`${a2.trPct>0?'+':''}${a2.trPct}%`,mx(a1.trPct,a2.trPct),mx(a2.trPct,a1.trPct))}
    ${row('Редкость',u1.rarityRank?'#'+u1.rarityRank:'—',u2.rarityRank?'#'+u2.rarityRank:'—',rk(u1.rarityRank,u2.rarityRank),rk(u2.rarityRank,u1.rarityRank))}
    ${row('В игре (Exist)',u1.exist?sfmt(u1.exist):'—',u2.exist?sfmt(u2.exist):'—',rk(u1.exist,u2.exist),rk(u2.exist,u1.exist))}
    ${row('Max DPS',u1.maxDps?fmt(u1.maxDps):'—',u2.maxDps?fmt(u2.maxDps):'—',mx(u1.maxDps||0,u2.maxDps||0),mx(u2.maxDps||0,u1.maxDps||0))}
    ${row('DPS / 1K',u1.dpsPer1k?f2(u1.dpsPer1k):'—',u2.dpsPer1k?f2(u2.dpsPer1k):'—',mx(u1.dpsPer1k||0,u2.dpsPer1k||0),mx(u2.dpsPer1k||0,u1.dpsPer1k||0))}
    ${row('Прокачка',u1.cashToMax?fmt(u1.cashToMax):'—',u2.cashToMax?fmt(u2.cashToMax):'—',rk(u1.cashToMax,u2.cashToMax),rk(u2.cashToMax,u1.cashToMax))}
  </table></div>
  <div class="bar"><button data-a="det" data-n="${esc(n1)}">Досье A</button><button data-a="det" data-n="${esc(n2)}">Досье B</button><button class="p" data-a="close">Закрыть</button></div>`;
  openDl(0,1);
}

function normSeries(raw,allowZero=0){const byDay=new Map();for(const[d,v]of raw){const t=parseDate(d),y=parseVal(v);if(isFinite(t)&&isFinite(y)&&(allowZero?y>=0:y>0))byDay.set(Math.round(t/864e5)*864e5,y)}return[...byDay.entries()].sort((a,b)=>a[0]-b[0])}
function fillDaily(pts,endDay){if(!pts.length)return[];const out=[],lastT=Math.max(pts[pts.length-1][0],endDay||0);for(let i=0;i<pts.length;i++){const[t,v]=pts[i];out.push([t,v,1]);const nextT=i<pts.length-1?pts[i+1][0]:lastT;for(let d=t+864e5;d<nextT;d+=864e5)out.push([d,v,0])}if(lastT>pts[pts.length-1][0])out.push([lastT,pts[pts.length-1][1],0]);return out}
function series(u){
  const botRaw=(HI.items[u.name]||[]).map(r=>[r[0],r[1]]),today=(D.updated||'').slice(0,10),todayT=today?Math.round(parseDate(today)/864e5)*864e5:0;
  const chg=(D.changelog||[]).filter(c=>nrm(c.name)===nrm(u.name)).sort((a,b)=>parseDate(a.date)-parseDate(b.date));
  if(chg.length){const t0=parseDate(chg[0].date);if(isFinite(t0)&&chg[0].old>=0)botRaw.push([t0-864e5,chg[0].old]);chg.forEach(c=>botRaw.push([c.date,c.new]))}
  if(today&&u.official>0)botRaw.push([today,u.official]);
  const mkRaw=(u.priceHistory||[]).map(p=>Array.isArray(p)?[p[0],p[1]]:[p.date??p.d??p.t,p.value??p.v??p.price]);
  return[{k:'vvx',name:'Value (Vaulted)',pts:fillDaily(normSeries(botRaw,chg.length>0),todayT),col:'var(--g)'},{k:'mkt',name:'Рынок (game.guide)',pts:fillDaily(normSeries(mkRaw,0),todayT),col:'var(--b)'}].filter(s=>s.pts.length);
}
function chart(u){
  const ss=series(u);CHD=null;if(!ss.length)return '<div class="cbox m">Истории цен пока нет.</div>';
  const ts=ss.flatMap(s=>s.pts.map(p=>p[0])),vs=ss.flatMap(s=>s.pts.map(p=>p[1]));
  let t0=Math.min(...ts),t1=Math.max(...ts);const singleT=t0===t1;if(singleT){t0-=864e5;t1+=864e5}
  let v0=Math.min(...vs),v1=Math.max(...vs);const pd=(v1-v0)*.18||v1*.15||10;v0=Math.max(0,v0-pd);v1+=pd;
  const L=50,R=584,W=R-L,T=22,B=184,H=B-T,X=t=>singleT?L+W/2:L+(t-t0)/(t1-t0)*W,Y=v=>B-(v-v0)/(v1-v0)*H;CHD={ss,t0,t1,v0,v1,X,Y,L,R,T,B};
  const yTicks=[0,.33,.66,1].map(k=>{const v=v0+(v1-v0)*k,y=Y(v).toFixed(1);return `<line class="gl" x1="${L}" x2="${R}" y1="${y}" y2="${y}"/><text class="ax" x="${L-6}" y="${+y+3}" text-anchor="end">${sfmt(v)}</text>`}).join('');
  const dFmt=t=>new Date(t).toLocaleDateString('ru',{day:'2-digit',month:'2-digit'});
  const xTicks=singleT?`<text class="ax" x="${L+W/2}" y="206" text-anchor="middle">${dFmt(ts[0])}</text>`:`<text class="ax" x="${L}" y="206">${dFmt(t0)}</text><text class="ax" x="${L+W/2}" y="206" text-anchor="middle">${dFmt((t0+t1)/2)}</text><text class="ax" x="${R}" y="206" text-anchor="end">${dFmt(t1)}</text>`;
  const defs=`<defs>${ss.map(s=>`<linearGradient id="cg-${s.k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${s.col}" stop-opacity=".28"/><stop offset="100%" stop-color="${s.col}" stop-opacity="0"/></linearGradient>`).join('')}</defs>`;
  const body=ss.map(s=>{
    if(s.pts.length===1){const px=+X(s.pts[0][0]).toFixed(1),py=+Y(s.pts[0][1]).toFixed(1),dash=singleT?`<line x1="${L}" x2="${R}" y1="${py}" y2="${py}" stroke="${s.col}" stroke-width="1.5" stroke-dasharray="5 5" opacity=".55"/>`:'',right=px>R-42,tx=right?px-10:px,anc=right?'end':'middle',ty=right?py+3:Math.max(14,py-11);
      return `<g style="color:${s.col}">${dash}<circle cx="${px}" cy="${py}" r="10" fill="${s.col}" opacity=".2"/><circle cx="${px}" cy="${py}" r="4.5" fill="${s.col}"/><text class="ax" x="${tx}" y="${ty}" fill="${s.col}" text-anchor="${anc}">${sfmt(s.pts[0][1])}</text></g>`}
    const xy=s.pts.map(p=>[X(p[0]).toFixed(1),Y(p[1]).toFixed(1)]),area=`M${xy[0][0]},${B} L${xy.map(p=>p.join(',')).join(' L')} L${xy[xy.length-1][0]},${B} Z`,dots=s.pts.filter(p=>p[2]).map(p=>`<circle cx="${X(p[0]).toFixed(1)}" cy="${Y(p[1]).toFixed(1)}" r="2.6" fill="${s.col}"/>`).join('');
    const mn=s.pts.reduce((a,b)=>b[1]<a[1]?b:a),mx=s.pts.reduce((a,b)=>b[1]>a[1]?b:a);
    const lbl=(p,below)=>{const px=+X(p[0]),py=+Y(p[1]),anc=px<L+36?'start':px>R-36?'end':'middle',tx=px<L+36?Math.max(L+2,px):px>R-36?Math.min(R-2,px):px,ty=below?Math.min(B-4,py+14):Math.max(13,py-8);return `<text class="ax" x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" fill="${s.col}" text-anchor="${anc}">${sfmt(p[1])}</text>`};
    return `<g style="color:${s.col}"><path d="${area}" fill="url(#cg-${s.k})"/><polyline class="ln" stroke="${s.col}" points="${xy.map(p=>p.join(',')).join(' ')}"/>${dots}${lbl(mx,0)}${mn[0]!==mx[0]?lbl(mn,1):''}</g>`;
  }).join('');
  return `<div class="cbox"><svg class="chart" viewBox="0 0 600 220">${defs}${yTicks}${xTicks}${body}<line id="cur" x1="0" x2="0" y1="${T}" y2="${B}" stroke="var(--t)" stroke-width="1" stroke-dasharray="3 3" opacity="0"/><circle id="cdot" r="5" fill="var(--t)" opacity="0" cx="0" cy="0"/></svg><div class="leg">${ss.map(s=>`<span><i style="background:${s.col}"></i>${s.name} (${s.pts.filter(p=>p[2]).length} изм. / ${s.pts.length} дн.)</span>`).join('')}</div><div id="ctip" class="m">Проведи по графику — увидишь цену за каждый день</div></div>`;
}
function chartAt(e,svg){
  if(!CHD)return;const r=svg.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*600,t=CHD.t0+(x-CHD.L)/(CHD.R-CHD.L)*(CHD.t1-CHD.t0);
  let b=null;CHD.ss.forEach(s=>s.pts.forEach(p=>{const d=Math.abs(p[0]-t);if(!b||d<b.d)b={d,s,p}}));if(!b)return;
  const cx=CHD.X(b.p[0]);$('cur').setAttribute('x1',cx);$('cur').setAttribute('x2',cx);$('cur').setAttribute('opacity',.85);$('cdot').setAttribute('cx',cx);$('cdot').setAttribute('cy',CHD.Y(b.p[1]));$('cdot').setAttribute('opacity',1);
  const lines=CHD.ss.map(s=>{const q=s.pts.reduce((m,p)=>!m||Math.abs(p[0]-b.p[0])<Math.abs(m[0]-b.p[0])?p:m,null);return Math.abs(q[0]-b.p[0])<=864e5*1.5?`<span style="color:${s.col}">${s.name.split(' ')[0]}: <b>${fmt(q[1])}</b></span>`:''}).filter(Boolean);
  $('ctip').innerHTML=`<b>${new Date(b.p[0]).toLocaleDateString('ru')}</b> · ${lines.join(' · ')}`;
}

const lvType=u=>u.levelsType||(/spawner/i.test(u.role||'')?'spawner':/farm/i.test(u.role||'')?'farm':/support/i.test(u.role||'')?'support':'damage');
function lvTable(u){
  const L=u.levels||[];if(!L.length)return '';
  const t=lvType(u),buff=t=='support'&&L.some(l=>l.damage||l.cooldown),pc=(v,s)=>v||v===0?s+f2(v)+'%':'';
  let C={damage:[['level','Ур.'],['cost','Цена'],['damage','Урон'],['aoe','AOE'],['cooldown','КД'],['range','Дальн.'],['dps','DPS']],spawner:[['level','Ур.'],['cost','Цена'],['spawns','Спавнит'],['hp','HP'],['unitDps','DPS юнита'],['cooldown','Спавн, с'],['range','Дальн.']],farm:[['level','Ур.'],['cost','Цена'],['income','Доход/волна'],['cooldown','Каждые, с']],support:buff?[['level','Ур.'],['cost','Цена'],['damage','% Урон'],['cooldown','% КД'],['range','% Дальн.']]:[['level','Ур.'],['cost','Цена'],['range','Дальн.']]}[t];
  const rows=L.map(l=>({...l,dps:t=='damage'?(l.dps||(l.damage&&l.cooldown?l.damage/l.cooldown:0)):l.dps}));
  C=C.filter(c=>c[0]=='level'||c[0]=='cost'||rows.some(l=>l[c[0]]));
  const dyn=[...new Set(L.flatMap(l=>Object.keys(l.cols||{})))],cell=(l,k)=>{const v=l[k];if(t=='support'&&buff){if(k=='damage')return pc(v,'+');if(k=='cooldown')return pc(v,'−');if(k=='range')return pc(v,'+')}return typeof v=='number'?f2(v):esc(v??'')},N=C.length+dyn.length;
  return `<div class="tw"><table><tr>${C.map(c=>`<th>${c[1]}</th>`).join('')}${dyn.map(h=>`<th>${esc(h)}</th>`).join('')}</tr>${rows.map((l,idx)=>`<tr class="${l.extra?'hasx':''} ${idx===rows.length-1?'mx':''}">${C.map(c=>`<td class="${c[0]=='spawns'?'tx':''}">${cell(l,c[0])}</td>`).join('')}${dyn.map(h=>`<td>${esc(l.cols?.[h]??'')}</td>`).join('')}</tr>${l.extra?`<tr><td class="ex" colspan="${N}">${esc(l.extra)}</td></tr>`:''}`).join('')}</table></div>${t=='support'&&buff?'<div class="m" style="margin-top:6px">Значения — проценты баффа для соседних юнитов.</div>':''}`;
}
const noBattle=u=>u.kind=='boost'||u.kind=='crate'||u.kind=='currency';
const baseOf=u=>{const b=nrm(u.name.replace(/^devsigned\s*/i,''));if(!b)return null;return ALL.find(i=>!isSigned(i)&&nrm(i.name)==b)||ALL.find(i=>!isSigned(i)&&i.kind=='unit'&&(nrm(i.name).includes(b)||b.includes(nrm(i.name)))&&nrm(i.name).length>3)||null};
const sbox=(k,v)=>v!==undefined&&v!==null&&v!==''&&v!==0?`<div class="sbox"><span>${k}</span><b>${v}</b></div>`:'';

function det(n,keepScroll=0,ret=null){
  const u=IDX.get(n);if(!u)return;
  if(!keepScroll)RET=ret;
  const oldBody=$('dl').classList.contains('full')?$('dl').querySelector('.dh-body'):null,st=keepScroll&&oldBody?oldBody.scrollTop:0;
  CU=n;const m=u.market||{},vv=u.official,diff=m.median&&vv?(m.median-vv)/vv*100:null,tops=m.topTrades||[],an=AN.get(n),pc=placeCostOf(u);
  const nb=noBattle(u),t=lvType(u),dmg=t=='damage',b=isSigned(u)?baseOf(u):null,iv=S.inv[n]||0,tgv=S.give[n]||0,tge=S.get[n]||0,rr=u.rarityRank?`#${u.rarityRank}${RN?' из '+RN:''}`:'',about=u.about||u.description,bu=m.buyers||0,se=m.sellers||0,bsTot=bu+se;

  const cL1=`<div class="hud-card hud-L hud-L1"><h4>Оценка и спрос</h4>${kv(u.valueSource==='game.guide'?'Value (game.guide)':'Value (Vaulted)',vv?fmt(vv):'<span class="tg">N/A</span>')}${S.ov[n]!=null?kv('Твоя цена',fmt(S.ov[n])):''}${sgOn(n)?kv('С учётом Signed',fmt(val(n))):''}${kv('Спрос (Demand)',`<b>${u.demand}/10</b>`)}<i class="db" style="margin:4px 0 6px"><i style="width:${u.demand*10}%"></i></i>${kv('Стабильность',flagHtml(u))}${an?kv('Качество трейда',`<b>${an.q}/100</b> <span class="qb ${an.grade[2]}">${an.grade[1]}</span>`)+kv('Тренд 14д',`<b class="${an.trPct>=10?'win':an.trPct<=-10?'lose':''}">${an.trPct>0?'+':''}${an.trPct}%</b> ${an.trend=='up'?'📈':an.trend=='down'?'📉':'➖'}`):''}${u.rawStability&&u.rawStability.toLowerCase()!=u.flags.join(' ').toLowerCase()?`<div class="m" style="margin-top:3px">На сайте: ${esc(u.rawStability)}</div>`:''}</div>`;
  const cL2=`<div class="hud-card hud-L hud-L2"><h4>Рынок и редкость</h4>${m.median?kv('Медиана (game.guide)',`<b style="color:var(--b)">${fmt(m.median)}</b>`+(diff!=null?` <span class="${diff>=0?'win':'lose'}">(${diff>0?'+':''}${diff.toFixed(0)}%)</span>`:'')):kv('Медиана (game.guide)','<span class="m">нет данных</span>')}${kvo('Вилка цен',m.min&&m.max?fmt(m.min)+' – '+fmt(m.max):'')}${bsTot?`<div class="kv"><span>Покупатели / Продавцы</span><b><span class="win">${bu}</span> / <span class="lose">${se}</span></b></div><div class="bsbar"><i class="bu" style="width:${bu/bsTot*100}%"></i><i class="se" style="width:${se/bsTot*100}%"></i></div>`:''}${kvo('Сделок за неделю',m.trades7d?fmt(m.trades7d):'')}${kv('В игре (Exist)',u.exist?fmt(u.exist):'—')}${rr?kv('Ранг редкости',rr):''}</div>`;
  const sb=nb?sbox('Тип',esc(u.kind=='boost'?'Геймпасс / Буст':u.kind=='crate'?'Кейс':'Предмет'))+sbox('Категория',esc(u.category))+sbox('Спрос',u.demand+'/10')+sbox('Exist',u.exist?sfmt(u.exist):'—'):sbox('Роль',esc(u.role||'Юнит'))+sbox('Tier',u.tier&&esc(u.tier))+sbox('Place Cost',pc&&'$'+fmt(pc))+(dmg?sbox('Max DPS',u.maxDps&&fmt(u.maxDps))+sbox('DPS / 1K',u.dpsPer1k&&f2(u.dpsPer1k)):'')+sbox('Прокачка',u.cashToMax&&fmt(u.cashToMax))+sbox('Макс. на карте',u.maxOnMap)+sbox('Дальность',u.maxRange);
  const cR1=`<div class="hud-card hud-R hud-R1"><h4>${nb?'Параметры':'Боевые статы'}</h4>${sb?`<div class="sgrid">${sb}</div>`:'<div class="m">Характеристики не указаны.</div>'}</div>`;
  const cR2=`<div class="hud-card hud-R hud-R2"><h4>Описание и получение</h4>${isSigned(u)?`<div class="note" style="margin-bottom:6px"><b class="tg">[i]</b> DevSigned-версия.${b?` <button class="sm" data-a="det" data-n="${esc(b.name)}">Обычная: ${esc(b.name)}</button>`:''}</div>`:''}${about?`<div class="abt">${esc(about)}</div>`:'<div class="m" style="margin-bottom:6px">Описание отсутствует.</div>'}${kvo('Как получить',esc(u.howToGet||''))}${kvo('Шанс дропа',u.dropChance?f2(u.dropChance)+'%':'')}${kvo('Добавлен',esc(u.added||''))}${kvo('Обновление',esc(u.update||''))}</div>`;
  const center=`<div class="hud-center"><div class="hud-meta"><span class="rpill">${esc(u.category)}</span>${rbadge(u)?`<span class="tag">${rbadge(u)}</span>`:''}${u.role?`<span class="tag">${esc(u.role)}</span>`:''}${sgOn(n)?'<span class="tag">SIGNED +'+S.mk+'%</span>':''}</div><div class="hud-stage">${u.img?`<img src="${esc(u.img)}" onerror="this.outerHTML='<div class=\\'hph\\'>?</div>'">`:'<div class="hph">?</div>'}</div><h2>${esc(n)}</h2><div class="hud-val ${u.value?'':'z'}">${pLbl(u)}</div><div class="m">В инвентаре: <b style="color:var(--t)">${iv}</b>${tgv||tge?` · в трейде: <b>${tgv}</b> / <b>${tge}</b>`:''}</div><div class="hud-act"><button data-a="dact" data-k="give">+ Отдаю</button><button data-a="dact" data-k="get">+ Получаю</button><button class="p" data-a="dact" data-k="inv">+ Инв</button><button data-a="cmpStart" data-n="${esc(n)}">⚖ Сравнить</button></div></div>`;
  const topsSec=tops.length?`<div class="dsec"><h4>На что чаще всего меняют</h4><div class="chips">${tops.map(x=>{const tn=resolveName(x.name),tx=esc(x.name)+(x.count?` · ${f2(x.count)}${x.pct?'%':''}`:'');return tn?`<button data-a="det" data-n="${esc(tn)}">${tx}</button>`:`<span class="tag">${tx}</span>`}).join('')}</div></div>`:'';
  const tblSec=!nb&&(u.levels||[]).length?`<div class="dsec"><h4>Уровни и прокачка</h4>${lvTable(u)}</div>`:'';
  const sgCtl=isSigned(u)?`<div class="note"><b class="tg">[i]</b> DevSigned — отдельный предмет.</div>`:`<label class="sw"><input type="checkbox" data-c="sg" ${S.sg[n]?'checked':''}> Signed (+${S.mk}%) — мой юнит подписан</label><div class="row"><span class="n m">Наценка Signed, %</span><input type="number" data-c="mk" style="width:90px" value="${S.mk}"></div>`;

  $('dl').innerHTML=`<div class="dh-bar r-${esc(u.category)}"><div class="dt"><span class="rpill">${esc(u.category)}</span><b>${esc(n)}</b><button class="fav ${S.fav[n]?'on':''}" data-a="fav" data-n="${esc(n)}">${S.fav[n]?'★':'☆'}</button></div><button class="xb" data-a="detBack">${I('x')} ${RET?'Назад':'Закрыть'}</button></div>
  <div class="dh-body r-${esc(u.category)}">${!vv?'<div class="warn" style="margin-bottom:10px"><b class="tg">[!]</b> Цены нет ни на Vaulted, ни на game.guide (N/A).</div>':''}<div class="hud-grid">${center}${cL1}${cL2}${cR1}${cR2}</div><div class="dsec"><h4>График истории цен</h4>${chart(u)}</div>${topsSec}${tblSec}<div class="dsec"><h4>Своя цена и Signed</h4>${sgCtl}<div class="row"><span class="n m">Ручная цена</span><input id="dv" type="number" value="${u.value}" style="width:130px"></div><div class="bar"><button data-a="dact" data-k="sv">Сохранить цену</button><button data-a="dact" data-k="rs">Сбросить</button></div></div></div>`;
  openDl(1);const body=$('dl').querySelector('.dh-body');if(body)body.scrollTop=st;
}

function dact(k){
  const n=CU;
  if(k=='sv'){S.ov[n]=+$('dv').value||0;save();rebuild();calc();cat();det(n,1);toast('Цена сохранена')}
  else if(k=='rs'){delete S.ov[n];save();rebuild();calc();cat();det(n,1);toast('Своя цена сброшена')}
  else if(k=='inv'){S.inv[n]=(S.inv[n]||0)+1;save();cnt();det(n,1);toast('В инвентаре: '+S.inv[n])}
  else{qty(k,n,1);det(n,1);toast('Добавлено в трейд')}
  sfx('add');
}

function pres(){SC=null;RET=null;$('dl').innerHTML=`<h3>Пресеты</h3><div class="row"><input id="pn" placeholder="Название связки"><button data-a="psave">Сохранить</button></div>${Object.keys(S.pr).map(k=>{const p=S.pr[k],gTxt=[...Object.keys(p.give||{}),...(p.giveGems?[p.giveGems+'💎']:[])].join(', ')||'—',rTxt=[...Object.keys(p.get||{}),...(p.getGems?[p.getGems+'💎']:[])].join(', ')||'—';return `<div class="row"><span class="n">${esc(k)}<div class="m">${esc(gTxt)} → ${esc(rTxt)}</div></span><button class="sm" data-a="pload" data-k="${esc(k)}">Загрузить</button><button class="sm" data-a="pdel" data-k="${esc(k)}">${I('x')}</button></div>`}).join('')||'<div class="m">Пока пусто</div>'}<br><button data-a="close">Закрыть</button>`;openDl(0)}
function psave(){const k=$('pn').value.trim();if(!k||!(pos(S.give)+pos(S.get)+gemsOf('give')+gemsOf('get'))){toast('Нужны название и юниты/гемы в трейде');return sfx('err')}S.pr[k]={give:{...S.give},get:{...S.get},giveGems:gemsOf('give'),getGems:gemsOf('get')};save();pres()}
function addNew(){SC=null;RET=null;$('dl').innerHTML='<h3>Новый юнит</h3><input id="nu1" placeholder="Название (EN)"><br><br><input id="nu2" type="number" placeholder="Value"><div class="bar"><button class="p" data-a="nuok">Добавить</button><button data-a="close">Отмена</button></div>';openDl(0)}
function nuok(){const n=$('nu1').value.trim();if(!n)return;S.cu.push({name:n,category:'Custom',kind:'unit',value:+$('nu2').value||0,demand:5,stability:'Stable'});save();$('dl').close();init()}
function chg(){SC=null;RET=null;$('dl').innerHTML='<h3>Изменения цен</h3>'+((D.changelog||[]).map(c=>`<div class="row"><span class="n">${S.fav[c.name]?'<b class="tg">★ </b>':''}${esc(c.name)}<div class="m">${c.date}</div></span><span>${fmt(c.old)} → <b class="${c.new>c.old?'win':'lose'}">${fmt(c.new)}</b></span></div>`).join('')||'<div class="m">Пока нет изменений</div>')+'<br><button data-a="close">Закрыть</button>';openDl(0)}

function inv(){
  $('inv').innerHTML=Object.entries(S.inv).map(([n,q])=>{const u=IDX.get(n),a=AN.get(n),qb=a?` <span class="qb ${a.grade[2]}">${a.grade[1]}</span>`:'';return `<div class="row">${u?imgTag(u,'u'):''}<span class="n" data-a="det" data-n="${esc(n)}" style="cursor:pointer">${esc(n)}${qb}</span><button class="sm" data-a="iq" data-n="${esc(n)}" data-d="-1">−</button><b>${q}</b><button class="sm" data-a="iq" data-n="${esc(n)}" data-d="1">+</button><span class="m">${fmt(val(n)*q)}</span></div>`}).join('')||'<div class="m">Пусто. Добавь юнитов или загрузи скрины.</div>';
  $('tot').textContent='Всего: '+fmt(Object.entries(S.inv).reduce((a,[n,q])=>a+val(n)*q,0));
  const now=Date.now(),dayMs=864e5;
  const pToday=S.hs.filter(h=>now-Date.parse(h.d)<dayMs).reduce((a,h)=>a+h.profit,0);
  const pWeek=S.hs.filter(h=>now-Date.parse(h.d)<dayMs*7).reduce((a,h)=>a+h.profit,0);
  const pAll=S.hs.reduce((a,h)=>a+h.profit,0);
  const pf=(v)=>`<b class="${v>=0?'win':'lose'}">${v>=0?'+':''}${fmt(v)}</b>`;
  $('hsStat').innerHTML=S.hs.length?`Сегодня: ${pf(pToday)} · 7д: ${pf(pWeek)} · Всего: ${pf(pAll)} (клик — повтор)`:'';
  $('hs').innerHTML=S.hs.map((h,i)=>{
    const gSide=[...Object.entries(h.give||{}).map(e=>e[1]+'× '+e[0]),...(h.giveGems?[fmt(h.giveGems)+'💎']:[])].join(', ')||'—';
    const rSide=[...Object.entries(h.get||{}).map(e=>e[1]+'× '+e[0]),...(h.getGems?[fmt(h.getGems)+'💎']:[])].join(', ')||'—';
    return `<div class="row" data-a="repHs" data-k="${i}" style="cursor:pointer" title="Загрузить в калькулятор"><span class="n"><div class="m">${new Date(h.d).toLocaleDateString('ru')}</div>${esc(gSide)} → ${esc(rSide)}</span><b class="${h.profit>=0?'win':'lose'}">${h.profit>=0?'+':''}${fmt(h.profit)}</b></div>`;
  }).join('')||'<div class="m">Пусто</div>';
  invReport();ofr();wl();an();cnt();
}

function invReport(){
  const el=$('irpt');if(!el)return;IDEAS=[];
  const ent=Object.entries(S.inv).map(([n,q])=>{const u=IDX.get(n),a=AN.get(n);return u&&a?{n,q,u,a,v:val(n)||(a.est*(sgOn(n)?1+(S.mk??15)/100:1))}:null}).filter(Boolean);
  if(!ent.length){keepDetails(el,'<details class="ofr-d"><summary>📊 Отчёт и стратегия</summary><div class="m">Добавь юнитов в инвентарь — появится сводка, арбитраж и идеи обмена.</div></details>');return}
  let tot=0,liq=0,wq=0,wv=0,prob=0,rise=0;
  for(const x of ent){const l=x.v*x.q,w=Math.max(10,l);tot+=l;liq+=l*x.a.mult;wq+=x.a.q*w;wv+=w;if(x.a.trend==='down'||x.a.q<30)prob+=l;if(x.a.trend==='up')rise+=l}
  const avgQ=Math.round(wq/(wv||1)),line=l=>l.map(x=>`<div class="row"><span class="n" data-a="det" data-n="${esc(x.n)}" style="cursor:pointer">${x.q>1?x.q+'× ':''}${esc(x.n)} <span class="qb ${x.a.grade[2]}">${x.a.grade[1]}</span><div class="m">${fmt(x.v*x.q)}${Math.abs(x.a.trPct)>=10?` · <span class="${x.a.trPct>0?'win':'lose'}">${x.a.trPct>0?'+':''}${x.a.trPct}%</span>`:''} · спрос ${x.u.demand}/10</div></span></div>`).join('')||'<div class="m">—</div>';
  const sell=ent.filter(x=>x.v>0&&(x.a.trend==='down'||x.a.grade[0]==='trash'||x.a.grade[0]==='drop')).sort((a,b)=>b.v*b.q-a.v*a.q).slice(0,6);
  const hold=ent.filter(x=>x.a.grade[0]==='imba'||x.a.trend==='up').sort((a,b)=>b.v*b.q-a.v*a.q).slice(0,6);
  const flips=ent.filter(x=>x.u.value>0&&x.u.market?.median&&Math.abs(x.u.market.median-x.u.value)/x.u.value>=0.25).map(x=>{const p=Math.round((x.u.market.median-x.u.value)/x.u.value*100);return `${esc(x.n)} (${p>0?`на gg +${p}% — продавай дороже`:`на gg ${p}% — сливай по Vaulted`})`});

  const pool=[];
  for(const x of ent){
    if(x.v<=0)continue;
    const g=x.a.grade[0],isUtil=/Farm|Support/i.test(x.u.role||''),prot=g==='imba'||x.a.trend==='up'||isUtil;
    let pr,cnt;
    if(prot){pr=3;cnt=S.keep1?(x.q-1):x.q}
    else if(g==='trash'||g==='drop'||x.a.trend==='down'){pr=0;cnt=x.q}
    else if(g==='mid'){pr=1;cnt=x.q}
    else{pr=2;cnt=S.keep1?(x.q-1):x.q}
    if(cnt>0)pool.push({n:x.n,v:x.v,cnt,pr});
  }
  pool.sort((a,b)=>a.pr-b.pr||b.v-a.v);
  const combo=(target,vT)=>{const give={};let s=0,pc=0;for(const p of pool){if(p.n===target)continue;for(let k=0;k<p.cnt;k++){if(s>=vT||pc>=8)break;if(s+p.v>vT*1.25&&s+p.v>vT+60)break;give[p.n]=(give[p.n]||0)+1;s+=p.v;pc++}if(s>=vT)break}return(s<vT*.95||!pc)?null:{give,sum:s,pc}};
  const cands=ALL.filter(u=>!isSigned(u)&&u.value>0).map(u=>({u,a:AN.get(u.name)})).filter(c=>c.a&&(c.u.name===S.goal||c.a.q>=62||(c.a.trend==='up'&&c.a.q>=48))).sort((x,y)=>(y.u.name===S.goal)-(x.u.name===S.goal)||(y.a.q+(y.a.trend==='up'?8:0))-(x.a.q+(x.a.trend==='up'?8:0))||y.u.value-x.u.value);
  for(const c of cands){if(IDEAS.length>=5)break;const vT=val(c.u.name),r=combo(c.u.name,vT);if(r)IDEAS.push({t:c.u.name,u:c.u,a:c.a,vT,give:r.give,sum:r.sum,pc:r.pc,goal:c.u.name===S.goal})}
  const ideas=IDEAS.map((it,k)=>{const gs=Object.entries(it.give).map(([n,q])=>(q>1?q+'× ':'')+esc(n)).join(', '),ov=Math.round((it.sum-it.vT)/it.vT*100);
    return `<div class="idea">${imgTag(it.u,'u')}<div class="ib"><b>${it.goal?'[ЦЕЛЬ] ':''}${esc(it.t)}</b> <span class="qb ${it.a.grade[2]}">${it.a.grade[1]}</span> <span class="m">${fmt(it.vT)}${it.a.trend==='up'?' 📈':''}</span><div class="m">Отдать (${it.pc} шт, ${fmt(it.sum)}${ov>0?`, +${ov}%`:''}): ${gs}</div></div><button class="sm p" data-a="invTrade" data-k="${k}">В трейд →</button></div>`}).join('')||'<div class="m">Под текущий инвентарь связок не нашлось (попробуй снять защиту последней копии или докинуть юнитов).</div>';
  keepDetails(el,`<details class="ofr-d"><summary>📊 Отчёт, «срочно сливать» и связки под цель</summary><div class="rg">${sbox('Цена портфеля',fmt(tot))}${sbox('Реально ликвидно',fmt(liq))}${sbox('Среднее качество',avgQ+'/100')}${sbox('Проблемные / растущие',Math.round(prob/(tot||1)*100)+'% / '+Math.round(rise/(tot||1)*100)+'%')}</div><label class="sw"><input type="checkbox" data-c="keep1" ${S.keep1?'checked':''}> Не предлагать отдавать последнюю копию ИМБЫ / Фермы / Саппорта</label><div class="cmp"><div class="cmp-b"><b class="h">Срочно сливать</b>${line(sell)}</div><div class="cmp-b"><b class="h">Лучше придержать</b>${line(hold)}</div></div>${flips.length?`<div class="note"><b class="tg">[ФЛИП / АРБИТРАЖ]</b> Сильный разброс между листами: ${flips.join(' · ')}</div>`:''}<b class="m">🎯 СВЯЗКИ ПОД ЦЕЛЬ</b>${ideas}</details>`);
}
function invTrade(k){const it=IDEAS[k];if(!it)return;S.give={...it.give};S.get={[it.t]:1};S.gems={give:0,get:0};save();if($('dl').open)$('dl').close();calc();tab(0);toast('Связка загружена в трейд');sfx('add')}
/* ================= ПОДСКАЗКИ ОБМЕНА v3: выгода, алерты, контр-оффер, PNG ================= */
let OFS=[],OFM=null,OFR=[];
const ofBad=a=>a.trend==='down'||a.grade[0]==='trash'||a.grade[0]==='drop';
const ofTier={S:4,A:3,B:2,C:1,D:0},ofTr={up:'📈',down:'📉',stable:'➖'};
function ofGood(i){const a=AN.get(i.name);return!!a&&i.kind==='unit'&&!isSigned(i)&&i.value>0&&(i.demand||0)>=6&&a.trend!=='down'&&(a.mRatio>=1.15||a.mult>=1.12)}
const ofMk=c=>({n:c.u.name,v:c.v,q:c.a.q,t:c.u.tier||'',dps:c.u.maxDps||0,d:c.u.demand||0,tr:c.a.trend});
const ofLvl=(nom,real,bad)=>{if(nom<(bad?-.12:-.05)||nom>.15)return'';if(real>=.3)return'🔥 ОЧЕНЬ ВЫГОДНО';if(real>=.12)return'✅ ВЫГОДНО';if(Math.abs(nom)<=.08&&real>=.06)return'🔁 РАВНО, НО ЛУЧШЕ';return''};
/* Все варианты «получаемой стороны»: 1, 2 или 3 юнита из пула, отсортированы по цене (для бинарного поиска) */
function ofTargets(pool){
  const T=[],byQ=[...pool].sort((a,b)=>b.a.q-a.a.q||b.v-a.v),P2=byQ.slice(0,40),P3=byQ.slice(0,22);
  pool.forEach(c=>T.push({c:[c],v:c.v,e:c.e}));
  for(let i=0;i<P2.length;i++)for(let j=i+1;j<P2.length;j++)T.push({c:[P2[i],P2[j]],v:P2[i].v+P2[j].v,e:P2[i].e+P2[j].e});
  for(let i=0;i<P3.length;i++)for(let j=i+1;j<P3.length;j++)for(let k=j+1;k<P3.length;k++)T.push({c:[P3[i],P3[j],P3[k]],v:P3[i].v+P3[j].v+P3[k].v,e:P3[i].e+P3[j].e+P3[k].e});
  return T.sort((a,b)=>a.v-b.v);
}
/* Лучший вариант «что взять» за сумму s (реальная ценность eS). giveN — сколько штук отдаём, excl — имена, которые брать нельзя */
function ofFind(T,s,eS,bad,giveN,excl,maxN,gQ,topN=1,allow11=0){
  const lo=s*(bad?.88:.95),hi=s*1.15;let a=0,b=T.length;
  while(a<b){const m=(a+b)>>1;if(T[m].v<lo)a=m+1;else b=m}
  const out=[];
  for(let i=a;i<T.length&&T[i].v<=hi;i++){
    const t=T[i],n=t.c.length;
    if(n>maxN||(n===1&&giveN===1&&!allow11))continue;
    if(t.c.some(c=>excl.has(c.u.name)))continue;
    const nom=(t.v-s)/s,real=(t.e-eS)/eS,l=ofLvl(nom,real,bad);if(!l)continue;
    const tq=t.c.reduce((x,c)=>x+c.a.q*c.v,0)/t.v;
    const sc=real*100+(n<giveN?3*(giveN-n):0)+(tq-gQ)/6;
    out.push({t,nom,real,l,sc,tq});
  }
  return out.sort((x,y)=>y.sc-x.sc).slice(0,topN);
}
function ofPool(){
  return ALL.filter(u=>u.kind==='unit'&&u.category!=='Signed').map(u=>{const a=AN.get(u.name),v=val(u.name);return a&&v>=15?{u,a,v,e:v*a.mult}:null})
    .filter(c=>c&&(c.u.demand||0)>=4.5&&c.a.trend!=='down'&&!c.u.flags.some(f=>/Dropping|Unwanted/.test(f)));
}
function ofOpts(x,pool,n=2){
  if(x.v<15)return[];
  const xe=x.v*x.a.mult,bad=ofBad(x.a);
  const lvl=(nom,real)=>{if(nom<(bad?-.12:-.05)||nom>.15)return'';if(real>=.3)return'🔥 ОЧЕНЬ ВЫГОДНО';if(real>=.12)return'✅ ВЫГОДНО';if(Math.abs(nom)<=.08&&real>=.06)return'🔁 РАВНО, НО ЛУЧШЕ';return''};
  return pool.filter(c=>c.u.name!==x.n).map(c=>{
    const nom=(c.v-x.v)/x.v,real=(c.e-xe)/xe,l=lvl(nom,real);if(!l)return null;
    const why=[],dd=(c.u.demand||0)-(x.u.demand||0),pw=c.u.tier&&x.u.tier?ofTier[c.u.tier]-ofTier[x.u.tier]:0;
    if(Math.abs(dd)>=1.5)why.push('спрос '+x.u.demand+'→'+c.u.demand);
    if(c.a.trend!==x.a.trend)why.push(ofTr[x.a.trend]+'→'+ofTr[c.a.trend]);
    if(pw>0)why.push('сильнее в игре ('+c.u.tier+')');
    return{...ofMk(c),lvl:l,why:why.join(' · '),nom:Math.round(nom*100),s:real*100+pw*2};
  }).filter(Boolean).sort((p,q)=>q.s-p.s).slice(0,n);
}
function ofAlerts(ent){
  const out=[],seen=new Set(),names=new Set([...Object.keys(S.inv),S.goal].filter(Boolean)),t0=Date.parse(D.updated||'')||Date.now();
  [...(D.changelog||[])].sort((x,y)=>String(y.date).localeCompare(String(x.date))).forEach(c=>{
    if(!names.has(c.name)||seen.has(c.name)||!(c.old>0)||!(c.new>0)||t0-Date.parse(c.date)>3*864e5)return;
    const p=Math.round((c.new-c.old)/c.old*100);if(Math.abs(p)<7)return;seen.add(c.name);
    const x=ent.find(e=>e.n===c.name),soft=p<0&&p>-20&&x&&!x.bad&&x.a.grade[0]==='imba';
    out.push({n:c.name,k:p<0&&!soft?'bad':'ok',t:`${c.name}: ${fmt(c.old)} → ${fmt(c.new)} (${p>0?'+':''}${p}%). ${soft?'Просел, но юнит сильный: следи за ценой.':p<0?'Пора сливать, пока не упал ещё.':'Держи или продавай дороже.'}`});
  });
  ent.forEach(x=>{if(seen.has(x.n)||x.v<15||Math.abs(x.a.trPct)<15)return;seen.add(x.n);const p=x.a.trPct;out.push({n:x.n,k:p<0?'bad':'ok',t:`${x.n}: ${p>0?'+':''}${p}% за 14 дней. ${p<0?'Падает, подумай о сливе.':'Растёт, не торопись сливать.'}`})});
  return out.sort((a,b)=>(a.k==='bad'?0:1)-(b.k==='bad'?0:1)).slice(0,5);
}
function ofEvalParts(parts,cnt,T,topN=1,allow11=0){
  const s0=parts.reduce((a,p)=>a+p.x.v*p.k,0),eS=parts.reduce((a,p)=>a+p.x.v*p.k*p.x.a.mult,0);
  if(!(s0>0))return[];
  const bad=parts.reduce((a,p)=>a+(ofBad(p.x.a)?p.x.v*p.k:0),0)>=s0*.5;
  const gQ=parts.reduce((a,p)=>a+p.x.a.q*p.x.v*p.k,0)/s0,excl=new Set(parts.map(p=>p.x.n));
  const give={};parts.forEach(p=>give[p.x.n]=p.k);
  const gD=parts.reduce((a,p)=>a+(p.x.u.demand||0)*p.x.v*p.k,0)/s0;
  return ofFind(T,s0,eS,bad,cnt,excl,Math.min(3,Math.max(2,cnt)),gQ,topN,allow11).map(r=>{
    const tD=r.t.c.reduce((a,c)=>a+(c.u.demand||0)*c.v,0)/r.t.v,why=[];
    if(r.t.c.length<cnt)why.push(cnt+' шт → '+r.t.c.length+': меньше слотов, сильнее юниты');
    if(Math.abs(tD-gD)>=1)why.push('спрос '+gD.toFixed(1)+'→'+tD.toFixed(1));
    if(r.tq-gQ>=6)why.push('качество '+Math.round(gQ)+'→'+Math.round(r.tq));
    return{give,giveN:cnt,get:r.t.c.map(c=>({n:c.u.name,v:c.v,tr:c.a.trend})),s:s0,tv:r.t.v,nom:Math.round(r.nom*100),g:Math.round(r.real*100),lvl:r.l,why:why.join(' · '),sc:r.sc};
  });
}
function ofModel(){
  const row=u=>{const a=AN.get(u.name),v=val(u.name);return a?{u,a,v,e:v*a.mult}:null};
  const allT=ALL.filter(u=>u.kind==='unit'&&u.category!=='Signed').map(row).filter(Boolean);
  const pool=ofPool();
  const ent=Object.entries(S.inv).map(([n,q])=>{
    const u=IDX.get(n),a=AN.get(n);if(!u||!a)return null;
    let v=val(n)||a.est,est=false;
    if(!v&&isSigned(u)){const b=baseOf(u);if(b&&b.value>0){v=b.value*(1+(S.mk??15)/100);est=true}}
    return v>0?{n,q,u,a,v,est}:null}).filter(Boolean).sort((x,y)=>y.v*y.q-x.v*x.q).slice(0,30);
  const items=ent.map(x=>{
    const bad=ofBad(x.a),tiny=x.v<15;
    return{n:x.n,q:x.q,v:x.v,est:x.est,sg:sgOn(x.n),grade:x.a.grade[1],gc:x.a.grade[2],tr:x.a.trPct,bad,hold:x.a.grade[0]==='imba'||x.a.trend==='up',tiny,opts:ofOpts(x,pool,2)};
  });
  /* Связки из инвентаря: от 1 до 6 штук (с учётом количества копий) → 1, 2 или 3 юнита */
  const un=ent.filter(x=>x.u.kind==='unit'&&x.v>=15).slice(0,10),T=ofTargets(pool),found=[];
  const evalCombo=(parts,cnt)=>found.push(...ofEvalParts(parts,cnt,T));
  const rec=(i,parts,cnt)=>{
    if(i===un.length){if(cnt>=1)evalCombo(parts,cnt);return}
    rec(i+1,parts,cnt);
    for(let k=1;k<=un[i].q&&cnt+k<=6;k++)rec(i+1,[...parts,{x:un[i],k}],cnt+k);
  };
  rec(0,[],0);
  found.sort((x,y)=>y.sc-x.sc);
  const combos=[],usedGet=new Set(),usedGive={};
  for(const f of found){
    const gk=f.get.map(g=>g.n).sort().join('|');if(usedGet.has(gk))continue;
    const names=Object.keys(f.give);if(names.some(n=>(usedGive[n]||0)>=3))continue;
    usedGet.add(gk);names.forEach(n=>usedGive[n]=(usedGive[n]||0)+1);combos.push(f);if(combos.length>=8)break;
  }
  const gems=Math.max(0,Math.round(+S.ofg||0));
  const gemBuy=gems>0?pool.filter(c=>c.v<=gems&&c.v>=gems*.5&&c.a.mult>=1.05).sort((x,y)=>y.a.mult-x.a.mult||y.a.q-x.a.q).slice(0,3).map(c=>({...ofMk(c),g:Math.round((c.a.mult-1)*100)})):[];
  const rk=(f,s,n)=>allT.filter(f).sort(s).slice(0,n).map(ofMk),dps=(a,b)=>(b.u.maxDps||0)-(a.u.maxDps||0);
  const top=[
    ['⚔ Лучший урон',rk(c=>c.u.maxDps>0&&/Damage/.test(c.u.role||''),dps,6)],
    ['🗿 Титаны',rk(c=>/titan/i.test(c.u.name)&&c.u.maxDps>0,dps,5)],
    ['💰 Фарм и саппорт',rk(c=>/Farm|Spawner|Support/.test(c.u.role||'')&&c.v>0,(a,b)=>b.v-a.v,5)],
    ['🌱 Ранние и дешёвые',rk(c=>/^(Common|Uncommon|Rare|Epic|Legendary)$/.test(c.u.category)&&c.u.maxDps>0,dps,5)],
    ['💎 Выгодно брать сейчас',rk(c=>ofGood(c.u),(a,b)=>b.a.q-a.a.q||b.v-a.v,6)],
    ['📈 Ходовые в трейде',rk(c=>c.v>0&&(c.a.trend==='up'||c.a.q>=70),(a,b)=>b.a.q-a.a.q||b.v-a.v,6)]
  ];
  return{upd:D.updated||'',items,combos,gems,gemBuy,top,alerts:ofAlerts(ent),ent,T};
}
const ofTopRow=r=>`<div class="row">${imgTag(IDX.get(r.n),'u')}<span class="n" data-a="det" data-n="${esc(r.n)}" style="cursor:pointer">${esc(r.n)} ${r.t?`<span class="qb">TIER ${r.t}</span>`:''}<div class="m">${r.dps?'DPS '+fmt(r.dps)+' · ':''}${r.v?fmt(r.v)+' · ':''}спрос ${r.d}/10 ${ofTr[r.tr]}</div></span></div>`;
const ofAlHtml=a=>`<div class="${a.k==='bad'?'bad':'note'}"><b class="${a.k==='bad'?'lose':'win'}">${a.k==='bad'?'[✕]':'[+]'}</b> ${esc(a.t)}</div>`;
const ofIm=(u,c='of-im')=>u&&u.img?`<img class="${c}" src="${esc(u.img)}" loading="lazy" onerror="this.outerHTML='<div class=\\'${c} ph\\'>?</div>'">`:`<div class="${c} ph">?</div>`;
const ofTile=(n,q,v)=>{const u=IDX.get(n);return`<div class="of-u r-${esc(u?.category||'')}" data-a="det" data-n="${esc(n)}">${ofIm(u)}${q>1?`<b class="of-q">×${q}</b>`:''}<span class="of-n">${esc(n)}</span><i>${fmt(v)}</i></div>`};
function ofCard(o,k){
  const gt=o.gems?`<div class="of-u"><div class="of-im ph">💎</div><span class="of-n">Гемы</span><i>${fmt(o.gems)}</i></div>`:Object.entries(o.give).map(([n,q])=>ofTile(n,q,val(n)||AN.get(n)?.est||0)).join('');
  const rt=o.get.map(x=>ofTile(x.n,1,x.v)).join('');
  return`<div class="of-card ${/ОЧЕНЬ/.test(o.lvl)?'hot':''}"><div class="of-top"><b class="of-lvl">${o.lvl}</b>${o.g!=null?`<span class="of-pct">+${o.g}% реально</span>`:''}</div><div class="of-flow"><div class="of-side">${gt}</div><div class="of-arr">➜</div><div class="of-side">${rt}</div></div><div class="of-sum">${fmt(o.s)} → <b>${fmt(o.tv)}</b> <span class="m">(${o.nom>=0?'+':''}${o.nom}% по цене)</span></div>${o.why?`<div class="m">${esc(o.why)}</div>`:''}<button class="p of-go" data-a="ofTrade" data-k="${k}">В трейд →</button></div>`;
}
function keepDetails(el,html){
  const key=d=>(d.querySelector('summary')?.textContent||'').replace(/[\d()]/g,'').trim(),st=new Set([...el.querySelectorAll('details')].filter(d=>d.open).map(key));
  el.innerHTML=html;el.querySelectorAll('details').forEach(d=>{if(st.has(key(d)))d.open=true});
}
function ofSelObj(ent){const o={},src=S.ofSel||{};ent.forEach(x=>{const k=Math.min(x.q,Math.max(0,src[x.n]|0));if(k)o[x.n]=k});return o}
function ofr(){
  const el=$('ofr');if(!el)return;OFS=[];const m=OFM=ofModel();
  const card=o=>{const g={};o.get.forEach(x=>g[x.n]=(g[x.n]||0)+1);OFS.push({give:o.gems?{}:o.give,gemsGive:o.gems||0,get:g});return ofCard(o,OFS.length-1)};
  const sel=ofSelObj(m.ent),selN=Object.values(sel).reduce((a,b)=>a+b,0);
  const picks=m.ent.map(x=>{const k=sel[x.n]||0;return`<div class="of-pt r-${esc(x.u.category)} ${k?'sel':''}" data-a="ofSel" data-n="${esc(x.n)}">${ofIm(x.u)}<b class="of-pq">${k?k+'/'+x.q:'×'+x.q}</b><span class="of-n">${esc(x.n)}</span><i>${fmt(x.v)}</i><em class="qb ${x.a.grade[2]}">${x.a.grade[1]}</em></div>`}).join('')||'<div class="m">Добавь юнитов в инвентарь.</div>';
  let res='';
  if(selN){
    const parts=m.ent.filter(x=>sel[x.n]).map(x=>({x,k:sel[x.n]})),sv=parts.reduce((a,p)=>a+p.x.v*p.k,0);
    const full=ofEvalParts(parts,selN,m.T,4,1),subs=[];
    if(selN>1){const rec=(i,cur,c)=>{if(i===parts.length){if(c>=1&&c<selN)subs.push(...ofEvalParts(cur,c,m.T,1,1));return}rec(i+1,cur,c);for(let k=1;k<=parts[i].k;k++)rec(i+1,[...cur,{x:parts[i].x,k}],c+k)};rec(0,[],0)}
    subs.sort((a,b)=>b.sc-a.sc);const seen=new Set(),subTop=subs.filter(f=>{const gk=f.get.map(g=>g.n).sort().join('|');return seen.has(gk)?0:seen.add(gk)}).slice(0,4);
    res=`<div class="of-h">Выбрано: ${selN} шт · ${fmt(sv)}</div>`
      +(full.length?`<div class="of-h">Что взять за всю связку</div>${full.map(card).join('')}`:'<div class="warn">За всю связку целиком выгодного обмена не нашёл.</div>')
      +(subTop.length?`<div class="of-h">Можно выгоднее: разбить связку</div>${subTop.map(card).join('')}`:'');
  }else{
    res=m.combos.length?`<div class="of-h">Лучшие обмены из твоего инвентаря</div>${m.combos.slice(0,5).map(card).join('')}`:'<div class="warn">Сейчас выгодных обменов нет. Выбери юнитов выше — проверю любую связку.</div>';
  }
  const al=m.alerts.length?`<details class="ofr-d"><summary>🔔 Изменения цен у тебя (${m.alerts.length})</summary>${m.alerts.map(ofAlHtml).join('')}</details>`:'';
  const sg=m.items.filter(r=>!r.tiny&&r.opts.length).slice(0,10),sgN=sg.reduce((a,r)=>a+r.opts.length,0);
  const singles=`<details class="ofr-d"><summary>🔁 Замены по одному юниту (${sgN})</summary>${sg.map(r=>r.opts.map(o=>card({give:{[r.n]:1},get:[{n:o.n,v:o.v}],s:r.v,tv:o.v,nom:o.nom,lvl:o.lvl,why:o.why})).join('')).join('')||'<div class="m">Выгодных замен по одному нет.</div>'}</details>`;
  const gems=`<details class="ofr-d"><summary>💎 Что взять за гемы</summary><div class="ofr-c"><span class="lb">Гемы на руках</span><input type="number" min="0" inputmode="numeric" data-c="ofg" value="${m.gems||''}" placeholder="сколько гемов" style="width:130px"></div>${m.gemBuy.map(t=>card({gems:Math.round(t.v),give:{},get:[{n:t.n,v:t.v}],s:Math.round(t.v),tv:t.v,nom:0,g:t.g,lvl:'💎 ЗА ГЕМЫ',why:''})).join('')}</details>`;
  const top=`<details class="ofr-d"><summary>🏆 Топ юнитов по классам</summary>${m.top.map(([t,l])=>`<div class="ofr-c"><span class="lb">${t}</span></div>${l.map(ofTopRow).join('')||'<div class="m">—</div>'}`).join('')}</details>`;
  keepDetails(el,`<h3>Что менять</h3><div class="m">Нажимай на юнитов, которых готов отдать (ещё тап — ещё копия). Ниже покажу, на что их выгодно менять.</div><div class="of-pick">${picks}</div><div class="bar"><button data-a="ofClr">Сбросить выбор</button><button data-a="ofWeak">Выбрать слабых</button></div>${res}${al}${singles}${gems}${top}<div class="bar"><button class="p" data-a="ofDl">⬇ Заметка</button><button data-a="ofPng">🖼 PNG</button><button data-a="ofCp">📋 Текст</button></div>`);
}
function ofReplHtml(GR){
  OFR=[];if(!GR||!GR.list)return'';const pool=ofPool().filter(c=>!S.give[c.u.name]&&!S.get[c.u.name]),rows=[];
  for(const x of GR.list){
    if(!x.a||!ofBad(x.a)||!(S.get[x.n]>0))continue;const v=val(x.n);if(v<15)continue;
    const o=ofOpts({n:x.n,u:x.u,a:x.a,v},pool,1)[0];if(!o)continue;
    OFR.push({from:x.n,to:o.n});
    rows.push(`<div class="row"><span class="n">Вместо <b>${esc(x.n)}</b> ${ofTr[x.a.trend]} проси <b>${esc(o.n)}</b> <span class="m">${fmt(o.v)}</span><div class="m">${o.lvl}${o.why?' · '+esc(o.why):''}</div></span><button class="sm" data-a="ofRepl" data-k="${OFR.length-1}">Заменить</button></div>`);
  }
  return rows.length?`<div class="adv" style="border-color:var(--y)"><b>Замени слабое у партнёра</b>${rows.join('')}</div>`:'';
}
let OFB=[];
function ofBundleHtml(){
  OFB=[];if(pos(S.get))return'';
  const ge=Object.entries(S.give).filter(([n,q])=>q>0&&IDX.get(n)&&AN.get(n)&&val(n)>0);
  if(!ge.length)return'';
  let v=0,e=0,bv=0,pc=0;ge.forEach(([n,q])=>{const x=val(n)*q;v+=x;e+=x*AN.get(n).mult;pc+=q;if(ofBad(AN.get(n)))bv+=x});
  if(v<15)return'';
  const bad=bv>=v*.5,pool=ofPool().filter(c=>!S.give[c.u.name]);
  const gQ=ge.reduce((a,[n,q])=>a+AN.get(n).q*val(n)*q,0)/v,excl=new Set(ge.map(([n])=>n));
  const best=ofFind(ofTargets(pool),v,e,bad,pc,excl,3,gQ,5,1).map(r=>({names:r.t.c.map(c=>c.u.name),sum:r.t.v,nom:r.nom,l:r.l}));
  const list=ge.map(([n,q])=>(q>1?q+'× ':'')+esc(n)).join(' + ');
  return`<div class="adv" style="border-color:var(--g)"><b>Что взять за связку (${pc} шт, ${fmt(v)} 💎)</b><div class="m">${list}</div>${best.map(o=>{OFB.push(o.names);return`<div class="row"><span class="n">${o.names.map(esc).join(' + ')}<div class="m">${o.l} · ${fmt(o.sum)} (${o.nom>=0?'+':''}${Math.round(o.nom*100)}% по цене)</div></span><button class="sm" data-a="ofBun" data-k="${OFB.length-1}">+ Получу</button></div>`}).join('')||'<div class="m">Выгодных вариантов под эту связку нет: торгуйся по цене или держи.</div>'}</div>`;
}
function ofBun(k){const o=OFB[k];if(!o)return;S.get={};o.forEach(n=>S.get[n]=(S.get[n]||0)+1);save();calc();sfx('add')}
function ofRepl(k){const o=OFR[k];if(!o)return;S.get[o.from]=(S.get[o.from]||1)-1;if(S.get[o.from]<=0)delete S.get[o.from];S.get[o.to]=(S.get[o.to]||0)+1;save();calc();sfx('add')}
function ofTrade(k){const o=OFS[k];if(!o)return;S.give={...(o.give||{})};S.get=o.get?{...o.get}:o.t?{[o.t]:1}:{};S.gems={give:o.gemsGive||0,get:0};save();if($('dl').open)$('dl').close();calc();tab(0);toast('Предложение загружено в трейд');sfx('add')}
function ofTxt(m){
  const L=['CTD TRADER: ЧТО МЕНЯТЬ ('+String(m.upd).slice(0,10)+')',''];
  m.alerts.forEach(a=>L.push((a.k==='bad'?'[!] ':'[+] ')+a.t));if(m.alerts.length)L.push('');
  m.items.forEach(r=>{L.push((r.q>1?r.q+'x ':'')+r.n+' ('+(r.est?'~':'')+fmt(r.v)+') '+r.grade+(r.bad?' [СЛИВАЙ]':r.hold?' [ДЕРЖИ]':''));r.opts.forEach(o=>L.push('  '+o.lvl+': '+o.n+' ('+fmt(o.v)+', '+(o.nom>=0?'+':'')+o.nom+'% по цене'+(o.why?'; '+o.why:'')+')'));if(!r.opts.length&&!r.tiny)L.push('  выгодных замен нет')});
  if(m.combos.length){L.push('','Связки:');m.combos.forEach(p=>L.push('  '+Object.entries(p.give).map(([n,q])=>(q>1?q+'x ':'')+n).join(' + ')+' → '+p.get.map(x=>x.n).join(' + ')+' ('+p.lvl+', +'+p.g+'% реально)'))}
  if(m.gems)L.push('','Гемы '+fmt(m.gems)+': '+(m.gemBuy.length?m.gemBuy.map(t=>t.n+' ('+fmt(t.v)+')').join(', '):'ничего выгодного'));
  L.push('');m.top.forEach(([t,l])=>L.push(t+': '+l.map(r=>r.n+(r.dps?' '+fmt(r.dps):'')).join(', ')));
  return L.join('\n');
}
function ofSave(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000)}
function ofDl(){
  const m=OFM;if(!m)return;
  const trow=r=>`<div class="t"><b>${esc(r.n)}</b> <small>${r.t?'TIER '+r.t+' · ':''}${r.dps?'DPS '+fmt(r.dps)+' · ':''}${r.v?fmt(r.v)+' · ':''}спрос ${r.d} ${ofTr[r.tr]}</small></div>`;
  const al=m.alerts.map(a=>`<div class="c ${a.k==='bad'?'b':''}">${a.k==='bad'?'🔔':'📈'} ${esc(a.t)}</div>`).join('');
  const body=m.items.map(r=>`<div class="c ${r.bad?'b':''}"><b>${r.q>1?r.q+'× ':''}${esc(r.n)}</b> <small>${r.est?'~':''}${fmt(r.v)} · ${r.grade}${r.tr?' · '+(r.tr>0?'+':'')+r.tr+'%':''}</small> ${r.bad?'<em class="r">СЛИВАЙ</em>':r.hold?'<em>ДЕРЖИ</em>':''}${r.opts.map(o=>`<div class="o"><span>${o.lvl}</span><b>${esc(o.n)}</b> <small>${fmt(o.v)} · ${o.nom>=0?'+':''}${o.nom}% по цене${o.why?' · '+esc(o.why):''}</small></div>`).join('')||(r.tiny?'<div class="o"><small>Мелочь</small></div>':'<div class="o"><small>Выгодных замен нет</small></div>')}</div>`).join('');
  const pr=m.combos.length?'<h2>🤝 Связки</h2>'+m.combos.map(p=>`<div class="c">${Object.entries(p.give).map(([n,q])=>(q>1?q+'× ':'')+esc(n)).join(' + ')} <small>${fmt(p.s)}</small> → <b>${p.get.map(x=>esc(x.n)).join(' + ')}</b> <small>${fmt(p.tv)} · ${p.lvl} · +${p.g}% реальной ценности</small></div>`).join(''):'';
  const gm=m.gems?`<h2>💎 ${fmt(m.gems)} гемов</h2><div class="c">${m.gemBuy.length?m.gemBuy.map(t=>`<div class="o"><b>${esc(t.n)}</b> <small>${fmt(t.v)} · реально дороже на ${t.g}%</small></div>`).join(''):'<small>Ничего выгодного.</small>'}</div>`:'';
  const tp='<h2>🏆 Топ юнитов</h2>'+m.top.map(([t,l])=>`<div class="c"><span>${t}</span>${l.map(trow).join('')||'—'}</div>`).join('');
  const h=`<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CTD: что менять</title><style>body{margin:0;background:#020a05;color:#b6ffd0;font:14px/1.5 ui-monospace,Menlo,monospace}main{max-width:720px;margin:auto;padding:14px}h1{font-size:19px;color:#3dff8a;margin:0}h2{font-size:14px;color:#3dff8a;margin:16px 0 4px}p{color:#6fae86;font-size:12px;margin:2px 0 10px}.c{border:1px solid #1f6b3e;border-left:3px solid #3dff8a;background:#07140d;border-radius:6px;padding:8px 10px;margin:7px 0}.c.b{border-left-color:#ff2e63}.c b{color:#fff}small{color:#6fae86}em{font-style:normal;font-size:11px;padding:1px 6px;border-radius:5px;background:#0f5a2f;color:#8dffbb}em.r{background:#6b1d1d;color:#ffb0b0}.o,.t{margin-top:4px}.o span,.c>span{display:block;font-size:10.5px;color:#6fae86;text-transform:uppercase;letter-spacing:.06em}</style><main><h1>💡 Что менять · CTD Trader</h1><p>Цены от ${esc(String(m.upd).slice(0,10))}. Ориентир, не гарантия: спрос и цены меняются. Реальная ценность = цена с поправкой на спрос, тренд и флаги.</p>${al}${body}${pr}${gm}${tp}</main></html>`;
  ofSave(new Blob([h],{type:'text/html'}),'ctd-note-'+new Date().toISOString().slice(0,10)+'.html');toast('Заметка скачана');
}
function ofPng(){
  const m=OFM;if(!m)return;
  const W=1000,P=30,cv=document.createElement('canvas'),cx=cv.getContext('2d'),L=[];
  const add=(t,c='#b6ffd0',s=24,b=0)=>{cx.font=(b?'700 ':'')+s+'px ui-monospace,Menlo,monospace';let line='';for(const w of String(t).split(' ')){const tt=line?line+' '+w:w;if(cx.measureText(tt).width>W-P*2&&line){L.push({t:line,c,s,b});line='   '+w}else line=tt}L.push({t:line,c,s,b})};
  add('💡 Что менять · CTD Trader','#3dff8a',36,1);add('Цены от '+String(m.upd).slice(0,10)+' · ориентир, не гарантия','#6fae86',20);L.push({t:'',s:10});
  m.alerts.forEach(a=>add((a.k==='bad'?'🔔 ':'📈 ')+a.t,a.k==='bad'?'#ff9aa9':'#8dffbb',22));if(m.alerts.length)L.push({t:'',s:10});
  m.items.slice(0,10).forEach(r=>{add((r.q>1?r.q+'× ':'')+r.n+'  '+(r.est?'~':'')+fmt(r.v)+'  '+r.grade+(r.bad?'  СЛИВАЙ':r.hold?'  ДЕРЖИ':''),r.bad?'#ff9aa9':'#ffffff',26,1);
    if(r.opts.length)r.opts.forEach(o=>add('   '+o.lvl+': '+o.n+' ('+fmt(o.v)+', '+(o.nom>=0?'+':'')+o.nom+'%'+(o.why?', '+o.why:'')+')','#b6ffd0',21));else add('   выгодных замен нет','#6fae86',20)});
  if(m.combos.length){L.push({t:'',s:10});add('🤝 Связки','#3dff8a',26,1);m.combos.forEach(p=>add('   '+Object.entries(p.give).map(([n,q])=>(q>1?q+'× ':'')+n).join(' + ')+' → '+p.get.map(x=>x.n).join(' + ')+' (+'+p.g+'%)','#b6ffd0',21))}
  if(m.gems){L.push({t:'',s:10});add('💎 Гемы '+fmt(m.gems)+': '+(m.gemBuy.length?m.gemBuy.map(t=>t.n+' ('+fmt(t.v)+')').join(', '):'ничего выгодного'),'#b6ffd0',22)}
  const H=P*2+L.reduce((a,l)=>a+l.s*1.45,0);cv.width=W;cv.height=Math.min(9000,Math.ceil(H));
  cx.fillStyle='#020a05';cx.fillRect(0,0,W,cv.height);cx.strokeStyle='#1f6b3e';cx.lineWidth=3;cx.strokeRect(6,6,W-12,cv.height-12);cx.textBaseline='top';
  let y=P;L.forEach(l=>{if(l.t){cx.font=(l.b?'700 ':'')+l.s+'px ui-monospace,Menlo,monospace';cx.fillStyle=l.c;cx.fillText(l.t,P,y)}y+=l.s*1.45});
  const name='ctd-note-'+new Date().toISOString().slice(0,10)+'.png';
  cv.toBlob(b=>{if(!b)return toast('Не удалось создать PNG');const f=new File([b],name,{type:'image/png'});
    if(navigator.canShare?.({files:[f]}))navigator.share({files:[f],title:'CTD: что менять'}).catch(()=>ofSave(b,name));else{ofSave(b,name);toast('PNG скачан')}},'image/png');
}
const ofCp=()=>{if(!OFM)return;const t=ofTxt(OFM);(navigator.clipboard?.writeText(t)||Promise.reject()).then(()=>toast('Скопировано'),()=>toast('Не удалось скопировать'))};

const iq=(n,d)=>{S.inv[n]=(S.inv[n]||0)+d;if(S.inv[n]<=0)delete S.inv[n];save();inv()};
function wl(){
  const g=S.goal&&IDX.get(S.goal),have=Object.entries(S.inv).reduce((a,[n,q])=>a+val(n)*q,0);let h='<h3>Цель</h3>';
  if(g){const gv=val(g.name),pc=Math.min(100,gv?have/gv*100:100);h+=`<div class="row"><span class="n" data-a="det" data-n="${esc(g.name)}" style="cursor:pointer"><b>${esc(g.name)}</b><div class="m">Цена ${fmt(gv)} · в инвентаре ${fmt(have)}</div></span><button class="sm" data-a="goalx">${I('x')}</button></div><i class="db"><i style="width:${pc}%"></i></i><div class="m">Покрыто ${pc.toFixed(0)}% · не хватает ${fmt(Math.max(0,gv-have))}</div>`}else h+='<div class="m">Цель не выбрана</div>';
  $('wl').innerHTML=h+'<div class="bar"><button data-a="pick" data-m="goal">Выбрать цель</button></div>';
}
function an(){
  const h=[...S.hs].reverse();let c=0;const pts=h.map(x=>c+=x.profit),w=h.filter(x=>x.profit>0).length,best=h.length?Math.max(...h.map(x=>x.profit)):0;let g='<div class="m">Для графика нужно минимум 2 сделки</div>';
  if(pts.length>1){const mn=Math.min(0,...pts),sp=(Math.max(0,...pts)-mn)||1,X=i=>10+i*280/(pts.length-1),Y=v=>100-(v-mn)/sp*90;g=`<svg class="chart" viewBox="0 0 300 110" style="color:var(--m);filter:drop-shadow(0 0 4px var(--g))"><line x1="10" x2="290" y1="${Y(0)}" y2="${Y(0)}" stroke="currentColor" opacity=".25" stroke-dasharray="3 4"/><polyline fill="none" stroke="var(--g)" stroke-width="2.2" stroke-linejoin="round" points="${pts.map((v,i)=>X(i).toFixed(1)+','+Y(v).toFixed(1)).join(' ')}"/></svg>`}
  $('an').innerHTML=`<h3>Аналитика</h3>${g}${kv('Сделок',h.length)}${kv('Winrate',h.length?Math.round(w/h.length*100)+'%':'—')}${kv('Лучший трейд',h.length?(best>0?'+':'')+fmt(best):'—')}${kv('Итого',(c>0?'+':'')+fmt(c))}`;
}

function ad(){
  document.querySelectorAll('#adst button').forEach(b=>b.classList.toggle('on',b.dataset.v===S.adSt));
  const cb=document.querySelector('input[data-c="adCmp"]');if(cb)cb.checked=!!S.adCmp;
  const fv=v=>S.adCmp?cfmt(v):fmt(v);
  const f=s=>{
    const arr=Object.entries(S[s]).map(([n,q])=>(q>1?q+'x ':'')+(sgOn(n)?'Signed ':'')+n);
    const gm=gemsOf(s);if(gm)arr.push(fv(gm)+' gems');
    return arr.join(', ')||'—';
  };
  const gv=fv(sum('give')),rv=fv(sum('get'));
  const tail=S.adSt==='upg'?' [LF UPGRADE]':S.adSt==='nlf'?' [NLF dropping/unwanted]':'';
  $('a1').value=`Trading ${f('give')} (${gv}) for ${f('get')}${S.adSt==='nlf'?' | NLF trash/dropping':S.adSt==='upg'?' | LF Upgrade':''}`;
  $('a2').value=`[ TRADE${tail} ]\nОТДАЮ >> ${f('give')} (${gv})\nИЩУ >> ${f('get')}${sum('get')?` (${rv})`:''}\nПиши в ЛС`;
}
const cp=id=>{$(id).select();navigator.clipboard?.writeText($(id).value);toast('Скопировано')};
const cpTxt=tx=>{navigator.clipboard?.writeText(tx).catch(()=>{});toast('Скопировано: '+tx);sfx('add')};
const exp=()=>{$('io').value=JSON.stringify({...S,gist:{}})};
function imp(){try{const j=JSON.parse($('io').value);S=Object.assign({},S0,j,{gist:S.gist});S.gems=Object.assign({give:0,get:0},S.gems);save();init();toast('Импортировано')}catch{toast('Неверный JSON')}}
const gh=()=>({Authorization:'Bearer '+S.gist.t,Accept:'application/vnd.github+json'});
async function gsave(){
  S.gist={t:$('gt').value,i:$('gi').value};save();const files={'ctd-profile.json':{content:JSON.stringify({...S,gist:{}})}};
  try{let r;if(S.gist.i)r=await fetch('https://api.github.com/gists/'+S.gist.i,{method:'PATCH',headers:gh(),body:JSON.stringify({files})});
    else r=await fetch('https://api.github.com/gists',{method:'POST',headers:gh(),body:JSON.stringify({public:false,description:'CTD profile',files})});
    const j=await r.json();if(!r.ok)throw j.message;S.gist.i=j.id;$('gi').value=j.id;save();$('gm').textContent='Сохранено ✓'}catch(e){$('gm').textContent='Ошибка: '+e}
}
async function gload(){
  S.gist={t:$('gt').value,i:$('gi').value};
  try{const r=await fetch('https://api.github.com/gists/'+S.gist.i,{headers:gh()}),j=await r.json();if(!r.ok)throw j.message;const g=S.gist;S=Object.assign({},S0,JSON.parse(j.files['ctd-profile.json'].content),{gist:g});S.gems=Object.assign({give:0,get:0},S.gems);save();init();$('gm').textContent='Загружено ✓'}catch(e){$('gm').textContent='Ошибка: '+e}
}

const ACT={
  tab:el=>{tab(+el.dataset.i)},th:el=>setTh(el.dataset.t),lite:()=>{S.lite=S.lite?0:1;save();applyLite();toast(S.lite?'Lite-режим ВКЛ (без лагов)':'Полные эффекты ВКЛ');sfx('tap')},
  snd:()=>{S.snd=S.snd?0:1;save();sndI();sfx('add')},
  pick:el=>{SC=null;SC_SLOT=null;RET=null;pick(el.dataset.m)},pk:el=>pk(el.dataset.n,1),pk5:el=>pk(el.dataset.n,5),pkDec:el=>pkDec(el.dataset.n),invTrade:el=>invTrade(+el.dataset.k),
  pkf:el=>{PKF=el.dataset.f;document.querySelectorAll('#pkf button').forEach(x=>x.classList.toggle('on',x===el));pl();sfx('tap')},
  pkchip:el=>{PKCH=el.dataset.c;document.querySelectorAll('#pkc2 button').forEach(x=>x.classList.toggle('on',x===el));pl();sfx('tap')},
  close:()=>{SC=null;SC_SLOT=null;RET=null;$('dl').close()},
  detBack:()=>{const r=RET;RET=null;if(r==='pick')pick(mode);else if(r==='scan'&&SC){renderScan();openDl(0,1)}else $('dl').close()},
  qty:el=>qty(el.dataset.s,el.dataset.n,+el.dataset.d),clrSide:el=>{S[el.dataset.s]={};S.gems[el.dataset.s]=0;save();calc();sfx('tap')},
  swap:()=>{[S.give,S.get]=[S.get,S.give];[S.gems.give,S.gems.get]=[S.gems.get,S.gems.give];save();calc()},
  clr:()=>{S.give={};S.get={};S.gems={give:0,get:0};save();calc()},done,
  applyOpt:el=>{(OPT[+el.dataset.k]||[]).forEach(n=>{S.give[n]=(S.give[n]||0)+1});save();calc();sfx('add')},
  applyCnt:el=>{(CNTS[+el.dataset.k]||[]).forEach(n=>{S.get[n]=(S.get[n]||0)+1});save();calc();sfx('add')},
  ctab:el=>{S.cat=el.dataset.c;save();fillFilters();cat();sfx('tap')},view:el=>{S.view=el.dataset.v;save();fillFilters();cat();sfx('tap')},
  tg:el=>{TGL=el.dataset.g;document.querySelectorAll('#tg button').forEach(x=>x.classList.toggle('on',x===el));cat();sfx('tap')},
  cmpToggle:()=>{CMP_MODE=CMP_MODE?0:1;CMP_LIST=[];fillFilters();cat();if(CMP_MODE)toast('Выбери 2 юнита для сравнения');sfx('tap')},
  cmpStart:el=>{CMP_LIST=[el.dataset.n];CMP_MODE=1;$('dl').close();tab(1);fillFilters();cat();toast('Выбери второго юнита в каталоге')},
  fav:(el,e)=>{e.stopPropagation();const n=el.dataset.n;if(S.fav[n])delete S.fav[n];else S.fav[n]=1;save();cat();if(CU===n&&$('dl').open&&$('dl').classList.contains('full'))det(n,1,RET);sfx('tap')},
  catTap:el=>{const n=el.dataset.n;if(!CMP_MODE)return det(n,0,null);const idx=CMP_LIST.indexOf(n);if(idx>=0)CMP_LIST.splice(idx,1);else CMP_LIST.push(n);if(CMP_LIST.length>=2){const[a,b]=CMP_LIST;CMP_MODE=0;CMP_LIST=[];fillFilters();cat();openCompare(a,b)}else{fillFilters();cat()}sfx('tap')},
  det:el=>det(el.dataset.n,0,el.dataset.ret||null),dact:el=>dact(el.dataset.k),chg,addNew,nuok,pres,psave,
  pload:el=>{const p=S.pr[el.dataset.k];if(!p)return;S.give={...p.give};S.get={...p.get};S.gems={give:p.giveGems||0,get:p.getGems||0};save();$('dl').close();calc();tab(0)},
  pdel:el=>{delete S.pr[el.dataset.k];save();pres()},iq:el=>iq(el.dataset.n,+el.dataset.d),goalx:()=>{S.goal='';save();inv()},
  repHs:el=>{const h=S.hs[+el.dataset.k];if(!h)return;S.give={...h.give};S.get={...h.get};S.gems={give:h.giveGems||0,get:h.getGems||0};save();calc();tab(0);toast('Сделка загружена в калькулятор')},
  adSt:el=>{S.adSt=el.dataset.v;save();ad();sfx('tap')},
  cp:el=>cp(el.dataset.id),cpTxt:el=>cpTxt(el.dataset.tx),exp,imp,reload:()=>load(1),gsave,gload,
  scan:el=>scanOpen(el.dataset.m),scPaste,scApply:el=>scApply(el.dataset.m),scImgClick,scExportUsr,
  scShot:el=>{const si=+el.dataset.i;if(!SC?.shots?.[si])return;SC.shotIdx=si;SC.annUrl=SC.shots[si].annUrl;renderScan();sfx('tap')},
  scPickAlt:el=>{const a=SC[el.dataset.s],i=+el.dataset.i;if(!a?.[i])return;a[i].name=el.dataset.n;a[i].lowConf=false;a[i].edited=true;renderScan();sfx('tap')},
  scPickModal:el=>{SC_SLOT={s:el.dataset.s,side:el.dataset.s,idx:+el.dataset.i};pick('scan');sfx('tap')},
  scBack:()=>{SC_SLOT=null;if(SC){renderScan();openDl(0,1)}else $('dl').close()},
  scQ:el=>{const a=SC[el.dataset.s],i=+el.dataset.i;if(!a?.[i])return;a[i].qty+=+el.dataset.d;if(a[i].qty<=0){const si=a[i].shotIdx??0;a.splice(i,1);scDrawAnn(si)}renderScan();sfx('tap')},
  scDel:el=>{const a=SC[el.dataset.s],i=+el.dataset.i;if(!a?.[i])return;const si=a[i].shotIdx??0;a.splice(i,1);SC.hlSide='';SC.hlIdx=-1;scDrawAnn(si);renderScan();sfx('tap')},
  scSg:el=>{const a=SC[el.dataset.s],i=+el.dataset.i;if(!a?.[i])return;a[i].signed=!a[i].signed;renderScan();sfx('tap')},
  scAdd:el=>{const s=el.dataset.s,nm=$('sc-sel-'+s)?.value;if(!nm||!SC[s])return;SC[s].push({name:nm,qty:1,signed:false,cands:[nm],lowConf:false,edited:true,...(SC.kind==='inv'?{shotIdx:SC.shotIdx}:{})});renderScan();sfx('add')},
  scClearUsr:()=>{USR_IC={size:IC.size||48,items:{}};try{localStorage.removeItem(KUSR)}catch{}buildRefs();renderScan();toast('Память сканера очищена')},
  ofSel:el=>{const m=OFM,n=el.dataset.n,x=m?.ent.find(e=>e.n===n);if(!x)return;const sel=ofSelObj(m.ent),tot=Object.values(sel).reduce((a,b)=>a+b,0);let k=sel[n]||0;if(k>=x.q)k=0;else if(tot>=8){toast('Максимум 8 штук в связке');return}else k++;if(k)sel[n]=k;else delete sel[n];S.ofSel=sel;save();ofr();sfx('tap')},
  ofClr:()=>{S.ofSel={};save();ofr();sfx('tap')},
  ofWeak:()=>{const m=OFM;if(!m)return;const sel={};let t=0;for(const x of m.ent){if(!ofBad(x.a)||x.v<15)continue;const k=Math.min(x.q,8-t);if(k>0){sel[x.n]=k;t+=k}}S.ofSel=sel;save();ofr();sfx('tap')},
  ofTrade:el=>ofTrade(+el.dataset.k),ofRepl:el=>ofRepl(+el.dataset.k),ofBun:el=>ofBun(+el.dataset.k),ofDl:()=>ofDl(),ofPng:()=>ofPng(),ofCp:()=>ofCp()
};
document.addEventListener('click',e=>{const el=e.target.closest('[data-a]');if(el&&ACT[el.dataset.a])ACT[el.dataset.a](el,e)});
const CHG={
  sg:el=>{S.sg[CU]=el.checked;save();calc();cat();det(CU,1)},
  mk:el=>{S.mk=+el.value||0;save();calc();cat();det(CU,1)},
  ofg:el=>{S.ofg=Math.max(0,Math.round(+el.value||0));save();ofr()},
  keep1:el=>{S.keep1=el.checked?1:0;save();invReport()},
  adCmp:el=>{S.adCmp=el.checked?1:0;save();ad()},
  learn:el=>{S.learn=el.checked?1:0;save();toast(S.learn?'Самообучение ВКЛ':'Самообучение ВЫКЛ')}
};
document.addEventListener('change',e=>{
  if(e.target.id==='scf'&&e.target.files?.length)return scPickFiles(e.target.files);
  if(e.target.id==='pkc'){PKC=e.target.value;return pl()}
  if(e.target.id==='pks'){PKS=e.target.value;return pl()}
  if(e.target.dataset?.scg&&SC){SC[e.target.dataset.scg==='give'?'giveGems':'getGems']=Math.max(0,Math.round(+e.target.value||0));renderScan();return}
  const c=e.target.dataset?.c;if(c&&CHG[c])CHG[c](e.target);
});
document.addEventListener('input',e=>{
  const gSide=e.target.dataset?.g;
  if(gSide){S.gems[gSide]=Math.max(0,Math.round(+e.target.value||0));save();calc();return}
  const scg=e.target.dataset?.scg;
  if(scg&&SC){SC[scg==='give'?'giveGems':'getGems']=Math.max(0,Math.round(+e.target.value||0));return}
});
document.addEventListener('paste',e=>{
  if(!$('dl').open||!SC)return;
  const files=[...(e.clipboardData?.files||[])].filter(x=>x.type.startsWith('image/'));
  if(!files.length){const f=[...(e.clipboardData?.items||[])].find(x=>x.type.startsWith('image/'))?.getAsFile();if(f)files.push(f)}
  if(files.length){e.preventDefault();scPickFiles(files)}
});
$('q').addEventListener('input',cat);['fc','fs','so'].forEach(id=>$(id).addEventListener('change',cat));
$('dl').addEventListener('input',e=>{if(e.target.id=='pq')pl()});
['pointermove','pointerdown'].forEach(t=>$('dl').addEventListener(t,e=>{const s=e.target.closest?.('svg.chart');if(s&&CHD)chartAt(e,s)}));
document.addEventListener('pointerdown',e=>{const b=e.target.closest('button');if(!b)return;navigator.vibrate?.(8);sfx('tap');if(S.lite)return;const r=b.getBoundingClientRect(),d=Math.max(r.width,r.height),s=document.createElement('i');s.className='rp';s.style.cssText=`width:${d}px;height:${d}px;left:${e.clientX-r.left-d/2}px;top:${e.clientY-r.top-d/2}px`;b.append(s);setTimeout(()=>s.remove(),600)});
document.addEventListener('pointermove',e=>{if(S.lite)return;const c=e.target.closest?.('.card,.tile');if(!c)return;const r=c.getBoundingClientRect();c.style.setProperty('--mx',e.clientX-r.left+'px');c.style.setProperty('--my',e.clientY-r.top+'px');c.style.setProperty('--rx',(-((e.clientY-r.top)/r.height-.5)*8).toFixed(1)+'deg');c.style.setProperty('--ry',(((e.clientX-r.left)/r.width-.5)*8).toFixed(1)+'deg')});
['pointerup','pointercancel','pointerout'].forEach(t=>document.addEventListener(t,e=>{const c=e.target.closest?.('.card,.tile');if(c){c.style.setProperty('--rx','0deg');c.style.setProperty('--ry','0deg')}}));

async function checkSharedShots(){
  if(!('caches'in window))return;
  const params=new URLSearchParams(location.search);
  if(!params.has('share'))return;
  history.replaceState(null,'',location.pathname+location.hash);
  try{
    const cache=await caches.open('ctd-share'),keys=await cache.keys();
    if(!keys.length)return;
    const files=[];
    for(const req of keys){
      const res=await cache.match(req);
      if(res){
        const blob=await res.blob(),nm=decodeURIComponent(res.headers.get('X-Name')||'shot.png');
        files.push(new File([blob],nm,{type:blob.type||'image/png'}));
      }
      await cache.delete(req);
    }
    if(files.length){
      const kind=files.length>1?'inv':'trade';
      scanOpen(kind);
      await scPickFiles(files,files.length===1);
    }
  }catch(e){console.warn('share read error',e)}
}

if('serviceWorker'in navigator){
  navigator.serviceWorker.register('sw.js').catch(()=>{});
  const had=!!navigator.serviceWorker.controller;let rl=0;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(had&&!rl){rl=1;location.reload()}});
  navigator.serviceWorker.ready.then(r=>r.update()).catch(()=>{});
}
setTh(S.th||'matrix',1);applyLite();sndI();load().then(checkSharedShots);
