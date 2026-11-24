// scripts/scrape.mjs — CTD Trader v4
// Источник 1: vaultedvaluesx  — цена, спрос, стабильность, картинка (все юниты, через "Load more")
// Источник 2: game.guide      — Tier, DPS, cash to max, cap, exist + таблица уровней каждого юнита
// Если источник упал — берём его данные из прошлого prices.json, а не затираем.
import { chromium } from 'playwright';
import fs from 'fs';

const LIST = 'https://cameraman-td.vaultedvaluesx.com/value-list';
const UNITS = 'https://www.game.guide/cameraman-tower-defense/units';
const F = 'data/prices.json';
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36';
const STAB = ['Dropping', 'Unwanted', 'Underpaid', 'Unstable', 'Overpaid', 'Rising', 'Stable'];
const CATS = ['Gamepasses', 'Gamepass', 'Crates', 'Crate', 'Godly', 'Mythic', 'Exclusive', 'Legendary', 'Epic', 'Rare', 'Uncommon', 'Common', 'Signed'];

// старые названия на vaultedvaluesx -> названия на game.guide
const ALIAS = {
  videotapertitan: 'upgradedvideotapperprototype',
  prototypeduo: 'prototypesduo',
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
// ключ без учёта порядка слов: "CinemaMan Titan" == "Titan Cinemaman", "Spider Tv" == "TV Spider"
const tkey = (s) => String(s || '').toLowerCase().replace(/camera\s+man/g, 'cameraman').split(/[^a-z0-9]+/).filter(Boolean).sort().join('');
const keys = (name) => [norm(name), ALIAS[norm(name)], tkey(name)].filter(Boolean);

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
  await p.waitForSelector('a[href*="/items/"]', { timeout: 60000 }).catch(() => {});

  // сколько всего предметов заявлено на странице ("78 tracked items")
  const total = await p.evaluate(() => +((document.body.innerText.match(/(\d+)\s+tracked items/i) || [])[1] || 0));

  const count = () => p.evaluate(() => new Set([...document.querySelectorAll('a[href*="/items/"]')].map((a) => a.href.split('?')[0])).size);
  let prev = -1, stuck = 0;
  for (let i = 0; i < 80; i++) {
    const btn = p.getByRole('button', { name: /load more/i });
    if (!(await btn.count()) || !(await btn.first().isVisible())) break;
    await btn.first().scrollIntoViewIfNeeded().catch(() => {});
    await btn.first().click().catch(() => {});
    await p.waitForTimeout(1500);
    const n = await count();
    if (n === prev) { if (++stuck >= 3) break; } else stuck = 0;
    prev = n;
    if (total && n >= total) break;
  }

  const raw = await p.evaluate(() => {
    const out = [], used = new Set();
    document.querySelectorAll('a[href*="/items/"]').forEach((a) => {
      const id = a.href.split('?')[0];
      if (used.has(id)) return;
      // поднимаемся до карточки: в ней есть Value и Demand и только одна ссылка на предмет
      let e = a;
      while (e && !(/demand/i.test(e.innerText) && /value/i.test(e.innerText))) e = e.parentElement;
      if (!e || new Set([...e.querySelectorAll('a[href*="/items/"]')].map((x) => x.href.split('?')[0])).size !== 1) return;
      used.add(id);
      const nm = [...e.querySelectorAll('a[href*="/items/"]')].map((x) => x.innerText.trim()).find((t) => t && !/artwork/i.test(t));
      const im = e.querySelector('img');
      out.push({ t: e.innerText.trim(), name: nm, img: im?.currentSrc || im?.src || '' });
    });
    return out;
  });

  const seen = new Map();
  for (const r of raw) {
    const L = r.t.split('\n').map((s) => s.trim()).filter(Boolean);
    const name = r.name || L[0];
    if (!name || seen.has(name)) continue;
    const stability = STAB.find((s) => new RegExp(s, 'i').test(r.t)) || 'Stable';
    const category = CATS.find((c) => new RegExp('\\b' + c + '\\b', 'i').test(r.t)) || 'Other';
    // значение: строка после "Value"; спрос: после "Demand"
    const after = (label) => { const i = L.findIndex((l) => new RegExp('^' + label + '$', 'i').test(l)); return i >= 0 ? L[i + 1] : ''; };
    const value = Math.round(num(after('value')));
    const demand = dem((after('demand') || '').split('/')[0]);
    seen.set(name, { name, category, value, demand, stability, img: r.img });
  }
  if (total && seen.size < total) console.warn(`values: на странице заявлено ${total}, собрано ${seen.size}`);
  if (!seen.size) fs.writeFileSync('debug-values.html', await p.content());
  await p.close();
  return { items: [...seen.values()], total };
}

/* ---------- Источник 2: боевая статистика (game.guide) ---------- */
// таблица уровней: строки "Lv N" чередуются со строками "+ TV: ..." (доп. атаки) — их приклеиваем к предыдущему уровню
function parseLevels(tables) {
  for (const t of tables) {
    if (t.length < 2) continue;
    const head = t[0].map((h) => h.toLowerCase());
    const col = (re) => head.findIndex((h) => re.test(h));
    const iL = col(/^(level|lv)/), iC = col(/^(cost|price)/), iD = col(/^dam/), iCd = col(/^cool/), iR = col(/^range/), iP = col(/^dps/);
    if (iL < 0 || (iC < 0 && iD < 0)) continue;
    const out = [];
    for (const r of t.slice(1)) {
      const first = (r[0] || '').trim();
      if (!first) continue;
      if (r.length === 1 || /^\+/.test(first)) { if (out.length) out[out.length - 1].extra = ((out[out.length - 1].extra || '') + ' ' + first.replace(/\n/g, ' ')).trim(); continue; }
      const row = { level: first };
      if (iC >= 0) row.cost = num(r[iC]);
      if (iD >= 0) row.damage = num(r[iD]);
      if (iCd >= 0) row.cooldown = num(r[iCd]);
      if (iR >= 0) row.range = num(r[iR]);
      if (iP >= 0) row.dps = num(r[iP]);
      out.push(row);
    }
    if (out.length) return out;
  }
  return [];
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
    // имя берём из slug ссылки: upgraded-titan-tv-man-value-cameraman-tower-defense
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
      role: (first.split('\n').pop() || '').replace(/^[^·]*·\s*/, '').trim(), // "Damage · AOE"
    };
    keys(name).forEach((k) => stats.set(k, o));
    pages.push({ href: r.href, o });
  }

  // страницы юнитов: таблица уровней, range, как получить, описание
  for (const pg of pages) {
    try {
      const q = await openPage(b, pg.href);
      const d = await q.evaluate(() => {
        const tables = [...document.querySelectorAll('table')].map((t) =>
          [...t.querySelectorAll('tr')].map((r) => [...r.children].map((c) => c.innerText.trim())));
        const text = document.body.innerText;
        const sec = (h) => { const e = [...document.querySelectorAll('h2')].find((x) => new RegExp(h, 'i').test(x.innerText)); if (!e) return ''; let s = '', n = e.nextElementSibling; while (n && n.tagName !== 'H2') { s += n.innerText + '\n'; n = n.nextElementSibling; } return s.trim(); };
        return { tables, text, about: sec('^about'), how: sec('^how to get'), stats: sec('^stats') };
      });
      await q.close();
      const lv = parseLevels(d.tables);
      if (lv.length) pg.o.levels = lv;
      const rg = d.text.match(/Range at max level\s*([\d.,]+)/i);
      if (rg) pg.o.maxRange = num(rg[1]);
      const how = d.how.split('\n').map((s) => s.trim()).filter(Boolean)[0];
      if (how) pg.o.howToGet = how.slice(0, 160);
      const ab = d.stats.split('\n').map((s) => s.trim()).find((s) => s.length > 40) || d.about.split('\n').find((s) => s.length > 40);
      if (ab) pg.o.description = ab.slice(0, 300);
    } catch (e) { console.warn('wiki skip', pg.href, e.message); }
    await sleep(300);
  }
  return stats;
}

/* ---------- Слияние и запись ---------- */
let old = { items: [], changelog: [] };
try { old = JSON.parse(fs.readFileSync(F, 'utf8')); } catch {}
old.items ||= [];
const oldBy = {};
old.items.forEach((i) => keys(i.name).forEach((k) => { oldBy[k] = i; }));
const findBy = (map, name) => { for (const k of keys(name)) if (map[k] || (map.get && map.get(k))) return map.get ? map.get(k) : map[k]; return null; };

const b = await chromium.launch();
let live = [], total = 0, wiki = new Map();
try { ({ items: live, total } = await scrapeValues(b)); } catch (e) { console.error('values failed:', e.message); }
try { wiki = await scrapeWiki(b); } catch (e) { console.error('wiki failed:', e.message); }
await b.close();

const wikiUnits = new Set([...wiki.values()]).size;
console.log(`values: ${live.length}${total ? ' / ' + total : ''}, wiki units: ${wikiUnits}`);
if (live.length < 5) { console.error('Источник цен не отдал данные — prices.json не тронут'); process.exit(1); }
if (old.items.length > 20 && live.length < old.items.length * 0.7) { console.error(`Слишком мало юнитов: ${live.length} из ${old.items.length} — prices.json не тронут`); process.exit(1); }

const STAT_KEYS = ['tier', 'maxDps', 'dpsPer1k', 'cashToMax', 'maxOnMap', 'maxRange', 'exist', 'howToGet', 'description', 'levels', 'role'];
const unmatched = [];
const items = live.map((i) => {
  const prev = findBy(oldBy, i.name) || {};
  const w = findBy(wiki, i.name) || {};
  const keep = Object.fromEntries(Object.entries(prev).filter(([k]) => STAT_KEYS.includes(k)));
  const { wikiName, ...ws } = w;
  if (!wikiName && wiki.size && !prev.tier && !prev.maxDps && /^(Godly|Mythic|Exclusive|Legendary|Epic|Rare|Uncommon|Common)$/.test(i.category)) unmatched.push(i.name);
  return { ...keep, ...ws, ...i, img: i.img || prev.img || '' };
});
if (unmatched.length) console.warn('Без статистики (имя не совпало с game.guide):', unmatched.join(', '));

const d = new Date().toISOString().slice(0, 10);
const changelog = [
  ...items.filter((i) => { const p = findBy(oldBy, i.name); return p && p.value !== i.value; })
    .map((i) => ({ name: i.name, old: findBy(oldBy, i.name).value, new: i.value, date: d })),
  ...(old.changelog || []),
].slice(0, 200);

fs.mkdirSync('data', { recursive: true });
fs.writeFileSync(F, JSON.stringify({
  updated: new Date().toISOString(), version: 4,
  sources: { values: live.length, valuesTotal: total, wiki: wikiUnits },
  items, changelog,
}, null, 1));
console.log('items', items.length, '| with stats', items.filter((i) => i.maxDps || i.levels || i.tier).length);
