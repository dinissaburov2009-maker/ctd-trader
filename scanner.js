'use strict';
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
