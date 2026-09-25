import en from '../locales/en.json';
import ar from '../locales/ar.json';
import de from '../locales/de.json';
import es from '../locales/es.json';
import fr from '../locales/fr.json';
import tr from '../locales/tr.json';

/**
 * Every locale carries the English key set (handoff §15 key parity). Plural keys are
 * compared by their base name, and each language must supply every CLDR plural category
 * it uses (Arabic: zero/one/two/few/many/other; French & Spanish add many).
 */
const LOCALES: Record<string, unknown> = { ar, de, es, fr, tr };
const PLURAL = /_(zero|one|two|few|many|other)$/;

function leaves(obj: unknown, prefix = ''): [string, unknown][] {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) return [[prefix, obj]];
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) => leaves(v, prefix ? `${prefix}.${k}` : k));
}
const base = (k: string) => k.replace(PLURAL, '');
const enKeys = new Set(leaves(en).map(([k]) => base(k)));
const enPlurals = new Set(leaves(en).map(([k]) => k).filter(k => PLURAL.test(k)).map(base));

describe('locale key parity with en.json', () => {
  it('en.json has keys', () => { expect(enKeys.size).toBeGreaterThan(600); });

  for (const [lang, bundle] of Object.entries(LOCALES)) {
    const all = leaves(bundle);
    it(`${lang}.json has exactly the en.json key set`, () => {
      const keys = new Set(all.map(([k]) => base(k)));
      expect({ missing: [...enKeys].filter(k => !keys.has(k)), extra: [...keys].filter(k => !enKeys.has(k)) }).toEqual({ missing: [], extra: [] });
    });
    it(`${lang}.json supplies every plural category the language needs`, () => {
      const categories = new Intl.PluralRules(lang).resolvedOptions().pluralCategories;
      const have = new Set(all.map(([k]) => k));
      const missing: string[] = [];
      for (const k of enPlurals) for (const c of categories) if (!have.has(`${k}_${c}`)) missing.push(`${k}_${c}`);
      expect(missing).toEqual([]);
    });
    it(`${lang}.json has no empty strings and no untranslated copies of long English text`, () => {
      const empties = all.filter(([, v]) => typeof v === 'string' && v.trim() === '').map(([k]) => k);
      expect(empties).toEqual([]);
      const enMap = new Map(leaves(en).map(([k, v]) => [k, v]));
      const copied = all.filter(([k, v]) => typeof v === 'string' && v.length > 40 && enMap.get(k) === v && !k.startsWith('legal.companyNote')).map(([k]) => k);
      expect(copied).toEqual([]);
    });
  }
});
