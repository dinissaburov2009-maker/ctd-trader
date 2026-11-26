'use strict';
const ACT={
  fcT:el=>{const v=el.dataset.v;if(!v)FCS.clear();else if(FCS.has(v))FCS.delete(v);else FCS.add(v);syncChips();cat();sfx('tap')},
  fsT:el=>{const v=el.dataset.v;if(!v)FSS.clear();else if(FSS.has(v))FSS.delete(v);else FSS.add(v);syncChips();cat();sfx('tap')},
  soT:el=>{SORT=el.dataset.v;syncChips();cat();sfx('tap')},
  tab:el=>{tab(+el.dataset.i)},th:el=>setTh(el.dataset.t),lite:()=>{S.lite=S.lite?0:1;save();applyLite();toast(S.lite?'Lite-режим ВКЛ (без лагов)':'Полные эффекты ВКЛ');sfx('tap')},
  snd:()=>{S.snd=S.snd?0:1;save();sndI();sfx('add')},
  pick:el=>{SC=null;SC_SLOT=null;RET=null;pick(el.dataset.m)},pk:el=>pk(el.dataset.n,1),pk5:el=>pk(el.dataset.n,5),pkDec:el=>pkDec(el.dataset.n),invTrade:el=>invTrade(+el.dataset.k),
  pkr:el=>{const r=el.dataset.r;if(r==='all')PKA=1;else{PKA=0;PKW=0;PKR=+r;S.pkr=PKR;save()}document.querySelectorAll('#pkr button').forEach(x=>x.classList.toggle('on',x===el));pl();sfx('tap')},
  rtm:()=>rtm(),rtShow:()=>rtmShow(),rtmBuild:()=>rtmBuild(),
  rtSrc:()=>{RTM={...S.give};rtmBuild()},
  rtPick:()=>{SC=null;SC_SLOT=null;RET=null;RTM={};pick('rtm')},
  rtTog:el=>{const n=RT?.nodes[el.dataset.id];if(!n)return;if(n.kids===null)rtmExpand(el.dataset.id);n.open=n.open?0:1;const t=$('rtree');if(t)t.innerHTML=rtTree('0',0);sfx('tap')},
  rtGo:el=>{const n=RT?.nodes[el.dataset.id],p=n&&RT.nodes[n.parent];if(!n||!p)return;S.give={...p.hold};S.get={...n.hold};S.gems={give:n.edge?.pay||0,get:0};save();$('dl').close();calc();tab(0);toast('Шаг загружен в трейд');sfx('add')},
  invWin:()=>invWin(),ivd:el=>{iq(el.dataset.n,+el.dataset.d);ivl();sfx('tap')},
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
  ofSel:el=>{const m=OFM,n=el.dataset.n,x=m?.ent.find(e=>e.n===n);if(!x)return;const sel=ofSelObj(m.ent),tot=Object.values(sel).reduce((a,b)=>a+b,0);let k=sel[n]||0;if(k>=x.q)k=0;else if(tot>=12){toast('Максимум 12 штук в связке');return}else k++;if(k)sel[n]=k;else delete sel[n];S.ofSel=sel;save();ofr();sfx('tap')},
  ofGAdd:el=>{const n=el.dataset.n,o=S.ofGet||(S.ofGet={}),tot=Object.values(o).reduce((a,b)=>a+b,0);if(!IDX.has(n))return;if(tot>=12){toast('Максимум 12 штук');return}o[n]=(o[n]||0)+1;save();ofr();sfx('tap')},
  ofGDec:el=>{const n=el.dataset.n,o=S.ofGet||(S.ofGet={});if(o[n]>1)o[n]--;else delete o[n];save();ofr();sfx('tap')},
  ofGClr:()=>{S.ofGet={};S.ofgg=0;save();ofr();sfx('tap')},
  ofCheckGo:()=>{const m=OFM;if(!m)return;const sel=ofSelObj(m.ent),off=ofOffObj();if(!Object.keys(sel).length&&!Object.keys(off).length)return;S.give={...sel};S.get={...off};S.gems={give:0,get:Math.max(0,Math.round(+S.ofgg||0))};save();if($('dl').open)$('dl').close();calc();tab(0);toast('Обмен загружен в трейд');sfx('add')},
  ofClr:()=>{S.ofSel={};save();ofr();sfx('tap')},
  ofWeak:()=>{const m=OFM;if(!m)return;const sel={};let t=0;for(const x of m.ent){if(!ofBad(x.a)||x.v<15)continue;const k=Math.min(x.q,12-t);if(k>0){sel[x.n]=k;t+=k}}S.ofSel=sel;save();ofr();sfx('tap')},
  ofTrade:el=>ofTrade(+el.dataset.k),ofRepl:el=>ofRepl(+el.dataset.k),ofBun:el=>ofBun(+el.dataset.k),ofDl:()=>ofDl(),ofPng:()=>ofPng(),ofCp:()=>ofCp(),
  mkS:el=>{MK.side=el.dataset.v;MK.lim=30;mk()},mkA:el=>{MK.age=+el.dataset.v;MK.lim=30;mk()},mkO:el=>{MK.sort=el.dataset.v;MK.lim=30;mk()},
  mkF:el=>{const v=el.dataset.v;if(!v)MK.fl.clear();else if(MK.fl.has(v))MK.fl.delete(v);else MK.fl.add(v);MK.lim=30;mk()},
  mkR:el=>{const v=el.dataset.v;if(!v)MK.rar.clear();else if(MK.rar.has(v))MK.rar.delete(v);else MK.rar.add(v);MK.lim=30;mk()},mkOnly:()=>{MK.only=MK.only?0:1;MK.lim=30;mk()},mkGem:()=>{MK.gem=MK.gem?0:1;MK.lim=30;mk()},
  mkMine:()=>{MK.mine=MK.mine?0:1;MK.lim=30;mk()},mkMore:()=>{MK.lim+=30;mk()},
  mkRef:()=>{if(MK.src==='live')mkLoad(1);else mkArchDay(MK.src)},
  mkSrc:el=>{if(el.dataset.v==='live'){if(MK.src!=='live'){MK.src='live';MK.ads=[];mk();mkLoad(1)}else mkLoad(1)}else if(!MK.days)mkDays();else{MK.days=null;mk()}},
  mkDay:el=>mkArchDay(el.dataset.v),
  mkTake:el=>{const a=MK.ads.find(x=>x.i===el.dataset.i);if(!a)return;const g={},r={};let sk=0;
    for(const[x,q]of a.w){const n=MK.map[x];if(n)g[n]=(g[n]||0)+q;else sk++}
    for(const[x,q]of a.h){const n=MK.map[x];if(n)r[n]=(r[n]||0)+q;else sk++}
    S.give=g;S.get=r;S.gems={give:0,get:0};save();calc();tab(0);toast('Загружено в трейд'+(sk?' · не опознано: '+sk:''));sfx('add')}
};
document.addEventListener('click',e=>{const el=e.target.closest('[data-a]');if(el&&ACT[el.dataset.a])ACT[el.dataset.a](el,e)});
const CHG={
  sg:el=>{S.sg[CU]=el.checked;save();calc();cat();det(CU,1)},
  mk:el=>{S.mk=+el.value||0;save();calc();cat();det(CU,1)},
  dw:el=>{S.dw=Math.max(0,Math.min(100,+el.value||0));save();rebuild();calc();cat();dwSync();if($('ofr'))ofr();sfx('tap')},
  ofgg:el=>{S.ofgg=Math.max(0,Math.round(+el.value||0));save();ofr()},
  ofg:el=>{S.ofg=Math.max(0,Math.round(+el.value||0));save();ofr()},
  ofBun:el=>{S.ofBun=el.checked?1:0;save();ofr()},
  keep1:el=>{S.keep1=el.checked?1:0;save();invReport()},
  adCmp:el=>{S.adCmp=el.checked?1:0;save();ad()},
  learn:el=>{S.learn=el.checked?1:0;save();toast(S.learn?'Самообучение ВКЛ':'Самообучение ВЫКЛ')}
};
document.addEventListener('change',e=>{
  if(e.target.id==='scf'&&e.target.files?.length)return scPickFiles(e.target.files);
  if(e.target.id==='pkc'){PKC=e.target.value;return pl()}
  if(e.target.id==='pks'){PKS=e.target.value;return pl()}
  if(e.target.id==='ivs'){IVS=e.target.value;return ivl()}
  if(e.target.dataset?.scg&&SC){SC[e.target.dataset.scg==='give'?'giveGems':'getGems']=Math.max(0,Math.round(+e.target.value||0));renderScan();return}
  const c=e.target.dataset?.c;if(c&&CHG[c])CHG[c](e.target);
});
document.addEventListener('input',e=>{
  if(e.target.id==='dw'){dwSync(+e.target.value);return}
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
let _cq;$('q').addEventListener('input',()=>{clearTimeout(_cq);_cq=setTimeout(cat,120)});
let _mq;$('mq').addEventListener('input',e=>{clearTimeout(_mq);_mq=setTimeout(()=>{MK.q=e.target.value;MK.lim=30;mk()},150)});
$('dl').addEventListener('input',e=>{if(e.target.id=='pq')pl();if(e.target.id=='ivq')ivl()});
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
