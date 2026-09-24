/**
 * selectors.ts — memoised read models for screens. Each hook recomputes only when its
 * inputs change, so lists of thousands of products never rebuild inside render loops.
 */
import { useMemo } from 'react';
import { groupBySupplier, reorderLines, reorderSummary, needsReorder, type ReorderLine } from '../domain/reorderEngine';
import { progressOf } from '../domain/countEngine';
import type { Product } from '../domain/types';
import { useAppState, type AppState } from './store';

export function useProducts(): Product[] {
  return useAppState(s => s.products);
}

export function useActiveProducts(): Product[] {
  const products = useProducts();
  return useMemo(() => products.filter(p => p.status === 'active'), [products]);
}

export function useReorder(): { lines: ReorderLine[]; attention: ReorderLine[]; summary: ReturnType<typeof reorderSummary> } {
  const products = useAppState(s => s.products);
  const snapshots = useAppState(s => s.snapshots);
  return useMemo(() => {
    const lines = reorderLines(products, snapshots);
    return { lines, attention: lines.filter(l => needsReorder(l)), summary: reorderSummary(lines) };
  }, [products, snapshots]);
}

export function useReorderGroups(lines: ReorderLine[]) {
  const lookups = useAppState(s => s.lookups);
  return useMemo(() => groupBySupplier(lines, lookups.suppliers), [lines, lookups]);
}

export function useOpenProgress() {
  const open = useAppState(s => s.openSession);
  return useMemo(() => (open ? { session: open, ...progressOf(open) } : null), [open]);
}

/** Active product count per category / supplier / location id. */
export function useMembershipCounts(): { category: Map<string, number>; supplier: Map<string, number>; location: Map<string, number>; noSupplier: number } {
  const index = useAppState(s => s.index);
  return useMemo(() => {
    const count = (m: Map<string, string[]>) => new Map([...m.entries()].map(([k, v]) => [k, v.length]));
    const withSupplier = [...index.bySupplier.values()].reduce((n, l) => n + l.length, 0);
    return { category: count(index.byCategory), supplier: count(index.bySupplier), location: count(index.byLocation), noSupplier: index.activeIds.length - withSupplier };
  }, [index]);
}

/** Most recently counted products (latest completed snapshots), newest first. */
export function useRecentlyCounted(limit = 2) {
  const snapshots = useAppState(s => s.snapshots);
  const index = useAppState(s => s.index);
  return useMemo(() => Object.values(snapshots)
    .filter(s => index.byId.get(s.productId)?.status === 'active')
    .sort((a, b) => (b.countedAt > a.countedAt ? 1 : b.countedAt < a.countedAt ? -1 : 0))
    .slice(0, limit)
    .map(s => ({ snapshot: s, product: index.byId.get(s.productId)! })), [snapshots, index, limit]);
}

export function useCompletedSessions() {
  const sessions = useAppState(s => s.sessions);
  return useMemo(() => sessions.filter(s => s.status === 'completed'), [sessions]);
}

/** Active categories / suppliers / locations, memoised (a filtering selector would re-render forever). */
export function useActiveNamed<K extends 'categories' | 'suppliers' | 'locations'>(kind: K): AppState[K] {
  const list = useAppState(s => s[kind]);
  return useMemo(() => list.filter(r => r.status === 'active') as AppState[K], [list]);
}
