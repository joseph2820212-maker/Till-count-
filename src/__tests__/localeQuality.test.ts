import fs from 'fs';
import path from 'path';

/**
 * i18n guards (handoff §15): placeholder integrity, no encoding corruption, button
 * labels short enough for a full-width button at the 0.75 minimum font scale, and no
 * leftover TillCalc / Till Note product wording.
 */
const LOCALES = ['en', 'ar', 'tr', 'fr', 'es', 'de'];
const dir = path.join(__dirname, '../locales');
const bundles: Record<string, unknown> = Object.fromEntries(LOCALES.map(l => [l, JSON.parse(fs.readFileSync(path.join(dir, `${l}.json`), 'utf8'))]));

function flatten(obj: unknown, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string') out[key] = v;
    else if (v && typeof v === 'object' && !Array.isArray(v)) Object.assign(out, flatten(v, key));
  }
  return out;
}
const flat = Object.fromEntries(LOCALES.map(l => [l, flatten(bundles[l])]));
const base = (k: string) => k.replace(/_(zero|one|two|few|many|other)$/, '');
const placeholders = (s: string) => [...s.matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map(m => m[1]).sort();

const BUTTON_KEYS = ['common.cancel', 'common.continue', 'common.delete', 'common.done', 'home.startCount', 'count.finish', 'count.resume', 'count.pause',
  'products.add', 'products.save', 'products.saveChanges', 'import.chooseFile', 'import.reviewRows', 'backup.create', 'backup.share', 'restore.restore',
  'export.sharePdf', 'export.exportCsv', 'reorder.share', 'settings.save', 'pro.upgrade', 'pro.restore', 'states.discard.keep', 'states.discard.discard',
  'states.freeLimit.upgrade', 'states.freeLimit.notNow', 'states.cameraDenied.openSettings', 'states.cameraDenied.typeCode', 'states.wrongPassword.tryAgain',
  'states.wrongPassword.chooseFile', 'onboarding.getStarted', 'onboarding.trySample', 'permission.allow', 'permission.typeInstead', 'nav.home', 'nav.count',
  'nav.products', 'nav.reorder', 'nav.more', 'unknown.addIt', 'unknown.scanAnother', 'unknown.typeCode', 'create.save', 'target.save'];

describe('locale quality', () => {
  it('every {{placeholder}} in an English string exists in each translation of that key', () => {
    const problems: string[] = [];
    for (const l of LOCALES.slice(1)) {
      for (const [k, v] of Object.entries(flat[l])) {
        const enVal = flat.en[k] ?? flat.en[`${base(k)}_other`] ?? flat.en[base(k)];
        if (enVal === undefined) continue;
        const want = placeholders(enVal).filter(p => p !== 'count' || placeholders(v).includes('count'));
        const have = placeholders(v);
        for (const p of want) if (!have.includes(p)) problems.push(`${l}:${k} missing {{${p}}}`);
        for (const p of have) if (!placeholders(enVal).includes(p)) problems.push(`${l}:${k} unknown {{${p}}}`);
      }
    }
    expect(problems).toEqual([]);
  });
  it('no encoding corruption (replacement characters, mojibake, "?" in place of letters)', () => {
    const bad: string[] = [];
    for (const l of LOCALES) for (const [k, v] of Object.entries(flat[l])) {
      if (/�|Ã.|â€/.test(v)) bad.push(`${l}:${k}`);
      if (l === 'ar' && /[A-Za-z]{2,}\?[A-Za-z]/.test(v)) bad.push(`${l}:${k}`);
    }
    expect(bad).toEqual([]);
  });
  it('button and tab labels fit a full-width button in every language', () => {
    const tooLong: string[] = [];
    for (const l of LOCALES) for (const k of BUTTON_KEYS) {
      const v = flat[l][k];
      expect({ l, k, defined: v !== undefined }).toEqual({ l, k, defined: true });
      if (v.length > 34) tooLong.push(`${l}:${k} (${v.length}) ${v}`);
    }
    expect(tooLong).toEqual([]);
  });
  it('no inherited TillCalc / Till Note product wording (other than the Till-family import features)', () => {
    const leaks: string[] = [];
    for (const l of LOCALES) for (const [k, v] of Object.entries(flat[l])) {
      if (/Till Note|TillNote/.test(v)) leaks.push(`${l}:${k}`);
      if (/TillCalc/.test(v) && !/^(import|family|screens\.ImportFromTillCalc|faq\.transfer|help\.import|legal)/.test(k)) leaks.push(`${l}:${k}`);
    }
    expect(leaks).toEqual([]);
  });
  it('truthful stock wording: never "live stock" as a claim', () => {
    for (const l of ['en']) for (const [k, v] of Object.entries(flat[l])) {
      if (/live stock/i.test(v)) expect(k).toBe('faq.live.q');
    }
  });
});
