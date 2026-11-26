// scripts/market.mjs — CTD Trader «Рынок трейдов», бот v1
// Источник: https://cameraman-td.vaultedvaluesx.com/trade-ads (публичная страница, без входа).
// Работает ИНКРЕМЕНТАЛЬНО: каждые ~30 с открывает страницу (по умолчанию «Newest»), берёт новые объявления с ПЕРВОЙ страницы (20 штук).
// Подгрузка старых («Load older») идёт через /api/, закрытый в robots.txt, поэтому не используется; старые объявления задним числом не собираем.
// Пишет в ВЕТКУ `market` (рабочая копия в ./market-data, её готовит workflow market.yml), main не трогает.
// Не хранит ники, @handle, аватары и комментарии авторов. Только: id, юниты (номер+количество), суммы Value, метки.
// Файлы в market-data/:
//   names.json                     — реестр юнитов: индекс = номер юнита в записях, {n: имя с сайта, s: slug ссылки}
//   latest.json                    — свежие объявления (до LATEST_KEEP штук), новые сверху (то, что опрашивает приложение)
//   archive/ГГГГ-ММ-ДД/ЧЧ.json     — полный архив по часам (UTC), прошедший час больше не меняется
//   archive/index.json             — {days:{'ГГГГ-ММ-ДД':[часы]}}
//   meta.json                      — время последнего скана, сколько открытых объявлений на сайте, статистика
// Запись объявления: {i:id, t:firstSeen(unix сек), h:[[юнит,кол-во,метки?]], w:[...], hv:сумма_Has|null, wv:сумма_Wants|null, f:'oadu'}
//   метки: o=Offers u=Upgrade d=Downgrade a=Adds
//   n: описание автора (Note), если есть (до 300 символов); берётся из карточки списка /trade-ads, страницы /trade-ads/<id> бот не открывает (запрещено robots.txt)
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const env = process.env;
const URL_ADS = env.MARKET_URL || 'https://cameraman-td.vaultedvaluesx.com/trade-ads';
const DIR = env.MARKET_DIR || 'market-data';
const RUN_MIN = +env.MARKET_RUN_MIN || 265; // сколько минут крутится цикл внутри одного запуска
const INTERVAL_S = +env.MARKET_INTERVAL_S || 30; // пауза между сканами (первая страница = 20 объявлений, приток ~8/мин, запас большой)
const FLUSH_MIN = +env.MARKET_FLUSH_MIN || 2; // как часто коммитить и пушить
// «Load older» и сортировка ходят на /api/trade-ads, а /api/ закрыт в robots.txt сайта -> по умолчанию НЕ нажимаем (0).
// Бот читает только первую страницу (20 свежих объявлений, она приходит готовой в HTML). Значение >0 только для тестов на своей странице.
const MAX_CLICKS = +(env.MARKET_MAX_CLICKS ?? 0);
const INIT_ADS = +env.MARKET_INIT_ADS || 100; // на холодном старте берём только столько
const STOP_KNOWN = 3; // сколько подряд известных id считаем «дошли до старого»
const LATEST_KEEP = 2000;
const PUSH_GAP_S = +env.MARKET_PUSH_GAP_S || 40; // пуш сразу после скана с новыми объявлениями, но не чаще чем раз в столько секунд
const SQUASH_OVER = 400; // если коммитов в ветке больше — склеиваем историю в один коммит
const DRY = env.MARKET_DRY === '1'; // без git (для локальных тестов)
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36 CTDTrader/1.0';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const P = (...a) => path.join(DIR, ...a);
const readJson = (f, def) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return def; } };
const writeJson = (f, o) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(o)); };
const sh = (cmd, opt = {}) => execSync(cmd, { cwd: DIR, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8', ...opt });

/* ---------- robots.txt (User-agent: *, поддержка * и $, побеждает самое длинное правило, при равенстве Allow) ---------- */
function parseRobots(txt) {
  const rules = [];
  let applies = false;
  for (const raw of String(txt || '').split(/\r?\n/)) {
    const line = raw.replace(/#.*/, '').trim();
    const m = line.match(/^([a-z-]+)\s*:\s*(.*)$/i);
    if (!m) continue;
    const k = m[1].toLowerCase(), v = m[2].trim();
    if (k === 'user-agent') { applies = v === '*'; continue; }
    if (!applies || !v || (k !== 'allow' && k !== 'disallow')) continue;
    const re = new RegExp('^' + v.replace(/[.+?^{}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\$$/, '$'));
    rules.push({ allow: k === 'allow', len: v.length, re });
  }
  return rules;
}
function robotsAllows(rules, pathname) {
  let best = { len: -1, allow: true };
  for (const r of rules) if (r.re.test(pathname) && (r.len > best.len || (r.len === best.len && r.allow))) best = r;
  return best.allow;
}

/* ---------- разбор страницы (выполняется в браузере) ---------- */
function pageExtract() {
  const TAGS = { offers: 'o', upgrade: 'u', downgrade: 'd', adds: 'a' }; // «Offer» (кнопка) — не метка, только «Offers»
  const leaves = (el) => [...el.querySelectorAll('*')].filter((e) => e.childElementCount === 0).map((e) => (e.textContent || '').trim()).filter(Boolean);
  const tagOf = (t) => TAGS[String(t).trim().toLowerCase().replace(/:$/, '')];
  const pv = (s) => {
    s = String(s || '').trim();
    if (/^o\/c$/i.test(s)) return null;
    const m = s.replace(/,(?=\d{3}(?!\d))/g, '').match(/(\d+(?:\.\d+)?)\s*([kKmMbB])?/);
    if (!m) return null;
    return Math.round(+m[1] * ({ k: 1e3, m: 1e6, b: 1e9 }[(m[2] || '').toLowerCase()] || 1));
  };
  const IDRE = /\/trade-ads\/([0-9a-f]{12})(?:[/?#]|$)/i;
  const idOf = (a) => { const m = (a.href || '').match(IDRE); return m ? m[1].toLowerCase() : ''; };
  const adLinks = [...document.querySelectorAll('a[href*="/trade-ads/"]')].filter((a) => idOf(a));
  const cardIds = (el) => new Set([...el.querySelectorAll('a[href*="/trade-ads/"]')].map(idOf).filter(Boolean));
  const out = [], used = new Set();

  for (const a of adLinks) {
    const id = idOf(a);
    if (used.has(id)) continue;
    used.add(id);
    let card = a;
    while (card.parentElement && card.parentElement !== document.body) {
      const par = card.parentElement;
      if (cardIds(par).size > 1) break;
      card = par;
    }

    // метки «Has» / «Wants»: листовые элементы с таким текстом
    const labels = [...card.querySelectorAll('*')]
      .filter((e) => e.childElementCount === 0 && /^(has|wants)\s*:?$/i.test((e.textContent || '').trim()))
      .map((e) => ({ el: e, side: /^has/i.test(e.textContent.trim()) ? 'h' : 'w' }));
    const isLabel = (e) => labels.some((l) => l.el === e || e.contains(l.el));

    // блоки юнитов (по ссылкам /items/)
    const iLinks = [...card.querySelectorAll('a[href*="/items/"]')];
    const blocks = new Map();
    for (const l of iLinks) {
      const slug = (l.href.split('?')[0].split('/').pop() || '').toLowerCase();
      let b = l;
      while (b.parentElement && b.parentElement !== card) {
        const par = b.parentElement;
        const slugs = new Set([...par.querySelectorAll('a[href*="/items/"]')].map((x) => x.href.split('?')[0].split('/').pop()));
        if (slugs.size > 1 || isLabel(par)) break;
        b = par;
      }
      if (!blocks.has(b)) blocks.set(b, { el: b, slug, links: [] });
      blocks.get(b).links.push(l);
    }

    const units = [];
    for (const { el, slug, links } of blocks.values()) {
      const isQty = (t) => /^[x×]\s?\d+$/i.test(t) || /^\d+\s?[x×]$/i.test(t);
      const okName = (t) => t && !/artwork/i.test(t) && !isQty(t);
      let nameLines = links.flatMap((x) => { const lv = leaves(x); return lv.length ? lv : [(x.textContent || '').trim()]; }).filter(okName);
      if (!nameLines.length) nameLines = links.flatMap((x) => (x.innerText || x.textContent || '').split('\n').map((t) => t.trim())).filter(okName);
      let name = nameLines[0];
      if (!name) { const im = el.querySelector('img'); name = (im && im.alt || '').replace(/\s*artwork\s*$/i, '').trim(); }
      name = (name || '').replace(/\s*artwork\s*$/i, '').trim();
      // имя вроде «x3» / «S» — это бейдж количества или обрывок: ищем в блоке нормальный текст (с буквами, не метка/сумма/возраст)
      if (!name || isQty(name) || name.length <= 2) {
        const SKIP = /^(has|wants|offers?|upgrade|downgrade|adds|value|o\/c|nothing listed|just now|new trader)\b|artwork|ago$/i;
        const cand = leaves(el).map((t) => t.replace(/\s*artwork\s*$/i, '').trim()).filter((t) => t.length > 2 && /[a-z]{3}/i.test(t) && !isQty(t) && !SKIP.test(t) && !/^[\d.,]+\s*[kmb]?$/i.test(t));
        const links2 = links.map((x) => (x.getAttribute('title') || x.getAttribute('aria-label') || '').trim()).filter((t) => t.length > 2 && !isQty(t));
        const alt2 = [...el.querySelectorAll('img')].map((i) => (i.alt || '').replace(/\s*artwork\s*$/i, '').trim()).filter((t) => t.length > 2 && !isQty(t));
        const better = links2[0] || alt2[0] || cand[0];
        if (better) name = better;
      }
      const txt = (el.innerText || el.textContent || '');
      const lv = leaves(el);
      const rest = name ? txt.split(name).join(' ') : txt; // имя вроде «2x Money» / «x2 candy» не должно сойти за количество
      let q = 1;
      const qLeaf = lv.map((t) => t.match(/^[x×]\s?(\d+)$/i) || t.match(/^(\d+)\s?[x×]$/i)).find(Boolean);
      const qRe = rest.match(/(?:^|\s)[x×]\s?(\d+)\b/i) || rest.match(/[a-z)][x×](\d+)(?=Value|\s|$)/i);
      if (qLeaf) q = +qLeaf[1]; else if (qRe) q = +qRe[1];
      const vm = rest.match(/value\D{0,4}(o\/c|[\d][\d.,]*\s*[kKmMbB]?)/i);
      const tags = [...new Set([...lv, ...txt.split('\n')].map(tagOf).filter(Boolean))];
      // сторона: последняя метка, стоящая в документе до блока
      let side = '';
      for (const l of labels) if (l.el.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) side = l.side;
      units.push({ el, side, slug, name, q, v: vm ? pv(vm[1]) : null, tags, html: (isQty(name) || name.length <= 2) ? el.outerHTML.slice(0, 1500) : '' });
    }

    // суммы: текст между меткой стороны и первым её юнитом
    const total = {};
    labels.forEach((l, k) => {
      const mine = units.filter((u) => u.side === l.side && l.el.compareDocumentPosition(u.el) & Node.DOCUMENT_POSITION_FOLLOWING);
      const next = labels[k + 1];
      const r = document.createRange();
      r.setStartAfter(l.el);
      if (mine.length) r.setEndBefore(mine[0].el);
      else if (next) r.setEndBefore(next.el);
      else r.setEndAfter(card.lastChild || card);
      const t = r.toString();
      const m = t.match(/value\D{0,6}(o\/c|[\d][\d.,]*\s*[kKmMbB]?)/i) || (!mine.length ? null : t.match(/(o\/c|[\d][\d.,]*\s*[kKmMbB]?)/i));
      if (m && total[l.side] === undefined) total[l.side] = pv(m[1]);
    });
    const sum = (side) => { const us = units.filter((u) => u.side === side); return us.length && us.every((u) => u.v !== null) ? us.reduce((s, u) => s + u.v, 0) : null; };

    const cardText = card.innerText || card.textContent || '';
    let ageSec = null;
    const UNIT = { s: 1, sec: 1, second: 1, m: 60, min: 60, minute: 60, h: 3600, hr: 3600, hour: 3600, d: 86400, day: 86400, w: 604800, week: 604800, mo: 2592000, month: 2592000, y: 31536000, year: 31536000 };
    for (const ln of [...leaves(card).slice(0, 14), ...cardText.split('\n').slice(0, 10)]) {
      const t = ln.trim().toLowerCase();
      if (t === 'just now') { ageSec = 0; break; }
      const am = t.match(/^(\d{1,3})\s*([a-z]+?)s?\s+ago$/);
      if (am && UNIT[am[2]] !== undefined) { ageSec = +am[1] * UNIT[am[2]]; break; }
    }
    if (ageSec === null) { // запасной вариант: возраст мог слипнуться с ником, ищем в начале текста карточки
      const head = cardText.slice(0, 160).toLowerCase();
      const am = head.match(/(?:^|[^\d])(\d{1,2})\s*([a-z]+?)s?\s+ago/);
      if (/just now/.test(head)) ageSec = 0;
      else if (am && UNIT[am[2]] !== undefined) ageSec = +am[1] * UNIT[am[2]];
    }
    // описание автора (Note): строки между автозаголовком и меткой «Has». Шапка карточки: ник / возраст / «Offer» / заголовок / [описание]
    const note = (() => {
      const ls = cardText.split('\n').map((x) => x.trim());
      const hi = ls.findIndex((x) => /^has\s*:?$/i.test(x));
      if (hi < 0) return '';
      const oi = ls.findIndex((x, k) => k < hi && /^offer$/i.test(x));
      if (oi < 0) return '';
      return ls.slice(oi + 1, hi).filter(Boolean).slice(1).join(' ').slice(0, 300);
    })();
    const lineTags = [...leaves(card), ...cardText.split('\n')].map(tagOf).filter(Boolean);
    const allTags = [...new Set([...lineTags, ...units.flatMap((u) => u.tags)])];
    const pick = (side) => units.filter((u) => u.side === side).map((u) => ({ s: u.slug, n: u.name, q: u.q, t: u.tags, html: u.html }));

    out.push({
      id,
      has: pick('h'),
      wants: pick('w'),
      unsided: units.filter((u) => !u.side).length,
      hv: total.h !== undefined ? total.h : sum('h'),
      wv: total.w !== undefined ? total.w : sum('w'),
      f: allTags.sort().join(''),
      note,
      age: ageSec,
      raw: cardText.slice(0, 600),
    });
  }
  const open = (document.body.innerText.match(/([\d,]+)\s+open trade ads/i) || [])[1] || '';
  return { ads: out, open: +String(open).replace(/,/g, '') || 0 };
}

/* ---------- состояние ---------- */
fs.mkdirSync(DIR, { recursive: true });
const names = readJson(P('names.json'), []); // [{n, s}]
const bySlug = new Map(), byName = new Map();
names.forEach((u, i) => { if (u.s) bySlug.set(u.s, i); byName.set(norm(u.n), i); });
let namesDirty = false;
function unitNo(u) {
  let i = u.s ? bySlug.get(u.s) : undefined;
  if (i === undefined) i = byName.get(norm(u.n));
  if (i === undefined) {
    i = names.push({ n: u.n, s: u.s }) - 1;
    namesDirty = true;
    if (u.s) bySlug.set(u.s, i);
    byName.set(norm(u.n), i);
  } else {
    if (u.s && !names[i].s) { names[i].s = u.s; bySlug.set(u.s, i); namesDirty = true; }
    // самолечение: раньше записали «x3»/«S», а теперь имя нормальное — заменяем (индекс не меняется)
    const bad = (t) => /^[x×]?\s?\d+$/i.test(t || '') || String(t || '').length <= 2;
    if (bad(names[i].n) && u.n && !bad(u.n) && u.s && names[i].s === u.s) { names[i].n = u.n; byName.set(norm(u.n), i); namesDirty = true; }
  }
  return i;
}

let latest = readJson(P('latest.json'), []);
const known = new Set(latest.map((r) => r.i));
const archIndex = readJson(P('archive', 'index.json'), { days: {} });
const hourFile = (d) => { const iso = d.toISOString(); return { day: iso.slice(0, 10), hh: iso.slice(11, 13) }; };
const hourBuf = new Map(); // 'ГГГГ-ММ-ДД/ЧЧ' -> массив записей
function bufFor(day, hh) {
  const k = day + '/' + hh;
  if (!hourBuf.has(k)) {
    const arr = readJson(P('archive', day, hh + '.json'), []);
    arr.forEach((r) => known.add(r.i));
    hourBuf.set(k, arr);
  }
  return hourBuf.get(k);
}
{ const n = hourFile(new Date()); bufFor(n.day, n.hh); }

const meta = readJson(P('meta.json'), { started: new Date().toISOString(), scans: 0, added: 0 });
const stats = { scans: 0, added: 0, errors: 0, empty: 0, noHv: 0, noWv: 0, noUnits: 0, unsided: 0, gaps: 0 };

function toRecord(ad, t) {
  const pair = (u) => { const a = [unitNo(u), u.q]; if (u.t && u.t.length) a.push(u.t.sort().join('')); return a; };
  return { i: ad.id, t: ad.age !== null && ad.age !== undefined ? t - ad.age : t, h: ad.has.map(pair), w: ad.wants.map(pair), hv: ad.hv, wv: ad.wv, f: ad.f, ...(ad.note ? { n: ad.note } : {}) };
}

function save(openNow) {
  const now = new Date();
  for (const [k, arr] of hourBuf) {
    const [day, hh] = k.split('/');
    writeJson(P('archive', day, hh + '.json'), arr);
    const hs = (archIndex.days[day] = archIndex.days[day] || []);
    if (!hs.includes(hh)) { hs.push(hh); hs.sort(); }
  }
  // старые часы из памяти выбрасываем (оставляем текущий и предыдущий)
  const cur = hourFile(now), prev = hourFile(new Date(now - 3600e3));
  for (const k of [...hourBuf.keys()]) if (k !== cur.day + '/' + cur.hh && k !== prev.day + '/' + prev.hh) hourBuf.delete(k);
  writeJson(P('archive', 'index.json'), archIndex);
  writeJson(P('latest.json'), latest);
  if (namesDirty) { writeJson(P('names.json'), names); namesDirty = false; }
  meta.updated = now.toISOString();
  meta.open = openNow || meta.open || 0;
  meta.scans = (meta.scans || 0) + stats.scans; meta.added = (meta.added || 0) + stats.added;
  meta.last = { ...stats, at: now.toISOString() };
  writeJson(P('meta.json'), meta);
  stats.scans = 0; stats.added = 0;
}

function gitPush(msg) {
  if (DRY) return;
  try {
    sh('git add -A');
    try { sh('git diff --cached --quiet'); log('git: нет изменений'); return; } catch { /* есть изменения */ }
    sh(`git commit -q -m "${msg}"`);
    try { sh('git push -q origin HEAD:market'); log('git: push ok'); }
    catch (e) {
      log('git: push не удался, пробую pull --rebase:', String(e.stderr || e.message).slice(0, 200));
      sh('git pull -q --rebase origin market'); sh('git push -q origin HEAD:market'); log('git: push ok (после rebase)');
    }
  } catch (e) { log('git: ошибка', String(e.stderr || e.message).slice(0, 300)); }
}

function squashIfBig() {
  if (DRY) return;
  try {
    try { sh('git rev-parse --verify -q HEAD'); } catch { return; } // в новой пустой ветке коммитов ещё нет
    const n = +sh('git rev-list --count HEAD').trim();
    if (n <= SQUASH_OVER) return;
    sh('git checkout -q --orphan squash-tmp');
    sh('git add -A');
    sh(`git commit -q -m "snapshot ${new Date().toISOString().slice(0, 10)} (склеено ${n} коммитов)"`);
    sh('git push -q -f origin HEAD:market');
    log(`git: история склеена (${n} коммитов -> 1)`);
  } catch (e) { log('git squash: пропущено:', String(e.stderr || e.message).slice(0, 200)); }
}

/* ---------- основной цикл ---------- */
async function loadOlder(page) {
  const btn = page.locator('button, [role="button"], a').filter({ hasText: /load older trade ads/i }).first();
  if (!(await btn.isVisible().catch(() => false))) return false;
  await btn.scrollIntoViewIfNeeded().catch(() => {});
  await btn.click({ timeout: 5000 }).catch(() => {});
  return true;
}
const countAds = (page) => page.evaluate(() => new Set([...document.querySelectorAll('a[href*="/trade-ads/"]')].map((a) => (a.href.match(/\/trade-ads\/([0-9a-f]{12})/i) || [])[1]).filter(Boolean)).size);

let firstScan = true, failHtmlSaved = false;
async function scanOnce(page) {
  await page.goto(URL_ADS, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('a[href*="/trade-ads/"]', { timeout: 20000 }).catch(() => {});
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});

  let res = await page.evaluate(pageExtract);
  { // диагностика: HTML блоков, где имя юнита не удалось прочитать (x3, S ...)
    const seenB = new Set(), out = [];
    for (const a of res.ads) for (const u of [...a.has, ...a.wants]) if (u.html && !seenB.has(u.s)) { seenB.add(u.s); out.push(`### ${u.n} | ${u.s}\n${u.html}\n`); }
    if (out.length) fs.writeFileSync('debug-market-badnames.txt', out.slice(0, 8).join('\n'));
  }
  const cold = known.size === 0;
  for (let c = 0; c < MAX_CLICKS; c++) {
    const ids = res.ads.map((a) => a.id);
    let run = 0, hitKnown = false;
    for (const id of ids) { if (known.has(id)) { if (++run >= STOP_KNOWN) { hitKnown = true; break; } } else run = 0; }
    if (hitKnown) break;
    if (cold && ids.length >= INIT_ADS) break;
    const before = await countAds(page);
    if (!(await loadOlder(page))) break;
    let grew = false;
    for (let w = 0; w < 20; w++) { await sleep(400); if ((await countAds(page)) > before) { grew = true; break; } }
    if (!grew) break;
    await sleep(500 + Math.random() * 500);
    res = await page.evaluate(pageExtract);
  }

  if (known.size > 0 && res.ads.length >= 10 && res.ads.every((a) => !known.has(a.id))) {
    stats.gaps++;
    log(`ВНИМАНИЕ: все ${res.ads.length} объявлений на странице новые — возможно, часть пропущена между сканами`);
  }

  if (firstScan) {
    firstScan = false;
    const ctl = await page.evaluate(() => [...document.querySelectorAll('button,[role="button"],select,[role="tab"],[aria-selected]')].map((e) => (e.innerText || e.value || '').trim().replace(/\s+/g, ' ')).filter((t) => t && t.length < 40).slice(0, 40));
    const lines = [
      `url: ${URL_ADS}`, `объявлений в DOM: ${res.ads.length}, open на сайте: ${res.open}`, `кнопки/вкладки: ${JSON.stringify(ctl)}`, '',
      ...res.ads.slice(0, 5).map((a, i) => `--- объявление ${i + 1} ---\nRAW:\n${a.raw}\nПАРСИНГ:\n${JSON.stringify({ ...a, raw: undefined }, null, 1)}`),
    ];
    fs.writeFileSync('debug-market-sample.txt', lines.join('\n'));
    fs.writeFileSync('debug-market-first.html', (await page.content()).slice(0, 1_500_000));
  }

  if (!res.ads.length) {
    stats.empty++;
    if (!failHtmlSaved) { failHtmlSaved = true; fs.writeFileSync('debug-market-fail.html', (await page.content()).slice(0, 1_500_000)); }
    return { added: 0, open: res.open, total: 0 };
  }

  const nowD = new Date(), t = Math.floor(nowD.getTime() / 1000);
  const fresh = [];
  for (const ad of res.ads) {
    if (known.has(ad.id)) continue;
    if (!ad.has.length && !ad.wants.length) { stats.noUnits++; continue; }
    known.add(ad.id);
    if (ad.hv === null || ad.hv === undefined) stats.noHv++;
    if ((ad.wv === null || ad.wv === undefined) && ad.wants.length) stats.noWv++;
    stats.unsided += ad.unsided ? 1 : 0;
    fresh.push(toRecord(ad, t));
  }
  if (cold && fresh.length > INIT_ADS) fresh.length = INIT_ADS;
  if (fresh.length) {
    // на странице новые сверху; в архив кладём по порядку «старые → новые», в latest — новые сверху
    const { day, hh } = hourFile(nowD);
    bufFor(day, hh).push(...[...fresh].reverse());
    latest = [...fresh, ...latest].slice(0, LATEST_KEEP);
    stats.added += fresh.length;
  }
  return { added: fresh.length, open: res.open, total: res.ads.length };
}

async function main() {
  // начало: проверка robots.txt
  const b = await chromium.launch({ headless: true });
  const ctx = await b.newContext({ userAgent: UA, viewport: { width: 1100, height: 900 } });
  const page = await ctx.newPage();
  try {
    let rules = [];
    const u = new globalThis.URL(URL_ADS);
    if (env.MARKET_SKIP_ROBOTS !== '1') {
      let txt = '';
      try {
        const r = await ctx.request.get(u.origin + '/robots.txt', { timeout: 20000 });
        txt = r.ok() ? await r.text() : '';
        fs.writeFileSync('debug-market-robots.txt', `status ${r.status()}\n${txt}`);
      } catch (e) { fs.writeFileSync('debug-market-robots.txt', 'не удалось получить: ' + e.message); }
      rules = parseRobots(txt);
      if (!robotsAllows(rules, u.pathname)) { console.error('robots.txt запрещает', u.pathname, '— бот остановлен, ничего не делаем.'); process.exitCode = 3; return; }
      log(`robots.txt: ${u.pathname} можно (правил для *: ${rules.length})`);
    }
    // Все запросы браузера на этом сайте тоже проверяем по robots.txt: запрещённое (например /api/ кроме media, /trade-ads/<id>) не отправляем.
    // Картинки, шрифты и медиа не грузим вообще (боту они не нужны, меньше нагрузка на сайт).
    const reqLog = [], blocked = new Set();
    await page.route('**/*', (route) => {
      const rq = route.request(), rt = rq.resourceType();
      let pu; try { pu = new globalThis.URL(rq.url()); } catch { return route.continue(); }
      if (rt === 'image' || rt === 'font' || rt === 'media') return route.abort();
      if (pu.origin === u.origin && rules.length && !robotsAllows(rules, pu.pathname)) {
        const k = `${rq.method()} ${pu.pathname}`;
        if (!blocked.has(k) && blocked.size < 100) { blocked.add(k); fs.writeFileSync('debug-market-blocked.txt', [...blocked].join('\n')); }
        return route.abort();
      }
      if (pu.origin === u.origin && reqLog.length < 300 && rt !== 'script' && rt !== 'stylesheet') {
        reqLog.push(`${rq.method()} ${rt} ${pu.pathname}${rq.headers()['next-action'] ? ' [server action]' : ''}`);
        if (reqLog.length % 20 === 1) fs.writeFileSync('debug-market-requests.txt', reqLog.join('\n'));
      }
      return route.continue();
    });
    squashIfBig();

    const stopAt = Date.now() + RUN_MIN * 60e3;
    let nextFlush = Date.now() + FLUSH_MIN * 60e3, lastPush = Date.now(), fails = 0, lastOpen = 0, lastAdded = 0;
    const finish = (why) => { log('финиш:', why); try { fs.writeFileSync('debug-market-requests.txt', reqLog.join('\n')); } catch {} try { save(lastOpen); gitPush(`market ${new Date().toISOString().slice(0, 16)}Z (final)`); } catch (e) { log('ошибка финиша', e.message); } };
    for (const sig of ['SIGTERM', 'SIGINT']) process.on(sig, () => { finish(sig); process.exit(0); }); // Cancel в GitHub шлёт SIGINT, потом SIGTERM

    while (Date.now() < stopAt) {
      const t0 = Date.now();
      try {
        const r = await scanOnce(page);
        lastOpen = r.open || lastOpen; lastAdded = r.added;
        stats.scans++;
        if (r.total === 0) fails++; else fails = 0;
        log(`скан: в DOM ${r.total}, новых ${r.added}, открыто на сайте ${r.open || '?'}, всего в latest ${latest.length}` + (stats.noHv ? `, без Has-суммы ${stats.noHv}` : '') + (stats.unsided ? `, без стороны ${stats.unsided}` : ''));
        if (r.added) save(lastOpen);
      } catch (e) { fails++; stats.errors++; log('ошибка скана:', e.message.split('\n')[0]); }

      // пуш: по таймеру FLUSH_MIN ИЛИ сразу, если в этом скане были новые объявления (не чаще PUSH_GAP_S). Раньше пуш ждал следующего скана после таймера: выходило ~84 с вместо 60
      if (Date.now() >= nextFlush || (lastAdded > 0 && Date.now() - lastPush >= PUSH_GAP_S * 1000)) { save(lastOpen); gitPush(`market ${new Date().toISOString().slice(0, 16)}Z`); lastPush = Date.now(); nextFlush = lastPush + FLUSH_MIN * 60e3; }
      if (fails >= 3 && fails % 3 === 0 && fs.existsSync('debug-market-fail.html')) log(`${fails} пустых/ошибочных сканов подряд — увеличиваю паузу (обход защиты не делаем)`);
      const backoff = Math.min(600, fails * 60);
      const busy = lastAdded >= 10 ? 0.67 : 1; // много новых за скан -> чуть чаще, но не быстрее ~20 с
      const wait = Math.max(15, INTERVAL_S * busy * (0.8 + Math.random() * 0.4) - (Date.now() - t0) / 1000) + backoff;
      await sleep(Math.min(wait * 1000, Math.max(0, stopAt - Date.now())));
    }
    finish('время цикла вышло');
  } finally {
    await b.close().catch(() => {});
  }
}

await main();
