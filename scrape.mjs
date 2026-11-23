// scripts/scrape.mjs — CTD Trader v3.0
// Источник 1: vaultedvaluesx (цена, спрос, стабильность, картинка)
// Источник 2: game.guide (Tier, DPS, стоимость, уровни и т.д.)
// Если один источник упал — берём его данные из прошлого prices.json, а не затираем.
import { chromium } from 'playwright';
import fs from 'fs';

const LIST = 'https://cameraman-td.vaultedvaluesx.com/value-list';
const WIKI = 'https://www.game.guide/cameraman-tower-defense-value-list';
const F = 'data/prices.json';
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36';
const STAB = ['Dropping', 'Unwanted', 'Underpaid', 'Unstable', 'Overpaid', 'Rising', 'Stable'];
const CATS = ['Godly', 'Mythic', 'Exclusive', 'Gamepasses', 'Gamepass', 'Crates', 'Crate', 'Legendary', 'Rare', 'Epic', 'Uncommon', 'Common', 'Signed'];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
// число из строки: "1,250" -> 1250, "6,5" -> 6.5, "2k" -> 2000, диапазон -> среднее
const num = (s) => {
  s = String(s ?? '').replace(/,(?=\d{3}\b)/g, '').replace(',', '.');
  const m = [...s.matchAll(/(\d+(?:\.\d+)?)\s*([kKmM])?/g)].map((x) => +x[1] * ({ k: 1e3, m: 1e6 }[(x[2] || '').toLowerCase()] || 1));
  return m.length ? m.reduce((a, b) => a + b) / m.length : 0;
};
const dem = (s) => { const v = num(s); return v > 10 ? 10 : Math.round(v * 10) / 10; };

async function openPage(b, url) {
  const p = await b.newPage({ userAgent: UA });
  await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await p.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
  return p;
}

/* ---------- Источник 1: торговые цены ---------- */
async function scrapeValues(b) {
  const p = await openPage(b, LIST);
  // ждём, пока Cloudflare пропустит и появятся карточки
  await p.waitForSelector('a[href*="/items/"]', { timeout: 60000 }).catch(() => {});
  let prev = -1;
  for (let i = 0; i < 60; i++) {
    const btn = p.getByRole('button', { name: /load more/i });
    if (!(await btn.count()) || !(await btn.first().isVisible())) break;
    await btn.first().click().catch(() => {});
    await p.waitForTimeout(1200);
    const n = await p.locator('a[href*="/items/"]').count();
    if (n === prev && i > 3) break;
    prev = n;
  }
  const raw = await p.evaluate(() => {
    const out = [], used = new Set();
    document.querySelectorAll('a[href*="/items/"]').forEach((a) => {
      if (used.has(a.href)) return;
      let e = a;
      while (e && !(/demand/i.test(e.innerText) && /value/i.test(e.innerText))) e = e.parentElement;
      if (!e || new Set([...e.querySelectorAll('a[href*="/items/"]')].map((x) => x.href)).size !== 1) return;
      used.add(a.href);
      const nm = [...e.querySelectorAll('a[href*="/items/"]')].map((x) => x.innerText.trim()).find(Boolean);
      const im = e.querySelector('img');
      out.push({ t: e.innerText.trim(), name: nm, img: im?.currentSrc || im?.src || '' });
    });
    return out;
  });
  const seen = new Map();
  for (const r of raw) {
    const L = r.t.split('\n').map((s) => s.trim()).filter(Boolean);
    if (L.length < 2) continue;
    const name = r.name || L[0];
    if (seen.has(name)) continue;
    const stability = STAB.find((s) => new RegExp(s, 'i').test(r.t)) || 'Stable';
    const category = CATS.find((c) => new RegExp('\\b' + c + '\\b', 'i').test(r.t)) || 'Other';
    const dm = r.t.match(/(\d+(?:[.,]\d+)?)\s*\/\s*10/) || r.t.match(/demand\D{0,5}(\d+(?:[.,]\d+)?)/i);
    const demand = dm ? dem(dm[1]) : 0;
    const vl = L.find((l, i) => i > 0 && /\d/.test(l) && !/\/\s*10/.test(l) && !/demand/i.test(l));
    const value = vl ? Math.round(num(vl)) : 0;
    if (!value && !demand) continue;
    seen.set(name, { name, category, value, demand, stability, img: r.img });
  }
  if (!seen.size) fs.writeFileSync('debug-values.html', await p.content());
  await p.close();
  return [...seen.values()];
}

/* ---------- Источник 2: боевая статистика (game.guide) ---------- */
const LABELS = {
  tier: /^tier$/i, maxDps: /max\s*dps/i, dpsPer1k: /dps\s*(per|\/)\s*1[, ]?000/i,
  cashToMax: /cash\s*to\s*max/i, maxOnMap: /max\s*on\s*(the\s*)?map/i,
  maxRange: /max\s*range/i, exist: /^exist/i, howToGet: /how\s*to\s*get/i,
};
const LVL = {
  level: /^(level|lv|lvl)/i, cost: /^(cost|price|upgrade)/i, damage: /^(damage|dmg|income|cash)/i,
  cooldown: /^(cooldown|cd|delay)/i, range: /^range/i, extra: /^(cone|extra)/i, dps: /^dps/i,
};

async function readUnit(p) {
  return p.evaluate(() => {
    const text = document.body.innerText;
    const tables = [...document.querySelectorAll('table')].map((t) =>
      [...t.querySelectorAll('tr')].map((r) => [...r.children].map((c) => c.innerText.trim())));
    const desc = [...document.querySelectorAll('article p, main p, p')].map((x) => x.innerText.trim()).find((x) => x.length > 40) || '';
    const h1 = document.querySelector('h1')?.innerText.trim() || '';
    return { text, tables, desc, h1 };
  });
}

function parseUnit(d) {
  const o = {};
  // пары «Метка: значение» из текста и 2-колоночных таблиц
  const pairs = [];
  d.text.split('\n').forEach((l) => { const m = l.match(/^([^:]{2,30}):\s*(.+)$/); if (m) pairs.push([m[1].trim(), m[2].trim()]); });
  d.tables.forEach((t) => t.forEach((r) => { if (r.length === 2) pairs.push(r); }));
  for (const [k, v] of pairs) {
    for (const [f, re] of Object.entries(LABELS)) {
      if (o[f] == null && re.test(k)) o[f] = ['tier', 'howToGet'].includes(f) ? v : num(v);
    }
  }
  if (o.tier) o.tier = (o.tier.match(/[SABCD]\+?/i) || [''])[0].toUpperCase() || undefined;
  // таблица уровней — та, где есть заголовки Level и Cost/Damage
  let levels = [];
  for (const t of d.tables) {
    if (t.length < 2) continue;
    const head = t[0].map((h) => Object.keys(LVL).find((k) => LVL[k].test(h)) || null);
    if (!head.includes('level') || !(head.includes('cost') || head.includes('damage'))) continue;
    levels = t.slice(1).map((r) => {
      const row = { level: r[head.indexOf('level')] || '' };
      head.forEach((k, i) => { if (k && k !== 'level' && r[i] != null) row[k] = k === 'extra' ? r[i] : num(r[i]); });
      return row;
    }).filter((r) => r.level);
    break;
  }
  if (levels.length) o.levels = levels;
  if (d.desc) o.description = d.desc.slice(0, 300);
  return o;
}

async function scrapeWiki(b) {
  const p = await openPage(b, WIKI);
  const links = await p.evaluate((base) => {
    const out = new Map();
    document.querySelectorAll('main a[href], article a[href]').forEach((a) => {
      const u = new URL(a.href, location.href);
      if (u.hostname !== location.hostname || u.href === base || u.hash && u.pathname === new URL(base).pathname) return;
      if (!/cameraman|tower-defense|ctd/i.test(u.pathname)) return;
      const t = a.innerText.trim();
      if (t && t.length < 50) out.set(u.href.split('#')[0], t);
    });
    return [...out].map(([href, name]) => ({ href, name }));
  }, WIKI);
  const stats = new Map();
  // 1) общая таблица на странице списка (Tier / Max DPS / ...)
  const list = parseListTables(await readUnit(p));
  list.forEach((v, k) => stats.set(k, v));
  await p.close();
  // 2) страницы юнитов
  for (const l of links.slice(0, 200)) {
    try {
      const q = await openPage(b, l.href);
      const d = await readUnit(q);
      const s = parseUnit(d);
      await q.close();
      if (s.levels || s.maxDps || s.tier) {
        const key = norm(d.h1 || l.name);
        stats.set(key, { ...(stats.get(key) || {}), ...s });
      }
    } catch (e) { console.warn('wiki skip', l.href, e.message); }
    await sleep(400);
  }
  return stats;
}

function parseListTables(d) {
  const res = new Map();
  for (const t of d.tables) {
    if (t.length < 2) continue;
    const head = t[0];
    const idx = (re) => head.findIndex((h) => re.test(h));
    const iName = idx(/unit|name|character|tower/i);
    if (iName < 0) continue;
    for (const r of t.slice(1)) {
      const o = {};
      for (const [f, re] of Object.entries(LABELS)) {
        const i = idx(re.source.startsWith('^') ? new RegExp(re.source.slice(1), 'i') : re);
        if (i >= 0 && r[i]) o[f] = ['tier', 'howToGet'].includes(f) ? r[i] : num(r[i]);
      }
      if (o.tier) o.tier = (o.tier.match(/[SABCD]\+?/i) || [''])[0].toUpperCase() || undefined;
      if (r[iName]) res.set(norm(r[iName]), o);
    }
  }
  return res;
}

/* ---------- Слияние и запись ---------- */
let old = { items: [], changelog: [] };
try { old = JSON.parse(fs.readFileSync(F, 'utf8')); } catch {}
old.items ||= [];
const oldBy = Object.fromEntries(old.items.map((i) => [norm(i.name), i]));

const b = await chromium.launch();
let live = [], wiki = new Map();
try { live = await scrapeValues(b); } catch (e) { console.error('values failed:', e.message); }
try { wiki = await scrapeWiki(b); } catch (e) { console.error('wiki failed:', e.message); }
await b.close();

console.log(`values: ${live.length}, wiki: ${wiki.size}`);
if (live.length < 5) { console.error('Источник цен не отдал данные — prices.json не тронут'); process.exit(1); }
const real = old.items.filter((i) => !i.seed).length;
if (real && live.length < real * 0.8) { console.error(`Слишком мало юнитов: ${live.length} из ${real}`); process.exit(1); }

const items = live.map((i) => {
  const prev = oldBy[norm(i.name)] || {};
  const w = wiki.get(norm(i.name)) || {};
  // новые данные > старые; если вики не ответила — оставляем старую статистику
  const keep = Object.fromEntries(Object.entries(prev).filter(([k]) => ['tier', 'maxDps', 'dpsPer1k', 'cashToMax', 'maxOnMap', 'maxRange', 'exist', 'howToGet', 'description', 'levels'].includes(k)));
  return { ...keep, ...w, ...i, img: i.img || prev.img || '' };
});

const d = new Date().toISOString().slice(0, 10);
const changelog = [
  ...items.filter((i) => oldBy[norm(i.name)] && oldBy[norm(i.name)].value !== i.value)
    .map((i) => ({ name: i.name, old: oldBy[norm(i.name)].value, new: i.value, date: d })),
  ...(old.changelog || []),
].slice(0, 200);

fs.mkdirSync('data', { recursive: true });
fs.writeFileSync(F, JSON.stringify({
  updated: new Date().toISOString(), version: 3,
  sources: { values: live.length, wiki: wiki.size },
  items, changelog,
}, null, 1));
console.log('items', items.length, '| with stats', items.filter((i) => i.maxDps || i.levels).length);
