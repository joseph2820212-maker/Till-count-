/**
 * Captures web-rendered screenshots of every Figma screen through the harness.
 *   npx expo export -p web --output-dir dist-web && node tools/screenshots/capture.mjs [langs] [routes]
 * Output: artifacts/screenshots/<lang>/<NN>-<Route>.png (390×844 CSS px, 2× DPR).
 * These are react-native-web renders — evidence of layout, copy and RTL, not device pixels.
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const DIST = path.join(ROOT, 'dist-web');
const langs = (process.argv[2] || 'en,ar').split(',');
const only = process.argv[3] ? new Set(process.argv[3].split(',')) : null; // '-' = states only
const reg = fs.readFileSync(path.join(ROOT, 'src', 'navigation', 'screens.ts'), 'utf8');
const screens = [...reg.matchAll(/\{ n: (\d+), name: '([^']+)', node: '([^']+)', route: '([A-Za-z]+)'/g)].map(m => ({ n: Number(m[1]), route: m[4] }))
  .filter(s => !only || only.has(s.route));
// The 12 Figma state cards, reproduced through the real screens (steps use testIDs).
const STATES = [
  // 01 camera-denied is native-only: expo-camera's web build always reports "can ask again".
  // It is proven by the screen-walk test instead.
  { name: '02-free-limit-reached', route: 'Products', state: 'atCap', steps: [{ click: 'products-add' }] },
  { name: '03-products-empty', route: 'Products', state: 'empty' },
  { name: '04-count-history-empty', route: 'CountHistory', state: 'empty' },
  { name: '05-reorder-empty', route: 'Reorder', state: 'empty' },
  { name: '06-search-no-results', route: 'Products', steps: [{ fill: ['products-search', 'zzz no match'] }] },
  { name: '07-delete-product-confirmation', route: 'ProductDetail', steps: [{ click: 'product-menu' }, { click: 'product-delete' }] },
  { name: '08-discard-current-count-confirmation', route: 'StartCount', state: 'openCount' },
  { name: '09-wrong-backup-password', route: 'RestorePassword', state: 'realBackup', steps: [{ fill: ['restore-pass', 'not the password'] }, { click: 'restore-unlock' }, { waitFor: 'state-wrong-password' }] },
  { name: '10-import-problem', route: 'ImportReview', state: 'importFail', steps: [{ click: 'review-import' }, { waitFor: 'state-import-problem' }] },
  { name: '11-export-problem', route: 'CsvPreview', steps: [{ click: 'csv-export' }, { waitFor: 'state-export-problem' }] },
  { name: '12-restore-confirmation', route: 'RestorePreview', steps: [{ click: 'restore-confirm-open' }] },
];
const extra = process.env.WITH_STATES ? STATES : [];

const types = { '.html': 'text/html', '.js': 'application/javascript', '.ttf': 'font/ttf', '.png': 'image/png', '.json': 'application/json', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let f = path.join(DIST, p);
  if (!f.startsWith(DIST) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(DIST, 'index.html');
  res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
await new Promise(r => server.listen(0, r));
const port = server.address().port;
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--deny-permission-prompts'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const problems = [];
const jobs = [];
for (const lang of langs) {
  for (const s of screens) jobs.push({ lang, route: s.route, file: `${String(s.n).padStart(2, '0')}-${s.route}.png` });
  for (const x of extra) jobs.push({ lang, route: x.route, state: x.state, steps: x.steps, file: `states/${x.name}.png` });
}
for (const j of jobs) {
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => { if (!/jsQR|jsqr/.test(String(e))) errors.push(String(e)); }); // expo-camera's web-only QR worker (CDN) is irrelevant to Android
  await page.goto(`http://localhost:${port}/?screen=${j.route}&lang=${j.lang}${j.state ? `&state=${j.state}` : ''}`);
  try {
    await page.waitForFunction(() => window.__harnessReady === true, null, { timeout: 20000 });
  } catch { errors.push('not ready'); }
  await page.waitForTimeout(400);
  for (const st of j.steps ?? []) {
    try {
      if (st.click) await page.click(`[data-testid="${st.click}"]`, { timeout: 5000 });
      if (st.fill) await page.fill(`[data-testid="${st.fill[0]}"]`, st.fill[1], { timeout: 5000 });
      if (st.wait) await page.waitForTimeout(st.wait);
      if (st.waitFor) await page.waitForSelector(`[data-testid="${st.waitFor}"]`, { timeout: 30000 });
      await page.waitForTimeout(300);
    } catch (e) { errors.push(`step ${JSON.stringify(st)}: ${String(e).split('\n')[0]}`); }
  }
  const text = await page.evaluate(() => document.body.innerText);
  if (/\bundefined\b|\bNaN\b/.test(text)) errors.push('undefined/NaN text');
  const out = path.join(ROOT, 'artifacts', 'screenshots', j.lang, j.file);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await page.screenshot({ path: out });
  if (errors.length) problems.push(`${j.lang}/${j.file}: ${errors.join(' | ').slice(0, 300)}`);
  await page.close();
}
await browser.close();
server.close();
console.log(`captured ${jobs.length} screenshots`);
if (problems.length) { console.log(problems.join('\n')); process.exitCode = 1; }
