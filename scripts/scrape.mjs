// scripts/scrape.mjs — CTD Trader v5
// Источник 1: vaultedvaluesx.com (официальные Value, demand, stability)
// Источник 2: game.guide (статы, уровни, рынок, история цен, вики-описание)
// + data/history.json — собственная ежедневная история Value (копится при каждом запуске)
import { chromium } from 'playwright';
import fs from 'fs';

const LIST = 'https://cameraman-td.vaultedvaluesx.com/value-list';
const UNITS = 'https://www.game.guide/cameraman-tower-defense/units';
const F = 'data/prices.json';
const FH = 'data/history.json';
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36';
const HIST_KEEP = 400; // дней истории на предмет
const CATS = ['Gamepasses', 'Gamepass', 'Crates', 'Crate', 'Godly', 'Mythic', 'Exclusive', 'Legendary', 'Epic', 'Rare', 'Uncommon', 'Common', 'Signed'];

const ALIAS = {
  videotapertitan: 'upgradedvideotapperprototype',
  prototypeduo: 'prototypesduo',
  glitchplungerman: 'glitchcameraman',
  largeprototypetitan: 'upgradedbruteprototype',
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const tkey = (s) => String(s || '').toLowerCase().replace(/camera\s+man/g, 'cameraman').split(/[^a-z0-9]+/).filter(Boolean).sort().join('');
const keys = (name) => [norm(name), ALIAS[norm(name)], tkey(name)].filter(Boolean);

const getKind = (name, category) => {
  if (/^gamepass/i.test(category)) return 'boost';
  if (/^crate/i.test(category)) return 'crate';
  if (/^credits$/i.test(name.trim())) return 'currency';
  return 'unit';
};

/* ---------- числа ---------- */
// "20-25K" -> "20K-25K": суффикс относится к обоим краям диапазона
const spreadSuffix = (s) => s.replace(/(\d[\d.]*)\s*[-–—]\s*(\d[\d.]*)\s*([kKmM])\b/g, '$1$3-$2$3');
const nums = (s) => {
  s = spreadSuffix(String(s ?? '').replace(/,(?=\d{3}\b)/g, '').replace(',', '.'));
  return [...s.matchAll(/(\d+(?:\.\d+)?)\s*([kKmM])?/g)].map((x) => +x[1] * ({ k: 1e3, m: 1e6 }[(x[2] || '').toLowerCase()] || 1));
};
const num = (s) => { const m = nums(s); return m.length ? m.reduce((a, b) => a + b) / m.length : 0; };
const dem = (s) => { const v = num(s); return v > 10 ? 10 : Math.round(v * 10) / 10; };

/* ---------- нормализация stability ----------
   Vaulted Values отдаёт составные статусы: "slowly rising | overpaid",
   "HeavilyOverpaid For", "Fluctuating", "Stable/Unwanted".
   Сохраняем: rawStability (как есть), flags (все признаки), stability (главный признак). */
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

  // скроллим и жмём «Load more items», пока не загрузятся все карточки или кнопка не исчезнет
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

  // Карточка = самый большой предок ссылки, внутри которого ещё нет ссылок на ДРУГИЕ предметы.
  // (Раньше требовали слово "value" в тексте — карточки "No value"/"N/A" отбрасывались.)
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
    // No value / N/A / Common / Unknown -> 0, но предмет СОХРАНЯЕМ в списке
    const value = /no value|n\/a|unknown|^—$|^-$/i.test(valTxt) ? 0 : Math.round(num(valTxt));
    const demand = dem((after('demand') || (r.t.match(/demand\s*[:\-]?\s*([\d.,]+)/i) || [])[1] || '').split('/')[0]);

    seen.set(r.id, { name, category, kind: getKind(name, category), value, demand, stability, flags, rawStability, img: r.img });
  }
  if (total && seen.size < total) console.warn(`values: на странице заявлено ${total}, собрано ${seen.size}`);
  if (!seen.size || (total && seen.size < total)) fs.writeFileSync('debug-values.html', await p.content());
  await p.close();
  return { items: [...seen.values()], total };
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
// порядок важен: первое совпадение выигрывает, колонка занимается один раз
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
      // неизвестные колонки не теряем
      const other = {};
      rawHead.forEach((h, i) => { if (h && !mapped.has(i) && (r[i] || '').trim()) other[h.replace(/\s+/g, ' ').trim()] = r[i].replace(/\s+/g, ' ').trim().slice(0, 60); });
      if (Object.keys(other).length) row.cols = other;
      rows.push(row);
    }
    if (rows.length) return { type, pct: pctHead, rows };
  }
  return { type: '', pct: false, rows: [] };
}

/* дата -> YYYY-MM-DD */
const isoDay = (v) => {
  if (typeof v === 'number' || /^\d{10,13}$/.test(String(v))) {
    let n = +v; if (n < 1e11) n *= 1000;
    return new Date(n).toISOString().slice(0, 10);
  }
  const m = String(v).match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : '';
};

/* История цен из встроенного JSON страницы (Next.js / recharts / любой массив точек) */
function extractSeries(html) {
  const h = html.replace(/\\"/g, '"').replace(/\\u0026/g, '&');
  const DK = /^(date|day|timestamp|time|ts|t|x|d)$/i, VK = /^(value|price|median|avg|average|close|v|y|p)$/i;
  const groups = [];
  let cur = [], lastEnd = -99;
  for (const m of h.matchAll(/\{[^{}]{5,240}\}/g)) {
    let o; try { o = JSON.parse(m[0]); } catch { continue; }
    const dk = Object.keys(o).find((k) => DK.test(k) && (typeof o[k] === 'number' || /^\d{4}-\d{2}-\d{2}|^\d{10,13}$/.test(String(o[k]))));
    const vk = Object.keys(o).find((k) => VK.test(k) && typeof o[k] === 'number');
    if (!dk || !vk) continue;
    const date = isoDay(o[dk]);
    if (!date) continue;
    if (m.index - lastEnd > 4 && cur.length) { groups.push(cur); cur = []; }
    cur.push({ date, value: Math.round(o[vk]) });
    lastEnd = m.index + m[0].length;
  }
  if (cur.length) groups.push(cur);
  for (const m of h.matchAll(/\[\s*(?:\[\s*"(\d{4}-\d{2}-\d{2})[^"]*"\s*,\s*(\d+(?:\.\d+)?)\s*\]\s*,?\s*){5,}\]/g)) {
    const pts = [...m[0].matchAll(/\[\s*"(\d{4}-\d{2}-\d{2})[^"]*"\s*,\s*(\d+(?:\.\d+)?)\s*\]/g)].map((x) => ({ date: x[1], value: Math.round(+x[2]) }));
    if (pts.length) groups.push(pts);
  }
  const best = groups.filter((g) => g.length >= 5).sort((a, b) => b.length - a.length)[0];
  if (!best) return [];
  const byDay = new Map(best.map((p) => [p.date, p.value]));
  return [...byDay].sort((a, b) => a[0].localeCompare(b[0])).slice(-30).map(([date, value]) => ({ date, value }));
}

/* Рынок / вики из текста страницы юнита (эвристики по подписям) */
function parseUnitPage(d, role) {
  const o = {};
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

  // рынок
  const market = {};
  const med = num(lab(/^(market\s+|median\s+)?(median|avg|average)( price| value)?\b/i));
  if (med) market.median = Math.round(med);
  const rn = nums(lab(/^(price\s+)?(range|spread)\b/i));
  if (rn.length >= 2) { market.min = Math.round(Math.min(...rn)); market.max = Math.round(Math.max(...rn)); }
  const by = num(lab(/^buyers?\b/i)); if (by) market.buyers = Math.round(by);
  const sl = num(lab(/^sellers?\b/i)); if (sl) market.sellers = Math.round(sl);
  const tr = num(lab(/^(trades?|deals?)\s*(\(?\s*(7d|7 days|last 7 days|this week)\s*\)?|per week|weekly)/i) || lab(/^(7d|weekly|7 day)\s*(trades?|deals?)/i));
  if (tr) market.trades7d = Math.round(tr);

  // топ-5 «на что меняют»
  const hi = lines.findIndex((l) => /(most|commonly|often|top).{0,24}(traded|trade|swap)|traded for|trades for|trade for/i.test(l) && l.length < 70);
  if (hi >= 0) {
    const top = [];
    for (const l of lines.slice(hi + 1, hi + 16)) {
      if (top.length >= 5) break;
      if (/^(price history|about|how to get|stats|buyers|sellers|median|range|added|update|rarity|drop|chance|odds|#)/i.test(l)) break;
      const m = l.match(/^(.{2,40}?)\s*[·x×:\-–]?\s*(\d+(?:[.,]\d+)?)\s*(%|trades?|times)?$/i);
      if (m) top.push({ name: m[1].replace(/[·x×:\-–\s]+$/, '').trim(), count: num(m[2]), ...(m[3] === '%' && { pct: true }) });
      else if (l.length >= 2 && l.length <= 40 && !/\d{3,}/.test(l)) top.push({ name: l });
    }
    if (top.length) market.topTrades = top;
  }
  if (Object.keys(market).length) o.market = market;

  const rr = d.text.match(/#\s?(\d+)\s*(?:of\s*\d+\s*)?(?:rarest|by rarity|in rarity)|rarity rank\s*:?\s*#?(\d+)/i);
  if (rr) o.rarityRank = +(rr[1] || rr[2]);
  const dc = d.text.match(/(\d+(?:\.\d+)?)\s*%\s*(?:chance|drop)|(?:drop chance|chance|odds)\D{0,24}(\d+(?:\.\d+)?)\s*%/i);
  if (dc) o.dropChance = +(dc[1] || dc[2]);
  const added = lab(/^(added|released?|introduced)( in| on)?\b/i) || (d.text.match(/added in ([^\n.]{3,40})/i) || [])[1];
  if (added) o.added = added.slice(0, 60);
  const upd = lab(/^update\b/i); if (upd) o.update = upd.slice(0, 60);

  const series = extractSeries(d.html);
  if (series.length) o.priceHistory = series;
  return o;
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
      const cells = [...tr.children].map((c) => c.innerText.trim());
      return { href: a?.href || '', cells, head, name: a?.querySelector('img')?.alt || '' };
    });
  });
  if (!rows.length) fs.writeFileSync('debug-wiki.html', await p.content());
  await p.close();

  const stats = new Map();
  const pages = [];
  for (const r of rows) {
    if (!r.href) continue;
    const slug = new URL(r.href).pathname.replace(/^\//, '').replace(/-value-cameraman-tower-defense$/, '');
    const name = slug.replace(/-/g, ' ');
    const idx = (re) => r.head.findIndex((h) => re.test(h));
    const cell = (re) => { const i = idx(re); return i >= 0 ? r.cells[i] : ''; };
    const first = r.cells[0] || '';
    const tier = (cell(/^tier/).match(/^[SABCD]\+?$/i) || [''])[0].toUpperCase();
    const capTxt = cell(/^cap/);
    const o = {
      wikiName: name,
      ...(tier && { tier }),
      ...(num(cell(/max dps/)) && { maxDps: num(cell(/max dps/)) }),
      ...(num(cell(/per 1k/)) && { dpsPer1k: num(cell(/per 1k/)) }),
      ...(num(cell(/to max/)) && { cashToMax: num(cell(/to max/)) }),
      ...(capTxt && { maxOnMap: /no cap/i.test(capTxt) ? 'No cap' : num(capTxt) }),
      ...(num(cell(/^exist/)) && { exist: num(cell(/^exist/)) }),
      role: (first.split('\n').pop() || '').replace(/^[^·]*·\s*/, '').trim(),
    };
    keys(name).forEach((k) => stats.set(k, o));
    pages.push({ href: r.href, o });
  }

  let sampled = false;
  const doPage = async (pg) => {
    try {
      const q = await openPage(b, pg.href);
      const d = await q.evaluate(() => {
        const tables = [...document.querySelectorAll('table')].map((t) =>
          [...t.querySelectorAll('tr')].map((r) => [...r.children].map((c) => c.innerText.trim())));
        const sec = (h) => { const e = [...document.querySelectorAll('h2')].find((x) => new RegExp(h, 'i').test(x.innerText)); if (!e) return ''; let s = '', n = e.nextElementSibling; while (n && n.tagName !== 'H2') { s += n.innerText + '\n'; n = n.nextElementSibling; } return s.trim(); };
        return { tables, text: document.body.innerText, html: document.documentElement.outerHTML, about: sec('^about'), how: sec('^how to get'), stats: sec('^stats') };
      });
      await q.close();
      // образец страницы для отладки селекторов (выкладывается артефактом workflow)
      if (!sampled) { sampled = true; fs.writeFileSync('debug-unit-sample.html', d.html); fs.writeFileSync('debug-unit-sample.txt', d.text); }
      Object.assign(pg.o, parseUnitPage(d, pg.o.role || ''));
    } catch (e) { console.warn('wiki skip', pg.href, e.message); }
  };
  // 4 страницы параллельно
  let next = 0;
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (next < pages.length) { const pg = pages[next++]; await doPage(pg); await sleep(150); }
  }));
  return stats;
}

/* ---------- Слияние и запись ---------- */
let old = { items: [], changelog: [] };
try { old = JSON.parse(fs.readFileSync(F, 'utf8')); } catch {}
old.items ||= [];
let hist = { version: 1, items: {} };
try { hist = JSON.parse(fs.readFileSync(FH, 'utf8')); } catch {}
hist.items ||= {};

const oldBy = {};
old.items.forEach((i) => keys(i.name).forEach((k) => { oldBy[k] = i; }));
const findBy = (map, name) => { for (const k of keys(name)) { const v = map.get ? map.get(k) : map[k]; if (v) return v; } return null; };

const b = await chromium.launch();
let live = [], total = 0, wiki = new Map();
try { ({ items: live, total } = await scrapeValues(b)); } catch (e) { console.error('values failed:', e.message); }
try { wiki = await scrapeWiki(b); } catch (e) { console.error('wiki failed:', e.message); }
await b.close();

const wikiUnits = new Set([...wiki.values()]).size;
console.log(`values: ${live.length}${total ? ' / ' + total : ''}, wiki units: ${wikiUnits}`);
if (live.length < 5) { console.error('Источник цен не отдал данные — prices.json не тронут'); process.exit(1); }
if (old.items.length > 20 && live.length < old.items.length * 0.7) { console.error(`Слишком мало юнитов: ${live.length} из ${old.items.length} — prices.json не тронут`); process.exit(1); }

const STAT_KEYS = ['tier', 'maxDps', 'dpsPer1k', 'cashToMax', 'maxOnMap', 'maxRange', 'exist', 'howToGet', 'description', 'about', 'added', 'update',
  'rarityRank', 'dropChance', 'levels', 'levelsType', 'levelsPct', 'role', 'market', 'priceHistory'];
const unmatched = [];
const items = live.map((i) => {
  const prev = findBy(oldBy, i.name) || {};
  const w = findBy(wiki, i.name) || {};
  const keep = Object.fromEntries(Object.entries(prev).filter(([k]) => STAT_KEYS.includes(k)));
  const { wikiName, ...ws } = w;
  if (!wikiName && wiki.size && !prev.tier && !prev.maxDps && i.kind === 'unit') unmatched.push(i.name);
  return { ...keep, ...ws, ...i, img: i.img || prev.img || '' };
});
if (unmatched.length) console.warn('Без статистики (имя не совпало с game.guide):', unmatched.join(', '));

// Место по редкости: если страница не дала — считаем по числу существующих копий (1 = самый редкий)
const byExist = items.filter((i) => i.kind === 'unit' && i.exist > 0).sort((a, c) => a.exist - c.exist);
byExist.forEach((i, n) => { if (!i.rarityRank) i.rarityRank = n + 1; });

const d = new Date().toISOString().slice(0, 10);

/* История Value: один снимок в день на предмет (повторный запуск за день — перезапись) */
let histNew = 0;
for (const i of items) {
  const arr = hist.items[i.name] || [];
  const last = arr[arr.length - 1];
  if (last && last[0] === d) { last[1] = i.value; last[2] = i.demand; }
  else if (i.value > 0 || arr.length) { arr.push([d, i.value, i.demand]); histNew++; }
  if (arr.length) hist.items[i.name] = arr.slice(-HIST_KEEP);
}
hist.updated = new Date().toISOString();

const changelog = [
  ...items.filter((i) => { const p = findBy(oldBy, i.name); return p && p.value !== i.value; })
    .map((i) => ({ name: i.name, old: findBy(oldBy, i.name).value, new: i.value, date: d })),
  ...(old.changelog || []),
].slice(0, 200);

fs.mkdirSync('data', { recursive: true });
fs.writeFileSync(F, JSON.stringify({
  updated: new Date().toISOString(), version: 5,
  sources: { values: live.length, valuesTotal: total, wiki: wikiUnits },
  items, changelog,
}, null, 1));
fs.writeFileSync(FH, JSON.stringify(hist));

const has = (k) => items.filter((i) => i[k] !== undefined).length;
console.log('items', items.length, '| zero-value', items.filter((i) => !i.value).length, '| with stats', items.filter((i) => i.maxDps || i.levels || i.tier).length);
console.log(`levels ${has('levels')} | market ${has('market')} | priceHistory ${has('priceHistory')} | about ${has('about')} | dropChance ${has('dropChance')} | history +${histNew}`);
const types = {};
items.forEach((i) => { if (i.levelsType) types[i.levelsType] = (types[i.levelsType] || 0) + 1; });
console.log('levelsType', JSON.stringify(types));
