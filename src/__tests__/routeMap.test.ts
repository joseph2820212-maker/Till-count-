/**
 * Route map (handoff §20): every one of the 71 screens is reachable from the tab roots
 * (or onboarding) through a real navigation call in the code, and no screen navigates to
 * a route that does not exist. Edges are read from the source with the TypeScript
 * compiler: nav.navigate / nav.replace / goTab calls inside each screen component,
 * including the components it renders (e.g. ChooseLocation → ScopePicker).
 */
import fs from 'fs';
import path from 'path';
import ts from 'typescript';

const ROOT = path.resolve(__dirname, '..');
// Read the registry as source (importing it would pull every screen into a non-UI test).
const REGISTRY = fs.readFileSync(path.join(ROOT, 'navigation', 'screens.ts'), 'utf8');
const FIGMA_SCREENS = [...REGISTRY.matchAll(/\{ n: (\d+), name: '([^']+)', node: '([^']+)', route: '([A-Za-z]+)', component: ([A-Za-z]+) \}/g)]
  .map(m => ({ n: Number(m[1]), name: m[2], node: m[3], route: m[4], component: { name: m[5] } }));
const listOf = (name: string) => [...(REGISTRY.match(new RegExp(`${name}[^=]*= \\[([^\\]]+)\\]`))?.[1] ?? '').matchAll(/'([A-Za-z]+)'/g)].map(m => m[1]);
const ONBOARDING_ROUTES = listOf('ONBOARDING_ROUTES');
const TAB_ROOT_ROUTES = listOf('TAB_ROOT_ROUTES');
const ROUTES = new Set(FIGMA_SCREENS.map(s => s.route as string));

function walkFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === '__tests__' ? [] : walkFiles(p);
    return /\.tsx?$/.test(e.name) ? [p] : [];
  });
}

interface Decl { name: string; targets: Set<string>; uses: Set<string> }

function analyse(file: string): Map<string, Decl> {
  const src = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const objectConsts = new Map<string, string[]>();
  const decls = new Map<string, Decl>();
  // Top-level `const X = { a: 'Route', ... }` lookup tables (FORM_ROUTE, LEGAL_ROUTE...).
  src.forEachChild(n => {
    if (ts.isVariableStatement(n)) for (const d of n.declarationList.declarations) {
      if (ts.isIdentifier(d.name) && d.initializer) {
        let init: ts.Expression = d.initializer;
        while (ts.isAsExpression(init) || ts.isParenthesizedExpression(init)) init = init.expression;
        if (ts.isObjectLiteralExpression(init)) {
          const vals: string[] = [];
          init.properties.forEach(p => { if (ts.isPropertyAssignment(p) && ts.isStringLiteral(p.initializer)) vals.push(p.initializer.text); });
          objectConsts.set(d.name.text, vals);
        }
      }
    }
  });
  const literalsIn = (e: ts.Node): string[] => {
    const out: string[] = [];
    const visit = (x: ts.Node) => {
      if (ts.isStringLiteral(x) || ts.isNoSubstitutionTemplateLiteral(x)) out.push(x.text);
      if (ts.isIdentifier(x) && objectConsts.has(x.text)) out.push(...objectConsts.get(x.text)!);
      x.forEachChild(visit);
    };
    visit(e);
    return out;
  };
  const collect = (name: string, body: ts.Node) => {
    const d: Decl = { name, targets: new Set(), uses: new Set() };
    const visit = (x: ts.Node) => {
      if (ts.isCallExpression(x)) {
        const callee = x.expression;
        const method = ts.isPropertyAccessExpression(callee) ? callee.name.text : ts.isIdentifier(callee) ? callee.text : '';
        if ((method === 'navigate' || method === 'replace') && x.arguments[0]) literalsIn(x.arguments[0]).forEach(r => d.targets.add(r));
        if (method === 'goTab' && x.arguments[1]) literalsIn(x.arguments[1]).forEach(r => d.targets.add(r));
        // Hooks / helpers declared in the same codebase (e.g. useFilePicker) carry navigation too.
        if (ts.isIdentifier(callee)) d.uses.add(callee.text);
      }
      if (ts.isJsxOpeningElement(x) || ts.isJsxSelfClosingElement(x)) d.uses.add(x.tagName.getText(src));
      x.forEachChild(visit);
    };
    visit(body);
    decls.set(name, d);
  };
  src.forEachChild(n => {
    if (ts.isVariableStatement(n)) for (const d of n.declarationList.declarations) {
      if (ts.isIdentifier(d.name) && d.initializer) collect(d.name.text, d.initializer);
    }
    if (ts.isFunctionDeclaration(n) && n.name) collect(n.name.text, n);
  });
  return decls;
}

const all = new Map<string, Decl>();
for (const f of walkFiles(path.join(ROOT, 'modules'))) for (const [k, v] of analyse(f)) if (!all.has(k)) all.set(k, v);
for (const f of walkFiles(path.join(ROOT, 'ui'))) for (const [k, v] of analyse(f)) if (!all.has(k)) all.set(k, v);

function targetsOf(component: string, seen = new Set<string>()): Set<string> {
  const out = new Set<string>();
  if (seen.has(component)) return out;
  seen.add(component);
  const d = all.get(component);
  if (!d) return out;
  d.targets.forEach(t => out.add(t));
  d.uses.forEach(u => targetsOf(u, seen).forEach(t => out.add(t)));
  return out;
}

const edges = new Map<string, Set<string>>();
for (const s of FIGMA_SCREENS) edges.set(s.route, new Set([...targetsOf(s.component.name)].filter(t => ROUTES.has(t) || t === 'Tabs')));

describe('route map', () => {
  it('reads the 71-screen registry', () => {
    expect(FIGMA_SCREENS).toHaveLength(71);
    expect(ONBOARDING_ROUTES).toEqual(['Welcome', 'HowItWorks', 'CameraPermission']);
    expect(TAB_ROOT_ROUTES).toEqual(['Home', 'Count', 'Products', 'Reorder', 'More']);
  });

  it('finds each screen component in the source', () => {
    const missing = FIGMA_SCREENS.filter(s => !all.has(s.component.name)).map(s => `${s.route} (${s.component.name})`);
    expect(missing).toEqual([]);
  });

  it('never navigates to an unknown route', () => {
    const unknown: string[] = [];
    for (const s of FIGMA_SCREENS) for (const t of targetsOf(s.component.name)) {
      if (!ROUTES.has(t) && t !== 'Tabs' && /^[A-Z][A-Za-z]+$/.test(t)) unknown.push(`${s.route} → ${t}`);
    }
    expect(unknown).toEqual([]);
  });

  it('every one of the 71 screens is reachable from the tab roots / onboarding', () => {
    const start = [...TAB_ROOT_ROUTES, ONBOARDING_ROUTES[0]] as string[];
    const seen = new Set<string>(start);
    const queue = [...start];
    while (queue.length) {
      const r = queue.shift()!;
      for (const t of edges.get(r) ?? []) if (ROUTES.has(t) && !seen.has(t)) { seen.add(t); queue.push(t); }
    }
    const unreachable = [...ROUTES].filter(r => !seen.has(r));
    expect(unreachable).toEqual([]);
    expect(seen.size).toBe(71);
  });

  it('onboarding is a chain: Welcome → How it works → Camera permission', () => {
    expect(edges.get('Welcome')!.has('HowItWorks')).toBe(true);
    expect(edges.get('HowItWorks')!.has('CameraPermission')).toBe(true);
  });

  it('core flow edges exist', () => {
    const must: [string, string][] = [
      ['Home', 'StartCount'], ['StartCount', 'CountSetup'], ['StartCount', 'ChooseCategory'], ['StartCount', 'ChooseSupplier'], ['StartCount', 'ChooseLocation'],
      ['StartCount', 'SelectProducts'], ['CountSetup', 'ScanCount'], ['CountSetup', 'ListCount'], ['ScanCount', 'Review'], ['ListCount', 'Review'],
      ['Review', 'Results'], ['Results', 'Reorder'], ['ScanCount', 'UnknownBarcode'], ['UnknownBarcode', 'CreateFromScan'], ['Products', 'ProductDetail'],
      ['ProductDetail', 'EditProduct'], ['ProductDetail', 'Barcodes'], ['ProductDetail', 'EditReorderTarget'], ['More', 'DataBackup'], ['DataBackup', 'CreateBackup'],
      ['DataBackup', 'RestoreFile'], ['RestoreFile', 'RestorePassword'], ['RestorePassword', 'RestorePreview'], ['RestorePreview', 'RestoreComplete'],
      ['More', 'Help'], ['More', 'About'], ['About', 'Privacy'], ['Pro', 'RestorePurchase'],
    ];
    const missing = must.filter(([a, b]) => !edges.get(a)?.has(b)).map(([a, b]) => `${a} → ${b}`);
    expect(missing).toEqual([]);
  });
});
