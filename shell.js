'use strict';
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
const burst=(x,y,n=36)=>{if(S.lite)return;const c=window.RC||'#c4b5fd';for(let i=0;i<n;i++){const a=Math.random()*6.283,s=2+Math.random()*7;fxP.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-2,l:1,c:i%3?c:'#fff'})}
  if(!fxRun){fxRun=1;(function f(){fc.clearRect(0,0,fx.width,fx.height);fxP=fxP.filter(p=>p.l>0);fxP.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.18;p.vx*=.98;p.l-=.018;fc.globalAlpha=Math.max(p.l,0);fc.fillStyle=p.c;fc.fillRect(p.x,p.y,3,3)});if(fxP.length)requestAnimationFrame(f);else fxRun=0})()}};
const toast=m=>{const e=document.createElement('div');e.className='ts';e.textContent=m;$('ts').append(e);setTimeout(()=>e.remove(),2600)};
const cup=e=>{if(S.lite)return;const n=+e.textContent.replace(/\D/g,''),t0=performance.now();(function f(t){const p=Math.max(0,Math.min(1,(t-t0)/500));e.textContent=fmt(n*(1-Math.pow(1-p,3)));if(p<1)requestAnimationFrame(f)})(t0)};

const TH={violet:'#c4b5fd',indigo:'#a5b4fc',snow:'#f3efff'};
const setTh=(t,q)=>{t=TH[t]?t:'violet';S.th=t;save();document.documentElement.dataset.th=t;window.RC=TH[t];document.querySelector('meta[name=theme-color]').content='#0d0722';document.querySelectorAll('.thb').forEach(b=>b.classList.toggle('on',b.dataset.t==t));if(!q)sfx('add')};
const applyLite=()=>{document.documentElement.dataset.lite=S.lite?'1':'0';$('ltb')?.classList.toggle('on',!!S.lite)};
const sndI=()=>{$('snd').innerHTML=I(S.snd?'snd':'mute')};
$('ctl').innerHTML=Object.keys(TH).map(t=>`<button class="thb" data-a="th" data-t="${t}" title="${t.toUpperCase()}" style="--c:${TH[t]}"></button>`).join('')+'<button id="ltb" class="sb" data-a="lite" title="Lite-режим (без лагов)"><svg class="ic"><use href="#i-bolt"/></svg></button><button id="snd" class="sb" data-a="snd"></button>';
const NV=[['scale','Трейд'],['grid','Каталог'],['box','Инвентарь'],['mega','Объявл.'],['chart','Рынок'],['gear','Ещё']];
$('nv').innerHTML=NV.map((n,i)=>`<button data-a="tab" data-i="${i}">${I(n[0])}<span>${n[1]}</span><small id="nc${i}"></small></button>`).join('');
function cnt(){
  const tot=ALL.length,live=D.updated&&D.updated!='seed',N=FN??tot,tp=pos(S.give)+pos(S.get),tq=pcs(S.give)+pcs(S.get);
  $('cn').innerHTML=`<span class="${live?'ok':'wn'}">${live?'Цены live':'Стартовая база'} · ${(D.items||[]).length} поз.</span><span>Всего: ${tot}</span><span>Фильтр: ${N}</span><span>Инвентарь: ${pos(S.inv)} поз. / ${pcs(S.inv)} шт</span><span>Трейд: ${tp} поз. / ${tq} шт</span>`;
  $('nc0').textContent=tp+'п/'+tq+'шт';$('nc1').textContent=N+'/'+tot;$('nc2').textContent=pos(S.inv)+'п/'+pcs(S.inv)+'шт';
}
function tab(i){tabNow=i;document.querySelectorAll('.tab').forEach((e,j)=>e.classList.toggle('on',i==j));[...$('nv').children].forEach((e,j)=>e.classList.toggle('on',i==j));$('nv').style.setProperty('--i',i);if(i==2)inv();if(i==3)ad();if(i==4){mk();mkLoad(1)}scrollTo(0,0)}
function dwSync(v){const r=$('dw'),l=$('dwv');if(!r||!l)return;if(v==null){v=S.dw==null?35:S.dw;r.value=v}
  l.textContent=v+'% · '+(v<=5?'вердикт только по цене':v<=40?'в основном цена, спрос и тренд — поправка':v<=70?'цена и спрос примерно поровну':'спрос и тренд решают почти всё')}
function init(){
  rebuild();buildRefs();fillFilters();dwSync();
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
    return `<div class="tu r-${esc(u?.category||'')}">${u?imgTag(u,'tu-i'):''}<div class="tu-n" data-a="det" data-n="${esc(n)}"><b>${esc(n)}</b> ${qb}${sgOn(n)?' <span class="tag">SG</span>':''}${isSigned(u)?' <span class="tag">DEV</span>':''}<div class="m">${pLbl(u,n)} ${tr}${u?` · спрос ${u.demand}/10`:''}</div></div><div class="tu-c"><button class="sm" data-a="qty" data-s="${side}" data-n="${esc(n)}" data-d="-1">−</button><b>${q}</b><button class="sm" data-a="qty" data-s="${side}" data-n="${esc(n)}" data-d="1">+</button><button class="sm" data-a="qty" data-s="${side}" data-n="${esc(n)}" data-d="5">+5</button></div></div>`;
  }).join('')||'<div class="empty">Пусто — добавь юнитов кнопкой ниже</div>';
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
  const dk=dwK();
  let score=clamp(adjPct,-60,60)*1.0+dk*((R.wQ-G.wQ)*0.30+(R.wDem-G.wDem)*2.0+clamp(R.wTr-G.wTr,-60,60)*0.08);
  if(isTrashDump)score-=24;else if(isDowngrade)score-=12;if(isUpgrade)score+=14;
  if(G.imbaShare>=0.6&&R.imbaShare<0.25)score-=6*dk;if(R.imbaShare>=0.6&&G.imbaShare<0.25)score+=6*dk;
  /* цена главная: при реальной выгоде от +20% не отказываем (максимум «СПОРНО»), при реальном минусе от −20% не соглашаемся */
  if(adjPct>=20&&!isTrashDump)score=Math.max(score,-9);
  if(adjPct<=-20&&!isUpgrade)score=Math.min(score,8);

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
    .map(x=>({...x,f:fitCalc(x.u,{nom:need,real:need,q:50})})).filter(x=>x.f&&!x.f.bad).sort((x,y)=>(topNames.has(y.u.name)-topNames.has(x.u.name))||(y.f.sc-x.f.sc));
  if(!pool.length)return '';
  const s1=pool.filter(x=>x.u.value>=need*.75).sort((a,b)=>b.f.sc-a.f.sc)[0];
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

    head=`<div class="row rs-sums"><span class="n rs-g"><em>Отдаю</em><b>${fmt(g)}</b>${G.gems?` <span class="m">(${fmt(G.gems)}💎)</span>`:''}</span><span class="rs-r"><em>Получаю</em><b>${fmt(r)}</b>${GR.gems?` <span class="m">(${fmt(GR.gems)}💎)</span>`:''}</span></div>`
      +(un.length?`<h2 class="${w[0]}">${w[1]}</h2><div class="m">По оценённым: ${df>0?'+':''}${fmt(df)}</div>`:`<h2 class="${w[0]}">${w[1]} ${df>0?'+':''}${fmt(df)} (${p>0?'+':''}${p.toFixed(1)}%)</h2>`);

    const sideBox=(title,st)=>`<div class="cmp-b"><b class="h">${title} (${st.pcs} шт${st.gems?` + ${sfmt(st.gems)}💎`:''})</b><div>Качество: <b>${st.wQ}/100</b> ${gGrade(st.wQ)}</div><div>Спрос: <b>${st.wDem.toFixed(1)}/10</b> · Тренд: <b class="${st.wTr>=10?'win':st.wTr<=-10?'lose':''}">${st.wTr>0?'+':''}${st.wTr}%</b></div><div class="m">Реал. вес: <b>${fmt(st.adjSum)}</b>${st.top?` · топ ${sfmt(st.top.effV)}`:''}</div></div>`;
    const hasBoth=(G.pcs>0||G.gems>0)&&(GR.pcs>0||GR.gems>0);
    const rarLine=hasBoth&&(G.bestRank||GR.bestRank||G.maxDps||GR.maxDps)?`<div class="m" style="margin:4px 0">${(G.bestRank||GR.bestRank)?`Редкость: <b>${G.bestRank?'#'+G.bestRank:'—'}</b> (${G.bestExist?sfmt(G.bestExist):'—'}) → <b>${GR.bestRank?'#'+GR.bestRank:'—'}</b> (${GR.bestExist?sfmt(GR.bestExist):'—'})`:''}${(G.maxDps||GR.maxDps)?` · Max DPS: <b>${sfmt(G.maxDps)}</b> → <b>${sfmt(GR.maxDps)}</b>`:''}</div>`:'';
    const balBar=hasBoth?`<div class="bal" title="Белая точка — номинал, голубая — реал. баланс"><i class="bal-c"></i><i class="bal-m bal-raw" style="left:${rawPos.toFixed(1)}%"></i><i class="bal-m bal-adj" style="left:${adjPos.toFixed(1)}%"></i></div><div class="m" style="display:flex;justify-content:space-between;font-size:10px"><span>LOSE</span><span>● номинал · <b style="color:var(--b)">● реал (${adjPct>0?'+':''}${adjPct.toFixed(0)}%)</b></span><span>WIN</span></div>`:'';

    const needAsk0=hasBoth&&!un.length&&((g>r*1.05)?(g-r):(isDowngrade&&rec[0]!=='go'?Math.max(0,Math.round(G.adjSum*1.15-GR.adjSum)):0)),needAsk=needAsk0||(hasBoth&&!un.length&&rec[0]!=='go'?Math.max(0,Math.round(G.adjSum*1.08-GR.adjSum)):0);
    body=(hasBoth?`<div class="rec ${rec[0]}"><div class="rt"><span>${rec[1]}</span><span class="m" style="color:inherit">баланс ${adjPct>0?'+':''}${adjPct.toFixed(0)}%</span></div><div class="rs">${esc(rec[2])}</div>${quickRepliesHtml(T,g,r)}</div>`:`<div class="note"><b class="tg">[i]</b> Добавь юнитов или гемов на вторую сторону для полной рекомендации.</div>`)
      +balBar+rarLine+`<div class="cmp">${sideBox('Отдаёшь',G)}${sideBox('Получаешь',GR)}</div>`+`<div class="bar"><button class="p" data-a="trDl2">⬇ Подробная картинка</button></div>`
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
