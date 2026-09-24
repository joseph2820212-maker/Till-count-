/**
 * keys.ts — every AsyncStorage key TillCount owns (handoff §7). All operational data
 * lives under the `tillcount:` namespace; nothing is shared with TillCalc or any other
 * Till-family app.
 */
export const SCHEMA_VERSION = 1;

export const KEYS = {
  schemaVersion: 'tillcount:schemaVersion',
  products: 'tillcount:products:v1',
  categories: 'tillcount:categories:v1',
  suppliers: 'tillcount:suppliers:v1',
  locations: 'tillcount:locations:v1',
  /** Session headers (no entries). */
  countSessions: 'tillcount:countSessions:v1',
  countSnapshots: 'tillcount:countSnapshots:v1',
  favourites: 'tillcount:favourites:v1',
  settings: 'tillcount:settings:v1',
  onboarding: 'tillcount:onboarding:v1',
  currency: 'tillcount:currency:v1',
} as const;

/** Entries of one count session (a chunked collection). */
export function countEntriesKey(sessionId: string): string {
  return `tillcount:countEntries:${sessionId}:v1`;
}

export const COUNT_ENTRIES_PREFIX = 'tillcount:countEntries:';

/** Device-local keys: never backed up, never restored. */
export const DEVICE_LOCAL_KEYS = {
  language: 'tillcount:device:language',
  languageTransition: 'tillcount:device:languageTransition',
  lastBackupAt: 'tillcount:device:lastBackupAt',
  restoreJournal: 'tillcount:device:restoreJournal',
  errorLog: 'tillcount:device:errorLog',
} as const;
