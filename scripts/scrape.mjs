// scripts/scrape.mjs — CTD Trader v10
// Источник 1: vaultedvaluesx.com (официальные Value, demand, stability)
// Источник 2: game.guide (/units + /cameraman-tower-defense-value-list: юниты, геймпасы, кейсы, 30д график, недостающие юниты и иконки)
// + data/history.json — собственная ежедневная история Value
// + data/icons.json — 32x32 RGBA-эталоны портретов для локального сканера скриншотов (без VPN и CORS)
import { chromium } from 'playwright';
import fs from 'fs';

const LIST = 'https://cameraman-td.vaultedvaluesx.com/value-list';
const UNITS = 'https://www.game.guide/cameraman-tower-defense/units';
const VLIST = 'https://www.game.guide/cameraman-tower-defense-value-list';
const F = 'data/prices.json';
const FH = 'data/history.json';
const FI = 'data/icons.json';
const ICON_SIZE = 32;
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36';
const HIST_KEEP = 400;
const CATS = ['Gamepasses', 'Gamepass', 'Crates', 'Crate', 'Godly', 'Mythic', 'Exclusive', 'Legendary', 'Epic', 'Rare', 'Uncommon', 'Common', 'Signed'];

const ALIAS = {
  videotapertitan: 'upgradedvideotapperprototype',
  upgradedvideotapperprototype: 'videotapertitan',
  prototypeduo: 'prototypesduo',
  prototypesduo: 'prototypeduo',
  glitchplungerman: 'glitchcameraman',
  glitchcameraman: 'glitchplungerman',
  largeprototypetitan: 'upgradedbruteprototype',
  upgradedbruteprototype: 'largeprototypetitan',
  pumkinlargespeakerman: 'pumpkinlargespeakerman',
  pumpkinlargespeakerman: 'pumkinlargespeakerman',
  spidertv: 'tvspider',
  tvspider: 'spidertv',
  cinemamantitan: 'titancinemaman',
  titancinemaman: 'cinemamantitan',
  '2xmoney': 'doublecoins',
  doublecoins: '2xmoney',
  x2candy: 'doublecandy',
  '2xcandy': 'doublecandy',
  doublecandy: 'x2candy',
  '2xlucky': 'doubleluck',
  doubleluck: '2xlucky',
  '2xspeed': 'x2speed',
  x2speed: '2xspeed',
  '2xturkeyleg': 'doubleturkeyleg',
  doubleturkeyleg: '2xturkeyleg',
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const tkey = (s) => String(s || '').toLowerCase().replace(/camera\s+man/g, 'cameraman').split(/[^a-z0-9]+/).filter(Boolean).sort().join('');
const keys = (name) => [...new Set([norm(name), ALIAS[norm(name)], tkey(name)].filter(Boolean))];

const getKind = (name, category) => {
  if (/^gamepass/i.test(category)) return 'boost';
  if (/^crate/i.test(category)) return 'crate';
  if (/^credits$/i.test(name.trim())) return 'currency';
  return 'unit';
};

/* ---------- числа ---------- */
const spreadSuffix = (s) => s.replace(/(\d[\d.]*)\s*(?:to|[-–—])\s*(\d[\d.]*)\s*([kKmM])\b/gi, '$1$3-$2$3');
const nums = (s) => {
  s = spreadSuffix(String(s ?? '').replace(/,(?=\d{3}\b)/g, '').replace(',', '.'));
  return [...s.matchAll(/(\d+(?:\.\d+)?)\s*([kKmM])?/g)].map((x) => +x[1] * ({ k: 1e3, m: 1e6 }[(x[2] || '').toLowerCase()] || 1));
};
const num = (s) => { const m = nums(s); return m.length ? m.reduce((a, b) => a + b) / m.length : 0; };
const dem = (s) => { const v = num(s); return v > 10 ? 10 : Math.round(v * 10) / 10; };

/* ---------- нормализация stability ---------- */
const STAB_RULES = [
  ['Unstable', /unstable|fluctuat|volatile/],
  ['Dropping', /dropp|declin|falling|crash/],
  ['Unwanted', /unwanted/],
  ['Underpaid', /underpaid/],
  ['Overpaid', /overpaid/],
  ['Rising', /rising|growing|increas|climb/],
  ['Stable', /(?<!un)stable/],
];
const PRIORITY = ['Dropping', 'Unwanted', 'Underpaid', 'Unstable', 'Overpaid', 'Rising', 'Stable'];
const stabFlags = (raw) => {
  const s = String(raw || '').replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
  return STAB_RULES.filter(([, re]) => re.test(s)).map(([n]) => n);
};
function parseStability(lines) {
  const hits = lines.filter((l) => l.length <= 48 && !/^(value|demand)\b/i.test(l) && !/^[\d.,]+\s*[kKmM]?(\s*\/\s*10)?$/.test(l) && stabFlags(l).length);
  const rawStability = [...new Set(hits)].slice(0, 2).join(' | ');
  let flags = stabFlags(rawStability);
  if (!flags.length) flags = ['Stable'];
  const stability = PRIORITY.find((p) => flags.includes(p)) || 'Stable';
  return { stability, flags, rawStability };
}

async function openPage(b, url) {
  const p = await b.newPage({ userAgent: UA });
  await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await p.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
  return p;
}

/* ---------- Источник 1: Vaulted Values X ---------- */
async function scrapeValuesOnce(b) {
  const p = await openPage(b, LIST);
  await p.waitForSelector('a[href*="/items/"]', { timeout: 60000 }).catch(() => {});

  const total = await p.evaluate(() => {
    const t = document.body.innerText;
    return +((t.match(/(\d+)\s+tracked items/i) || t.match(/(\d+)\s+items/i) || [])[1] || 0);
  });
  const count = () => p.evaluate(() => new Set([...document.querySelectorAll('a[href*="/items/"]')].map((a) => a.href.split('?')[0])).size);

  let prev = await count(), stuck = 0;
  for (let i = 0; i < 80; i++) {
    if (total && prev >= total) break;
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const btn = p.locator('button, [role="button"], a').filter({ hasText: /load more/i }).first();
    const visible = await btn.isVisible().catch(() => false);
    if (visible) {
      await btn.scrollIntoViewIfNeeded().catch(() => {});
      await btn.click({ timeout: 5000 }).catch(() => {});
    }
    let grew = false;
    for (let w = 0; w < 20; w++) {
      await sleep(400);
      const n = await count();
      if (n > prev) { prev = n; grew = true; break; }
    }
    if (grew) stuck = 0;
    else if (++stuck >= (visible ? 6 : 3)) break;
  }

  const raw = await p.evaluate(() => {
    const out = [], used = new Set();
    document.querySelectorAll('a[href*="/items/"]').forEach((a) => {
      const id = a.href.split('?')[0];
      if (used.has(id)) return;
      let card = a;
      while (card.parentElement && card.parentElement !== document.body) {
        const par = card.parentElement;
        const ids = new Set([...par.querySelectorAll('a[href*="/items/"]')].map((x) => x.href.split('?')[0]));
        if (ids.size > 1) break;
        card = par;
      }
      used.add(id);
      const links = [...card.querySelectorAll('a[href*="/items/"]')];
      const nm = links.map((x) => x.innerText.trim()).find((t) => t && !/artwork/i.test(t));
      const im = card.querySelector('img');
      out.push({ id, t: card.innerText.trim(), name: nm || im?.alt || '', img: im?.currentSrc || im?.src || '' });
    });
    return out;
  });

  const seen = new Map();
  for (const r of raw) {
    const L = r.t.split('\n').map((s) => s.trim()).filter(Boolean);
    const name = (r.name || L[0] || '').replace(/\s*artwork\s*$/i, '').trim();
    if (!name || seen.has(r.id)) continue;

    const { stability, flags, rawStability } = parseStability(L);
    let category = L.map((l) => CATS.find((c) => c.toLowerCase() === l.toLowerCase())).find(Boolean)
      || CATS.find((c) => new RegExp('\\b' + c + '\\b', 'i').test(r.t)) || 'Other';
    if (category === 'Gamepass') category = 'Gamepasses';
    if (category === 'Crate') category = 'Crates';

    const after = (label) => { const i = L.findIndex((l) => new RegExp('^' + label + '$', 'i').test(l)); return i >= 0 ? (L[i + 1] || '') : ''; };
    let valTxt = after('value');
    if (!valTxt) valTxt = (r.t.match(/value\s*[:\-]?\s*([\d.,]+\s*[kKmM]?(?:\s*[-–]\s*[\d.,]+\s*[kKmM]?)?)/i) || [])[1] || '';
    const value = /no value|n\/a|unknown|^—$|^-$/i.test(valTxt) ? 0 : Math.round(num(valTxt));
    const demand = dem((after('demand') || (r.t.match(/demand\s*[:\-]?\s*([\d.,]+)/i) || [])[1] || '').split('/')[0]);

    seen.set(r.id, { name, category, kind: getKind(name, category), value, demand, stability, flags, rawStability, img: r.img });
  }
  if (total && seen.size < total) console.warn(`values: на странице заявлено ${total}, собрано ${seen.size}`);
  if (!seen.size || (total && seen.size < total)) fs.writeFileSync('debug-values.html', await p.content());
  await p.close();

  // Дедупликация по имени без учёта регистра (например, Chocolate Tv Man vs Chocolate TV Man)
  const dedup = new Map();
  for (const it of seen.values()) {
    const k = norm(it.name);
    const prev = dedup.get(k);
    if (!prev) { dedup.set(k, it); continue; }
    const score = (x) => (x.value > 0 ? 1e6 : 0) + x.value + x.demand * 100 + (x.img ? 10 : 0);
    if (score(it) > score(prev)) {
      dedup.set(k, { ...it, img: it.img || prev.img });
    } else if (!prev.img && it.img) {
      prev.img = it.img;
    }
  }
  return { items: [...dedup.values()], total };
}

async function scrapeValues(b) {
  let best = { items: [], total: 0 };
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const r = await scrapeValuesOnce(b);
      if (r.items.length > best.items.length) best = r;
      if (best.total && best.items.length >= best.total) break;
      if (!best.total && best.items.length) break;
    } catch (e) { console.warn(`values attempt ${attempt}:`, e.message); }
  }
  return best;
}

/* ---------- Источник 2: game.guide ---------- */
const hnorm = (h) => String(h || '').toLowerCase().replace(/[+\-−–—%()]/g, ' ').replace(/\s+/g, ' ').trim();
const COLS = [
  ['level', /^(level|lv|lvl|upgrade)\b/],
  ['cost', /^(cost|price|upgrade cost)\b/],
  ['unitDps', /^unit.*dps|^minion.*dps|^spawn.*dps/],
  ['hp', /^(unit |minion |spawn(ed)? )?(hp|health)\b/],
  ['cooldown', /^(cool|cd\b|reload|every|interval|spawn (cool|every|interval|rate|time))/],
  ['income', /income|cash|earn|per wave|money|coins|\$/],
  ['spawns', /^(spawns?|spawned|unit|units|minion|summons?)\b/],
  ['aoe', /aoe|radius|splash/],
  ['damage', /^(dam|dmg)/],
  ['range', /^(range|rng)\b/],
  ['dps', /\bdps\b/],
];

function parseLevels(tables, role) {
  for (const t of tables) {
    if (t.length < 2) continue;
    const rawHead = t[0];
    const head = rawHead.map(hnorm);
    const map = {};
    head.forEach((h, i) => {
      if (!h) return;
      const hit = COLS.find(([k, re]) => map[k] === undefined && re.test(h));
      if (hit) map[hit[0]] = i;
    });
    if (map.level === undefined || Object.keys(map).length < 2) continue;
    const mapped = new Set(Object.values(map));
    const pctHead = rawHead.some((h) => /%/.test(h));

    let type = /spawner/i.test(role) ? 'spawner' : /farm/i.test(role) ? 'farm' : /support/i.test(role) ? 'support' : '';
    if (!type) {
      if (map.income !== undefined) type = 'farm';
      else if (map.spawns !== undefined || map.hp !== undefined || map.unitDps !== undefined) type = 'spawner';
      else if (pctHead && map.dps === undefined) type = 'support';
      else type = 'damage';
    }

    const rows = [];
    for (const r of t.slice(1)) {
      const first = (r[0] || '').trim();
      if (!first) continue;
      if (r.length === 1 || /^\+/.test(first)) {
        if (rows.length) rows[rows.length - 1].extra = ((rows[rows.length - 1].extra || '') + ' ' + first.replace(/\s+/g, ' ')).trim();
        continue;
      }
      const row = { level: first };
      for (const [k, i] of Object.entries(map)) {
        if (k === 'level') continue;
        row[k] = k === 'spawns' ? (r[i] || '').replace(/\s+/g, ' ').trim() : num(r[i]);
      }
      const other = {};
      rawHead.forEach((h, i) => { if (h && !mapped.has(i) && (r[i] || '').trim()) other[h.replace(/\s+/g, ' ').trim()] = r[i].replace(/\s+/g, ' ').trim().slice(0, 60); });
      if (Object.keys(other).length) row.cols = other;
      rows.push(row);
    }
    if (rows.length) return { type, pct: pctHead, rows };
  }
  return { type: '', pct: false, rows: [] };
}

const isoDay = (v) => {
  if (typeof v === 'number' || /^\d{10,13}$/.test(String(v))) {
    let n = +v; if (n < 1e11) n *= 1000;
    return new Date(n).toISOString().slice(0, 10);
  }
  const s = String(v || '').trim();
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  const yr = new Date().getFullYear();
  let t = Date.parse(/\b\d{4}\b/.test(s) ? s : `${s} ${yr}`);
  if (isFinite(t)) {
    if (!/\b\d{4}\b/.test(s) && t > Date.now() + 864e5 * 30) t = Date.parse(`${s} ${yr - 1}`);
    return new Date(t).toISOString().slice(0, 10);
  }
  return '';
};

const toNum = (v) => {
  if (typeof v === 'number') return isFinite(v) ? v : NaN;
  if (typeof v === 'string' && /^\d+(?:\.\d+)?$/.test(v.trim())) return +v;
  return NaN;
};

function extractSeriesJson(html) {
  const h = html.replace(/\\\\"/g, '"').replace(/\\"/g, '"').replace(/\\u0026/g, '&');
  const DK = /^(recordedAt|date|day|timestamp|time|ts|t|x|d)$/i;
  const VK = /^(price|value|median|avg|average|close|v|y|p|gems)$/i;
  const groups = [];
  let cur = [], lastEnd = -99;
  for (const m of h.matchAll(/\{[^{}]{5,280}\}/g)) {
    let o; try { o = JSON.parse(m[0]); } catch { continue; }
    const dk = Object.keys(o).find((k) => DK.test(k) && (typeof o[k] === 'number' || /^\d{4}-\d{2}-\d{2}|^\d{10,13}$|^[A-Za-z]{3}\s+\d{1,2}/.test(String(o[k]))));
    const vk = Object.keys(o).find((k) => VK.test(k) && isFinite(toNum(o[k])));
    if (!dk || !vk) continue;
    const date = isoDay(o[dk]);
    const val = toNum(o[vk]);
    if (!date || !isFinite(val)) continue;
    if (m.index - lastEnd > 8 && cur.length) { groups.push(cur); cur = []; }
    cur.push({ date, value: Math.round(val) });
    lastEnd = m.index + m[0].length;
  }
  if (cur.length) groups.push(cur);
  for (const m of h.matchAll(/\[\s*(?:\[\s*"(\d{4}-\d{2}-\d{2})[^"]*"\s*,\s*"?(\d+(?:\.\d+)?)"?\s*\]\s*,?\s*){4,}\]/g)) {
    const pts = [...m[0].matchAll(/\[\s*"(\d{4}-\d{2}-\d{2})[^"]*"\s*,\s*"?(\d+(?:\.\d+)?)"?\s*\]/g)].map((x) => ({ date: x[1], value: Math.round(+x[2]) }));
    if (pts.length) groups.push(pts);
  }
  const best = groups.filter((g) => g.length >= 2).sort((a, b) => b.length - a.length)[0];
  if (!best) return [];
  const byDay = new Map(best.map((p) => [p.date, p.value]));
  return [...byDay].sort((a, b) => a[0].localeCompare(b[0])).slice(-60).map(([date, value]) => ({ date, value }));
}

function parseUnitPage(d, role) {
  const o = {};
  if (d.wikiImg) o.wikiImg = d.wikiImg;
  if (d.wikiTitle) o.wikiTitle = d.wikiTitle;
  const lines = d.text.split('\n').map((s) => s.trim()).filter(Boolean);
  const lab = (re) => {
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(re);
      if (!m) continue;
      const rest = lines[i].slice(m[0].length).replace(/^[\s:·\-–—]+/, '');
      if (rest) return rest;
      if (lines[i + 1]) return lines[i + 1];
    }
    return '';
  };

  const lv = parseLevels(d.tables, role);
  if (lv.rows.length) { o.levels = lv.rows; o.levelsType = lv.type; if (lv.pct) o.levelsPct = true; }

  const rg = d.text.match(/Range at max level\s*([\d.,]+)/i);
  if (rg) o.maxRange = num(rg[1]);
  const how = d.how.split('\n').map((s) => s.trim()).filter(Boolean)[0];
  if (how) o.howToGet = how.slice(0, 160);
  const ab = d.stats.split('\n').map((s) => s.trim()).find((s) => s.length > 40) || d.about.split('\n').find((s) => s.length > 40);
  if (ab) o.description = ab.slice(0, 300);
  const aboutFull = d.about.split('\n').map((s) => s.trim()).filter(Boolean).join(' ').slice(0, 1200);
  if (aboutFull) o.about = aboutFull;

  // Категория редкости из описания game.guide (нужно для юнитов, которых нет на vaultedvaluesx)
  const catM = (aboutFull || d.text).match(/\bis\s+an?\s+(Basic|Common|Uncommon|Rare|Epic|Legendary|Mythic|Exclusive|Godly|Gamepass|Crate)\b/i);
  if (catM) {
    let c = catM[1];
    c = c[0].toUpperCase() + c.slice(1).toLowerCase();
    if (c === 'Basic') c = 'Common';
    if (c === 'Gamepass') c = 'Gamepasses';
    if (c === 'Crate') c = 'Crates';
    o.wikiCategory = c;
  }

  const market = {};
  const med = num(lab(/^market\b/i))
    || num((d.text.match(/trades\s+for\s+about\s+([\d.,]+\s*[kKmM]?)\s*gems/i) || [])[1])
    || num(lab(/^(market\s+)?(median|avg|average)( price| value)?\b/i));
  if (med) market.median = Math.round(med);

  const rngM = d.text.match(/usually\s+between\s+([\d.,]+\s*[kKmM]?)\s+and\s+([\d.,]+\s*[kKmM]?)\s+gems/i)
    || d.text.match(/\bRange\s*[:\-]?\s*([\d.,]+\s*[kKmM]?)\s*(?:to|[-–—])\s*([\d.,]+\s*[kKmM]?)\s*gems/i);
  if (rngM) {
    const a = num(rngM[1]), b = num(rngM[2]);
    if (a && b) { market.min = Math.round(Math.min(a, b)); market.max = Math.round(Math.max(a, b)); }
  }

  const bm = d.text.match(/(\d[\d,]*)\s*buyers?/i);
  const sm = d.text.match(/(\d[\d,]*)\s*sellers?/i);
  if (bm) market.buyers = +bm[1].replace(/,/g, '');
  if (sm) market.sellers = +sm[1].replace(/,/g, '');

  const tm = d.text.match(/traded\s+this\s+week[\s\S]{0,40}?(\d[\d,]*)\s*trades?/i)
    || d.text.match(/(\d[\d,]*)\s*trades?\s*(?:this week|7d|last 7 days)/i);
  if (tm) market.trades7d = +tm[1].replace(/,/g, '');

  const hi = lines.findIndex((l) => /commonly traded for|most traded for|often traded for/i.test(l) && l.length < 60);
  if (hi >= 0) {
    const top = [];
    for (let idx = hi + 1; idx < Math.min(lines.length, hi + 24) && top.length < 5; idx++) {
      const l = lines[idx];
      if (/^what traders gave/i.test(l)) continue;
      if (/^(price history|about|how to get|stats|buyers|sellers|market|added|update|rarity|drop|chance|level|place|overview|what's inside|related values|trades|faq)\b/i.test(l)) break;
      const inline = [...l.matchAll(/([A-Za-z0-9][A-Za-z0-9\s'.-]{1,36}?)\s*(\d[\d,]*)\s*trades?\b/gi)];
      if (inline.length) {
        for (const m of inline) if (top.length < 5) top.push({ name: m[1].trim(), count: +m[2].replace(/,/g, '') });
        continue;
      }
      if (/^\d[\d,]*\s*trades?$/i.test(l)) continue;
      const nxt = lines[idx + 1] || '';
      const cm = nxt.match(/^(\d[\d,]*)\s*trades?$/i);
      if (cm) {
        top.push({ name: l.replace(/[·x×:\-–\s]+$/, '').trim(), count: +cm[1].replace(/,/g, '') });
        idx++;
      } else if (l.length >= 2 && l.length <= 40 && !/\d{3,}/.test(l)) {
        top.push({ name: l });
      }
    }
    if (top.length) market.topTrades = top;
  }
  if (Object.keys(market).length) o.market = market;

  const rr = d.text.match(/the\s+(\d+)(?:st|nd|rd|th)\s+rarest\s+of\s+\d+/i)
    || d.text.match(/#\s?(\d+)\s*(?:of\s*\d+\s*)?(?:rarest|by rarity|in rarity)/i);
  if (rr) o.rarityRank = +rr[1];
  else if (/,\s*the\s+rarest\s+of\s+\d+\s+units/i.test(d.text)) o.rarityRank = 1;

  const dc = d.text.match(/(\d+(?:\.\d+)?)\s*%\s*(?:chance|drop)|(?:drop chance|chance|odds)\D{0,24}(\d+(?:\.\d+)?)\s*%/i);
  if (dc) o.dropChance = +(dc[1] || dc[2]);
  const added = lab(/^(added|released?|introduced)( in| on)?\b/i) || (d.text.match(/added in ([^\n.]{3,40})/i) || [])[1];
  if (added) o.added = added.slice(0, 60);
  const upd = lab(/^update\b/i); if (upd) o.update = upd.slice(0, 60);

  let series = extractSeriesJson(d.html);
  let chartMode = series.length ? 'json:' + series.length : d.svgMode;
  if (!series.length && d.svgPts?.length) {
    const byDay = new Map();
    for (const p of d.svgPts) {
      const day = new Date(p.ts).toISOString().slice(0, 10);
      byDay.set(day, Math.round(p.val));
    }
    series = [...byDay].sort((a, b) => a[0].localeCompare(b[0])).map(([date, value]) => ({ date, value }));
  }
  if (series.length) o.priceHistory = series;
  return { o, chartMode };
}

async function scrapeWiki(b) {
  const p = await openPage(b, UNITS);
  await p.waitForSelector('table tbody tr a', { timeout: 45000 }).catch(() => {});
  const rows = await p.evaluate(() => {
    const t = document.querySelector('table');
    if (!t) return [];
    const head = [...t.querySelectorAll('thead th, tr:first-child th')].map((h) => h.innerText.trim().toLowerCase());
    return [...t.querySelectorAll('tbody tr')].map((tr) => {
      const a = tr.querySelector('a[href]');
      const im = a?.querySelector('img') || tr.querySelector('img');
      let img = im?.currentSrc || im?.src || '';
      if (img.includes('/_next/image')) {
        try { const u = new URL(img).searchParams.get('url'); if (u) img = new URL(u, location.origin).href; } catch {}
      }
      const cells = [...tr.children].map((c) => c.innerText.trim());
      return { href: a?.href || '', cells, head, name: im?.alt || '', img };
    });
  });
  if (!rows.length) fs.writeFileSync('debug-wiki.html', await p.content());
  await p.close();

  const stats = new Map();
  const pages = [];
  const known = new Set();

  for (const r of rows) {
    if (!r.href) continue;
    const url = r.href.split('?')[0].split('#')[0];
    known.add(url);
    const slug = new URL(url).pathname.replace(/^\//, '').replace(/-value-cameraman-tower-defense$/, '');
    const name = slug.replace(/-/g, ' ');
    const idx = (re) => r.head.findIndex((h) => re.test(h));
    const cell = (re) => { const i = idx(re); return i >= 0 ? r.cells[i] : ''; };
    const first = r.cells[0] || '';
    const titleLine = (first.split('\n')[0] || r.name || name).trim();
    const rarM = first.match(/\b(Basic|Common|Uncommon|Rare|Epic|Legendary|Mythic|Exclusive|Godly)\b/i);
    let wikiCategory = rarM ? rarM[1][0].toUpperCase() + rarM[1].slice(1).toLowerCase() : '';
    if (wikiCategory === 'Basic') wikiCategory = 'Common';

    const tier = (cell(/^tier/).match(/^[SABCD]\+?$/i) || [''])[0].toUpperCase();
    const capTxt = cell(/^cap/);
    const o = {
      wikiName: name,
      wikiTitle: titleLine,
      fromUnits: true,
      ...(wikiCategory && { wikiCategory }),
      ...(r.img && { wikiImg: r.img }),
      ...(tier && { tier }),
      ...(num(cell(/max dps/)) && { maxDps: num(cell(/max dps/)) }),
      ...(num(cell(/per 1k/)) && { dpsPer1k: num(cell(/per 1k/)) }),
      ...(num(cell(/to max/)) && { cashToMax: num(cell(/to max/)) }),
      ...(capTxt && { maxOnMap: /no cap/i.test(capTxt) ? 'No cap' : num(capTxt) }),
      ...(num(cell(/^exist/)) && { exist: num(cell(/^exist/)) }),
      role: (first.split('\n').pop() || '').replace(/^[^·]*·\s*/, '').trim(),
    };
    keys(titleLine).forEach((k) => stats.set(k, o));
    keys(name).forEach((k) => stats.set(k, o));
    pages.push({ href: url, o });
  }

  try {
    const v = await openPage(b, VLIST);
    await v.waitForSelector('a[href*="-value-cameraman-tower-defense"]', { timeout: 45000 }).catch(() => {});
    const extraLinks = await v.evaluate(() =>
      [...new Set([...document.querySelectorAll('a[href*="-value-cameraman-tower-defense"]')].map((a) => a.href.split('?')[0].split('#')[0]))]
    );
    await v.close();
    let addedExtra = 0;
    for (const url of extraLinks) {
      if (known.has(url)) continue;
      const pathname = new URL(url).pathname;
      if (!pathname.endsWith('-value-cameraman-tower-defense')) continue;
      const slug = pathname.replace(/^\//, '').replace(/-value-cameraman-tower-defense$/, '');
      if (!slug || slug.includes('/')) continue;
      known.add(url);
      const name = slug.replace(/-/g, ' ');
      const o = { wikiName: name };
      keys(name).forEach((k) => { if (!stats.has(k)) stats.set(k, o); });
      pages.push({ href: url, o });
      addedExtra++;
    }
    console.log(`value-list extra pages: +${addedExtra}`);
  } catch (e) { console.warn('vlist extra failed:', e.message); }

  let sampled = false;
  const modes = {};
  const doPage = async (pg) => {
    try {
      const q = await openPage(b, pg.href);
      await q.waitForSelector('.recharts-surface path.recharts-curve', { timeout: 4000 }).catch(() => {});
      const d = await q.evaluate(() => {
        const tables = [...document.querySelectorAll('table')].map((t) =>
          [...t.querySelectorAll('tr')].map((r) => [...r.children].map((c) => c.innerText.trim())));
        const sec = (h) => { const e = [...document.querySelectorAll('h2,h3')].find((x) => new RegExp(h, 'i').test(x.innerText)); if (!e) return ''; let s = '', n = e.nextElementSibling; while (n && !/^H[23]$/.test(n.tagName)) { s += n.innerText + '\n'; n = n.nextElementSibling; } return s.trim(); };

        const h1 = (document.querySelector('h1')?.innerText || '').replace(/\s+Value$/i, '').replace(/\s*[-–|].*$/, '').trim();
        const im = document.querySelector('.gki-card-art img') || document.querySelector('main img[src*="cameraman-tower-defense"]');
        let wikiImg = im?.currentSrc || im?.src || document.querySelector('meta[property="og:image"]')?.content || '';
        if (wikiImg.includes('/_next/image')) {
          try { const u = new URL(wikiImg).searchParams.get('url'); if (u) wikiImg = new URL(u, location.origin).href; } catch {}
        }

        const extractSvg = () => {
          const svgs = [...document.querySelectorAll('svg.recharts-surface, svg')].filter((s) => {
            const r = s.getBoundingClientRect();
            return r.width > 120 && r.height > 60 && s.querySelectorAll('text').length >= 4;
          });
          const svg = svgs[0];
          if (!svg) return { mode: 'no-svg', pts: [] };
          const texts = [...svg.querySelectorAll('text')].map((t) => { const r = t.getBoundingClientRect(); return { s: t.textContent.trim(), cx: r.left + r.width / 2, cy: r.top + r.height / 2 }; });
          const xTicks = texts.filter((t) => /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2}|\d{1,2}\/\d{1,2}/i.test(t.s));
          const yTicks = texts.filter((t) => /^\$?[\d.,]+\s*[kKmMbB]?$/.test(t.s));
          if (xTicks.length < 2 || yTicks.length < 2) return { mode: `ticks:${xTicks.length}/${yTicks.length}`, pts: [] };
          const pVal = (s) => { const m = s.replace(/[$,]/g, '').trim().match(/^([\d.]+)\s*([kKmMbB]?)$/); return m ? +m[1] * ({ k: 1e3, m: 1e6, b: 1e9 }[(m[2] || '').toLowerCase()] || 1) : NaN; };
          const pDay = (s) => { const yr = new Date().getFullYear(); let t = Date.parse(`${s} ${yr}`); if (isNaN(t)) t = Date.parse(s); if (!isNaN(t) && t > Date.now() + 864e5 * 30) t = Date.parse(`${s} ${yr - 1}`); return t; };
          const xs = xTicks.map((t) => ({ ...t, ts: pDay(t.s) })).filter((t) => isFinite(t.ts)).sort((a, b) => a.cx - b.cx);
          const ys = yTicks.map((t) => ({ ...t, val: pVal(t.s) })).filter((t) => isFinite(t.val)).sort((a, b) => a.cy - b.cy);
          if (xs.length < 2 || ys.length < 2) return { mode: 'bad-ticks', pts: [] };
          const x0 = xs[0], x1 = xs[xs.length - 1], yTop = ys[0], yBot = ys[ys.length - 1];
          if (Math.abs(x1.cx - x0.cx) < 10 || Math.abs(yBot.cy - yTop.cy) < 10) return { mode: 'flat-axis', pts: [] };
          const shapes = [...svg.querySelectorAll('path, polyline')].map((el) => {
            const r = el.getBoundingClientRect(), cs = getComputedStyle(el); let len = 0; try { len = el.getTotalLength(); } catch {}
            return { el, w: r.width, h: r.height, len, fill: cs.fill, stroke: cs.stroke };
          }).filter((s) => s.w > 40 && s.len > 40 && (s.h > 2 || s.el.tagName.toLowerCase() === 'polyline' || s.len > s.w * 1.02));
          shapes.sort((a, b) => ((b.stroke !== 'none' ? 4 : 0) + (b.fill === 'none' ? 2 : 0) + (b.h > 3 ? 1 : 0)) - ((a.stroke !== 'none' ? 4 : 0) + (a.fill === 'none' ? 2 : 0) + (a.h > 3 ? 1 : 0)) || b.len - a.len);
          const target = shapes[0]; if (!target) return { mode: 'no-path', pts: [] };
          const ctm = target.el.getScreenCTM(); if (!ctm) return { mode: 'no-ctm', pts: [] };
          const pts = [], N = 80; let maxVx = -Infinity;
          for (let i = 0; i <= N; i++) {
            const pt = target.el.getPointAtLength((target.len * i) / N);
            const vx = ctm.a * pt.x + ctm.c * pt.y + ctm.e, vy = ctm.b * pt.x + ctm.d * pt.y + ctm.f;
            if (target.fill !== 'none' && vx < maxVx - 2) break;
            if (vx > maxVx) maxVx = vx;
            if (vx < x0.cx - 8 || vx > x1.cx + 8) continue;
            const ts = x0.ts + ((vx - x0.cx) / (x1.cx - x0.cx)) * (x1.ts - x0.ts);
            const val = yBot.val + ((yBot.cy - vy) / (yBot.cy - yTop.cy)) * (yTop.val - yBot.val);
            if (isFinite(ts) && isFinite(val) && val >= 0) pts.push({ ts, val });
          }
          return { mode: 'svg:' + pts.length, pts };
        };

        const chart = extractSvg();
        return { tables, text: document.body.innerText, html: document.documentElement.outerHTML, about: sec('^about'), how: sec('^how to get'), stats: sec('^stats'), wikiImg, wikiTitle: h1, svgMode: chart.mode, svgPts: chart.pts };
      });
      await q.close();
      if (!sampled) { sampled = true; fs.writeFileSync('debug-unit-sample.html', d.html); fs.writeFileSync('debug-unit-sample.txt', d.text); }
      const { o, chartMode } = parseUnitPage(d, pg.o.role || '');
      modes[chartMode.split(':')[0]] = (modes[chartMode.split(':')[0]] || 0) + 1;
      const keepTitle = pg.o.wikiTitle;
      const keepImg = pg.o.wikiImg;
      Object.assign(pg.o, o);
      if (!pg.o.wikiImg && keepImg) pg.o.wikiImg = keepImg;
      if (keepTitle && keepTitle.length >= 2) pg.o.wikiTitle = keepTitle;
      if (pg.o.wikiTitle) keys(pg.o.wikiTitle).forEach((k) => { if (!stats.has(k)) stats.set(k, pg.o); });
    } catch (e) { console.warn('wiki skip', pg.href, e.message); }
  };

  let next = 0;
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (next < pages.length) { const pg = pages[next++]; await doPage(pg); await sleep(150); }
  }));
  console.log('chartModes:', JSON.stringify(modes));
  return stats;
}

/* ---------- Эталоны портретов (32x32 RGBA, обрезанные и отцентрованные по маске силуэта) ---------- */
function sniffMime(buf, headerCt) {
  const ct = String(headerCt || '').split(';')[0].trim().toLowerCase();
  if (/^image\/(png|jpeg|jpg|webp|gif|svg\+xml)$/i.test(ct)) return ct === 'image/jpg' ? 'image/jpeg' : ct;
  if (buf.length >= 12 && buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  if (buf.length >= 4 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xd8) return 'image/jpeg';
  if (buf.subarray(0, 64).toString('utf8').includes('<svg')) return 'image/svg+xml';
  return 'image/png';
}

async function buildIcons(b, items, wikiImgByName) {
  let oldIcons = {}, oldSize = 0;
  try {
    const oldJ = JSON.parse(fs.readFileSync(FI, 'utf8'));
    oldIcons = oldJ.items || {};
    oldSize = oldJ.size || 0;
  } catch {}

  const p = await b.newPage({ userAgent: UA });
  const out = {};
  const urlCache = new Map();
  let ok = 0;
  const failed = [];

  const fetchDataUrl = async (url) => {
    if (!url) return '';
    if (urlCache.has(url)) return urlCache.get(url);
    const toDataUrl = (buf, hdr) => `data:${sniffMime(buf, hdr)};base64,${buf.toString('base64')}`;
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA } });
      if (r.ok) {
        const buf = Buffer.from(await r.arrayBuffer());
        if (buf.length > 64) {
          const res = toDataUrl(buf, r.headers.get('content-type'));
          urlCache.set(url, res);
          return res;
        }
      }
    } catch {}
    // Fallback через Playwright request (если сервер режет node fetch)
    try {
      const r2 = await p.request.get(url, { timeout: 15000 });
      if (r2.ok()) {
        const buf = await r2.body();
        if (buf.length > 64) {
          const res = toDataUrl(buf, r2.headers()['content-type']);
          urlCache.set(url, res);
          return res;
        }
      }
    } catch {}
    urlCache.set(url, '');
    return '';
  };

  const targetItems = items.filter((it) => it.category !== 'Signed');
  for (let idx = 0; idx < targetItems.length; idx += 8) {
    const batch = targetItems.slice(idx, idx + 8);
    const loaded = await Promise.all(batch.map(async (it) => {
      const wImg = wikiImgByName.get(it.name) || '';
      const dataUrl = (await fetchDataUrl(it.img)) || (wImg && wImg !== it.img ? await fetchDataUrl(wImg) : '');
      return { name: it.name, dataUrl };
    }));

    const encoded = await p.evaluate(async ({ list, S }) => {
      const c1 = document.createElement('canvas'); c1.width = 128; c1.height = 128;
      const x1 = c1.getContext('2d', { willReadFrequently: true });
      const c2 = document.createElement('canvas'); c2.width = S; c2.height = S;
      const x2 = c2.getContext('2d', { willReadFrequently: true });
      const res = {};
      for (const { name, dataUrl } of list) {
        if (!dataUrl) continue;
        const im = new Image();
        const loadedOk = await new Promise((r) => { im.onload = () => r(true); im.onerror = () => r(false); im.src = dataUrl; });
        if (!loadedOk || !im.width || !im.height) continue;
        x1.clearRect(0, 0, 128, 128);
        x1.drawImage(im, 0, 0, 128, 128);
        const d = x1.getImageData(0, 0, 128, 128).data;
        let x0 = 128, y0 = 128, x1b = 0, y1b = 0;
        for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
          if (d[(y * 128 + x) * 4 + 3] > 24) {
            if (x < x0) x0 = x; if (x > x1b) x1b = x;
            if (y < y0) y0 = y; if (y > y1b) y1b = y;
          }
        }
        if (x1b <= x0 || y1b <= y0) { x0 = 0; y0 = 0; x1b = 127; y1b = 127; }
        const bw = x1b - x0 + 1, bh = y1b - y0 + 1, side = Math.max(bw, bh);
        const pad = 1, ds = S - pad * 2, dw = (bw / side) * ds, dh = (bh / side) * ds;
        x2.clearRect(0, 0, S, S);
        x2.drawImage(c1, x0, y0, bw, bh, pad + (ds - dw) / 2, pad + (ds - dh) / 2, dw, dh);
        const px = x2.getImageData(0, 0, S, S).data;
        let bin = '';
        for (let i = 0; i < px.length; i++) bin += String.fromCharCode(px[i]);
        res[name] = btoa(bin);
      }
      return res;
    }, { list: loaded, S: ICON_SIZE });

    for (const it of batch) {
      if (encoded[it.name]) { out[it.name] = encoded[it.name]; ok++; }
      else if (oldSize === ICON_SIZE && oldIcons[it.name]) { out[it.name] = oldIcons[it.name]; ok++; }
      else failed.push(it.name);
    }
  }
  await p.close();
  fs.mkdirSync('data', { recursive: true });
  fs.writeFileSync(FI, JSON.stringify({ version: 2, size: ICON_SIZE, updated: new Date().toISOString(), items: out }));
  console.log(`icons.json (${ICON_SIZE}x${ICON_SIZE}): ${ok} / ${targetItems.length}`);
  if (failed.length) console.warn('icons missing:', failed.join(', '));
}

/* ---------- Слияние и запись ---------- */
let old = { items: [], changelog: [] };
try { old = JSON.parse(fs.readFileSync(F, 'utf8')); } catch {}
old.items ||= [];
let hist = { version: 1, items: {} };
try { hist = JSON.parse(fs.readFileSync(FH, 'utf8')); } catch {}
hist.items ||= {};

const oldExact = new Map(old.items.map((i) => [i.name.toLowerCase(), i]));
const oldBy = {};
old.items.forEach((i) => keys(i.name).forEach((k) => { if (!oldBy[k]) oldBy[k] = i; }));
const findOld = (name) => oldExact.get(name.toLowerCase()) || (() => { for (const k of keys(name)) if (oldBy[k]) return oldBy[k]; return null; })();
const findBy = (map, name) => { for (const k of keys(name)) { const v = map.get(k); if (v) return v; } return null; };

const b = await chromium.launch();
let live = [], total = 0, wiki = new Map();
try { ({ items: live, total } = await scrapeValues(b)); } catch (e) { console.error('values failed:', e.message); }
try { wiki = await scrapeWiki(b); } catch (e) { console.error('wiki failed:', e.message); }

const uniqueWiki = [...new Set([...wiki.values()])];
const wikiUnits = uniqueWiki.length;
console.log(`values: ${live.length}${total ? ' / ' + total : ''}, wiki items: ${wikiUnits}`);
if (live.length < 5) { await b.close(); console.error('Источник цен не отдал данные — prices.json не тронут'); process.exit(1); }
if (old.items.length > 20 && live.length < old.items.length * 0.7) { await b.close(); console.error(`Слишком мало юнитов: ${live.length} из ${old.items.length} — prices.json не тронут`); process.exit(1); }

const STAT_KEYS = ['tier', 'maxDps', 'dpsPer1k', 'cashToMax', 'maxOnMap', 'maxRange', 'exist', 'howToGet', 'description', 'about', 'added', 'update',
  'rarityRank', 'dropChance', 'levels', 'levelsType', 'levelsPct', 'role', 'market', 'priceHistory'];
const unmatched = [];
const matchedWiki = new Set();
const matchedKeys = new Set();
const wikiImgByName = new Map();

const items = live.map((i) => {
  const prev = findOld(i.name) || {};
  const w = findBy(wiki, i.name) || {};
  if (w.wikiName) matchedWiki.add(w);
  keys(i.name).forEach((k) => matchedKeys.add(k));
  const keep = Object.fromEntries(Object.entries(prev).filter(([k]) => STAT_KEYS.includes(k)));
  const { wikiName, wikiTitle, wikiCategory, wikiImg, fromUnits, ...ws } = w;
  if (wikiImg) wikiImgByName.set(i.name, wikiImg);
  if (!wikiName && wiki.size && !prev.tier && !prev.maxDps && i.kind === 'unit') unmatched.push(i.name);
  return { ...keep, ...ws, ...i, img: i.img || prev.img || wikiImg || '' };
});

// Добавляем юнитов с game.guide, которых нет на vaultedvaluesx.com (Clown Speakerman, Mummy Cameraman и т.д.)
let extraWikiCount = 0;
for (const w of uniqueWiki) {
  if (matchedWiki.has(w)) continue;
  const displayName = (w.wikiTitle || w.wikiName || '').replace(/\bTv\b/g, 'TV').trim();
  if (!displayName || keys(displayName).some((k) => matchedKeys.has(k))) continue;
  if (!w.fromUnits && !(w.wikiCategory && w.wikiCategory !== 'Other' && (w.wikiImg || w.market?.median))) continue;
  const category = w.wikiCategory || 'Other';
  const { wikiName, wikiTitle, wikiCategory, wikiImg, fromUnits, ...ws } = w;
  const prev = findOld(displayName) || {};
  const keep = Object.fromEntries(Object.entries(prev).filter(([k]) => STAT_KEYS.includes(k)));
  if (wikiImg) wikiImgByName.set(displayName, wikiImg);
  items.push({
    ...keep,
    ...ws,
    name: displayName,
    category,
    kind: getKind(displayName, category),
    value: 0,
    demand: 0,
    stability: 'Stable',
    flags: ['Stable'],
    rawStability: '',
    img: wikiImg || prev.img || '',
  });
  keys(displayName).forEach((k) => matchedKeys.add(k));
  extraWikiCount++;
}
if (extraWikiCount) console.log(`Добавлено с game.guide (нет на vaultedvaluesx): +${extraWikiCount}`);
if (unmatched.length) console.warn('Без статистики (имя не совпало с game.guide):', unmatched.join(', '));

try { await buildIcons(b, items, wikiImgByName); } catch (e) { console.error('icons failed:', e.message); }
await b.close();

const byExist = items.filter((i) => i.kind === 'unit' && i.exist > 0).sort((a, c) => a.exist - c.exist);
byExist.forEach((i, n) => { if (!i.rarityRank) i.rarityRank = n + 1; });

const d = new Date().toISOString().slice(0, 10);

let histNew = 0;
for (const i of items) {
  const arr = hist.items[i.name] || [];
  const last = arr[arr.length - 1];
  if (last && last[0] === d) { last[1] = i.value; last[2] = i.demand; }
  else if (i.value > 0 || i.demand > 0 || i.market?.median > 0 || arr.length) { arr.push([d, i.value, i.demand]); histNew++; }
  if (arr.length) hist.items[i.name] = arr.slice(-HIST_KEEP);
}
hist.updated = new Date().toISOString();

const changelog = [
  ...items.filter((i) => { const p = findOld(i.name); return p && p.value !== i.value; })
    .map((i) => ({ name: i.name, old: findOld(i.name).value, new: i.value, date: d })),
  ...(old.changelog || []),
].slice(0, 200);

fs.mkdirSync('data', { recursive: true });
fs.writeFileSync(F, JSON.stringify({
  updated: new Date().toISOString(), version: 10,
  sources: { values: live.length, valuesTotal: total, wiki: wikiUnits, extraWiki: extraWikiCount },
  items, changelog,
}, null, 1));
fs.writeFileSync(FH, JSON.stringify(hist));

const has = (k) => items.filter((i) => i[k] !== undefined).length;
console.log('items', items.length, '| zero-value', items.filter((i) => !i.value).length, '| with stats', items.filter((i) => i.maxDps || i.levels || i.tier).length);
console.log(`levels ${has('levels')} | market ${has('market')} | priceHistory ${has('priceHistory')} | about ${has('about')} | dropChance ${has('dropChance')} | history +${histNew}`);
const types = {};
items.forEach((i) => { if (i.levelsType) types[i.levelsType] = (types[i.levelsType] || 0) + 1; });
console.log('levelsType', JSON.stringify(types));
