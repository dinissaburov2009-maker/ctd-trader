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
  const cb=$('cmpb');if(cb){cb.classList.toggle('onb',!!CMP_MODE);cb.textContent=CMP_MODE?(CMP_LIST.length>=2?`⚖ Сравнить ${CMP_LIST.length}/${CMP_MAX} →`:`⚖ Выбрано ${CMP_LIST.length}/${CMP_MAX}`):'⚖ Сравнить'}const cx=$('cmpx');if(cx)cx.style.display=CMP_MODE?'':'none'
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

const CMP_MAX=5; /* максимум юнитов в сравнении */
const CMP_RC={Godly:'#ff5ea8',Exclusive:'#ff9f43',Mythic:'#ff4d6d',Legendary:'#ffd76a',Epic:'#b983ff',Rare:'#5aa9ff',Uncommon:'#5eead4',Common:'#a3adc2',Signed:'#8ff0b8'};
let CMP_LAST=null;
function cmpGo(){const L=[...CMP_LIST];CMP_MODE=0;CMP_LIST=[];fillFilters();cat();openCompare(L)}
function cmpCancel(){CMP_MODE=0;CMP_LIST=[];fillFilters();cat()}
/* победители строки: максимальный балл, если он строго лучше хотя бы одного другого (ничья у всех — без подсветки) */
const cmpWin=sc=>{const mx=Math.max(...sc);return sc.map(x=>x===mx&&sc.some(y=>y<mx)?1:0)};
function openCompare(...args){
  const names=[...new Set(args.flat())].slice(0,CMP_MAX).filter(n=>IDX.get(n)&&AN.get(n));if(names.length<2)return;
  RET=null;
  const us=names.map(n=>IDX.get(n)),as=names.map(n=>AN.get(n)),N=names.length,L=names.map((_,i)=>String.fromCharCode(65+i)),sl=N>3?9:16;
  const rk=x=>x?-x:-Infinity; /* ранг: меньше — лучше; нет данных — хуже всех */
  const pc=x=>`${x>0?'+':''}${x}%`;
  /* k — подпись, v — что показать, s — баллы для сравнения, b — доли 0..1 для полосок (необязательно) */
  const rows=[
    {k:'Цена',v:us.map(pLbl),s:names.map(val)},
    {k:'Качество',v:as.map(a=>a.q+'/100'),s:as.map(a=>a.q),b:as.map(a=>a.q/100)},
    {k:'Спрос',v:us.map(u=>u.demand+'/10'),s:us.map(u=>u.demand),b:us.map(u=>u.demand/10)},
    {k:'Тренд 14д',v:as.map(a=>pc(a.trPct)),s:as.map(a=>a.trPct)},
    {k:'Редкость',v:us.map(u=>u.rarityRank?'#'+u.rarityRank:'—'),s:us.map(u=>rk(u.rarityRank))},
    {k:'В игре (Exist)',v:us.map(u=>u.exist?sfmt(u.exist):'—'),s:us.map(u=>rk(u.exist))},
    {k:'Max DPS',v:us.map(u=>u.maxDps?fmt(u.maxDps):'—'),s:us.map(u=>u.maxDps||0)},
    {k:'DPS / 1K',v:us.map(u=>u.dpsPer1k?f2(u.dpsPer1k):'—'),s:us.map(u=>u.dpsPer1k||0)},
    {k:'Прокачка',v:us.map(u=>u.cashToMax?fmt(u.cashToMax):'—'),s:us.map(u=>rk(u.cashToMax))}
  ];
  rows.forEach(r=>r.w=cmpWin(r.s));
  const wins=names.map((_,i)=>rows.reduce((t,r)=>t+r.w[i],0));
  CMP_LAST={names,us,as,rows,wins};
  $('dl').innerHTML=`<div class="row"><h3 style="flex:1;margin:0">Сравнение ${L.join(' vs ')}</h3><button class="sm" data-a="close">${I('x')}</button></div>
  <div class="cmp" style="grid-template-columns:repeat(${N},minmax(0,1fr))">
    ${names.map((n,i)=>`<div class="cmp-b" style="text-align:center;${N>3?'padding:4px 3px;font-size:10px;line-height:1.25':''}"><b>${L[i]}</b><br>${imgTag(us[i],'u')}<br><b style="overflow-wrap:anywhere">${esc(n)}</b><div class="m"><span class="qb ${as[i].grade[2]}">${as[i].grade[1]} ${as[i].q}</span></div></div>`).join('')}
  </div>
  <div class="tw"><table>
    <tr><th>Параметр</th>${names.map((n,i)=>`<th>${L[i]} ${esc(n.slice(0,sl))}</th>`).join('')}</tr>
    ${rows.map(r=>`<tr><td>${r.k}</td>${r.v.map((v,i)=>`<td class="${r.w[i]?'win':''}">${v}</td>`).join('')}</tr>`).join('')}
    <tr><td>Побед</td>${wins.map(w=>`<td class="${w===Math.max(...wins)&&wins.some(x=>x<w)?'win':''}">${w}/${rows.length}</td>`).join('')}</tr>
  </table></div>
  <div class="bar">${names.map((n,i)=>`<button data-a="det" data-n="${esc(n)}">Досье ${L[i]}</button>`).join('')}</div>
  <div class="bar"><button class="p" data-a="cmpDl">⬇ Скачать картинкой</button><button class="p" data-a="cmpDl2">⬇ Подробная</button><button data-a="close">Закрыть</button></div>`;
  openDl(0,1);
}

/* ---------- красивая картинка сравнения (PNG) ---------- */
async function cmpPic0(i){ /* картинка юнита из уже нарисованного окна; null — если взять нельзя (чужой домен без CORS) */
  const h=document.querySelectorAll('#dl .cmp-b')[i],el=h&&h.querySelector('img,canvas');if(!el)return null;
  if(el.tagName==='CANVAS')return el;
  try{if(!el.complete||!el.naturalWidth)await el.decode()}catch{}
  const s=el.currentSrc||el.src||'';if(!el.naturalWidth)return null;
  if(/^(data|blob):/.test(s))return el;
  try{if(new URL(s,location.href).origin===location.origin)return el}catch{}
  try{const r=await fetch(s,{mode:'cors'});return await createImageBitmap(await r.blob())}catch{}
  return null;
}
/* ---------- иконка из icons.json / game-icons.json (если картинка по ссылке не читается) ---------- */
function icPic(name){
  try{
    const src=(IC.items&&(IC.items[name]||IC.items[IC.alt&&IC.alt[name]]))||(GI.items&&(GI.items[name]||GI.items[GI.alt&&GI.alt[name]]));
    if(!src||typeof src!=='string')return null;
    const bin=atob(src),n=bin.length,sz=Math.round(Math.sqrt(n/4));if(!sz||sz*sz*4!==n)return null;
    const px=new Uint8ClampedArray(n);for(let i=0;i<n;i++)px[i]=bin.charCodeAt(i);
    const a=document.createElement('canvas');a.width=a.height=sz;a.getContext('2d').putImageData(new ImageData(px,sz,sz),0,0);
    const b=document.createElement('canvas');b.width=b.height=sz*4;const x=b.getContext('2d');x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.drawImage(a,0,0,sz*4,sz*4);
    return b;
  }catch{return null}
}
async function cmpPic(i){return (await cmpPic0(i))||icPic(CMP_LAST&&CMP_LAST.names[i])}

/* ---------- ПОДРОБНАЯ картинка: уровни, статы, цены, график, итоги ---------- */
const CMP_LV={ /* что показывать по типу юнита: колонки таблицы и метрика для графика */
  damage:{h:['Цена','Урон','КД','DPS'],r:l=>[fmt(l.cost),l.damage?fmt(l.damage):'—',l.cooldown!=null?l.cooldown+'с':'—',l.dps!=null?fmt(l.dps):'—'],m:l=>l.dps||0,g:'DPS',best:[null,1,-1,1]},
  spawner:{h:['Цена','HP','КД','DPS'],r:l=>[fmt(l.cost),l.hp!=null?fmt(l.hp):'—',l.cooldown!=null?l.cooldown+'с':'—',l.unitDps?fmt(l.unitDps):'—'],m:l=>l.hp||0,g:'HP',best:[null,1,-1,1]},
  farm:{h:['Цена','Доход','Σ цена'],r:(l,s)=>[fmt(l.cost),l.income!=null?fmt(l.income):'—',fmt(s)],m:l=>l.income||0,g:'Доход',best:[null,1,null]},
  support:{h:['Цена','Урон','КД','Дальн.'],r:l=>[fmt(l.cost),'+'+l.damage+'%','−'+l.cooldown+'%','+'+l.range+'%'],m:l=>l.damage||0,g:'Бонус урона',best:[null,1,1,1]}
};
function cmpPickLv(L,max){if(L.length<=max)return L.map((l,i)=>i);const o=[];for(let k=0;k<max;k++)o.push(Math.round(k*(L.length-1)/(max-1)));return[...new Set(o)]}
async function cmpDetailDownload(){
  const C=CMP_LAST;if(!C)return;
  try{
    if(document.fonts&&document.fonts.ready)await document.fonts.ready;
    const imgs=await Promise.all(C.names.map((_,i)=>cmpPic(i))),N=C.names.length;
    const PX=2,pad=40,gap=18,colW=[0,0,430,380,340,310][N],W=pad*2+N*colW+(N-1)*gap;
    const MAXR=12,lvs=C.us.map(u=>CMP_LV[u.levelsType]&&u.levels&&u.levels.length?u.levels:null);
    const rowsN=Math.max(0,...lvs.map(l=>l?cmpPickLv(l,MAXR).length:0)),rowH=34,thH=34;
    const hdrH=104,cardH=190,gH=170,totH=3*52+20,ftH=60;
    const tabH=thH+Math.max(rowsN,2)*rowH+10;
    const H=hdrH+cardH+tabH+gH+totH+ftH;
    const cv=document.createElement('canvas');cv.width=W*PX;cv.height=H*PX;
    const c=cv.getContext('2d');c.scale(PX,PX);
    const F=(w,sz)=>`${w} ${sz}px Inter,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif`;
    let g=c.createLinearGradient(0,0,W*.4,H);g.addColorStop(0,'#0d0722');g.addColorStop(.5,'#1a0c42');g.addColorStop(1,'#0b0620');c.fillStyle=g;c.fillRect(0,0,W,H);
    g=c.createRadialGradient(W*.12,0,0,W*.12,0,W*.7);g.addColorStop(0,'rgba(150,90,255,.30)');g.addColorStop(1,'rgba(150,90,255,0)');c.fillStyle=g;c.fillRect(0,0,W,H);
    c.textBaseline='alphabetic';c.textAlign='left';
    c.fillStyle='#fff';c.font=F(800,32);c.fillText('ПОДРОБНОЕ СРАВНЕНИЕ',pad,pad+26);
    c.fillStyle='#a99fd0';c.font=F(500,16);c.fillText(cmpFit(c,C.names.join('  ·  '),W-pad*2-190),pad,pad+54);
    c.textAlign='right';c.fillStyle='#c9b6ff';c.font=F(800,19);c.fillText('CTD TRADER',W-pad,pad+24);
    c.fillStyle='#7d72a8';c.font=F(500,13);c.fillText(new Date().toLocaleDateString('ru'),W-pad,pad+46);c.textAlign='left';
    const X=i=>pad+i*(colW+gap);
    /* лучшие значения итогов (только среди тех, у кого они есть) */
    const bestOf=(f,dir)=>{const v=C.us.map(f),ok=v.filter(x=>x>0);if(ok.length<2)return v.map(()=>0);const b=dir>0?Math.max(...ok):Math.min(...ok);return v.map(x=>x>0&&x===b?1:0)};
    const tot=[
      {k:'Прокачка до макс.',v:C.us.map(u=>{const L=lvs[C.us.indexOf(u)];return u.cashToMax||(L?L.reduce((s,l)=>s+(l.cost||0),0):0)}),d:-1},
      {k:'Max DPS',v:C.us.map(u=>u.maxDps||0),d:1},
      {k:'DPS / 1K',v:C.us.map(u=>u.dpsPer1k||0),d:1}
    ];
    tot.forEach(t=>{t.w=bestOf((u,)=>0,1);const ok=t.v.filter(x=>x>0);t.w=t.v.map(x=>ok.length>1&&x===(t.d>0?Math.max(...ok):Math.min(...ok))?1:0)});
    for(let i=0;i<N;i++){
      const u=C.us[i],a=C.as[i],col=CMP_RC[u.category]||'#b983ff',x=X(i),cx=x+colW/2,L=lvs[i];
      /* карточка */
      let y=hdrH;
      c.save();c.shadowColor=cmpRgba(col,.35);c.shadowBlur=20;cmpRR(c,x,y,colW,cardH-14,20);
      g=c.createLinearGradient(0,y,0,y+cardH);g.addColorStop(0,cmpRgba(col,.26));g.addColorStop(.7,'rgba(20,10,50,.92)');g.addColorStop(1,'rgba(14,7,36,.96)');c.fillStyle=g;c.fill();c.restore();
      cmpRR(c,x,y,colW,cardH-14,20);c.lineWidth=1.6;c.strokeStyle=cmpRgba(col,.7);c.stroke();
      const im=92,ix=x+18,iy=y+18,pic=imgs[i];
      if(pic){const nw=pic.naturalWidth||pic.width||64,nh=pic.naturalHeight||pic.height||64,k=Math.min(im/nw,im/nh);c.drawImage(pic,ix+(im-nw*k)/2,iy+(im-nh*k)/2,nw*k,nh*k)}
      else{cmpRR(c,ix,iy,im,im,18);c.fillStyle='rgba(255,255,255,.06)';c.fill();c.fillStyle=cmpRgba(col,.9);c.font=F(800,46);c.textAlign='center';c.fillText(C.names[i][0].toUpperCase(),ix+im/2,iy+im*.68);c.textAlign='left'}
      c.fillStyle='#fff';c.font=F(800,22);const ls=cmpWrap(c,C.names[i],colW-ix+x-36-im+18,2);let ty=iy+26;ls.forEach(t=>{c.fillText(t,ix+im+16,ty);ty+=26});
      c.font=F(700,13);const rt=String(u.category||'').toUpperCase(),rw=c.measureText(rt).width+20,by=y+cardH-14-48;
      cmpRR(c,ix+im+16,by,rw,26,13);c.fillStyle=cmpRgba(col,.22);c.fill();c.strokeStyle=cmpRgba(col,.8);c.lineWidth=1;c.stroke();c.fillStyle=col;c.fillText(rt,ix+im+26,by+18);
      const qt=`${a.grade[1]} ${a.q}`,qc=a.q>=70?'#8ff0b8':a.q>=45?'#ffd76a':'#ff7a90',qw=c.measureText(qt).width+20;
      cmpRR(c,ix+im+16+rw+6,by,qw,26,13);c.fillStyle=cmpRgba(qc,.16);c.fill();c.strokeStyle=cmpRgba(qc,.8);c.stroke();c.fillStyle=qc;c.fillText(qt,ix+im+16+rw+16,by+18);
      c.fillStyle='#8b81b5';c.font=F(600,13);c.fillText(cmpFit(c,[u.role,u.levelsType?null:null].filter(Boolean).join(' · ')||'',colW-36),ix,y+cardH-14-10);
      /* таблица уровней */
      y=hdrH+cardH;const T=CMP_LV[u.levelsType];
      cmpRR(c,x,y,colW,tabH-6,16);c.fillStyle='rgba(255,255,255,.04)';c.fill();
      if(!L){c.fillStyle='#8b81b5';c.font=F(600,15);c.textAlign='center';c.fillText('Таблицы уровней нет в данных',cx,y+60);c.textAlign='left'}
      else{
        const nc=T.h.length,lw=62,cw=(colW-lw-16)/nc,idx=cmpPickLv(L,MAXR);let run=0;const cum=L.map(l=>run+=(l.cost||0));
        c.fillStyle='#a99fd0';c.font=F(700,13);c.fillText('Ур.',x+14,y+23);c.textAlign='right';T.h.forEach((h,k)=>c.fillText(h,x+lw+cw*(k+1),y+23));
        /* лучшие в каждой колонке (только если один тип у всех) */
        const same=C.us.every(q=>q.levelsType===u.levelsType);
        idx.forEach((li,ri)=>{
          const l=L[li],ry=y+thH+ri*rowH,last=li===L.length-1,vals=T.r(l,cum[li]);
          if(ri%2){cmpRR(c,x+6,ry,colW-12,rowH-2,8);c.fillStyle='rgba(255,255,255,.035)';c.fill()}
          if(last){cmpRR(c,x+6,ry,colW-12,rowH-2,8);c.fillStyle=cmpRgba(col,.14);c.fill()}
          c.textAlign='left';c.fillStyle=last?col:'#b7acdc';c.font=F(700,14);c.fillText(String(l.level).replace('Place','Пост.').replace('Lv ',''),x+14,ry+22);
          c.textAlign='right';vals.forEach((v,k)=>{c.fillStyle=last?'#fff':'#efeaff';c.font=F(last?800:600,14);c.fillText(cmpFit(c,v,cw-4),x+lw+cw*(k+1),ry+22)});
        });
        c.textAlign='left';
        if(idx.length<L.length){c.fillStyle='#6f6597';c.font=F(500,11);c.fillText(`показано ${idx.length} из ${L.length} уровней`,x+14,y+tabH-12)}
      }
      /* график роста */
      const gy=hdrH+cardH+tabH+6,gh=gH-14;
      cmpRR(c,x,gy,colW,gh,16);c.fillStyle='rgba(255,255,255,.04)';c.fill();
      c.fillStyle='#a99fd0';c.font=F(700,13);c.fillText(L?`Рост: ${CMP_LV[u.levelsType].g} по уровням`:'Рост по уровням',x+14,gy+24);
      if(L&&L.length>1){
        const mm=L.map(CMP_LV[u.levelsType].m),mx=Math.max(...mm,1),px0=x+18,pw=colW-36,py0=gy+gh-22,ph=gh-64;
        const P=mm.map((v,k)=>[px0+pw*k/(mm.length-1),py0-ph*v/mx]);
        c.beginPath();P.forEach((p,k)=>k?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.lineTo(P[P.length-1][0],py0);c.lineTo(P[0][0],py0);c.closePath();
        g=c.createLinearGradient(0,py0-ph,0,py0);g.addColorStop(0,cmpRgba(col,.45));g.addColorStop(1,cmpRgba(col,0));c.fillStyle=g;c.fill();
        c.beginPath();P.forEach((p,k)=>k?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.strokeStyle=col;c.lineWidth=2.4;c.lineJoin='round';c.stroke();
        c.fillStyle=col;P.forEach(p=>{c.beginPath();c.arc(p[0],p[1],3,0,7);c.fill()});
        c.textAlign='right';c.fillStyle='#fff';c.font=F(800,15);c.fillText(fmt(mx),x+colW-14,gy+24);c.textAlign='left';
      }else{c.fillStyle='#6f6597';c.font=F(500,13);c.fillText('нет данных по уровням',x+14,gy+60)}
      /* итоги */
      let ty2=hdrH+cardH+tabH+gH+8;
      tot.forEach((t,ri)=>{
        const ry=ty2+ri*52,win=t.w[i],v=t.v[i];
        cmpRR(c,x,ry,colW,46,14);c.fillStyle=win?'rgba(143,240,184,.12)':'rgba(255,255,255,.05)';c.fill();if(win){c.strokeStyle='rgba(143,240,184,.7)';c.lineWidth=1.2;c.stroke()}
        c.fillStyle='#b7acdc';c.font=F(600,15);c.fillText(t.k,x+16,ry+29);
        c.textAlign='right';c.fillStyle=win?'#8ff0b8':'#efeaff';c.font=F(800,20);c.fillText((win?'★ ':'')+(v>0?(t.k==='DPS / 1K'?f2(v):fmt(v)):'—'),x+colW-16,ry+30);c.textAlign='left';
      });
    }
    c.textAlign='center';c.fillStyle='#6f6597';c.font=F(500,13);c.fillText('CTD Trader  ·  уровни, статы и цены из приложения  ·  ★ — лучший показатель',W/2,H-pad+10);
    const blob=await new Promise(r=>cv.toBlob(r,'image/png'));if(!blob)throw new Error('toBlob');
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='CTD-detail-'+C.names.map(n=>n.replace(/[^\w-]+/g,'-')).join('_').slice(0,70)+'.png';document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),8000);toast('Подробная картинка сохранена');
  }catch(e){console.error(e);toast('Не удалось сделать картинку')}
}

function cmpRR(c,x,y,w,h,r){r=Math.min(r,w/2,h/2);c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
function cmpRgba(hex,a){const n=parseInt(hex.slice(1),16);return`rgba(${n>>16},${n>>8&255},${n&255},${a})`}
function cmpFit(c,t,w){t=String(t);if(c.measureText(t).width<=w)return t;while(t.length>1&&c.measureText(t+'…').width>w)t=t.slice(0,-1);return t+'…'}
function cmpWrap(c,t,w,max){const ws=String(t).split(/\s+/),out=[];let cur='';for(const x of ws){const t2=cur?cur+' '+x:x;if(c.measureText(t2).width<=w||!cur)cur=t2;else{out.push(cur);cur=x}}if(cur)out.push(cur);if(out.length>max){out.length=max;out[max-1]=cmpFit(c,out[max-1]+'…',w)}return out.map(x=>cmpFit(c,x,w))}
async function cmpDownload(){
  const C=CMP_LAST;if(!C)return;
  try{
    if(document.fonts&&document.fonts.ready)await document.fonts.ready;
    const imgs=await Promise.all(C.names.map((_,i)=>cmpPic(i))),N=C.names.length,R=C.rows.length;
    const PX=2,pad=44,labW=210,colW=[0,0,300,250,220,200][N],W=pad*2+labW+N*colW;
    const hdrH=118,cardH=272,rowH=66,winH=84,ftH=64,H=hdrH+cardH+R*rowH+winH+ftH;
    const cv=document.createElement('canvas');cv.width=W*PX;cv.height=H*PX;
    const c=cv.getContext('2d');c.scale(PX,PX);
    const F=(w,sz)=>`${w} ${sz}px Inter,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif`;
    const xc=i=>pad+labW+i*colW,mid=i=>xc(i)+colW/2;
    /* фон */
    let g=c.createLinearGradient(0,0,W*.4,H);g.addColorStop(0,'#0d0722');g.addColorStop(.5,'#1a0c42');g.addColorStop(1,'#0b0620');c.fillStyle=g;c.fillRect(0,0,W,H);
    g=c.createRadialGradient(W*.12,0,0,W*.12,0,W*.7);g.addColorStop(0,'rgba(150,90,255,.30)');g.addColorStop(1,'rgba(150,90,255,0)');c.fillStyle=g;c.fillRect(0,0,W,H);
    g=c.createRadialGradient(W,H*.55,0,W,H*.55,W*.6);g.addColorStop(0,'rgba(94,234,212,.12)');g.addColorStop(1,'rgba(94,234,212,0)');c.fillStyle=g;c.fillRect(0,0,W,H);
    /* шапка */
    c.textBaseline='alphabetic';c.textAlign='left';
    c.fillStyle='#ffffff';c.font=F(800,36);c.fillText('СРАВНЕНИЕ ЮНИТОВ',pad,pad+30);
    c.fillStyle='#a99fd0';c.font=F(500,17);c.fillText(cmpFit(c,C.names.join('  ·  '),W-pad*2-190),pad,pad+60);
    c.textAlign='right';c.fillStyle='#c9b6ff';c.font=F(800,20);c.fillText('CTD TRADER',W-pad,pad+28);
    c.fillStyle='#7d72a8';c.font=F(500,14);c.fillText(new Date().toLocaleDateString('ru'),W-pad,pad+52);
    c.textAlign='left';
    const lead=C.wins.indexOf(Math.max(...C.wins)),hasLead=C.wins.some(x=>x<C.wins[lead])&&C.wins.filter(x=>x===C.wins[lead]).length===1;
    /* карточки юнитов */
    for(let i=0;i<N;i++){
      const u=C.us[i],a=C.as[i],col=CMP_RC[u.category]||'#b983ff',x=xc(i)+6,y=hdrH,w=colW-12,h=cardH-14,cx=x+w/2;
      c.save();c.shadowColor=cmpRgba(col,.35);c.shadowBlur=24;cmpRR(c,x,y,w,h,22);
      g=c.createLinearGradient(0,y,0,y+h);g.addColorStop(0,cmpRgba(col,.26));g.addColorStop(.6,'rgba(20,10,50,.92)');g.addColorStop(1,'rgba(14,7,36,.96)');c.fillStyle=g;c.fill();c.restore();
      cmpRR(c,x,y,w,h,22);c.lineWidth=hasLead&&i===lead?3:1.5;c.strokeStyle=hasLead&&i===lead?'#ffd76a':cmpRgba(col,.65);c.stroke();
      const im=Math.min(124,w-56),iy=y+22;
      g=c.createRadialGradient(cx,iy+im/2,4,cx,iy+im/2,im*.85);g.addColorStop(0,cmpRgba(col,.5));g.addColorStop(1,cmpRgba(col,0));c.fillStyle=g;c.fillRect(x,y,w,im+40);
      const pic=imgs[i];
      if(pic){const nw=pic.naturalWidth||pic.width||64,nh=pic.naturalHeight||pic.height||64,k=Math.min(im/nw,im/nh);c.imageSmoothingEnabled=nw>96;c.drawImage(pic,cx-nw*k/2,iy+(im-nh*k)/2,nw*k,nh*k);c.imageSmoothingEnabled=true}
      else{cmpRR(c,cx-im/2,iy,im,im,20);c.fillStyle='rgba(255,255,255,.06)';c.fill();c.fillStyle=cmpRgba(col,.9);c.font=F(800,im*.5);c.textAlign='center';c.fillText(C.names[i][0].toUpperCase(),cx,iy+im*.68)}
      c.textAlign='center';c.fillStyle='#fff';c.font=F(800,N>=4?18:21);
      const ls=cmpWrap(c,C.names[i],w-24,2);let ty=iy+im+(ls.length>1?32:40);ls.forEach(t=>{c.fillText(t,cx,ty);ty+=N>=4?21:24});
      /* редкость и качество */
      const py=y+h-40;c.font=F(700,13);const rt=String(u.category||'').toUpperCase(),qt=`${a.grade[1]} ${a.q}`;
      const rw=c.measureText(rt).width+22;cmpRR(c,cx-rw-3,py,rw,26,13);c.fillStyle=cmpRgba(col,.22);c.fill();c.strokeStyle=cmpRgba(col,.8);c.lineWidth=1;c.stroke();c.fillStyle=col;c.fillText(rt,cx-rw/2-3,py+18);
      c.font=F(700,14);const qw=c.measureText(qt).width+22,qc=a.q>=70?'#8ff0b8':a.q>=45?'#ffd76a':'#ff7a90';cmpRR(c,cx+3,py,qw,26,13);c.fillStyle=cmpRgba(qc,.16);c.fill();c.strokeStyle=cmpRgba(qc,.8);c.stroke();c.fillStyle=qc;c.fillText(qt,cx+3+qw/2,py+18);
      if(hasLead&&i===lead){c.font=F(800,12);const lw=c.measureText('★ ЛИДЕР').width+20;cmpRR(c,cx-lw/2,y-11,lw,24,12);c.fillStyle='#ffd76a';c.fill();c.fillStyle='#2b1a00';c.fillText('★ ЛИДЕР',cx,y+6)}
      c.textAlign='left';
    }
    /* таблица */
    let y0=hdrH+cardH+4;
    C.rows.forEach((r,ri)=>{
      const y=y0+ri*rowH;
      cmpRR(c,pad,y+3,W-pad*2,rowH-6,14);c.fillStyle=ri%2?'rgba(255,255,255,.025)':'rgba(255,255,255,.055)';c.fill();
      c.fillStyle='#b7acdc';c.font=F(600,18);c.textAlign='left';c.fillText(r.k,pad+18,y+rowH/2+6);
      r.v.forEach((v,i)=>{
        const win=r.w[i],col=CMP_RC[C.us[i].category]||'#b983ff',cx=mid(i),has=r.b&&1,cy=y+rowH/2+(r.b?0:6);
        c.font=F(800,N>=4?19:21);const txt=(win?'★ ':'')+v,tw=Math.min(colW-24,c.measureText(txt).width+26);
        if(win){cmpRR(c,cx-tw/2,y+(r.b?9:13),tw,r.b?28:40,r.b?14:16);c.fillStyle='rgba(143,240,184,.16)';c.fill();c.strokeStyle='rgba(143,240,184,.7)';c.lineWidth=1.2;c.stroke()}
        c.textAlign='center';c.fillStyle=win?'#8ff0b8':'#efeaff';c.fillText(cmpFit(c,txt,colW-30),cx,r.b?y+30:cy+1);
        if(r.b){const bw=colW*.58,bx=cx-bw/2,by=y+rowH-17;cmpRR(c,bx,by,bw,7,3.5);c.fillStyle='rgba(255,255,255,.09)';c.fill();
          const f=Math.max(.03,Math.min(1,r.b[i]));cmpRR(c,bx,by,bw*f,7,3.5);c.fillStyle=win?'#8ff0b8':cmpRgba(col,.9);c.fill()}
      });
    });
    /* итог: победы */
    const wy=y0+R*rowH+6;
    cmpRR(c,pad,wy,W-pad*2,winH-12,18);g=c.createLinearGradient(pad,0,W-pad,0);g.addColorStop(0,'rgba(150,90,255,.28)');g.addColorStop(1,'rgba(94,234,212,.16)');c.fillStyle=g;c.fill();c.strokeStyle='rgba(185,131,255,.5)';c.lineWidth=1.2;c.stroke();
    c.textAlign='left';c.fillStyle='#fff';c.font=F(800,18);c.fillText('Побед по параметрам',pad+18,wy+(winH-12)/2+6);
    C.wins.forEach((w,i)=>{const isL=hasLead&&i===lead;c.textAlign='center';c.fillStyle=isL?'#ffd76a':'#efeaff';c.font=F(800,28);c.fillText(`${isL?'★ ':''}${w}/${R}`,mid(i),wy+(winH-12)/2+10)});
    /* подвал */
    c.textAlign='center';c.fillStyle='#6f6597';c.font=F(500,14);c.fillText('CTD Trader  ·  цены и качество из приложения  ·  ★ — лучший показатель в строке',W/2,H-pad+8);
    const blob=await new Promise(r=>cv.toBlob(r,'image/png'));if(!blob)throw new Error('toBlob');
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='CTD-compare-'+C.names.map(n=>n.replace(/[^\w-]+/g,'-')).join('_').slice(0,70)+'.png';document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),8000);toast('Картинка сохранена');
  }catch(e){console.error(e);toast('Не удалось сделать картинку')}
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
