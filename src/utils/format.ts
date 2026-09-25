/**
 * format.ts — display formatting for quantities, units, dates and money. Figures use
 * Western digits in every language (donor F09.4) and stay LTR inside RTL text.
 */
import i18n from '../i18n';
import { groupNumber, localDate, localTime } from './locale';
import { formatAmount } from './currency';
import type { CountUnit, DateFormat } from '../domain/types';
import { isMeasuredUnit, MEASURED_DECIMALS } from '../domain/quantity';

/** Left-to-right mark: keeps a number/code readable inside Arabic text. */
export const LRM = '‎';

/**
 * The " · " separator for lines built in code. In Arabic it opens with a RIGHT-TO-LEFT
 * MARK, so a Latin name before it ("Fridge · 6 منتجات") ends its run there and the parts
 * read right-to-left in order.
 */
export function dot(): string {
  return i18n.language === 'ar' ? '\u200F · ' : ' · ';
}

export function ltr(s: string): string {
  return i18n.language === 'ar' ? `${LRM}${s}${LRM}` : s;
}

export function formatQty(q: number | null | undefined, unit: CountUnit = 'each'): string {
  if (q === null || q === undefined || !Number.isFinite(q)) return '—';
  return ltr(groupNumber(q, 0, isMeasuredUnit(unit) ? MEASURED_DECIMALS : 0));
}

export function unitLabel(unit: CountUnit): string {
  return i18n.t(`units.${unit}`);
}

export function formatQtyWithUnit(q: number | null | undefined, unit: CountUnit): string {
  if (q === null || q === undefined || !Number.isFinite(q)) return '—';
  return unit === 'each' ? formatQty(q, unit) : `${formatQty(q, unit)} ${unitLabel(unit)}`;
}

export function formatInt(n: number): string {
  return ltr(groupNumber(n, 0, 0));
}

export function formatMoney(v: number | null | undefined): string {
  return ltr(formatAmount(v ?? 0));
}

let dateFormat: DateFormat = 'dmy';
export function setDateFormat(f: DateFormat): void { dateFormat = f; }

const pad = (n: number) => String(n).padStart(2, '0');

/** A short date in a given order ("24 Sep 2026", "Sep 24, 2026", "2026-09-24"), in the app language. */
export function formatDateAs(format: DateFormat, iso: string | undefined | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  if (format === 'ymd') return ltr(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
  if (format === 'mdy') {
    const month = localDate(d, { month: 'short' });
    return `${month} ${d.getDate()}, ${d.getFullYear()}`;
  }
  return localDate(d, { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Short date in the user's chosen order. */
export function formatDate(iso: string | undefined | null): string {
  return formatDateAs(dateFormat, iso);
}

export function formatDayMonth(iso: string | undefined | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return localDate(d, { day: 'numeric', month: 'short' });
}

export function formatTime(iso: string | undefined | null): string {
  if (!iso) return '—';
  return localTime(iso);
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** "today", "yesterday" or a short date. */
export function relativeDay(iso: string | undefined | null, now = new Date()): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  if (sameDay(d, now)) return i18n.t('common.today');
  const y = new Date(now); y.setDate(now.getDate() - 1);
  if (sameDay(d, y)) return i18n.t('common.yesterday');
  return formatDayMonth(iso);
}

export function weekdayShort(iso: string | undefined | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  if (sameDay(d, new Date())) return i18n.t('common.today');
  return localDate(d, { weekday: 'short' });
}
