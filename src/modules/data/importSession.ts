/**
 * importSession.ts — the one in-progress import, held in memory between the mapping,
 * review and complete screens (navigation params must stay small). Nothing here is
 * persisted: leaving the flow or a cold start simply drops it, and no catalogue data
 * changes until the user confirms on Import review.
 */
import type { ImportSource } from '../../navigation/types';
import type { ImportRow, Mapping } from './productImport';

export interface ImportSessionState {
  source: ImportSource;
  fileName: string;
  /** CSV only: the raw table (header row first) and the column mapping. */
  table?: string[][];
  mapping?: Mapping;
  tillCalc?: boolean;
  /** Parsed rows (transfer files arrive already parsed). */
  rows?: ImportRow[];
  /** Rows that needed attention in the last import (Import complete → Skipped rows). */
  skipped?: ImportRow[];
}

let current: ImportSessionState | null = null;

export function setImportSession(s: ImportSessionState | null): void { current = s; }
export function getImportSession(): ImportSessionState | null { return current; }
export function patchImportSession(p: Partial<ImportSessionState>): void { if (current) current = { ...current, ...p }; }
