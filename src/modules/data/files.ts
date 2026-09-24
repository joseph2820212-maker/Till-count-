/**
 * files.ts — every file TillCount reads or writes goes through here (handoff §24 Files):
 * bounded size, content read as text only, safe generated file names (no path
 * traversal, no business detail), temporary exports in the cache directory and pruned.
 * Nothing leaves the device unless the user shares it from the system share sheet.
 */
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { toCsv } from '../../utils/csv';
import { printHtmlToPdfFile, pruneTemporaryPreviewPdfs } from '../../utils/pdfFile';

export class FileTooLargeError extends Error { constructor() { super('tooLarge'); this.name = 'FileTooLargeError'; } }
export class FileReadError extends Error { constructor() { super('readFailed'); this.name = 'FileReadError'; } }
export class ShareUnavailableError extends Error { constructor() { super('shareUnavailable'); this.name = 'ShareUnavailableError'; } }

const EXPORT_DIR = 'tillcount-exports';

/** Letters, digits, dot, dash, underscore only; no leading dots; bounded length. */
export function safeFileName(name: string, fallbackExt: string): string {
  const cleaned = String(name ?? '').replace(/[/\\]+/g, '_').replace(/\.{2,}/g, '_').replace(/[^A-Za-z0-9._-]/g, '_').replace(/^\.+/, '').slice(0, 100);
  if (!cleaned) return `TillCount_${Date.now()}.${fallbackExt}`;
  return cleaned.toLowerCase().endsWith(`.${fallbackExt}`) ? cleaned : `${cleaned}.${fallbackExt}`;
}

export interface PickedText { name: string; uri: string; size: number | null; text: string }

/** Pick one file and read it as UTF-8 text, refusing anything over `maxBytes`. */
export async function pickTextFile(maxBytes: number, types: string[] = ['*/*']): Promise<PickedText | null> {
  const res = await DocumentPicker.getDocumentAsync({ type: types, copyToCacheDirectory: true, multiple: false });
  if (res.canceled || !res.assets?.length) return null;
  const asset = res.assets[0];
  if (asset.size != null && asset.size > maxBytes) throw new FileTooLargeError();
  try {
    const info = await FileSystem.getInfoAsync(asset.uri);
    const size = info.exists && typeof (info as { size?: number }).size === 'number' ? (info as { size: number }).size : null;
    if (size !== null && size > maxBytes) throw new FileTooLargeError();
    const text = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.UTF8 });
    if (typeof text !== 'string') throw new FileReadError();
    if (text.length > maxBytes) throw new FileTooLargeError();
    return { name: asset.name ?? 'file', uri: asset.uri, size, text };
  } catch (e) {
    if (e instanceof FileTooLargeError) throw e;
    throw new FileReadError();
  }
}

async function exportDir(): Promise<string> {
  const base = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
  if (!base) throw new FileReadError();
  const dir = `${base.replace(/\/$/, '')}/${EXPORT_DIR}/`;
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  return dir;
}

/** Write a temporary export (cache directory, never a synced documents folder). */
export async function writeExport(fileName: string, content: string, ext: string): Promise<string> {
  const uri = `${await exportDir()}${safeFileName(fileName, ext)}`;
  await FileSystem.writeAsStringAsync(uri, content, { encoding: FileSystem.EncodingType.UTF8 });
  return uri;
}

export async function shareUri(uri: string, mimeType: string, dialogTitle?: string): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) throw new ShareUnavailableError();
  await Sharing.shareAsync(uri, { mimeType, dialogTitle });
}

const BOM = String.fromCharCode(0xfeff);

export async function exportCsv(fileName: string, rows: (string | number | null | undefined)[][], dialogTitle?: string): Promise<string> {
  const uri = await writeExport(fileName, BOM + toCsv(rows), 'csv');
  await shareUri(uri, 'text/csv', dialogTitle);
  return uri;
}

export const A4 = { width: 595, height: 842 } as const;

export async function exportPdf(fileName: string, html: string, dialogTitle?: string): Promise<string> {
  const uri = await printHtmlToPdfFile(html, safeFileName(fileName, 'pdf'), A4, { temporary: true });
  await shareUri(uri, 'application/pdf', dialogTitle);
  void pruneTemporaryPreviewPdfs(24 * 60 * 60 * 1000, 6, [uri]);
  return uri;
}

/** Remove exports older than a day (called at start-up; best effort). */
export async function pruneExports(maxAgeMs = 24 * 60 * 60 * 1000): Promise<void> {
  try {
    const dir = await exportDir();
    const names = await FileSystem.readDirectoryAsync(dir);
    const now = Date.now();
    await Promise.all(names.map(async n => {
      const info = await FileSystem.getInfoAsync(dir + n);
      const mtime = info.exists ? ((info as { modificationTime?: number }).modificationTime ?? 0) * 1000 : 0;
      if (!mtime || now - mtime > maxAgeMs) await FileSystem.deleteAsync(dir + n, { idempotent: true });
    }));
  } catch { /* best effort */ }
  await pruneTemporaryPreviewPdfs().catch(() => undefined);
}
