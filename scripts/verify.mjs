#!/usr/bin/env node
/**
 * npm run verify — TillCount release gates (handoff §28). No release artifact from a red gate.
 *
 *   1 typecheck            6 prohibited TillCalc / Till Note naming
 *   2 lint                 7 prohibited network / analytics code
 *   3 Jest                 8 production billing-bypass guard
 *   4 locale parity        9 navigation / screen inventory (71)
 *   5 raw-key scan        10 legal required documents
 *                         11 Figma screen-coverage manifest (docs/FIGMA_SCREEN_AUDIT.md)
 *
 * Gates 4 and 5 also run inside Jest (localeKeyParity, localeQuality, screenWalk); here they
 * are checked statically as well so a failure names the exact key.
 */
import { execSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SRC = path.join(ROOT, 'src');
const results = [];

function gate(n, name, fn) {
  const started = Date.now();
  let ok = true; let detail = '';
  try { detail = fn() ?? ''; } catch (e) { ok = false; detail = e.message; }
  results.push({ n, name, ok, detail, ms: Date.now() - started });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${String(n).padStart(2)}  ${name}${detail ? ` — ${detail}` : ''}`);
}

function run(cmd, args) {
  const r = spawnSync(cmd, args, { cwd: ROOT, encoding: 'utf8', env: { ...process.env, TZ: 'UTC', CI: '1' }, maxBuffer: 1e8 });
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(' ')} failed\n${(r.stdout || '').slice(-4000)}\n${(r.stderr || '').slice(-4000)}`);
  return (r.stdout || '') + (r.stderr || '');
}

function files(dir, re = /\.(ts|tsx)$/, skipTests = true) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return skipTests && e.name === '__tests__' ? [] : files(p, re, skipTests);
    return re.test(e.name) ? [p] : [];
  });
}

const rel = p => path.relative(ROOT, p);
const LANGS = ['en', 'ar', 'tr', 'fr', 'es', 'de'];
const locales = Object.fromEntries(LANGS.map(l => [l, JSON.parse(fs.readFileSync(path.join(SRC, 'locales', `${l}.json`), 'utf8'))]));
const leaves = (o, p = '') => (o && typeof o === 'object' && !Array.isArray(o) ? Object.entries(o).flatMap(([k, v]) => leaves(v, p ? `${p}.${k}` : k)) : [[p, o]]);
const PLURAL = /_(zero|one|two|few|many|other)$/;
const baseKey = k => k.replace(PLURAL, '');

gate(1, 'typecheck', () => { run('npx', ['tsc', '--noEmit']); });
gate(2, 'lint', () => { run('npx', ['eslint', 'src/**/*.{ts,tsx}', '--max-warnings', '0']); });
gate(3, 'jest', () => {
  const out = run('npx', ['jest', '--ci', '--silent']);
  const m = out.match(/Tests:\s+(.*)/);
  const suites = out.match(/Test Suites:\s+(.*)/);
  if (/skipped|todo/.test(m?.[1] ?? '')) throw new Error(`skipped tests present: ${m?.[1]}`);
  return `${suites?.[1] ?? ''}; ${m?.[1] ?? ''}`;
});

gate(4, 'locale parity (6 languages, CLDR plural forms)', () => {
  const en = new Set(leaves(locales.en).map(([k]) => baseKey(k)));
  const problems = [];
  for (const l of LANGS.slice(1)) {
    const keys = new Set(leaves(locales[l]).map(([k]) => baseKey(k)));
    for (const k of en) if (!keys.has(k)) problems.push(`${l} missing ${k}`);
    for (const k of keys) if (!en.has(k)) problems.push(`${l} extra ${k}`);
  }
  if (problems.length) throw new Error(problems.slice(0, 20).join('; '));
  return `${en.size} keys × ${LANGS.length} languages`;
});

gate(5, 'raw-key scan (every t() key exists; no key text in UI)', () => {
  const en = locales.en;
  const has = k => {
    const parts = k.split('.');
    let cur = en;
    for (const p of parts.slice(0, -1)) { if (!cur || typeof cur !== 'object' || !(p in cur)) return false; cur = cur[p]; }
    const last = parts[parts.length - 1];
    return !!cur && (last in cur || `${last}_one` in cur || `${last}_other` in cur);
  };
  const missing = [];
  let count = 0;
  for (const f of files(SRC)) {
    const src = fs.readFileSync(f, 'utf8');
    for (const m of src.matchAll(/\bt\(\s*'([a-zA-Z][\w.-]*)'/g)) { count++; if (!has(m[1])) missing.push(`${rel(f)}: ${m[1]}`); }
  }
  if (missing.length) throw new Error(missing.slice(0, 20).join('; '));
  return `${count} static t() calls resolve; dynamic keys covered by screenWalk (6 languages × 71 screens)`;
});

gate(6, 'prohibited TillCalc / Till Note naming', () => {
  const hits = [];
  const allowed = /(ImportFromTillCalc|isTillCalcCsv|tillCalc|tillcalcCsv|TillCalc CSV|'TillCalc'|familyTransfer|FamilyApp|family\.app|import\.|donor|Till Note|Till-family|TillCalc donor|@ e7ea8ca)/;
  for (const f of [...files(SRC), path.join(ROOT, 'app.json'), path.join(ROOT, 'app.config.js'), path.join(ROOT, 'package.json'), path.join(ROOT, 'eas.json')]) {
    const lines = fs.readFileSync(f, 'utf8').split('\n');
    lines.forEach((line, i) => {
      // Comments may name the donor and the TillCalc import source; code and strings may not.
      const comment = /^\s*(\/\/|\*|\/\*)/.test(line);
      if (/tillcalc/i.test(line) && !comment && !allowed.test(line)) hits.push(`${rel(f)}:${i + 1}`);
      if (/com\.tillcalc|tillcalc:v1|TillCalc_Backup|BACKUP_FORMAT = 'tillcalc'/.test(line)) hits.push(`${rel(f)}:${i + 1} (donor identity)`);
    });
  }
  for (const l of LANGS) for (const [k, v] of leaves(locales[l])) {
    if (typeof v === 'string' && /Till ?Note/.test(v)) hits.push(`${l}:${k}`);
  }
  const app = JSON.parse(fs.readFileSync(path.join(ROOT, 'app.json'), 'utf8')).expo;
  if (app.name !== 'TillCount' || app.android.package !== 'com.tillcount.app') hits.push('app.json identity');
  if (hits.length) throw new Error(hits.slice(0, 20).join('; '));
});

gate(7, 'prohibited network / analytics code', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const deps = Object.keys(pkg.dependencies ?? {});
  const bannedDeps = deps.filter(d => /(analytics|firebase|sentry|amplitude|mixpanel|segment|bugsnag|datadog|appsflyer|adjust|branch|onesignal|axios|expo-updates|expo-notifications|expo-location|expo-contacts|react-native-webview|expo-tracking)/i.test(d));
  const hits = [];
  for (const f of files(SRC)) {
    const src = fs.readFileSync(f, 'utf8');
    if (/\bfetch\s*\(|XMLHttpRequest|new WebSocket|EventSource\(|navigator\.sendBeacon|axios/.test(src)) hits.push(rel(f));
    if (/from ['"]react-native-purchases['"]/.test(src) && !/src\/modules\/billing\//.test(f)) hits.push(`${rel(f)} (store SDK outside billing)`);
  }
  const app = JSON.parse(fs.readFileSync(path.join(ROOT, 'app.json'), 'utf8')).expo;
  const perms = app.android.permissions ?? [];
  const extraPerms = perms.filter(p => !['android.permission.CAMERA', 'android.permission.VIBRATE'].includes(p));
  if (bannedDeps.length) hits.push(`dependencies: ${bannedDeps.join(', ')}`);
  if (extraPerms.length) hits.push(`permissions: ${extraPerms.join(', ')}`);
  if (app.updates && app.updates.enabled !== false) hits.push('OTA updates enabled');
  if (hits.length) throw new Error(hits.join('; '));
  return 'only react-native-purchases (billing module) may reach the network; camera + vibrate permissions only';
});

gate(8, 'production billing-bypass guard', () => {
  const guard = path.join(ROOT, 'scripts', 'buildGuard.js');
  // Each case starts from a clean environment, whatever variant the calling shell is set to.
  const base = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^(APP_VARIANT|EXPO_PUBLIC_APP_VARIANT|EXPO_PUBLIC_BILLING_BYPASS|EXPO_PUBLIC_RC_[A-Z_]+|EAS_BUILD[A-Z_]*)$/.test(k)));
  const bad = spawnSync('node', [guard], { cwd: ROOT, env: { ...base, APP_VARIANT: 'production', EXPO_PUBLIC_BILLING_BYPASS: '1' }, encoding: 'utf8' });
  if (bad.status === 0) throw new Error('guard accepted a production build with the bypass');
  const unset = spawnSync('node', [guard], { cwd: ROOT, env: { ...base, APP_VARIANT: '', EXPO_PUBLIC_BILLING_BYPASS: '1' }, encoding: 'utf8' });
  if (unset.status === 0) throw new Error('guard accepted the bypass with no variant (defaults to production)');
  const review = spawnSync('node', [guard], { cwd: ROOT, env: { ...base, APP_VARIANT: 'review', EXPO_PUBLIC_APP_VARIANT: 'review', EXPO_PUBLIC_BILLING_BYPASS: '1', EXPO_PUBLIC_RC_ANDROID_KEY: 'goog_x' }, encoding: 'utf8' });
  if (review.status === 0) throw new Error('guard accepted a review build carrying a RevenueCat key');
  const prod = spawnSync('node', [guard], { cwd: ROOT, env: { ...base, APP_VARIANT: 'production', EXPO_PUBLIC_BILLING_BYPASS: '' }, encoding: 'utf8' });
  if (prod.status !== 0) throw new Error(`guard refused a clean production build: ${prod.stderr}`);
  const src = fs.readFileSync(path.join(SRC, 'modules', 'billing', 'bypass.ts'), 'utf8');
  if (!/isReviewVariant\(\)/.test(src) || !/!getRevenueCatApiKey\(\)/.test(src) || /__DEV__/.test(src)) throw new Error('runtime bypass rule weakened');
  const bypassUsers = files(SRC).filter(f => /EXPO_PUBLIC_BILLING_BYPASS/.test(fs.readFileSync(f, 'utf8'))).map(rel);
  if (bypassUsers.join() !== 'src/modules/billing/bypass.ts') throw new Error(`bypass read outside bypass.ts: ${bypassUsers.join(', ')}`);
  // Expo inlines only static `process.env.EXPO_PUBLIC_X` reads into a release bundle; a computed
  // read is always empty there (no store key, and the runtime bypass check would be vacuous).
  const dynamicEnv = files(SRC).filter(f => !/__tests__/.test(f) && /process\.env\s*\[/.test(fs.readFileSync(f, 'utf8'))).map(rel);
  if (dynamicEnv.length) throw new Error(`computed process.env read (not inlined in release): ${dynamicEnv.join(', ')}`);
  return 'production+bypass refused; review+RevenueCat key refused; one runtime rule; static env reads only';
});

gate(9, 'navigation / screen inventory (71 routes, 5 tabs)', () => {
  const reg = fs.readFileSync(path.join(SRC, 'navigation', 'screens.ts'), 'utf8');
  const rows = [...reg.matchAll(/\{ n: (\d+), name: '([^']+)', node: '([^']+)', route: '([A-Za-z]+)', component: ([A-Za-z]+) \}/g)];
  if (rows.length !== 71) throw new Error(`registry has ${rows.length} screens`);
  const routes = new Set(rows.map(r => r[4]));
  const nodes = new Set(rows.map(r => r[3]));
  if (routes.size !== 71 || nodes.size !== 71) throw new Error('duplicate route or node');
  const types = fs.readFileSync(path.join(SRC, 'navigation', 'types.ts'), 'utf8');
  const missing = [...routes].filter(r => !new RegExp(`\\b${r}:`).test(types));
  if (missing.length) throw new Error(`routes without params type: ${missing.join(', ')}`);
  const nav = fs.readFileSync(path.join(SRC, 'navigation', 'AppNavigator.tsx'), 'utf8');
  const tabs = [...nav.matchAll(/name: '(\w+Tab)'/g)].map(m => m[1]);
  if (tabs.join() !== 'HomeTab,CountTab,ProductsTab,ReorderTab,MoreTab') throw new Error(`tabs: ${tabs.join()}`);
  return '71 unique routes / nodes; 5 tabs';
});

gate(10, 'legal required documents', () => {
  const need = ['legal.privacy.heading', 'legal.terms.heading', 'legal.dataStorage.heading', 'legal.disclaimer.heading', 'licences.title', 'help.title', 'faq.title', 'about.tagline', 'support.guidance'];
  const flat = new Map(leaves(locales.en));
  const missing = need.filter(k => !flat.get(k));
  for (const [route] of [['Privacy'], ['Terms'], ['DataStorage'], ['Disclaimer'], ['Licences'], ['Help'], ['Questions'], ['About']]) {
    if (!fs.readFileSync(path.join(SRC, 'navigation', 'screens.ts'), 'utf8').includes(`route: '${route}'`)) missing.push(`screen ${route}`);
  }
  const must = { 'legal.disclaimer.p3': /not formal accounting valuation/, 'legal.disclaimer.p1': /does not automatically track/, 'legal.disclaimer.p2': /target quantity/, 'legal.privacy.p5': /camera/i };
  for (const [k, re] of Object.entries(must)) if (!re.test(String(flat.get(k)))) missing.push(`${k} wording`);
  const { OSS_COUNT } = { OSS_COUNT: Number((fs.readFileSync(path.join(SRC, 'modules', 'more', 'content', 'openSourceLicenses.ts'), 'utf8').match(/OSS_COUNT = (\d+)/) ?? [])[1]) };
  if (!(OSS_COUNT > 100)) missing.push('open-source licence inventory');
  if (missing.length) throw new Error(missing.join('; '));
  return `privacy, terms, data storage, disclaimer, licences (${OSS_COUNT} packages), help, FAQ, about`;
});

gate(11, 'Figma screen-coverage manifest', () => {
  const audit = fs.readFileSync(path.join(ROOT, 'docs', 'FIGMA_SCREEN_AUDIT.md'), 'utf8');
  const rows = audit.split('## The 12')[0].split('\n').filter(l => /^\|\s*\d+\s*\|/.test(l));
  if (rows.length !== 71) throw new Error(`audit has ${rows.length} rows`);
  const reg = fs.readFileSync(path.join(SRC, 'navigation', 'screens.ts'), 'utf8');
  const regRows = [...reg.matchAll(/\{ n: (\d+), name: '([^']+)', node: '([^']+)', route: '([A-Za-z]+)'/g)];
  const problems = [];
  for (const r of regRows) {
    const row = rows.find(x => new RegExp(`^\\|\\s*${r[1]}\\s*\\|`).test(x));
    if (!row) { problems.push(`#${r[1]} missing`); continue; }
    if (!row.includes(r[3])) problems.push(`#${r[1]} node ${r[3]}`);
    if (!row.includes(r[4])) problems.push(`#${r[1]} route ${r[4]}`);
    const result = row.split('|').map(c => c.trim())[8];
    if (!['PASS', 'PASS WITH DOCUMENTED NATIVE DIFFERENCE', 'FAIL'].includes(result)) problems.push(`#${r[1]} result "${result}"`);
    if (result === 'FAIL') problems.push(`#${r[1]} FAIL`);
  }
  if (problems.length) throw new Error(problems.slice(0, 15).join('; '));
  return '71 rows, every node and route matches the registry, no FAIL';
});

const failed = results.filter(r => !r.ok);
console.log(`\nverify: ${results.length - failed.length}/${results.length} gates green`);
fs.mkdirSync(path.join(ROOT, 'artifacts'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'artifacts', 'verify-report.json'), JSON.stringify({ at: new Date().toISOString(), commit: (() => { try { return execSync('git rev-parse HEAD', { cwd: ROOT }).toString().trim(); } catch { return null; } })(), results }, null, 2));
process.exit(failed.length ? 1 : 0);
