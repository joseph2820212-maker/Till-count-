/**
 * restoreSession.ts — the restore in progress (Restore file → password → preview →
 * complete), in memory only. The decrypted, validated data lives here until the user
 * confirms; it is dropped as soon as the flow ends. Nothing is written before confirm.
 */
import type { BackupInspection, StagedRestore } from './backupFile';

let inspection: BackupInspection | null = null;
let staged: StagedRestore | null = null;

export function setInspection(i: BackupInspection | null): void { inspection = i; staged = null; }
export function getInspection(): BackupInspection | null { return inspection; }
export function setStaged(s: StagedRestore | null): void { staged = s; }
export function getStaged(): StagedRestore | null { return staged; }
export function clearRestoreSession(): void { inspection = null; staged = null; }
