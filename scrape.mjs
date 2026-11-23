import {chromium} from 'playwright';import fs from 'fs';
const URL='https://cameraman-td.vaultedvaluesx.com/value-list',F='data/prices.json';
const STAB=['Dropping','Unwanted','Underpaid','Unstable','Overpaid','Rising','Stable'];
const CATS=['Godly','Mythic','Exclusive','Gamepasses','Gamepass','Crates','Crate','Legendary','Rare','Epic','Uncommon','Common','Signed'];
const num=s=>{s=String(s).replace(/,(?=\d{3})/g,'').replace(',','.');const m=[...s.matchAll(/(\d+(?:\.\d+)?)\s*([kKmM])?/g)].map(x=>+x[1]*({k:1e3,m:1e6}[(x[2]||'').toLowerCase()]||1));
return m.length?Math.round(m.reduce((a,b)=>a+b)/m.length):0};
const b=await chromium.launch();const p=await b.newPage({userAgent:'Mozilla/5.0 (X11; Linux x86_64) Chrome/124 Safari/537.36'});
await p.goto(URL,{waitUntil:'networkidle',timeout:90000});await p.waitForTimeout(5000);
for(let i=0;i<40;i++){const l=p.getByRole('button',{name:/load more/i});if(!await l.count()||!await l.first().isVisible())break;await l.first().click();await p.waitForTimeout(1200)}
const raw=await p.evaluate(()=>{const out=[],used=new Set();document.querySelectorAll('a[href*="/items/"]').forEach(a=>{if(used.has(a.href))return;let e=a;while(e&&!(/demand/i.test(e.innerText)&&/value/i.test(e.innerText)))e=e.parentElement;if(!e||new Set([...e.querySelectorAll('a[href*="/items/"]')].map(x=>x.href)).size!==1)return;used.add(a.href);const nm=[...e.querySelectorAll('a[href*="/items/"]')].map(x=>x.innerText.trim()).find(Boolean);out.push({t:e.innerText.trim(),name:nm,img:e.querySelector('img')?.currentSrc||e.querySelector('img')?.src||''})});return out});
const seen=new Map();
for(const r of raw){const L=r.t.split('\n').map(s=>s.trim()).filter(Boolean);if(L.length<2)continue;
const name=r.name||L[0];if(seen.has(name))continue;
const stab=STAB.find(s=>new RegExp(s,'i').test(r.t))||'Stable';
const cat=CATS.find(c=>new RegExp('\\b'+c+'\\b','i').test(r.t))||'Other';
const dm=r.t.match(/(\d+(?:[.,]\d+)?)\s*\/\s*10/)||r.t.match(/demand\D{0,5}(\d+(?:[.,]\d+)?)/i);
const demand=dm?Math.min(10,+dm[1].replace(',','.')):0;
const vl=L.find((l,i)=>i>0&&/\d/.test(l)&&!/\/\s*10/.test(l)&&!/demand/i.test(l));
const value=vl?num(vl):0;
if(!value&&!demand)continue;seen.set(name,{name,category:cat,value,demand,stability:stab,img:r.img})}
const items=[...seen.values()];
if(items.length<5){fs.writeFileSync('debug.html',await p.content());console.error('Parsed',items.length,'- selectors need tuning');process.exit(1)}
let old={items:[],changelog:[]};try{old=JSON.parse(fs.readFileSync(F))}catch{}
if(old.items.length&&items.length<old.items.length*0.8){console.error('Too few items',items.length,'vs',old.items.length);process.exit(1)}
const om=Object.fromEntries(old.items.map(i=>[i.name,i]));const d=new Date().toISOString().slice(0,10);
const ch=[...items.filter(i=>om[i.name]&&om[i.name].value!==i.value).map(i=>({name:i.name,old:om[i.name].value,new:i.value,date:d})),...(old.changelog||[])].slice(0,200);
fs.writeFileSync(F,JSON.stringify({updated:new Date().toISOString(),items,changelog:ch},null,1));console.log('items',items.length);await b.close();
