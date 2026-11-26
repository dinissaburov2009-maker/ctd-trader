'use strict';
/* ================= КАТАЛОГ + СРАВНЕНИЕ A vs B + ИЗБРАННОЕ ================= */
let FCS=new Set(),FSS=new Set(),SORT='v';
const SORTS=[['v','Цена'],['q','Крутость'],['d','Спрос'],['a','А–Я'],['p','Max DPS'],['t','Tier'],['c','Прокачка']];
const cls=x=>String(x).replace(/\W/g,'');
const syncChips=()=>{document.querySelectorAll('#fcc button').forEach(b=>b.classList.toggle('on',b.dataset.v?FCS.has(b.dataset.v):!FCS.size));document.querySelectorAll('#fsc button').forEach(b=>b.classList.toggle('on',b.dataset.v?FSS.has(b.dataset.v):!FSS.size));document.querySelectorAll('#soc button').forEach(b=>b.classList.toggle('on',b.dataset.v==SORT))};
const CT=[['all','Все'],['unit','Юниты'],['bc','Бусты и Кейсы'],['signed','DevSigned']];
const TGL_=[['','Все'],['fav','★ Избранное'],['hot','Топ спрос'],['up','Растут / Overpaid'],['down','Падают / Неликвид'],['ttn','🗿 Титаны'],['frm','💰 Фарм/саппорт'],['erl','🌱 Ранние'],['gd','💎 Выгодно брать']],
  TGF={'':()=>1,fav:i=>!!S.fav[i.name],hot:i=>i.demand>=8,up:i=>i.flags.some(f=>/Rising|Overpaid/.test(f)),down:i=>i.flags.some(f=>/Dropping|Unwanted/.test(f)),ttn:i=>i.kind==='unit'&&!isSigned(i)&&/titan/i.test(i.name),frm:i=>/Farm|Spawner|Support/.test(i.role||'')&&!isSigned(i),erl:i=>/^(Common|Uncommon|Rare|Epic|Legendary)$/.test(i.category)&&i.maxDps>0,gd:i=>ofGood(i)};
$('tg').innerHTML=TGL_.map((t,i)=>`<button data-a="tg" data-g="${t[0]}" class="${i?'':'on'}">${t[1]}</button>`).join('');
function fillFilters(){
  const inTab=ALL.filter(i=>S.cat=='all'||tabOf(i)==S.cat),cs=[...new Set(inTab.map(i=>i.category))],ss=[...new Set(inTab.flatMap(i=>i.flags))];
  for(const c of [...FCS])if(!cs.includes(c))FCS.delete(c);
  for(const s of [...FSS])if(!ss.includes(s))FSS.delete(s);
  $('fcc').innerHTML=`<button data-a="fcT" data-v="">Все</button>`+cs.map(c=>`<button data-a="fcT" data-v="${esc(c)}" class="r-${cls(c)}">${esc(c)}</button>`).join('');
  $('fsc').innerHTML=`<button data-a="fsT" data-v="">Любая</button>`+ss.map(c=>`<button data-a="fsT" data-v="${esc(c)}" class="fs-${cls(c)}">${esc(c)}</button>`).join('');
  $('soc').innerHTML=SORTS.map(t=>`<button data-a="soT" data-v="${t[0]}">${t[1]}</button>`).join('');
  syncChips();
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
  const q=$('q').value.toLowerCase(),o=SORT,TR=['S','A','B','C','D'],ti=t=>{const k=TR.indexOf(t);return k<0?9:k},cm=x=>x.cashToMax||1e12;
  const a=ALL.filter(i=>(S.cat=='all'||tabOf(i)==S.cat)&&i.name.toLowerCase().includes(q)&&(!FCS.size||FCS.has(i.category))&&(!FSS.size||i.flags.some(f=>FSS.has(f)))&&TGF[TGL](i));
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
  if(chg.length){const t0=parseDate(chg[0].date);if(isFinite(t0)&&chg[0].old>0)botRaw.push([t0-864e5,chg[0].old]);chg.forEach(c=>botRaw.push([c.date,c.new]))}
  if(today&&u.official>0)botRaw.push([today,u.official]);
  const mkRaw=(u.priceHistory||[]).map(p=>Array.isArray(p)?[p[0],p[1]]:[p.date??p.d??p.t,p.value??p.v??p.price]);
  const _all=[{k:'vvx',name:'Value (Vaulted)',pts:fillDaily(normSeries(botRaw,0),todayT),col:'#ffd76a'},{k:'mkt',name:'Рынок (game.guide)',pts:fillDaily(normSeries(mkRaw,0),todayT),col:'#5eead4'}].filter(s=>s.pts.length),_m=_all.find(s=>s.k==='mkt'&&s.pts.length>1);return _m?[_m]:_all.slice(0,1);
}
function chart(u){
  const ss=series(u);CHD=null;if(!ss.length)return '<div class="cbox m">Истории цен пока нет.</div>';
  const host=$('dl'),W=Math.round(Math.max(300,Math.min(900,Math.min(innerWidth,host&&host.clientWidth||innerWidth)-56))),H=W<520?250:310,R=W-16,T=22,B=H-32,PH=B-T;
  const ts=ss.flatMap(s=>s.pts.map(p=>p[0])),vs=ss.flatMap(s=>s.pts.map(p=>p[1]));
  let t0=Math.min(...ts),t1=Math.max(...ts);const singleT=t0===t1;if(singleT){t0-=864e5;t1+=864e5}
  let v0=Math.min(...vs),v1=Math.max(...vs);const pd=(v1-v0)*.18||v1*.15||10;v0=Math.max(0,v0-pd);v1+=pd;
  const kf=v=>v>=1000?(+(v/1000).toFixed(v>=100000?0:1)+'K').replace('.',','):String(Math.round(v)),L=Math.max(44,Math.max(...[0,.33,.66,1].map(k=>kf(v0+(v1-v0)*k).length))*7.6+18),PW=R-L;
  const X=t=>singleT?L+PW/2:L+(t-t0)/(t1-t0)*PW,Y=v=>B-(v-v0)/(v1-v0)*PH;CHD={ss,t0,t1,v0,v1,X,Y,L,R,T,B,W,H};
  const yTicks=[0,.33,.66,1].map(k=>{const v=v0+(v1-v0)*k,y=Y(v).toFixed(1);return `<line class="gl" x1="${L}" x2="${R}" y1="${y}" y2="${y}"/><text class="ax" x="${L-8}" y="${+y+4}" text-anchor="end">${kf(v)}</text>`}).join('');
  const dFmt=t=>new Date(t).toLocaleDateString('ru',{day:'2-digit',month:'2-digit'}),ty=B+22;
  const xTicks=singleT?`<text class="ax" x="${L+PW/2}" y="${ty}" text-anchor="middle">${dFmt(ts[0])}</text>`:`<text class="ax" x="${L}" y="${ty}">${dFmt(t0)}</text><text class="ax" x="${L+PW/2}" y="${ty}" text-anchor="middle">${dFmt((t0+t1)/2)}</text><text class="ax" x="${R}" y="${ty}" text-anchor="end">${dFmt(t1)}</text>`;
  const defs=`<defs>${ss.map(s=>`<linearGradient id="cg-${s.k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${s.col}" stop-opacity=".3"/><stop offset="100%" stop-color="${s.col}" stop-opacity="0"/></linearGradient>`).join('')}</defs>`;
  const body=ss.map(s=>{
    if(s.pts.length===1){const px=+X(s.pts[0][0]).toFixed(1),py=+Y(s.pts[0][1]).toFixed(1),dash=singleT?`<line x1="${L}" x2="${R}" y1="${py}" y2="${py}" stroke="${s.col}" stroke-width="1.5" stroke-dasharray="5 5" opacity=".55"/>`:'',right=px>R-46,tx=right?px-12:px,anc=right?'end':'middle',tyy=right?py+4:Math.max(14,py-12);
      return `<g style="color:${s.col}">${dash}<circle cx="${px}" cy="${py}" r="11" fill="${s.col}" opacity=".2"/><circle cx="${px}" cy="${py}" r="5" fill="${s.col}"/><text class="ax" x="${tx}" y="${tyy}" fill="${s.col}" text-anchor="${anc}">${kf(s.pts[0][1])}</text></g>`}
    const xy=s.pts.map(p=>[X(p[0]).toFixed(1),Y(p[1]).toFixed(1)]),area=`M${xy[0][0]},${B} L${xy.map(p=>p.join(',')).join(' L')} L${xy[xy.length-1][0]},${B} Z`,dots=s.pts.filter(p=>p[2]).map(p=>`<circle cx="${X(p[0]).toFixed(1)}" cy="${Y(p[1]).toFixed(1)}" r="3" fill="${s.col}"/>`).join('');
    const mn=s.pts.reduce((a,b)=>b[1]<a[1]?b:a),mx=s.pts.reduce((a,b)=>b[1]>a[1]?b:a);
    const lbl=(p,below)=>{const px=+X(p[0]),py=+Y(p[1]),e=40,anc=px<L+e?'start':px>R-e?'end':'middle',tx=px<L+e?Math.max(L+2,px):px>R-e?Math.min(R-2,px):px,tyy=below?Math.min(B-5,py+17):Math.max(14,py-10);return `<text class="ax" x="${tx.toFixed(1)}" y="${tyy.toFixed(1)}" fill="${s.col}" text-anchor="${anc}">${kf(p[1])}</text>`};
    return `<g style="color:${s.col}"><path d="${area}" fill="url(#cg-${s.k})"/><polyline class="ln" stroke="${s.col}" points="${xy.map(p=>p.join(',')).join(' ')}"/>${dots}${lbl(mx,0)}${mn[0]!==mx[0]?lbl(mn,1):''}</g>`;
  }).join('');
  const stat=ss.map(s=>{const f=s.pts[0][1],l=s.pts[s.pts.length-1][1],pc=f>0?(l-f)/f*100:0,mn=Math.min(...s.pts.map(p=>p[1])),mx=Math.max(...s.pts.map(p=>p[1]));
    return `<div class="cs" style="--sc:${s.col}"><span class="cs-n"><i></i>${s.name}</span><div class="cs-v"><b>${fmt(l)}</b><em class="${pc>=0?'win':'lose'}">${pc>0?'+':''}${pc.toFixed(0)}%</em></div><small>${kf(mn)} – ${kf(mx)} · ${s.pts.filter(p=>p[2]).length} изм. / ${s.pts.length} дн.</small>${s.k==='mkt'&&u.official>0?`<small class="cs-ref">Value на Vaulted сейчас: <b>${fmt(u.official)}</b></small>`:''}</div>`}).join('');
  const dots2=ss.map(s=>`<circle id="cd-${s.k}" r="5.5" fill="${s.col}" stroke="#0d0722" stroke-width="2" opacity="0" cx="0" cy="0"/>`).join('');
  return `<div class="cbox"><div class="cst">${stat}</div><svg class="chart" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${defs}${yTicks}${xTicks}${body}<line id="cur" x1="0" x2="0" y1="${T}" y2="${B}" stroke="#fff" stroke-width="1" stroke-dasharray="3 3" opacity="0"/>${dots2}</svg><div id="ctip" class="m">Проведи или коснись графика — увидишь цену за каждый день</div></div>`;
}
function chartAt(e,svg){
  if(!CHD)return;const r=svg.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*CHD.W,t=CHD.t0+(x-CHD.L)/(CHD.R-CHD.L)*(CHD.t1-CHD.t0);
  const near=(s,tt)=>s.pts.reduce((m,p)=>!m||Math.abs(p[0]-tt)<Math.abs(m[0]-tt)?p:m,null);
  let b=null;CHD.ss.forEach(s=>{const p=near(s,t),d=Math.abs(p[0]-t);if(!b||d<b.d)b={d,p}});if(!b)return;
  const cx=CHD.X(b.p[0]);$('cur').setAttribute('x1',cx);$('cur').setAttribute('x2',cx);$('cur').setAttribute('opacity',.8);
  const rows=CHD.ss.map(s=>{const q=near(s,b.p[0]),ok=Math.abs(q[0]-b.p[0])<=864e5*1.5,d=$('cd-'+s.k);if(d){d.setAttribute('cx',CHD.X(q[0]));d.setAttribute('cy',CHD.Y(q[1]));d.setAttribute('opacity',ok?1:0)}return ok?`<span class="ct-r" style="--sc:${s.col}"><i></i>${s.name.split(' ')[0]} <b>${fmt(q[1])}</b></span>`:''}).filter(Boolean);
  $('ctip').innerHTML=`<b>${new Date(b.p[0]).toLocaleDateString('ru')}</b>${rows.join('')}`;
}
let _crz=0;addEventListener('resize',()=>{clearTimeout(_crz);_crz=setTimeout(()=>{const o=document.querySelector('#dl .cbox'),u=CU&&IDX.get(CU);if(o&&u&&CHD&&Math.abs(CHD.W-Math.min(900,innerWidth-56))>24)o.outerHTML=chart(u)},150)});

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
  const _ie=Object.entries(S.inv).sort((x,y)=>val(y[0])*y[1]-val(x[0])*x[1]),now=Date.now(),dayMs=864e5;
  const pToday=S.hs.filter(h=>now-Date.parse(h.d)<dayMs).reduce((a,h)=>a+h.profit,0),pWeek=S.hs.filter(h=>now-Date.parse(h.d)<dayMs*7).reduce((a,h)=>a+h.profit,0),pAll=S.hs.reduce((a,h)=>a+h.profit,0);
  const pf=v=>`<b class="${v>=0?'win':'lose'}">${v>=0?'+':''}${fmt(v)}</b>`,totV=_ie.reduce((a,[n,q])=>a+val(n)*q,0);
  const hero=`<div class="iv-hero"><div class="iv-big"><span>Стоимость инвентаря</span><b>${fmt(totV)}</b></div><div class="iv-st"><div><span>Позиций</span><b>${_ie.length}</b></div><div><span>Штук</span><b>${pcs(S.inv)}</b></div><div><span>Профит 7д</span>${pf(pWeek)}</div></div></div>`;
  const cards=_ie.slice(0,8).map(([n,q])=>{const u=IDX.get(n),a=AN.get(n),qb=a?`<span class="qb ${a.grade[2]}">${a.grade[1]}</span>`:'',v=val(n);
    return `<div class="iv-c r-${esc(u?.category||'')}">${q>1?`<span class="iv-q">×${q}</span>`:''}<div class="iv-im" data-a="det" data-n="${esc(n)}">${u?imgTag(u,'iv-i'):''}</div><div class="iv-n" data-a="det" data-n="${esc(n)}">${esc(n)}</div><div class="iv-p">${fmt(v)}${q>1?` <small>= ${fmt(v*q)}</small>`:''}</div>${qb}<div class="iv-s"><button class="sm" data-a="iq" data-n="${esc(n)}" data-d="-1">−</button><button class="sm" data-a="iq" data-n="${esc(n)}" data-d="1">+</button></div></div>`}).join('');
  $('inv').innerHTML=hero+(cards?`<div class="iv-grid">${cards}</div>`:'<div class="empty">Пусто. Добавь юнитов или загрузи скрины.</div>');
  if(_ie.length>8)$('inv').insertAdjacentHTML('beforeend',`<button data-a="invWin" class="iv-all">Весь инвентарь (${_ie.length}) ▸</button>`);else if(_ie.length)$('inv').insertAdjacentHTML('beforeend',`<button data-a="invWin" class="iv-all">Открыть в окне с сортировкой ▸</button>`);
  $('tot').textContent='';
  $('hsStat').innerHTML=S.hs.length?`<div class="hs-chips"><span>Сегодня ${pf(pToday)}</span><span>7 дней ${pf(pWeek)}</span><span>Всего ${pf(pAll)}</span></div><div class="m">Нажми на сделку, чтобы загрузить её в калькулятор</div>`:'';
  $('hs').innerHTML=S.hs.map((h,i)=>{
    const sd=(o,g)=>[...Object.entries(o||{}).map(e=>e[1]+'× '+e[0]),...(g?[fmt(g)+'💎']:[])].join(', ')||'—';
    return `<div class="hs-r" data-a="repHs" data-k="${i}" title="Загрузить в калькулятор"><div class="hs-top"><span class="hs-d">${new Date(h.d).toLocaleDateString('ru')}</span><b class="hs-p ${h.profit>=0?'win':'lose'}">${h.profit>=0?'+':''}${fmt(h.profit)}</b></div><div class="hs-t"><span class="hs-g">${esc(sd(h.give,h.giveGems))}</span><i>→</i><span class="hs-w">${esc(sd(h.get,h.getGems))}</span></div></div>`;
  }).join('')||'<div class="empty">Сделок пока нет</div>';
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
