'use strict';
/* ================= РЫНОК ТРЕЙДОВ (данные бота, ветка market) ================= */
const MKU='https://raw.githubusercontent.com/dinissaburov2009-maker/ctd-trader/market/',MKS='https://cameraman-td.vaultedvaluesx.com/trade-ads/';
const MKF={o:'Offers',u:'Upgrade',d:'Downgrade',a:'Adds'},MKAGE=[[0,'Все'],[900,'15 мин'],[3600,'1 час'],[21600,'6 часов']],MKSORT=[['new','Новые'],['pct','Выгодные мне'],['sum','Крупные']],MKSIDE=[['all','Везде'],['has','Отдают'],['want','Ищут']];
const MKFIX={'item-2b19d9cc':'2x Turkey Leg'}; /* юниты, у которых бот записал имя «x3»: определено по цене (14 объявлений, везде ровно 2600) */
let MK={sel:new Set(),ads:[],names:[],map:[],nk:[],src:'live',days:null,q:'',side:'all',fl:new Set(),rar:new Set(),only:0,gem:0,age:900,sort:'new',mine:0,lim:30,at:0,err:'',busy:0,vc:new Map(),vsig:'',bot:'',via:''};
const mkAgo=t=>{const s=Math.max(0,Date.now()/1e3-t),d=new Date(t*1e3);return s<45?'только что':s<3600?Math.round(s/60)+' мин назад':s<86400?Math.round(s/3600)+' ч назад':d.toLocaleDateString('ru')+' '+d.toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit'})};
const mkClean=ls=>(Array.isArray(ls)?ls:ls?.ads||[]).filter(a=>a&&a.i&&Array.isArray(a.h)&&Array.isArray(a.w));
function mkPrep(names,ads){MK.names=Array.isArray(names)?names:[];MK.map=MK.names.map(x=>{const f=Object.keys(MKFIX).find(k=>(x?.s||'').startsWith(k));return resolveName(f?MKFIX[f]:x?.n)});MK.nk=MK.names.map((x,i)=>nrm(x?.n)+'|'+nrm(MK.map[i]));MK.ads=ads;MK.vc.clear();MK.lim=30;const c=$('nc4');if(c)c.textContent=ads.length>999?Math.round(ads.length/100)/10+'K':ads.length}
/* Канал данных: сначала GitHub API (свежее, кэш ~60 с, повторные запросы с ETag не тратят лимит), при любой ошибке (лимит 60/час, сеть) запасной raw.githubusercontent (кэш до нескольких минут). */
const MKAPI='https://api.github.com/repos/dinissaburov2009-maker/ctd-trader/contents/';
async function mkGet(name,m){
  try{
    const r=await fetch(MKAPI+name+'?ref=market',{headers:{Accept:'application/vnd.github.raw+json'},cache:m?'no-cache':'default'});
    if(r.ok){
      let j=await r.json();
      if(j&&!Array.isArray(j)&&j.encoding==='base64'&&j.content)j=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(j.content.replace(/\n/g,'')),c=>c.charCodeAt(0))));
      return{j,via:'API'};
    }
  }catch{}
  const r=await fetch(MKU+name+'?t='+Math.floor(Date.now()/15000),{cache:'no-store'});
  if(!r.ok)throw new Error('HTTP '+r.status+' (репозиторий должен быть публичным, ветка market — существовать)');
  return{j:await r.json(),via:'raw'};
}
async function mkLoad(m){
  if(MK.busy||MK.src!=='live')return;MK.busy=1;MK.err='';if(m&&tabNow===4)mk();
  try{
    const[rn,rl]=await Promise.all([mkGet('names.json',m),mkGet('latest.json',m)]);
    let bu='';
    if(rl.via==='raw'){try{const rm=await fetch(MKU+'meta.json?t='+Math.floor(Date.now()/15000),{cache:'no-store'});if(rm.ok)bu=(await rm.json()).updated||''}catch{}}
    if(MK.src==='live'){mkPrep(rn.j,mkClean(rl.j));MK.at=Date.now();MK.bot=bu;MK.via=rl.via}
  }catch(e){MK.err=String(e?.message||e)}
  MK.busy=0;if(tabNow===4)mk();
}
async function mkDays(){
  try{const r=await fetch(MKU+'archive/index.json?t='+Math.floor(Date.now()/30000),{cache:'no-store'});if(!r.ok)throw 0;const j=await r.json();MK.days=j.days||{}}catch{MK.days={};MK.err='Архив недоступен'}
  mk();
}
async function mkArchDay(day){
  const hs=MK.days?.[day];if(!hs?.length||MK.busy)return;MK.busy=1;MK.err='';MK.src=day;mk();
  try{
    const o={cache:'no-store'},[rn,...rs]=await Promise.all([fetch(MKU+'names.json?t='+Math.floor(Date.now()/30000),o),...hs.map(h=>fetch(`${MKU}archive/${day}/${h}.json`,o))]);
    if(!rn.ok)throw new Error('HTTP '+rn.status);
    const parts=await Promise.all(rs.map(r=>r.ok?r.json().catch(()=>[]):[])),seen=new Set(),ads=mkClean(parts.flatMap(p=>mkClean(p))).filter(a=>seen.has(a.i)?0:seen.add(a.i)).sort((a,b)=>b.t-a.t);
    mkPrep(await rn.json(),ads);MK.at=Date.now();
  }catch(e){MK.err=String(e?.message||e)}
  MK.busy=0;mk();
}
function mkVd(a){
  const sig=S.dw+'|'+S.mk+'|'+D.updated+'|'+MK.map.length+'|'+ALL.length;if(sig!==MK.vsig){MK.vc.clear();MK.vsig=sig}
  if(MK.vc.has(a.i))return MK.vc.get(a.i);
  const hv={},wv={};let bad=0;
  for(const[x,q]of a.h){const n=MK.map[x];if(n)hv[n]=(hv[n]||0)+q;else bad++}
  for(const[x,q]of a.w){const n=MK.map[x];if(n)wv[n]=(wv[n]||0)+q;else bad++}
  let r=null;
  if(Object.keys(hv).length&&Object.keys(wv).length){try{const T=analyzeTrade(wv,hv,0,0);r={rec:T.rec,pct:T.adjPct,bad}}catch{}}
  MK.vc.set(a.i,r);return r;
}
function mkHit(a){
  const w=[...new Set(a.w.map(([x])=>MK.map[x]).filter(n=>n&&S.inv[n]>0))],h=[...new Set(a.h.map(([x])=>MK.map[x]).filter(n=>n&&(n===S.goal||S.fav[n])))];
  return{w,h,any:!!(w.length||h.length)};
}
const MKGEM=/(\d[\d.,]*\s*[kKкК]?\s*(?:💎|gems?\b|гем\w*)|(?:💎|gems?\b|гем\w*)\s*\d[\d.,]*\s*[kKкК]?)/gi;
const mkNote=n=>esc(n).replace(MKGEM,'<b class="win">$1</b>');
const mkRarOrder=['Godly','Exclusive','Mythic','Legendary','Epic','Rare','Uncommon','Common','Signed'];
function mkRar(){const cs=[...new Set(ALL.filter(i=>i.kind==='unit').map(i=>i.category).filter(Boolean))];return cs.sort((a,b)=>{const x=mkRarOrder.indexOf(a),y=mkRarOrder.indexOf(b);return(x<0?99:x)-(y<0?99:y)||(a<b?-1:1)})}
function mkFiltered(){
  const q=nrm(MK.q),now=Date.now()/1e3;
  let L=MK.ads.filter(a=>{
    if(MK.age&&MK.src==='live'&&now-a.t>MK.age)return 0;
    if(MK.fl.size&&![...MK.fl].some(c=>(a.f||'').includes(c)))return 0;
    if(q||MK.rar.size||MK.sel.size){
      /* юнит подходит: имя содержит запрос И (если выбраны редкости) его редкость среди выбранных */
      const um=x=>(!q||(MK.nk[x]||'').includes(q))&&(!MK.sel.size||MK.sel.has(MK.map[x]))&&(!MK.rar.size||MK.rar.has(IDX.get(MK.map[x])?.category));
      const sides=MK.side==='has'?[a.h]:MK.side==='want'?[a.w]:[a.h,a.w];
      /* «Только он»: на стороне нет других юнитов, все подходят (×N одного юнита — нормально) */
      if(!sides.some(sd=>MK.only?sd.length&&sd.every(([x])=>um(x)):sd.some(([x])=>um(x))))return 0;
    }
    if(MK.gem&&!(a.n&&/💎|gems?\b|гем/i.test(a.n)))return 0;
    if(MK.mine&&!mkHit(a).any)return 0;
    return 1;
  });
  if(MK.sort==='pct')L=L.map(a=>[a,mkVd(a)]).sort((x,y)=>(y[1]?y[1].pct:-1e9)-(x[1]?x[1].pct:-1e9)).map(x=>x[0]);
  else if(MK.sort==='sum')L=[...L].sort((x,y)=>Math.max(y.hv||0,y.wv||0)-Math.max(x.hv||0,x.wv||0));
  return L;
}
const MKV={go:'Выгодно',mid:'Спорно — можно торговаться',no:'Невыгодно'};
function mkSide(arr,empty){
  return arr.length?arr.map(([x,q])=>{const n=MK.map[x],u=n&&IDX.get(n),qq=q>1?`<b class="mk-q">×${q}</b>`:'';
    return u?`<div class="mk-u r-${esc(u.category)}" data-a="det" data-n="${esc(n)}">${imgTag(u,'mk-i')}<span class="mk-n">${esc(n)}${qq}</span><em>${sfmt(u.value)}</em></div>`
      :`<div class="mk-u unk" title="Юнит не опознан"><span class="mk-n">? ${esc(MK.names[x]?.n||'юнит #'+x)}${qq}</span></div>`}).join(''):`<div class="mk-empty">${empty}</div>`;
}
function mkCard(a){
  const vd=mkVd(a),ht=mkHit(a),fl=[...(a.f||'')].map(c=>MKF[c]).filter(Boolean),sm=v=>v==null?'O/C':sfmt(v);
  const k=vd?vd.rec[0]:'',vl=vd?(MKV[k]||String(vd.rec[1]).replace(/^\[.\]\s*/,'')):'';
  const vh=vd?`<div class="rec ${k} mk-v"><span class="mk-vl">${esc(vl)}</span><span class="mk-vp">${vd.pct>0?'+':''}${vd.pct.toFixed(0)}%</span>${vd.bad?`<small>не опознано: ${vd.bad}</small>`:''}</div>`
    :`<div class="mk-v0">${!a.h.length?'Ничего не отдаёт':!a.w.length?'Ждёт предложений, цену не назвал':'Вердикт недоступен: юниты не опознаны'}</div>`;
  const hit=(ht.w.length?`<div class="mk-hit">🎒 Хотят то, что у тебя есть: ${ht.w.map(esc).join(', ')}</div>`:'')+(ht.h.length?`<div class="mk-hit">🎯 Отдают из твоих целей и избранного: ${ht.h.map(esc).join(', ')}</div>`:'');
  return`<div class="card mk-card${ht.any?' mk-mine':''}"><div class="mk-h"><span class="mk-ago">${mkAgo(a.t)}</span>${fl.map(f=>`<span class="tag">${f}</span>`).join('')}${ht.any?'<span class="mk-star">🎯 для тебя</span>':''}</div>
  <div class="mk-cols"><div class="mk-col mk-give"><h4><span>Отдаёт</span><b>${sm(a.hv)}</b></h4>${mkSide(a.h,'Ничего не отдаёт')}</div><div class="mk-sw">⇄</div><div class="mk-col mk-want"><h4><span>Хочет</span><b>${sm(a.wv)}</b></h4>${mkSide(a.w,'Ждёт предложений')}</div></div>
  ${a.n?`<div class="mk-note">📝 ${mkNote(a.n)}</div>`:''}${vh}${hit}<div class="mk-act"><button class="sm" data-a="mkTake" data-i="${esc(a.i)}">⚖ В калькулятор</button><a class="mk-lnk" href="${MKS}${esc(a.i)}" target="_blank" rel="noopener noreferrer">На сайте ↗</a></div></div>`;
}
const mkCh=(act,list,cur)=>list.map(([v,l])=>`<button data-a="${act}" data-v="${v}" class="${cur(v)?'on':''}">${l}</button>`).join('');
function mk(){
  const R=$('mkl'),C=$('mkc');if(!R||!C)return;
  const L=mkFiltered(),live=MK.src==='live',newest=MK.ads.reduce((m,a)=>Math.max(m,a.t),0),mn=MK.ads.filter(a=>mkHit(a).any).length;
  const nf=(MK.side!=='all')+MK.fl.size+MK.rar.size+MK.only+MK.gem+(MK.age!==900)+(MK.sort!=='new')+MK.mine+(MK.sel.size?1:0),days=MK.days?Object.keys(MK.days).sort().reverse().slice(0,30):null;
  C.innerHTML=`<div class="card mk-pk"><div class="bar" style="margin:0"><button class="p" data-a="pick" data-m="mk">🔎 Выбрать юнитов${MK.sel.size?' ('+MK.sel.size+')':''}</button>${MK.sel.size?'<button data-a="mkSelClr">Сбросить</button>':''}</div>${MK.sel.size?`<div class="fchips" style="margin-top:6px">${[...MK.sel].map(n=>`<button class="on" data-a="mkSelDel" data-n="${esc(n)}">${esc(n)} ✕</button>`).join('')}</div>`:'<div class="m" style="margin-top:4px">Открой окно с фильтрами и отметь юнитов — покажу объявления, где они есть.</div>'}</div><div class="card mk-st"><b class="${MK.err?'lose':'win'}">${live?'LIVE':'АРХИВ '+MK.src}</b> · ${MK.ads.length} объявл. · показано ${L.length}${MK.busy?' · загрузка…':''}<br><span class="m">${MK.at?'обновлено '+new Date(MK.at).toLocaleTimeString('ru'):'ещё не загружено'}${newest?' · самое свежее: '+mkAgo(newest):''}${live&&MK.via?' · канал: '+MK.via:''}${live&&MK.bot?' · бот записал (raw): '+mkAgo(Date.parse(MK.bot)/1e3):''}</span>${MK.err?`<br><span class="lose">⚠ ${esc(MK.err)}</span>`:''}</div>
  <details class="card mk-flt"${MK.fo?' open':''}><summary>Фильтры и сортировка <span class="mk-fc">${nf?'· активно: '+nf:''}</span></summary><div class="fg-t">ГДЕ ИСКАТЬ ЮНИТА</div><div class="fchips">${mkCh('mkS',MKSIDE,v=>MK.side===v)}</div>
  <div class="fg-t">МЕТКИ <span class="m">(можно несколько)</span></div><div class="fchips">${mkCh('mkF',[['','Все'],...Object.entries(MKF)],v=>v?MK.fl.has(v):!MK.fl.size)}</div>
  <div class="fg-t">РЕДКОСТЬ ЮНИТА <span class="m">(можно несколько)</span></div><div class="fchips">${mkCh('mkR',[['','Все'],...mkRar().map(c=>[c,c])],v=>v?MK.rar.has(v):!MK.rar.size)}</div>
  <div class="fg-t">СТРОГОСТЬ ПОИСКА</div><div class="fchips"><button data-a="mkOnly" class="${MK.only?'on':''}">☝ Только он: без других юнитов на стороне</button><button data-a="mkGem" class="${MK.gem?'on':''}">💎 Гемы в описании</button></div>
  <div class="fg-t">СВЕЖЕСТЬ</div><div class="fchips">${mkCh('mkA',MKAGE,v=>MK.age===+v)}</div>
  <div class="fg-t">СОРТИРОВКА</div><div class="fchips">${mkCh('mkO',MKSORT,v=>MK.sort===v)}<button data-a="mkMine" class="${MK.mine?'on':''}">🎯 Для меня (${mn})</button></div>
  </details><div class="bar mk-bar"><button data-a="mkRef">↻ Обновить</button><button data-a="mkSrc" data-v="live" class="${live?'p':''}">LIVE</button><button data-a="mkSrc" data-v="arch" class="${live?'':'p'}">📦 Архив</button></div>
  ${days?`<div class="fchips sc">${days.length?days.map(d=>`<button data-a="mkDay" data-v="${d}" class="${MK.src===d?'on':''}">${d.slice(5)} (${MK.days[d].length} ч)</button>`).join(''):'<span class="m">Архив пока пуст</span>'}</div>`:''}
  <div class="m" style="margin-top:6px">Вердикт — если ты берёшь объявление: отдаёшь то, что хочет автор, получаешь то, что он отдаёт. Данные идут с задержкой в 1–5 мин (бот сканирует сайт раз в 30 с, пушит раз в минуту, вкладка опрашивает раз в 15 с), закрытые объявления не отслеживаются.</div>`;
  const fd=C.querySelector('.mk-flt');if(fd)fd.addEventListener('toggle',()=>{MK.fo=fd.open});
  R.innerHTML=L.slice(0,MK.lim).map(mkCard).join('')+(L.length>MK.lim?`<button style="width:100%" data-a="mkMore">Показать ещё (${L.length-MK.lim})</button>`:'')+(!L.length?`<div class="card m">${MK.ads.length?'По фильтрам ничего не найдено.':MK.busy?'Загрузка…':'Нет данных.'}</div>`:'');
}
setInterval(()=>{if(tabNow===4&&!document.hidden)mkLoad()},15000);
