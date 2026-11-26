'use strict';
/* ================= ВИЗУАЛЬНЫЙ ПИКЕР ЮНИТОВ ================= */
let PKCH='';
const openDl=(full=0,wide=0)=>{const d=$('dl');d.classList.toggle('full',!!full);d.classList.toggle('wide',!!wide&&!full);if(!d.open)d.showModal();if(typeof scr==='function')d.querySelectorAll('h3').forEach(scr)};
/* ================= ЕДИНЫЙ ПОДБОР v1: оценка «выгодности» юнита под конкретную сторону трейда ================= */
let PKW=0,PKB=null,PKA=0,PKR=(S.pkr>0&&S.pkr<=20)?S.pkr:5,RTM={},RT=null,IVQ='',IVS='v';
const clampN=(x,a,b)=>Math.max(a,Math.min(b,x));
function budgetOf(side){const st=sideStats(side);return{nom:sum(side),real:st.adjSum,q:st.wQ,pcs:st.pcs}}
/* B = {nom, real, q}: что отдаёшь. Возвращает номинал/реал-разницу, оправданный минус за ходовость и общий балл sc */
function fitCalc(u,B){
  const a=AN.get(u.name),v=val(u.name);
  if(!a||!B||!(B.nom>0)||!(v>0))return null;
  const dm=u.demand||0,e=v*(a.trPct>=100?a.mult-.12:a.mult),nom=(v-B.nom)/B.nom,real=B.real>0?(e-B.real)/B.real:nom;
  const bad=a.trend==='down'||a.grade[0]==='trash'||a.grade[0]==='drop'||dm<=2.5;
  const hot=!bad&&(dm>=7.5||a.trend==='up'||a.q>=70);
  const allow=bad?0:clampN((dm-5)/5,0,1)*.10+(a.trend==='up'?.05:0)+(a.q>=70?.05:0)+(a.bs!=null&&a.bs>=1.5?.03:0);
  const pc=Math.round(nom*100);let tag='',cls='';const T=(t,c)=>{tag=t;cls=c};
  if(bad)T(nom>=-.05?'⚠ слабый или падает — не бери без доплаты':'⛔ плохо уйдёт на перепродаже','lose');
  else if(nom>.15)T('↗ дороже твоей стороны — нужна доплата','');
  else if(real>=.12&&nom>=-.1)T('🔥 очень выгодно','win');
  else if(real>=.04&&nom>=-.1)T('✅ выгодно','win');
  else if(nom<-.03&&nom>=-(.08+allow)&&real>=-.04&&hot)T(`📈 выгодный минус ${pc}%: ходовой (спрос ${dm}/10${a.trend==='up'?', растёт':''})`,'win');
  else if(Math.abs(nom)<=.1)T('🔁 примерно равно','');
  else if(nom<-.1)T(`⬇ ты в минусе ${pc}%`,'lose');
  const sc=real*100+(a.q-(B.q||50))/6+allow*60-(bad?30:0)-(nom>0?nom*35:0);
  return{v,e,nom,real,pc,bad,hot,allow,tag,cls,sc,delta:Math.round(v-B.nom)};
}
const pkFitHtml=f=>`<div class="pk-fit ${f.cls}"><b>${f.delta>0?'доплата '+fmt(f.delta):f.delta<0?'минус '+fmt(-f.delta):'ровно'}</b> · реал ${f.real>=0?'+':''}${Math.round(f.real*100)}%${f.tag?'<br>'+esc(f.tag):''}</div>`;
const pkSmartBar=()=>!PKB?'':`<div class="row" style="flex-wrap:wrap;gap:4px"><span class="m" id="pkB" style="flex:1 1 100%"></span><div class="pk-tabs" id="pkr">${[2,3,5,8].map(x=>`<button class="${PKR==x&&!PKA?'on':''}" data-a="pkr" data-r="${x}">до ×${x}</button>`).join('')}<button class="${PKA?'on':''}" data-a="pkr" data-r="all">Все цены</button></div></div>`;
/* верхняя граница подбора: ×PKR от того, что отдаёшь, но не меньше +150 (для дешёвых юнитов) */
const pkHi=nom=>Math.round(Math.max(nom*PKR,nom+150));
const pkBarTxt=n=>!PKB?'':`Отдаёшь ${fmt(PKB.nom)} 💎 → ${PKA?'все юниты':PKW===1?'в твоём диапазоне пусто, расширил до '+fmt(Math.round(PKB.nom*.2))+'–'+fmt(pkHi(PKB.nom)*2):PKW===2?'рядом по цене никого нет, показываю всех':'показаны '+fmt(Math.round(PKB.nom*.5))+'–'+fmt(pkHi(PKB.nom))+' (до ×'+PKR+')'}: ${n} шт. Поиск ищет по всем ценам.`;

/* ================= ОТ БОМЖА ДО МИЛЛИОНЕРА: дерево обменов вверх, несколько веток на шаг ================= */
const RTT=()=>Math.max(1000,...ALL.filter(i=>i.kind==='unit').map(i=>val(i.name)));
const RTR=[[0,'🥫 Бомж'],[.012,'🪙 Новичок'],[.04,'🛒 Трейдер'],[.12,'💼 Делец'],[.3,'🏦 Богач'],[.6,'👑 Магнат'],[.9,'💎 Миллионер']];
const rtRank=v=>{const t=RTT();let r=RTR[0][1];for(const[k,n]of RTR)if(v>=t*k)r=n;return r};
const holdKey=h=>Object.entries(h).sort((a,b)=>a[0]<b[0]?-1:1).map(([n,q])=>q+'x'+n).join('|');
const holdVal=h=>Object.entries(h).reduce((a,[n,q])=>a+val(n)*q,0);
function rtmKids(hold,anc){
  const parts=[];
  for(const[n,k]of Object.entries(hold)){const u=IDX.get(n),a=AN.get(n),v=val(n);if(!u||!a||!(v>=15))return[];parts.push({x:{n,u,a,v},k})}
  const cnt=pcs(hold);if(!parts.length||cnt>6)return[];
  const T=ofTargets(ofPool()),o1=OFL,o2=OFA;let r=[];
  try{OFA=0;OFL=0;r=ofEvalParts(parts,cnt,T,80,1);if(r.length<4){OFL=1;r=r.concat(ofEvalParts(parts,cnt,T,80,1))}}finally{OFL=o1;OFA=o2}
  const own=new Set(Object.keys(hold)),seenK=new Set(),dec=[];
  for(const f of r){
    if(f.tv<f.s*.85||f.g<-2||f.nom>15||f.get.some(g=>own.has(g.n)))continue;
    const h={};f.get.forEach(g=>h[g.n]=(h[g.n]||0)+1);const key=holdKey(h);
    if(anc.has(key)||seenK.has(key))continue;seenK.add(key);
    let sv=0,sq=0,sd=0;f.get.forEach(g=>{const a=AN.get(g.n),u=IDX.get(g.n);sv+=g.v;sq+=a.q*g.v;sd+=(u.demand||0)*g.v});
    dec.push({...f,h,key,q:sq/sv,d:sd/sv});
  }
  const out=[],used=new Set();
  const take=(arr,kind)=>{const f=arr.find(x=>!used.has(x.key));if(f){used.add(f.key);out.push({...f,kind})}};
  take([...dec].sort((a,b)=>b.g-a.g||b.sc-a.sc),'💰 Выгода');
  take(dec.filter(f=>f.g>=0).sort((a,b)=>b.tv-a.tv||b.g-a.g),'📦 Рост цены');
  take(dec.filter(f=>f.g>=0).sort((a,b)=>(b.d*10+b.q)-(a.d*10+a.q)||b.g-a.g),'🔥 Ходовой');
  take(dec.filter(f=>f.g>=3).sort((a,b)=>Math.abs(a.nom)-Math.abs(b.nom)||b.g-a.g),'🧊 Безопасно');
  /* ступеньки с доплатой: из слабого вверх к ходовому юниту, если без доплаты вариантов нет */
  const s0=parts.reduce((a,p)=>a+p.x.v*p.k,0),E0=parts.reduce((a,p)=>a+p.x.v*p.k*p.x.a.mult,0),up=[];
  for(const c of ofPool()){
    if(own.has(c.u.name)||c.v<=s0*1.15||c.v>s0*8+500||c.a.q<48||c.a.trend==='down')continue;
    const h={[c.u.name]:1},key=holdKey(h);if(anc.has(key)||used.has(key))continue;
    const pay=Math.round(c.v-s0),g=Math.round((c.e-(E0+pay))/(E0+pay)*100);if(g<0)continue;
    up.push({h,key,pay,g,nom:Math.round((c.v-s0)/s0*100),tv:c.v,lvl:'',why:'спрос '+(c.u.demand||0)+'/10 '+ofTr[c.a.trend]+' · качество '+c.a.q});
  }
  const t2=(arr,kind)=>{const f=arr.find(x=>!used.has(x.key));if(f){used.add(f.key);out.push({...f,kind})}};
  /* падающие юниты не выкидываем: после нерфа цена уже на дне, а подниматься по трейдам как-то надо. Показываем с пометкой «падает», ранжируем по спросу */
  const dn=[];
  for(const u of ALL){
    if(u.kind!=='unit'||isSigned(u)||own.has(u.name))continue;
    const v=val(u.name),a=AN.get(u.name);if(!a||!(v>s0*1.15)||v>s0*8+500)continue;
    const fall=a.trend==='down'||u.flags.some(f=>/Dropping|Unwanted/.test(f));if(!fall)continue;
    const dm=u.demand||0;if(dm<3)continue;
    const h={[u.name]:1},key=holdKey(h);if(anc.has(key)||used.has(key))continue;
    const pay=Math.round(v-s0),g=Math.round((v*(a.trPct>=100?a.mult-.12:a.mult)-(E0+pay))/(E0+pay)*100);if(g<-25)continue;
    dn.push({h,key,pay,g,nom:Math.round((v-s0)/s0*100),tv:v,dm,lvl:'',why:'спрос '+dm+'/10 '+ofTr[a.trend]+' · качество '+a.q+' · падает'});
  }
  up.forEach(x=>{x.dm=IDX.get(Object.keys(x.h)[0]).demand||0});
  t2([...up].sort((a,b)=>b.dm-a.dm||b.g-a.g||a.pay-b.pay),'🔥 Ходовая ступенька');
  t2([...up].sort((a,b)=>b.g-a.g||a.pay-b.pay),'⬆ С доплатой');
  t2([...up].sort((a,b)=>a.pay-b.pay||b.g-a.g),'🪜 Дешёвая ступенька');
  t2([...dn].sort((a,b)=>b.dm-a.dm||b.g-a.g||a.pay-b.pay),'📉 Падает, но ходовой');
  /* ничего выгодного нет: честно показываем ближайшие слабые ступени вверх */
  if(out.length<2&&s0>=15){
    const wk=[];
    for(const u of ALL){
      if(u.kind!=='unit'||isSigned(u)||own.has(u.name))continue;
      const v=val(u.name),a=AN.get(u.name);if(!a||!(v>s0*1.05)||v>s0*8+500)continue;
      const h={[u.name]:1},key=holdKey(h);if(anc.has(key)||used.has(key))continue;
      const pay=Math.round(v-s0),g=Math.round((v*a.mult-(E0+pay))/(E0+pay)*100);
      wk.push({h,key,pay,g,nom:Math.round((v-s0)/s0*100),tv:v,lvl:'',why:'единственный путь вверх · спрос '+(u.demand||0)+'/10 '+ofTr[a.trend]+' · качество '+a.q+(a.trend==='down'?' · падает':'')});
    }
    const ok=wk.filter(x=>x.g>=-15),pool2=ok.length?ok:wk;
    t2([...pool2].sort((a,b)=>a.pay-b.pay),'⚠ Слабый путь: дешевле всего');
    t2([...pool2].sort((a,b)=>b.g-a.g||a.pay-b.pay),'⚠ Слабый путь: меньше потерь');
  }
  return out;
}
function rtmExpand(id){
  const n=RT.nodes[id];if(n.kids!==null)return;
  n.kids=rtmKids(n.hold,n.anc).map((k,i)=>{const cid=id+'.'+i;RT.nodes[cid]={hold:k.h,parent:id,edge:k,kids:null,open:0,anc:new Set([...n.anc,k.key])};return cid});
}
function rtmBuild(){
  if(!pcs(RTM)){toast('Выбери хотя бы одного юнита');sfx('err');return}
  if(pcs(RTM)>6){toast('Максимум 6 штук в связке');sfx('err');return}
  RT={nodes:{'0':{hold:{...RTM},parent:null,edge:null,kids:null,open:1,anc:new Set([holdKey(RTM)])}}};
  rtmExpand('0');rtmShow();
}
const rtTiles=h=>Object.entries(h).map(([n,q])=>`<span class="rt-u">${imgTag(IDX.get(n)||{},'rt-im')}${q>1?q+'× ':''}${esc(n)}</span>`).join('');
function rtTree(id,depth){
  const n=RT.nodes[id],h=n.hold,v=holdVal(h),e=n.edge;let E=0,q=0,dm=0;
  Object.entries(h).forEach(([k,c])=>{const w=val(k)*c;E+=w*(AN.get(k)?.mult||1);q+=(AN.get(k)?.q||0)*w;dm+=(IDX.get(k)?.demand||0)*w});
  q=v?Math.round(q/v):0;dm=v?dm/v:0;
  const top=v>=RTT()*.9?' 🏆':'';
  const edge=e?`<div class="rt-edge"><b>${e.kind}</b> ↓ ${e.pay?`доплата <b>${fmt(e.pay)}</b> 💎 · `:''}${e.nom>=0?'+':''}${e.nom}% номинал · <b class="${e.g>=0?'win':'lose'}">${e.g>=0?'+':''}${e.g}% реал</b>${e.lvl?' · '+esc(e.lvl):''}${e.why?`<div class="m">${esc(e.why)}</div>`:''}</div>`:'';
  let kids='';
  if(n.open&&n.kids)kids=`<div class="rt-kids">${n.kids.length?n.kids.map(c=>rtTree(c,depth+1)).join(''):`<div class="m">🏁 ${v<15?'Юниты дешевле 15 💎 не оцениваются — начни с чего-то покрупнее':'Выгодных ступеней выше нет — вершина ветки (рынок сейчас не даёт вариантов)'}</div>`}</div>`;
  const canOpen=depth<6&&v>=15;
  return `<div class="rt-n">${edge}<div class="rt-card${depth?'':' root'}"><div class="rt-rank">${rtRank(v)} · ${fmt(v)} 💎${top}</div><div class="rt-names">${rtTiles(h)}</div><div class="m">реал ${fmt(E)} · качество ${q}/100 · спрос ${dm.toFixed(1)}/10</div><div class="bar" style="margin:4px 0 0">${n.parent!==null?`<button class="sm p" data-a="rtGo" data-id="${id}">В трейд →</button>`:''}${canOpen?`<button class="sm" data-a="rtTog" data-id="${id}">${n.open?'Свернуть ▲':'Дальше ▼'}</button>`:''}</div></div>${kids}</div>`;
}
function rtmShow(){
  SC=null;SC_SLOT=null;RET=null;mode='rtm0';
  $('dl').innerHTML=`<div class="row"><h3 style="flex:1;margin:0">🚀 От бомжа до миллионера</h3><button class="sm" data-a="close">${I('x')}</button></div><div class="m">Каждый шаг — обмен вверх. Ветки: 💰 выгода · 📦 рост цены · 🔥 ходовой · 🧊 безопасно. Нажми «Дальше ▼», чтобы раскрыть следующий шаг.</div><div id="rtree">${rtTree('0',0)}</div><div class="bar"><button data-a="rtm">Сменить старт</button><button data-a="close">Закрыть</button></div>`;
  openDl(0,1);
}
function rtm(){
  SC=null;SC_SLOT=null;RET=null;mode='rtm0';
  const hasG=pcs(S.give)>0;
  $('dl').innerHTML=`<div class="row"><h3 style="flex:1;margin:0">🚀 От бомжа до миллионера</h3><button class="sm" data-a="close">${I('x')}</button></div><div class="m">Выбери, с чего стартуем: одного юнита или связку (до 6 шт). Покажу дерево обменов вверх, на каждом шаге несколько веток.</div><div class="bar"><button ${hasG?'':'disabled'} data-a="rtSrc">Из «Я отдаю»</button><button data-a="rtPick">+ Выбрать юнитов</button></div>${RT?'<button class="p" data-a="rtShow">Вернуться к дереву</button>':''}`;
  openDl(0);
}

/* ================= ИНВЕНТАРЬ В ОТДЕЛЬНОМ ОКНЕ ================= */
function invWin(){
  SC=null;SC_SLOT=null;RET=null;mode='invwin';
  $('dl').innerHTML=`<div class="row"><h3 style="flex:1;margin:0">Инвентарь</h3><button class="sm" data-a="close">${I('x')}</button></div><input id="ivq" placeholder="Поиск…" value="${esc(IVQ)}"><div class="bar sel" style="margin:4px 0"><select id="ivs">${[['v','По сумме'],['p','По цене за шт'],['t','По тренду'],['q','По крутости'],['a','А–Я']].map(o=>`<option value="${o[0]}" ${IVS==o[0]?'selected':''}>${o[1]}</option>`).join('')}</select><button data-a="pick" data-m="inv">+ Добавить</button><button data-a="rtm">🚀 Бомж → Миллионер</button></div><div id="ivl" class="pk-grid"></div><div id="ivt" class="m" style="margin-top:6px"></div>`;
  openDl(0,1);ivl();
}
function ivl(){
  const el=$('ivl');if(!el)return;IVQ=$('ivq')?.value??IVQ;const q=IVQ.toLowerCase(),st=el.scrollTop;
  const L=Object.entries(S.inv).filter(([n])=>n.toLowerCase().includes(q)).map(([n,c])=>({n,c,u:IDX.get(n),a:AN.get(n),v:val(n)}));
  const key={v:x=>x.v*x.c,p:x=>x.v,t:x=>x.a?x.a.trPct:0,q:x=>x.a?x.a.q:0}[IVS]||(x=>x.v*x.c);
  L.sort(IVS==='a'?(x,y)=>x.n.localeCompare(y.n):(x,y)=>key(y)-key(x));
  el.innerHTML=L.map(({n,c,u,a,v})=>{
    const tr=a&&Math.abs(a.trPct)>=10?`<b class="${a.trPct>0?'win':'lose'}">${a.trPct>0?'▲+':'▼'}${a.trPct}%</b>`:'',qb=a?`<span class="qb ${a.grade[2]}">${a.grade[1]}</span>`:'';
    return `<div class="pk-tile r-${esc(u?.category||'')}"><div class="pk-topL">${qb}</div><div class="pk-hit" data-a="det" data-n="${esc(n)}">${u&&u.img?`<img class="pk-img" src="${esc(u.img)}" loading="lazy" onerror="this.remove()">`:'<div class="pk-ph">?</div>'}<div class="pk-nm">${esc(n)}</div><div class="pk-pr">${fmt(v)}${c>1?' ×'+c+' = '+fmt(v*c):''}</div><div class="pk-meta">спрос ${u?u.demand:'—'}/10 ${tr}</div></div><div class="pk-ctl"><button data-a="ivd" data-n="${esc(n)}" data-d="-1">−</button><b>${c}</b><button class="p" data-a="ivd" data-n="${esc(n)}" data-d="1">+</button></div></div>`;
  }).join('')||'<div class="m">Ничего нет</div>';
  el.scrollTop=st;
  $('ivt').textContent='Всего: '+pcs(S.inv)+' шт · '+fmt(Object.entries(S.inv).reduce((a,[n,c])=>a+val(n)*c,0));
}

function pick(m){
  mode=m;PKC='';PKCH='';
  PKB=m==='get'?budgetOf('give'):null;if(PKB&&!(PKB.nom>0))PKB=null;PKA=0;PKW=0;if(PKB)PKS='s';else if(PKS==='s')PKS='v';
  const titles={give:'Добавить в «Я отдаю»',get:'Добавить в «Я получаю»',inv:'Добавить в инвентарь',goal:'Выбери цель',scan:'Выбери юнита для слота',rtm:'Старт: выбери юнита или связку',of:'Что предлагает партнёр'};
  const cats=[...new Set(ALL.map(i=>i.category))];
  const tabs=[['all','Все'],...(m!=='goal'&&m!=='scan'&&m!=='of'&&pcs(S.inv)?[['inv','В инвентаре']]:[]),['unit','Юниты'],['bc','Бусты/Кейсы'],['signed','DevSigned']];
  if(PKF==='inv'&&(!pcs(S.inv)||m==='goal'||m==='scan'||m==='of'))PKF='all';
  const doneBtn=m==='scan'?`<button data-a="scBack">Назад к скану</button>`:m==='rtm'?`<button class="p" data-a="rtmBuild">Построить дерево</button>`:`<button class="p" data-a="close">Готово</button>`;
  $('dl').innerHTML=`<div class="row"><h3 style="flex:1;margin:0">${titles[m]||'Выбери юнитов'}</h3><button class="sm" data-a="${m==='scan'?'scBack':'close'}">${I('x')}</button></div>
  <input id="pq" placeholder="Поиск по названию…" value="${esc(PKQ)}">${pkSmartBar()}
  <div class="pk-tabs" id="pkf">${tabs.map(t=>`<button class="${PKF==t[0]?'on':''}" data-a="pkf" data-f="${t[0]}">${t[1]}</button>`).join('')}</div>
  <div class="pk-tabs" id="pkc2">${[['','Все'],['imba','🔥 ИМБА'],['up','📈 Рост'],['down','📉 Спад'],['fav','★ Избранное']].map(c=>`<button class="${PKCH==c[0]?'on':''}" data-a="pkchip" data-c="${c[0]}">${c[1]}</button>`).join('')}</div>
  <div class="bar sel" style="margin:4px 0"><select id="pkc"><option value="">Все редкости</option>${cats.map(c=>`<option>${esc(c)}</option>`).join('')}</select>
    <select id="pks">${PKB?`<option value="s" ${PKS=='s'?'selected':''}>🎯 Подбор</option>`:''}<option value="v" ${PKS=='v'?'selected':''}>По цене</option><option value="q" ${PKS=='q'?'selected':''}>По крутости (ИМБА)</option><option value="d" ${PKS=='d'?'selected':''}>По спросу</option><option value="a" ${PKS=='a'?'selected':''}>А–Я</option></select></div>
  <div id="pls" class="pls pk-grid"></div>
  <div class="row" style="margin-top:6px"><span id="pkSum" class="m" style="flex:1"></span>${doneBtn}</div>`;
  if(m==='of')$('dl').addEventListener('close',ofPickClosed,{once:true});
  openDl(0,1);pl();
}
function pl(){
  PKQ=$('pq')?.value||'';const q=PKQ.toLowerCase(),el=$('pls'),st=el.scrollTop;
  const list=ALL.filter(i=>{
    if(!i.name.toLowerCase().includes(q))return 0;if(PKC&&i.category!==PKC)return 0;
    if(PKB&&!PKA&&!q){const v=val(i.name);if(!(v>=PKB.nom*[.5,.2,0][PKW]&&v<=[pkHi(PKB.nom),pkHi(PKB.nom)*2,Infinity][PKW]))return 0}
    if(PKF==='inv'&&(S.inv[i.name]||0)<=0)return 0;if(PKF!=='all'&&PKF!=='inv'&&tabOf(i)!==PKF)return 0;
    const a=AN.get(i.name);
    if(PKCH==='imba'&&(!a||a.q<70))return 0;
    if(PKCH==='up'&&(!a||a.trend!=='up'))return 0;
    if(PKCH==='down'&&(!a||a.trend!=='down'))return 0;
    if(PKCH==='fav'&&!S.fav[i.name])return 0;
    return 1;
  }).sort(PKS=='s'&&PKB?(a,b)=>(fitCalc(b,PKB)?.sc??-1e9)-(fitCalc(a,PKB)?.sc??-1e9):PKS=='q'?(a,b)=>(AN.get(b.name)?.q||0)-(AN.get(a.name)?.q||0)||val(b.name)-val(a.name):PKS=='d'?(a,b)=>b.demand-a.demand||val(b.name)-val(a.name):PKS=='a'?(a,b)=>a.name.localeCompare(b.name):(a,b)=>val(b.name)-val(a.name));

  if(PKB&&!PKA&&!q&&!list.length&&PKW<2){PKW++;return pl()}
  const bag=mode==='inv'?S.inv:mode==='rtm'?RTM:(mode==='give'||mode==='get')?S[mode]:mode==='of'?(S.ofGet||(S.ofGet={})):null;
  el.innerHTML=list.map(i=>{
    const iv=S.inv[i.name]||0,cur=bag?(bag[i.name]||0):0,fit=PKB?fitCalc(i,PKB):null,an=AN.get(i.name),qb=an?`<span class="qb ${an.grade[2]}">${an.grade[1]}</span>`:'';
    const tr=an&&Math.abs(an.trPct)>=12?`<b class="${an.trPct>0?'win':'lose'}">${an.trPct>0?'+':''}${an.trPct}%</b>`:'';
    const ctl=(mode==='goal'||mode==='scan')?`<div class="pk-ctl"><button class="p" data-a="pk" data-n="${esc(i.name)}">${mode==='scan'?'Выбрать':'Выбрать целью'}</button></div>`
      :`<div class="pk-ctl"><button data-a="pkDec" data-n="${esc(i.name)}" ${cur?'':'disabled'}>−</button><b>${cur}</b><button class="p" data-a="pk" data-n="${esc(i.name)}">+</button><button data-a="pk5" data-n="${esc(i.name)}">+5</button></div>`;
    return `<div class="pk-tile r-${esc(i.category)} ${cur?'on':''}">
      <div class="pk-topL">${qb}</div>
      <div class="pk-topR">${iv&&mode!=='inv'?`<span class="pk-inv">инв:${iv}</span>`:''}<button class="pk-info" data-a="det" data-ret="pick" data-n="${esc(i.name)}" title="Досье">i</button></div>
      <div class="pk-hit" data-a="pk" data-n="${esc(i.name)}">${i.img?`<img class="pk-img" src="${esc(i.img)}" loading="lazy" onerror="this.outerHTML='<div class=\\'pk-ph\\'>?</div>'">`:'<div class="pk-ph">?</div>'}<div class="pk-nm">${esc(i.name)}</div><div class="pk-pr">${pLbl(i)}</div><div class="pk-meta"><span class="rb">${esc(i.category)}</span> · ${i.demand}/10 ${tr}</div>${fit?pkFitHtml(fit):''}</div>${ctl}</div>`;
  }).join('')||'<div class="m">Ничего не найдено</div>';
  el.scrollTop=st;const pb=$('pkB');if(pb)pb.textContent=pkBarTxt(list.length);
  const sumEl=$('pkSum');
  if(sumEl){
    if(mode==='give'||mode==='get')sumEl.textContent=`Выбрано: ${pcs(S[mode])} шт · ${fmt(sum(mode))}`;
    else if(mode==='of')sumEl.textContent=`Предлагают: ${pcs(S.ofGet||{})} шт · ${fmt(Object.entries(S.ofGet||{}).reduce((a,[n,q])=>a+val(n)*q,0))}`;
    else if(mode==='inv')sumEl.textContent=`В инвентаре: ${pcs(S.inv)} шт · ${fmt(Object.entries(S.inv).reduce((a,[n,q])=>a+val(n)*q,0))}`;
    else if(mode==='rtm')sumEl.textContent=`Старт: ${pcs(RTM)} шт · ${fmt(holdVal(RTM))}`;
    else sumEl.textContent='Нажми на карточку для выбора';
  }
}
function pk(n,d=1){
  if(mode=='scan'&&SC&&SC_SLOT){const sl=SC[SC_SLOT.side]?.[SC_SLOT.idx];if(sl){sl.name=n;sl.lowConf=false;sl.edited=true;if(!sl.cands.includes(n))sl.cands.unshift(n)}SC_SLOT=null;renderScan();openDl(0,1)}
  else if(mode=='rtm'){RTM[n]=(RTM[n]||0)+d;pl()}
  else if(mode=='of'){ofAddQ(n,d);pl()}
  else if(mode=='goal'){S.goal=n;save();$('dl').close();inv()}
  else if(mode=='inv'){S.inv[n]=(S.inv[n]||0)+d;save();inv();pl()}
  else{qty(mode,n,d);pl()}
  sfx('add');
}
function pkDec(n){
  if(mode=='rtm'){RTM[n]=(RTM[n]||0)-1;if(RTM[n]<=0)delete RTM[n];pl()}
  else if(mode=='inv'){S.inv[n]=(S.inv[n]||0)-1;if(S.inv[n]<=0)delete S.inv[n];save();inv();pl()}
  else if(mode=='give'||mode=='get'){qty(mode,n,-1);pl()}
  else if(mode=='of'){ofAddQ(n,-1);pl()}
  sfx('tap');
}
