'use strict';
/* ================= ПОДСКАЗКИ ОБМЕНА v3: выгода, алерты, контр-оффер, PNG ================= */
let OFS=[],OFM=null,OFR=[];
const ofBad=a=>a.trend==='down'||a.grade[0]==='trash'||a.grade[0]==='drop';
const ofTier={S:4,A:3,B:2,C:1,D:0},ofTr={up:'📈',down:'📉',stable:'➖'};
function ofGood(i){const a=AN.get(i.name);return!!a&&i.kind==='unit'&&!isSigned(i)&&i.value>0&&(i.demand||0)>=6&&a.trend!=='down'&&(a.mRatio>=1.15||a.mult>=1.12)}
const ofMk=c=>({n:c.u.name,v:c.v,q:c.a.q,t:c.u.tier||'',dps:c.u.maxDps||0,d:c.u.demand||0,tr:c.a.trend});
let OFL=0,OFA=0;
const ofLvl=(nom,real,bad)=>{
  if(OFA)return nom>.15&&nom<=1.5&&real>=.25?(nom>.6?'🎰 ШАНС: партнёр в большом минусе':'🎯 ПРОСИ: партнёр в минусе'):'';
  if(nom>=(bad?-.12:-.05)&&nom<=.15){
    if(real>=.3)return'🔥 ОЧЕНЬ ВЫГОДНО';if(real>=.12)return'✅ ВЫГОДНО';
    if(Math.abs(nom)<=.08&&real>=.06)return'🔁 РАВНО, НО ЛУЧШЕ';if(Math.abs(nom)<=.1&&real>=.04)return'🙂 ЧУТЬ ЛУЧШЕ'}
  if(bad&&nom<-.12&&nom>=-.35&&real>=.1)return'🧹 СЛИВ МУСОРА: теряешь в цене, но уходишь в нормальное';
  if(!bad&&nom<-.05&&nom>=-.2&&real>=.03)return'📈 ВЫГОДНЫЙ МИНУС: '+Math.round(nom*100)+'% номинала, но ходовой — вернёшь при перепродаже';
  if(OFL&&nom>=-.3&&nom<=.25&&real>=-.03)return'⚪ БЛИЖАЙШЕЕ (так себе)';
  return''};
/* Все варианты «получаемой стороны»: 1, 2 или 3 юнита из пула, отсортированы по цене (для бинарного поиска) */
let _tk='',_tv=null;
function ofTargets(pool){
  const key=pool.map(c=>c.u.name+':'+c.v+':'+c.a.mult.toFixed(3)+':'+c.a.q).join('|');
  if(key===_tk&&_tv)return _tv;
  _tv=ofTargetsBuild(pool);_tk=key;return _tv;
}
function ofTargetsBuild(pool){
  const T=[],byQ=[...pool].sort((a,b)=>b.a.q-a.a.q||b.v-a.v),P2=byQ.slice(0,70),P3=byQ.slice(0,38),P4=byQ.slice(0,20);
  pool.forEach(c=>T.push({c:[c],v:c.v,e:c.e}));
  for(let i=0;i<P2.length;i++)for(let j=i+1;j<P2.length;j++)T.push({c:[P2[i],P2[j]],v:P2[i].v+P2[j].v,e:P2[i].e+P2[j].e});
  for(let i=0;i<P3.length;i++)for(let j=i+1;j<P3.length;j++)for(let k=j+1;k<P3.length;k++)T.push({c:[P3[i],P3[j],P3[k]],v:P3[i].v+P3[j].v+P3[k].v,e:P3[i].e+P3[j].e+P3[k].e});
  for(let i=0;i<P4.length;i++)for(let j=i+1;j<P4.length;j++)for(let k=j+1;k<P4.length;k++)for(let l=k+1;l<P4.length;l++)T.push({c:[P4[i],P4[j],P4[k],P4[l]],v:P4[i].v+P4[j].v+P4[k].v+P4[l].v,e:P4[i].e+P4[j].e+P4[k].e+P4[l].e});
  return T.sort((a,b)=>a.v-b.v);
}
/* Лучший вариант «что взять» за сумму s (реальная ценность eS). giveN — сколько штук отдаём, excl — имена, которые брать нельзя */
function ofFind(T,s,eS,bad,giveN,excl,maxN,gQ,topN=1,allow11=0){
  const lo=OFA?s*1.15:s*((bad||OFL)?.65:.82),hi=OFA?s*2.5:s*(S.ofBun!==0||OFL?1.4:1.15);let a=0,b=T.length;
  while(a<b){const m=(a+b)>>1;if(T[m].v<lo)a=m+1;else b=m}
  const out=[];
  for(let i=a;i<T.length&&T[i].v<=hi;i++){
    const t=T[i],n=t.c.length;
    if(n>maxN||(n===1&&giveN===1&&!allow11))continue;
    const nom=(t.v-s)/s,real=(t.e-eS)/eS;let l=ofLvl(nom,real,bad);
    if(!l&&S.ofBun!==0&&!OFA&&n>=2&&nom>.15&&nom<=.4&&real>=.15)l='🤝 СВЯЗКОЙ: партнёр в минусе';
    if(!l)continue;
    if(t.c.some(c=>excl.has(c.u.name)))continue;
    const tq=t.c.reduce((x,c)=>x+c.a.q*c.v,0)/t.v;
    const sc=real*100+(n<giveN?3*(giveN-n):0)+(tq-gQ)/6-(nom>.15?30+nom*100:0);
    out.push({t,nom,real,l,sc,tq});
  }
  return out.sort((x,y)=>y.sc-x.sc).slice(0,topN);
}
function ofPool(){
  /* Кандидаты «что получить»: сильные юниты + нормальные середняки (спрос от 2.5, цена не обвалена).
     Резкий взлёт (+100% и больше за 14 дней) считаем рискованным: реальную ценность режем. */
  return ALL.filter(u=>u.kind==='unit'&&u.category!=='Signed').map(u=>{const a=AN.get(u.name),v=val(u.name);return a&&v>=15?{u,a,v,e:v*(a.trPct>=100?a.mult-.12:a.mult)}:null})
    .filter(c=>c&&!c.u.flags.some(f=>/Dropping|Unwanted/.test(f))&&c.a.trend!=='down'&&(((c.u.demand||0)>=4.5)||((c.u.demand||0)>=2.5&&c.a.mult>=.8)));
}
/* Общий судья: подбор показывает только то, что «Проверка трейда» не бракует. give/get — объекты {имя: кол-во} */
function ofSane(give,get){try{return analyzeTrade(give,get,0,0).rec[0]!=='no'}catch(e){return true}}
const ofObjOf=a=>{const o={};a.forEach(x=>o[x.n]=(o[x.n]||0)+1);return o};
function ofOpts(x,pool,n=2){
  if(x.v<15)return[];
  const xe=x.v*x.a.mult,bad=ofBad(x.a);
  const lvl=(nom,real)=>ofLvl(nom,real,bad);
  return pool.filter(c=>c.u.name!==x.n).map(c=>{
    const nom=(c.v-x.v)/x.v,real=(c.e-xe)/xe,l=lvl(nom,real);if(!l)return null;
    const why=[],dd=(c.u.demand||0)-(x.u.demand||0),pw=c.u.tier&&x.u.tier?ofTier[c.u.tier]-ofTier[x.u.tier]:0;
    if(Math.abs(dd)>=1.5)why.push('спрос '+x.u.demand+'→'+c.u.demand);
    if(c.a.trend!==x.a.trend)why.push(ofTr[x.a.trend]+'→'+ofTr[c.a.trend]);
    if(pw>0)why.push('сильнее в игре ('+c.u.tier+')');
    return{...ofMk(c),lvl:l,why:why.join(' · '),nom:Math.round(nom*100),s:real*100+pw*2};
  }).filter(Boolean).sort((p,q)=>q.s-p.s).filter(o=>ofSane({[x.n]:1},{[o.n]:1})).slice(0,n);
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
function ofDiv(list,max,per=2){
  const used={},seen=new Set(),out=[];
  for(const f of list){
    const names=f.get.map(g=>g.n),k=[...names].sort().join('|');
    if(seen.has(k)||names.some(n=>(used[n]||0)>=per))continue;
    seen.add(k);names.forEach(n=>used[n]=(used[n]||0)+1);out.push(f);if(out.length>=max)break;
  }
  return out;
}
function ofEvalParts(parts,cnt,T,topN=1,allow11=0){
  const s0=parts.reduce((a,p)=>a+p.x.v*p.k,0),eS=parts.reduce((a,p)=>a+p.x.v*p.k*p.x.a.mult,0);
  if(!(s0>0))return[];
  const bad=parts.reduce((a,p)=>a+(ofBad(p.x.a)?p.x.v*p.k:0),0)>=s0*.5;
  const gQ=parts.reduce((a,p)=>a+p.x.a.q*p.x.v*p.k,0)/s0,excl=new Set(parts.map(p=>p.x.n));
  const give={};parts.forEach(p=>give[p.x.n]=p.k);
  const gD=parts.reduce((a,p)=>a+(p.x.u.demand||0)*p.x.v*p.k,0)/s0;
  const cand=ofFind(T,s0,eS,bad,cnt,excl,S.ofBun!==0?Math.min(4,Math.max(2,cnt+1)):(cnt>=5?4:Math.min(3,Math.max(2,cnt))),gQ,Math.max(topN,8),allow11).map(r=>{
    const tD=r.t.c.reduce((a,c)=>a+(c.u.demand||0)*c.v,0)/r.t.v,why=[];
    if(r.t.c.length<cnt)why.push(cnt+' шт → '+r.t.c.length+': меньше слотов, сильнее юниты');
    if(Math.abs(tD-gD)>=1)why.push('спрос '+gD.toFixed(1)+'→'+tD.toFixed(1));
    if(r.tq-gQ>=6)why.push('качество '+Math.round(gQ)+'→'+Math.round(r.tq));
    return{give,giveN:cnt,get:r.t.c.map(c=>({n:c.u.name,v:c.v,tr:c.a.trend})),s:s0,tv:r.t.v,nom:Math.round(r.nom*100),g:Math.round(r.real*100),lvl:r.l,why:why.join(' · '),sc:r.sc};
  });
  const res=[];
  for(const f of cand){if(ofSane(give,ofObjOf(f.get)))res.push(f);if(res.length>=topN)break}
  return res;
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
  const un=ent.filter(x=>x.u.kind==='unit'&&x.v>=15).slice(0,8),T=ofTargets(pool);
  let _cmb=null;
  const mkCombos=()=>{
  const found=[];
  const evalCombo=(parts,cnt)=>found.push(...ofEvalParts(parts,cnt,T));
  const rec=(i,parts,cnt)=>{
    if(i===un.length){if(cnt>=1)evalCombo(parts,cnt);return}
    rec(i+1,parts,cnt);
    for(let k=1;k<=un[i].q&&cnt+k<=6;k++)rec(i+1,[...parts,{x:un[i],k}],cnt+k);
  };
  rec(0,[],0);
  const bonus=f=>S.ofBun!==0&&f.giveN>1&&f.get.length>=Math.min(f.giveN,4)?8:0;
  found.sort((x,y)=>(y.sc+bonus(y))-(x.sc+bonus(x)));
  const combos=[],usedGive={};
  for(const f of ofDiv(found,40,2)){
    const names=Object.keys(f.give);if(names.some(n=>(usedGive[n]||0)>=3))continue;
    names.forEach(n=>usedGive[n]=(usedGive[n]||0)+1);combos.push(f);if(combos.length>=10)break;
  }
  return combos};
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
  return{upd:D.updated||'',items,get combos(){return _cmb||(_cmb=mkCombos())},gems,gemBuy,top,alerts:ofAlerts(ent),ent,T};
}
const ofTopRow=r=>`<div class="row">${imgTag(IDX.get(r.n),'u')}<span class="n" data-a="det" data-n="${esc(r.n)}" style="cursor:pointer">${esc(r.n)} ${r.t?`<span class="qb">TIER ${r.t}</span>`:''}<div class="m">${r.dps?'DPS '+fmt(r.dps)+' · ':''}${r.v?fmt(r.v)+' · ':''}спрос ${r.d}/10 ${ofTr[r.tr]}</div></span></div>`;
const ofAlHtml=a=>`<div class="${a.k==='bad'?'bad':'note'}"><b class="${a.k==='bad'?'lose':'win'}">${a.k==='bad'?'[✕]':'[+]'}</b> ${esc(a.t)}</div>`;
const ofIm=(u,c='of-im')=>u&&u.img?`<img class="${c}" src="${esc(u.img)}" loading="lazy" onerror="this.outerHTML='<div class=\\'${c} ph\\'>?</div>'">`:`<div class="${c} ph">?</div>`;
const ofTile=(n,q,v)=>{const u=IDX.get(n);return`<div class="of-u r-${esc(u?.category||'')}" data-a="det" data-n="${esc(n)}">${ofIm(u)}${q>1?`<b class="of-q">×${q}</b>`:''}<span class="of-n">${esc(n)}</span><i>${fmt(v)}</i></div>`};
function ofCard(o,k){
  const gt=o.gems?`<div class="of-u"><div class="of-im ph">💎</div><span class="of-n">Гемы</span><i>${fmt(o.gems)}</i></div>`:Object.entries(o.give).map(([n,q])=>ofTile(n,q,val(n)||AN.get(n)?.est||0)).join('');
  const rt=o.get.map(x=>ofTile(x.n,1,x.v)).join('');
  return`<div class="of-card ${/ОЧЕНЬ/.test(o.lvl)?'hot':''}"><div class="of-top"><b class="of-lvl">${o.lvl}</b>${o.g!=null?`<span class="of-pct">${o.g>=0?'+':''}${o.g}% реально</span>`:''}</div><div class="of-flow"><div class="of-side">${gt}</div><div class="of-arr">➜</div><div class="of-side">${rt}</div></div><div class="of-sum">${fmt(o.s)} → <b>${fmt(o.tv)}</b> <span class="m">(${o.nom>=0?'+':''}${o.nom}% по цене)</span></div>${o.why?`<div class="m">${esc(o.why)}</div>`:''}${o.nom>60&&!o.gems?`<div class="m">Шанс небольшой: партнёр отдаёт на ${o.nom}% больше по цене. Попробуй, но не рассчитывай. Если согласится, ты сильно выигрываешь.</div>`:o.nom>15&&!o.gems?`<div class="m">Партнёр теряет около ${o.nom}% по цене: проси, но будь готов сбавить.</div>`:''}<button class="p of-go" data-a="ofTrade" data-k="${k}">В трейд →</button></div>`;
}
/* ===== Проверка обмена: я выбираю, кого отдаю, и отдельно, кого мне предлагают ===== */
function ofAddQ(n,d){const o=S.ofGet||(S.ofGet={});if(!IDX.has(n))return;const tot=Object.values(o).reduce((x,y)=>x+y,0);if(d>0){const k=Math.min(d,12-tot);if(k<=0){toast('Максимум 12 штук');return}o[n]=(o[n]||0)+k}else{o[n]=(o[n]||0)+d;if(o[n]<=0)delete o[n]}save()}
function ofPickClosed(){ofr()}
function ofOffObj(){const o={};Object.entries(S.ofGet||{}).forEach(([n,q])=>{if(IDX.has(n)&&q>0)o[n]=q});return o}
function ofCheckHtml(m,sel){
  const off=ofOffObj(),offN=Object.values(off).reduce((a,b)=>a+b,0),gg=Math.max(0,Math.round(+S.ofgg||0)),selN=Object.values(sel).reduce((a,b)=>a+b,0);
  const rows=Object.entries(off).map(([n,q])=>`<div class="row">${imgTag(IDX.get(n),'u')}<span class="n">${esc(n)} <span class="qb">×${q}</span><div class="m">${fmt(val(n))}</div></span><button class="sm" data-a="ofGDec" data-n="${esc(n)}">−</button><button class="sm" data-a="ofGAdd" data-n="${esc(n)}">+</button></div>`).join('');
  let verdict='';
  if(offN||gg){
    if(!selN)verdict='<div class="warn">Выбери выше, кого ты отдаёшь, и я сравню.</div>';
    else{
      const T=analyzeTrade(sel,off,0,gg),G=T.G,R=T.R,nom=G.estSum?(R.estSum-G.estSum)/G.estSum*100:0,gap=Math.round(G.adjSum-R.adjSum);
      const cls=T.rec[0]==='go'?'note':T.rec[0]==='no'?'bad':'warn';
      const pl=nom>=3?`Партнёр отдаёт на ${Math.round(nom)}% больше по цене: он в минусе, это твой шанс.`:nom<=-3?`Партнёр получает на ${Math.round(-nom)}% больше по цене, чем отдаёт.`:'По цене примерно поровну.';
      const adv=gap>0?`Чтобы было честно по реальной ценности, проси доплату около ${fmt(gap)} 💎.`:`Запас по реальной ценности: около ${fmt(-gap)} 💎.`;
      verdict=`<div class="${cls}"><b>${esc(T.rec[1])}</b><div class="m">${esc(T.rec[2])}</div></div>`
        +`<div class="of-sum">Отдаёшь ${fmt(G.estSum)} → получаешь <b>${fmt(R.estSum)}</b> <span class="m">(${nom>=0?'+':''}${Math.round(nom)}% по цене)</span></div>`
        +`<div class="m">${pl}</div><div class="m">Реально (спрос, тренд, метки): ${fmt(G.adjSum)} → ${fmt(R.adjSum)} (${T.adjPct>=0?'+':''}${Math.round(T.adjPct)}%) · качество ${G.wQ}→${R.wQ} · спрос ${G.wDem.toFixed(1)}→${R.wDem.toFixed(1)}</div><div class="m">${adv}</div>`
        +T.notes.map(([k,t])=>`<div class="${k==='bad'?'bad':k==='w'?'warn':'note'}">${esc(t)}</div>`).join('')
        +`<button class="p of-go" data-a="ofCheckGo">В трейд →</button>`;
    }
  }
  return`<div class="of-h">🧪 Проверка обмена: что мне предлагают</div><div class="m">Выше выбери, кого отдаёшь. Затем нажми кнопку и выбери тех, кого предлагает партнёр: фильтры и плитки как в каталоге.</div><button class="p of-pickbtn" data-a="pick" data-m="of">➕ Выбрать из каталога</button>${offN?`<div class="of-h">Предлагают (${offN} шт)</div>${rows}`:''}<div class="ofr-c"><span class="lb">Гемы от партнёра</span><input type="number" min="0" inputmode="numeric" data-c="ofgg" value="${gg||''}" placeholder="0" style="width:110px"><button class="sm" data-a="ofGClr">Очистить</button></div>${verdict}`;
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
    let full=[],fullB=[],subs=[];const mn=Math.min(selN,4),allF=ofEvalParts(parts,selN,m.T,40,1);
    if(S.ofBun!==0&&selN>1){fullB=ofDiv(allF.filter(f=>f.get.length>=mn),4,2);full=ofDiv(allF.filter(f=>f.get.length<mn),4,2)}else full=ofDiv(allF,6,2);
    let ask=[];OFA=1;try{ask=ofDiv(ofEvalParts(parts,selN,m.T,40,1),5,1)}finally{OFA=0}
    if(!full.length&&!fullB.length){OFL=1;full=ofDiv(ofEvalParts(parts,selN,m.T,14,1),4,2);OFL=0}
    if(selN>1){const rec=(i,cur,c)=>{if(i===parts.length){if(c>=1&&c<selN)subs.push(...ofEvalParts(cur,c,m.T,2,1));return}rec(i+1,cur,c);for(let k=1;k<=parts[i].k&&c+k<=5;k++)rec(i+1,[...cur,{x:parts[i].x,k}],c+k)};rec(0,[],0)}
    subs.sort((a,b)=>b.sc-a.sc);const subTop=ofDiv(subs,6,2);
    res=`<div class="of-h">Выбрано: ${selN} шт · ${fmt(sv)}</div>`
      +(fullB.length?`<div class="of-h">Связка за связку (${mn} шт и больше)</div>${fullB.map(card).join('')}`:'')
      +(full.length?`<div class="of-h">${fullB.length?'Меньше юнитов, но выгоднее':'Что взять за всю связку'}</div>${full.map(card).join('')}`:(fullB.length?'':'<div class="warn">За всю связку целиком выгодного обмена не нашёл.</div>'))
      +(subTop.length?`<div class="of-h">Можно выгоднее: разбить связку</div>${subTop.map(card).join('')}`:'')
      +(ask.length?`<div class="of-h">Можно попросить больше (партнёр в минусе, это шанс)</div>${ask.map(card).join('')}`:'');
  }else{
    res=m.combos.length?`<div class="of-h">Лучшие обмены из твоего инвентаря</div>${m.combos.slice(0,8).map(card).join('')}`:'<div class="warn">Сейчас выгодных обменов нет. Выбери юнитов выше — проверю любую связку.</div>';
  }
  const al=m.alerts.length?`<details class="ofr-d"><summary>🔔 Изменения цен у тебя (${m.alerts.length})</summary>${m.alerts.map(ofAlHtml).join('')}</details>`:'';
  const sg=m.items.filter(r=>!r.tiny&&r.opts.length).slice(0,10),sgN=sg.reduce((a,r)=>a+r.opts.length,0);
  const singles=`<details class="ofr-d"><summary>🔁 Замены по одному юниту (${sgN})</summary>${sg.map(r=>r.opts.map(o=>card({give:{[r.n]:1},get:[{n:o.n,v:o.v}],s:r.v,tv:o.v,nom:o.nom,lvl:o.lvl,why:o.why})).join('')).join('')||'<div class="m">Выгодных замен по одному нет.</div>'}</details>`;
  const gems=`<details class="ofr-d"><summary>💎 Что взять за гемы</summary><div class="ofr-c"><span class="lb">Гемы на руках</span><input type="number" min="0" inputmode="numeric" data-c="ofg" value="${m.gems||''}" placeholder="сколько гемов" style="width:130px"></div>${m.gemBuy.map(t=>card({gems:Math.round(t.v),give:{},get:[{n:t.n,v:t.v}],s:Math.round(t.v),tv:t.v,nom:0,g:t.g,lvl:'💎 ЗА ГЕМЫ',why:''})).join('')}</details>`;
  const top=`<details class="ofr-d"><summary>🏆 Топ юнитов по классам</summary>${m.top.map(([t,l])=>`<div class="ofr-c"><span class="lb">${t}</span></div>${l.map(ofTopRow).join('')||'<div class="m">—</div>'}`).join('')}</details>`;
  keepDetails(el,`<h3>Что менять</h3><div class="m">Нажимай на юнитов, которых готов отдать (ещё тап — ещё копия). Ниже покажу, на что их выгодно менять.</div><div class="of-pick">${picks}</div><div class="bar"><button data-a="ofClr">Сбросить выбор</button><button data-a="ofWeak">Выбрать слабых</button></div><label class="sw"><input type="checkbox" data-c="ofBun" ${S.ofBun!==0?'checked':''}> Отдельно показывать связки: столько же юнитов или больше</label>${ofCheckHtml(m,sel)}${res}${al}${singles}${gems}${top}<div class="bar"><button class="p" data-a="ofDl">⬇ Заметка</button><button data-a="ofPng">🖼 PNG</button><button data-a="ofCp">📋 Текст</button></div>`);
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
  const best=ofFind(ofTargets(pool),v,e,bad,pc,excl,3,gQ,14,1).map(r=>({names:r.t.c.map(c=>c.u.name),sum:r.t.v,nom:r.nom,l:r.l})).filter(o=>ofSane(S.give,ofObjOf(o.names.map(n=>({n}))))).slice(0,5);
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
